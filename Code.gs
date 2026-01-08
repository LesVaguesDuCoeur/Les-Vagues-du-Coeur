// ==========================================
// WAHTSHAPPEN - GOOGLE APPS SCRIPT WEB APP
// ==========================================
// Architecture: Single Page App (SPA) served via doGet
// Database: Google Drive (Docs as DB)
// Security: AES-256 Encryption (Server-Side)
// ==========================================

// --- CONSTANTS ---
const FOLDER_ID = "1IN2pSIhjV_3Fn-B_WLMUgNFcQdLOjbYr"; // WhatsHappen Folder
const ADMIN_EMAIL = "chaouiengage@gmail.com";
const ADMIN_CODE_HASH = "15112000"; // Stored as plain string for this logic, hashed in real world or checked directly
const SECRET_KEY = "ChaouiSecretKeyV2_AES"; // Change this!
const USERS_DB_FILENAME = "Users.db";

// --- WEB APP SERVING ---

function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('WhatsHappen')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// --- PUBLIC API (CALLED FROM CLIENT) ---

function apiLogin(email, code) {
  try {
    const db = readUsersDb();
    const user = db.users.find(u => u.email === email.toLowerCase().trim());
    if (!user) throw new Error("Utilisateur inconnu. Inscrivez-vous.");

    // Check code (Simple check for now, can be hashed)
    // The prompt implies a static code for admin, but user codes?
    // "s'identifier il faut mettre son mail et son prénom 1 seul fois apres sa sera stocker"
    // This implies auto-login or a simple check.
    // Let's assume the 'code' passed here is the one they registered with or a password?
    // The prompt says: "Login : Email + Prénom (stocké une seule fois...)"
    // It doesn't explicitly mention a password for users, only for Admin.
    // However, the previous V1 used a 3-digit code.
    // Let's assume for standard users, "Prénom" acts as a simplified check or we just trust the inputs for this MVP if not specified.
    // BUT, the prompt says "Admin Super-User... Le mot de passe... connu".
    // Let's implement: Registration takes a Code. Login requires that Code.

    if (user.code !== code.toString()) throw new Error("Code incorrect.");

    // Token generation
    const token = Utilities.getUuid();
    user.token = token; // Single session for simplicity
    writeUsersDb(db);

    return { success: true, token: token, user: sanitizeUser(user) };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function apiRegister(email, firstName, code) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // 15s timeout

    const db = readUsersDb();
    const cleanEmail = email.toLowerCase().trim();
    if (db.users.find(u => u.email === cleanEmail)) throw new Error("Email déjà enregistré.");

    // Admin Check
    let isAdmin = false;
    let canCreate = false;

    if (cleanEmail === ADMIN_EMAIL && code.toString() === ADMIN_CODE_HASH) {
      isAdmin = true;
      canCreate = true; // Admin can always create
    }

    const newUser = {
      email: cleanEmail,
      firstName: firstName,
      code: code.toString(),
      isAdmin: isAdmin,
      canCreate: canCreate,
      activeChats: [],
      registeredAt: new Date().toISOString()
    };

    db.users.push(newUser);

    const token = Utilities.getUuid();
    newUser.token = token;
    writeUsersDb(db); // Save token

    return { success: true, token: token, user: sanitizeUser(newUser) };
  } catch (e) {
    return { success: false, error: e.message };
  } finally {
    lock.releaseLock();
  }
}

function apiGetState(token, email) {
  try {
    const user = validateUser(token, email);
    const chats = getChatsForUser(user);
    return { success: true, chats: chats, user: sanitizeUser(user) }; // Refresh user rights
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function apiCreateChat(token, email, participants, durationStr) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    const db = readUsersDb(); // Re-read inside lock
    const user = db.users.find(u => u.email === email && u.token === token);
    if (!user) throw new Error("Session invalide.");
    if (!user.canCreate) throw new Error("Vous n'avez pas les droits pour créer une conversation.");

    const validEmails = [user.email];
    const validNames = [user.firstName];

    participants.forEach(pEmail => {
      const p = db.users.find(u => u.email === pEmail.trim().toLowerCase());
      if (p) {
        validEmails.push(p.email);
        validNames.push(p.firstName);
      }
    });

    if (validEmails.length < 2) throw new Error("Il faut au moins 1 destinataire valide.");

    let expiresAt = null;
    if (durationStr !== 'unlimited') {
      const now = new Date();
      let mins = 0;
      if (durationStr === '10min') mins = 10;
      if (durationStr === '12h') mins = 12 * 60;
      if (durationStr === '24h') mins = 24 * 60;
      if (durationStr === '48h') mins = 48 * 60;
      if (mins > 0) expiresAt = new Date(now.getTime() + mins * 60000).toISOString();
    }

    const root = DriveApp.getFolderById(FOLDER_ID);
    const docName = `CHAT_${new Date().getTime()}_${Utilities.getUuid()}`;
    const doc = DocumentApp.create(docName);
    const file = DriveApp.getFileById(doc.getId());
    file.moveTo(root);

    const chatData = {
      id: doc.getId(),
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt,
      participants: validEmails,
      participantNames: validNames,
      messages: []
    };

    doc.getBody().setText(encrypt(JSON.stringify(chatData)));
    doc.saveAndClose();

    // Indexing
    validEmails.forEach(pEmail => {
      const uRecord = db.users.find(u => u.email === pEmail);
      if (uRecord) {
        if (!uRecord.activeChats) uRecord.activeChats = [];
        uRecord.activeChats.push(doc.getId());
      }
    });
    writeUsersDb(db);

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  } finally {
    lock.releaseLock();
  }
}

function apiSendMessage(token, email, chatId, content, type) {
  try {
    const user = validateUser(token, email);
    const doc = DocumentApp.openById(chatId);
    const body = doc.getBody();

    // Verify Access (Read Meta)
    const metaEnc = body.getParagraphs()[0].getText();
    const meta = JSON.parse(decrypt(metaEnc));
    if (!meta.participants.includes(email)) throw new Error("Accès refusé.");

    const msg = {
      id: Utilities.getUuid(),
      sender: email,
      senderName: user.firstName,
      content: content, // Base64 if image/file
      type: type || 'text',
      timestamp: new Date().toISOString()
    };

    const msgEnc = encrypt(JSON.stringify(msg));
    body.appendParagraph(msgEnc);
    doc.saveAndClose();

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function apiGetMessages(token, email, chatId) {
  try {
    const user = validateUser(token, email);
    const doc = DocumentApp.openById(chatId);
    const body = doc.getBody();
    const paras = body.getParagraphs();

    const metaEnc = paras[0].getText();
    const meta = JSON.parse(decrypt(metaEnc));

    if (!meta.participants.includes(email)) throw new Error("Accès refusé.");

    const messages = [];
    for (let i = 1; i < paras.length; i++) {
      const txt = paras[i].getText();
      if (!txt) continue;
      try {
        const m = JSON.parse(decrypt(txt));
        messages.push(m);
      } catch (e) { /* skip corrupt */ }
    }

    return { success: true, messages: messages, meta: meta };
  } catch (e) {
    return { success: false, error: "Chat inaccessible or deleted." };
  }
}

// --- ADMIN API ---

function apiAdminGetUsers(token, email) {
  try {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only.");
    const db = readUsersDb();
    // Sanitize for display
    const list = db.users.map(u => ({
      email: u.email,
      firstName: u.firstName,
      canCreate: u.canCreate,
      registeredAt: u.registeredAt
    }));
    return { success: true, users: list };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function apiAdminUpdateUser(token, email, targetEmail, canCreate) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only.");

    const db = readUsersDb();
    const target = db.users.find(u => u.email === targetEmail);
    if (!target) throw new Error("User not found.");

    target.canCreate = canCreate;
    writeUsersDb(db);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  } finally {
    lock.releaseLock();
  }
}

function apiAdminDeleteUser(token, email, targetEmail) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only.");

    if (email === targetEmail) throw new Error("Impossible de se supprimer soi-même.");

    const db = readUsersDb();
    const initialLen = db.users.length;
    db.users = db.users.filter(u => u.email !== targetEmail);

    if (db.users.length === initialLen) throw new Error("User not found.");

    writeUsersDb(db);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  } finally {
    lock.releaseLock();
  }
}

function apiAdminResetPassword(token, email, targetEmail) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only.");

    const db = readUsersDb();
    const target = db.users.find(u => u.email === targetEmail);
    if (!target) throw new Error("User not found.");

    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    target.code = newCode;
    // In a real app we'd email this. Here we return it to Admin to tell the user.

    writeUsersDb(db);
    return { success: true, newCode: newCode };
  } catch (e) {
    return { success: false, error: e.message };
  } finally {
    lock.releaseLock();
  }
}

// --- DB & HELPER FUNCTIONS ---

function getFolder() {
  return DriveApp.getFolderById(FOLDER_ID);
}

function getUsersDbFile() {
  const folder = getFolder();
  const files = folder.getFilesByName(USERS_DB_FILENAME);
  if (files.hasNext()) return files.next();

  // Initialize
  const initial = { users: [] };
  const enc = encrypt(JSON.stringify(initial));
  return folder.createFile(USERS_DB_FILENAME, enc, MimeType.PLAIN_TEXT);
}

function readUsersDb() {
  const file = getUsersDbFile();
  const content = file.getBlob().getDataAsString();
  try {
    const json = decrypt(content);
    return JSON.parse(json);
  } catch (e) {
    // If decrypt fails, the DB is corrupt or old version.
    // We should throw or return empty?
    // Throwing ensures we don't overwrite with empty.
    throw new Error("Erreur base de données (Cryptage invalide). Reset requis?");
  }
}

function writeUsersDb(data) {
  const file = getUsersDbFile();
  file.setContent(encrypt(JSON.stringify(data)));
}

function validateUser(token, email) {
  const db = readUsersDb();
  const user = db.users.find(u => u.email === email);
  if (!user || user.token !== token) throw new Error("Session invalide.");
  return user;
}

function sanitizeUser(u) {
  return {
    firstName: u.firstName,
    email: u.email,
    isAdmin: u.isAdmin,
    canCreate: u.canCreate
  };
}

function getChatsForUser(userRecord) {
  const activeIds = userRecord.activeChats || [];
  const results = [];
  const validIds = [];

  // Reverse to show newest first? Or assume list is chronological.
  // We'll process all.

  activeIds.forEach(id => {
    try {
      const doc = DocumentApp.openById(id);
      const txt = doc.getBody().getParagraphs()[0].getText();
      const meta = JSON.parse(decrypt(txt));

      // Check expiry
      if (meta.expiresAt && new Date() > new Date(meta.expiresAt)) {
        // Expired
        doc.setTrashed(true);
        return;
      }

      results.push({
        id: meta.id,
        names: meta.participantNames,
        expiresAt: meta.expiresAt
      });
      validIds.push(id);
    } catch (e) {
      // Chat deleted or inaccessible
    }
  });

  // Update DB if we pruned
  if (validIds.length !== activeIds.length) {
    const db = readUsersDb();
    const u = db.users.find(x => x.email === userRecord.email);
    if(u) {
      u.activeChats = validIds;
      writeUsersDb(db);
    }
  }

  return results;
}


// --- CRYPTO (AES) ---
// Using CryptoJS library (Must be added to project)

function encrypt(text) {
  if (typeof CryptoJS === 'undefined') throw new Error("CryptoJS missing");
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

function decrypt(cipher) {
  if (typeof CryptoJS === 'undefined') throw new Error("CryptoJS missing");
  const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// --- TRIGGERS ---

function setupTrigger() {
  // Run this once manually
  ScriptApp.newTrigger('cleanUpExpiredChats')
    .timeBased()
    .everyMinutes(10) // or every hour
    .create();
}

function cleanUpExpiredChats() {
  const folder = getFolder();
  const files = folder.getFiles();
  const now = new Date();

  while (files.hasNext()) {
    const file = files.next();
    if (file.getName() === USERS_DB_FILENAME) continue;

    try {
      const doc = DocumentApp.openById(file.getId());
      const txt = doc.getBody().getParagraphs()[0].getText();
      const meta = JSON.parse(decrypt(txt));

      if (meta.expiresAt && now > new Date(meta.expiresAt)) {
        file.setTrashed(true);
      }
    } catch (e) {
      // Ignore
    }
  }
}

function resetDatabase() {
  // UTILITY: Call this if everything is broken due to encryption change
  const folder = getFolder();
  const files = folder.getFilesByName(USERS_DB_FILENAME);
  while(files.hasNext()) {
    files.next().setTrashed(true);
  }
  // Also trash all chats? maybe safer to just reset user db
  return "Database Reset. Refresh app to re-register.";
}

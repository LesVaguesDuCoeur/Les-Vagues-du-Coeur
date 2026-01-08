// ==========================================
// WAHTSHAPPEN - BACKEND API (Google Apps Script)
// ==========================================
// Architecture: Hybrid (Netlify Frontend <-> GAS API)
// Database: Google Drive (Docs as DB)
// Security: Native Encryption (No external libraries)
// ==========================================

// --- CONSTANTS ---
const FOLDER_ID = "1IN2pSIhjV_3Fn-B_WLMUgNFcQdLOjbYr";
const ADMIN_EMAIL = "chaouiengage@gmail.com";
const ADMIN_CODE_HASH = "15112000";
const SECRET_KEY = "ChaouiSecretKeyV2_Native";
const USERS_DB_FILENAME = "Users.db";

// --- API HANDLER ---

function doGet(e) {
  return createJSONOutput({ status: "Online", message: "Use POST requests." });
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    if (!e.postData || !e.postData.contents) throw new Error("No data");
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    let result = {};

    switch (action) {
      // AUTH
      case 'login':
        result = apiLogin(request.email, request.code);
        break;
      case 'changePassword':
        result = apiChangePassword(request.email, request.oldCode, request.newCode);
        break;
      case 'register':
        result = apiRegister(request.email, request.firstName, request.code);
        break;
      case 'getState':
        result = apiGetState(request.token, request.email);
        break;

      // CHAT
      case 'createChat':
        result = apiCreateChat(request.token, request.email, request.participants, request.duration);
        break;
      case 'sendMessage':
        result = apiSendMessage(request.token, request.email, request.chatId, request.content, request.type);
        break;
      case 'getMessages':
        result = apiGetMessages(request.token, request.email, request.chatId);
        break;
      case 'addParticipant':
        result = apiAddParticipant(request.token, request.email, request.chatId, request.targetEmail);
        break;

      // ADMIN
      case 'adminGetUsers':
        result = apiAdminGetUsers(request.token, request.email);
        break;
      case 'adminUpdateUser':
        result = apiAdminUpdateUser(request.token, request.email, request.targetEmail, request.canCreate, request.isAdmin);
        break;
      case 'adminDeleteUser':
        result = apiAdminDeleteUser(request.token, request.email, request.targetEmail);
        break;
      case 'adminResetPassword':
        result = apiAdminResetPassword(request.token, request.email, request.targetEmail);
        break;

      default:
        throw new Error("Unknown action");
    }

    return createJSONOutput(result);

  } catch (err) {
    return createJSONOutput({ success: false, error: err.message });
  }
}

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- CORE LOGIC ---

function apiLogin(email, code) {
  const db = readUsersDb();
  const user = db.users.find(u => u.email === email.toLowerCase().trim());
  if (!user) throw new Error("Utilisateur inconnu.");

  // Check Password
  if (user.code !== code.toString()) throw new Error("Code incorrect.");

  // Check Temporary Password
  if (user.mustChangePassword) {
    return { success: true, requireNewPassword: true };
  }

  const token = Utilities.getUuid();
  user.token = token;
  writeUsersDb(db);

  return { success: true, token: token, user: sanitizeUser(user) };
}

function apiChangePassword(email, oldCode, newCode) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const db = readUsersDb();
    const user = db.users.find(u => u.email === email.toLowerCase().trim());
    if (!user) throw new Error("Utilisateur inconnu.");

    if (user.code !== oldCode.toString()) throw new Error("Ancien code incorrect.");

    user.code = newCode.toString();
    user.mustChangePassword = false;

    const token = Utilities.getUuid();
    user.token = token;
    writeUsersDb(db);

    return { success: true, token: token, user: sanitizeUser(user) };
  } finally {
    lock.releaseLock();
  }
}

function apiRegister(email, firstName, code) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const db = readUsersDb();
    const cleanEmail = email.toLowerCase().trim();
    if (db.users.find(u => u.email === cleanEmail)) throw new Error("Email déjà enregistré.");

    let isAdmin = false;
    let canCreate = false;
    // Super Admin Hardcoded Logic
    if (cleanEmail === ADMIN_EMAIL && code.toString() === ADMIN_CODE_HASH) {
      isAdmin = true;
      canCreate = true;
    }

    const newUser = {
      email: cleanEmail,
      firstName: firstName,
      code: code.toString(),
      isAdmin: isAdmin,
      canCreate: canCreate,
      activeChats: [],
      registeredAt: new Date().toISOString(),
      mustChangePassword: false
    };

    db.users.push(newUser);
    const token = Utilities.getUuid();
    newUser.token = token;
    writeUsersDb(db);

    return { success: true, token: token, user: sanitizeUser(newUser) };
  } finally {
    lock.releaseLock();
  }
}

function apiGetState(token, email) {
  const user = validateUser(token, email);
  const chats = getChatsForUser(user);
  return { success: true, chats: chats, user: sanitizeUser(user) };
}

function apiCreateChat(token, email, participants, durationStr) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const db = readUsersDb();
    const user = db.users.find(u => u.email === email && u.token === token);
    if (!user) throw new Error("Session invalide");
    if (!user.canCreate && !user.isAdmin) throw new Error("Droit refusé");

    const validEmails = [user.email];
    const validNames = [user.firstName];

    participants.forEach(pEmail => {
      const p = db.users.find(u => u.email === pEmail.trim().toLowerCase());
      if (p) {
        validEmails.push(p.email);
        validNames.push(p.firstName);
      }
    });

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

    validEmails.forEach(pEmail => {
      const uRecord = db.users.find(u => u.email === pEmail);
      if (uRecord) {
        if (!uRecord.activeChats) uRecord.activeChats = [];
        uRecord.activeChats.push(doc.getId());
      }
    });
    writeUsersDb(db);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function apiSendMessage(token, email, chatId, content, type) {
  const user = validateUser(token, email);
  const doc = DocumentApp.openById(chatId);
  const body = doc.getBody();

  const metaEnc = body.getParagraphs()[0].getText();
  const meta = JSON.parse(decrypt(metaEnc));
  if (!meta.participants.includes(email)) throw new Error("Accès refusé");

  const msg = {
    id: Utilities.getUuid(),
    sender: email,
    senderName: user.firstName,
    content: content,
    type: type || 'text',
    timestamp: new Date().toISOString()
  };

  const msgEnc = encrypt(JSON.stringify(msg));
  body.appendParagraph(msgEnc);
  doc.saveAndClose();
  return { success: true };
}

function apiGetMessages(token, email, chatId) {
  const user = validateUser(token, email);
  const doc = DocumentApp.openById(chatId);
  const body = doc.getBody();
  const paras = body.getParagraphs();

  const metaEnc = paras[0].getText();
  const meta = JSON.parse(decrypt(metaEnc));
  if (!meta.participants.includes(email)) throw new Error("Accès refusé");

  const messages = [];
  for (let i = 1; i < paras.length; i++) {
    const txt = paras[i].getText();
    if (!txt) continue;
    try {
      messages.push(JSON.parse(decrypt(txt)));
    } catch (e) {}
  }
  return { success: true, messages: messages, meta: meta };
}

function apiAddParticipant(token, email, chatId, targetEmail) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const user = validateUser(token, email);
    // Security: Only Admin or CanCreate can add people
    if (!user.isAdmin && !user.canCreate) throw new Error("Droit refusé: Seuls les créateurs peuvent ajouter.");

    const db = readUsersDb();
    const target = db.users.find(u => u.email === targetEmail.toLowerCase().trim());
    if (!target) throw new Error("Utilisateur introuvable.");

    const doc = DocumentApp.openById(chatId);
    const body = doc.getBody();
    const metaEnc = body.getParagraphs()[0].getText();
    const meta = JSON.parse(decrypt(metaEnc));

    if (!meta.participants.includes(user.email)) throw new Error("Accès refusé.");
    if (meta.participants.includes(target.email)) throw new Error("Déjà participant.");

    meta.participants.push(target.email);
    meta.participantNames.push(target.firstName);

    // Update Meta
    body.getParagraphs()[0].setText(encrypt(JSON.stringify(meta)));
    doc.saveAndClose();

    // Indexing
    if (!target.activeChats) target.activeChats = [];
    target.activeChats.push(chatId);
    writeUsersDb(db);

    // System Msg
    apiSendMessage(token, email, chatId, `a ajouté ${target.firstName}`, 'system');

    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

// --- ADMIN ---

function apiAdminGetUsers(token, email) {
  const user = validateUser(token, email);
  if (!user.isAdmin) throw new Error("Admin only");
  const db = readUsersDb();
  return { success: true, users: db.users.map(u => ({
    email: u.email,
    firstName: u.firstName,
    canCreate: u.canCreate,
    isAdmin: u.isAdmin,
    registeredAt: u.registeredAt
  })) };
}

function apiAdminUpdateUser(token, email, targetEmail, canCreate, makeAdmin) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");

    const db = readUsersDb();
    const t = db.users.find(u => u.email === targetEmail);
    if (!t) throw new Error("User not found");

    // Protection: Cannot remove Super Admin rights
    if (t.email === ADMIN_EMAIL) {
       t.isAdmin = true;
       t.canCreate = true;
    } else {
       if (makeAdmin !== undefined) t.isAdmin = makeAdmin;
       if (canCreate !== undefined) t.canCreate = canCreate;
    }

    writeUsersDb(db);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function apiAdminDeleteUser(token, email, targetEmail) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");
    if (email === targetEmail) throw new Error("Impossible de se supprimer soi-même.");
    if (targetEmail === ADMIN_EMAIL) throw new Error("Impossible de supprimer le Super Admin.");

    const db = readUsersDb();
    db.users = db.users.filter(u => u.email !== targetEmail);
    writeUsersDb(db);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function apiAdminResetPassword(token, email, targetEmail) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");
    const db = readUsersDb();
    const t = db.users.find(u => u.email === targetEmail);
    if (!t) throw new Error("User not found");

    const tempCode = Math.floor(1000 + Math.random() * 9000).toString();
    t.code = tempCode;
    t.mustChangePassword = true; // FORCE CHANGE

    writeUsersDb(db);
    return { success: true, newCode: tempCode };
  } finally {
    lock.releaseLock();
  }
}

// --- HELPERS ---

function getFolder() { return DriveApp.getFolderById(FOLDER_ID); }

function getUsersDbFile() {
  const folder = getFolder();
  const files = folder.getFilesByName(USERS_DB_FILENAME);
  if (files.hasNext()) return files.next();
  const enc = encrypt(JSON.stringify({ users: [] }));
  return folder.createFile(USERS_DB_FILENAME, enc, MimeType.PLAIN_TEXT);
}

function readUsersDb() {
  const file = getUsersDbFile();
  try {
    return JSON.parse(decrypt(file.getBlob().getDataAsString()));
  } catch (e) { throw new Error("DB Error: " + e.message); }
}

function writeUsersDb(data) {
  getUsersDbFile().setContent(encrypt(JSON.stringify(data)));
}

function validateUser(token, email) {
  const db = readUsersDb();
  const user = db.users.find(u => u.email === email);
  if (!user || user.token !== token) throw new Error("Session invalide");
  return user;
}

function sanitizeUser(u) {
  return {
    firstName: u.firstName,
    email: u.email,
    isAdmin: u.isAdmin,
    canCreate: u.canCreate,
    mustChangePassword: u.mustChangePassword
  };
}

function getChatsForUser(user) {
  const activeIds = user.activeChats || [];
  const results = [];
  const validIds = [];
  const now = new Date();

  activeIds.forEach(id => {
    try {
      const doc = DocumentApp.openById(id);
      const meta = JSON.parse(decrypt(doc.getBody().getParagraphs()[0].getText()));
      if (meta.expiresAt && now > new Date(meta.expiresAt)) {
        doc.setTrashed(true);
      } else {
        results.push({ id: meta.id, names: meta.participantNames, expiresAt: meta.expiresAt });
        validIds.push(id);
      }
    } catch(e) {}
  });

  if (validIds.length !== activeIds.length) {
    const db = readUsersDb();
    const u = db.users.find(x => x.email === user.email);
    if (u) {
       u.activeChats = validIds;
       writeUsersDb(db);
    }
  }
  return results;
}

// --- NATIVE ENCRYPTION (No Library) ---
// Uses a simple Vigenere-like XOR Shift with Base64
// This satisfies "Like Before" (no deps) while being "Encrypted" (not plain text)

function encrypt(text) {
  const encoded = Utilities.base64Encode(text, Utilities.Charset.UTF_8);
  let result = "";
  for(let i = 0; i < encoded.length; i++) {
    const charCode = encoded.charCodeAt(i);
    const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
    // Simple shift
    result += String.fromCharCode(charCode ^ keyChar);
  }
  return Utilities.base64Encode(result); // Wrap again to make it safe string
}

function decrypt(cipher) {
  const decodedStep1 = Utilities.newBlob(Utilities.base64Decode(cipher)).getDataAsString();
  let result = "";
  for(let i = 0; i < decodedStep1.length; i++) {
    const charCode = decodedStep1.charCodeAt(i);
    const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
    result += String.fromCharCode(charCode ^ keyChar);
  }
  return Utilities.newBlob(Utilities.base64Decode(result)).getDataAsString();
}

// --- TRIGGERS ---

function setupTrigger() {
  ScriptApp.newTrigger('cleanUpExpiredChats')
    .timeBased()
    .everyMinutes(10)
    .create();
}

function cleanUpExpiredChats() {
  const files = getFolder().getFiles();
  const now = new Date();
  while (files.hasNext()) {
    const f = files.next();
    if (f.getName() === USERS_DB_FILENAME) continue;
    try {
      const doc = DocumentApp.openById(f.getId());
      const meta = JSON.parse(decrypt(doc.getBody().getParagraphs()[0].getText()));
      if (meta.expiresAt && now > new Date(meta.expiresAt)) f.setTrashed(true);
    } catch(e) {}
  }
}

function resetDatabase() {
  const f = getFolder().getFilesByName(USERS_DB_FILENAME);
  while(f.hasNext()) f.next().setTrashed(true);
  return "Reset Done (Native Crypto)";
}

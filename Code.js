// ==========================================
// CONFIGURATION & SETUP
// ==========================================
const APP_NAME = "WhatsHappen";
// Use the specific ID provided by the user. If empty, falls back to creating/finding by name.
const TARGET_FOLDER_ID = "1IN2pSIhjV_3Fn-B_WLMUgNFcQdLOjbYr";
const ROOT_FOLDER_NAME = "WhatsHappen_Data"; // Fallback name
const USERS_DB_FILENAME = "Users.db";
// WARNING: Change this key to a random string before deployment!
const ENCRYPTION_KEY = "CHAOUI_SECURE_KEY_2025";
const ADMIN_EMAIL = "chaouiengage@gmail.com";
const ADMIN_CODE_HASH = "15112000";
const ADMIN_AUTH_CODE = "15112000";

// ==========================================
// SERVING HTML
// ==========================================
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle(APP_NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ==========================================
// DATABASE & DRIVE HELPERS
// ==========================================
function getOrCreateRootFolder() {
  if (TARGET_FOLDER_ID && TARGET_FOLDER_ID !== "") {
    try {
      return DriveApp.getFolderById(TARGET_FOLDER_ID);
    } catch(e) {
      console.log("Folder ID invalid or inaccessible, falling back to name search.");
    }
  }
  const folders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(ROOT_FOLDER_NAME);
}

function getUsersDbFile() {
  const root = getOrCreateRootFolder();
  const files = root.getFilesByName(USERS_DB_FILENAME);
  if (files.hasNext()) return files.next();

  // Create new DB
  const initialData = {
    users: [], // { email, firstName, authCode (encrypted), role: 'user'|'admin' }
    config: {
      allowRegistration: true
    }
  };
  const content = encrypt(JSON.stringify(initialData));
  return root.createFile(USERS_DB_FILENAME, content, MimeType.PLAIN_TEXT);
}

function readUsersDb() {
  const file = getUsersDbFile();
  const encryptedContent = file.getBlob().getDataAsString();
  try {
    const json = decrypt(encryptedContent);
    return JSON.parse(json);
  } catch (e) {
    // If decryption fails (e.g. empty file), return structure
    return { users: [], config: { allowRegistration: true } };
  }
}

function writeUsersDb(data) {
  const file = getUsersDbFile();
  const encrypted = encrypt(JSON.stringify(data));
  file.setContent(encrypted);
}

// ==========================================
// AUTHENTICATION
// ==========================================
function registerUser(email, firstName, code) {
  const lock = LockService.getScriptLock();
  // Wait up to 30s for other processes to finish
  lock.waitLock(30000);

  let newUser;
  try {
    const db = readUsersDb();

    // Normalize
    email = email.toLowerCase().trim();

    // Check existence
    const existing = db.users.find(u => u.email === email);
    if (existing) {
      throw new Error("Cet email est déjà inscrit.");
    }

    // Special exception for Admin Code
    const isSpecialAdmin = (code.toString() === ADMIN_AUTH_CODE);

    if (!isSpecialAdmin && (!code || code.toString().length !== 3)) {
      throw new Error("Le code doit faire exactement 3 chiffres.");
    }

    // Create User
    newUser = {
      email: email,
      firstName: firstName,
      authCode: encrypt(code.toString()), // Store encrypted code
      isAdmin: (email === ADMIN_EMAIL && code.toString() === ADMIN_AUTH_CODE), // Must match both
      permissions: {
        canCreateChat: (email === ADMIN_EMAIL) // Default: only admin can create, or configurable
      },
      registeredAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeUsersDb(db);
  } finally {
    lock.releaseLock();
  }
  return { success: true, user: sanitizeUser(newUser) };
}

function loginUser(email, code) {
  const db = readUsersDb();
  email = email.toLowerCase().trim();

  let user, token;

  // We need a lock to update the session token safely
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    // Re-read db inside lock to be safe
    const safeDb = readUsersDb();
    user = safeDb.users.find(u => u.email === email);

    if (!user) {
      throw new Error("Utilisateur non trouvé.");
    }

    // Check code
    const decryptedCode = decrypt(user.authCode);
    if (decryptedCode !== code.toString()) {
      throw new Error("Code incorrect.");
    }

    // Update admin status dynamically just in case
    if (email === ADMIN_EMAIL && !user.isAdmin) {
      user.isAdmin = true;
    }

    // Generate Session Token
    token = Utilities.getUuid();
    if (!user.sessions) user.sessions = [];
    user.sessions.push(token);
    if(user.sessions.length > 5) user.sessions.shift();

    writeUsersDb(safeDb);
  } finally {
    lock.releaseLock();
  }

  const sanitized = sanitizeUser(user);
  sanitized.token = token; // Send token to client
  return { success: true, user: sanitized };
}

function sanitizeUser(user) {
  return {
    email: user.email,
    firstName: user.firstName,
    isAdmin: user.isAdmin,
    permissions: user.permissions
  };
}

// ==========================================
// CONVERSATION LOGIC
// ==========================================
function validateSession(email, token) {
  const db = readUsersDb();
  const user = db.users.find(u => u.email === email);
  if (!user || !user.sessions || !user.sessions.includes(token)) {
    throw new Error("Session invalide ou expirée. Veuillez vous reconnecter.");
  }
  return user;
}

function createConversation(token, creatorEmail, participantEmails, durationStr) {
  // Validate Creator & Session
  const creator = validateSession(creatorEmail, token);

  // FIX: Load DB to validate participants
  const db = readUsersDb();

  // Permission Check
  if (!creator.isAdmin && !creator.permissions.canCreateChat) {
    throw new Error("Vous n'avez pas les droits pour créer une conversation.");
  }

  // Validate Participants
  const validParticipants = [creatorEmail];
  const missingEmails = [];

  participantEmails.forEach(pEmail => {
    const p = db.users.find(u => u.email === pEmail.toLowerCase().trim());
    if (p) {
      validParticipants.push(p.email);
    } else {
      missingEmails.push(pEmail);
    }
  });

  if (missingEmails.length > 0) {
    throw new Error("Emails introuvables: " + missingEmails.join(", "));
  }

  // Calculate Expiry
  const now = new Date();
  let expiryDate = null;
  if (durationStr !== 'unlimited') {
    const minutes = parseDuration(durationStr);
    expiryDate = new Date(now.getTime() + minutes * 60000);
  }

  // Create Doc
  const root = getOrCreateRootFolder();
  const docName = `Chat_${new Date().getTime()}_${Math.floor(Math.random()*1000)}`;
  // We use a text file or JSON for the chat content to support easier structure than a GDoc,
  // but the prompt asked for "Google Docs".
  // To stick to "Doc" but keep structure, we'll store JSON stringified in the body of the Doc.
  // Or better, use a standard JSON file on Drive which is cleaner for the "Server" concept.
  // Prompt said: "Chaque conversation = 1 Fichier Google Doc unique."
  // I will create a Google Doc and store the JSON data as encrypted text in the body.

  const doc = DocumentApp.create(docName);
  const file = DriveApp.getFileById(doc.getId());
  file.moveTo(root);

  const chatData = {
    id: doc.getId(),
    createdAt: now.toISOString(),
    expiresAt: expiryDate ? expiryDate.toISOString() : null,
    participants: validParticipants, // List of emails
    messages: []
  };

  // Write initial encrypted data
  const body = doc.getBody();
  body.setText(encrypt(JSON.stringify(chatData)));
  doc.saveAndClose();

  // Send Emails
  validParticipants.forEach(pEmail => {
    if (pEmail !== creatorEmail) {
      try {
        MailApp.sendEmail({
          to: pEmail,
          subject: "Nouveau message sur WhatsHappen",
          htmlBody: `Bonjour,<br><br>Vous avez été ajouté à une nouvelle conversation sécurisée par ${creator.firstName}.<br>Connectez-vous pour voir le message.`
        });
      } catch (e) {
        console.log("Email failed for " + pEmail);
      }
    }
  });

  return { success: true, chatId: doc.getId() };
}

function getConversations(token, userEmail) {
  validateSession(userEmail, token);

  const root = getOrCreateRootFolder();
  const files = root.getFiles();
  const chats = [];
  userEmail = userEmail.toLowerCase().trim();

  while (files.hasNext()) {
    const file = files.next();
    if (file.getName() === USERS_DB_FILENAME) continue;

    try {
      // Read Doc Content
      const doc = DocumentApp.openById(file.getId());
      const text = doc.getBody().getText();
      const data = JSON.parse(decrypt(text));

      if (data.participants && data.participants.includes(userEmail)) {
        chats.push({
          id: data.id,
          participants: data.participants, // We should map this to names ideally
          lastMessage: data.messages.length > 0 ? data.messages[data.messages.length - 1] : null,
          expiresAt: data.expiresAt
        });
      }
    } catch (e) {
      // Maybe a corrupted file or not a chat doc
      console.log("Error reading file " + file.getName() + ": " + e.message);
    }
  }

  return chats;
}

function getMessages(token, chatId, userEmail) {
  validateSession(userEmail, token);

  try {
    const doc = DocumentApp.openById(chatId);
    const text = doc.getBody().getText();
    const data = JSON.parse(decrypt(text));

    // Security check
    if (!data.participants.includes(userEmail.toLowerCase().trim())) {
      throw new Error("Access Denied");
    }

    // Enrich messages with sender names
    const db = readUsersDb();
    const messages = data.messages.map(m => {
      const sender = db.users.find(u => u.email === m.sender);
      return {
        ...m,
        senderName: sender ? sender.firstName : "Inconnu",
        isMe: m.sender === userEmail
      };
    });

    return {
      messages: messages,
      expiresAt: data.expiresAt,
      participantNames: data.participants.map(p => {
        const u = db.users.find(user => user.email === p);
        return u ? u.firstName : p;
      }).join(", ")
    };

  } catch (e) {
    throw new Error("Erreur de chargement: " + e.message);
  }
}

function sendMessage(token, chatId, senderEmail, content, type) {
  validateSession(senderEmail, token);

  // Basic Sanitize
  if (type === 'text') {
    content = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  let others = [];

  // Lock mechanism is required to prevent message loss
  const lock = LockService.getScriptLock();
  lock.waitLock(30000); // Wait up to 30s

  try {
    const doc = DocumentApp.openById(chatId);
    const body = doc.getBody();
    const text = body.getText();
    const data = JSON.parse(decrypt(text));

    const newMessage = {
      id: new Date().getTime().toString(),
      sender: senderEmail,
      content: content, // Can be text or base64
      type: type, // 'text', 'image', 'file'
      timestamp: new Date().toISOString()
    };

    data.messages.push(newMessage);

    // Encrypt and save
    body.setText(encrypt(JSON.stringify(data)));
    doc.saveAndClose();

    others = data.participants.filter(p => p !== senderEmail);
  } finally {
    lock.releaseLock();
  }

  // Notify others (Email sending outside lock for performance)
  others.forEach(pEmail => {
     try {
        MailApp.sendEmail({
          to: pEmail,
          subject: "Nouveau message sur WhatsHappen",
          htmlBody: `Bonjour,<br><br>Vous avez reçu un nouveau message.<br>Connectez-vous pour le lire.`
        });
      } catch (e) {
        // ignore
      }
  });

  return { success: true };
}

// ==========================================
// ADMIN FUNCTIONS
// ==========================================
function adminGetUsers(token, adminEmail) {
  validateSession(adminEmail, token);
  if (adminEmail !== ADMIN_EMAIL) throw new Error("Unauthorized");
  return readUsersDb().users;
}

function adminUpdateUserRights(token, adminEmail, targetEmail, canCreate) {
  validateSession(adminEmail, token);
  if (adminEmail !== ADMIN_EMAIL) throw new Error("Unauthorized");
  const db = readUsersDb();
  const user = db.users.find(u => u.email === targetEmail);
  if (user) {
    if (!user.permissions) user.permissions = {};
    user.permissions.canCreateChat = canCreate;
    writeUsersDb(db);
    return { success: true };
  }
  throw new Error("User not found");
}

// ==========================================
// UTILS & ENCRYPTION
// ==========================================
function parseDuration(str) {
  // "10min", "12h", "24h", "48h"
  if (str.endsWith("min")) return parseInt(str);
  if (str.endsWith("h")) return parseInt(str) * 60;
  return 24 * 60; // Default
}

// Simple Vigenere-like Cipher for demonstration (or stronger if needed).
// Since we need robustness but have no external libs:
function encrypt(text) {
  // We will base64 encode then simple XOR or shift
  // A simple way to obscure "gibberish":
  const encoded = Utilities.base64Encode(text, Utilities.Charset.UTF_8);
  let result = "";
  for (let i = 0; i < encoded.length; i++) {
    const c = encoded.charCodeAt(i);
    const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    // Shift
    result += String.fromCharCode((c + keyChar) % 256);
  }
  // Hex encode result to be safe for text storage
  return toHex(result);
}

function decrypt(cipherText) {
  const chars = fromHex(cipherText);
  let encoded = "";
  for (let i = 0; i < chars.length; i++) {
    const c = chars.charCodeAt(i);
    const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    // Reverse Shift
    let val = c - keyChar;
    if (val < 0) val += 256;
    encoded += String.fromCharCode(val);
  }
  const decoded = Utilities.base64Decode(encoded, Utilities.Charset.UTF_8);
  return Utilities.newBlob(decoded).getDataAsString();
}

function toHex(str) {
  let hex = '';
  for(let i=0;i<str.length;i++) {
    hex += ''+str.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return hex;
}

function fromHex(hex) {
  let str = '';
  for(let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

// ==========================================
// TRIGGER - CLEANUP
// ==========================================
function cleanUpExpiredChats() {
  const root = getOrCreateRootFolder();
  const files = root.getFiles();
  const now = new Date();

  while (files.hasNext()) {
    const file = files.next();
    if (file.getName() === USERS_DB_FILENAME) continue;

    try {
      const doc = DocumentApp.openById(file.getId());
      const text = doc.getBody().getText();
      // If we can't decrypt, maybe it's already broken or bad file, but let's try
      const data = JSON.parse(decrypt(text));

      if (data.expiresAt) {
        const expires = new Date(data.expiresAt);
        if (now > expires) {
          // DELETE
          file.setTrashed(true);
          console.log("Deleted expired chat: " + file.getId());
        }
      }
    } catch (e) {
      console.log("Skipping file " + file.getId() + " - " + e.message);
    }
  }
}

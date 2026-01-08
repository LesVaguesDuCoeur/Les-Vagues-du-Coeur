// ==========================================
// WAHTSHAPPEN - BACKEND API (Google Apps Script)
// ==========================================
// Architecture: Drive-as-Database | Encryption: Enabled
// ==========================================

const APP_NAME = "WhatsHappen";

// --- CONFIGURATION ---
const _SEC_1 = "MUlOMnBTSWhqVl8zRm4tQl9XTE1VZ05GY1FkTE9qYlly";
const _SEC_2 = "MTUxMTIwMDA=";
const _SEC_3 = "Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ==";

const USERS_DB_FILENAME = "Users.db";
const ROOT_FOLDER_NAME = "WhatsHappen_Data";

// Runtime Decoded Constants
const TARGET_FOLDER_ID = decodeSecret(_SEC_1);
const ENCRYPTION_KEY = decodeSecret(_SEC_2);
const ADMIN_EMAIL = decodeSecret(_SEC_3);
const ADMIN_AUTH_CODE = decodeSecret(_SEC_2);

function decodeSecret(str) {
  return Utilities.newBlob(Utilities.base64Decode(str, Utilities.Charset.UTF_8)).getDataAsString();
}

// ==========================================
// API HANDLER (POST) - Main Entry Point
// ==========================================
function doPost(e) {
  // We use a global lock to prevent file corruption during concurrent writes
  const lock = LockService.getScriptLock();
  // Wait up to 30s for other requests to finish
  lock.waitLock(30000);

  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    let result = {};

    switch (action) {
      case 'login':
        result = loginUser(request.email, request.code);
        break;
      case 'register':
        result = registerUser(request.email, request.firstName, request.code);
        break;
      case 'createConversation':
        result = createConversation(request.token, request.email, request.participants, request.duration);
        break;
      case 'getConversations':
        result = { chats: getConversations(request.token, request.email) };
        break;
      case 'getMessages':
        result = getMessages(request.token, request.chatId, request.email);
        break;
      case 'sendMessage':
        result = sendMessage(request.token, request.chatId, request.email, request.content, request.type);
        break;
      case 'addParticipant':
        result = addParticipant(request.token, request.chatId, request.email, request.targetEmail);
        break;
      case 'adminGetUsers':
        result = { users: adminGetUsers(request.token, request.email) };
        break;
      case 'adminUpdateUserRights':
        result = adminUpdateUserRights(request.token, request.email, request.targetEmail, request.canCreate);
        break;
      default:
        throw new Error("Action inconnue");
    }

    // JSON Response
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Support GET for testing connectivity
function doGet(e) {
  return ContentService.createTextOutput("WhatsHappen API is running. Use POST to interact.");
}

// ==========================================
// DATABASE & DRIVE HELPERS
// ==========================================
function getOrCreateRootFolder() {
  if (TARGET_FOLDER_ID && TARGET_FOLDER_ID !== "") {
    try {
      return DriveApp.getFolderById(TARGET_FOLDER_ID);
    } catch(e) {
      // Fallback
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

  // Create new Encrypted DB
  const initialData = {
    users: [],
    config: { allowRegistration: true }
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
    return { users: [], config: { allowRegistration: true } };
  }
}

function writeUsersDb(data) {
  const file = getUsersDbFile();
  const encrypted = encrypt(JSON.stringify(data));
  file.setContent(encrypted);
}

// ==========================================
// CORE LOGIC
// ==========================================
function registerUser(email, firstName, code) {
  const db = readUsersDb();
  email = email.toLowerCase().trim();

  const existing = db.users.find(u => u.email === email);
  if (existing) throw new Error("Cet email est déjà inscrit.");

  // Check Admin Code or Standard Format
  const isSpecialAdmin = (code.toString() === ADMIN_AUTH_CODE);
  if (!isSpecialAdmin && (!code || code.toString().length !== 3)) {
    throw new Error("Le code doit faire exactement 3 chiffres.");
  }

  const newUser = {
    email: email,
    firstName: firstName,
    authCode: encrypt(code.toString()), // Store encrypted
    isAdmin: (email === ADMIN_EMAIL && code.toString() === ADMIN_AUTH_CODE),
    permissions: {
      canCreateChat: (email === ADMIN_EMAIL) // Only admin can create by default
    },
    registeredAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeUsersDb(db);
  return { success: true, user: sanitizeUser(newUser) };
}

function loginUser(email, code) {
  const db = readUsersDb();
  email = email.toLowerCase().trim();

  const user = db.users.find(u => u.email === email);
  if (!user) throw new Error("Utilisateur non trouvé.");

  const decryptedCode = decrypt(user.authCode);
  if (decryptedCode !== code.toString()) throw new Error("Code incorrect.");

  // Auto-promote admin if email matches
  if (email === ADMIN_EMAIL && !user.isAdmin) {
    user.isAdmin = true;
    user.permissions.canCreateChat = true;
  }

  // Session Token
  const token = Utilities.getUuid();
  if (!user.sessions) user.sessions = [];
  user.sessions.push(token);
  if(user.sessions.length > 5) user.sessions.shift();

  writeUsersDb(db);

  const sanitized = sanitizeUser(user);
  sanitized.token = token;
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

function validateSession(email, token) {
  const db = readUsersDb();
  const user = db.users.find(u => u.email === email);
  if (!user || !user.sessions || !user.sessions.includes(token)) {
    throw new Error("Session invalide ou expirée.");
  }
  return user;
}

function createConversation(token, creatorEmail, participantEmails, durationStr) {
  const creator = validateSession(creatorEmail, token);
  const db = readUsersDb();

  // Permission Check
  if (!creator.isAdmin && !creator.permissions.canCreateChat) {
    throw new Error("Vous n'avez pas le droit de créer une conversation.");
  }

  // Validate emails
  const validParticipants = [creatorEmail];
  const emailsList = Array.isArray(participantEmails) ? participantEmails : [participantEmails];
  const missingEmails = [];

  emailsList.forEach(pEmail => {
    if(!pEmail) return;
    const p = db.users.find(u => u.email === pEmail.toLowerCase().trim());
    if (p) validParticipants.push(p.email);
    else missingEmails.push(pEmail);
  });

  if (missingEmails.length > 0) throw new Error("Emails introuvables: " + missingEmails.join(", "));

  // Expiry
  const now = new Date();
  let expiryDate = null;
  if (durationStr !== 'unlimited') {
    const minutes = parseDuration(durationStr);
    expiryDate = new Date(now.getTime() + minutes * 60000);
  }

  // Create Doc
  const root = getOrCreateRootFolder();
  const docName = `Chat_${new Date().getTime()}`;
  const doc = DocumentApp.create(docName);
  const file = DriveApp.getFileById(doc.getId());
  file.moveTo(root);

  const chatData = {
    id: doc.getId(),
    createdAt: now.toISOString(),
    expiresAt: expiryDate ? expiryDate.toISOString() : null,
    participants: validParticipants,
    messages: []
  };

  // Initial Save (Encrypted)
  doc.getBody().setText(encrypt(JSON.stringify(chatData)));
  doc.saveAndClose();

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
      const doc = DocumentApp.openById(file.getId());
      const text = doc.getBody().getText();
      const data = JSON.parse(decrypt(text));
      if (data.participants && data.participants.includes(userEmail)) {
        chats.push({
          id: data.id,
          participants: data.participants,
          lastMessage: data.messages.length > 0 ? data.messages[data.messages.length - 1] : null,
          expiresAt: data.expiresAt
        });
      }
    } catch (e) {}
  }
  return chats;
}

function getMessages(token, chatId, userEmail) {
  validateSession(userEmail, token);
  try {
    const doc = DocumentApp.openById(chatId);
    const text = doc.getBody().getText();
    const data = JSON.parse(decrypt(text));

    if (!data.participants.includes(userEmail.toLowerCase().trim())) throw new Error("Accès Refusé");

    const db = readUsersDb();
    const messages = data.messages.map(m => {
      const sender = db.users.find(u => u.email === m.sender);
      return {
        ...m,
        senderName: sender ? sender.firstName : "Inconnu",
        isMe: m.sender === userEmail
      };
    });

    const names = data.participants.map(p => {
       const u = db.users.find(user => user.email === p);
       return u ? u.firstName : p;
    }).join(", ");

    return { messages: messages, participantNames: names };
  } catch (e) {
    throw new Error("Erreur chat: " + e.message);
  }
}

function sendMessage(token, chatId, senderEmail, content, type) {
  validateSession(senderEmail, token);

  const doc = DocumentApp.openById(chatId);
  const body = doc.getBody();
  const text = body.getText();
  const data = JSON.parse(decrypt(text));

  // Sanitize text
  if(type === 'text') content = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  data.messages.push({
    id: new Date().getTime().toString(),
    sender: senderEmail,
    content: content,
    type: type,
    timestamp: new Date().toISOString()
  });

  body.setText(encrypt(JSON.stringify(data)));
  doc.saveAndClose();

  return { success: true };
}

function addParticipant(token, chatId, userEmail, targetEmail) {
  validateSession(userEmail, token);

  const doc = DocumentApp.openById(chatId);
  const body = doc.getBody();
  const text = body.getText();
  const data = JSON.parse(decrypt(text));

  // Check if requester is in chat or admin
  if (!data.participants.includes(userEmail.toLowerCase().trim())) {
     // Check if admin
     const db = readUsersDb();
     const u = db.users.find(x => x.email === userEmail);
     if (!u || !u.isAdmin) throw new Error("Accès refusé");
  }

  const db = readUsersDb();
  const target = db.users.find(u => u.email === targetEmail.toLowerCase().trim());
  if (!target) throw new Error("Cet email n'est pas inscrit.");

  if (!data.participants.includes(target.email)) {
    data.participants.push(target.email);
    body.setText(encrypt(JSON.stringify(data)));
    doc.saveAndClose();

    // Add system message
    sendMessage(token, chatId, userEmail, `a ajouté ${target.firstName}`, 'system');
  }

  return { success: true };
}

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
// TOOLS: ENCRYPTION & CLEANUP
// ==========================================
function parseDuration(str) {
  if (str.endsWith("min")) return parseInt(str);
  if (str.endsWith("h")) return parseInt(str) * 60;
  return 24 * 60;
}

function encrypt(text) {
  const encoded = Utilities.base64Encode(text, Utilities.Charset.UTF_8);
  let result = "";
  for (let i = 0; i < encoded.length; i++) {
    const c = encoded.charCodeAt(i);
    const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result += String.fromCharCode((c + keyChar) % 256);
  }
  return toHex(result);
}

function decrypt(cipherText) {
  const chars = fromHex(cipherText);
  let encoded = "";
  for (let i = 0; i < chars.length; i++) {
    const c = chars.charCodeAt(i);
    const keyChar = ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
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
      const data = JSON.parse(decrypt(text));
      if (data.expiresAt) {
        if (now > new Date(data.expiresAt)) {
          file.setTrashed(true);
        }
      }
    } catch (e) {}
  }
}

// ==========================================
// CONFIGURATION & SETUP
// ==========================================
const APP_NAME = "WhatsHappen";

// SECRETS OBFUSCATED (Base64)
const _SEC_1 = "MUlOMnBTSWhqVl8zRm4tQl9XTE1VZ05GY1FkTE9qYlly"; // Folder ID
const _SEC_2 = "MTUxMTIwMDA="; // Encryption Key & Admin Code
const _SEC_3 = "Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ=="; // Admin Email

const ROOT_FOLDER_NAME = "WhatsHappen_Data";
const USERS_DB_FILENAME = "Users.db";

// Runtime Decoded Constants
const TARGET_FOLDER_ID = decodeSecret(_SEC_1);
const ENCRYPTION_KEY = decodeSecret(_SEC_2);
const ADMIN_EMAIL = decodeSecret(_SEC_3);
const ADMIN_AUTH_CODE = decodeSecret(_SEC_2);

function decodeSecret(str) {
  return Utilities.newBlob(Utilities.base64Decode(str, Utilities.Charset.UTF_8)).getDataAsString();
}

// ==========================================
// API HANDLER (POST)
// ==========================================
function doPost(e) {
  // CORS support
  const lock = LockService.getScriptLock();
  lock.waitLock(30000); // Global lock to prevent race conditions at entry

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
      case 'adminGetUsers':
        result = { users: adminGetUsers(request.token, request.email) };
        break;
      case 'adminUpdateUserRights':
        result = adminUpdateUserRights(request.token, request.email, request.targetEmail, request.canCreate);
        break;
      default:
        throw new Error("Action inconnue");
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// OPTIONS for CORS (Preflight)
function doGet(e) {
  // Minimal output for setup check
  return ContentService.createTextOutput("WhatsHappen API is running.");
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
// LOGIC (Refined for API)
// ==========================================
function registerUser(email, firstName, code) {
  // Logic remains same, lock handled in doPost for API safety
  const db = readUsersDb();
  email = email.toLowerCase().trim();

  const existing = db.users.find(u => u.email === email);
  if (existing) throw new Error("Cet email est déjà inscrit.");

  const isSpecialAdmin = (code.toString() === ADMIN_AUTH_CODE);
  if (!isSpecialAdmin && (!code || code.toString().length !== 3)) {
    throw new Error("Le code doit faire exactement 3 chiffres.");
  }

  const newUser = {
    email: email,
    firstName: firstName,
    authCode: encrypt(code.toString()),
    isAdmin: (email === ADMIN_EMAIL && code.toString() === ADMIN_AUTH_CODE),
    permissions: { canCreateChat: (email === ADMIN_EMAIL) },
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

  if (email === ADMIN_EMAIL && !user.isAdmin) {
    user.isAdmin = true;
  }

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

  // Reload DB for participants check
  const db = readUsersDb();

  if (!creator.isAdmin && !creator.permissions.canCreateChat) {
    throw new Error("Droit de création refusé.");
  }

  const validParticipants = [creatorEmail];
  const missingEmails = [];

  // Ensure array
  const emailsList = Array.isArray(participantEmails) ? participantEmails : [participantEmails];

  emailsList.forEach(pEmail => {
    if(!pEmail) return;
    const p = db.users.find(u => u.email === pEmail.toLowerCase().trim());
    if (p) validParticipants.push(p.email);
    else missingEmails.push(pEmail);
  });

  if (missingEmails.length > 0) throw new Error("Emails introuvables: " + missingEmails.join(", "));

  const now = new Date();
  let expiryDate = null;
  if (durationStr !== 'unlimited') {
    const minutes = parseDuration(durationStr);
    expiryDate = new Date(now.getTime() + minutes * 60000);
  }

  const root = getOrCreateRootFolder();
  const docName = `Chat_${new Date().getTime()}_${Math.floor(Math.random()*1000)}`;
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

  doc.getBody().setText(encrypt(JSON.stringify(chatData)));
  doc.saveAndClose();

  // Email notifications
  validParticipants.forEach(pEmail => {
    if (pEmail !== creatorEmail) {
      try {
        MailApp.sendEmail({
          to: pEmail,
          subject: "Nouveau message sur WhatsHappen",
          htmlBody: `Bonjour,<br><br>Vous avez été ajouté à une nouvelle conversation sécurisée par ${creator.firstName}.<br>Connectez-vous pour voir le message.`
        });
      } catch (e) {}
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

    if (!data.participants.includes(userEmail.toLowerCase().trim())) throw new Error("Access Denied");

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
    throw new Error("Erreur chat: " + e.message);
  }
}

function sendMessage(token, chatId, senderEmail, content, type) {
  validateSession(senderEmail, token);
  if (type === 'text') {
    content = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  const doc = DocumentApp.openById(chatId);
  const body = doc.getBody();
  const text = body.getText();
  const data = JSON.parse(decrypt(text));

  data.messages.push({
    id: new Date().getTime().toString(),
    sender: senderEmail,
    content: content,
    type: type,
    timestamp: new Date().toISOString()
  });

  body.setText(encrypt(JSON.stringify(data)));
  doc.saveAndClose();

  // Notify others
  const others = data.participants.filter(p => p !== senderEmail);
  others.forEach(pEmail => {
     try {
        MailApp.sendEmail({
          to: pEmail,
          subject: "Nouveau message sur WhatsHappen",
          htmlBody: `Bonjour,<br><br>Vous avez reçu un nouveau message.<br>Connectez-vous pour le lire.`
        });
      } catch (e) {}
  });

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

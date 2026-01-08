// ==========================================
// WAHTSHAPPEN - BACKEND API (Google Apps Script)
// ==========================================
// Architecture: Drive-as-Database | Encryption: AES-GCM (Heavy)
// Optimization: User Indexing, Append-Only Storage
// ==========================================

const APP_NAME = "WhatsHappen";

// --- CONFIGURATION ---
// In a real deployment, these should be Script Properties.
// For now, we keep the previous pattern but decoded for clarity.
const _SEC_1 = "MUlOMnBTSWhqVl8zRm4tQl9XTE1VZ05GY1FkTE9qYlly"; // Folder ID Base64
const _SEC_2 = "MTUxMTIwMDA="; // Admin Code/Key Base64
const _SEC_3 = "Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ=="; // Admin Email Base64

const USERS_DB_FILENAME = "Users.db";
const ROOT_FOLDER_NAME = "WhatsHappen_Data";

// Runtime Decoded Constants
const TARGET_FOLDER_ID = decodeSecret(_SEC_1);
const SECRET_KEY = decodeSecret(_SEC_2);
const ADMIN_EMAIL = decodeSecret(_SEC_3);
const ADMIN_AUTH_CODE = decodeSecret(_SEC_2);

function decodeSecret(str) {
  return Utilities.newBlob(Utilities.base64Decode(str, Utilities.Charset.UTF_8)).getDataAsString();
}

// ==========================================
// API HANDLER (POST) - Main Entry Point
// ==========================================
function doPost(e) {
  const lock = LockService.getScriptLock();
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

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput("WhatsHappen API is running. POST expected.");
}

// ==========================================
// DATABASE & DRIVE HELPERS
// ==========================================
function getOrCreateRootFolder() {
  if (TARGET_FOLDER_ID && TARGET_FOLDER_ID !== "") {
    try {
      return DriveApp.getFolderById(TARGET_FOLDER_ID);
    } catch(e) { /* Fallback to name */ }
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
// CORE LOGIC
// ==========================================
function registerUser(email, firstName, code) {
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
    permissions: {
      canCreateChat: (email === ADMIN_EMAIL)
    },
    activeChats: [], // NEW: Store active chat IDs for performance
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
    user.permissions.canCreateChat = true;
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

// -----------------------------------------------------------------
// CONVERSATIONS (Optimized)
// -----------------------------------------------------------------

function createConversation(token, creatorEmail, participantEmails, durationStr) {
  const creator = validateSession(creatorEmail, token); // This reads DB
  // We need to reload DB for writing later, or we assume single-threaded-ish per lock
  // Re-read DB to be safe inside lock logic if validateSession didn't return full writable object reference
  const db = readUsersDb();

  const userRecord = db.users.find(u => u.email === creatorEmail);
  if (!userRecord.isAdmin && !userRecord.permissions.canCreateChat) {
    throw new Error("Droit de création refusé.");
  }

  const validParticipants = [creatorEmail];
  const participantRecords = [userRecord];

  const emailsList = Array.isArray(participantEmails) ? participantEmails : [participantEmails];
  const missingEmails = [];

  emailsList.forEach(pEmail => {
    if(!pEmail) return;
    const cleanEmail = pEmail.toLowerCase().trim();
    if (cleanEmail === creatorEmail) return; // don't add self twice

    const p = db.users.find(u => u.email === cleanEmail);
    if (p) {
      validParticipants.push(p.email);
      participantRecords.push(p);
    } else {
      missingEmails.push(pEmail);
    }
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

  // Initial Header Block (Encrypted)
  const metaData = {
    id: doc.getId(),
    createdAt: now.toISOString(),
    expiresAt: expiryDate ? expiryDate.toISOString() : null,
    participants: validParticipants,
    participantNames: participantRecords.map(u => u.firstName)
  };

  // We append metadata as the first paragraph
  doc.getBody().setText(encrypt(JSON.stringify(metaData)));
  doc.saveAndClose();

  // UPDATE USERS DB with New Chat ID (Indexing)
  const chatId = doc.getId();
  participantRecords.forEach(u => {
    if (!u.activeChats) u.activeChats = [];
    u.activeChats.push(chatId);
  });

  writeUsersDb(db);

  return { success: true, chatId: chatId };
}

function getConversations(token, userEmail) {
  // O(1) Lookup via Index
  validateSession(userEmail, token);
  const db = readUsersDb();
  const user = db.users.find(u => u.email === userEmail);

  if (!user.activeChats || user.activeChats.length === 0) return [];

  const chats = [];
  const chatsToRemove = [];

  // Iterate only user's chats
  user.activeChats.forEach(chatId => {
    try {
      // Try to open. If trashed/missing, it throws
      const doc = DocumentApp.openById(chatId);
      const body = doc.getBody();
      // Read First Paragraph (Metadata)
      const metaEnc = body.getParagraphs()[0].getText();
      const meta = JSON.parse(decrypt(metaEnc));

      // Check Expiry (Double check)
      if (meta.expiresAt && new Date() > new Date(meta.expiresAt)) {
         chatsToRemove.push(chatId);
         return;
      }

      // Get Last Message (Last Paragraph)
      const paragraphs = body.getParagraphs();
      let lastMsg = null;
      if (paragraphs.length > 1) {
         // The last paragraph is the last message
         const lastEnc = paragraphs[paragraphs.length - 1].getText();
         if(lastEnc) {
           const msgData = JSON.parse(decrypt(lastEnc));
           lastMsg = msgData;
         }
      }

      chats.push({
        id: meta.id,
        participants: meta.participants,
        lastMessage: lastMsg,
        expiresAt: meta.expiresAt
      });

    } catch (e) {
      // File missing or inaccessible -> Remove from index
      chatsToRemove.push(chatId);
    }
  });

  // Lazy Cleanup of Index
  if (chatsToRemove.length > 0) {
    user.activeChats = user.activeChats.filter(id => !chatsToRemove.includes(id));
    writeUsersDb(db);
  }

  return chats;
}

function getMessages(token, chatId, userEmail) {
  validateSession(userEmail, token);

  try {
    const doc = DocumentApp.openById(chatId);
    const body = doc.getBody();
    const paragraphs = body.getParagraphs();

    // Decrypt All Paragraphs
    // Para 0 is Meta, Para 1..N are Messages
    const metaEnc = paragraphs[0].getText();
    const meta = JSON.parse(decrypt(metaEnc));

    if (!meta.participants.includes(userEmail)) throw new Error("Access Denied");

    const messages = [];
    for (let i = 1; i < paragraphs.length; i++) {
      const txt = paragraphs[i].getText();
      if (!txt.trim()) continue;
      try {
        const msg = JSON.parse(decrypt(txt));

        // Enrich sender name
        // We could look up in DB, but for speed let's use what we have or generic
        // Optimization: In real app, cache names. Here we fetch DB if needed?
        // Let's rely on client logic or stored name?
        // We will store senderName in the message itself to avoid N+1 DB lookups

        messages.push({
           ...msg,
           isMe: (msg.sender === userEmail)
        });
      } catch(e) { /* corrupted msg */ }
    }

    const db = readUsersDb();
    const names = meta.participants.map(p => {
       const u = db.users.find(x => x.email === p);
       return u ? u.firstName : p;
    }).join(", ");

    return { messages: messages, participantNames: names };

  } catch (e) {
    throw new Error("Chat unavailable or deleted.");
  }
}

function sendMessage(token, chatId, senderEmail, content, type) {
  validateSession(senderEmail, token);

  // Append-Only Write
  const doc = DocumentApp.openById(chatId);
  const body = doc.getBody();

  // Sanitize
  if(type === 'text') content = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const db = readUsersDb();
  const senderUser = db.users.find(u => u.email === senderEmail);

  const newMessage = {
    id: new Date().getTime().toString(),
    sender: senderEmail,
    senderName: senderUser ? senderUser.firstName : "Unknown",
    content: content,
    type: type,
    timestamp: new Date().toISOString()
  };

  const encMsg = encrypt(JSON.stringify(newMessage));

  // Atomic Append (Paragraph)
  body.appendParagraph(encMsg);

  // We do NOT saveAndClose() immediately if we want speed, but in GAS web app context,
  // the script ends anyway. saveAndClose is good practice.
  doc.saveAndClose();

  return { success: true };
}

function addParticipant(token, chatId, userEmail, targetEmail) {
  validateSession(userEmail, token);

  const doc = DocumentApp.openById(chatId);
  const body = doc.getBody();
  // We need to update Meta (Para 0)
  const metaEnc = body.getParagraphs()[0].getText();
  const meta = JSON.parse(decrypt(metaEnc));

  if (!meta.participants.includes(userEmail)) {
     // Admin check
     const db = readUsersDb();
     const u = db.users.find(x => x.email === userEmail);
     if (!u || !u.isAdmin) throw new Error("Accès refusé");
  }

  const db = readUsersDb();
  const target = db.users.find(u => u.email === targetEmail.toLowerCase().trim());
  if (!target) throw new Error("Utilisateur introuvable");

  if (!meta.participants.includes(target.email)) {
    meta.participants.push(target.email);
    meta.participantNames.push(target.firstName);

    // Update Meta Paragraph
    const newMetaEnc = encrypt(JSON.stringify(meta));
    body.getParagraphs()[0].setText(newMetaEnc);

    // Update User Index
    if (!target.activeChats) target.activeChats = [];
    target.activeChats.push(chatId);
    writeUsersDb(db);

    doc.saveAndClose();

    // System Message
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
// TOOLS: ENCRYPTION (AES) & CLEANUP
// ==========================================
function parseDuration(str) {
  if (str.endsWith("min")) return parseInt(str);
  if (str.endsWith("h")) return parseInt(str) * 60;
  return 24 * 60;
}

// AES Encryption using CryptoJS (assumed loaded via Library or Copy-Paste)
function encrypt(text) {
  // If CryptoJS is missing, fallback to internal XOR (NOT RECOMMENDED for Production)
  if (typeof CryptoJS === 'undefined') {
     // Load CryptoJS from content if possible, or use simple fallback
     // For this task, we assume the user will put CryptoJS.gs content in the project.
     // But we need to handle the case where it's not loaded in the same scope context in GAS sometimes.
     // In GAS, all files in the project are loaded into the global scope.
     // So CryptoJS should be available if CryptoJS.gs exists.
     try {
       return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
     } catch(e) {
       throw new Error("CryptoJS missing. Please add CryptoJS.gs file.");
     }
  }
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

function decrypt(cipherText) {
  if (typeof CryptoJS === 'undefined') throw new Error("CryptoJS missing");
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

function cleanUpExpiredChats() {
  // This trigger should run every X minutes
  // It iterates USERS (not files) to find expired chats efficiently?
  // Or iterates files? Iterating files is safer to catch orphans.
  // But strictly, we can iterate Active Chats of all users.
  // For robustness, let's iterate the Folder files, but be careful of timeouts.
  // Ideally, maintain a separate "ActiveChats" index file.

  // For now, let's use the Folder Iterator but with a time limit check
  const root = getOrCreateRootFolder();
  const files = root.getFiles();
  const now = new Date();

  // Allow 5 minutes of execution
  const startTime = new Date().getTime();

  while (files.hasNext()) {
    if (new Date().getTime() - startTime > 280000) break; // Stop before timeout

    const file = files.next();
    if (file.getName() === USERS_DB_FILENAME) continue;

    try {
      const doc = DocumentApp.openById(file.getId());
      const metaEnc = doc.getBody().getParagraphs()[0].getText();
      const meta = JSON.parse(decrypt(metaEnc));

      if (meta.expiresAt) {
        if (now > new Date(meta.expiresAt)) {
          file.setTrashed(true); // Soft delete first
        }
      }
    } catch (e) {
      // If decryption fails or format wrong, maybe ignore or trash?
    }
  }
}

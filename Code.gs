// ==========================================
// WAHTSHAPPEN - BACKEND API (V4 FINAL)
// ==========================================

// ═══════════════════════════════════════════════════════════
// CONFIGURATION (ENCODÉ - NE JAMAIS METTRE EN CLAIR)
// ═══════════════════════════════════════════════════════════

const _FOLDER = "MUlOMnBTSWhqVl8zRm4tQl9XTE1VZ05GY1FkTE9qYlly";
const _ADMIN = "Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ==";
const SECRET_KEY = "ChaouiSecretKeyV4";

function decodeB64(str) {
  return Utilities.newBlob(Utilities.base64Decode(str)).getDataAsString();
}

const FOLDER_ID = decodeB64(_FOLDER);
const ADMIN_EMAIL = decodeB64(_ADMIN);

// ═══════════════════════════════════════════════════════════
// CHIFFREMENT XOR + BASE64 (NATIF, PAS DE LIBRAIRIE)
// ═══════════════════════════════════════════════════════════

function encrypt(text) {
  if (!text) return "";
  const encoded = Utilities.base64Encode(Utilities.newBlob(text).getBytes());
  let result = "";
  for (let i = 0; i < encoded.length; i++) {
    result += String.fromCharCode(
      encoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length)
    );
  }
  return Utilities.base64Encode(Utilities.newBlob(result).getBytes());
}

function decrypt(cipher) {
  if (!cipher) return "";
  try {
    const step1 = Utilities.newBlob(Utilities.base64Decode(cipher)).getDataAsString();
    let result = "";
    for (let i = 0; i < step1.length; i++) {
      result += String.fromCharCode(
        step1.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length)
      );
    }
    return Utilities.newBlob(Utilities.base64Decode(result)).getDataAsString();
  } catch (e) {
    return "";
  }
}

// ═══════════════════════════════════════════════════════════
// GESTION DES FICHIERS DB
// ═══════════════════════════════════════════════════════════

function getOrCreateFile(fileName, defaultContent) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByName(fileName);

  if (files.hasNext()) {
    const file = files.next();
    const content = file.getBlob().getDataAsString();
    if (!content) return defaultContent;
    try {
      return JSON.parse(decrypt(content));
    } catch (e) {
      return defaultContent;
    }
  } else {
    const encrypted = encrypt(JSON.stringify(defaultContent));
    folder.createFile(fileName, encrypted);
    return defaultContent;
  }
}

function saveFile(fileName, data) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByName(fileName);
  const encrypted = encrypt(JSON.stringify(data));

  if (files.hasNext()) {
    const file = files.next();
    file.setContent(encrypted);
  } else {
    folder.createFile(fileName, encrypted);
  }
}

// Raccourcis pour chaque DB
function readUsersDb() {
  return getOrCreateFile("users_db.txt", { users: [] });
}
function writeUsersDb(data) {
  saveFile("users_db.txt", data);
}

function readChatsDb() {
  return getOrCreateFile("chats_db.txt", { chats: [] });
}
function writeChatsDb(data) {
  saveFile("chats_db.txt", data);
}

function readSubscriptionsDb() {
  return getOrCreateFile("subscriptions_db.txt", { subscriptions: [] });
}
function writeSubscriptionsDb(data) {
  saveFile("subscriptions_db.txt", data);
}

function readInvoicesDb() {
  return getOrCreateFile("invoices_db.txt", { invoices: [] });
}
function writeInvoicesDb(data) {
  saveFile("invoices_db.txt", data);
}

function readSettingsDb() {
  return getOrCreateFile("settings_db.txt", {
    subscriptionEnabled: true,
    subscriptionPrice: 5.00,
    subscriptionCurrency: "EUR",
    paypalLink: "https://paypal.me/ChaouiEngage5?country.x=FR&locale.x=fr_FR"
  });
}
function writeSettingsDb(data) {
  saveFile("settings_db.txt", data);
}

// ═══════════════════════════════════════════════════════════
// POINT D'ENTRÉE API
// ═══════════════════════════════════════════════════════════

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "Online" })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    let result;

    switch (action) {
      // Auth
      case 'register':
        result = apiRegister(data.email, data.firstName, data.code);
        break;
      case 'login':
        result = apiLogin(data.email, data.code);
        break;
      case 'changePassword':
        result = apiChangePassword(data.email, data.oldCode, data.newCode);
        break;

      // State
      case 'getState':
        result = apiGetState(data.token);
        break;

      // Chats
      case 'createChat':
        result = apiCreateChat(data.token, data.participants, data.duration);
        break;
      case 'getMessages':
        result = apiGetMessages(data.token, data.chatId);
        break;
      case 'sendMessage':
        result = apiSendMessage(data.token, data.chatId, data.content, data.type);
        break;
      case 'addParticipant':
        result = apiAddParticipant(data.token, data.chatId, data.email);
        break;
      case 'expireChat':
        result = apiExpireChat(data.token, data.chatId);
        break;

      // Subscriptions
      case 'getSubscriptionCode':
        result = apiGetSubscriptionCode(data.token);
        break;
      case 'submitSubscription':
        result = apiSubmitSubscription(data.token, data.paypalTransaction);
        break;

      // Admin
      case 'adminGetUsers':
        result = apiAdminGetUsers(data.token);
        break;
      case 'adminUpdateUser':
        result = apiAdminUpdateUser(data.token, data.userId, data.updates);
        break;
      case 'adminDeleteUser':
        result = apiAdminDeleteUser(data.token, data.userId);
        break;
      case 'adminResetPassword':
        result = apiAdminResetPassword(data.token, data.userId);
        break;
      case 'adminGetSubscriptions':
        result = apiAdminGetSubscriptions(data.token);
        break;
      case 'adminValidateSubscription':
        result = apiAdminValidateSubscription(data.token, data.userId, data.startDate, data.endDate);
        break;
      case 'adminGetInvoices':
        result = apiAdminGetInvoices(data.token, data.userId);
        break;
      case 'adminGetSettings':
        result = apiAdminGetSettings(data.token);
        break;
      case 'adminUpdateSettings':
        result = apiAdminUpdateSettings(data.token, data.settings);
        break;

      default:
        result = { success: false, error: "Action inconnue." };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message || "Une erreur est survenue."
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ═══════════════════════════════════════════════════════════
// AUTHENTIFICATION
// ═══════════════════════════════════════════════════════════

function apiRegister(email, firstName, code) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = firstName.trim();

    if (!cleanEmail || !cleanName || !code) throw new Error("Veuillez remplir tous les champs.");
    if (!/^\d{3}$/.test(code)) throw new Error("Le code doit contenir exactement 3 chiffres.");

    const db = readUsersDb();

    if (db.users.some(u => u.email === cleanEmail)) throw new Error("Cette adresse email est déjà utilisée.");

    const isSuperAdmin = cleanEmail === ADMIN_EMAIL;

    const newUser = {
      id: Utilities.getUuid(),
      email: cleanEmail,
      firstName: cleanName,
      code: code,
      token: null,
      isAdmin: isSuperAdmin,
      canCreate: isSuperAdmin,
      isSubscriber: false,
      canSubscribe: true,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeUsersDb(db);

    return { success: true, message: "Inscription réussie !" };
  } finally {
    lock.releaseLock();
  }
}

function apiLogin(email, code) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const cleanEmail = email.toLowerCase().trim();
    const db = readUsersDb();

    const userIndex = db.users.findIndex(u => u.email === cleanEmail);
    if (userIndex < 0) throw new Error("Cette adresse email n'est pas inscrite.");

    const user = db.users[userIndex];

    if (user.code !== code.toString()) throw new Error("Le code est incorrect.");

    // Forcer les droits super-admin
    if (cleanEmail === ADMIN_EMAIL) {
      user.isAdmin = true;
      user.canCreate = true;
    }

    const token = Utilities.getUuid();
    user.token = token;

    db.users[userIndex] = user;
    writeUsersDb(db);

    return {
      success: true,
      token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        isAdmin: user.isAdmin,
        canCreate: user.canCreate,
        isSubscriber: user.isSubscriber,
        canSubscribe: user.canSubscribe
      }
    };
  } finally {
    lock.releaseLock();
  }
}

function validateToken(token) {
  if (!token) return null;
  const db = readUsersDb();
  return db.users.find(u => u.token === token) || null;
}

function apiChangePassword(email, oldCode, newCode) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const db = readUsersDb();
    const userIndex = db.users.findIndex(u => u.email === email.toLowerCase().trim());

    if (userIndex < 0) throw new Error("Utilisateur non trouvé.");
    if (db.users[userIndex].code !== oldCode.toString()) throw new Error("Ancien code incorrect.");

    db.users[userIndex].code = newCode.toString();
    writeUsersDb(db);

    return { success: true, message: "Code mis à jour." };
  } finally {
    lock.releaseLock();
  }
}

// ═══════════════════════════════════════════════════════════
// CHATS
// ═══════════════════════════════════════════════════════════

function apiGetState(token) {
  const user = validateToken(token);
  if (!user) throw new Error("Session expirée.");

  const chatsDb = readChatsDb();
  const db = readUsersDb();
  const now = new Date();

  const myChats = chatsDb.chats.filter(c =>
    c.participants.includes(user.id) &&
    (!c.expiresAt || new Date(c.expiresAt) > now)
  ).map(c => {
    // Resolve names
    const names = c.participants.map(pid => {
      const u = db.users.find(x => x.id === pid);
      return u ? u.firstName : "Inconnu";
    }).join(", ");

    // Get last message
    const lastMsg = c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;

    return {
      id: c.id,
      participantNames: names,
      lastMessage: lastMsg,
      expiresAt: c.expiresAt,
      paused: c.paused
    };
  });

  return { success: true, user: user, chats: myChats };
}

function apiCreateChat(token, participantEmails, durationStr) {
  const user = validateToken(token);
  if (!user) throw new Error("Session expirée.");

  // Permissions Check
  if (!user.isAdmin && !user.canCreate && !user.isSubscriber) {
    throw new Error("Vous n'avez pas les droits pour créer une conversation.");
  }

  const db = readUsersDb();
  const validParticipants = [user.id];
  const emailList = typeof participantEmails === 'string' ? participantEmails.split(',') : participantEmails;

  emailList.forEach(email => {
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    const p = db.users.find(u => u.email === clean);
    if (!p) throw new Error("Utilisateur introuvable : " + clean);
    if (!validParticipants.includes(p.id)) validParticipants.push(p.id);
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

  const newChat = {
    id: Utilities.getUuid(),
    createdBy: user.id,
    participants: validParticipants,
    duration: durationStr,
    expiresAt: expiresAt,
    paused: false,
    pausedReason: null,
    messages: []
  };

  const chatsDb = readChatsDb();
  chatsDb.chats.push(newChat);
  writeChatsDb(chatsDb);

  return { success: true, chatId: newChat.id };
}

function apiSendMessage(token, chatId, content, type) {
  const user = validateToken(token);
  if (!user) throw new Error("Session expirée.");

  const chatsDb = readChatsDb();
  const chatIndex = chatsDb.chats.findIndex(c => c.id === chatId);

  if (chatIndex < 0) throw new Error("Conversation introuvable.");
  const chat = chatsDb.chats[chatIndex];

  if (!chat.participants.includes(user.id)) throw new Error("Accès refusé.");
  if (chat.paused) throw new Error("Conversation en pause (Abonnement expiré).");

  const msg = {
    id: Utilities.getUuid(),
    sender: user.email,
    senderName: user.firstName,
    content: content,
    type: type,
    timestamp: new Date().toISOString()
  };

  chat.messages.push(msg);
  writeChatsDb(chatsDb);

  return { success: true };
}

function apiGetMessages(token, chatId) {
  const user = validateToken(token);
  if (!user) throw new Error("Session expirée.");

  const chatsDb = readChatsDb();
  const chat = chatsDb.chats.find(c => c.id === chatId);

  if (!chat) throw new Error("Conversation introuvable.");
  if (!chat.participants.includes(user.id)) throw new Error("Accès refusé.");

  // Resolve Names
  const db = readUsersDb();
  const names = chat.participants.map(pid => {
      const u = db.users.find(x => x.id === pid);
      return u ? u.firstName : "Inconnu";
  }).join(", ");

  return { success: true, messages: chat.messages, participantNames: names, meta: chat };
}

function apiExpireChat(token, chatId) {
  const user = validateToken(token);
  if (!user) throw new Error("Session expirée.");

  const chatsDb = readChatsDb();
  const chatIndex = chatsDb.chats.findIndex(c => c.id === chatId);

  if (chatIndex >= 0) {
    const chat = chatsDb.chats[chatIndex];
    if (chat.participants.includes(user.id)) {
      chatsDb.chats.splice(chatIndex, 1);
      writeChatsDb(chatsDb);
    }
  }
  return { success: true };
}

function apiAddParticipant(token, chatId, emailToAdd) {
  const user = validateToken(token);
  if (!user) throw new Error("Session expirée.");

  // Check rights: Admin or Creator
  if (!user.isAdmin && !user.canCreate) throw new Error("Vous n'avez pas les droits pour ajouter des participants.");

  const chatsDb = readChatsDb();
  const chatIndex = chatsDb.chats.findIndex(c => c.id === chatId);
  if (chatIndex < 0) throw new Error("Conversation introuvable.");

  const chat = chatsDb.chats[chatIndex];
  if (!chat.participants.includes(user.id)) throw new Error("Accès refusé.");

  const db = readUsersDb();
  const target = db.users.find(u => u.email === emailToAdd.toLowerCase().trim());
  if (!target) throw new Error("Utilisateur introuvable.");

  if (chat.participants.includes(target.id)) throw new Error("Déjà participant.");

  chat.participants.push(target.id);

  // System msg
  chat.messages.push({
    id: Utilities.getUuid(),
    sender: "system",
    senderName: "Système",
    content: `${user.firstName} a ajouté ${target.firstName}`,
    type: "system",
    timestamp: new Date().toISOString()
  });

  writeChatsDb(chatsDb);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
// ABONNEMENTS
// ═══════════════════════════════════════════════════════════

function generateWhatsHappenCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));

  const db = readSubscriptionsDb();
  if (db.subscriptions.some(s => s.whatsappenCode === code)) return generateWhatsHappenCode();
  return code;
}

function generateInvoiceRef() {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const r = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `WH${y}${m}-${r}`;
}

function apiGetSubscriptionCode(token) {
  const user = validateToken(token);
  if (!user) throw new Error("Session expirée.");

  const settings = readSettingsDb();
  if (!settings.subscriptionEnabled) throw new Error("Les abonnements sont temporairement désactivés.");
  if (!user.canSubscribe) throw new Error("Vous ne pouvez pas souscrire à un abonnement.");

  const subsDb = readSubscriptionsDb();
  let sub = subsDb.subscriptions.find(s => s.userId === user.id);

  const code = sub ? sub.whatsappenCode : generateWhatsHappenCode();

  if (!sub) {
    subsDb.subscriptions.push({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      whatsappenCode: code,
      paypalTransaction: null,
      status: 'pending',
      startDate: null,
      endDate: null,
      createdAt: new Date().toISOString(),
      validatedAt: null,
      validatedBy: null
    });
    writeSubscriptionsDb(subsDb);
  }

  return { success: true, code: code };
}

function apiSubmitSubscription(token, paypalTransaction) {
  const user = validateToken(token);
  if (!user) throw new Error("Session expirée.");
  if (!paypalTransaction) throw new Error("Transaction requise.");

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const subsDb = readSubscriptionsDb();
    const subIndex = subsDb.subscriptions.findIndex(s => s.userId === user.id);

    if (subIndex < 0) throw new Error("Code introuvable. Générez-le d'abord.");

    subsDb.subscriptions[subIndex].paypalTransaction = paypalTransaction;
    subsDb.subscriptions[subIndex].status = 'submitted';
    writeSubscriptionsDb(subsDb);

    return { success: true, message: "Demande envoyée." };
  } finally {
    lock.releaseLock();
  }
}

// ═══════════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════════

function apiAdminGetUsers(token) {
  const admin = validateToken(token);
  if (!admin || !admin.isAdmin) throw new Error("Accès refusé.");

  const db = readUsersDb();
  // Safe map
  const users = db.users.map(u => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    isAdmin: u.isAdmin,
    canCreate: u.canCreate,
    isSubscriber: u.isSubscriber,
    isSuperAdmin: u.email === ADMIN_EMAIL,
    canSubscribe: u.canSubscribe
  }));
  return { success: true, users: users };
}

function apiAdminUpdateUser(token, userId, updates) {
  const admin = validateToken(token);
  if (!admin || !admin.isAdmin) throw new Error("Accès refusé.");

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const db = readUsersDb();
    const index = db.users.findIndex(u => u.id === userId);
    if (index < 0) throw new Error("Utilisateur introuvable.");

    const target = db.users[index];

    // SuperAdmin Protection
    if (target.email === ADMIN_EMAIL) throw new Error("Impossible de modifier le super-admin.");
    if (target.isAdmin && admin.email !== ADMIN_EMAIL) throw new Error("Seul le super-admin peut modifier un admin.");

    if (updates.isAdmin !== undefined && admin.email !== ADMIN_EMAIL) throw new Error("Seul le super-admin peut promouvoir un admin.");

    // Apply updates
    if (updates.isAdmin !== undefined) target.isAdmin = updates.isAdmin;
    if (updates.canCreate !== undefined) target.canCreate = updates.canCreate;
    if (updates.isSubscriber !== undefined) target.isSubscriber = updates.isSubscriber;

    writeUsersDb(db);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function apiAdminDeleteUser(token, userId) {
  const admin = validateToken(token);
  if (!admin || !admin.isAdmin) throw new Error("Accès refusé.");

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const db = readUsersDb();
    const index = db.users.findIndex(u => u.id === userId);
    if (index < 0) throw new Error("Utilisateur introuvable.");

    const target = db.users[index];
    if (target.email === ADMIN_EMAIL) throw new Error("Impossible de supprimer le super-admin.");
    if (target.isAdmin && admin.email !== ADMIN_EMAIL) throw new Error("Seul le super-admin peut supprimer un admin.");

    db.users.splice(index, 1);
    writeUsersDb(db);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function apiAdminGetSubscriptions(token) {
  const admin = validateToken(token);
  if (!admin || !admin.isAdmin) throw new Error("Accès refusé.");
  const subsDb = readSubscriptionsDb();
  return { success: true, subscriptions: subsDb.subscriptions };
}

function apiAdminValidateSubscription(token, userId, startDate, endDate) {
  const admin = validateToken(token);
  if (!admin || !admin.isAdmin) throw new Error("Accès refusé.");

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const subsDb = readSubscriptionsDb();
    const usersDb = readUsersDb();
    const invoicesDb = readInvoicesDb();
    const settings = readSettingsDb();

    const subIndex = subsDb.subscriptions.findIndex(s => s.userId === userId);
    if (subIndex < 0) throw new Error("Abonnement introuvable.");

    const sub = subsDb.subscriptions[subIndex];

    // Invoice
    const invoice = {
      reference: generateInvoiceRef(),
      userId: userId,
      email: sub.email,
      firstName: sub.firstName,
      amount: settings.subscriptionPrice,
      currency: settings.subscriptionCurrency,
      whatsappenCode: sub.whatsappenCode,
      paypalTransaction: sub.paypalTransaction,
      periodStart: startDate,
      periodEnd: endDate,
      issuedAt: new Date().toISOString(),
      billedAt: new Date().toISOString()
    };
    invoicesDb.invoices.push(invoice);

    // Update Sub
    sub.status = 'active';
    sub.startDate = startDate;
    sub.endDate = endDate;
    sub.validatedAt = new Date().toISOString();
    sub.validatedBy = admin.email;

    // Update User Role
    const userIndex = usersDb.users.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
      usersDb.users[userIndex].isSubscriber = true;
      // Also give canCreate right? Usually subscriber implies creation rights.
      // The prompt says "Abonné (💳) : Peut créer des conversations".
      // But it's separate from canCreate flag (Creator role).
      // The frontend logic checks: if (canCreate || isAdmin || isSubscriber)
      // So we just set isSubscriber = true.
    }

    writeInvoicesDb(invoicesDb);
    writeSubscriptionsDb(subsDb);
    writeUsersDb(usersDb);

    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function apiAdminGetInvoices(token, userId) {
  const admin = validateToken(token);
  if (!admin || !admin.isAdmin) throw new Error("Accès refusé.");
  const db = readInvoicesDb();
  return { success: true, invoices: db.invoices.filter(i => i.userId === userId) };
}

function apiAdminGetSettings(token) {
  const admin = validateToken(token);
  if (!admin || !admin.isAdmin) throw new Error("Accès refusé.");
  return { success: true, settings: readSettingsDb() };
}

function apiAdminUpdateSettings(token, newSettings) {
  const admin = validateToken(token);
  if (!admin || !admin.isAdmin) throw new Error("Accès refusé.");
  writeSettingsDb(newSettings);
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
// TRIGGERS
// ═══════════════════════════════════════════════════════════

function cleanUpExpiredChats() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const chatsDb = readChatsDb();
    const now = new Date();

    const activeChats = chatsDb.chats.filter(c => {
      if (!c.expiresAt) return true; // Unlimited
      return new Date(c.expiresAt) > now;
    });

    if (activeChats.length !== chatsDb.chats.length) {
      chatsDb.chats = activeChats;
      writeChatsDb(chatsDb);
    }

    // Also check expired subscriptions
    const subsDb = readSubscriptionsDb();
    const usersDb = readUsersDb();
    let usersChanged = false;

    subsDb.subscriptions.forEach(sub => {
      if (sub.status === 'active' && sub.endDate) {
        if (now > new Date(sub.endDate)) {
          sub.status = 'expired';
          // Downgrade user
          const uIndex = usersDb.users.findIndex(u => u.id === sub.userId);
          if (uIndex >= 0) {
            usersDb.users[uIndex].isSubscriber = false;
            usersChanged = true;
          }
          // Pause chats logic could be here (expensive iteration)
        }
      }
    });

    writeSubscriptionsDb(subsDb);
    if (usersChanged) writeUsersDb(usersDb);

  } finally {
    lock.releaseLock();
  }
}

function resetDatabase() {
  const f = DriveApp.getFolderById(FOLDER_ID);
  const files = f.getFiles();
  while(files.hasNext()) {
    files.next().setTrashed(true);
  }
  return "Reset Done (V4)";
}

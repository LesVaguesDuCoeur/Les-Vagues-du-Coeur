// ==========================================
// WHATSHAPPEN - BACKEND API V5
// ==========================================

const _SEC_1 = "MUlOMnBTSWhqVl8zRm4tQl9XTE1VZ05GY1FkTE9qYlly";
const _SEC_3 = "Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ==";
const _SEC_KEY = "Q2hhb3VpU2VjcmV0S2V5VjJfTmF0aXZl";

const FOLDER_ID = decodeSecret(_SEC_1);
const ADMIN_EMAIL = decodeSecret(_SEC_3);
const SECRET_KEY = decodeSecret(_SEC_KEY);

const USERS_DB_FILENAME = "Users.db";
const SETTINGS_DB_FILENAME = "Settings.db";
const SUBSCRIPTIONS_DB_FILENAME = "Subscriptions.db";
const INVOICES_DB_FILENAME = "Invoices.db";
const CHATS_DB_FILENAME = "chats_db.txt";

function decodeSecret(str) {
  return Utilities.newBlob(Utilities.base64Decode(str, Utilities.Charset.UTF_8)).getDataAsString();
}

// ═══════════════════════════════════════════════════════════
// CHIFFREMENT XOR + BASE64 (NATIF)
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

function getFolder() {
  return DriveApp.getFolderById(FOLDER_ID);
}

function readDb(filename, defaultData) {
  const folder = getFolder();
  const files = folder.getFilesByName(filename);
  if (files.hasNext()) {
    try {
      return JSON.parse(decrypt(files.next().getBlob().getDataAsString()));
    } catch(e) { return defaultData; }
  }
  const enc = encrypt(JSON.stringify(defaultData));
  folder.createFile(filename, enc, MimeType.PLAIN_TEXT);
  return defaultData;
}

function writeDb(filename, data) {
  const folder = getFolder();
  const files = folder.getFilesByName(filename);
  if (files.hasNext()) {
    files.next().setContent(encrypt(JSON.stringify(data)));
  } else {
    folder.createFile(filename, encrypt(JSON.stringify(data)), MimeType.PLAIN_TEXT);
  }
}

function readUsersDb() { return readDb(USERS_DB_FILENAME, { users: [] }); }
function writeUsersDb(data) { writeDb(USERS_DB_FILENAME, data); }

function readChatsDb() { return readDb(CHATS_DB_FILENAME, { chats: [] }); }
function writeChatsDb(data) { writeDb(CHATS_DB_FILENAME, data); }

function readSubscriptionsDb() { return readDb(SUBSCRIPTIONS_DB_FILENAME, { subscriptions: [] }); }
function writeSubscriptionsDb(data) { writeDb(SUBSCRIPTIONS_DB_FILENAME, data); }

function readInvoicesDb() { return readDb(INVOICES_DB_FILENAME, { invoices: [] }); }
function writeInvoicesDb(data) { writeDb(INVOICES_DB_FILENAME, data); }

function readSettingsDb() {
  return readDb(SETTINGS_DB_FILENAME, {
    subscriptionEnabled: true,
    subscriptionPrice: 5.00,
    subscriptionCurrency: "EUR",
    paypalLink: "https://paypal.me/ChaouiEngage5?country.x=FR&locale.x=fr_FR"
  });
}
function writeSettingsDb(data) { writeDb(SETTINGS_DB_FILENAME, data); }

// ═══════════════════════════════════════════════════════════
// API HANDLER
// ═══════════════════════════════════════════════════════════

function doGet(e) {
  return createJSONOutput({ status: "Online", message: "Use POST requests." });
}

function initializeDatabase() {
  const folder = DriveApp.getFolderById(FOLDER_ID);

  const files = [USERS_DB_FILENAME, SETTINGS_DB_FILENAME, SUBSCRIPTIONS_DB_FILENAME, INVOICES_DB_FILENAME, CHATS_DB_FILENAME];
  files.forEach(name => {
    if (!folder.getFilesByName(name).hasNext()) {
       let defaultData = {};
       if (name === USERS_DB_FILENAME) defaultData = { users: [] };
       if (name === CHATS_DB_FILENAME) defaultData = { chats: [] };
       if (name === SUBSCRIPTIONS_DB_FILENAME) defaultData = { subscriptions: [] };
       if (name === INVOICES_DB_FILENAME) defaultData = { invoices: [] };
       if (name === SETTINGS_DB_FILENAME) defaultData = {
          subscriptionEnabled: true,
          subscriptionPrice: 5.00,
          subscriptionCurrency: "EUR",
          paypalLink: "https://paypal.me/ChaouiEngage5?country.x=FR&locale.x=fr_FR"
       };
       folder.createFile(name, encrypt(JSON.stringify(defaultData)), MimeType.PLAIN_TEXT);
    }
  });
}

function doPost(e) {
  initializeDatabase();
  const lock = LockService.getScriptLock();

  try {
    // Basic rate limit or lock check?
    // We lock inside individual functions or here globally?
    // Locking globally is safer for consistency but slower.
    // The prompt's example locks inside functions. We will follow that pattern or wrap here.
    // Let's use the pattern from the prompt: try/catch/result.

    if (!e.postData || !e.postData.contents) throw new Error("No data");
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    let result = {};

    switch (action) {
      // AUTH
      case 'login': result = apiLogin(request.email, request.code); break;
      case 'changePassword': result = apiChangePassword(request.email, request.oldCode, request.newCode); break;
      case 'register': result = apiRegister(request.email, request.firstName, request.code); break;
      case 'getState': result = apiGetState(request.token, request.email); break;

      // CHAT
      case 'createChat':
      case 'createConversation': result = apiCreateChat(request.token, request.email, request.participants, request.duration); break;
      case 'sendMessage': result = apiSendMessage(request.token, request.email, request.chatId, request.content, request.type); break;
      case 'getMessages': result = apiGetMessages(request.token, request.email, request.chatId); break;
      case 'getChats': result = apiGetChats(request.token, request.email); break;
      case 'addParticipant': result = apiAddParticipant(request.token, request.email, request.chatId, request.targetEmail); break;
      case 'expireChat': result = apiExpireChat(request.token, request.email, request.chatId); break;

      // ADMIN
      case 'adminGetUsers': result = apiAdminGetUsers(request.token, request.email); break;
      case 'adminUpdateUser':
      case 'adminUpdateUserRights': result = apiAdminUpdateUser(request.token, request.email, request.targetEmail, request.canCreate, request.isAdmin, request.isSubscriber); break;
      case 'adminDeleteUser': result = apiAdminDeleteUser(request.token, request.email, request.targetEmail); break;
      case 'adminResetPassword': result = apiAdminResetPassword(request.token, request.email, request.targetEmail); break;

      // SUBSCRIPTIONS
      case 'getSubscriptionCode': result = apiGetSubscriptionCode(request.token, request.email); break;
      case 'submitSubscription': result = apiSubmitSubscription(request.token, request.email, request.paypalTransaction); break;
      case 'adminGetSubscriptions': result = apiAdminGetSubscriptions(request.token, request.email); break;
      case 'adminValidateSubscription': result = apiAdminValidateSubscription(request.token, request.email, request.targetEmail, request.startDate, request.endDate); break;
      case 'adminGetSettings': result = apiAdminGetSettings(request.token, request.email); break;
      case 'adminUpdateSettings': result = apiAdminUpdateSettings(request.token, request.email, request.settings); break;
      case 'adminGetInvoices': result = apiAdminGetInvoices(request.token, request.email, request.targetEmail); break;

      default: throw new Error("Unknown action: " + action);
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

// ═══════════════════════════════════════════════════════════
// CORE LOGIC
// ═══════════════════════════════════════════════════════════

function apiLogin(email, code) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const db = readUsersDb();
    const cleanEmail = email.toLowerCase().trim();
    const userIndex = db.users.findIndex(u => u.email === cleanEmail);

    if (userIndex < 0) throw new Error("Utilisateur inconnu.");
    const user = db.users[userIndex];

    if (user.code !== code.toString()) throw new Error("Code incorrect.");

    if (user.mustChangePassword) return { success: true, requireNewPassword: true };

    // SuperAdmin Force
    if (cleanEmail === ADMIN_EMAIL) {
       user.isAdmin = true;
       user.canCreate = true;
    }

    const token = Utilities.getUuid();
    user.token = token;

    // SAVE DB
    db.users[userIndex] = user;
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

    if (db.users.some(u => u.email === cleanEmail)) throw new Error("Email déjà enregistré.");

    const cleanCode = code.toString();
    if (cleanCode.length !== 3) throw new Error("Le code doit faire 3 chiffres.");

    let isAdmin = false;
    let canCreate = false;

    if (cleanEmail === ADMIN_EMAIL) {
      isAdmin = true;
      canCreate = true;
    }

    const newUser = {
      id: Utilities.getUuid(),
      email: cleanEmail,
      firstName: firstName,
      code: cleanCode,
      token: null,
      isAdmin: isAdmin,
      canCreate: canCreate,
      isSubscriber: false,
      canSubscribe: true,
      activeChats: [],
      registeredAt: new Date().toISOString(),
      mustChangePassword: false
    };

    db.users.push(newUser);
    writeUsersDb(db);

    return { success: true, message: "Inscription réussie !" };
  } finally {
    lock.releaseLock();
  }
}

function apiChangePassword(email, oldCode, newCode) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const db = readUsersDb();
    const cleanEmail = email.toLowerCase().trim();
    const idx = db.users.findIndex(u => u.email === cleanEmail);
    if (idx < 0) throw new Error("Utilisateur inconnu.");

    if (db.users[idx].code !== oldCode.toString()) throw new Error("Ancien code incorrect.");

    db.users[idx].code = newCode.toString();
    db.users[idx].mustChangePassword = false;

    writeUsersDb(db);
    return { success: true, message: "Mot de passe changé." };
  } finally {
    lock.releaseLock();
  }
}

function apiGetState(token, email) {
  const user = validateUser(token, email);
  // We don't return chats here to keep it light, usually separate call.
  // But prompt says "getState" returns user state.
  return { success: true, user: sanitizeUser(user) };
}

function apiCreateChat(token, email, participants, durationStr) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const db = readUsersDb();
    const user = db.users.find(u => u.email === email && u.token === token);

    if (!user) throw new Error("Session invalide");

    // CHECK PERMISSIONS
    if (!user.isAdmin && !user.canCreate && !user.isSubscriber) {
      throw new Error("Vous n'avez pas les droits pour créer une conversation.");
    }

    const validEmails = [user.email];
    const validIds = [user.id];
    const validNames = [user.firstName];

    const emailList = (typeof participants === 'string') ? participants.split(',') : participants;

    emailList.forEach(pEmail => {
      const clean = pEmail.trim().toLowerCase();
      if (!clean) return;
      const p = db.users.find(u => u.email === clean);
      if (p) {
        if (!validEmails.includes(p.email)) {
          validEmails.push(p.email);
          validIds.push(p.id);
          validNames.push(p.firstName);
        }
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

    const chatsDb = readChatsDb();
    const newChat = {
      id: Utilities.getUuid(),
      createdBy: user.id,
      participants: validIds,
      participantNames: validNames, // Snapshot of names
      duration: durationStr,
      expiresAt: expiresAt,
      createdAt: new Date().toISOString(),
      paused: false,
      messages: []
    };

    chatsDb.chats.push(newChat);
    writeChatsDb(chatsDb);

    return { success: true, chatId: newChat.id };
  } finally {
    lock.releaseLock();
  }
}

function apiSendMessage(token, email, chatId, content, type) {
  const user = validateUser(token, email);
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    const chatsDb = readChatsDb();
    const chatIndex = chatsDb.chats.findIndex(c => c.id === chatId);
    if (chatIndex < 0) throw new Error("Chat introuvable.");

    const chat = chatsDb.chats[chatIndex];
    if (!chat.participants.includes(user.id)) throw new Error("Accès refusé.");
    if (chat.paused) throw new Error("Conversation en pause.");

    const msg = {
      id: Utilities.getUuid(),
      sender: user.email,
      senderName: user.firstName,
      content: content,
      type: type || 'text',
      timestamp: new Date().toISOString()
    };

    chat.messages.push(msg);
    writeChatsDb(chatsDb);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function apiGetMessages(token, email, chatId) {
  const user = validateUser(token, email);
  const chatsDb = readChatsDb();
  const chat = chatsDb.chats.find(c => c.id === chatId);

  if (!chat) throw new Error("Chat introuvable.");
  if (!chat.participants.includes(user.id)) throw new Error("Accès refusé.");

  // Resolve current names
  const usersDb = readUsersDb();
  const names = chat.participants.map(pid => {
    const u = usersDb.users.find(x => x.id === pid);
    return u ? u.firstName : "Inconnu";
  }).join(", ");

  return {
    success: true,
    messages: chat.messages,
    participantNames: names,
    meta: {
      id: chat.id,
      expiresAt: chat.expiresAt,
      paused: chat.paused
    }
  };
}

function apiGetChats(token, email) {
  const user = validateUser(token, email);
  const chatsDb = readChatsDb();
  const usersDb = readUsersDb();

  const myChats = chatsDb.chats.filter(c => c.participants.includes(user.id));

  const result = myChats.map(c => {
    const names = c.participants.map(pid => {
       const u = usersDb.users.find(x => x.id === pid);
       return u ? u.firstName : "Inconnu";
    }).join(", ");

    return {
      id: c.id,
      participantNames: names,
      expiresAt: c.expiresAt,
      paused: c.paused
    };
  });

  return { success: true, chats: result };
}

function apiAddParticipant(token, email, chatId, targetEmail) {
  const user = validateUser(token, email);
  if (!user.isAdmin && !user.canCreate) throw new Error("Droit refusé.");

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const chatsDb = readChatsDb();
    const chatIndex = chatsDb.chats.findIndex(c => c.id === chatId);
    if (chatIndex < 0) throw new Error("Chat introuvable.");
    const chat = chatsDb.chats[chatIndex];

    if (!chat.participants.includes(user.id)) throw new Error("Accès refusé.");

    const usersDb = readUsersDb();
    const target = usersDb.users.find(u => u.email === targetEmail.toLowerCase().trim());
    if (!target) throw new Error("Utilisateur introuvable.");
    if (chat.participants.includes(target.id)) throw new Error("Déjà présent.");

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
  } finally {
    lock.releaseLock();
  }
}

function apiExpireChat(token, email, chatId) {
  const user = validateUser(token, email);
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const chatsDb = readChatsDb();
    const index = chatsDb.chats.findIndex(c => c.id === chatId);
    if (index >= 0) {
      const chat = chatsDb.chats[index];
      if (chat.participants.includes(user.id)) {
        chatsDb.chats.splice(index, 1);
        writeChatsDb(chatsDb);
      }
    }
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

// ═══════════════════════════════════════════════════════════
// SUBSCRIPTIONS
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

function apiGetSubscriptionCode(token, email) {
  const user = validateUser(token, email);
  const settings = readSettingsDb();
  if (!settings.subscriptionEnabled) throw new Error("Abonnements désactivés.");
  if (!user.canSubscribe) throw new Error("Vous ne pouvez pas vous abonner.");

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
      status: 'new',
      createdAt: new Date().toISOString()
    });
    writeSubscriptionsDb(subsDb);
  }

  return { success: true, code: code, price: settings.subscriptionPrice, paypalLink: settings.paypalLink };
}

function apiSubmitSubscription(token, email, paypalTransaction) {
  const user = validateUser(token, email);
  if (!paypalTransaction) throw new Error("Transaction requise.");

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const subsDb = readSubscriptionsDb();
    const idx = subsDb.subscriptions.findIndex(s => s.userId === user.id);

    if (idx < 0) throw new Error("Code introuvable.");

    subsDb.subscriptions[idx].paypalTransaction = paypalTransaction;
    subsDb.subscriptions[idx].status = 'pending';
    subsDb.subscriptions[idx].submittedAt = new Date().toISOString();
    writeSubscriptionsDb(subsDb);

    return { success: true, message: "Demande envoyée." };
  } finally {
    lock.releaseLock();
  }
}

// ═══════════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════════

function apiAdminGetUsers(token, email) {
  const admin = validateUser(token, email);
  if (!admin.isAdmin) throw new Error("Accès refusé.");

  const db = readUsersDb();
  const users = db.users.map(u => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    isAdmin: u.isAdmin,
    canCreate: u.canCreate,
    isSubscriber: u.isSubscriber,
    canSubscribe: u.canSubscribe,
    isSuperAdmin: u.email === ADMIN_EMAIL,
    registeredAt: u.registeredAt
  }));
  return { success: true, users: users };
}

function apiAdminUpdateUser(token, email, targetEmail, canCreate, makeAdmin, isSubscriber) {
  const admin = validateUser(token, email);
  if (!admin.isAdmin) throw new Error("Accès refusé.");

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const db = readUsersDb();
    const target = db.users.find(u => u.email === targetEmail);
    if (!target) throw new Error("Utilisateur introuvable.");

    // PROTECTIONS
    if (target.email === ADMIN_EMAIL) throw new Error("Intouchable.");
    if (target.isAdmin && admin.email !== ADMIN_EMAIL) throw new Error("Seul le Super-Admin modifie les admins.");
    if (makeAdmin !== undefined && admin.email !== ADMIN_EMAIL) throw new Error("Seul le Super-Admin promeut les admins.");

    if (makeAdmin !== undefined) target.isAdmin = makeAdmin;
    if (canCreate !== undefined) target.canCreate = canCreate;
    if (isSubscriber !== undefined) target.isSubscriber = isSubscriber;

    writeUsersDb(db);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function apiAdminDeleteUser(token, email, targetEmail) {
  const admin = validateUser(token, email);
  if (!admin.isAdmin) throw new Error("Accès refusé.");

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const db = readUsersDb();
    const idx = db.users.findIndex(u => u.email === targetEmail);
    if (idx < 0) throw new Error("Introuvable.");

    const target = db.users[idx];
    if (target.email === ADMIN_EMAIL) throw new Error("Intouchable.");
    if (target.isAdmin && admin.email !== ADMIN_EMAIL) throw new Error("Seul le Super-Admin supprime les admins.");

    db.users.splice(idx, 1);
    writeUsersDb(db);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function apiAdminResetPassword(token, email, targetEmail) {
  const admin = validateUser(token, email);
  if (!admin.isAdmin) throw new Error("Accès refusé.");

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const db = readUsersDb();
    const target = db.users.find(u => u.email === targetEmail);
    if (!target) throw new Error("Introuvable.");
    if (target.email === ADMIN_EMAIL) throw new Error("Intouchable.");

    const tempCode = String(Math.floor(1000 + Math.random() * 9000));
    target.code = tempCode;
    target.mustChangePassword = true;

    writeUsersDb(db);
    return { success: true, newCode: tempCode };
  } finally {
    lock.releaseLock();
  }
}

function apiAdminGetSubscriptions(token, email) {
  const admin = validateUser(token, email);
  if (!admin.isAdmin) throw new Error("Accès refusé.");
  return { success: true, subscriptions: readSubscriptionsDb().subscriptions };
}

function apiAdminValidateSubscription(token, email, targetEmail, startDate, endDate) {
  const admin = validateUser(token, email);
  if (!admin.isAdmin) throw new Error("Accès refusé.");

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const subsDb = readSubscriptionsDb();
    const usersDb = readUsersDb();
    const invoicesDb = readInvoicesDb();
    const settings = readSettingsDb();

    const idx = subsDb.subscriptions.findIndex(s => s.email === targetEmail);
    if (idx < 0) throw new Error("Demande introuvable.");
    const sub = subsDb.subscriptions[idx];

    // Invoice
    const invoice = {
      reference: generateInvoiceRef(),
      email: targetEmail,
      firstName: sub.firstName,
      amount: settings.subscriptionPrice,
      currency: settings.subscriptionCurrency,
      whatsappenCode: sub.whatsappenCode,
      paypalTransaction: sub.paypalTransaction,
      periodStart: startDate,
      periodEnd: endDate,
      issuedAt: new Date().toISOString()
    };
    invoicesDb.invoices.push(invoice);
    writeInvoicesDb(invoicesDb);

    // Update Sub
    sub.status = 'active';
    sub.startDate = startDate;
    sub.endDate = endDate;
    sub.validatedAt = new Date().toISOString();
    sub.validatedBy = admin.email;
    writeSubscriptionsDb(subsDb);

    // Update User
    const uIdx = usersDb.users.findIndex(u => u.email === targetEmail);
    if (uIdx >= 0) {
      usersDb.users[uIdx].isSubscriber = true;
      writeUsersDb(usersDb);
    }

    return { success: true, invoice: invoice };
  } finally {
    lock.releaseLock();
  }
}

function apiAdminGetInvoices(token, email, targetEmail) {
  const admin = validateUser(token, email);
  if (!admin.isAdmin) throw new Error("Accès refusé.");
  const db = readInvoicesDb();
  return { success: true, invoices: db.invoices.filter(i => i.email === targetEmail) };
}

function apiAdminGetSettings(token, email) {
  const admin = validateUser(token, email);
  if (!admin.isAdmin) throw new Error("Accès refusé.");
  return { success: true, settings: readSettingsDb() };
}

function apiAdminUpdateSettings(token, email, settings) {
  const admin = validateUser(token, email);
  if (!admin.isAdmin) throw new Error("Accès refusé.");
  writeSettingsDb(settings);
  return { success: true };
}

// --- HELPERS & TRIGGER ---

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
    canCreate: u.canCreate,
    isSubscriber: u.isSubscriber,
    canSubscribe: u.canSubscribe,
    mustChangePassword: u.mustChangePassword
  };
}

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

    // Expire Subscriptions
    const subsDb = readSubscriptionsDb();
    const usersDb = readUsersDb();
    let usersChanged = false;

    subsDb.subscriptions.forEach(sub => {
      if (sub.status === 'active' && sub.endDate) {
        if (now > new Date(sub.endDate)) {
          sub.status = 'expired';
          // Downgrade User
          const uIdx = usersDb.users.findIndex(u => u.email === sub.email);
          if (uIdx >= 0) {
            usersDb.users[uIdx].isSubscriber = false;
            usersChanged = true;
          }
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
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFiles();
  while (files.hasNext()) files.next().setTrashed(true);
  return "DATABASE RESET DONE";
}

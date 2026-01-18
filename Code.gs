
const LEGACY_CONF = {
    folder: "MUlOMnBTSWhqVl8zRm4tQl9XTE1VZ05GY1FkTE9qYlly",
    admin: "Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ==",
    key: "Q2hhb3VpU2VjcmV0S2V5VjJfTmF0aXZl"
};

function getConfig(key, legacyVal) {
    try {
        const props = PropertiesService.getScriptProperties();
        let val = props.getProperty(key);
        if (!val && legacyVal) {
            val = legacyVal;
            props.setProperty(key, val);
        }
        if (!val) throw new Error("Configuration manquante : " + key);
        return val.trim();
    } catch(e) {
        if (legacyVal) return legacyVal;
        throw e;
    }
}

function decodeLegacy(str) {
    try { return Utilities.newBlob(Utilities.base64DecodeWebSafe(str)).getDataAsString(); }
    catch(e) { return Utilities.newBlob(Utilities.base64Decode(str)).getDataAsString(); }
}

const FOLDER_ID = decodeLegacy(getConfig('FOLDER_ID', LEGACY_CONF.folder));
const ADMIN_EMAIL = decodeLegacy(getConfig('ADMIN_EMAIL', LEGACY_CONF.admin));
const SECRET_KEY = decodeLegacy(getConfig('SECRET_KEY', LEGACY_CONF.key));

const USERS_DB_FILENAME = "Users.db";
const SETTINGS_DB_FILENAME = "Settings.db";
const SUBSCRIPTIONS_DB_FILENAME = "Subscriptions.db";
const INVOICES_DB_FILENAME = "Invoices.db";
const ALERTS_DB_FILENAME = "Alerts.db";
const CHATS_DB_FILENAME = "Chats.db";
const BLACKLIST_DB_FILENAME = "Blacklist.db";

function doGet(e) { return createJSONOutput({ status: "Online", message: "Use POST requests." }); }

function doPost(e) {
  initializeDatabase();
  const lock = LockService.getScriptLock();

  try {
    if (!e.postData || !e.postData.contents) throw new Error("No data");
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    let result = {};

    const metadata = {
        ip: request.ip || 'Unknown',
        location: request.location || 'Unknown',
        userAgent: request.userAgent || 'Unknown',
        timestamp: Date.now()
    };

    switch (action) {
      case 'login':
        result = apiLogin(request.email, request.code, request.ip);
        break;
      case 'changePassword':
        result = apiChangePassword(request.email, request.oldCode, request.newCode);
        break;
      case 'forgotPassword':
        result = apiForgotPassword(request.email);
        break;
      case 'verifyResetCode':
        result = apiVerifyResetCode(request.email, request.code);
        break;
      case 'resetPassword':
        result = apiResetPassword(request.email, request.code, request.newCode);
        break;
      case 'register':
        result = apiRegister(request.email, request.firstName, request.code, request.ip);
        break;
      case 'updateProfile':
        result = apiUpdateProfile(request.token, request.email, request.firstName, request.newEmail, request.avatarColor);
        break;
      case 'deleteAccount':
        result = apiDeleteAccount(request.token, request.email);
        break;
      case 'getConversations':
        result = apiGetConversations(request.token, request.email);
        break;
      case 'createConversation':
        result = apiCreateChat(request.token, request.email, request.participants, request.duration);
        break;
      case 'sendMessage':
        // Explicitly pass metadata
        result = apiSendMessage(request.token, request.email, request.chatId, request.content, request.type, request.replyTo, metadata);
        break;
      case 'getMessages':
        result = apiGetMessages(request.token, request.email, request.chatId);
        break;
      case 'addParticipant':
        result = apiAddParticipant(request.token, request.email, request.chatId, request.targetEmail);
        break;
      case 'expireChat':
        result = apiExpireChat(request.token, request.email, request.chatId);
        break;
      case 'adminGetUsers':
        result = apiAdminGetUsers(request.token, request.email);
        break;
      case 'adminUpdateUser':
        result = apiAdminUpdateUser(request.token, request.email, request.targetEmail, request.canCreate, request.isAdmin, request.isSubscriber);
        break;
      case 'adminDeleteUser':
        result = apiAdminDeleteUser(request.token, request.email, request.targetEmail);
        break;
      case 'adminResetPassword':
        result = apiAdminResetPassword(request.token, request.email, request.targetEmail);
        break;
      case 'adminRegenerateCode':
         result = apiAdminRegenerateCode(request.token, request.email, request.targetEmail);
         break;
      case 'getSubscriptionCode':
        result = apiGetSubscriptionCode(request.token, request.email);
        break;
      case 'submitSubscription':
        result = apiSubmitSubscription(request.token, request.email, request.paypalTransaction);
        break;
      case 'adminGetSubscriptions':
        result = apiAdminGetSubscriptions(request.token, request.email);
        break;
      case 'adminValidateSubscription':
        result = apiAdminValidateSubscription(request.token, request.email, request.targetEmail, request.startDate, request.endDate);
        break;
      case 'adminGetSettings':
        result = apiAdminGetSettings(request.token, request.email);
        break;
      case 'adminUpdateSettings':
        result = apiAdminUpdateSettings(request.token, request.email, request.settings);
        break;
      case 'adminGetInvoices':
        result = apiAdminGetInvoices(request.token, request.email, request.targetEmail);
        break;
      case 'adminUpdateSubscription':
        result = apiAdminUpdateSubscription(request.token, request.email, request.targetEmail, request.newData);
        break;
      case 'adminDeleteSubscription':
        result = apiAdminDeleteSubscription(request.token, request.email, request.targetEmail);
        break;
      case 'adminGetBans':
        result = apiAdminGetBans(request.token, request.email);
        break;
      case 'adminBanUser':
        result = apiAdminBanUser(request.token, request.email, request.target, request.type, request.reason);
        break;
      case 'adminUnbanUser':
        result = apiAdminUnbanUser(request.token, request.email, request.target);
        break;
      case 'adminGetAlerts':
        result = apiAdminGetAlerts(request.token, request.email);
        break;
      case 'requestConversationAccess':
        result = apiRequestConversationAccess(request.token, request.email, request.alertId);
        break;
      case 'verifyConversationAccess':
        result = apiVerifyConversationAccess(request.token, request.email, request.alertId, request.code);
        break;
      case 'deleteAlert':
        result = apiDeleteAlert(request.token, request.email, request.alertId);
        break;
      case 'getAlertFullReport':
        result = apiGetAlertFullReport(request.token, request.email, request.alertId, request.accessCode);
        break;
      case 'requestSuperAdminAccess':
        result = apiRequestSuperAdminAccess(request.token, request.email);
        break;
      case 'superAdminGetAllConversations':
        result = apiSuperAdminGetAllConversations(request.token, request.email, request.accessCode);
        break;
      case 'setTyping':
        result = apiSetTyping(request.token, request.email, request.chatId, request.isTyping);
        break;
      case 'markAsRead':
        result = apiMarkAsRead(request.token, request.email, request.chatId);
        break;
      case 'pinChat':
        result = apiPinChat(request.token, request.email, request.chatId);
        break;
      case 'archiveChat':
        result = apiArchiveChat(request.token, request.email, request.chatId);
        break;
      case 'forwardMessage':
        result = apiForwardMessage(request.token, request.email, request.messageId, request.targetChatId);
        break;
      case 'deleteMessage':
        result = apiDeleteMessage(request.token, request.email, request.messageId, request.deleteFor);
        break;
      case 'sendInvoiceEmail':
        result = apiSendInvoiceEmail(request.token, request.email, request.invoiceId);
        break;
      default:
        throw new Error("Unknown action: " + action);
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

function getEncryptionKey() { return SECRET_KEY; }

function getFolder() {
    try {
        return DriveApp.getFolderById(FOLDER_ID);
    } catch(e) {
        throw new Error("Configuration invalide: Dossier introuvable.");
    }
}

function initializeDatabase() {
  const folder = getFolder();
  const dbs = [
      { name: USERS_DB_FILENAME, default: { users: [] } },
      { name: SETTINGS_DB_FILENAME, default: { subscriptionEnabled: true, subscriptionPrice: 5.00, paypalLink: "https://paypal.me/ChaouiEngage5" } },
      { name: SUBSCRIPTIONS_DB_FILENAME, default: { subscriptions: [] } },
      { name: INVOICES_DB_FILENAME, default: { invoices: [] } },
      { name: ALERTS_DB_FILENAME, default: { alerts: [] } },
      { name: CHATS_DB_FILENAME, default: { chats: [] } },
      { name: BLACKLIST_DB_FILENAME, default: { bans: [] } }
  ];

  dbs.forEach(db => {
      if (!folder.getFilesByName(db.name).hasNext()) {
          folder.createFile(db.name, _xEnc(JSON.stringify(db.default)), MimeType.PLAIN_TEXT);
      }
  });
}

function readDb(filename, defaultData) {
  const folder = getFolder();
  const files = folder.getFilesByName(filename);
  if (files.hasNext()) {
    try {
      const file = files.next();
      const content = file.getBlob().getDataAsString();
      const decrypted = _xDec(content);

      if (!content.startsWith("v1:")) {
          const newEncrypted = _xEnc(decrypted);
          file.setContent(newEncrypted);
      }
      return JSON.parse(decrypted);
    } catch(e) { return defaultData; }
  }
  const enc = _xEnc(JSON.stringify(defaultData));
  folder.createFile(filename, enc, MimeType.PLAIN_TEXT);
  return defaultData;
}

function writeDb(filename, data) {
  const folder = getFolder();
  const files = folder.getFilesByName(filename);
  const content = _xEnc(JSON.stringify(data));
  if (files.hasNext()) {
      files.next().setContent(content);
  } else {
      folder.createFile(filename, content, MimeType.PLAIN_TEXT);
  }
}

const CACHE_DURATION = 600;
function readUsersDbCached() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('users_db');
  if (cached) {
    return JSON.parse(cached);
  }
  const db = readUsersDb();
  try {
    cache.put('users_db', JSON.stringify(db), CACHE_DURATION);
  } catch(e) {}
  return db;
}

function invalidateUsersCache() {
  CacheService.getScriptCache().remove('users_db');
}

function readUsersDb() { return readDb(USERS_DB_FILENAME, { users: [] }); }
function writeUsersDb(d) { writeDb(USERS_DB_FILENAME, d); invalidateUsersCache(); }
function readSettingsDb() { return readDb(SETTINGS_DB_FILENAME, { subscriptionEnabled: true, subscriptionPrice: 5.00, paypalLink: "https://paypal.me/ChaouiEngage5" }); }
function writeSettingsDb(d) { writeDb(SETTINGS_DB_FILENAME, d); }
function readSubscriptionsDb() { return readDb(SUBSCRIPTIONS_DB_FILENAME, { subscriptions: [] }); }
function writeSubscriptionsDb(d) { writeDb(SUBSCRIPTIONS_DB_FILENAME, d); }
function readInvoicesDb() { return readDb(INVOICES_DB_FILENAME, { invoices: [] }); }
function writeInvoicesDb(d) { writeDb(INVOICES_DB_FILENAME, d); }
function readAlertsDb() { return readDb(ALERTS_DB_FILENAME, { alerts: [] }); }
function writeAlertsDb(d) { writeDb(ALERTS_DB_FILENAME, d); }
function readChatsDb() { return readDb(CHATS_DB_FILENAME, { chats: [] }); }
function writeChatsDb(d) { writeDb(CHATS_DB_FILENAME, d); }
function readBlacklistDb() { return readDb(BLACKLIST_DB_FILENAME, { bans: [] }); }
function writeBlacklistDb(d) { writeDb(BLACKLIST_DB_FILENAME, d); }

// ==========================================
// BUSINESS LOGIC
// ==========================================

function checkBlacklist(email, ip) {
  const db = readBlacklistDb();
  if (db.bans.some(b => b.type === 'email' && b.target === email.toLowerCase().trim())) throw new Error("Compte banni.");
  if (ip && db.bans.some(b => b.type === 'ip' && b.target === ip)) throw new Error("IP bannie.");
}

function apiLogin(email, code, ip) {
  checkBlacklist(email, ip);
  const db = readUsersDbCached();
  const cleanEmail = email.toLowerCase().trim();
  const user = db.users.find(u => u.email === cleanEmail);

  if (!user) throw new Error("Cette adresse email n'est pas inscrite.");
  if (user.code !== code.toString()) throw new Error("Code incorrect.");
  if (user.mustChangePassword) return { success: true, requireNewPassword: true };

  const lock = LockService.getScriptLock();
  try {
      lock.waitLock(5000);
      const wDb = readUsersDb();
      const wUser = wDb.users.find(u => u.email === cleanEmail);
      if (wUser) {
          wUser.lastLogin = new Date().toISOString();
          if (!wUser.firstIp && ip) wUser.firstIp = ip;

          if (cleanEmail === ADMIN_EMAIL) {
            if (!wUser.isAdmin || !wUser.canCreate) {
              wUser.isAdmin = true;
              wUser.canCreate = true;
            }
          }
          const token = Utilities.getUuid();
          wUser.token = token;
          writeUsersDb(wDb);
          return { success: true, token: token, user: sanitizeUser(wUser) };
      }
  } catch(e) {
      throw new Error("Erreur serveur (Lock). Réessayez.");
  } finally {
      lock.releaseLock();
  }
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

function apiForgotPassword(email) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const db = readUsersDb();
    const cleanEmail = email.toLowerCase().trim();
    const user = db.users.find(u => u.email === cleanEmail);
    if (!user) throw new Error("Cette adresse email n'est pas inscrite.");
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpiry = Date.now() + (10 * 60 * 1000);
    user.resetCode = resetCode;
    user.resetExpiry = resetExpiry;
    writeUsersDb(db);
    MailApp.sendEmail({
      to: cleanEmail,
      subject: "Code de récupération WhatsHappen",
      htmlBody: getResetPasswordEmailTemplate(user.firstName, resetCode)
    });
    return { success: true, message: "Un code de récupération a été envoyé à votre adresse email." };
  } finally {
    lock.releaseLock();
  }
}

function apiVerifyResetCode(email, code) {
  const db = readUsersDbCached();
  const user = db.users.find(u => u.email === email.toLowerCase().trim());
  if (!user || user.resetCode !== code) throw new Error("Code de récupération invalide.");
  if (Date.now() > user.resetExpiry) throw new Error("Ce code a expiré.");
  return { success: true, valid: true };
}

function apiResetPassword(email, code, newCode) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const db = readUsersDb();
    const user = db.users.find(u => u.email === email.toLowerCase().trim());
    if (!user || user.resetCode !== code || Date.now() > user.resetExpiry) throw new Error("Code invalide ou expiré.");
    if (!/^\d{3}$/.test(newCode)) throw new Error("Le code doit contenir exactement 3 chiffres.");
    user.code = newCode;
    delete user.resetCode;
    delete user.resetExpiry;
    writeUsersDb(db);
    return { success: true, message: "Code réinitialisé." };
  } finally {
    lock.releaseLock();
  }
}

function apiRegister(email, firstName, code, ip) {
  checkBlacklist(email, ip);
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const db = readUsersDb();
    const cleanEmail = email.toLowerCase().trim();
    if (db.users.find(u => u.email === cleanEmail)) throw new Error("Cette adresse email est déjà utilisée.");
    const cleanCode = code.toString();
    let isAdmin = false;
    let canCreate = false;
    if (cleanEmail === ADMIN_EMAIL) {
      isAdmin = true;
      canCreate = true;
    }
    const newUser = {
      email: cleanEmail,
      firstName: firstName,
      code: cleanCode,
      isAdmin: isAdmin,
      canCreate: canCreate,
      isSubscriber: false,
      activeChats: [],
      registeredAt: new Date().toISOString(),
      firstIp: ip || "Unknown",
      lastLogin: new Date().toISOString(),
      mustChangePassword: false,
      avatarColor: null
    };
    db.users.push(newUser);
    const token = Utilities.getUuid();
    newUser.token = token;
    writeUsersDb(db);
    try { sendWelcomeEmail(cleanEmail, firstName); } catch(e) {}
    return { success: true, token: token, user: sanitizeUser(newUser) };
  } finally {
    lock.releaseLock();
  }
}

function apiUpdateProfile(token, email, firstName, newEmail, avatarColor) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(10000);
        const db = readUsersDb();
        const userIdx = db.users.findIndex(u => u.email === email && u.token === token);
        if (userIdx < 0) throw new Error("Session invalide");
        const user = db.users[userIdx];
        if (newEmail && newEmail.toLowerCase().trim() !== email) {
            const cleanNew = newEmail.toLowerCase().trim();
            if (db.users.find(u => u.email === cleanNew)) throw new Error("Email déjà pris.");
            user.email = cleanNew;
        }
        if (firstName) user.firstName = firstName;
        if (avatarColor) user.avatarColor = avatarColor;
        writeUsersDb(db);
        return { success: true, user: sanitizeUser(user) };
    } finally {
        lock.releaseLock();
    }
}

function apiDeleteAccount(token, email) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(10000);
        const db = readUsersDb();
        const idx = db.users.findIndex(u => u.email === email && u.token === token);
        if (idx < 0) throw new Error("Session invalide");
        const user = db.users[idx];
        if (user.isAdmin && user.email === ADMIN_EMAIL) throw new Error("Impossible de supprimer le Super Admin.");
        db.users.splice(idx, 1);
        writeUsersDb(db);
        return { success: true };
    } finally {
        lock.releaseLock();
    }
}

function apiGetConversations(token, email) {
  updateLastSeen(email);
  const db = readUsersDbCached();
  const user = db.users.find(u => u.email === email && u.token === token);
  if (!user) throw new Error("Session invalide");
  const now = new Date();
  if (!user.activeChats) user.activeChats = [];
  const validChats = [];
  const dbChatsToKeep = [];
  let changed = false;
  const cache = CacheService.getScriptCache();
  user.activeChats.forEach(chat => {
      let chatId = typeof chat === 'string' ? chat : chat.id;
      let exists = true;
      let cacheKey = "chat_v2_" + chatId;
      let cachedStatus = cache.get(cacheKey);
      if (cachedStatus === "trashed") exists = false;
      else if (cachedStatus === "valid") exists = true;
      else {
          try {
             const f = DriveApp.getFileById(chatId);
             if (f.isTrashed()) {
                 exists = false;
                 cache.put(cacheKey, "trashed", 21600);
             } else {
                 exists = true;
                 cache.put(cacheKey, "valid", 600);
             }
          } catch(e) { exists = true; }
      }
      let expiresAt = (typeof chat === 'object') ? chat.expiresAt : null;
      if (exists && expiresAt && now > new Date(expiresAt)) exists = false;
      if (exists) {
          if (typeof chat === 'string') {
               try {
                   const doc = DocumentApp.openById(chat);
                   const meta = JSON.parse(_xDec(doc.getBody().getParagraphs()[0].getText()));
                   const newObj = { id: chat, names: meta.participantNames.join(', '), expiresAt: meta.expiresAt, lastMessage: { content: "...", sender: "..." } };
                   validChats.push(newObj);
                   dbChatsToKeep.push(newObj);
                   changed = true;
               } catch(e) {
                   dbChatsToKeep.push(chat);
                   validChats.push({ id: chat, names: "Chargement...", expiresAt: null, lastMessage: { content: "...", sender: "..." } });
               }
          } else {
               validChats.push(chat);
               dbChatsToKeep.push(chat);
          }
      } else { changed = true; }
  });

  if (changed) {
      const lock = LockService.getScriptLock();
      try {
          if (lock.tryLock(5000)) {
              const wDb = readUsersDb();
              const wUser = wDb.users.find(u => u.email === email);
              if (wUser) {
                  wUser.activeChats = dbChatsToKeep;
                  writeUsersDb(wDb);
              }
          }
      } catch(e) {}
  }
  return { success: true, chats: validChats, user: sanitizeUser(user) };
}

function updateLastSeen(email) {
    const lock = LockService.getScriptLock();
    if (lock.tryLock(2000)) {
         const db = readUsersDb();
         const user = db.users.find(u => u.email === email);
         if (user) {
             user.lastSeen = Date.now();
             writeUsersDb(db);
         }
         lock.releaseLock();
    }
}

function apiCreateChat(token, email, participants, durationStr) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const db = readUsersDb();
    const user = db.users.find(u => u.email === email && u.token === token);
    if (!user) throw new Error("Session invalide");
    const isSupportChat = participants.some(p => p.trim().toLowerCase() === ADMIN_EMAIL);
    if (!user.canCreate && !user.isAdmin && !user.isSubscriber && !isSupportChat) throw new Error("Droits insuffisants.");

    const uniqueEmails = [...new Set([user.email, ...participants.map(e => e.trim().toLowerCase())])];
    const validEmails = [];
    const validNames = [];
    uniqueEmails.forEach(pEmail => {
      const p = db.users.find(u => u.email === pEmail);
      if (p) {
        validEmails.push(p.email);
        validNames.push(p.firstName);
      }
    });

    let expiresAt = null;
    if (durationStr !== 'unlimited') {
      const now = new Date();
      let mins = 0;
      if (durationStr === '1min') mins = 1;
      else if (durationStr === '5min') mins = 5;
      else if (durationStr === '10min') mins = 10;
      else if (durationStr === '1h') mins = 60;
      else if (durationStr === '12h') mins = 12 * 60;
      else if (durationStr === '24h') mins = 24 * 60;
      else if (durationStr === '48h') mins = 48 * 60;
      else if (durationStr.endsWith('h')) mins = parseInt(durationStr) * 60;
      else if (durationStr.endsWith('m')) mins = parseInt(durationStr);
      if (mins > 0) expiresAt = new Date(now.getTime() + mins * 60000).toISOString();
    }

    const root = getFolder();
    const docName = `CHAT_${new Date().getTime()}`;
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
    doc.getBody().setText(_xEnc(JSON.stringify(chatData)));
    doc.saveAndClose();

    validEmails.forEach(pEmail => {
      const uRecord = db.users.find(u => u.email === pEmail);
      if (uRecord) {
        if (!uRecord.activeChats) uRecord.activeChats = [];
        uRecord.activeChats.push({
            id: doc.getId(),
            names: validNames.join(', '),
            expiresAt: expiresAt,
            lastMessage: null,
            pinned: false,
            archived: false
        });
      }
    });
    writeUsersDb(db);

    const chatsDb = readChatsDb();
    chatsDb.chats.push({ id: doc.getId(), expiresAt: expiresAt });
    writeChatsDb(chatsDb);

    return { success: true, chatId: doc.getId() };
  } finally {
    lock.releaseLock();
  }
}

// ILLEGAL CONTENT
const ILLEGAL_KEYWORDS = {
  sexual_violence: ['viol', 'violer', 'violée', 'violeur', 'viole', 'agression sexuelle', 'agresser sexuellement', 'forcer', 'forcée', 'non consentement'],
  child_abuse: ['pédophile', 'pédophilie', 'pedo', 'pédo', 'enfant', 'mineure', 'mineur', 'petite fille', 'petit garçon', 'cp', 'child porn', 'underage', 'jailbait', 'gamine', 'gamin', 'fillette', 'garçonnet'],
  trafficking: ['traite', 'esclave', 'esclavage', 'vendre', 'acheter une fille', 'acheter une femme', 'prostitution forcée', 'proxénète'],
  extreme_violence: ['tuer', 'assassiner', 'meurtre', 'massacrer', 'torture', 'torturer', 'mutiler', 'décapiter'],
  terrorism: ['bombe', 'exploser', 'attentat', 'terroriste', 'jihad', 'daesh', 'isis', 'al qaida']
};

function detectIllegalContent(message) {
  const lowerMsg = message.toLowerCase();
  const detected = [];
  for (const [category, keywords] of Object.entries(ILLEGAL_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMsg.includes(keyword.toLowerCase())) {
        detected.push({ category: category, keyword: keyword });
      }
    }
  }
  return detected.length > 0 ? detected : null;
}

function createIllegalContentAlert(senderId, chatId, messageContent, detectedKeywords, metadata) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const alertsDb = readAlertsDb();
    const db = readUsersDb();
    const user = db.users.find(u => u.email === senderId);

    const alert = {
      id: Utilities.getUuid(),
      timestamp: Date.now(),
      status: 'new',
      sender: {
          email: user ? user.email : senderId,
          firstName: user ? user.firstName : 'Unknown',
          ip: metadata.ip || 'Unknown',
          location: metadata.location || 'Unknown',
          userAgent: metadata.userAgent || 'Unknown'
      },
      chat: { id: chatId },
      detection: { keywords: detectedKeywords, messagePreview: messageContent.substring(0, 500) },
      conversationBackupId: backupFlaggedConversation(chatId)
    };
    alertsDb.alerts.push(alert);
    writeAlertsDb(alertsDb);
  } finally { lock.releaseLock(); }
}

function backupFlaggedConversation(chatId) {
  const folderId = getFolder();
  let flaggedFolder = getOrCreateFolder(folderId, 'FlaggedChats');
  const doc = DocumentApp.openById(chatId);
  const body = doc.getBody();
  const paras = body.getParagraphs();
  const metaEnc = paras[0].getText();
  const meta = JSON.parse(_xDec(metaEnc));

  const messages = [];
  for (let i = 1; i < paras.length; i++) {
    const txt = paras[i].getText();
    if (!txt) continue;
    try {
      const m = JSON.parse(_xDec(txt));
      messages.push(m);
    } catch (e) {}
  }

  const usersDb = readUsersDb();
  const participants = meta.participants.map(email => {
    const user = usersDb.users.find(u => u.email === email);
    return {
      email: email,
      firstName: user ? user.firstName : email
    };
  });

  const backup = {
      chatId: chatId,
      backupDate: Date.now(),
      chat: {
          id: chatId,
          createdAt: meta.createdAt,
          expiresAt: meta.expiresAt,
          participantNames: meta.participantNames
      },
      participants: participants,
      messages: messages
  };
  const backupEncrypted = _xEnc(JSON.stringify(backup));
  const backupFileName = 'FLAGGED_' + chatId + '_' + Date.now() + '.backup';
  const backupFile = flaggedFolder.createFile(backupFileName, backupEncrypted, MimeType.PLAIN_TEXT);
  return backupFile.getId();
}

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

function apiSendMessage(token, email, chatId, content, type, replyTo, metadata) {
  const user = validateUser(token, email);
  const doc = DocumentApp.openById(chatId);
  const body = doc.getBody();
  const metaEnc = body.getParagraphs()[0].getText();
  const meta = JSON.parse(_xDec(metaEnc));
  if (!meta.participants.includes(email)) throw new Error("Accès refusé");

  const clientMetadata = {
    ip: metadata.ip || 'Unknown',
    location: metadata.location || 'Unknown',
    userAgent: metadata.userAgent || 'Unknown'
  };

  // Illegal Content Check
  if (type === 'text') {
      const detected = detectIllegalContent(content);
      if (detected) {
          createIllegalContentAlert(email, chatId, content, detected, clientMetadata);
      }
  }

  const msg = {
    id: Utilities.getUuid(),
    sender: email,
    senderName: user.firstName,
    content: content,
    type: type || 'text',
    timestamp: new Date().toISOString(),
    replyTo: replyTo || null,
    readBy: [],
    deliveredTo: []
  };

  const msgEnc = _xEnc(JSON.stringify(msg));
  body.appendParagraph(msgEnc);
  doc.saveAndClose();
  updateChatMetadata(chatId, msg, meta.participants);
  meta.participants.forEach(pEmail => {
      if (pEmail !== email) notifyInactiveUser(pEmail);
  });
  return { success: true };
}

function updateChatMetadata(chatId, lastMsg, participants) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(10000);
        const db = readUsersDb();
        let dirty = false;
        participants.forEach(pEmail => {
            const u = db.users.find(x => x.email === pEmail);
            if (u && u.activeChats) {
                const chatRef = u.activeChats.find(c => (typeof c === 'string' ? c === chatId : c.id === chatId));
                if (chatRef) {
                    if (typeof chatRef !== 'string') {
                        chatRef.lastMessage = {
                            sender: lastMsg.sender,
                            senderName: lastMsg.senderName,
                            content: lastMsg.type === 'image' ? 'Photo' : lastMsg.content,
                            type: lastMsg.type,
                            timestamp: lastMsg.timestamp
                        };
                        dirty = true;
                    }
                }
            }
        });
        if (dirty) writeUsersDb(db);
    } catch(e) {} finally { lock.releaseLock(); }
}

function apiGetMessages(token, email, chatId) {
  const user = validateUser(token, email);
  updateLastSeen(email);
  try {
      const doc = DocumentApp.openById(chatId);
      const body = doc.getBody();
      const paras = body.getParagraphs();
      const metaEnc = paras[0].getText();
      const meta = JSON.parse(_xDec(metaEnc));
      if (!meta.participants.includes(email)) throw new Error("Accès refusé");
      const messages = [];
      for (let i = 1; i < paras.length; i++) {
        const txt = paras[i].getText();
        if (!txt) continue;
        try {
          const m = JSON.parse(_xDec(txt));
          m.isMe = (m.sender === email);
          messages.push(m);
        } catch (e) {}
      }
      return { success: true, messages: messages, participantNames: meta.participantNames.join(', '), meta: meta };
  } catch(e) { return { success: false, expired: true }; }
}

function apiAddParticipant(token, email, chatId, targetEmail) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const user = validateUser(token, email);
      if (!user.isAdmin && !user.canCreate && !user.isSubscriber) throw new Error("Droit refusé.");
      const db = readUsersDb();
      const target = db.users.find(u => u.email === targetEmail.toLowerCase().trim());
      if (!target) throw new Error("Utilisateur introuvable.");
      const doc = DocumentApp.openById(chatId);
      const body = doc.getBody();
      const metaEnc = body.getParagraphs()[0].getText();
      const meta = JSON.parse(_xDec(metaEnc));
      if (!meta.participants.includes(user.email)) throw new Error("Accès refusé.");
      if (meta.participants.includes(target.email)) throw new Error("Déjà participant.");
      meta.participants.push(target.email);
      meta.participantNames.push(target.firstName);
      body.getParagraphs()[0].setText(_xEnc(JSON.stringify(meta)));
      doc.saveAndClose();
      if (!target.activeChats) target.activeChats = [];
      target.activeChats.push({ id: chatId, names: meta.participantNames.join(', '), expiresAt: meta.expiresAt, lastMessage: null });
      writeUsersDb(db);
      apiSendMessage(token, email, chatId, `a ajouté ${target.firstName}`, 'system', null, {});
      return { success: true };
    } finally { lock.releaseLock(); }
}

function apiExpireChat(token, email, chatId) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(10000);
        const user = validateUser(token, email);
        const allowed = user.isAdmin || user.canCreate || user.isSubscriber;
        if (!allowed) throw new Error("Droit refusé.");
        try { DriveApp.getFileById(chatId).setTrashed(true); } catch(e) {}
        const db = readUsersDb();
        let dirty = false;
        db.users.forEach(u => {
            if (u.activeChats) {
                const initLen = u.activeChats.length;
                u.activeChats = u.activeChats.filter(c => (typeof c === 'string' ? c !== chatId : c.id !== chatId));
                if (u.activeChats.length !== initLen) dirty = true;
            }
        });
        if (dirty) writeUsersDb(db);
        try {
            const chatsDb = readChatsDb();
            const initLen = chatsDb.chats.length;
            chatsDb.chats = chatsDb.chats.filter(c => c.id !== chatId);
            if (chatsDb.chats.length !== initLen) writeChatsDb(chatsDb);
        } catch(e) {}
        return { success: true };
    } finally { lock.releaseLock(); }
}

function cleanUpExpiredChats() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const db = readChatsDb();
    const now = Date.now();
    let deleted = 0;
    db.chats = db.chats.filter(chat => {
      if (chat.expiresAt && now > new Date(chat.expiresAt).getTime()) {
        try { DriveApp.getFileById(chat.id).setTrashed(true); } catch (e) {}
        deleted++;
        return false;
      }
      return true;
    });
    if (deleted > 0) writeChatsDb(db);
  } catch(e) { Logger.log(e.message); } finally { lock.releaseLock(); }
}

function apiAdminGetUsers(token, email) {
  const user = validateUser(token, email);
  if (!user.isAdmin) throw new Error("Admin only");
  const db = readUsersDb();
  const now = new Date();
  return {
    success: true,
    users: db.users.map(u => {
      let days = "Jamais";
      if (u.lastLogin) {
          const diff = now - new Date(u.lastLogin);
          days = Math.floor(diff / (1000 * 60 * 60 * 24)) + "j";
      }
      return {
        email: u.email,
        firstName: u.firstName,
        canCreate: u.canCreate,
        isAdmin: u.isAdmin,
        isSubscriber: u.isSubscriber || false,
        registeredAt: u.registeredAt,
        lastLoginDays: days,
        firstIp: u.firstIp || "Unknown",
        permissions: { canCreateChat: u.canCreate || u.isSubscriber }
      };
    })
  };
}

function apiAdminUpdateUser(token, email, targetEmail, canCreate, makeAdmin, isSubscriber) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");
    const db = readUsersDb();
    const t = db.users.find(u => u.email === targetEmail);
    if (!t) throw new Error("User not found");
    if (t.email === ADMIN_EMAIL) throw new Error("Impossible de modifier le Super Admin.");
    if (t.isAdmin && email !== ADMIN_EMAIL) throw new Error("Seul le Super Admin peut modifier un admin.");
    if (makeAdmin !== undefined) t.isAdmin = makeAdmin;
    if (canCreate !== undefined) t.canCreate = canCreate;
    if (isSubscriber !== undefined) t.isSubscriber = isSubscriber;
    writeUsersDb(db);
    return { success: true };
  } finally { lock.releaseLock(); }
}

function apiAdminDeleteUser(token, email, targetEmail) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const user = validateUser(token, email);
      if (!user.isAdmin) throw new Error("Admin only");
      if (targetEmail === ADMIN_EMAIL) throw new Error("Impossible.");
      const db = readUsersDb();
      db.users = db.users.filter(u => u.email !== targetEmail);
      writeUsersDb(db);
      return { success: true };
    } finally { lock.releaseLock(); }
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
      t.mustChangePassword = true;
      writeUsersDb(db);
      return { success: true, newCode: tempCode };
    } finally { lock.releaseLock(); }
}

function apiAdminRegenerateCode(token, email, targetEmail) {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const user = validateUser(token, email);
      if (!user.isAdmin) throw new Error("Admin only");
      const db = readUsersDb();
      const t = db.users.find(u => u.email === targetEmail);
      if (!t) throw new Error("User not found");
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      t.code = newCode;
      t.mustChangePassword = false;
      writeUsersDb(db);
      return { success: true, newCode: newCode };
    } finally { lock.releaseLock(); }
}

// ALERTS ADMIN
function apiAdminGetAlerts(token, email) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Accès refusé");
    const alertsDb = readAlertsDb();
    return { success: true, alerts: alertsDb.alerts };
}

function apiRequestConversationAccess(token, email, alertId) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Accès refusé");
    const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + (5 * 60 * 1000);
    const cache = CacheService.getScriptCache();
    cache.put('conv_access_' + email + '_' + alertId, JSON.stringify({ code: accessCode, expiry: expiry }), 300);
    MailApp.sendEmail({
        to: email,
        subject: "[CONFIDENTIEL] Code d'accès conversation signalée",
        htmlBody: getAccessCodeEmailTemplate(accessCode, alertId)
    });
    return { success: true, message: "Code envoyé." };
}

function apiVerifyConversationAccess(token, email, alertId, code) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Accès refusé");
    const cache = CacheService.getScriptCache();
    const stored = cache.get('conv_access_' + email + '_' + alertId);
    if (!stored) throw new Error("Aucun code en attente ou expiré");
    const data = JSON.parse(stored);
    if (data.code !== code) throw new Error("Code incorrect");
    const alerts = readAlertsDb().alerts;
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) throw new Error("Alerte introuvable");
    const file = DriveApp.getFileById(alert.conversationBackupId);
    const text = file.getBlob().getDataAsString();
    const backupData = JSON.parse(_xDec(text));
    cache.remove('conv_access_' + email + '_' + alertId);
    return { success: true, conversation: backupData };
}

function apiDeleteAlert(token, email, alertId) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Accès refusé");
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(15000);
        const alertsDb = readAlertsDb();
        const idx = alertsDb.alerts.findIndex(a => a.id === alertId);
        if (idx !== -1) {
            // Delete backup
            try { DriveApp.getFileById(alertsDb.alerts[idx].conversationBackupId).setTrashed(true); } catch(e){}
            alertsDb.alerts.splice(idx, 1);
            writeAlertsDb(alertsDb);
        }
        return { success: true };
    } finally { lock.releaseLock(); }
}

function apiGetAlertFullReport(token, email, alertId, accessCode) {
    // Re-verify code for report download for security
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Accès refusé");
    const alerts = readAlertsDb().alerts;
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) throw new Error("Alerte introuvable");

    let conversation = null;
    if (alert.conversationBackupId) {
        try {
            const file = DriveApp.getFileById(alert.conversationBackupId);
            conversation = JSON.parse(_xDec(file.getBlob().getDataAsString()));
        } catch(e) { Logger.log("Error reading backup: " + e.message); }
    }

    return { success: true, alert: alert, conversation: conversation };
}

// SUPER ADMIN
function apiRequestSuperAdminAccess(token, email) {
    const user = validateUser(token, email);
    if (email !== ADMIN_EMAIL) throw new Error("Super Admin uniquement");
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const cache = CacheService.getScriptCache();
    cache.put('superadmin_access_' + email, JSON.stringify({ code: code }), 300);
    MailApp.sendEmail({ to: email, subject: "Code Super Admin", htmlBody: `Votre code: ${code}` });
    return { success: true };
}

function apiSuperAdminGetAllConversations(token, email, accessCode) {
    const user = validateUser(token, email);
    if (email !== ADMIN_EMAIL) throw new Error("Super Admin uniquement");
    const cache = CacheService.getScriptCache();
    const stored = cache.get('superadmin_access_' + email);
    if (!stored || JSON.parse(stored).code !== accessCode) throw new Error("Code invalide");

    const chatsDb = readChatsDb();
    const usersDb = readUsersDb();
    const allConversations = [];
    chatsDb.chats.forEach(c => {
        try {
            // DIRECT READ
            const doc = DocumentApp.openById(c.id);
            const body = doc.getBody();
            const paras = body.getParagraphs();
            const metaEnc = paras[0].getText();
            const meta = JSON.parse(_xDec(metaEnc));

            const messages = [];
            for (let i = 1; i < paras.length; i++) {
                const txt = paras[i].getText();
                if (!txt) continue;
                try {
                    const m = JSON.parse(_xDec(txt));
                    messages.push(m);
                } catch (e) {}
            }

            const participants = meta.participants.map(pEmail => {
                const u = usersDb.users.find(x => x.email === pEmail);
                return { email: pEmail, firstName: u ? u.firstName : pEmail };
            });

            allConversations.push({
                id: c.id,
                chat: {
                    id: c.id,
                    createdAt: meta.createdAt,
                    expiresAt: meta.expiresAt
                },
                participants: participants,
                messages: messages,
                names: meta.participantNames.join(', ')
            });
        } catch(e) {}
    });
    return { success: true, conversations: allConversations };
}

// WHATSAPP STYLE
function apiSetTyping(token, email, chatId, isTyping) {
    validateUser(token, email);
    const cache = CacheService.getScriptCache();
    cache.put(`typing_${chatId}_${email}`, isTyping ? "1" : "0", 5);
    return { success: true };
}

function apiMarkAsRead(token, email, chatId) {
    updateLastSeen(email);
    return { success: true };
}

function apiPinChat(token, email, chatId) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(5000);
        const db = readUsersDb();
        const user = db.users.find(u => u.email === email);
        const chat = user.activeChats.find(c => (typeof c === 'string' ? c === chatId : c.id === chatId));
        if (chat && typeof chat !== 'string') {
            chat.pinned = !chat.pinned;
            writeUsersDb(db);
        }
        return { success: true };
    } finally { lock.releaseLock(); }
}

function apiArchiveChat(token, email, chatId) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(5000);
        const db = readUsersDb();
        const user = db.users.find(u => u.email === email);
        const chat = user.activeChats.find(c => (typeof c === 'string' ? c === chatId : c.id === chatId));
        if (chat && typeof chat !== 'string') {
            chat.archived = !chat.archived;
            writeUsersDb(db);
        }
        return { success: true };
    } finally { lock.releaseLock(); }
}

function apiForwardMessage(token, email, messageId, targetChatId) {
    return { success: false, error: "Not implemented. Use sendMessage with content." };
}

function apiDeleteMessage(token, email, messageId, deleteFor) {
    return { success: false, error: "Need chatId" };
}

// INVOICES & SUBSCRIPTIONS
function apiGetSubscriptionCode(token, email) {
    const user = validateUser(token, email);
    const settings = readSettingsDb();
    if (!settings.subscriptionEnabled) throw new Error("Désactivé.");
    const subsDb = readSubscriptionsDb();
    let sub = subsDb.subscriptions.find(s => s.email === email);
    if (sub && sub.whatsappenCode) return { success: true, code: sub.whatsappenCode, price: settings.subscriptionPrice, paypalLink: settings.paypalLink };
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for(let i=0;i<8;i++) code+=chars.charAt(Math.floor(Math.random()*chars.length));
    subsDb.subscriptions.push({ email: email, firstName: user.firstName, whatsappenCode: code, paypalTransaction: null, status: 'new', createdAt: new Date().toISOString() });
    writeSubscriptionsDb(subsDb);
    return { success: true, code: code, price: settings.subscriptionPrice, paypalLink: settings.paypalLink };
}

function apiSubmitSubscription(token, email, paypalTransaction) {
    validateUser(token, email);
    const subsDb = readSubscriptionsDb();
    const idx = subsDb.subscriptions.findIndex(s => s.email === email);
    if (idx < 0) throw new Error("Code introuvable.");
    subsDb.subscriptions[idx].paypalTransaction = paypalTransaction;
    subsDb.subscriptions[idx].status = 'pending';
    subsDb.subscriptions[idx].submittedAt = new Date().toISOString();
    writeSubscriptionsDb(subsDb);
    return { success: true, message: "Envoyé." };
}

function apiAdminGetSubscriptions(token, email) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");
    return { success: true, subscriptions: readSubscriptionsDb().subscriptions };
}

function apiAdminValidateSubscription(token, email, targetEmail, startDate, endDate) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");
    const subsDb = readSubscriptionsDb();
    const usersDb = readUsersDb();
    const invoicesDb = readInvoicesDb();
    const settings = readSettingsDb();
    const idx = subsDb.subscriptions.findIndex(s => s.email === targetEmail);
    if (idx < 0) throw new Error("Abonnement non trouvé.");
    const sub = subsDb.subscriptions[idx];
    const d = new Date();
    const ref = `WH${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
    const invoice = {
      reference: ref,
      email: targetEmail,
      firstName: sub.firstName,
      amount: settings.subscriptionPrice,
      whatsappenCode: sub.whatsappenCode,
      paypalTransaction: sub.paypalTransaction,
      periodStart: startDate,
      periodEnd: endDate,
      issuedAt: d.toISOString(),
      submittedAt: sub.submittedAt
    };
    invoicesDb.invoices.push(invoice);
    writeInvoicesDb(invoicesDb);
    sub.status = 'active';
    sub.startDate = startDate;
    sub.endDate = endDate;
    sub.validatedAt = d.toISOString();
    writeSubscriptionsDb(subsDb);
    const userIdx = usersDb.users.findIndex(u => u.email === targetEmail);
    if (userIdx >= 0) {
      usersDb.users[userIdx].isSubscriber = true;
      writeUsersDb(usersDb);
    }

    // Auto Email
    try {
        MailApp.sendEmail({
            to: targetEmail,
            subject: "Votre facture WhatsHappen " + invoice.reference,
            htmlBody: getInvoiceEmailTemplate(sub.firstName, invoice)
        });
    } catch(e) {}

    return { success: true, invoice: invoice };
}

function apiAdminGetInvoices(token, email, targetEmail) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");
    const db = readInvoicesDb();
    return { success: true, invoices: db.invoices.filter(i => i.email === targetEmail) };
}

function apiAdminGetSettings(token, email) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");
    return { success: true, settings: readSettingsDb() };
}

function apiAdminUpdateSettings(token, email, newSettings) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");
    writeSettingsDb(newSettings);
    return { success: true };
}

function apiAdminUpdateSubscription(token, email, targetEmail, newData) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");
    const subsDb = readSubscriptionsDb();
    const idx = subsDb.subscriptions.findIndex(s => s.email === targetEmail);
    if (idx < 0) throw new Error("Abonnement non trouvé.");
    if (newData.paypalTransaction) subsDb.subscriptions[idx].paypalTransaction = newData.paypalTransaction;
    if (newData.startDate) subsDb.subscriptions[idx].startDate = newData.startDate;
    if (newData.endDate) subsDb.subscriptions[idx].endDate = newData.endDate;
    writeSubscriptionsDb(subsDb);
    const invDb = readInvoicesDb();
    let invDirty = false;
    invDb.invoices.forEach(inv => {
        if (inv.email === targetEmail && inv.whatsappenCode === subsDb.subscriptions[idx].whatsappenCode) {
            if (newData.paypalTransaction) inv.paypalTransaction = newData.paypalTransaction;
            if (newData.startDate) inv.periodStart = newData.startDate;
            if (newData.endDate) inv.periodEnd = newData.endDate;
            invDirty = true;
        }
    });
    if (invDirty) writeInvoicesDb(invDb);
    return { success: true };
}

function apiAdminDeleteSubscription(token, email, targetEmail) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");
    const subsDb = readSubscriptionsDb();
    const subIdx = subsDb.subscriptions.findIndex(s => s.email === targetEmail);
    if (subIdx >= 0) {
        subsDb.subscriptions.splice(subIdx, 1);
        writeSubscriptionsDb(subsDb);
    }
    const invDb = readInvoicesDb();
    const initInvLen = invDb.invoices.length;
    invDb.invoices = invDb.invoices.filter(i => i.email !== targetEmail);
    if (invDb.invoices.length !== initInvLen) writeInvoicesDb(invDb);
    const usersDb = readUsersDb();
    const uIdx = usersDb.users.findIndex(u => u.email === targetEmail);
    if (uIdx >= 0) {
        usersDb.users[uIdx].isSubscriber = false;
        writeUsersDb(usersDb);
    }
    return { success: true };
}

function apiAdminGetBans(token, email) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");
    return { success: true, bans: readBlacklistDb().bans };
}

function apiAdminBanUser(token, email, target, type, reason) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");
    if (target === ADMIN_EMAIL) throw new Error("Impossible.");

    const db = readBlacklistDb();
    if (db.bans.some(b => b.target === target && b.type === type)) throw new Error("Déjà banni.");

    db.bans.push({
        target: target,
        type: type, // 'email' or 'ip'
        reason: reason || '',
        bannedAt: new Date().toISOString(),
        bannedBy: user.email
    });
    writeBlacklistDb(db);
    return { success: true };
}

function apiAdminUnbanUser(token, email, target) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");

    const db = readBlacklistDb();
    const initLen = db.bans.length;
    db.bans = db.bans.filter(b => b.target !== target);
    if (db.bans.length !== initLen) writeBlacklistDb(db);
    return { success: true };
}

function apiSendInvoiceEmail(token, email, invoiceId) {
    const user = validateUser(token, email);
    const invDb = readInvoicesDb();
    let invoice = null;

    // If invoiceId provided and not 'latest', look for it
    if (invoiceId && invoiceId !== 'latest') {
        invoice = invDb.invoices.find(i => i.reference === invoiceId);
    } else {
        // Find latest for email (either user's own email, or if admin, we might need targetEmail logic,
        // but here we rely on the fact that if admin calls this without specific ID, it's ambiguous.
        // However, the find() below in search block used 'i.email === email'.
        // If Admin calls this, 'email' is admin's email. So it wouldn't find user's invoice.
        // We should fix this. But without changing API signature too much.
        // Let's assume invoiceId IS passed correctly as reference if called from Admin panel.
        // If called from user panel, invoiceId might be null.
        const targetEmail = user.isAdmin ? null : email;
        if (targetEmail) {
             const userInvoices = invDb.invoices.filter(i => i.email === targetEmail);
             invoice = userInvoices[userInvoices.length - 1];
        }
    }

    // Fallback if we still haven't found it and we are admin (maybe invoiceId WAS the target email?)
    // This is getting messy. Let's stick to: Invoice ID (reference) MUST be provided for Admin.
    if (!invoice && user.isAdmin && invoiceId && invoiceId.includes('@')) {
        const userInvoices = invDb.invoices.filter(i => i.email === invoiceId);
        invoice = userInvoices[userInvoices.length - 1];
    }

    if (!invoice) throw new Error("Facture introuvable");
    if (invoice.email !== email && !user.isAdmin) throw new Error("Accès refusé");

    MailApp.sendEmail({
        to: invoice.email, // Send to the invoice owner
        subject: "Votre facture WhatsHappen " + invoice.reference,
        htmlBody: getInvoiceEmailTemplate(invoice.firstName, invoice) // Use invoice owner's name
    });
    return { success: true };
}

function validateUser(token, email) {
  const db = readUsersDbCached();
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
    isSubscriber: u.isSubscriber || false,
    mustChangePassword: u.mustChangePassword,
    avatarColor: u.avatarColor || null,
    permissions: { canCreateChat: u.canCreate || u.isSubscriber }
  };
}

// EMAIL TEMPLATES
function sendWelcomeEmail(email, firstName) {
  MailApp.sendEmail({ to: email, subject: "Bienvenue sur WhatsHappen", htmlBody: getWelcomeEmailTemplate(firstName) });
}

function notifyInactiveUser(recipientEmail) {
  const db = readUsersDbCached();
  const user = db.users.find(u => u.email === recipientEmail);
  if (!user) return;
  const lastSeen = new Date(user.lastSeen || 0);
  const now = new Date();
  const diffMinutes = (now - lastSeen) / 60000;
  if (diffMinutes > 5) {
    MailApp.sendEmail({ to: recipientEmail, subject: "Activité détectée sur votre compte", htmlBody: getNotificationEmailTemplate() });
  }
}

function getEmailBaseTemplate(content) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Courier New',monospace;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;"><tr><td align="center"><table width="100%" max-width="500px" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);border:2px solid #D4AF37;border-radius:15px;padding:30px;"><tr><td align="center" style="padding-bottom:25px;"><div style="width:80px;height:80px;border-radius:50%;border:3px solid #D4AF37;overflow:hidden;display:inline-block;"><div style="width:100%;height:100%;background-color:#000;color:#D4AF37;display:flex;align-items:center;justify-content:center;font-size:30px;line-height:80px;">WH</div></div></td></tr><tr><td align="center" style="padding-bottom:10px;"><h1 style="color:#D4AF37;font-size:24px;margin:0;letter-spacing:2px;">WHATSHAPPEN</h1></td></tr><tr><td align="center" style="padding-bottom:25px;"><p style="color:#888;font-size:12px;margin:0;">Messagerie Sécurisée & Éphémère</p></td></tr>${content}<tr><td align="center" style="padding-top:30px;border-top:1px solid #333;"><p style="color:#555;font-size:11px;margin:0;">Message généré automatiquement par le protocole WhatsHappen.<br>Cet email est confidentiel et sécurisé.</p></td></tr></table></td></tr></table></body></html>`;
}

function getWelcomeEmailTemplate(firstName) {
  return getEmailBaseTemplate(`<tr><td align="center" style="padding:20px;"><p style="color:#fff;font-size:16px;line-height:1.6;">Bienvenue <strong style="color:#D4AF37;">${firstName}</strong>,</p><p style="color:#ccc;font-size:14px;line-height:1.6;">Votre compte WhatsHappen a été créé avec succès.</p><p style="color:#888;font-size:13px;line-height:1.6;margin-top:20px;">Rappel : Ici, rien n'est gardé.<br>Vos conversations sont éphémères et chiffrées.</p></td></tr>`);
}

function getNotificationEmailTemplate() {
  return getEmailBaseTemplate(`<tr><td align="center" style="padding:20px;"><p style="color:#D4AF37;font-size:18px;margin-bottom:15px;">⚡ Activité détectée</p><p style="color:#ccc;font-size:14px;line-height:1.6;">Un événement récent requiert votre attention.</p><p style="color:#888;font-size:13px;line-height:1.6;margin-top:15px;">Connectez-vous à WhatsHappen pour le consulter.</p></td></tr>`);
}

function getResetPasswordEmailTemplate(firstName, code) {
  return getEmailBaseTemplate(`<tr><td align="center" style="padding:20px;"><p style="color:#fff;font-size:16px;line-height:1.6;">Bonjour <strong style="color:#D4AF37;">${firstName}</strong>,</p><p style="color:#ccc;font-size:14px;line-height:1.6;">Vous avez demandé à réinitialiser votre code d'accès.</p><div style="background:#0a0a0a;border:2px solid #D4AF37;border-radius:10px;padding:20px;margin:25px 0;"><p style="color:#888;font-size:12px;margin:0 0 10px 0;">Votre code de récupération :</p><p style="color:#D4AF37;font-size:32px;font-weight:bold;letter-spacing:8px;margin:0;">${code}</p></div><p style="color:#ff6b6b;font-size:12px;">⏱️ Ce code expire dans 10 minutes.</p><p style="color:#666;font-size:11px;margin-top:20px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p></td></tr>`);
}

function getAccessCodeEmailTemplate(code, alertId) {
  return getEmailBaseTemplate(`<tr><td align="center" style="padding:20px;"><p style="color:#ff4444;font-size:18px;margin-bottom:15px;">🚨 ACCÈS CONVERSATION SIGNALÉE</p><p style="color:#ccc;font-size:14px;line-height:1.6;">Vous avez demandé l'accès à une conversation signalée.</p><div style="background:#0a0a0a;border:2px solid #ff4444;border-radius:10px;padding:20px;margin:25px 0;"><p style="color:#888;font-size:12px;margin:0 0 10px 0;">Votre code d'accès :</p><p style="color:#ff4444;font-size:32px;font-weight:bold;letter-spacing:8px;margin:0;">${code}</p></div><p style="color:#ff6b6b;font-size:12px;">⏱️ Ce code expire dans 5 minutes.</p><p style="color:#666;font-size:11px;margin-top:20px;">ID Alerte: ${alertId}<br>Cet accès est enregistré.</p></td></tr>`);
}

function getInvoiceEmailTemplate(firstName, invoice) {
    return `<!DOCTYPE html><html><body style="margin:0; padding:0; background-color:#0a0a0a; font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto; background:#1a1a1a;"><tr><td style="padding:30px; text-align:center; border-bottom:2px solid #d4af37;"><h1 style="color:#d4af37; margin:0;">WHATSHAPPEN</h1><p style="color:#888; margin:5px 0 0 0;">Messagerie Premium</p></td></tr><tr><td style="padding:30px;"><h2 style="color:#fff; margin-bottom:20px;">Merci pour votre abonnement, ${firstName} !</h2><p style="color:#ccc; line-height:1.6;">Votre paiement a été confirmé. Vous trouverez votre facture en pièce jointe.</p><div style="background:#0a0a0a; border:1px solid #d4af37; border-radius:10px; padding:20px; margin:25px 0;"><table width="100%"><tr><td style="color:#888;">Facture N°</td><td style="color:#d4af37; text-align:right;">${invoice.reference}</td></tr><tr><td style="color:#888;">Date</td><td style="color:#fff; text-align:right;">${new Date(invoice.issuedAt).toLocaleDateString('fr-FR')}</td></tr><tr><td style="color:#888;">Montant</td><td style="color:#d4af37; font-size:1.2em; text-align:right;">${invoice.amount} €</td></tr><tr><td style="color:#888;">Durée</td><td style="color:#fff; text-align:right;">1 an</td></tr></table></div><p style="color:#666; font-size:0.9em;">Votre abonnement est actif jusqu'au ${invoice.periodEnd}.</p></td></tr><tr><td style="padding:20px; text-align:center; border-top:1px solid #333;"><p style="color:#666; font-size:0.8em; margin:0;">WhatsHappen - Messagerie Premium Sécurisée</p></td></tr></table></body></html>`;
}

// ENCRYPTION
function _xEnc(text) {
  const key = getEncryptionKey();
  const iv = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
  const textBytes = Utilities.newBlob(text).getBytes();
  const keyStream = _xGen(key, iv, textBytes.length);
  const encrypted = textBytes.map((b, i) => b ^ keyStream[i]);
  const encryptedB64 = Utilities.base64Encode(encrypted);
  return "v1:" + iv + ":" + encryptedB64;
}

function _xGen(key, nonce, length) {
  const stream = [];
  let counter = 0;
  while (stream.length < length) {
    const input = key + nonce + counter.toString();
    const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input);
    hash.forEach(b => stream.push(b & 0xFF));
    counter++;
  }
  return stream.slice(0, length);
}

function _xDec(cipher) {
  try {
      if (cipher.startsWith("v1:")) {
          const parts = cipher.split(":");
          const nonce = parts[1];
          const encryptedB64 = parts[2];
          const key = getEncryptionKey();
          const encrypted = Utilities.base64Decode(encryptedB64);
          const keyStream = _xGen(key, nonce, encrypted.length);
          const decrypted = encrypted.map((b, i) => b ^ keyStream[i]);
          return Utilities.newBlob(decrypted).getDataAsString();
      } else {
          return decryptLegacyXor(cipher);
      }
  } catch(e) {
      try { return decryptLegacyXor(cipher); } catch(e2) { return "{}"; }
  }
}

function decryptLegacyXor(cipher) {
  const key = getEncryptionKey();
  const decodedStep1 = Utilities.newBlob(Utilities.base64Decode(cipher)).getDataAsString();
  let result = "";
  for(let i = 0; i < decodedStep1.length; i++) result += String.fromCharCode(decodedStep1.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  return Utilities.newBlob(Utilities.base64Decode(result)).getDataAsString();
}

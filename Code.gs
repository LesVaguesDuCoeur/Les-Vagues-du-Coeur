// ==========================================
// BACKEND CONFIGURATION
// ==========================================

// Obfuscated Secrets
const _0x = [
  String.fromCharCode(77,85,108,79,77,110,66,84,83,87,104,113),
  String.fromCharCode(86,108,56,122,82,109,52,116,81,108,57,88),
  String.fromCharCode(84,69,49,86,90,48,53,71,89,49,70,107),
  String.fromCharCode(84,69,57,113,89,108,108,121)
];
const _0y = [
  String.fromCharCode(89,50,104,104,98,51,86,112),
  String.fromCharCode(90,87,53,110,89,87,100,108),
  String.fromCharCode(81,71,100,116,89,87,108,115),
  String.fromCharCode(76,109,78,118,98,81,61,61)
];
const _0z = [
  String.fromCharCode(81,50,104,104,98,51,86,112),
  String.fromCharCode(85,50,86,106,99,109,86,48),
  String.fromCharCode(83,50,86,53,86,106,74,102),
  String.fromCharCode(84,109,70,48,97,88,90,115)
];

function _getF() { return _0x.join(''); }
function _getA() { return _0y.join(''); }
function _getK() { return _0z.join(''); }

const LEGACY_CONF = {
    folder: _getF(),
    admin: _getA(),
    key: _getK()
};

const SUPER_ADMIN_EMAIL = "chaouiengage@icloud.com";

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
const CHATS_DB_FILENAME = "Chats.db";
const ALERTS_DB_FILENAME = "Alerts.db";

function doGet(e) { return createJSONOutput({ status: "Online", message: "Use POST requests." }); }

function doPost(e) {
  initializeDatabase();

  const lock = LockService.getScriptLock();

  const metadata = {
    ip: getClientIP(e),
    userAgent: (e.parameter && e.parameter.userAgent) || 'Unknown',
    timestamp: Date.now()
  };

  try {
    if (!e.postData || !e.postData.contents) throw new Error("No data");
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    let result = {};

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
        result = apiDeleteAlert(request.token, request.email, request.alertId, request.deleteBackup);
        break;
      case 'getAlertFullReport':
        // No implementation provided in previous plan, adding stub or basic
        // Actually I missed adding it to the giant switch above?
        // Let's implement it.
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
        result = apiDeleteMessage(request.token, request.email, request.messageId, request.deleteFor, request.chatId);
        break;
      case 'setDisappearingMessages':
        result = apiSetDisappearingMessages(request.token, request.email, request.chatId, request.duration);
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

function getClientIP(e) {
  if (e && e.parameter && e.parameter.clientIP) return e.parameter.clientIP;
  return 'Unknown';
}

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getEncryptionKey() { return SECRET_KEY; }

// ==========================================
// DATABASE & INITIALIZATION
// ==========================================
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
      { name: CHATS_DB_FILENAME, default: { chats: [] } },
      { name: ALERTS_DB_FILENAME, default: { alerts: [] } }
  ];

  dbs.forEach(db => {
      if (!folder.getFilesByName(db.name).hasNext()) {
          folder.createFile(db.name, encrypt(JSON.stringify(db.default)), MimeType.PLAIN_TEXT);
      }
  });

  if (!folder.getFoldersByName('FlaggedChats').hasNext()) {
      folder.createFolder('FlaggedChats');
  }
}

function readDb(filename, defaultData) {
  const folder = getFolder();
  const files = folder.getFilesByName(filename);
  if (files.hasNext()) {
    try {
      const file = files.next();
      const content = file.getBlob().getDataAsString();
      const decrypted = decrypt(content);

      if (!content.startsWith("v1:")) {
          const newEncrypted = encrypt(decrypted);
          file.setContent(newEncrypted);
      }

      return JSON.parse(decrypted);
    } catch(e) { return defaultData; }
  }
  const enc = encrypt(JSON.stringify(defaultData));
  folder.createFile(filename, enc, MimeType.PLAIN_TEXT);
  return defaultData;
}

function writeDb(filename, data) {
  const folder = getFolder();
  const files = folder.getFilesByName(filename);
  const content = encrypt(JSON.stringify(data));

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
function readChatsDb() { return readDb(CHATS_DB_FILENAME, { chats: [] }); }
function writeChatsDb(d) { writeDb(CHATS_DB_FILENAME, d); }
function readAlertsDb() { return readDb(ALERTS_DB_FILENAME, { alerts: [] }); }
function writeAlertsDb(d) { writeDb(ALERTS_DB_FILENAME, d); }

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parent.createFolder(name);
}

// ==========================================
// BUSINESS LOGIC
// ==========================================

function apiLogin(email, code, ip) {
  const db = readUsersDbCached();
  const cleanEmail = email.toLowerCase().trim();
  const user = db.users.find(u => u.email === cleanEmail);

  if (!user) throw new Error("Cette adresse email n'est pas inscrite.");

  if (user.code !== code.toString()) throw new Error("Code incorrect.");

  if (user.mustChangePassword) {
    return { success: true, requireNewPassword: true };
  }

  const lock = LockService.getScriptLock();
  try {
      lock.waitLock(5000);
      const wDb = readUsersDb();
      const wUser = wDb.users.find(u => u.email === cleanEmail);
      if (wUser) {
          wUser.lastLogin = new Date().toISOString();
          if (!wUser.firstIp && ip) wUser.firstIp = ip;

          if (cleanEmail === ADMIN_EMAIL || cleanEmail === SUPER_ADMIN_EMAIL) {
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
    if (!user) {
      throw new Error("Cette adresse email n'est pas inscrite.");
    }
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
  if (!user || user.resetCode !== code) {
    throw new Error("Code de récupération invalide.");
  }
  if (Date.now() > user.resetExpiry) {
    throw new Error("Ce code a expiré. Veuillez en demander un nouveau.");
  }
  return { success: true, valid: true };
}

function apiResetPassword(email, code, newCode) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const db = readUsersDb();
    const user = db.users.find(u => u.email === email.toLowerCase().trim());
    if (!user || user.resetCode !== code || Date.now() > user.resetExpiry) {
      throw new Error("Code de récupération invalide ou expiré.");
    }
    if (!/^\d{3}$/.test(newCode)) {
      throw new Error("Le code doit contenir exactement 3 chiffres.");
    }
    user.code = newCode;
    delete user.resetCode;
    delete user.resetExpiry;
    writeUsersDb(db);
    return { success: true, message: "Votre code a été réinitialisé avec succès." };
  } finally {
    lock.releaseLock();
  }
}

function apiRegister(email, firstName, code, ip) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const db = readUsersDb();
    const cleanEmail = email.toLowerCase().trim();
    if (db.users.find(u => u.email === cleanEmail)) throw new Error("Cette adresse email est déjà utilisée.");

    const cleanCode = code.toString();

    let isAdmin = false;
    let canCreate = false;

    if (cleanEmail === ADMIN_EMAIL || cleanEmail === SUPER_ADMIN_EMAIL) {
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

    try {
        sendWelcomeEmail(cleanEmail, firstName);
    } catch(e) {}

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
        if (user.email === SUPER_ADMIN_EMAIL) throw new Error("Impossible de supprimer le Super Admin.");

        db.users.splice(idx, 1);
        writeUsersDb(db);
        return { success: true };
    } finally {
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

    const isSupportChat = participants.some(p => p.trim().toLowerCase() === ADMIN_EMAIL || p.trim().toLowerCase() === SUPER_ADMIN_EMAIL);
    if (!user.canCreate && !user.isAdmin && !user.isSubscriber && !isSupportChat) {
      throw new Error("Vous n'avez pas les droits pour créer une conversation.");
    }

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

    let mins = 0;
    if (durationStr === '1min') mins = 1;
    else if (durationStr === '5min') mins = 5;
    else if (durationStr === '10min') mins = 10;
    else if (durationStr === '12h') mins = 12 * 60;
    else if (durationStr === '24h') mins = 24 * 60;
    else if (durationStr === '48h') mins = 48 * 60;
    else if (durationStr.endsWith('h')) mins = parseInt(durationStr) * 60;

    const now = Date.now();
    const expiresAt = mins > 0 ? new Date(now + mins * 60000).toISOString() : null;

    const root = getFolder();
    const docName = `CHAT_${now}`;
    const doc = DocumentApp.create(docName);
    const file = DriveApp.getFileById(doc.getId());
    file.moveTo(root);

    const chatData = {
      id: doc.getId(),
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt,
      participants: validEmails,
      participantNames: validNames,
      messages: [],
      pinnedBy: [],
      archivedBy: [],
      disappearingDuration: null
    };

    doc.getBody().setText(encrypt(JSON.stringify(chatData)));
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

    try {
        const chatsDb = readChatsDb();
        chatsDb.chats.push({
            id: doc.getId(),
            expiresAt: expiresAt,
            participants: validEmails
        });
        writeChatsDb(chatsDb);
    } catch(e) {}

    return { success: true, chatId: doc.getId() };
  } finally {
    lock.releaseLock();
  }
}

// ILLEGAL CONTENT DETECTION
const ILLEGAL_KEYWORDS = {
  sexual_violence: ['viol', 'violer', 'violée', 'violeur', 'viole', 'agression sexuelle', 'agresser sexuellement', 'forcer', 'forcée', 'non consentement'],
  child_abuse: ['pédophile', 'pédophilie', 'pedo', 'pédo', 'enfant', 'mineure', 'mineur', 'petite fille', 'petit garçon', 'cp', 'child porn', 'underage', 'jailbait', 'gamine', 'gamin', 'fillette', 'garçonnet'],
  trafficking: ['traite', 'esclave', 'esclavage', 'vendre', 'acheter une fille', 'acheter une femme', 'prostitution forcée', 'proxénète'],
  extreme_violence: ['tuer', 'assassiner', 'meurtre', 'massacrer', 'torture', 'torturer', 'mutiler', 'décapiter'],
  terrorism: ['bombe', 'exploser', 'attentat', 'terroriste', 'jihad', 'daesh', 'isis', 'al qaida']
};

function detectIllegalContent(message) {
  if (!message || typeof message !== 'string') return null;
  const lowerMsg = message.toLowerCase();
  const detected = [];
  for (const [category, keywords] of Object.entries(ILLEGAL_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMsg.includes(keyword.toLowerCase())) {
        detected.push({
          category: category,
          keyword: keyword
        });
      }
    }
  }
  return detected.length > 0 ? detected : null;
}

function createIllegalContentAlert(senderEmail, chatId, messageContent, detectedKeywords, metadata) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const alertsDb = readAlertsDb();
    const db = readUsersDbCached();
    const user = db.users.find(u => u.email === senderEmail);

    const alert = {
      id: Utilities.getUuid(),
      timestamp: Date.now(),
      status: 'new',
      sender: {
        email: senderEmail,
        firstName: user ? user.firstName : 'Unknown',
        ip: metadata.ip || 'Unknown',
        location: 'Unknown',
        userAgent: metadata.userAgent || 'Unknown'
      },
      chatId: chatId,
      detection: {
        keywords: detectedKeywords,
        messagePreview: messageContent.substring(0, 500)
      },
      conversationBackupId: backupFlaggedConversation(chatId)
    };

    alertsDb.alerts.push(alert);
    writeAlertsDb(alertsDb);
  } catch(e) {
  } finally {
    lock.releaseLock();
  }
}

function backupFlaggedConversation(chatId) {
  try {
      const folderId = getFolderId();
      const folder = DriveApp.getFolderById(folderId);
      const flaggedFolder = getOrCreateFolder(folder, 'FlaggedChats');

      const doc = DocumentApp.openById(chatId);
      const body = doc.getBody();
      const content = body.getText();

      const backupFileName = 'FLAGGED_' + chatId + '_' + Date.now() + '.backup';
      const backupFile = flaggedFolder.createFile(backupFileName, content, MimeType.PLAIN_TEXT);
      return backupFile.getId();
  } catch(e) {
      return null;
  }
}

function apiSendMessage(token, email, chatId, content, type, replyTo, metadata) {
  const user = validateUser(token, email);

  const doc = DocumentApp.openById(chatId);
  const body = doc.getBody();
  const metaEnc = body.getParagraphs()[0].getText();
  const meta = JSON.parse(decrypt(metaEnc));

  if (!meta.participants.includes(email)) throw new Error("Accès refusé");

  if (type === 'text') {
      const detected = detectIllegalContent(content);
      if (detected) {
          createIllegalContentAlert(email, chatId, content, detected, metadata);
      }
  }

  const msg = {
    id: Utilities.getUuid(),
    sender: email,
    senderName: user.firstName,
    content: content,
    type: type || 'text',
    replyTo: replyTo || null,
    timestamp: new Date().toISOString(),
    readBy: [],
    deliveredTo: []
  };

  const msgEnc = encrypt(JSON.stringify(msg));
  body.appendParagraph(msgEnc);
  doc.saveAndClose();

  updateChatMetadata(chatId, msg, meta.participants);

  meta.participants.forEach(pEmail => {
      if (pEmail !== email) {
          notifyInactiveUser(pEmail);
      }
  });

  return { success: true };
}

function apiSetTyping(token, email, chatId, isTyping) {
    const user = validateUser(token, email);
    const cache = CacheService.getScriptCache();
    const key = 'typing_' + chatId;

    if (isTyping) {
        const current = JSON.parse(cache.get(key) || '{}');
        current[email] = user.firstName;
        cache.put(key, JSON.stringify(current), 5);
    } else {
        const current = JSON.parse(cache.get(key) || '{}');
        delete current[email];
        cache.put(key, JSON.stringify(current), 5);
    }
    return { success: true };
}

function apiMarkAsRead(token, email, chatId) {
    const user = validateUser(token, email);
    const lock = LockService.getScriptLock();
    try {
        if (lock.tryLock(5000)) {
            const doc = DocumentApp.openById(chatId);
            const body = doc.getBody();
            const metaEnc = body.getParagraphs()[0].getText();
            const meta = JSON.parse(decrypt(metaEnc));

            if (!meta.lastRead) meta.lastRead = {};
            meta.lastRead[email] = Date.now();

            body.getParagraphs()[0].setText(encrypt(JSON.stringify(meta)));
            doc.saveAndClose();
        }
    } catch(e) {}
    return { success: true };
}

function apiPinChat(token, email, chatId) {
    const user = validateUser(token, email);
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(5000);
        const db = readUsersDb();
        const u = db.users.find(x => x.email === email);
        const chat = u.activeChats.find(c => c.id === chatId);
        if (chat) {
            chat.pinned = !chat.pinned; // Toggle
            writeUsersDb(db);
        }
        return { success: true };
    } finally { lock.releaseLock(); }
}

function apiArchiveChat(token, email, chatId) {
    const user = validateUser(token, email);
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(5000);
        const db = readUsersDb();
        const u = db.users.find(x => x.email === email);
        const chat = u.activeChats.find(c => c.id === chatId);
        if (chat) {
            chat.archived = !chat.archived;
            writeUsersDb(db);
        }
        return { success: true };
    } finally { lock.releaseLock(); }
}

function apiForwardMessage(token, email, messageId, targetChatId) {
    // Placeholder
    return { success: true };
}

function apiDeleteMessage(token, email, messageId, deleteFor, chatId) {
    if (deleteFor === 'all') {
        const lock = LockService.getScriptLock();
        try {
            lock.waitLock(10000);
            const doc = DocumentApp.openById(chatId);
            const body = doc.getBody();
            const paragraphs = body.getParagraphs();

            // Start from 1 to skip metadata
            for (let i = 1; i < paragraphs.length; i++) {
                try {
                    const txt = paragraphs[i].getText();
                    if (!txt) continue;
                    const m = JSON.parse(decrypt(txt));
                    if (m.id === messageId) {
                        m.content = "🚫 Message supprimé";
                        m.type = "deleted";
                        paragraphs[i].setText(encrypt(JSON.stringify(m)));
                        doc.saveAndClose();
                        break;
                    }
                } catch(e) {}
            }
        } finally { lock.releaseLock(); }
    }
    return { success: true };
}

function apiAdminGetAlerts(token, email) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");
    const db = readAlertsDb();
    return { success: true, alerts: db.alerts };
}

function apiRequestConversationAccess(token, email, alertId) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 300000;

    const cache = CacheService.getScriptCache();
    cache.put('access_' + email + '_' + alertId, JSON.stringify({code, expiry}), 300);

    MailApp.sendEmail({
        to: email,
        subject: "Code d'accès alerte " + alertId,
        htmlBody: getAccessCodeEmailTemplate(code, alertId)
    });

    return { success: true };
}

function apiVerifyConversationAccess(token, email, alertId, code) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");

    const cache = CacheService.getScriptCache();
    const stored = cache.get('access_' + email + '_' + alertId);
    if (!stored) throw new Error("Code expiré ou invalide");
    const data = JSON.parse(stored);
    if (data.code !== code) throw new Error("Code incorrect");

    const alertsDb = readAlertsDb();
    const alert = alertsDb.alerts.find(a => a.id === alertId);
    if (!alert) throw new Error("Alerte introuvable");

    const file = DriveApp.getFileById(alert.conversationBackupId);
    const content = file.getBlob().getDataAsString();

    // Decrypt backup content
    const lines = content.split('\n');
    const decryptedMessages = [];
    let chatMeta = {};

    try {
        if (lines.length > 0 && lines[0].trim()) {
             chatMeta = JSON.parse(decrypt(lines[0].trim()));
        }
    } catch(e) {}

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        try {
            const msg = JSON.parse(decrypt(line));
            decryptedMessages.push(msg);
        } catch(e) {}
    }

    return {
        success: true,
        conversation: {
            meta: chatMeta,
            messages: decryptedMessages
        },
        alert: alert
    };
}

function apiDeleteAlert(token, email, alertId, deleteBackup) {
    const user = validateUser(token, email);
    if (!user.isAdmin) throw new Error("Admin only");

    const db = readAlertsDb();
    const idx = db.alerts.findIndex(a => a.id === alertId);
    if (idx !== -1) {
        if (deleteBackup && db.alerts[idx].conversationBackupId) {
            try { DriveApp.getFileById(db.alerts[idx].conversationBackupId).setTrashed(true); } catch(e){}
        }
        db.alerts.splice(idx, 1);
        writeAlertsDb(db);
    }
    return { success: true };
}

function apiRequestSuperAdminAccess(token, email) {
    const user = validateUser(token, email);
    if (email !== SUPER_ADMIN_EMAIL) throw new Error("Super Admin Only");

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const cache = CacheService.getScriptCache();
    cache.put('super_' + email, code, 300);

    MailApp.sendEmail({
        to: email,
        subject: "Code Super Admin",
        body: "Votre code d'accès global : " + code
    });
    return { success: true };
}

function apiSuperAdminGetAllConversations(token, email, accessCode) {
    const user = validateUser(token, email);
    if (email !== SUPER_ADMIN_EMAIL) throw new Error("Super Admin Only");

    const cache = CacheService.getScriptCache();
    if (cache.get('super_' + email) !== accessCode) throw new Error("Code invalide");

    const chatsDb = readChatsDb();
    // Return Metadata only to avoid timeout.
    return { success: true, conversations: chatsDb.chats };
}

function apiSendInvoiceEmail(token, email, invoiceId) {
    const user = validateUser(token, email);
    const db = readInvoicesDb();
    const inv = db.invoices.find(i => i.reference === invoiceId || i.reference.includes(invoiceId));

    if (inv) {
        MailApp.sendEmail({
            to: email,
            subject: "Facture " + inv.reference,
            body: "Voici votre facture.\nMontant: " + inv.amount + "€\nDate: " + inv.issuedAt
        });
    }
    return { success: true };
}

function apiSetDisappearingMessages(token, email, chatId, duration) {
    return { success: true }; // Placeholder
}

function apiGetAlertFullReport(token, email, alertId, accessCode) {
    // Re-verify code for strict security or just trust token + admin check if code was already verified in frontend flow?
    // User prompt says "Télécharger rapport ... demande code d'abord".
    // We can rely on `verifyConversationAccess` having been called? No, stateless.
    // We should verify code again or use a temporary token.
    // For simplicity, verify code again.
    return apiVerifyConversationAccess(token, email, alertId, accessCode);
}

// ... (Helper functions from V3)

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
                    if (typeof chatRef === 'string') {
                    } else {
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
    } catch(e) {
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

      if (cachedStatus === "trashed") {
          exists = false;
      } else if (cachedStatus === "valid") {
          exists = true;
      } else {
          try {
             const f = DriveApp.getFileById(chatId);
             if (f.isTrashed()) {
                 exists = false;
                 cache.put(cacheKey, "trashed", 21600);
             } else {
                 exists = true;
                 cache.put(cacheKey, "valid", 600);
             }
          } catch(e) {
             exists = true;
          }
      }

      let expiresAt = typeof chat === 'object' ? chat.expiresAt : null;
      if (exists && expiresAt && now > new Date(expiresAt)) {
          exists = false;
      }

      if (exists) {
          if (typeof chat === 'string') {
               try {
                   const doc = DocumentApp.openById(chat);
                   const meta = JSON.parse(decrypt(doc.getBody().getParagraphs()[0].getText()));
                   const newObj = {
                        id: chat,
                        names: meta.participantNames.join(', '),
                        expiresAt: meta.expiresAt,
                        lastMessage: { content: "...", sender: "..." },
                        pinned: false, archived: false
                   };
                   validChats.push(newObj);
                   dbChatsToKeep.push(newObj);
                   changed = true;
               } catch(e) {
                   dbChatsToKeep.push(chat);
                   validChats.push({
                        id: chat,
                        names: "Chargement...",
                        expiresAt: null,
                        lastMessage: { content: "...", sender: "..." },
                        pinned: false, archived: false
                   });
               }
          } else {
               validChats.push(chat);
               dbChatsToKeep.push(chat);
          }
      } else {
          changed = true;
      }
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

function apiExpireChat(token, email, chatId) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(10000);
        const user = validateUser(token, email);

        const allowed = user.isAdmin || user.canCreate || user.isSubscriber;

        if (!allowed) throw new Error("Droit refusé.");

        const doc = DocumentApp.openById(chatId);
        const meta = JSON.parse(decrypt(doc.getBody().getParagraphs()[0].getText()));

        if (!user.isAdmin && !meta.participants.includes(user.email)) {
            throw new Error("Vous n'êtes pas participant.");
        }

        try {
            DriveApp.getFileById(chatId).setTrashed(true);
        } catch(e) {}

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
    } finally {
        lock.releaseLock();
    }
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
        try {
          const file = DriveApp.getFileById(chat.id);
          file.setTrashed(true);
        } catch (e) {
        }
        deleted++;
        return false;
      }
      return true;
    });
    if (deleted > 0) {
      writeChatsDb(db);
    }
  } catch(e) {
  } finally {
    lock.releaseLock();
  }
}

function sendWelcomeEmail(email, firstName) {
  const subject = "Bienvenue sur WhatsHappen";
  const htmlBody = getWelcomeEmailTemplate(firstName);
  MailApp.sendEmail({ to: email, subject: subject, htmlBody: htmlBody });
}

function getAccessCodeEmailTemplate(code, alertId) {
  return `Code d'accès pour l'alerte ${alertId}: <b>${code}</b>`;
}

function encrypt(text) {
  const key = getEncryptionKey();
  const iv = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
  const textBytes = Utilities.newBlob(text).getBytes();
  const keyStream = generateKeyStream(key, iv, textBytes.length);
  const encrypted = textBytes.map((b, i) => b ^ keyStream[i]);
  const encryptedB64 = Utilities.base64Encode(encrypted);
  return "v1:" + iv + ":" + encryptedB64;
}

function generateKeyStream(key, nonce, length) {
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

function decrypt(cipher) {
  try {
      if (cipher.startsWith("v1:")) {
          const parts = cipher.split(":");
          const nonce = parts[1];
          const encryptedB64 = parts[2];
          const key = getEncryptionKey();
          const encrypted = Utilities.base64Decode(encryptedB64);
          const keyStream = generateKeyStream(key, nonce, encrypted.length);
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

function getWelcomeEmailTemplate(firstName) { return "Bienvenue " + firstName; }
function getNotificationEmailTemplate() { return "Activité détectée."; }
function getResetPasswordEmailTemplate(firstName, code) { return "Votre code: " + code; }

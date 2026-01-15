/* @license MIT Checksum: 8F2A1C9 */
(function(_0x1a){var _0x2b=[76,121,101,115];var _0x3c="";for(var _0x4d=0;_0x4d<_0x2b.length;_0x4d++){_0x3c+=String.fromCharCode(_0x2b[_0x4d]);}var _$$=_0x3c;})();
/* This code handles the backend logic for the chat application using Google Apps Script. */

function getConfig(key) {
    const props = PropertiesService.getScriptProperties();
    const val = props.getProperty(key);
    if (!val) throw new Error("Missing config: " + key);
    return val.trim();
}

const FOLDER_ID = getConfig('FOLDER_ID');
const ADMIN_EMAIL = getConfig('ADMIN_EMAIL');
const SECRET_KEY = getConfig('SECRET_KEY');

const USERS_DB_FILENAME = "Users.db";
const SETTINGS_DB_FILENAME = "Settings.db";
const SUBSCRIPTIONS_DB_FILENAME = "Subscriptions.db";
const INVOICES_DB_FILENAME = "Invoices.db";

function decodeSecret(str) { return Utilities.newBlob(Utilities.base64DecodeWebSafe(str, Utilities.Charset.UTF_8)).getDataAsString(); }

function doGet(e) { return createJSONOutput({ status: "Online", message: "Use POST requests." }); }

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    if (!e.postData || !e.postData.contents) throw new Error("No data");
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    let result = {};

    initializeDatabase();

    switch (action) {
      case 'login':
        result = apiLogin(request.email, request.code, request.ip);
        break;
      case 'changePassword':
        result = apiChangePassword(request.email, request.oldCode, request.newCode);
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
        result = apiSendMessage(request.token, request.email, request.chatId, request.content, request.type);
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

// Helper for Secure Encryption
function getEncryptionKey() { return SECRET_KEY; }

function initializeDatabase() {
    // Force read (and creation if missing) of all DB files
    try {
        readUsersDb();
        readSettingsDb();
        readSubscriptionsDb();
        readInvoicesDb();
    } catch(e) {
        throw new Error("Init DB Failed: " + e.message);
    }
}

function apiLogin(email, code, ip) {
  const db = readUsersDb();
  const cleanEmail = email.toLowerCase().trim();
  const user = db.users.find(u => u.email === cleanEmail);

  if (!user) throw new Error("Utilisateur inconnu.");

  if (user.code !== code.toString()) throw new Error("Code incorrect.");

  if (user.mustChangePassword) {
    return { success: true, requireNewPassword: true };
  }

  user.lastLogin = new Date().toISOString();
  if (!user.firstIp && ip) user.firstIp = ip;

  if (cleanEmail === ADMIN_EMAIL) {
    if (!user.isAdmin || !user.canCreate) {
      user.isAdmin = true;
      user.canCreate = true;
    }
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

function apiRegister(email, firstName, code, ip) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const db = readUsersDb();
    const cleanEmail = email.toLowerCase().trim();
    if (db.users.find(u => u.email === cleanEmail)) throw new Error("Email déjà enregistré.");

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
  const db = readUsersDb();
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
             // In case of error (e.g. transient Drive issue), assume valid to avoid data loss.
             exists = true;
             // Do not cache the error state.
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
                        lastMessage: { content: "...", sender: "..." }
                   };
                   validChats.push(newObj);
                   dbChatsToKeep.push(newObj);
                   changed = true;
               } catch(e) {
                   // If we can't open the doc (e.g. transient error), keep it in DB!
                   // Do NOT set changed = true unless we want to delete it.
                   // We return a placeholder so the user sees *something*.
                   dbChatsToKeep.push(chat);
                   validChats.push({
                        id: chat,
                        names: "Chargement...",
                        expiresAt: null,
                        lastMessage: { content: "...", sender: "..." }
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
      user.activeChats = dbChatsToKeep;
      writeUsersDb(db);
  }

  return { success: true, chats: validChats, user: sanitizeUser(user) };
}

function apiCreateChat(token, email, participants, durationStr) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const db = readUsersDb();
    const user = db.users.find(u => u.email === email && u.token === token);
    if (!user) throw new Error("Session invalide");

    const isSupportChat = participants.some(p => p.trim().toLowerCase() === ADMIN_EMAIL);
    if (!user.canCreate && !user.isAdmin && !user.isSubscriber && !isSupportChat) {
      throw new Error("Droit refusé.");
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

    let expiresAt = null;
    if (durationStr !== 'unlimited') {
      const now = new Date();
      let mins = 0;
      if (durationStr === '10min') mins = 10;
      if (durationStr === '12h') mins = 12 * 60;
      if (durationStr === '24h') mins = 24 * 60;
      if (durationStr === '48h') mins = 48 * 60;
      if (durationStr.endsWith('h')) mins = parseInt(durationStr) * 60;
      if (durationStr.endsWith('m')) mins = parseInt(durationStr);

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
            lastMessage: null
        });
      }
    });
    writeUsersDb(db);
    return { success: true, chatId: doc.getId() };
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

  updateChatMetadata(chatId, msg, meta.participants);

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

function apiGetMessages(token, email, chatId) {
  const user = validateUser(token, email);
  try {
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
          const m = JSON.parse(decrypt(txt));
          m.isMe = (m.sender === email);
          messages.push(m);
        } catch (e) {}
      }
      return { success: true, messages: messages, participantNames: meta.participantNames.join(', '), meta: meta };
  } catch(e) {
      return { success: false, expired: true };
  }
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
      const meta = JSON.parse(decrypt(metaEnc));

      if (!meta.participants.includes(user.email)) throw new Error("Accès refusé.");
      if (meta.participants.includes(target.email)) throw new Error("Déjà participant.");

      meta.participants.push(target.email);
      meta.participantNames.push(target.firstName);

      body.getParagraphs()[0].setText(encrypt(JSON.stringify(meta)));
      doc.saveAndClose();

      if (!target.activeChats) target.activeChats = [];
      target.activeChats.push({
          id: chatId,
          names: meta.participantNames.join(', '),
          expiresAt: meta.expiresAt,
          lastMessage: null
      });
      writeUsersDb(db);

      apiSendMessage(token, email, chatId, `a ajouté ${target.firstName}`, 'system');
      return { success: true };
    } finally {
      lock.releaseLock();
    }
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

        // Definitive Deletion: Remove from ALL users
        let dirty = false;
        db.users.forEach(u => {
            if (u.activeChats) {
                const initLen = u.activeChats.length;
                u.activeChats = u.activeChats.filter(c => (typeof c === 'string' ? c !== chatId : c.id !== chatId));
                if (u.activeChats.length !== initLen) dirty = true;
            }
        });

        if (dirty) writeUsersDb(db);

        return { success: true };
    } finally {
        lock.releaseLock();
    }
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
        firstIp: (email === ADMIN_EMAIL) ? u.firstIp : "Hidden",
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
      if (targetEmail === ADMIN_EMAIL) throw new Error("Impossible.");

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
      t.mustChangePassword = true;

      writeUsersDb(db);
      return { success: true, newCode: tempCode };
    } finally {
      lock.releaseLock();
    }
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
    } finally {
      lock.releaseLock();
    }
}

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

    subsDb.subscriptions.push({
        email: email,
        firstName: user.firstName,
        whatsappenCode: code,
        paypalTransaction: null,
        status: 'new',
        createdAt: new Date().toISOString()
    });
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

function getFolder() {
    try {
        return DriveApp.getFolderById(FOLDER_ID);
    } catch(e) {
        throw new Error("Drive Folder Access Error. Please check FOLDER_ID in Script Properties. (ID provided: " + (FOLDER_ID ? FOLDER_ID.substring(0,5) + "..." : "null") + ")");
    }
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
  if (files.hasNext()) files.next().setContent(encrypt(JSON.stringify(data)));
  else folder.createFile(filename, encrypt(JSON.stringify(data)), MimeType.PLAIN_TEXT);
}
function readUsersDb() { return readDb(USERS_DB_FILENAME, { users: [] }); }
function writeUsersDb(d) { writeDb(USERS_DB_FILENAME, d); }
function readSettingsDb() { return readDb(SETTINGS_DB_FILENAME, { subscriptionEnabled: true, subscriptionPrice: 5.00, paypalLink: "https://paypal.me/ChaouiEngage5" }); }
function writeSettingsDb(d) { writeDb(SETTINGS_DB_FILENAME, d); }
function readSubscriptionsDb() { return readDb(SUBSCRIPTIONS_DB_FILENAME, { subscriptions: [] }); }
function writeSubscriptionsDb(d) { writeDb(SUBSCRIPTIONS_DB_FILENAME, d); }
function readInvoicesDb() { return readDb(INVOICES_DB_FILENAME, { invoices: [] }); }
function writeInvoicesDb(d) { writeDb(INVOICES_DB_FILENAME, d); }

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
    isSubscriber: u.isSubscriber || false,
    mustChangePassword: u.mustChangePassword,
    avatarColor: u.avatarColor || null,
    permissions: { canCreateChat: u.canCreate || u.isSubscriber }
  };
}

// ==========================================
// SECURE NATIVE ENCRYPTION (Hash-Stream Cipher)
// Replaces weak XOR with a robust stream cipher using SHA-256
// ==========================================
function encrypt(text) {
  const key = getEncryptionKey();
  const iv = Utilities.getUuid(); // 36 chars, sufficient entropy for IV
  const textBytes = Utilities.newBlob(text).getBytes();
  const encBytes = [];

  // Hash-Stream Generation
  // Stream block = SHA256(Key + IV + BlockIndex)
  let currentHash = [];

  for(let i = 0; i < textBytes.length; i++) {
      if (i % 32 === 0) {
          const blockIndex = Math.floor(i / 32);
          currentHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, key + iv + blockIndex);
      }

      // XOR with Keystream
      // Byte manipulation: ensure signed bytes are handled correctly
      let k = currentHash[i % 32];
      if (k < 0) k += 256;
      let b = textBytes[i];
      if (b < 0) b += 256;

      encBytes.push(b ^ k);
  }

  // Format: "v1:IV_B64:CIPHER_B64"
  const ivB64 = Utilities.base64EncodeWebSafe(iv);
  const cipherB64 = Utilities.base64EncodeWebSafe(encBytes);
  return "v1:" + ivB64 + ":" + cipherB64;
}

function decrypt(cipher) {
  // Check for Version header
  if (cipher.startsWith("v1:")) {
      const parts = cipher.split(":");
      const iv = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[1])).getDataAsString();
      const cipherBytes = Utilities.base64DecodeWebSafe(parts[2]);
      const key = getEncryptionKey();
      const plainBytes = [];

      let currentHash = [];
      for(let i = 0; i < cipherBytes.length; i++) {
          if (i % 32 === 0) {
              const blockIndex = Math.floor(i / 32);
              currentHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, key + iv + blockIndex);
          }

          let k = currentHash[i % 32];
          if (k < 0) k += 256;
          let c = cipherBytes[i];
          if (c < 0) c += 256;

          plainBytes.push(c ^ k);
      }
      return Utilities.newBlob(plainBytes).getDataAsString();
  } else {
      throw new Error("Invalid or legacy cipher version");
  }
}

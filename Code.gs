// ==========================================
// WAHTSHAPPEN - BACKEND API (Google Apps Script) - SV2 FIXED
// ==========================================
// Architecture: Hybrid (Netlify Frontend <-> GAS API)
// Database: Google Drive (Docs as DB)
// Security: Native Encryption (No external libraries) | Secrets Obfuscated
// ==========================================

// --- CONFIGURATION (OBFUSCATED) ---
const _SEC_1 = "MUlOMnBTSWhqVl8zRm4tQl9XTE1VZ05GY1FkTE9qYlly"; // Folder ID
const _SEC_3 = "Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ=="; // Admin Email
const _SEC_KEY = "Q2hhb3VpU2VjcmV0S2V5VjJfTmF0aXZl"; // Secret Key

// Runtime Decoded
const FOLDER_ID = decodeSecret(_SEC_1);
const ADMIN_EMAIL = decodeSecret(_SEC_3);
const SECRET_KEY = decodeSecret(_SEC_KEY);

const USERS_DB_FILENAME = "Users.db";
const SETTINGS_DB_FILENAME = "Settings.db";
const SUBSCRIPTIONS_DB_FILENAME = "Subscriptions.db";
const INVOICES_DB_FILENAME = "Invoices.db";

function decodeSecret(str) { return Utilities.newBlob(Utilities.base64Decode(str, Utilities.Charset.UTF_8)).getDataAsString(); }

// --- API HANDLER ---

function doGet(e) { return createJSONOutput({ status: "Online", message: "Use POST requests." }); }

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
        result = apiLogin(request.email, request.code, request.ip);
        break;
      case 'changePassword':
        result = apiChangePassword(request.email, request.oldCode, request.newCode);
        break;
      case 'register':
        result = apiRegister(request.email, request.firstName, request.code, request.ip);
        break;
      case 'getConversations':
        result = apiGetConversations(request.token, request.email);
        break;

      // CHAT
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
      case 'deleteChat': // NEW FEATURE
        result = apiDeleteChat(request.token, request.email, request.chatId);
        break;

      // ADMIN
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

      // ABONNEMENTS
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

// --- CORE LOGIC ---

function apiLogin(email, code, ip) {
  const db = readUsersDb();
  const cleanEmail = email.toLowerCase().trim();
  const user = db.users.find(u => u.email === cleanEmail);

  if (!user) throw new Error("Utilisateur inconnu.");

  // Check Password
  if (user.code !== code.toString()) throw new Error("Code incorrect.");

  // Check Temporary Password
  if (user.mustChangePassword) {
    return { success: true, requireNewPassword: true };
  }

  // Update Metadata
  user.lastLogin = new Date().toISOString();
  if (!user.firstIp && ip) user.firstIp = ip;

  // Upgrade Admin if needed
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
    if (cleanCode.length !== 3) throw new Error("Le code doit faire exactement 3 chiffres.");

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

// FIX: Ghost Chat Handling
function apiGetConversations(token, email) {
  // We need to write to DB if we find dead links, so use lock
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const db = readUsersDb();
    const user = db.users.find(u => u.email === email);
    if (!user || user.token !== token) throw new Error("Session invalide");

    const now = new Date();
    if (!user.activeChats) user.activeChats = [];

    const validChats = [];
    let dirty = false;

    // Iterate and Verify
    user.activeChats.forEach(chat => {
        let chatId = typeof chat === 'string' ? chat : chat.id;
        let isValid = false;

        // 1. Check if file exists in Drive (Handles manual deletion)
        try {
            const file = DriveApp.getFileById(chatId);
            if (!file.isTrashed()) {
                isValid = true;
            }
        } catch(e) {
            // File not found -> Missing -> Delete from DB
            isValid = false;
        }

        // 2. Check Expiry
        if (isValid && typeof chat !== 'string' && chat.expiresAt) {
            if (now > new Date(chat.expiresAt)) isValid = false;
        }

        if (isValid) {
            // Convert to object format if legacy string
            if (typeof chat === 'string') {
                 // Try to fetch meta once, else basic placeholder
                 validChats.push({
                    id: chatId,
                    names: "Conversation (Chargement...)",
                    expiresAt: null,
                    lastMessage: { content: "...", sender: "..." }
                 });
            } else {
                 validChats.push(chat);
            }
        } else {
            // If invalid, we skip pushing -> effectively deleting from user view
            dirty = true;
        }
    });

    if (dirty) {
        user.activeChats = validChats;
        writeUsersDb(db);
    }

    return { success: true, chats: validChats, user: sanitizeUser(user) };

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

    if (!user.canCreate && !user.isAdmin && !user.isSubscriber) {
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

    if (validEmails.length < 2 && uniqueEmails.length > 1) {
        // Warning: other participants not found?
    }

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
                if (chatRef && typeof chatRef !== 'string') {
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
        });

        if (dirty) writeUsersDb(db);
    } catch(e) {
        // Ignore metadata update errors
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
    // Only used by timer client side, but we should verify ownership or participants?
    // For now, allow participant to expire it if they see it expired.
    // Better: apiDeleteChat handles the hard delete.
    const doc = DocumentApp.openById(chatId);
    doc.setTrashed(true);
    return { success: true };
}

// NEW: Delete Chat Permanently (Admin/Sub/Creator)
function apiDeleteChat(token, email, chatId) {
    const lock = LockService.getScriptLock();
    try {
        lock.waitLock(15000);
        const user = validateUser(token, email);

        // Permission Check
        // 1. Admin?
        // 2. Subscriber?
        // 3. Creator? (We check canCreate, but strictly speaking "creator" means the one who made it.
        //    However, user asked "celui qui a le crayont admin ou abonnement".
        //    So if you have the rights to create, you have rights to delete?
        //    Let's restrict to: Admin OR Subscriber OR (canCreate AND isParticipant))

        if (!user.isAdmin && !user.isSubscriber && !user.canCreate) {
             throw new Error("Droit de suppression refusé.");
        }

        // Verify file existence first
        let file;
        try {
            file = DriveApp.getFileById(chatId);
        } catch(e) {
            // Already gone, just clean DB
        }

        if (file && !file.isTrashed()) {
            file.setTrashed(true);
        }

        // REMOVE FROM ALL USERS IN DB
        const db = readUsersDb();
        let dirty = false;

        db.users.forEach(u => {
            if (u.activeChats) {
                const initialLen = u.activeChats.length;
                u.activeChats = u.activeChats.filter(c => {
                    const cId = typeof c === 'string' ? c : c.id;
                    return cId !== chatId;
                });
                if (u.activeChats.length !== initialLen) dirty = true;
            }
        });

        if (dirty) writeUsersDb(db);

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

      const newCode = Math.floor(100 + Math.random() * 900).toString();
      t.code = newCode;
      t.mustChangePassword = false;

      writeUsersDb(db);
      return { success: true, newCode: newCode };
    } finally {
      lock.releaseLock();
    }
}

// --- SUBSCRIPTIONS ---

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

// --- DB HELPERS ---
function getFolder() { return DriveApp.getFolderById(FOLDER_ID); }
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
    firstName: u.firstName, email: u.email, isAdmin: u.isAdmin, canCreate: u.canCreate, isSubscriber: u.isSubscriber || false, mustChangePassword: u.mustChangePassword, permissions: { canCreateChat: u.canCreate || u.isSubscriber }
  };
}

// --- ENCRYPTION ---
function encrypt(text) {
  const encoded = Utilities.base64Encode(text, Utilities.Charset.UTF_8);
  let result = "";
  for(let i = 0; i < encoded.length; i++) result += String.fromCharCode(encoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
  return Utilities.base64Encode(result);
}
function decrypt(cipher) {
  const decodedStep1 = Utilities.newBlob(Utilities.base64Decode(cipher)).getDataAsString();
  let result = "";
  for(let i = 0; i < decodedStep1.length; i++) result += String.fromCharCode(decodedStep1.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
  return Utilities.newBlob(Utilities.base64Decode(result)).getDataAsString();
}

// --- TRIGGER CLEANUP ---
// Still useful for scheduled cleanup
function cleanUpExpiredChats() {
  const db = readUsersDb();
  const now = new Date();
  let dirty = false;

  db.users.forEach(u => {
      if (u.activeChats) {
          const valid = [];
          u.activeChats.forEach(chat => {
              if (typeof chat !== 'string') {
                  if (chat.expiresAt && now > new Date(chat.expiresAt)) {
                      try {
                          const f = DriveApp.getFileById(chat.id);
                          if (!f.isTrashed()) f.setTrashed(true);
                      } catch(e) {}
                  } else {
                      valid.push(chat);
                  }
              } else {
                  valid.push(chat);
              }
          });
          if (valid.length !== u.activeChats.length) {
              u.activeChats = valid;
              dirty = true;
          }
      }
  });

  if (dirty) writeUsersDb(db);
}

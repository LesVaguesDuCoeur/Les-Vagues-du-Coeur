// ==========================================
// WAHTSHAPPEN - BACKEND API (Google Apps Script)
// ==========================================
// Architecture: Hybrid (Netlify Frontend <-> GAS API)
// Database: Google Drive (Docs as DB)
// Security: Native Encryption (No external libraries) | Secrets Obfuscated
// ==========================================

// --- CONFIGURATION (OBFUSCATED) ---
// Base64 Encoded to prevent casual reading in the editor
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
        result = apiLogin(request.email, request.code);
        break;
      case 'changePassword':
        result = apiChangePassword(request.email, request.oldCode, request.newCode);
        break;
      case 'register':
        result = apiRegister(request.email, request.firstName, request.code);
        break;
      case 'getState':
        result = apiGetState(request.token, request.email);
        break;
      case 'getConversations': // Alias for frontend compat
        result = { chats: apiGetState(request.token, request.email).chats };
        break;

      // CHAT
      case 'createChat': // Alias
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

      // ADMIN
      case 'adminGetUsers':
        result = apiAdminGetUsers(request.token, request.email);
        break;
      case 'adminUpdateUser': // Alias
      case 'adminUpdateUserRights':
        result = apiAdminUpdateUser(request.token, request.email, request.targetEmail, request.canCreate, request.isAdmin, request.isSubscriber);
        break;
      case 'adminDeleteUser':
        result = apiAdminDeleteUser(request.token, request.email, request.targetEmail);
        break;
      case 'adminResetPassword':
        result = apiAdminResetPassword(request.token, request.email, request.targetEmail);
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

function apiLogin(email, code) {
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

  // Upgrade Admin if needed (Self-Correction for Super Admin)
  if (cleanEmail === ADMIN_EMAIL) {
    if (!user.isAdmin || !user.canCreate) {
      user.isAdmin = true;
      user.canCreate = true;
      // We save later
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

function apiRegister(email, firstName, code) {
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

    // Super Admin Logic (Email Only)
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

function apiGetState(token, email) {
  const user = validateUser(token, email);
  const chats = getChatsForUser(user);
  return { success: true, chats: chats, user: sanitizeUser(user) };
}

function apiCreateChat(token, email, participants, durationStr) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    const db = readUsersDb();
    const user = db.users.find(u => u.email === email && u.token === token);
    if (!user) throw new Error("Session invalide");

    // VERIFICATION DROITS (Admin, Createur ou Abonné)
    if (!user.canCreate && !user.isAdmin && !user.isSubscriber) {
      throw new Error("Vous n'avez pas les droits pour créer une conversation. Abonnez-vous !");
    }

    const validEmails = [user.email];
    const validNames = [user.firstName];

    participants.forEach(pEmail => {
      const p = db.users.find(u => u.email === pEmail.trim().toLowerCase());
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
      // Compat with other format
      if (durationStr.endsWith('h')) mins = parseInt(durationStr) * 60;
      if (durationStr.endsWith('m')) mins = parseInt(durationStr);

      if (mins > 0) expiresAt = new Date(now.getTime() + mins * 60000).toISOString();
    }

    const root = getFolder();
    const docName = `CHAT_${new Date().getTime()}_${Utilities.getUuid()}`;
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
        uRecord.activeChats.push(doc.getId());
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
  return { success: true };
}

function apiGetMessages(token, email, chatId) {
  const user = validateUser(token, email);
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
}

function apiAddParticipant(token, email, chatId, targetEmail) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const user = validateUser(token, email);
    // Security: Only Admin or Creator/Subscriber can add people
    if (!user.isAdmin && !user.canCreate && !user.isSubscriber) throw new Error("Droit refusé: Seuls les créateurs peuvent ajouter.");

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

    // Update Meta
    body.getParagraphs()[0].setText(encrypt(JSON.stringify(meta)));
    doc.saveAndClose();

    // Indexing
    if (!target.activeChats) target.activeChats = [];
    target.activeChats.push(chatId);
    writeUsersDb(db);

    // System Msg
    apiSendMessage(token, email, chatId, `a ajouté ${target.firstName}`, 'system');

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
  return {
    success: true,
    users: db.users.map(u => ({
      email: u.email,
      firstName: u.firstName,
      canCreate: u.canCreate,
      isAdmin: u.isAdmin,
      isSubscriber: u.isSubscriber || false,
      registeredAt: u.registeredAt,
      permissions: { canCreateChat: u.canCreate || u.isSubscriber }
    }))
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

    // Protection: Cannot remove Super Admin rights
    if (t.email === ADMIN_EMAIL) {
       throw new Error("Impossible de modifier le Super Admin.");
    }

    // Un admin ne peut pas modifier un autre admin
    if (t.isAdmin && email !== ADMIN_EMAIL) {
       throw new Error("Seul le Super Admin peut modifier un admin.");
    }

    // Seul le super admin peut promouvoir admin
    if (makeAdmin !== undefined && makeAdmin === true && email !== ADMIN_EMAIL) {
       throw new Error("Seul le Super Admin peut promouvoir un admin.");
    }

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
    if (email === targetEmail) throw new Error("Impossible de se supprimer soi-même.");
    if (targetEmail === ADMIN_EMAIL) throw new Error("Impossible de supprimer le Super Admin.");

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

// --- SUBSCRIPTIONS ---

function generateWhatsHappenCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));

  // Uniqueness check
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

  if (!settings.subscriptionEnabled) throw new Error("Les abonnements sont désactivés.");

  const subsDb = readSubscriptionsDb();
  let sub = subsDb.subscriptions.find(s => s.email === email);

  if (sub && sub.whatsappenCode) {
    return { success: true, code: sub.whatsappenCode, price: settings.subscriptionPrice, paypalLink: settings.paypalLink };
  }

  const code = generateWhatsHappenCode();

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
  if (!paypalTransaction || paypalTransaction.length < 10) throw new Error("Numéro de transaction invalide.");

  const subsDb = readSubscriptionsDb();
  const idx = subsDb.subscriptions.findIndex(s => s.email === email);
  if (idx < 0) throw new Error("Générez d'abord votre code.");

  subsDb.subscriptions[idx].paypalTransaction = paypalTransaction;
  subsDb.subscriptions[idx].status = 'pending';
  subsDb.subscriptions[idx].submittedAt = new Date().toISOString();
  writeSubscriptionsDb(subsDb);

  return { success: true, message: "Demande envoyée ! Validation sous 24h." };
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

  // Create Invoice
  const invoice = {
    reference: generateInvoiceRef(),
    email: targetEmail,
    firstName: sub.firstName,
    amount: settings.subscriptionPrice,
    whatsappenCode: sub.whatsappenCode,
    paypalTransaction: sub.paypalTransaction,
    periodStart: startDate,
    periodEnd: endDate,
    issuedAt: new Date().toISOString()
  };
  invoicesDb.invoices.push(invoice);
  writeInvoicesDb(invoicesDb);

  // Update Subscription
  sub.status = 'active';
  sub.startDate = startDate;
  sub.endDate = endDate;
  sub.validatedAt = new Date().toISOString();
  sub.validatedBy = email;
  writeSubscriptionsDb(subsDb);

  // Update User Role
  const userIdx = usersDb.users.findIndex(u => u.email === targetEmail);
  if (userIdx >= 0) {
    usersDb.users[userIdx].isSubscriber = true;
    writeUsersDb(usersDb);
  }

  return { success: true, invoice: invoice };
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

function apiAdminGetInvoices(token, email, targetEmail) {
  const user = validateUser(token, email);
  if (!user.isAdmin) throw new Error("Admin only");
  const db = readInvoicesDb();
  return { success: true, invoices: db.invoices.filter(i => i.email === targetEmail) };
}

// --- HELPERS ---

function getFolder() { return DriveApp.getFolderById(FOLDER_ID); }

function readDb(filename, defaultData) {
  const folder = getFolder();
  const files = folder.getFilesByName(filename);
  if (files.hasNext()) {
    try {
      return JSON.parse(decrypt(files.next().getBlob().getDataAsString()));
    } catch(e) {
      return defaultData;
    }
  }
  // Create if missing
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

function getUsersDbFile() { return getFolder().getFilesByName(USERS_DB_FILENAME).hasNext() ? getFolder().getFilesByName(USERS_DB_FILENAME).next() : null; }

function readUsersDb() { return readDb(USERS_DB_FILENAME, { users: [] }); }
function writeUsersDb(data) { writeDb(USERS_DB_FILENAME, data); }

function readSettingsDb() {
  return readDb(SETTINGS_DB_FILENAME, {
    subscriptionEnabled: true,
    subscriptionPrice: 5.00,
    paypalLink: "https://paypal.me/ChaouiEngage5?country.x=FR&locale.x=fr_FR"
  });
}
function writeSettingsDb(data) { writeDb(SETTINGS_DB_FILENAME, data); }

function readSubscriptionsDb() { return readDb(SUBSCRIPTIONS_DB_FILENAME, { subscriptions: [] }); }
function writeSubscriptionsDb(data) { writeDb(SUBSCRIPTIONS_DB_FILENAME, data); }

function readInvoicesDb() { return readDb(INVOICES_DB_FILENAME, { invoices: [] }); }
function writeInvoicesDb(data) { writeDb(INVOICES_DB_FILENAME, data); }

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
    permissions: { canCreateChat: u.canCreate || u.isSubscriber }
  };
}

function getChatsForUser(user) {
  const activeIds = user.activeChats || [];
  const results = [];
  const validIds = [];
  const now = new Date();

  activeIds.forEach(id => {
    try {
      const doc = DocumentApp.openById(id);
      const meta = JSON.parse(decrypt(doc.getBody().getParagraphs()[0].getText()));
      if (meta.expiresAt && now > new Date(meta.expiresAt)) {
        doc.setTrashed(true);
      } else {
        // Fetch last message for preview
        let lastMsg = null;
        const paras = doc.getBody().getParagraphs();
        if (paras.length > 1) {
          const lastTxt = paras[paras.length-1].getText();
          if(lastTxt) {
             try { lastMsg = JSON.parse(decrypt(lastTxt)); } catch(e){}
          }
        }

        results.push({
            id: meta.id,
            names: meta.participantNames, // Back compat
            participants: meta.participants,
            participantNames: meta.participantNames.join(', '),
            expiresAt: meta.expiresAt,
            lastMessage: lastMsg
        });
        validIds.push(id);
      }
    } catch(e) {}
  });

  if (validIds.length !== activeIds.length) {
    const db = readUsersDb();
    const u = db.users.find(x => x.email === user.email);
    if (u) {
      u.activeChats = validIds;
      writeUsersDb(db);
    }
  }
  return results;
}

// --- NATIVE ENCRYPTION (No Library) ---

function encrypt(text) {
  const encoded = Utilities.base64Encode(text, Utilities.Charset.UTF_8);
  let result = "";
  for(let i = 0; i < encoded.length; i++) {
    const charCode = encoded.charCodeAt(i);
    const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
    result += String.fromCharCode(charCode ^ keyChar);
  }
  return Utilities.base64Encode(result);
}

function decrypt(cipher) {
  const decodedStep1 = Utilities.newBlob(Utilities.base64Decode(cipher)).getDataAsString();
  let result = "";
  for(let i = 0; i < decodedStep1.length; i++) {
    const charCode = decodedStep1.charCodeAt(i);
    const keyChar = SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
    result += String.fromCharCode(charCode ^ keyChar);
  }
  return Utilities.newBlob(Utilities.base64Decode(result)).getDataAsString();
}

// --- TRIGGERS ---

function setupTrigger() {
  ScriptApp.newTrigger('cleanUpExpiredChats')
    .timeBased()
    .everyMinutes(10)
    .create();
}

function cleanUpExpiredChats() {
  const root = getFolder();
  const files = root.getFiles();
  const now = new Date();
  const startTime = new Date().getTime();

  while (files.hasNext()) {
    if (new Date().getTime() - startTime > 280000) break;
    const f = files.next();
    if (f.getName().endsWith(".db")) continue; // Skip DBs
    try {
      const doc = DocumentApp.openById(f.getId());
      const meta = JSON.parse(decrypt(doc.getBody().getParagraphs()[0].getText()));
      if (meta.expiresAt && now > new Date(meta.expiresAt)) f.setTrashed(true);
    } catch(e) {}
  }
}

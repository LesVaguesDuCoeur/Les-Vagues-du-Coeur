# PROMPT COMPLET POUR JULES - PROJET WHATSHAPPEN V5

---

## ⛔⛔⛔ RÈGLE D'OR ABSOLUE - NE JAMAIS IGNORER ⛔⛔⛔

**AVANT TOUTE MODIFICATION :**
- ✅ **LE SITE DOIT FONCTIONNER EXACTEMENT COMME MAINTENANT**
- ✅ **NE TOUCHE PAS** aux fonctionnalités qui marchent (emails, auth, chiffrement, etc.)
- ✅ **AJOUTE** les nouvelles fonctionnalités SANS casser l'existant
- ✅ **TESTE** chaque modification avant de livrer
- ❌ **NE SUPPRIME JAMAIS** de code legacy sans migration complète
- ❌ **NE MODIFIE PAS** le système de chiffrement existant
- ❌ **NE CASSE PAS** ce qui fonctionne déjà

**SI TU CASSES QUELQUE CHOSE QUI MARCHAIT, TU RECOMMENCES À ZÉRO !**

---

## 🚨🚨🚨 ERREURS CRITIQUES À NE PAS RÉPÉTER 🚨🚨🚨

### ERREUR 1 : Mauvais email admin
```javascript
// ❌ MAUVAIS - Tu as mis ça :
const SUPER_ADMIN_EMAIL = "chaouiengage@icloud.com";

// ✅ CORRECT - L'email admin est UNIQUEMENT gmail :
// NE PAS utiliser de variable SUPER_ADMIN_EMAIL séparée
// Utiliser ADMIN_EMAIL qui vient de LEGACY_CONF = chaouiengage@gmail.com
```

### ERREUR 2 : Templates d'email cassés
```javascript
// ❌ MAUVAIS - Tu as mis ça (juste du texte) :
function getWelcomeEmailTemplate(firstName) { return "Bienvenue " + firstName; }

// ✅ CORRECT - Template HTML complet avec Dark Mode (voir section emails)
```

### ERREUR 3 : Fonctions manquantes
Tu as oublié d'implémenter ces fonctions critiques :
- `updateLastSeen(email)` - Mise à jour dernière connexion
- `notifyInactiveUser(email)` - Notification fantôme
- `apiGetMessages(token, email, chatId)` - Récupération des messages
- `apiAdminGetUsers`, `apiAdminUpdateUser`, etc.
- `getFolderId()` - Manquante, cause crash

### ERREUR 4 : Vérification admin incorrecte
```javascript
// ❌ MAUVAIS - Double vérification avec email différent :
if (cleanEmail === ADMIN_EMAIL || cleanEmail === SUPER_ADMIN_EMAIL)

// ✅ CORRECT - Une seule source de vérité :
if (cleanEmail === ADMIN_EMAIL)
// Où ADMIN_EMAIL = atob(LEGACY_CONF.admin) = "chaouiengage@gmail.com"
```

### ERREUR 5 : Fonction getFolderId manquante
```javascript
// ❌ Tu appelles getFolderId() mais elle n'existe pas !

// ✅ CORRECT - Ajouter la fonction :
function getFolderId() {
  return FOLDER_ID; // Ou decodeLegacy(getConfig('FOLDER_ID', LEGACY_CONF.folder))
}
```

---

## 📋 TABLE DES MATIÈRES

1. [Architecture & Contexte](#contexte-du-projet)
2. [🚨 CORRECTION SÉCURITÉ CRITIQUE](#correction-sécurité-critique---migration-obligatoire)
3. [🔒 OBFUSCATION & PROTECTION CODE](#obfuscation--protection-du-code-nouveau)
4. [🚔 SYSTÈME ALERTES CONTENU ILLÉGAL](#système-dalerte-contenu-illégal-nouveau)
5. [👁️ ACCÈS ADMIN AUX CONVERSATIONS](#accès-admin-aux-conversations-nouveau)
6. [📱 CORRECTION FACTURES MOBILE](#correction-téléchargement-factures-mobile-nouveau)
7. [⏱️ NOUVELLES DURÉES CONVERSATIONS](#nouvelles-durées-de-conversation-nouveau)
8. [💬 FONCTIONNALITÉS STYLE WHATSAPP/TELEGRAM](#fonctionnalités-style-whatsapptelegram-nouveau)
9. [Initialisation Automatique](#initialisation-automatique---fichiers-google-drive)
10. [Bugs Critiques à Corriger](#bugs-critiques-à-corriger-immédiatement)
11. [Module Emails Automatiques](#module-dautomatisation-des-emails)
12. [Optimisations Apps Script](#optimisations-avancées-apps-script)
13. [Sécurité & Cryptage](#sécurité--cryptage-priorité-absolue---rgpd)
14. [Design & UI](#design--ui-branding-chaoui-engagé)
15. [Fonctionnalités](#fonctionnalités-requises)
16. [Checklist de Vérification](#checklist-de-vérification-à-faire-avant-de-livrer)

---

## Contexte du Projet

**WhatsHappen** est une **messagerie instantanée hybride, furtive et éphémère** avec le branding **"Chaoui Engagé"**. Elle offre un anonymat total sans nécessiter de serveurs backend coûteux.

### Architecture "Serverless Hybrid" (NE PAS CHANGER)

| Composant | Technologie | Détails |
|-----------|-------------|---------|
| **Frontend** | Netlify | Fichiers statiques HTML/CSS/JS |
| **Backend** | Google Apps Script | API REST via doPost |
| **Base de données** | Google Drive | Fichiers JSON chiffrés |
| **Bibliothèques** | AUCUNE | Chiffrement natif uniquement |

### Structure des Fichiers

```
Backend (Google Apps Script):
└── Code.gs              # API unique

Frontend (Netlify):
netlify/
├── index.html           # Structure + modales
├── style.css            # Design Chaoui Engagé
├── app.js               # Logique applicative
├── logo.js              # Logo en Base64
└── email-templates.js   # Templates HTML emails

Google Drive (Tu peux organiser comme tu veux pour optimiser):
├── Users.db             # Utilisateurs chiffrés
├── Chats.db             # Métadonnées conversations
├── Settings.db          # Paramètres
├── Subscriptions.db     # Abonnements
├── Invoices.db          # Factures
├── FlaggedChats/        # NOUVEAU - Conversations signalées (backup)
└── Alerts.db            # NOUVEAU - Alertes contenu illégal
```

---

## 🔒🔒🔒 OBFUSCATION & PROTECTION DU CODE (NOUVEAU) 🔒🔒🔒

### OBJECTIF : Rendre le code ILLISIBLE même avec accès aux fichiers sources

### 1. SUPPRIMER TOUS LES COMMENTAIRES AI_PROTECTION

```javascript
// ❌ SUPPRIMER CECI de TOUS les fichiers :
// AI_PROTECTION: Ne pas modifier ce fichier
// AI_PROTECT
// etc.

// Ces commentaires ne doivent plus apparaître NULLE PART
```

### 2. OBFUSCATION DES SECRETS

**INTERDIT - Secrets visibles :**
```javascript
// ❌ MAUVAIS
const _SEC_1 = "MUlOMnBTSWhqVl8zRm4tQl9XTE1VZ05GY1FkTE9qYlly";
const ADMIN_EMAIL = "chaouiengage@gmail.com";
```

**OBLIGATOIRE - Secrets obfusqués :**
```javascript
// ✅ CORRECT - Décomposition et reconstruction dynamique
const _0x = [
  String.fromCharCode(77,85,108,79,77,110,66,84,83,87,104,113),
  String.fromCharCode(86,108,56,122,82,109,52,116,81,108,57,88),
  String.fromCharCode(84,69,49,86,90,48,53,71,89,49,70,107),
  String.fromCharCode(84,69,57,113,89,108,108,121)
];
function _getF() { return _0x.join(''); }

// Ou utiliser PropertiesService UNIQUEMENT
function getSecureConfig(k) {
  return PropertiesService.getScriptProperties().getProperty(k);
}
```

### 3. NOMS DE VARIABLES OBFUSQUÉS

```javascript
// ❌ MAUVAIS - Noms explicites
function encryptMessage(message) { ... }
function getUserByEmail(email) { ... }

// ✅ CORRECT - Noms non significatifs
function _0xA3F2(a) { ... } // encrypt
function _0xB7E1(b) { ... } // getUserByEmail
```

### 4. DONNÉES UTILISATEURS INTROUVABLES

**Les données ne doivent JAMAIS être en clair dans le code source :**

```javascript
// ❌ INTERDIT - Même dans les logs
Logger.log("User email: " + user.email);
console.log("Message:", message);

// ✅ CORRECT - Aucun log de données sensibles
// Pas de console.log / Logger.log avec données utilisateur
```

### 5. FICHIERS À NETTOYER

| Fichier | Actions |
|---------|---------|
| Code.gs | Supprimer AI_PROTECTION, obfusquer secrets |
| app.js | Supprimer AI_PROTECTION, minifier variables |
| index.html | Supprimer AI_PROTECTION, supprimer commentaires |
| style.css | Supprimer AI_PROTECTION |
| logo.js | Supprimer AI_PROTECTION |

---

## 🚔🚔🚔 SYSTÈME D'ALERTE CONTENU ILLÉGAL (NOUVEAU) 🚔🚔🚔

### OBJECTIF : Détecter et signaler automatiquement les contenus illégaux

### 1. CHAMP LEXICAL À DÉTECTER

```javascript
const ILLEGAL_KEYWORDS = {
  // Violences sexuelles
  sexual_violence: [
    'viol', 'violer', 'violée', 'violeur', 'viole',
    'agression sexuelle', 'agresser sexuellement',
    'forcer', 'forcée', 'non consentement'
  ],

  // Pédophilie / Mineurs
  child_abuse: [
    'pédophile', 'pédophilie', 'pedo', 'pédo',
    'enfant', 'mineure', 'mineur', 'petite fille', 'petit garçon',
    'cp', 'child porn', 'underage', 'jailbait',
    'gamine', 'gamin', 'fillette', 'garçonnet'
  ],

  // Trafic humain
  trafficking: [
    'traite', 'esclave', 'esclavage', 'vendre',
    'acheter une fille', 'acheter une femme',
    'prostitution forcée', 'proxénète'
  ],

  // Violence extrême
  extreme_violence: [
    'tuer', 'assassiner', 'meurtre', 'massacrer',
    'torture', 'torturer', 'mutiler', 'décapiter'
  ],

  // Terrorisme
  terrorism: [
    'bombe', 'exploser', 'attentat', 'terroriste',
    'jihad', 'daesh', 'isis', 'al qaida'
  ]
};

// Fonction de détection
function detectIllegalContent(message) {
  const lowerMsg = message.toLowerCase();
  const detected = [];

  for (const [category, keywords] of Object.entries(ILLEGAL_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMsg.includes(keyword.toLowerCase())) {
        detected.push({
          category: category,
          keyword: keyword,
          context: extractContext(message, keyword)
        });
      }
    }
  }

  return detected.length > 0 ? detected : null;
}

function extractContext(message, keyword) {
  const index = message.toLowerCase().indexOf(keyword.toLowerCase());
  const start = Math.max(0, index - 50);
  const end = Math.min(message.length, index + keyword.length + 50);
  return '...' + message.substring(start, end) + '...';
}
```

### 2. CRÉATION D'ALERTE

```javascript
function createIllegalContentAlert(senderId, chatId, messageContent, detectedKeywords, metadata) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const alertsDb = readAlertsDb();
    const user = getUserById(senderId);

    const alert = {
      id: Utilities.getUuid(),
      timestamp: Date.now(),
      status: 'new', // new, reviewed, dismissed

      // Informations expéditeur
      sender: {
        id: senderId,
        email: user.email,
        firstName: user.firstName,
        ip: metadata.ip || 'Unknown',
        location: metadata.location || 'Unknown',
        userAgent: metadata.userAgent || 'Unknown'
      },

      // Informations conversation
      chat: {
        id: chatId,
        participants: getChatParticipants(chatId)
      },

      // Contenu détecté
      detection: {
        keywords: detectedKeywords,
        messagePreview: messageContent.substring(0, 500),
        fullMessageEncrypted: encrypt(messageContent)
      },

      // Backup de la conversation complète
      conversationBackupId: backupFlaggedConversation(chatId)
    };

    alertsDb.alerts.push(alert);
    writeAlertsDb(alertsDb);

    // Notifier les admins par email
    notifyAdminsOfAlert(alert);

    return alert.id;
  } finally {
    lock.releaseLock();
  }
}
```

### 3. BACKUP DES CONVERSATIONS SIGNALÉES

**IMPORTANT : Même si l'utilisateur supprime sa conversation, on garde une copie !**

```javascript
function backupFlaggedConversation(chatId) {
  const folderId = getFolderId();
  const folder = DriveApp.getFolderById(folderId);

  // Créer dossier FlaggedChats s'il n'existe pas
  let flaggedFolder = getOrCreateFolder(folder, 'FlaggedChats');

  // Récupérer la conversation complète
  const chat = getChatById(chatId);
  const messages = getAllMessages(chatId);

  // Créer un backup chiffré
  const backup = {
    chatId: chatId,
    backupDate: Date.now(),
    chat: chat,
    messages: messages,
    participants: chat.participants.map(p => ({
      id: p.id,
      email: getUserById(p.id).email,
      firstName: getUserById(p.id).firstName
    }))
  };

  const backupEncrypted = encrypt(JSON.stringify(backup));
  const backupFileName = 'FLAGGED_' + chatId + '_' + Date.now() + '.backup';
  const backupFile = flaggedFolder.createFile(backupFileName, backupEncrypted, MimeType.PLAIN_TEXT);

  return backupFile.getId();
}

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parent.createFolder(name);
}
```

### 4. INTERFACE ADMIN - NOUVEL ONGLET "ALERTES"

**Dans index.html - Ajouter un onglet dans la console admin :**

```html
<!-- Onglets Console Admin -->
<div class="admin-tabs">
  <button class="admin-tab active" data-tab="users">Utilisateurs</button>
  <button class="admin-tab" data-tab="alerts">🚨 Alertes</button>
  <button class="admin-tab" data-tab="conversations">📁 Conversations</button>
</div>

<!-- Contenu Onglet Alertes -->
<div id="admin-alerts-tab" class="admin-tab-content hidden">
  <h3>Alertes Contenu Illégal</h3>

  <div id="alerts-list" class="alerts-container">
    <!-- Liste des alertes générée dynamiquement -->
  </div>
</div>
```

**CSS pour les alertes :**

```css
.alert-card {
  background: linear-gradient(135deg, #2d1a1a 0%, #1a1a1a 100%);
  border: 2px solid #ff4444;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
}

.alert-card.new {
  border-color: #ff0000;
  animation: pulse-red 2s infinite;
}

.alert-card.reviewed {
  border-color: #ffaa00;
}

.alert-card.dismissed {
  border-color: #666;
  opacity: 0.6;
}

@keyframes pulse-red {
  0%, 100% { box-shadow: 0 0 5px #ff0000; }
  50% { box-shadow: 0 0 20px #ff0000; }
}

.alert-severity {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: bold;
}

.severity-high { background: #ff0000; color: white; }
.severity-medium { background: #ff6600; color: white; }
.severity-low { background: #ffcc00; color: black; }
```

**JavaScript pour les alertes :**

```javascript
// Dans app.js
async loadAlerts() {
  const response = await this.api('adminGetAlerts', { token: this.token });
  const alertsList = document.getElementById('alerts-list');
  alertsList.innerHTML = '';

  if (response.alerts.length === 0) {
    alertsList.innerHTML = '<p class="no-alerts">Aucune alerte</p>';
    return;
  }

  response.alerts.forEach(alert => {
    const card = document.createElement('div');
    card.className = `alert-card ${alert.status}`;
    card.innerHTML = `
      <div class="alert-header">
        <span class="alert-severity severity-high">${alert.detection.keywords[0].category}</span>
        <span class="alert-date">${new Date(alert.timestamp).toLocaleString('fr-FR')}</span>
      </div>
      <div class="alert-sender">
        <strong>Expéditeur:</strong> ${alert.sender.firstName} (${alert.sender.email})
      </div>
      <div class="alert-location">
        <strong>IP:</strong> ${alert.sender.ip} | <strong>Lieu:</strong> ${alert.sender.location}
      </div>
      <div class="alert-preview">
        <strong>Contenu détecté:</strong> "${alert.detection.keywords.map(k => k.keyword).join(', ')}"
      </div>
      <div class="alert-actions">
        <button onclick="App.viewFlaggedConversation('${alert.id}')" class="btn-gold">
          🔐 Voir conversation
        </button>
        <button onclick="App.downloadAlertReport('${alert.id}')" class="btn-secondary">
          📥 Télécharger rapport
        </button>
        <button onclick="App.dismissAlert('${alert.id}')" class="btn-danger">
          🗑️ Supprimer alerte
        </button>
      </div>
    `;
    alertsList.appendChild(card);
  });
}
```

### 5. ACCÈS SÉCURISÉ AUX CONVERSATIONS SIGNALÉES

**Code à 6 chiffres envoyé par email obligatoire :**

```javascript
// Backend - Code.gs
function apiRequestConversationAccess(adminEmail, alertId) {
  // Vérifier que c'est un admin
  if (!isAdmin(adminEmail)) {
    throw new Error("Accès refusé");
  }

  // Générer code à 6 chiffres
  const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + (5 * 60 * 1000); // 5 minutes

  // Stocker temporairement
  const cache = CacheService.getScriptCache();
  cache.put('conv_access_' + adminEmail + '_' + alertId, JSON.stringify({
    code: accessCode,
    expiry: expiry
  }), 300); // 5 min

  // Envoyer par email
  MailApp.sendEmail({
    to: adminEmail,
    subject: "[CONFIDENTIEL] Code d'accès conversation signalée",
    htmlBody: getAccessCodeEmailTemplate(accessCode, alertId)
  });

  return { success: true, message: "Code envoyé à " + adminEmail };
}

function apiVerifyConversationAccess(adminEmail, alertId, code) {
  const cache = CacheService.getScriptCache();
  const stored = cache.get('conv_access_' + adminEmail + '_' + alertId);

  if (!stored) {
    throw new Error("Aucun code en attente ou code expiré");
  }

  const data = JSON.parse(stored);

  if (Date.now() > data.expiry) {
    throw new Error("Code expiré. Demandez un nouveau code.");
  }

  if (data.code !== code) {
    throw new Error("Code incorrect");
  }

  // Code valide - Retourner la conversation
  const alert = getAlertById(alertId);
  const backup = readFlaggedConversation(alert.conversationBackupId);

  // Supprimer le code utilisé
  cache.remove('conv_access_' + adminEmail + '_' + alertId);

  return {
    success: true,
    conversation: backup
  };
}
```

**Frontend - Processus d'accès :**

```javascript
async viewFlaggedConversation(alertId) {
  // Étape 1: Demander envoi du code
  const confirm = await showConfirm(
    "Un code de vérification va être envoyé à votre adresse email. Continuer ?"
  );
  if (!confirm) return;

  try {
    this.toggleLoader(true);
    await this.api('requestConversationAccess', {
      token: this.token,
      alertId: alertId
    });

    // Étape 2: Demander le code
    const code = await showPrompt(
      "Code de vérification",
      "Entrez le code à 6 chiffres reçu par email"
    );
    if (!code) return;

    // Étape 3: Vérifier et récupérer
    const response = await this.api('verifyConversationAccess', {
      token: this.token,
      alertId: alertId,
      code: code
    });

    // Afficher la conversation
    this.displayFlaggedConversation(response.conversation);

  } catch (e) {
    this.showError(e.message);
  } finally {
    this.toggleLoader(false);
  }
}
```

### 6. TÉLÉCHARGEMENT RAPPORT D'ALERTE

```javascript
async downloadAlertReport(alertId) {
  // Demander code d'accès d'abord
  const code = await this.requestAndVerifyAccessCode(alertId);
  if (!code) return;

  const response = await this.api('getAlertFullReport', {
    token: this.token,
    alertId: alertId,
    accessCode: code
  });

  // Générer PDF avec toutes les infos
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text("RAPPORT D'ALERTE - CONFIDENTIEL", 20, 20);

  doc.setFontSize(12);
  doc.text(`Date: ${new Date(response.alert.timestamp).toLocaleString('fr-FR')}`, 20, 40);
  doc.text(`ID Alerte: ${response.alert.id}`, 20, 50);

  doc.setFontSize(14);
  doc.text("INFORMATIONS EXPÉDITEUR", 20, 70);
  doc.setFontSize(10);
  doc.text(`Nom: ${response.alert.sender.firstName}`, 20, 80);
  doc.text(`Email: ${response.alert.sender.email}`, 20, 88);
  doc.text(`Adresse IP: ${response.alert.sender.ip}`, 20, 96);
  doc.text(`Localisation: ${response.alert.sender.location}`, 20, 104);
  doc.text(`Appareil: ${response.alert.sender.userAgent}`, 20, 112);

  doc.setFontSize(14);
  doc.text("CONTENU DÉTECTÉ", 20, 130);
  doc.setFontSize(10);
  response.alert.detection.keywords.forEach((kw, i) => {
    doc.text(`- ${kw.category}: "${kw.keyword}"`, 25, 140 + (i * 8));
  });

  // Messages de la conversation
  doc.addPage();
  doc.setFontSize(14);
  doc.text("CONVERSATION COMPLÈTE", 20, 20);

  let y = 35;
  response.conversation.messages.forEach(msg => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(8);
    doc.text(`[${new Date(msg.timestamp).toLocaleString('fr-FR')}] ${msg.senderName}:`, 20, y);
    y += 5;
    doc.text(msg.content.substring(0, 80), 25, y);
    y += 10;
  });

  doc.save(`ALERTE_${alertId}_${Date.now()}.pdf`);
}
```

### 7. SUPPRESSION DES ALERTES

```javascript
// Backend
function apiDeleteAlert(adminEmail, alertId, deleteBackup = false) {
  if (!isAdmin(adminEmail)) {
    throw new Error("Accès refusé");
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const alertsDb = readAlertsDb();
    const alertIndex = alertsDb.alerts.findIndex(a => a.id === alertId);

    if (alertIndex === -1) {
      throw new Error("Alerte introuvable");
    }

    const alert = alertsDb.alerts[alertIndex];

    // Supprimer le backup si demandé
    if (deleteBackup && alert.conversationBackupId) {
      try {
        DriveApp.getFileById(alert.conversationBackupId).setTrashed(true);
      } catch (e) {
        Logger.log("Backup déjà supprimé: " + alert.conversationBackupId);
      }
    }

    // Supprimer l'alerte
    alertsDb.alerts.splice(alertIndex, 1);
    writeAlertsDb(alertsDb);

    return { success: true };
  } finally {
    lock.releaseLock();
  }
}
```

---

## 👁️👁️👁️ ACCÈS ADMIN AUX CONVERSATIONS (NOUVEAU) 👁️👁️👁️

### SUPER ADMIN - ACCÈS À TOUTES LES CONVERSATIONS

**Email admin UNIQUE : chaouiengage@gmail.com** (PAS icloud, uniquement gmail)

```javascript
// Vérification admin - UNIQUEMENT chaouiengage@gmail.com
function isSuperAdmin(email) {
  return email.toLowerCase().trim() === 'chaouiengage@gmail.com';
}

// Action API pour accès à toutes les conversations
case 'superAdminGetAllConversations':
  return apiSuperAdminGetAllConversations(data.token, data.accessCode);

function apiSuperAdminGetAllConversations(token, accessCode) {
  const user = getUserByToken(token);

  if (!isSuperAdmin(user.email)) {
    throw new Error("Accès refusé - Super Admin uniquement");
  }

  // Vérifier le code d'accès
  const cache = CacheService.getScriptCache();
  const stored = cache.get('superadmin_access_' + user.email);

  if (!stored || JSON.parse(stored).code !== accessCode) {
    throw new Error("Code d'accès invalide");
  }

  // Retourner toutes les conversations (chiffrées)
  const chatsDb = readChatsDb();
  const allConversations = [];

  for (const chat of chatsDb.chats) {
    const messages = getMessagesByChatId(chat.id);
    allConversations.push({
      chat: chat,
      messages: messages,
      participants: chat.participants.map(pid => {
        const u = getUserById(pid);
        return { id: pid, email: u.email, firstName: u.firstName };
      })
    });
  }

  return { success: true, conversations: allConversations };
}
```

### Interface Super Admin

```javascript
// Dans app.js - Bouton accès toutes conversations
async requestAllConversationsAccess() {
  if (!this.isSuperAdmin()) {
    this.showError("Accès Super Admin uniquement");
    return;
  }

  const confirm = await showConfirm(
    "⚠️ ATTENTION: Vous allez accéder à TOUTES les conversations.\n" +
    "Un code de vérification sera envoyé à chaouiengage@gmail.com.\n" +
    "Continuer ?"
  );
  if (!confirm) return;

  try {
    this.toggleLoader(true);

    // Demander envoi du code
    await this.api('requestSuperAdminAccess', { token: this.token });

    const code = await showPrompt(
      "Code Super Admin",
      "Entrez le code à 6 chiffres envoyé sur votre email"
    );
    if (!code) return;

    const response = await this.api('superAdminGetAllConversations', {
      token: this.token,
      accessCode: code
    });

    this.displayAllConversationsPanel(response.conversations);

  } catch (e) {
    this.showError(e.message);
  } finally {
    this.toggleLoader(false);
  }
}
```

---

## 📱📱📱 CORRECTION TÉLÉCHARGEMENT FACTURES MOBILE (NOUVEAU) 📱📱📱

### PROBLÈME
Le téléchargement des factures PDF ne fonctionne pas sur mobile.

### SOLUTION

```javascript
// Dans app.js - Fonction de téléchargement cross-platform
async downloadInvoice(invoiceId) {
  try {
    this.toggleLoader(true);

    const response = await this.api('getInvoice', {
      token: this.token,
      invoiceId: invoiceId
    });

    // Générer le PDF
    const doc = new jsPDF();
    // ... contenu PDF ...

    // Détection mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // SOLUTION MOBILE : Ouvrir dans un nouvel onglet comme data URL
      const pdfData = doc.output('datauristring');

      // Créer un lien temporaire
      const link = document.createElement('a');
      link.href = pdfData;
      link.download = `Facture_${invoiceId}.pdf`;
      link.target = '_blank';

      // iOS Safari a besoin d'un traitement spécial
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        // Ouvrir le PDF dans une nouvelle fenêtre
        const win = window.open();
        win.document.write(
          '<iframe width="100%" height="100%" src="' + pdfData + '"></iframe>'
        );
      } else {
        // Android et autres
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      // Desktop : téléchargement direct
      doc.save(`Facture_${invoiceId}.pdf`);
    }

    await showSuccess("Facture téléchargée !");

  } catch (e) {
    this.showError("Erreur: " + e.message);
  } finally {
    this.toggleLoader(false);
  }
}
```

### Alternative : Envoi par Email

```javascript
// Si le téléchargement échoue, proposer l'envoi par email
async sendInvoiceByEmail(invoiceId) {
  const confirm = await showConfirm(
    "Voulez-vous recevoir la facture par email ?"
  );
  if (!confirm) return;

  try {
    await this.api('sendInvoiceEmail', {
      token: this.token,
      invoiceId: invoiceId
    });

    await showSuccess("Facture envoyée à votre adresse email !");
  } catch (e) {
    this.showError(e.message);
  }
}

// Backend
function apiSendInvoiceEmail(token, invoiceId) {
  const user = getUserByToken(token);
  const invoice = getInvoiceById(invoiceId);

  // Générer le PDF côté serveur
  const pdfBlob = generateInvoicePdf(invoice);

  MailApp.sendEmail({
    to: user.email,
    subject: "Votre facture WhatsHappen #" + invoiceId,
    htmlBody: getInvoiceEmailTemplate(user.firstName, invoice),
    attachments: [pdfBlob.setName(`Facture_${invoiceId}.pdf`)]
  });

  return { success: true };
}
```

---

## ⏱️⏱️⏱️ NOUVELLES DURÉES DE CONVERSATION (NOUVEAU) ⏱️⏱️⏱️

### AJOUTER 1 MINUTE ET 5 MINUTES

**Dans index.html :**

```html
<div class="duration-chips">
  <span class="chip" data-val="1min">1 min</span>
  <span class="chip" data-val="5min">5 min</span>
  <span class="chip selected" data-val="10min">10 min</span>
  <span class="chip" data-val="12h">12 H</span>
  <span class="chip" data-val="24h">24 H</span>
  <span class="chip" data-val="48h">48 H</span>
  <span class="chip" data-val="unlimited">∞</span>
</div>
```

**Dans Code.gs - apiCreateChat :**

```javascript
function apiCreateChat(data) {
  // ... code existant ...

  let mins = 0;
  const durationStr = data.duration;

  // NOUVELLES DURÉES
  if (durationStr === '1min') mins = 1;
  else if (durationStr === '5min') mins = 5;
  else if (durationStr === '10min') mins = 10;
  else if (durationStr === '12h') mins = 12 * 60;
  else if (durationStr === '24h') mins = 24 * 60;
  else if (durationStr === '48h') mins = 48 * 60;
  else if (durationStr === 'unlimited') mins = 0;

  const expiryTime = mins > 0 ? Date.now() + (mins * 60 * 1000) : null;

  // ... reste du code ...
}
```

**Dans app.js - Mise à jour du sélecteur :**

```javascript
// Vérifier que les chips sont bien initialisées
initDurationChips() {
  const chips = document.querySelectorAll('.duration-chips .chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      this.selectedDuration = chip.dataset.val;
    });
  });

  // Durée par défaut
  this.selectedDuration = '10min';
}
```

---

## 💬💬💬 FONCTIONNALITÉS STYLE WHATSAPP/TELEGRAM (NOUVEAU) 💬💬💬

### SUGGESTIONS DE FONCTIONNALITÉS À IMPLÉMENTER

#### 1. INDICATEUR "EN TRAIN D'ÉCRIRE..." (Typing Indicator)

```javascript
// Frontend - Envoyer signal typing
let typingTimeout;
messageInput.addEventListener('input', () => {
  clearTimeout(typingTimeout);
  App.sendTypingSignal(true);
  typingTimeout = setTimeout(() => App.sendTypingSignal(false), 2000);
});

async sendTypingSignal(isTyping) {
  await this.api('setTyping', {
    token: this.token,
    chatId: this.currentChatId,
    isTyping: isTyping
  });
}

// Affichage
function showTypingIndicator(userName) {
  const indicator = document.getElementById('typing-indicator');
  indicator.textContent = userName + ' écrit...';
  indicator.classList.remove('hidden');
}
```

#### 2. ACCUSÉS DE LECTURE (Read Receipts)

```javascript
// ✓ = Envoyé, ✓✓ = Reçu, ✓✓ (bleu) = Lu

function renderMessageStatus(msg) {
  if (msg.readBy && msg.readBy.length > 0) {
    return '<span class="status read">✓✓</span>'; // Bleu
  } else if (msg.deliveredTo && msg.deliveredTo.length > 0) {
    return '<span class="status delivered">✓✓</span>'; // Gris
  }
  return '<span class="status sent">✓</span>';
}

// Marquer comme lu quand on ouvre la conversation
async markAsRead(chatId) {
  await this.api('markAsRead', {
    token: this.token,
    chatId: chatId
  });
}
```

#### 3. MESSAGES VOCAUX

```javascript
// Enregistrement audio
async startVoiceMessage() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  this.mediaRecorder = new MediaRecorder(stream);
  this.audioChunks = [];

  this.mediaRecorder.ondataavailable = (e) => {
    this.audioChunks.push(e.data);
  };

  this.mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
    const base64Audio = await this.blobToBase64(audioBlob);

    await this.api('sendMessage', {
      token: this.token,
      chatId: this.currentChatId,
      type: 'voice',
      content: base64Audio
    });
  };

  this.mediaRecorder.start();
  this.showRecordingUI();
}
```

#### 4. RÉPONSE À UN MESSAGE SPÉCIFIQUE

```javascript
// Swipe ou clic long pour répondre
function replyToMessage(messageId) {
  const msg = messages.find(m => m.id === messageId);
  App.replyingTo = msg;

  document.getElementById('reply-preview').innerHTML = `
    <div class="reply-preview">
      <span class="reply-to">${msg.senderName}</span>
      <span class="reply-text">${msg.content.substring(0, 50)}...</span>
      <button onclick="App.cancelReply()">✕</button>
    </div>
  `;
}

// Envoi avec référence
async sendMessage() {
  const payload = {
    token: this.token,
    chatId: this.currentChatId,
    content: this.messageInput.value,
    replyTo: this.replyingTo ? this.replyingTo.id : null
  };

  await this.api('sendMessage', payload);
  this.replyingTo = null;
}
```

#### 5. TRANSFERT DE MESSAGE

```javascript
async forwardMessage(messageId) {
  const chats = await this.api('getState', { token: this.token });

  // Afficher liste des conversations
  const chatList = chats.chats.map(c => ({
    id: c.id,
    name: c.participants.map(p => p.firstName).join(', ')
  }));

  const targetChatId = await showChatSelector("Transférer vers", chatList);
  if (!targetChatId) return;

  await this.api('forwardMessage', {
    token: this.token,
    messageId: messageId,
    targetChatId: targetChatId
  });

  await showSuccess("Message transféré !");
}
```

#### 6. SUPPRESSION DE MESSAGE (Pour moi / Pour tous)

```javascript
async deleteMessage(messageId) {
  const choice = await showChoice("Supprimer le message", [
    { value: 'me', label: 'Supprimer pour moi' },
    { value: 'all', label: 'Supprimer pour tout le monde' }
  ]);

  if (!choice) return;

  await this.api('deleteMessage', {
    token: this.token,
    messageId: messageId,
    deleteFor: choice
  });

  // Mettre à jour l'UI
  if (choice === 'all') {
    // Remplacer par "Message supprimé"
    document.querySelector(`[data-msg-id="${messageId}"]`).innerHTML =
      '<i class="deleted-msg">🚫 Message supprimé</i>';
  } else {
    // Cacher localement
    document.querySelector(`[data-msg-id="${messageId}"]`).remove();
  }
}
```

#### 7. STATUT EN LIGNE / DERNIÈRE VUE

```javascript
// Afficher dans l'en-tête de la conversation
function updateUserStatus(userId, lastSeen, isOnline) {
  const statusEl = document.getElementById('user-status');

  if (isOnline) {
    statusEl.innerHTML = '<span class="online-dot"></span> En ligne';
  } else {
    const ago = formatTimeAgo(lastSeen);
    statusEl.textContent = 'Vu ' + ago;
  }
}

function formatTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;

  return new Date(timestamp).toLocaleDateString('fr-FR');
}
```

#### 8. ÉPINGLER UNE CONVERSATION

```javascript
async pinChat(chatId) {
  await this.api('pinChat', { token: this.token, chatId: chatId });
  this.refreshChatList();
}

// Les conversations épinglées apparaissent en premier
function sortChats(chats) {
  return chats.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.lastMessageTime - a.lastMessageTime;
  });
}
```

#### 9. ARCHIVER UNE CONVERSATION

```javascript
async archiveChat(chatId) {
  await this.api('archiveChat', { token: this.token, chatId: chatId });
  await showSuccess("Conversation archivée");
  this.refreshChatList();
}

// Section "Archivées" en bas de la liste
function renderArchivedSection(archivedChats) {
  if (archivedChats.length === 0) return '';

  return `
    <div class="archived-section" onclick="App.toggleArchived()">
      <span>📁 Archivées (${archivedChats.length})</span>
    </div>
  `;
}
```

#### 10. MODE DISPARITION (Tous les messages s'autodétruisent)

```javascript
// Option dans les paramètres de conversation
async setDisappearingMessages(chatId, duration) {
  await this.api('setDisappearingMessages', {
    token: this.token,
    chatId: chatId,
    duration: duration // '24h', '7d', '90d', 'off'
  });

  await showSuccess(`Messages disparaissent après ${duration}`);
}
```

---

## 🚨🚨🚨 CORRECTION SÉCURITÉ CRITIQUE - MIGRATION OBLIGATOIRE 🚨🚨🚨

### LE PROBLÈME QUE TU AS CRÉÉ PRÉCÉDEMMENT

Tu as cassé l'application en supprimant BRUTALEMENT le système legacy sans prévoir de migration. Résultat :
- Les fichiers ne se créent plus sur Google Drive
- L'application ne peut plus lire les données existantes
- `getConfig()` plante car les Script Properties ne sont pas configurées

### LA BONNE APPROCHE - MIGRATION PROGRESSIVE

**Principe : LIRE avec legacy fallback, ÉCRIRE avec nouveau chiffrement**

### CODE CORRECT POUR getConfig()

```javascript
// Configuration LEGACY encodée en Base64 (pour migration)
const LEGACY_CONF = {
  folder: "MUlOMnBTSWhqVl8zRm4tQl9XTE1VZ05GY1FkTE9qYlly",
  admin: "Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ==",
  key: "Q2hhb3VpU2VjcmV0S2V5VjJfTmF0aXZl"
};

const props = PropertiesService.getScriptProperties();

// ✅ CORRECT - Avec fallback et migration automatique
function getConfig(key, legacyVal) {
  let val = props.getProperty(key);

  // Si pas de valeur en Script Properties, utiliser legacy ET migrer
  if (!val && legacyVal) {
    val = legacyVal;
    props.setProperty(key, val); // Migration vers Script Properties
  }

  if (!val) {
    throw new Error("Configuration manquante : " + key);
  }

  return val.trim();
}

// Utilisation :
function getFolderId() {
  return atob(getConfig('FOLDER_ID', LEGACY_CONF.folder));
}

function getAdminEmail() {
  return atob(getConfig('ADMIN_EMAIL', LEGACY_CONF.admin));
}

function getSecretKey() {
  return atob(getConfig('SECRET_KEY', LEGACY_CONF.key));
}
```

### CODE CORRECT POUR LE CHIFFREMENT (AVEC MIGRATION)

```javascript
// ✅ Nouveau chiffrement Hash-Stream Cipher (pour l'écriture)
function encrypt(text) {
  const key = getSecretKey();
  const nonce = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
  const textBytes = Utilities.newBlob(text).getBytes();
  const keyStream = generateKeyStream(key, nonce, textBytes.length);

  const encrypted = textBytes.map((b, i) => b ^ keyStream[i]);
  const encryptedB64 = Utilities.base64Encode(encrypted);

  return "v1:" + nonce + ":" + encryptedB64;
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

// ✅ Déchiffrement AVEC fallback legacy (pour la lecture)
function decrypt(cipher) {
  // Nouveau format v1:nonce:data
  if (cipher.startsWith("v1:")) {
    const parts = cipher.split(":");
    const nonce = parts[1];
    const encryptedB64 = parts[2];
    const key = getSecretKey();

    const encrypted = Utilities.base64Decode(encryptedB64);
    const keyStream = generateKeyStream(key, nonce, encrypted.length);

    const decrypted = encrypted.map((b, i) => b ^ keyStream[i]);
    return Utilities.newBlob(decrypted).getDataAsString();
  }

  // ✅ FALLBACK LEGACY - NE PAS SUPPRIMER !
  return decryptLegacyXor(cipher);
}

// ✅ Fonction legacy à GARDER pour lire les anciennes données
function decryptLegacyXor(cipher) {
  const key = getSecretKey();
  const decoded = Utilities.newBlob(Utilities.base64Decode(cipher)).getDataAsString();
  let result = "";

  for (let i = 0; i < decoded.length; i++) {
    const charCode = decoded.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode ^ keyChar);
  }

  return Utilities.newBlob(Utilities.base64Decode(result)).getDataAsString();
}
```

### CE QU'IL NE FAUT JAMAIS FAIRE

1. ❌ **NE JAMAIS** supprimer `decryptLegacyXor()` tant qu'il y a des données legacy
2. ❌ **NE JAMAIS** faire `throw new Error()` dans `getConfig()` sans fallback
3. ❌ **NE JAMAIS** rejeter les données sans préfixe `v1:`
4. ❌ **NE JAMAIS** supprimer `LEGACY_CONF` avant migration complète

---

## ⚠️⚠️⚠️ INITIALISATION AUTOMATIQUE - FICHIERS GOOGLE DRIVE ⚠️⚠️⚠️

**Le backend DOIT créer automatiquement les fichiers de base de données s'ils n'existent pas !**

```javascript
function initializeDatabase() {
  const folderId = getFolderId();
  const folder = DriveApp.getFolderById(folderId);

  const requiredFiles = [
    { name: 'users.json', initial: { users: [] } },
    { name: 'chats.json', initial: { chats: [] } },
    { name: 'settings.json', initial: { settings: {} } },
    { name: 'subscriptions.json', initial: { subscriptions: [] } },
    { name: 'invoices.json', initial: { invoices: [] } },
    { name: 'alerts.json', initial: { alerts: [] } } // NOUVEAU
  ];

  requiredFiles.forEach(({ name, initial }) => {
    let file = getFileByName(folder, name);
    if (!file) {
      const content = encrypt(JSON.stringify(initial));
      folder.createFile(name, content, MimeType.PLAIN_TEXT);
      Logger.log('Fichier créé: ' + name);
    }
  });
}

function getFileByName(folder, name) {
  const files = folder.getFilesByName(name);
  return files.hasNext() ? files.next() : null;
}

// Appeler initializeDatabase() au début de doPost()
function doPost(e) {
  initializeDatabase();
  // ... reste du code
}
```

---

## 📧 MODULE D'AUTOMATISATION DES EMAILS

### Les 3 Types d'Emails Automatiques (EXISTANTS - NE PAS MODIFIER)

1. **Email de Bienvenue** - À l'inscription ✅
2. **Notification "Fantôme"** - Quand destinataire inactif ✅
3. **Récupération de Mot de Passe** - Code à 6 chiffres ✅

### NOUVEAUX EMAILS

#### 4. Code d'accès conversation signalée

```javascript
function getAccessCodeEmailTemplate(code, alertId) {
  const content = `
    <tr>
      <td align="center" style="padding: 20px;">
        <p style="color: #ff4444; font-size: 18px; margin-bottom: 15px;">
          🚨 ACCÈS CONVERSATION SIGNALÉE
        </p>
        <p style="color: #ccc; font-size: 14px; line-height: 1.6;">
          Vous avez demandé l'accès à une conversation signalée.
        </p>
        <div style="background: #0a0a0a; border: 2px solid #ff4444; border-radius: 10px; padding: 20px; margin: 25px 0;">
          <p style="color: #888; font-size: 12px; margin: 0 0 10px 0;">Votre code d'accès :</p>
          <p style="color: #ff4444; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0;">${code}</p>
        </div>
        <p style="color: #ff6b6b; font-size: 12px;">
          ⏱️ Ce code expire dans 5 minutes.
        </p>
        <p style="color: #666; font-size: 11px; margin-top: 20px;">
          ID Alerte: ${alertId}<br>
          Cet accès est enregistré pour des raisons de sécurité.
        </p>
      </td>
    </tr>
  `;
  return getEmailBaseTemplate(content);
}
```

---

## ⚡ OPTIMISATIONS AVANCÉES APPS SCRIPT

### 1. Gestion de la Concurrence (LockService) - CRITIQUE ✅

### 2. Accélération via Cache (CacheService) ✅

### 3. Trigger de Nettoyage Automatique ✅

### 4. NOUVEAU - Collecte des Métadonnées (IP, Location)

```javascript
// Dans doPost, récupérer les métadonnées
function doPost(e) {
  const metadata = {
    ip: getClientIP(e),
    userAgent: e.parameter.userAgent || 'Unknown',
    timestamp: Date.now()
  };

  // Passer aux fonctions qui en ont besoin
  // ...
}

function getClientIP(e) {
  // Google Apps Script ne fournit pas directement l'IP
  // Utiliser un header custom envoyé par le frontend
  return e.parameter.clientIP || 'Unknown';
}

// Frontend - Envoyer l'IP (via service externe)
async getClientIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (e) {
    return 'Unknown';
  }
}

// Géolocalisation approximative via IP
async getLocationFromIP(ip) {
  try {
    const response = await UrlFetchApp.fetch(`http://ip-api.com/json/${ip}`);
    const data = JSON.parse(response.getContentText());
    return `${data.city}, ${data.country}`;
  } catch (e) {
    return 'Unknown';
  }
}
```

---

## Actions API COMPLÈTES

| Action | Description |
|--------|-------------|
| `login` | Connexion |
| `register` | Inscription + Email de bienvenue |
| `changePassword` | Changer code |
| `forgotPassword` | Demander reset |
| `verifyResetCode` | Vérifier code |
| `resetPassword` | Nouveau code |
| `getState` | Récupérer conversations |
| `createChat` | Créer conversation |
| `sendMessage` | Envoyer message + Détection contenu illégal |
| `getMessages` | Récupérer messages |
| `addParticipant` | Ajouter participant |
| `expireChat` | Supprimer conversation expirée |
| `adminGetUsers` | Liste utilisateurs (admin) |
| `adminUpdateUser` | Modifier droits (admin) |
| `adminDeleteUser` | Supprimer utilisateur (admin) |
| `adminResetPassword` | Reset mot de passe (admin) |
| **NOUVEAUX** | |
| `adminGetAlerts` | Liste des alertes contenu illégal |
| `requestConversationAccess` | Demander code accès conversation |
| `verifyConversationAccess` | Vérifier code et accéder |
| `deleteAlert` | Supprimer une alerte |
| `getAlertFullReport` | Télécharger rapport complet |
| `requestSuperAdminAccess` | Demander accès super admin |
| `superAdminGetAllConversations` | Accès toutes conversations |
| `setTyping` | Signal "en train d'écrire" |
| `markAsRead` | Marquer messages comme lus |
| `pinChat` | Épingler conversation |
| `archiveChat` | Archiver conversation |
| `forwardMessage` | Transférer message |
| `deleteMessage` | Supprimer message |
| `sendInvoiceEmail` | Envoyer facture par email |

---

## CHECKLIST DE VÉRIFICATION COMPLÈTE

### ⛔ RÈGLE D'OR
- [ ] Le site fonctionne EXACTEMENT comme avant
- [ ] Aucune fonctionnalité existante n'est cassée
- [ ] Les emails fonctionnent toujours
- [ ] L'authentification fonctionne toujours
- [ ] Le chiffrement fonctionne toujours

### 🔒 Obfuscation & Sécurité
- [ ] Tous les commentaires AI_PROTECTION supprimés
- [ ] Aucun secret en clair dans le code
- [ ] Variables sensibles obfusquées
- [ ] Aucun console.log avec données utilisateur
- [ ] Code source ne révèle pas les données

### 🚔 Alertes Contenu Illégal
- [ ] Détection des mots-clés illégaux fonctionne
- [ ] Alertes créées automatiquement
- [ ] Backup des conversations signalées
- [ ] Onglet "Alertes" dans console admin
- [ ] Accès avec code email fonctionne
- [ ] Téléchargement rapport PDF fonctionne
- [ ] Suppression des alertes fonctionne

### 👁️ Accès Admin
- [ ] Super admin (chaouiengage@gmail.com) peut accéder à tout
- [ ] Code email obligatoire pour accès conversations
- [ ] Logs d'accès enregistrés

### 📱 Mobile
- [ ] Téléchargement factures fonctionne sur iPhone
- [ ] Téléchargement factures fonctionne sur Android
- [ ] Alternative envoi par email disponible

### ⏱️ Durées
- [ ] Option 1 minute disponible
- [ ] Option 5 minutes disponible
- [ ] Autres durées toujours fonctionnelles

### 💬 Nouvelles Fonctionnalités
- [ ] Indicateur "écrit..." fonctionne
- [ ] Accusés de lecture fonctionnent
- [ ] Répondre à un message fonctionne
- [ ] Statut en ligne/dernière vue

### Migration Sécurité (existant)
- [ ] `LEGACY_CONF` présent
- [ ] `decryptLegacyXor()` présent
- [ ] `getConfig()` avec fallback
- [ ] `decrypt()` gère les deux formats

---

## Fichiers à Livrer

1. `Code.gs` (complet avec toutes les nouvelles fonctionnalités)
2. `netlify/index.html` (avec nouvel onglet alertes, durées 1min/5min)
3. `netlify/style.css` (avec styles alertes)
4. `netlify/app.js` (avec toutes les nouvelles fonctions)
5. `netlify/logo.js` (nettoyé)
6. `INSTRUCTIONS.md`

---

## RÉSUMÉ FINAL

### TU DOIS :
1. ✅ Garder TOUT ce qui fonctionne déjà
2. ✅ Ajouter durées 1min et 5min
3. ✅ Corriger téléchargement factures mobile
4. ✅ Supprimer TOUS les commentaires AI_PROTECTION
5. ✅ Obfusquer les secrets et variables sensibles
6. ✅ Implémenter le système d'alertes contenu illégal
7. ✅ Implémenter l'accès admin sécurisé aux conversations
8. ✅ Implémenter l'accès super admin à toutes les conversations
9. ✅ Ajouter les fonctionnalités WhatsApp/Telegram

### TU NE DOIS PAS :
1. ❌ Casser ce qui fonctionne
2. ❌ Supprimer le système legacy
3. ❌ Modifier le chiffrement existant
4. ❌ Laisser des secrets visibles
5. ❌ Oublier la validation par email pour les accès sensibles

**LE SITE DOIT FONCTIONNER COMME MAINTENANT + NOUVELLES FONCTIONNALITÉS**

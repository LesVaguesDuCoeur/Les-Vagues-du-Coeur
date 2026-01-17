# PROMPT COMPLET POUR JULES - PROJET WHATSHAPPEN V3

---

## ⚠️⚠️⚠️ RÈGLE D'OR - TRÈS IMPORTANT ⚠️⚠️⚠️

**Quand je te demande de modifier ou corriger quelque chose :**
- **GARDE** toutes les fonctionnalités et modifications précédentes qui fonctionnent
- **NE MODIFIE QUE** ce que je te demande de modifier
- **NE CASSE PAS** ce qui marchait avant
- Si tu dois réécrire un fichier, assure-toi d'inclure TOUT le code précédent + les corrections

---

## 📋 TABLE DES MATIÈRES

1. [Architecture & Contexte](#contexte-du-projet)
2. [🚨 CORRECTION SÉCURITÉ CRITIQUE](#correction-sécurité-critique---migration-obligatoire)
3. [Initialisation Automatique](#initialisation-automatique---fichiers-google-drive)
4. [Bugs Critiques à Corriger](#bugs-critiques-à-corriger-immédiatement)
5. [Module Emails Automatiques](#module-dautomatisation-des-emails-nouveau)
6. [Optimisations Apps Script](#optimisations-avancées-apps-script)
7. [Sécurité & Cryptage](#sécurité--cryptage-priorité-absolue---rgpd)
8. [Design & UI](#design--ui-branding-chaoui-engagé)
9. [Fonctionnalités](#fonctionnalités-requises)
10. [Checklist de Vérification](#checklist-de-vérification-à-faire-avant-de-livrer)

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
└── email-templates.js   # Templates HTML emails (NOUVEAU)
```

---

## 🚨🚨🚨 CORRECTION SÉCURITÉ CRITIQUE - MIGRATION OBLIGATOIRE 🚨🚨🚨

### LE PROBLÈME QUE TU AS CRÉÉ

Tu as cassé l'application en supprimant BRUTALEMENT le système legacy sans prévoir de migration. Résultat :
- Les fichiers ne se créent plus sur Google Drive
- L'application ne peut plus lire les données existantes
- `getConfig()` plante car les Script Properties ne sont pas configurées

### CE QUE TU AS MAL FAIT

```javascript
// ❌ MAUVAIS - Tu as fait ça :
function getConfig(key) {
  const val = props.getProperty(key);
  if (!val) throw new Error("Missing config: " + key); // CRASH !
  return val.trim();
}

// ❌ MAUVAIS - Tu as supprimé le fallback legacy :
function decrypt(cipher) {
  if (cipher.startsWith("v1:")) {
    // ... nouveau déchiffrement
  } else {
    throw new Error("Invalid or legacy cipher version"); // CRASH !
  }
}
```

### LA BONNE APPROCHE - MIGRATION PROGRESSIVE

**Principe : LIRE avec legacy fallback, ÉCRIRE avec nouveau chiffrement**

Cela permet de migrer automatiquement les données existantes vers le nouveau format.

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

### MIGRATION AUTOMATIQUE DES DONNÉES

```javascript
// Quand tu lis un fichier, si c'est du legacy, réécris-le avec le nouveau format
function readAndMigrateFile(fileId) {
  const file = DriveApp.getFileById(fileId);
  const content = file.getBlob().getDataAsString();
  const decrypted = decrypt(content); // Utilise le fallback si nécessaire

  // Si c'était du legacy (pas de préfixe v1:), migrer vers nouveau format
  if (!content.startsWith("v1:")) {
    const newEncrypted = encrypt(decrypted);
    file.setContent(newEncrypted);
    Logger.log("Fichier migré vers nouveau chiffrement: " + fileId);
  }

  return decrypted;
}
```

### CE QU'IL NE FAUT JAMAIS FAIRE

1. ❌ **NE JAMAIS** supprimer `decryptLegacyXor()` tant qu'il y a des données legacy
2. ❌ **NE JAMAIS** faire `throw new Error()` dans `getConfig()` sans fallback
3. ❌ **NE JAMAIS** rejeter les données sans préfixe `v1:`
4. ❌ **NE JAMAIS** supprimer `LEGACY_CONF` avant migration complète

### CE QU'IL FAUT FAIRE

1. ✅ Garder `LEGACY_CONF` pour l'initialisation
2. ✅ Garder `decryptLegacyXor()` pour lire les anciennes données
3. ✅ Utiliser le nouveau chiffrement UNIQUEMENT pour l'écriture
4. ✅ Migrer automatiquement les données lors de la relecture

---

## ⚠️⚠️⚠️ INITIALISATION AUTOMATIQUE - FICHIERS GOOGLE DRIVE ⚠️⚠️⚠️

**Le backend DOIT créer automatiquement les fichiers de base de données s'ils n'existent pas !**

```javascript
// Dans Code.gs, au début, ajouter cette fonction d'initialisation :
function initializeDatabase() {
  const folderId = getFolderId();
  const folder = DriveApp.getFolderById(folderId);

  // Vérifier/Créer users.json
  let usersFile = getFileByName(folder, 'users.json');
  if (!usersFile) {
    const initialUsers = encrypt(JSON.stringify({ users: [] }));
    folder.createFile('users.json', initialUsers, MimeType.PLAIN_TEXT);
    Logger.log('Fichier users.json créé');
  }

  // Vérifier/Créer chats.json
  let chatsFile = getFileByName(folder, 'chats.json');
  if (!chatsFile) {
    const initialChats = encrypt(JSON.stringify({ chats: [] }));
    folder.createFile('chats.json', initialChats, MimeType.PLAIN_TEXT);
    Logger.log('Fichier chats.json créé');
  }
}

function getFileByName(folder, name) {
  const files = folder.getFilesByName(name);
  return files.hasNext() ? files.next() : null;
}

// Appeler initializeDatabase() au début de doPost()
function doPost(e) {
  initializeDatabase(); // <-- IMPORTANT
  // ... reste du code
}
```

---

## ⚠️⚠️⚠️ BUGS CRITIQUES À CORRIGER IMMÉDIATEMENT ⚠️⚠️⚠️

### BUG 0 : IMPOSSIBLE DE CLIQUER SUR LES BOUTONS
**Problème** : Les boutons ne répondent plus aux clics. L'interface est figée.

**Solution JavaScript** :
```javascript
document.addEventListener('DOMContentLoaded', function() {
  App.init();
});

// Dans init(), vérifier que tous les listeners sont attachés :
init: function() {
  const loginBtn = document.getElementById('btn-login');
  const registerBtn = document.getElementById('btn-register');
  const showRegisterBtn = document.getElementById('show-register');
  const showLoginBtn = document.getElementById('show-login');
  const forgotPwdBtn = document.getElementById('btn-forgot-password'); // NOUVEAU

  if (loginBtn) loginBtn.addEventListener('click', () => this.doLogin());
  if (registerBtn) registerBtn.addEventListener('click', () => this.doRegister());
  if (showRegisterBtn) showRegisterBtn.addEventListener('click', () => this.showRegisterForm());
  if (showLoginBtn) showLoginBtn.addEventListener('click', () => this.showLoginForm());
  if (forgotPwdBtn) forgotPwdBtn.addEventListener('click', () => this.showForgotPassword()); // NOUVEAU
}
```

**Vérifier CSS** :
```css
/* Le modal-overlay ne doit PAS bloquer les clics quand caché */
.modal-overlay.hidden {
  display: none;
  pointer-events: none;
}
```

### BUG 1 : Logo non affiché
- Convertir le logo en Base64 **COMPLET** dans `logo.js`
- Vérifier le chargement dans le DOM

### BUG 2 : Avatar avec initiale non affiché
```html
<!-- CORRECT -->
<div class="user-avatar" id="btn-admin-access">
    <span class="avatar-letter" id="user-avatar-letter">L</span>
</div>
```

### BUG 3 : "Accès refusé" pour l'admin
```javascript
// Backend - Forcer isAdmin si email = admin
if (cleanEmail === getAdminEmail()) {
    user.isAdmin = true;
    user.canCreate = true;
}
```

### BUG 4 : Déconnexion automatique
- Utiliser `LockService` pour garantir la sauvegarde du token
- Vérifier que le token est bien inclus dans `localStorage`

### BUG 5 : Code admin 15112000 encore présent
**SUPPRIMER TOUTES les références** au code fixe. L'admin est identifié UNIQUEMENT par email.

---

## 📧 MODULE D'AUTOMATISATION DES EMAILS (NOUVEAU)

### Principe
Utilisation du service natif `MailApp` de Google Apps Script (100 envois/jour compte gratuit, 1500/jour Workspace).

### Les 3 Types d'Emails Automatiques

#### 1. Email de Bienvenue (Inscription)
**Déclencheur** : Fonction `register()` après création réussie du compte

```javascript
// Dans Code.gs, après création du user :
function sendWelcomeEmail(email, firstName) {
  const subject = "Bienvenue sur WhatsHappen";
  const htmlBody = getWelcomeEmailTemplate(firstName);

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody
  });
}
```

#### 2. Notification "Fantôme" (Nouveau Message)
**Déclencheur** : Fonction `sendMessage()` si destinataire inactif > 5 minutes
**Principe de confidentialité** : AUCUNE information sur l'expéditeur ou le contenu !

```javascript
// Dans Code.gs, dans sendMessage() :
function notifyInactiveUser(recipientEmail) {
  // Vérifier si l'utilisateur est inactif depuis > 5 min
  const user = getUserByEmail(recipientEmail);
  const lastSeen = new Date(user.lastSeen || 0);
  const now = new Date();
  const diffMinutes = (now - lastSeen) / 60000;

  if (diffMinutes > 5) {
    MailApp.sendEmail({
      to: recipientEmail,
      subject: "Activité détectée sur votre compte",
      htmlBody: getNotificationEmailTemplate()
    });
  }
}
```

**Contenu de l'email** (volontairement vague pour la sécurité) :
- Sujet : "Activité détectée sur votre compte"
- Corps : "Un événement récent requiert votre attention. Connectez-vous à WhatsHappen pour le consulter."

#### 3. Récupération de Mot de Passe
**Déclencheur** : Nouvelle action API `forgotPassword`

```javascript
// Nouvelles actions API à ajouter :
case 'forgotPassword':
  return apiForgotPassword(data.email);

case 'verifyResetCode':
  return apiVerifyResetCode(data.email, data.code);

case 'resetPassword':
  return apiResetPassword(data.email, data.code, data.newCode);
```

**Implémentation Backend** :
```javascript
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

    // Générer code à 6 chiffres valide 10 minutes
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpiry = Date.now() + (10 * 60 * 1000); // 10 min

    user.resetCode = resetCode;
    user.resetExpiry = resetExpiry;
    writeUsersDb(db);

    // Envoyer l'email
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
  const db = readUsersDb();
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

    // Validation du nouveau code (3 chiffres)
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
```

### Interface Frontend - Bouton "Mot de passe oublié"

**Ajouter dans index.html** (sous le formulaire de connexion) :
```html
<div class="forgot-password-container">
  <a href="#" id="btn-forgot-password" class="forgot-password-link">
    Mot de passe oublié ?
  </a>
</div>
```

**CSS** :
```css
.forgot-password-container {
  text-align: center;
  margin-top: 15px;
}

.forgot-password-link {
  color: #888;
  font-size: 0.85rem;
  text-decoration: none;
  transition: color 0.3s ease;
}

.forgot-password-link:hover {
  color: #D4AF37;
  text-decoration: underline;
}
```

**JavaScript (app.js)** :
```javascript
showForgotPassword: async function() {
  // Étape 1 : Demander l'email
  const email = await showPrompt("Récupération de compte", "Entrez votre adresse email");
  if (!email) return;

  try {
    this.toggleLoader(true);
    await this.api('forgotPassword', { email });

    // Étape 2 : Demander le code reçu par email
    const code = await showPrompt("Code de récupération", "Entrez le code à 6 chiffres reçu par email");
    if (!code) return;

    // Vérifier le code
    await this.api('verifyResetCode', { email, code });

    // Étape 3 : Nouveau mot de passe
    const newCode = await showPrompt("Nouveau code", "Choisissez un nouveau code à 3 chiffres");
    if (!newCode) return;

    await this.api('resetPassword', { email, code, newCode });
    await showSuccess("Votre code a été réinitialisé. Vous pouvez maintenant vous connecter.");

  } catch (e) {
    this.showError(e.message);
  } finally {
    this.toggleLoader(false);
  }
}
```

---

## 📨 DESIGN DES TEMPLATES EMAILS

### Direction Artistique
- **Style** : Dark Mode par défaut (cohérent avec l'app)
- **Typographie** : Police Monospace (aspect technique/sécurisé)
- **Couleurs** : Noir #1a1a1a, Or #D4AF37, Gris #888
- **Logo** : Centré en haut, rond avec bordure dorée
- **Ton** : Direct, professionnel, mystérieux

### Template de Base (email-templates.js ou dans Code.gs)

```javascript
function getEmailBaseTemplate(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Courier New', monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="500px" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border: 2px solid #D4AF37; border-radius: 15px; padding: 30px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 25px;">
              <div style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #D4AF37; overflow: hidden; display: inline-block;">
                <img src="[LOGO_URL_OR_BASE64]" alt="WhatsHappen" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
            </td>
          </tr>

          <!-- Titre -->
          <tr>
            <td align="center" style="padding-bottom: 10px;">
              <h1 style="color: #D4AF37; font-size: 24px; margin: 0; letter-spacing: 2px;">WHATSHAPPEN</h1>
            </td>
          </tr>

          <!-- Sous-titre -->
          <tr>
            <td align="center" style="padding-bottom: 25px;">
              <p style="color: #888; font-size: 12px; margin: 0;">Messagerie Sécurisée & Éphémère</p>
            </td>
          </tr>

          <!-- Contenu dynamique -->
          ${content}

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 30px; border-top: 1px solid #333;">
              <p style="color: #555; font-size: 11px; margin: 0;">
                Message généré automatiquement par le protocole WhatsHappen.<br>
                Cet email est confidentiel et sécurisé.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Template Email de Bienvenue
function getWelcomeEmailTemplate(firstName) {
  const content = `
    <tr>
      <td align="center" style="padding: 20px;">
        <p style="color: #fff; font-size: 16px; line-height: 1.6;">
          Bienvenue <strong style="color: #D4AF37;">${firstName}</strong>,
        </p>
        <p style="color: #ccc; font-size: 14px; line-height: 1.6;">
          Votre compte WhatsHappen a été créé avec succès.
        </p>
        <p style="color: #888; font-size: 13px; line-height: 1.6; margin-top: 20px;">
          Rappel : Ici, rien n'est gardé.<br>
          Vos conversations sont éphémères et chiffrées.
        </p>
      </td>
    </tr>
  `;
  return getEmailBaseTemplate(content);
}

// Template Notification Fantôme
function getNotificationEmailTemplate() {
  const content = `
    <tr>
      <td align="center" style="padding: 20px;">
        <p style="color: #D4AF37; font-size: 18px; margin-bottom: 15px;">
          ⚡ Activité détectée
        </p>
        <p style="color: #ccc; font-size: 14px; line-height: 1.6;">
          Un événement récent requiert votre attention.
        </p>
        <p style="color: #888; font-size: 13px; line-height: 1.6; margin-top: 15px;">
          Connectez-vous à WhatsHappen pour le consulter.
        </p>
      </td>
    </tr>
  `;
  return getEmailBaseTemplate(content);
}

// Template Récupération MDP
function getResetPasswordEmailTemplate(firstName, code) {
  const content = `
    <tr>
      <td align="center" style="padding: 20px;">
        <p style="color: #fff; font-size: 16px; line-height: 1.6;">
          Bonjour <strong style="color: #D4AF37;">${firstName}</strong>,
        </p>
        <p style="color: #ccc; font-size: 14px; line-height: 1.6;">
          Vous avez demandé à réinitialiser votre code d'accès.
        </p>
        <div style="background: #0a0a0a; border: 2px solid #D4AF37; border-radius: 10px; padding: 20px; margin: 25px 0;">
          <p style="color: #888; font-size: 12px; margin: 0 0 10px 0;">Votre code de récupération :</p>
          <p style="color: #D4AF37; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0;">${code}</p>
        </div>
        <p style="color: #ff6b6b; font-size: 12px;">
          ⏱️ Ce code expire dans 10 minutes.
        </p>
        <p style="color: #666; font-size: 11px; margin-top: 20px;">
          Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
        </p>
      </td>
    </tr>
  `;
  return getEmailBaseTemplate(content);
}
```

---

## ⚡ OPTIMISATIONS AVANCÉES APPS SCRIPT

### 1. Gestion de la Concurrence (LockService) - CRITIQUE

**Problème** : Deux écritures simultanées peuvent corrompre les données.

```javascript
// ENCAPSULER TOUTES les fonctions d'écriture avec LockService
function writeUsersDb(db) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // Attendre max 15 secondes

    const folderId = getFolderId();
    const folder = DriveApp.getFolderById(folderId);
    const file = getFileByName(folder, 'users.json');
    const encrypted = encrypt(JSON.stringify(db));
    file.setContent(encrypted);

    // Invalider le cache après écriture
    invalidateUsersCache();

  } finally {
    lock.releaseLock();
  }
}
```

### 2. Accélération via Cache (CacheService)

**Gain estimé** : x10 sur les lectures répétées

```javascript
const CACHE_DURATION = 600; // 10 minutes

function readUsersDbCached() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('users_db');

  if (cached) {
    return JSON.parse(cached);
  }

  // Pas en cache, lire depuis Drive
  const db = readUsersDb();
  cache.put('users_db', JSON.stringify(db), CACHE_DURATION);
  return db;
}

// Invalider le cache après une écriture
function invalidateUsersCache() {
  CacheService.getScriptCache().remove('users_db');
}
```

### 3. Trigger de Nettoyage Automatique

**Configuration** : Exécuter `cleanUpExpiredChats` toutes les 5-15 minutes

```javascript
function cleanUpExpiredChats() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    const db = readChatsDb();
    const now = Date.now();
    let deleted = 0;

    db.chats = db.chats.filter(chat => {
      if (chat.expiryTime && now > chat.expiryTime) {
        // Supprimer le fichier de conversation sur Drive
        try {
          const file = DriveApp.getFileById(chat.fileId);
          file.setTrashed(true);
        } catch (e) {
          Logger.log('Fichier déjà supprimé: ' + chat.id);
        }
        deleted++;
        return false; // Retirer du tableau
      }
      return true; // Garder
    });

    if (deleted > 0) {
      writeChatsDb(db);
      Logger.log(deleted + ' conversation(s) expirée(s) supprimée(s)');
    }

  } finally {
    lock.releaseLock();
  }
}

// À configurer dans Apps Script : Triggers > Add Trigger > cleanUpExpiredChats > Time-driven > Minutes timer > Every 5 minutes
```

### 4. Mise à jour du Last Seen (pour notifications)

```javascript
function updateLastSeen(userId) {
  const db = readUsersDb();
  const user = db.users.find(u => u.id === userId);
  if (user) {
    user.lastSeen = Date.now();
    writeUsersDb(db);
    invalidateUsersCache();
  }
}

// Appeler dans getState() et getMessages()
```

---

## Sécurité & Cryptage (PRIORITÉ ABSOLUE - RGPD)

### Règles strictes :
1. **TOUT** ce qui est écrit dans Google Drive doit être chiffré
2. **AUCUN** lien, email, mot de passe ou donnée sensible en clair
3. Utiliser un **chiffrement natif** (Hash-Stream Cipher + XOR legacy) sans bibliothèque externe
4. Les utilisateurs ne voient que les **prénoms**, jamais les emails
5. Protections **anti-capture d'écran** (CSS blur, user-select: none)

### Récapitulatif du système de chiffrement

| Opération | Méthode |
|-----------|---------|
| **Écriture** | Hash-Stream Cipher (v1:nonce:data) |
| **Lecture nouvelle** | Détection préfixe v1: → Hash-Stream |
| **Lecture legacy** | Pas de préfixe → XOR fallback |
| **Migration** | Automatique à la relecture |

### Configuration stockée en Script Properties

```javascript
// Ces valeurs doivent être stockées en Script Properties (Projet > Paramètres > Propriétés)
// FOLDER_ID: MUlOMnBTSWhqVl8zRm4tQl9XTE1VZ05GY1FkTE9qYlly
// ADMIN_EMAIL: Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ==
// SECRET_KEY: Q2hhb3VpU2VjcmV0S2V5VjJfTmF0aXZl

// Mais le code doit avoir un fallback vers LEGACY_CONF pour la première exécution !
```

---

## Messages d'Erreur en FRANÇAIS (OBLIGATOIRE)

| Situation | Message |
|-----------|---------|
| Email non trouvé | "Cette adresse email n'est pas inscrite." |
| Code incorrect | "Le code est incorrect." |
| Email déjà inscrit | "Cette adresse email est déjà utilisée." |
| Code invalide | "Le code doit contenir exactement 3 chiffres." |
| Session expirée | "Votre session a expiré. Veuillez vous reconnecter." |
| Utilisateur introuvable | "Cet utilisateur n'existe pas dans le système." |
| Pas de droits création | "Vous n'avez pas les droits pour créer une conversation." |
| Conversation expirée | "Cette conversation a expiré et a été supprimée." |
| Erreur serveur | "Une erreur est survenue. Veuillez réessayer." |
| Code reset invalide | "Code de récupération invalide." |
| Code reset expiré | "Ce code a expiré. Veuillez en demander un nouveau." |
| Email envoyé | "Un code de récupération a été envoyé à votre adresse email." |
| Config manquante | "Configuration manquante : [nom]" |

---

## Système de Modales Stylisées (OBLIGATOIRE)

### INTERDIT : `alert()`, `confirm()`, `prompt()` du navigateur

```javascript
function showModal(type, title, message, showCancel = false, inputPlaceholder = null) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-overlay');
    const box = document.getElementById('modal-box');
    const titleEl = box.querySelector('.modal-title');
    const messageEl = box.querySelector('.modal-message');
    const inputContainer = box.querySelector('.modal-input-container');
    const input = document.getElementById('modal-input');
    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');

    box.className = 'modal-box ' + type;
    titleEl.textContent = title;
    messageEl.textContent = message;

    if (inputPlaceholder) {
      inputContainer.classList.remove('hidden');
      input.placeholder = inputPlaceholder;
      input.value = '';
    } else {
      inputContainer.classList.add('hidden');
    }

    cancelBtn.classList.toggle('hidden', !showCancel);
    overlay.classList.remove('hidden');

    const cleanup = () => {
      overlay.classList.add('hidden');
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
    };

    confirmBtn.onclick = () => { cleanup(); resolve(inputPlaceholder ? input.value : true); };
    cancelBtn.onclick = () => { cleanup(); resolve(null); };
  });
}

// Raccourcis
const showError = (msg) => showModal('error', 'Erreur', msg);
const showSuccess = (msg) => showModal('success', 'Succès', msg);
const showInfo = (msg) => showModal('info', 'Information', msg);
const showConfirm = (msg) => showModal('confirm', 'Confirmation', msg, true);
const showPrompt = (title, placeholder) => showModal('info', title, '', true, placeholder);
```

---

## Fonctionnalités Requises

### 1. Authentification
- **Email** + **Prénom** + **Code à 3 chiffres** pour tous
- Super-admin identifié UNIQUEMENT par email (`chaouiengage@gmail.com`)
- Token de session UUID stocké serveur + LocalStorage
- **NOUVEAU** : Bouton "Mot de passe oublié" avec récupération par email

### 2. Header avec Avatar Cliquable
- Cercle avec première lettre du prénom
- Bordure dorée, cliquable
- Admin → Panneau admin / Non-admin → Profil

### 3. Conversations
- Durées : **10min**, **12h**, **24h**, **48h**, **Illimité**
- Conversations avec soi-même autorisées
- Bouton "+" invisible si pas les droits
- Suppression immédiate à expiration

### 4. Console Admin
- Gestion des utilisateurs
- Donner/retirer droits
- Réinitialiser mot de passe
- Protection super-admin absolue

---

## Design & UI (Branding "Chaoui Engagé")

### Palette :
```css
:root {
  --gold: #D4AF37;
  --gold-dark: #C9A227;
  --black: #0a0a0a;
  --black-light: #1a1a1a;
  --black-lighter: #2d2d2d;
  --white: #ffffff;
  --gray: #888888;
}
```

### Page de connexion :
- Logo centré en haut
- Titre "CHAOUI ENGAGÉ" en doré
- Sous-titre "Messagerie Sécurisée & Éphémère"
- Lien "Mot de passe oublié ?" discret sous le formulaire

---

## Actions API (NOMS EXACTS)

| Action | Description |
|--------|-------------|
| `login` | Connexion |
| `register` | Inscription + Email de bienvenue |
| `changePassword` | Changer code |
| `forgotPassword` | **NOUVEAU** - Demander reset |
| `verifyResetCode` | **NOUVEAU** - Vérifier code |
| `resetPassword` | **NOUVEAU** - Nouveau code |
| `getState` | Récupérer conversations |
| `createChat` | Créer conversation |
| `sendMessage` | Envoyer message + Notif si inactif |
| `getMessages` | Récupérer messages |
| `addParticipant` | Ajouter participant |
| `expireChat` | Supprimer conversation expirée |
| `adminGetUsers` | Liste utilisateurs (admin) |
| `adminUpdateUser` | Modifier droits (admin) |
| `adminDeleteUser` | Supprimer utilisateur (admin) |
| `adminResetPassword` | Reset mot de passe (admin) |

---

## CHECKLIST DE VÉRIFICATION (À FAIRE AVANT DE LIVRER)

### Interface & Bugs
- [ ] Le logo s'affiche sur la page de connexion
- [ ] L'avatar affiche la première lettre du prénom
- [ ] L'avatar est cliquable et ouvre l'admin pour l'email admin
- [ ] Pas de déconnexion automatique après connexion
- [ ] Tous les boutons sont cliquables
- [ ] Le lien "Mot de passe oublié ?" est présent et fonctionnel

### Sécurité & Migration
- [ ] `LEGACY_CONF` est présent dans le code
- [ ] `decryptLegacyXor()` est présent et fonctionnel
- [ ] `getConfig()` a un fallback vers les valeurs legacy
- [ ] `decrypt()` gère les deux formats (v1: et legacy)
- [ ] Les fichiers se créent correctement sur Drive
- [ ] Pas de référence à 15112000 dans le code
- [ ] L'admin est identifié UNIQUEMENT par email
- [ ] Toutes les données Drive sont chiffrées
- [ ] Pas d'utilisation de `alert()`, `confirm()`, `prompt()`

### Emails
- [ ] Email de bienvenue envoyé à l'inscription
- [ ] Notification fantôme envoyée si destinataire inactif
- [ ] Récupération de mot de passe fonctionnelle
- [ ] Templates emails en Dark Mode avec logo

### Optimisations
- [ ] LockService sur toutes les écritures
- [ ] CacheService pour les lectures fréquentes
- [ ] Trigger de nettoyage configuré (5-15 min)

### Langue
- [ ] Toutes les erreurs sont en français
- [ ] Interface entièrement en français

---

## Instructions de Déploiement

### Backend :
1. script.google.com → Nouveau projet "WhatsHappen"
2. Coller Code.gs
3. Déployer → Application Web → Tout le monde
4. **Triggers** :
   - `cleanUpExpiredChats` : Toutes les 5 minutes
   - (Optionnel) `initializeDatabase` : Au démarrage

### Frontend :
1. app.netlify.com
2. Drag & drop le dossier `netlify/`

### Premier lancement :
1. Créer un compte avec `chaouiengage@gmail.com`
2. Choisir un code à 3 chiffres
3. Tu seras automatiquement admin

---

## Fichiers à Livrer

1. `Code.gs` (avec emails + optimisations + migration sécurité)
2. `netlify/index.html` (avec bouton MDP oublié)
3. `netlify/style.css`
4. `netlify/app.js` (avec flux récupération MDP)
5. `netlify/logo.js`
6. `INSTRUCTIONS.md`

---

## RÉSUMÉ DES CORRECTIONS SÉCURITÉ À APPLIQUER

### Dans Code.gs, tu DOIS avoir :

1. **LEGACY_CONF** en haut du fichier (encodé Base64)
2. **getConfig(key, legacyVal)** avec fallback
3. **getFolderId()**, **getAdminEmail()**, **getSecretKey()** utilisant getConfig avec legacy
4. **encrypt()** utilisant Hash-Stream Cipher (v1:nonce:data)
5. **decrypt()** avec détection du format et fallback legacy
6. **decryptLegacyXor()** pour lire les anciennes données
7. **initializeDatabase()** appelée dans doPost()

### NE PAS FAIRE :
- Supprimer LEGACY_CONF
- Supprimer decryptLegacyXor
- Faire throw Error dans getConfig sans fallback
- Rejeter les données sans préfixe v1:

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
2. [Initialisation Automatique](#initialisation-automatique---fichiers-google-drive)
3. [Bugs Critiques à Corriger](#bugs-critiques-à-corriger-immédiatement)
4. [Module Emails Automatiques](#module-dautomatisation-des-emails-nouveau)
5. [Optimisations Apps Script](#optimisations-avancées-apps-script)
6. [Sécurité & Cryptage](#sécurité--cryptage-priorité-absolue---rgpd)
7. [Design & UI](#design--ui-branding-chaoui-engagé)
8. [Fonctionnalités](#fonctionnalités-requises)
9. [Checklist de Vérification](#checklist-de-vérification-à-faire-avant-de-livrer)

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

## ⚠️⚠️⚠️ INITIALISATION AUTOMATIQUE - FICHIERS GOOGLE DRIVE ⚠️⚠️⚠️

**Le backend DOIT créer automatiquement les fichiers de base de données s'ils n'existent pas !**

```javascript
// Dans Code.gs, au début, ajouter cette fonction d'initialisation :
function initializeDatabase() {
  const folder = DriveApp.getFolderById(FOLDER_ID);

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
if (cleanEmail === ADMIN_EMAIL) {
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

    const folder = DriveApp.getFolderById(FOLDER_ID);
    const file = getFileByName(folder, 'users.json');
    const encrypted = encrypt(JSON.stringify(db));
    file.setContent(encrypted);

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

## Informations de Configuration (À CHIFFRER EN BASE64)

### ⚠️ CRITIQUE : Aucune de ces informations ne doit apparaître en clair !

| Élément | Valeur | Encodage Base64 |
|---------|--------|-----------------|
| Dossier Google Drive | `1IN2pSIhjV_3Fn-B_WLMUgNFcQdLOjbYr` | `MUlOMnBTSWhqVl8zRm4tQl9XTE1VZ05GY1FkTE9qYlly` |
| URL Apps Script | `https://script.google.com/macros/s/AKfycbxzFevbQJzerwD2L-uNcVTRJE9XVJ4HGdC9KUftOyIKT9pqErsvNfPsfSC12MjBEUDQvA/exec` | `aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4ekZldmJRSnplcndEMkwtdW5jVlRSSkU5WFZKNEhHZEM5S1VmdE95SUtUOXBxRXJzdk5mUHNmU0MxMk1qQkVVRFF2QS9leGVj` |
| Email Super-Admin | `chaouiengage@gmail.com` | `Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ==` |

---

## Sécurité & Cryptage (PRIORITÉ ABSOLUE - RGPD)

### Règles strictes :
1. **TOUT** ce qui est écrit dans Google Drive doit être chiffré
2. **AUCUN** lien, email, mot de passe ou donnée sensible en clair
3. Utiliser un **chiffrement natif** (XOR + Base64) sans bibliothèque externe
4. Les utilisateurs ne voient que les **prénoms**, jamais les emails
5. Protections **anti-capture d'écran** (CSS blur, user-select: none)

### Méthode de chiffrement native :
```javascript
const SECRET_KEY = "ChaouiSecretKeyV3";

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

---

## Système de Modales Stylisées (OBLIGATOIRE)

### ❌ INTERDIT : `alert()`, `confirm()`, `prompt()` du navigateur

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

### Sécurité
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

1. `Code.gs` (avec emails + optimisations)
2. `netlify/index.html` (avec bouton MDP oublié)
3. `netlify/style.css`
4. `netlify/app.js` (avec flux récupération MDP)
5. `netlify/logo.js`
6. `INSTRUCTIONS.md`

---

## 💡 MA TOUCHE PERSONNELLE (Suggestions de Claude)

### Améliorations Recommandées

1. **Rate Limiting sur forgotPassword** : Limiter à 3 demandes par email par heure pour éviter le spam.

2. **Indicateur "En ligne"** : Ajouter un point vert sur l'avatar si `lastSeen < 2 minutes`.

3. **PWA Ready** : Ajouter un `manifest.json` minimal pour permettre l'installation sur mobile :
```json
{
  "name": "WhatsHappen",
  "short_name": "WH",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#D4AF37"
}
```

4. **UI Optimiste** : Afficher le message immédiatement côté client avant confirmation serveur (meilleure UX).

5. **Compression des images** : Réduire les images avant encodage Base64 pour économiser l'espace Drive.

6. **Logs Admin** : Stocker les actions importantes (connexions, créations) dans un fichier `audit.log` pour le super-admin.

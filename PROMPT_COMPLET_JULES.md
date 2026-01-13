# PROMPT COMPLET POUR JULES - PROJET WHATSHAPPEN V3

---

## ⚠️⚠️⚠️ BUGS CRITIQUES À CORRIGER IMMÉDIATEMENT ⚠️⚠️⚠️

### BUG 1 : Logo non affiché sur la page de connexion
**Problème** : Le logo n'apparaît pas, on voit juste un cercle vide avec "Logo" écrit.
**Cause** : Le fichier `logo.js` contient un LOGO_BASE64 tronqué/incomplet.
**Solution** :
- Le logo Chaoui Engagé est fourni en pièce jointe
- Il faut le convertir en Base64 COMPLET et le mettre dans `logo.js`
- Vérifier que l'image est bien chargée dans le DOM

### BUG 2 : Avatar avec initiale non affiché dans le header
**Problème** : Dans le dashboard, on voit une image cassée au lieu d'un cercle avec la première lettre du prénom (ex: "L" pour Lyes).
**Cause** : Le HTML actuel utilise une balise `<img>` au lieu d'afficher l'initiale :
```html
<!-- MAUVAIS (actuel) -->
<div class="logo-circle-small logo-circle" id="btn-admin-access">
    <img id="dashboard-logo" src="" alt="Admin">
</div>

<!-- CORRECT (à faire) -->
<div class="user-avatar" id="btn-admin-access">
    <span class="avatar-letter" id="user-avatar-letter">L</span>
</div>
```
**Solution** :
- Remplacer l'image par un cercle doré avec la première lettre du prénom
- Dans `app.js`, mettre à jour dynamiquement : `document.getElementById('user-avatar-letter').textContent = this.user.firstName.charAt(0).toUpperCase();`

### BUG 3 : "Accès refusé" quand on clique sur l'avatar pour accéder à l'admin
**Problème** : L'utilisateur `chaouiengage@gmail.com` reçoit "Accès refusé" quand il clique sur l'avatar.
**Causes multiples** :
1. Le backend vérifie encore `ADMIN_CODE_HASH` (15112000) au lieu de se baser uniquement sur l'email
2. Le frontend vérifie `this.user.isAdmin` mais cette valeur n'est pas correctement transmise/stockée
3. La fonction `showAdmin()` appelle `adminGetUsers` qui échoue car `user.isAdmin` est false

**Solution Backend (Code.gs)** :
```javascript
// SUPPRIMER cette ligne :
const _SEC_2 = "MTUxMTIwMDA="; // Admin Code (15112000)
const ADMIN_CODE_HASH = decodeSecret(_SEC_2);

// Dans apiLogin, AVANT de générer le token, forcer isAdmin si email = admin :
if (cleanEmail === ADMIN_EMAIL) {
    user.isAdmin = true;
    user.canCreate = true;
}

// Dans apiRegister, idem :
if (cleanEmail === ADMIN_EMAIL) {
    isAdmin = true;
    canCreate = true;
}
```

**Solution Frontend (app.js)** :
```javascript
// Le check admin doit être plus permissif :
const adminBtn = document.getElementById('btn-admin-access');
if (adminBtn) {
    adminBtn.onclick = () => {
        // Vérifier AUSSI l'email en plus de isAdmin
        const adminEmail = atob("Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ=="); // chaouiengage@gmail.com
        if (this.user && (this.user.isAdmin === true || this.user.email === adminEmail)) {
            this.showAdmin();
        } else {
            this.showError("Accès réservé aux administrateurs.");
        }
    };
}
```

### BUG 4 : Déconnexion automatique après 2 secondes
**Problème** : L'utilisateur est déconnecté immédiatement après connexion.
**Cause** : Le polling `loadConversations()` appelle l'API avec un token qui ne correspond pas à celui stocké dans la DB.
**Explication** :
- À la connexion, un token est généré et retourné
- Mais le `writeUsersDb()` peut ne pas s'exécuter correctement
- Ou le token stocké en localStorage ne correspond pas

**Solution Backend (Code.gs)** :
```javascript
function apiLogin(email, code) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    const db = readUsersDb();
    const cleanEmail = email.toLowerCase().trim();
    const user = db.users.find(u => u.email === cleanEmail);

    if (!user) throw new Error("Cette adresse email n'est pas inscrite.");
    if (user.code !== code.toString()) throw new Error("Le code est incorrect.");

    // Force admin si c'est l'email admin
    if (cleanEmail === ADMIN_EMAIL) {
        user.isAdmin = true;
        user.canCreate = true;
    }

    // Générer le token
    const token = Utilities.getUuid();
    user.token = token;

    // IMPORTANT : Sauvegarder AVANT de retourner
    writeUsersDb(db);

    return { success: true, token: token, user: sanitizeUser(user) };
  } finally {
    lock.releaseLock();
  }
}
```

**Solution Frontend (app.js)** :
```javascript
// Stocker le token correctement après login
doLogin: async function() {
    const email = document.getElementById('login-email').value;
    const code = document.getElementById('login-code').value;

    try {
        this.toggleLoader(true);
        const res = await this.api('login', { email, code });

        if (res.requireNewPassword) {
            await this.handleChangePassword(email, code);
            return;
        }

        // S'assurer que le token est bien stocké
        this.user = {
            ...res.user,
            token: res.token  // IMPORTANT : inclure le token !
        };
        localStorage.setItem('wh_user', JSON.stringify(this.user));
        this.showDashboard();
    } catch (e) {
        this.showError(e.message);
    } finally {
        this.toggleLoader(false);
    }
}
```

### BUG 5 : Le code admin 15112000 est encore dans le code
**Problème** : Le backend contient encore des références au code 15112000.
**Solution** : Supprimer TOUTES les références :
```javascript
// SUPPRIMER ces lignes dans Code.gs :
const _SEC_2 = "MTUxMTIwMDA="; // Admin Code (15112000)
const ADMIN_CODE_HASH = decodeSecret(_SEC_2);
```

---

## CHECKLIST DE VÉRIFICATION (À FAIRE AVANT DE LIVRER)

Avant de soumettre le code, Jules doit vérifier :

- [ ] Le logo s'affiche sur la page de connexion
- [ ] L'avatar affiche la première lettre du prénom (pas une image)
- [ ] L'avatar est cliquable et ouvre l'admin pour `chaouiengage@gmail.com`
- [ ] Pas de déconnexion automatique après connexion
- [ ] Pas de référence à 15112000 dans le code
- [ ] L'admin est identifié UNIQUEMENT par email
- [ ] Toutes les erreurs sont en français
- [ ] Pas d'utilisation de `alert()`, `confirm()`, `prompt()`

---

---

## Contexte du Projet

Je souhaite développer une **application de messagerie instantanée sécurisée** (type WhatsApp) nommée **"WhatsHappen"** avec le branding **"Chaoui Engagé"**.

### Architecture Obligatoire
- **Frontend** : Hébergé sur **Netlify** (app.netlify.com) - fichiers HTML/CSS/JS statiques
- **Backend** : **Google Apps Script** servant d'API JSON (doPost)
- **Base de données** : **Google Drive** - les fichiers Google Docs servent de stockage de données chiffrées
- **PAS de bibliothèques externes** (pas de CryptoJS, etc.) - utiliser un chiffrement natif (XOR/Base64)

---

## Informations de Configuration (À CHIFFRER EN BASE64 DANS LE CODE)

### ⚠️ CRITIQUE : Aucune de ces informations ne doit apparaître en clair dans AUCUN fichier !

| Élément | Valeur | Encodage Base64 |
|---------|--------|-----------------|
| Dossier Google Drive | `1IN2pSIhjV_3Fn-B_WLMUgNFcQdLOjbYr` | `MUlOMnBTSWhqVl8zRm4tQl9XTE1VZ05GY1FkTE9qYlly` |
| URL Apps Script | `https://script.google.com/macros/s/AKfycbxzFevbQJzerwD2L-uNcVTRJE9XVJ4HGdC9KUftOyIKT9pqErsvNfPsfSC12MjBEUDQvA/exec` | `aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4ekZldmJRSnplcndEMkwtdW5jVlRSSkU5WFZKNEhHZEM5S1VmdE95SUtUOXBxRXJzdk5mUHNmU0MxMk1qQkVVRFF2QS9leGVj` |
| Email Super-Admin | `chaouiengage@gmail.com` | `Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ==` |

**⚠️ IMPORTANT : PAS de code admin fixe !** Le super-admin est identifié **UNIQUEMENT par son email**. Il choisit son code à 3 chiffres comme tout le monde.

---

## Sécurité & Cryptage (PRIORITÉ ABSOLUE - RGPD)

### Règles strictes :
1. **TOUT** ce qui est écrit dans Google Drive doit être chiffré
2. **AUCUN lien, email, mot de passe ou donnée sensible** ne doit apparaître en clair
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

### ⚠️ TOUS les messages doivent être en français et compréhensibles :

| Situation | Message |
|-----------|---------|
| Email non trouvé | "Cette adresse email n'est pas inscrite." |
| Code incorrect | "Le code est incorrect." |
| Email déjà inscrit | "Cette adresse email est déjà utilisée." |
| Code invalide (pas 3 chiffres) | "Le code doit contenir exactement 3 chiffres." |
| Session expirée | "Votre session a expiré. Veuillez vous reconnecter." |
| Utilisateur introuvable | "Cet utilisateur n'existe pas dans le système." |
| Pas de droits création | "Vous n'avez pas les droits pour créer une conversation." |
| Pas de droits ajout | "Vous n'avez pas les droits pour ajouter des participants." |
| Conversation expirée | "Cette conversation a expiré et a été supprimée." |
| Erreur serveur | "Une erreur est survenue. Veuillez réessayer." |
| Champ vide | "Veuillez remplir tous les champs." |
| Participant déjà présent | "Cette personne est déjà dans la conversation." |
| Impossible supprimer admin | "Impossible de supprimer le super-administrateur." |
| Connexion requise | "Veuillez vous connecter pour accéder à cette fonctionnalité." |

---

## Système de Modales Stylisées (OBLIGATOIRE)

### ❌ INTERDIT : `alert()`, `confirm()`, `prompt()` du navigateur

### Structure HTML des modales :
```html
<div id="modal-overlay" class="modal-overlay hidden">
  <div id="modal-box" class="modal-box">
    <div class="modal-icon"></div>
    <div class="modal-title"></div>
    <div class="modal-message"></div>
    <div class="modal-input-container hidden">
      <input type="text" id="modal-input" class="modal-input" />
    </div>
    <div class="modal-buttons">
      <button id="modal-cancel" class="btn-modal btn-cancel hidden">Annuler</button>
      <button id="modal-confirm" class="btn-modal btn-confirm">OK</button>
    </div>
  </div>
</div>
```

### CSS des modales :
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.modal-overlay.hidden { display: none; }

.modal-box {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 2px solid #D4AF37;
  border-radius: 15px;
  padding: 30px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 0 30px rgba(212, 175, 55, 0.3);
  animation: modalAppear 0.3s ease-out;
}

@keyframes modalAppear {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-icon { font-size: 48px; margin-bottom: 15px; }
.modal-title { color: #D4AF37; font-size: 1.5rem; font-weight: bold; margin-bottom: 10px; }
.modal-message { color: #fff; font-size: 1rem; margin-bottom: 20px; line-height: 1.5; }

.modal-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #D4AF37;
  border-radius: 8px;
  background: #333;
  color: #fff;
  font-size: 1rem;
  margin-bottom: 15px;
}

.btn-modal {
  padding: 12px 30px;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin: 5px;
  transition: all 0.3s ease;
}

.btn-confirm {
  background: linear-gradient(135deg, #D4AF37 0%, #C9A227 100%);
  color: #000;
}

.btn-cancel {
  background: transparent;
  border: 1px solid #666;
  color: #999;
}

.modal-box.error .modal-icon::before { content: "❌"; }
.modal-box.success .modal-icon::before { content: "✅"; }
.modal-box.info .modal-icon::before { content: "ℹ️"; }
.modal-box.warning .modal-icon::before { content: "⚠️"; }
.modal-box.confirm .modal-icon::before { content: "❓"; }
```

### Fonctions JavaScript :
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

// Raccourcis en français
const showError = (msg) => showModal('error', 'Erreur', msg);
const showSuccess = (msg) => showModal('success', 'Succès', msg);
const showInfo = (msg) => showModal('info', 'Information', msg);
const showConfirm = (msg) => showModal('confirm', 'Confirmation', msg, true);
const showPrompt = (title, placeholder) => showModal('info', title, '', true, placeholder);
```

---

## Fonctionnalités Requises

### 1. Authentification

#### Inscription :
- **Email** + **Prénom** + **Code à 3 chiffres**
- **TOUT LE MONDE** choisit un code à 3 chiffres, y compris l'admin
- Le super-admin est identifié **UNIQUEMENT par son email** (`chaouiengage@gmail.com`)
- À l'inscription, si l'email = super-admin → automatiquement `isAdmin: true` et `canCreate: true`
- Validation : le code doit faire **exactement 3 chiffres** pour TOUS

#### Connexion :
- **Email** + **Code à 3 chiffres**
- Token de session (UUID) stocké côté serveur et en LocalStorage

### 2. Interface Header avec Avatar Cliquable

#### Structure du header (TRÈS IMPORTANT) :
```
┌─────────────────────────────────────────────────┐
│  [Avatar]  Prénom            [Refresh] [Logout] │
│     ↓                                           │
│  Cliquable!                                     │
└─────────────────────────────────────────────────┘
```

#### Avatar :
- **Cercle avec la première lettre du prénom** (ex: "L" pour Lyes)
- Bordure dorée
- **CLIQUABLE pour TOUS les utilisateurs**
- Quand on clique :
  - **Si admin** → Ouvre le panneau admin
  - **Si non-admin** → Ouvre le profil utilisateur

#### HTML de l'avatar :
```html
<div class="user-header">
  <div class="user-avatar" id="avatar-btn" title="Cliquez pour accéder aux options">
    <span class="avatar-letter">L</span>
  </div>
  <span class="user-name">Lyes</span>
  <!-- Afficher "Admin" seulement si isAdmin -->
  <span class="admin-badge" id="admin-badge" style="display: none;">Admin</span>
</div>
```

#### CSS de l'avatar :
```css
.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #D4AF37;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
}

.user-avatar:hover {
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.5);
  transform: scale(1.05);
}

.avatar-letter {
  color: #D4AF37;
  font-size: 1.5rem;
  font-weight: bold;
}

.admin-badge {
  background: #D4AF37;
  color: #000;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: bold;
  margin-left: 5px;
}
```

### 3. Conversations

#### Création :
- Choix de la durée : **10min**, **12h**, **24h**, **48h**, ou **Illimité**
- **ON PEUT CRÉER UNE CONVERSATION AVEC SOI-MÊME** (pour notes personnelles)
- Sélection des participants par email
- Si email non inscrit → Modal "Cet utilisateur n'existe pas dans le système."
- Seuls les **admins** ou les utilisateurs avec **droits de création** peuvent créer

#### Bouton de création :
- Le bouton "+" est **INVISIBLE** (pas juste désactivé) si l'utilisateur n'a pas les droits
- Position : en bas à droite, flottant

#### Messages :
- Envoi de texte, images et fichiers (Base64)
- Polling toutes les 3 secondes
- Affiche le **prénom** de l'expéditeur

#### Suppression immédiate à expiration :
- Quand le timer atteint 0 → suppression instantanée
- Modal "Cette conversation a expiré et a été supprimée."
- Redirection vers le dashboard

### 4. Console Admin

#### Accès :
- Cliquer sur l'**avatar** (cercle avec initiale) dans le header
- Seuls les utilisateurs avec `isAdmin: true` voient le panneau admin
- Les non-admins voient leur profil

#### Fonctionnalités admin :
| Action | Description |
|--------|-------------|
| Voir utilisateurs | Liste avec email, prénom, droits, date |
| Supprimer utilisateur | Modal de confirmation (impossible pour super-admin) |
| Donner/retirer droits création | Toggle |
| Promouvoir/rétrograder admin | Toggle (impossible pour super-admin) |
| Réinitialiser mot de passe | Génère code temporaire à 4 chiffres |

#### Protections super-admin :
- `chaouiengage@gmail.com` NE PEUT JAMAIS :
  - Perdre son statut admin
  - Perdre ses droits de création
  - Être supprimé

### 5. Profil Utilisateur (pour non-admins)

Quand un utilisateur non-admin clique sur son avatar :
- Voir son prénom et email (partiellement masqué)
- Changer son code
- Se déconnecter

---

## Design & UI (Branding "Chaoui Engagé")

### Logo :
- **Le logo doit être affiché sur la page de connexion**
- Format : rond avec bordure dorée
- Le logo est fourni en pièce jointe (à encoder en Base64)

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
- Logo Chaoui Engagé centré en haut
- Titre "CHAOUI ENGAGÉ" en doré
- Sous-titre "Messagerie Sécurisée & Éphémère" en gris
- Champ email : fond clair
- Champ code : fond sombre, type password

### Dashboard :
- Header avec avatar cliquable + prénom + badge "Admin" si applicable
- Liste des conversations en cartes glassmorphism
- Bouton "+" flottant (si autorisé)

---

## Structure des Fichiers

### Backend - `Code.gs` (UN SEUL FICHIER)

```javascript
// Actions API (noms exacts à utiliser) :
switch (action) {
  case 'login': ...
  case 'register': ...
  case 'changePassword': ...
  case 'getState': ...
  case 'createChat': ...        // PAS "createConversation" !
  case 'sendMessage': ...
  case 'getMessages': ...
  case 'addParticipant': ...
  case 'expireChat': ...
  case 'adminGetUsers': ...
  case 'adminUpdateUser': ...
  case 'adminDeleteUser': ...
  case 'adminResetPassword': ...
}
```

### Frontend - Dossier `netlify/`

```
netlify/
├── index.html      # Structure complète avec modales
├── style.css       # Design Chaoui Engagé
├── app.js          # Logique (actions doivent matcher le backend!)
├── logo.js         # Logo en Base64
└── logo.jpeg       # Logo fichier
```

---

## Actions API (NOMS EXACTS)

| Action Frontend | Action Backend | Description |
|-----------------|---------------|-------------|
| `login` | `login` | Connexion |
| `register` | `register` | Inscription |
| `changePassword` | `changePassword` | Changer code |
| `getState` | `getState` | Récupérer conversations |
| `createChat` | `createChat` | Créer conversation |
| `sendMessage` | `sendMessage` | Envoyer message |
| `getMessages` | `getMessages` | Récupérer messages |
| `addParticipant` | `addParticipant` | Ajouter participant |
| `expireChat` | `expireChat` | Supprimer conversation expirée |
| `adminGetUsers` | `adminGetUsers` | Liste utilisateurs (admin) |
| `adminUpdateUser` | `adminUpdateUser` | Modifier droits (admin) |
| `adminDeleteUser` | `adminDeleteUser` | Supprimer utilisateur (admin) |
| `adminResetPassword` | `adminResetPassword` | Reset mot de passe (admin) |

---

## Checklist Critique

### ❌ NE JAMAIS FAIRE :
- [ ] Afficher données sensibles en clair
- [ ] Utiliser `alert()`, `confirm()`, `prompt()`
- [ ] Utiliser un code admin fixe (pas de 15112000 !)
- [ ] Empêcher les conversations avec soi-même
- [ ] Afficher le bouton "+" si pas les droits
- [ ] Avoir des noms d'actions différents frontend/backend
- [ ] Messages d'erreur en anglais

### ✅ TOUJOURS FAIRE :
- [ ] Identifier l'admin UNIQUEMENT par email
- [ ] Code à 3 chiffres pour TOUS (y compris admin)
- [ ] Avatar cliquable → admin ou profil
- [ ] Messages d'erreur en français
- [ ] Permettre conversation avec soi-même
- [ ] Supprimer immédiatement à expiration
- [ ] Afficher le logo sur la page de connexion

---

## Instructions de Déploiement

### Backend :
1. script.google.com → Nouveau projet "WhatsHappen"
2. Coller Code.gs
3. Déployer → Application Web → Tout le monde
4. Trigger : `cleanUpExpiredChats` toutes les 5 minutes

### Frontend :
1. app.netlify.com
2. Drag & drop le dossier `netlify/`

### Premier lancement :
1. Créer un compte avec `chaouiengage@gmail.com`
2. Choisir un code à 3 chiffres (celui que tu veux)
3. Tu seras automatiquement admin

---

## Logo

**Le logo Chaoui Engagé est fourni en pièce jointe.** Il doit être :
1. Encodé en Base64 dans `logo.js`
2. Affiché sur la page de connexion (rond, bordure dorée)
3. Visible et bien centré

---

## Rappel Final

Ce que je veux :
- ✅ Admin identifié par email uniquement (pas de code fixe)
- ✅ Code à 3 chiffres pour tout le monde
- ✅ Avatar cliquable pour accéder à admin/profil
- ✅ Conversations avec soi-même possibles
- ✅ Messages d'erreur en français
- ✅ Modales stylisées (pas d'alerts)
- ✅ Logo affiché sur la page de connexion
- ✅ Actions API harmonisées (createChat partout)

Fichiers à livrer :
1. `Code.gs`
2. `netlify/index.html`
3. `netlify/style.css`
4. `netlify/app.js`
5. `netlify/logo.js`
6. `INSTRUCTIONS.md`

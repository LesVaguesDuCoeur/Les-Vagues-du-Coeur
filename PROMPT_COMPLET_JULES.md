# PROMPT COMPLET POUR JULES - PROJET WHATSHAPPEN V2

## Contexte du Projet

Je souhaite développer une **application de messagerie instantanée sécurisée** (type WhatsApp) nommée **"WhatsHappen"** avec le branding **"Chaoui Engagé"**.

### Architecture Obligatoire (TRÈS IMPORTANT)
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
| Email Admin | `chaouiengage@gmail.com` | `Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ==` |
| Code Admin | `15112000` | `MTUxMTIwMDA=` |

---

## Sécurité & Cryptage (PRIORITÉ ABSOLUE - RGPD)

### Règles strictes :
1. **TOUT** ce qui est écrit dans Google Drive doit être chiffré (messages, métadonnées, infos utilisateurs)
2. **AUCUN lien, email, mot de passe ou donnée sensible** ne doit apparaître en clair dans les fichiers du site
3. Utiliser un **chiffrement natif** (XOR + Base64 double encodage) sans bibliothèque externe
4. Les utilisateurs ne voient que les **prénoms** dans les conversations, jamais les emails
5. Implémenter des **protections anti-capture d'écran** (CSS blur quand la fenêtre perd le focus, user-select: none)

### Méthode de chiffrement native (à utiliser) :
```javascript
// Clé secrète (aussi chiffrée en Base64 dans le code réel)
const SECRET_KEY = "ChaouiSecretKeyV2";

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

## Système de Notifications Stylisées (TRÈS IMPORTANT)

### ❌ INTERDIT : Utiliser `alert()`, `confirm()`, ou `prompt()` du navigateur

### ✅ OBLIGATOIRE : Créer des modales personnalisées qui respectent le design du site

Créer un système de modales/toasts avec :
- **Modal d'erreur** : Fond rouge foncé avec bordure dorée, icône ❌
- **Modal de succès** : Fond vert foncé avec bordure dorée, icône ✓
- **Modal d'information** : Fond bleu foncé avec bordure dorée, icône ℹ
- **Modal de confirmation** : Avec boutons "Confirmer" et "Annuler" stylisés
- **Modal de saisie** : Pour les prompts (ajouter un participant, etc.)

### Exemple de structure HTML pour les modales :
```html
<!-- Modal Container (à ajouter dans index.html) -->
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

### Exemple CSS pour les modales :
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.modal-overlay.hidden {
  display: none;
}

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

.modal-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.modal-title {
  color: #D4AF37;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.modal-message {
  color: #fff;
  font-size: 1rem;
  margin-bottom: 20px;
}

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

.btn-confirm:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.5);
}

.btn-cancel {
  background: transparent;
  border: 1px solid #666;
  color: #999;
}

.btn-cancel:hover {
  border-color: #D4AF37;
  color: #D4AF37;
}

/* Types de modales */
.modal-box.error .modal-icon::before { content: "❌"; }
.modal-box.success .modal-icon::before { content: "✓"; }
.modal-box.info .modal-icon::before { content: "ℹ️"; }
.modal-box.warning .modal-icon::before { content: "⚠️"; }
.modal-box.confirm .modal-icon::before { content: "❓"; }
```

### Fonctions JavaScript pour les modales :
```javascript
// Fonction pour afficher une modal
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

    // Reset
    box.className = 'modal-box ' + type;
    titleEl.textContent = title;
    messageEl.textContent = message;

    // Input
    if (inputPlaceholder) {
      inputContainer.classList.remove('hidden');
      input.placeholder = inputPlaceholder;
      input.value = '';
    } else {
      inputContainer.classList.add('hidden');
    }

    // Cancel button
    if (showCancel) {
      cancelBtn.classList.remove('hidden');
    } else {
      cancelBtn.classList.add('hidden');
    }

    // Show
    overlay.classList.remove('hidden');

    // Events
    const cleanup = () => {
      overlay.classList.add('hidden');
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
    };

    confirmBtn.onclick = () => {
      cleanup();
      resolve(inputPlaceholder ? input.value : true);
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(null);
    };
  });
}

// Raccourcis pratiques
function showError(message) {
  return showModal('error', 'Erreur', message);
}

function showSuccess(message) {
  return showModal('success', 'Succès', message);
}

function showInfo(message) {
  return showModal('info', 'Information', message);
}

function showConfirm(message) {
  return showModal('confirm', 'Confirmation', message, true);
}

function showPrompt(title, placeholder) {
  return showModal('info', title, '', true, placeholder);
}
```

---

## Fonctionnalités Requises

### 1. Authentification

#### Inscription (TOUT LE MONDE, y compris l'admin) :
- **Email** + **Prénom** + **Code personnel**
- L'email `chaouiengage@gmail.com` **doit s'inscrire comme tout le monde**
- Mais à l'inscription, si l'email correspond à l'admin ET le code est `15112000` → automatiquement `isAdmin: true` et `canCreate: true`
- Code à **3 chiffres** pour les utilisateurs normaux
- Code à **8 chiffres** (`15112000`) uniquement pour l'admin
- Validation : si quelqu'un essaie de mettre 8 chiffres sans être admin → erreur

#### Connexion :
- **Email** + **Code**
- Génération d'un **token de session** (UUID) stocké côté serveur et en LocalStorage
- Validation du token à chaque requête API
- Si token invalide → redirection vers login avec modal d'erreur stylisée

#### Changement de mot de passe obligatoire :
- Si `mustChangePassword: true` → l'utilisateur est redirigé vers un formulaire de changement
- Impossible d'accéder à l'app tant que le mot de passe n'est pas changé

### 2. Conversations Éphémères

#### Création :
- Choix de la durée : **10min**, **12h**, **24h**, **48h**, ou **Illimité**
- Sélection des participants par email (avec autocomplétion si possible)
- Si un email n'est pas inscrit → Modal d'erreur stylisée "Utilisateur introuvable"
- **1 conversation = 1 fichier Google Doc** dans le dossier Drive
- Seuls les **admins** ou les utilisateurs avec **droits de création** peuvent créer

#### Bouton de création :
- Le bouton "+" de création ne s'affiche **QUE** si l'utilisateur a `canCreate: true` ou `isAdmin: true`
- Pour les autres, le bouton est **invisible** (pas désactivé, invisible)

#### Messages :
- Envoi de **texte**, **images** et **fichiers** (convertis en Base64)
- Stockage **append-only** (on ajoute un paragraphe chiffré, on ne réécrit pas tout le fichier)
- Rafraîchissement automatique (polling toutes les 3 secondes) + possibilité de pull-to-refresh sur mobile
- Les messages affichent le **prénom** de l'expéditeur, pas l'email
- Messages système pour les événements (ajout de membre, etc.)

#### Timer / Expiration - SUPPRESSION IMMÉDIATE :
- **Compteur à rebours** visible dans l'en-tête de la conversation
- Format dynamique : "23h 45m 12s" ou "9m 30s" si moins d'une heure
- ⚠️ **SUPPRESSION IMMÉDIATE** : Quand le timer atteint 0 :
  1. Le frontend détecte l'expiration et affiche une modal "Conversation expirée"
  2. Le frontend appelle une action API `expireChat` qui supprime immédiatement le fichier
  3. L'utilisateur est redirigé vers le dashboard
- **Backup** : Un trigger Apps Script (toutes les 5 minutes) nettoie les conversations oubliées

#### Vérification à chaque chargement :
- Quand on ouvre une conversation, vérifier si elle n'est pas expirée
- Si expirée → supprimer immédiatement et afficher la modal

### 3. Groupes

- Une conversation peut avoir **plusieurs participants**
- Bouton **"+"** dans l'en-tête de conversation pour ajouter des membres
- Seuls les **admins** ou les utilisateurs avec **droits de création** peuvent ajouter des personnes
- Modal de saisie stylisée pour entrer l'email du nouveau participant
- Quand quelqu'un est ajouté, un message système apparaît : "[Admin] a ajouté [Nouveau]"
- Liste des participants visible (afficher les prénoms, pas les emails)

### 4. Console Admin

#### Accès :
- **Cliquer sur le logo "Chaoui Engagé"** dans le dashboard pour basculer vers l'admin
- Le logo doit avoir un effet hover indiquant qu'il est cliquable (léger glow)
- Seuls les utilisateurs avec `isAdmin: true` peuvent voir le panneau admin

#### Fonctionnalités admin :
| Action | Description |
|--------|-------------|
| Voir tous les utilisateurs | Tableau avec email, prénom, droits, date d'inscription |
| Supprimer un utilisateur | Modal de confirmation, impossible pour le super-admin |
| Donner/retirer droits création | Toggle ou checkbox |
| Promouvoir admin | Donner le statut admin à un utilisateur |
| Rétrograder admin | Retirer le statut admin (impossible pour super-admin) |
| Réinitialiser mot de passe | Génère un code temporaire, affiche dans une modal |

#### Protections :
- Le super-admin (`chaouiengage@gmail.com`) **NE PEUT JAMAIS** :
  - Perdre son statut admin
  - Perdre ses droits de création
  - Être supprimé
  - Même par lui-même

### 5. Profil Utilisateur

Ajouter un accès au profil (icône ou bouton) permettant de :
- Voir ses informations (prénom, email masqué partiellement)
- Changer son code personnel
- Se déconnecter

---

## Design & UI (Branding "Chaoui Engagé")

### Palette de couleurs :
```css
:root {
  --gold-primary: #D4AF37;
  --gold-secondary: #C9A227;
  --gold-light: #E5C158;
  --black-primary: #0a0a0a;
  --black-secondary: #1a1a1a;
  --black-tertiary: #2d2d2d;
  --white: #ffffff;
  --gray-light: #f0f0f0;
  --gray-dark: #333333;
  --error: #8B0000;
  --success: #006400;
  --info: #00008B;
}
```

### Éléments spécifiques :

#### Page de connexion :
- Logo centré en haut (rond, avec bordure dorée)
- Titre "CHAOUI ENGAGÉ" en or
- Sous-titre "Messagerie Sécurisée & Éphémère" en gris
- Champ Email : fond clair (`#f0f0f0`), texte noir, placeholder gris
- Champ Code : fond sombre (`#333`), texte clair, type password avec points
- Bouton "CONNEXION" : fond doré dégradé, texte noir, majuscules
- Lien "Créer un compte" : texte doré, souligné au hover

#### Dashboard :
- Header avec logo (cliquable pour admin) et nom de l'utilisateur
- Liste des conversations sous forme de cartes
- Chaque carte affiche : noms des participants, dernier message, timer restant
- Bouton "+" flottant en bas à droite (visible seulement si autorisé)
- Effet glassmorphism sur les cartes

#### Vue conversation :
- Header avec : bouton retour, noms des participants, timer, bouton "+" pour ajouter
- Zone de messages scrollable
- Messages reçus : alignés à gauche, fond semi-transparent
- Messages envoyés : alignés à droite, fond doré semi-transparent
- Zone de saisie fixe en bas avec : input, bouton pièce jointe, bouton envoyer

#### Panneau admin :
- Tableau des utilisateurs avec actions
- Design cohérent avec le reste de l'application
- Boutons d'action colorés selon leur fonction

### Animations :
- Transition douce entre les vues (fade ou slide)
- Animation d'apparition des messages
- Loading spinner doré pendant les chargements
- Effet pulse sur le timer quand il reste peu de temps

### Protection anti-screenshot :
```css
/* Blur quand la fenêtre perd le focus */
body.blurred .sensitive-content {
  filter: blur(10px);
  pointer-events: none;
}

/* Empêcher la sélection */
.no-select {
  user-select: none;
  -webkit-user-select: none;
}
```

```javascript
// Détection de perte de focus
window.addEventListener('blur', () => document.body.classList.add('blurred'));
window.addEventListener('focus', () => document.body.classList.remove('blurred'));
```

---

## Structure des Fichiers à Livrer

### 1. Backend - `Code.gs` (UN SEUL FICHIER)

```
Code.gs
├── Configuration (constantes en Base64)
├── doGet() - Retourne status Online
├── doPost(e) - Gestionnaire API principal
│   ├── login
│   ├── register
│   ├── changePassword
│   ├── getState
│   ├── createChat
│   ├── sendMessage
│   ├── getMessages
│   ├── addParticipant
│   ├── expireChat (NOUVEAU - suppression immédiate)
│   ├── adminGetUsers
│   ├── adminUpdateUser
│   ├── adminDeleteUser
│   └── adminResetPassword
├── Helpers
│   ├── encrypt() / decrypt()
│   ├── readUsersDb() / writeUsersDb()
│   ├── validateUser()
│   ├── getChatsForUser()
│   └── isExpired()
└── Triggers
    └── cleanUpExpiredChats()
```

### 2. Frontend - Dossier `netlify/`

```
netlify/
├── index.html          # Structure SPA complète
├── style.css           # Design Chaoui Engagé + modales
├── app.js              # Logique application + API calls
├── logo.js             # Logo en Base64
└── logo.jpeg           # Logo fichier (backup)
```

### 3. Documentation - `INSTRUCTIONS.md`

---

## Spécifications Techniques Détaillées

### Structure de `Users.db` (chiffré) :
```json
{
  "users": [
    {
      "email": "user@example.com",
      "firstName": "Jean",
      "code": "123",
      "isAdmin": false,
      "canCreate": false,
      "activeChats": ["docId1", "docId2"],
      "token": "uuid-session",
      "mustChangePassword": false,
      "registeredAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Structure d'un fichier conversation :
Premier paragraphe = métadonnées (chiffré) :
```json
{
  "id": "googleDocId",
  "createdAt": "2025-01-01T00:00:00Z",
  "expiresAt": "2025-01-02T00:00:00Z",
  "participants": ["email1@x.com", "email2@x.com"],
  "participantNames": ["Jean", "Marie"]
}
```

Paragraphes suivants = messages (chiffrés individuellement, append-only) :
```json
{
  "id": "uuid",
  "sender": "email@example.com",
  "senderName": "Jean",
  "content": "Texte ou Base64 pour images",
  "type": "text|image|file|system",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

### Actions API (doPost) :

| Action | Paramètres | Retour |
|--------|-----------|--------|
| `login` | email, code | token, user |
| `register` | email, firstName, code | token, user |
| `changePassword` | email, oldCode, newCode | token, user |
| `getState` | token, email | chats[], user |
| `createChat` | token, email, participants[], duration | chatId |
| `sendMessage` | token, email, chatId, content, type | success |
| `getMessages` | token, email, chatId | messages[], meta |
| `addParticipant` | token, email, chatId, targetEmail | success |
| `expireChat` | token, email, chatId | success |
| `adminGetUsers` | token, email | users[] |
| `adminUpdateUser` | token, email, targetEmail, canCreate?, isAdmin? | success |
| `adminDeleteUser` | token, email, targetEmail | success |
| `adminResetPassword` | token, email, targetEmail | newCode |

---

## Points Critiques - Checklist

### ❌ NE JAMAIS FAIRE :
- [ ] Afficher des liens, emails ou mots de passe en clair
- [ ] Utiliser `alert()`, `confirm()`, `prompt()` du navigateur
- [ ] Utiliser des bibliothèques externes
- [ ] Pré-remplir les champs avec des données sensibles
- [ ] Permettre la suppression/modification du super-admin
- [ ] Afficher le bouton "+" si l'utilisateur n'a pas les droits
- [ ] Attendre le trigger pour supprimer une conversation expirée

### ✅ TOUJOURS FAIRE :
- [ ] Chiffrer TOUTES les données en Base64/XOR
- [ ] Utiliser LockService pour les écritures
- [ ] Valider le token à CHAQUE requête
- [ ] Utiliser des modales stylisées pour TOUTES les notifications
- [ ] Supprimer IMMÉDIATEMENT les conversations expirées
- [ ] Vérifier l'expiration à chaque chargement de conversation
- [ ] Rendre le logo cliquable pour l'admin
- [ ] Cacher (pas désactiver) les boutons non autorisés

---

## Fonctionnalités Bonus (Si possible)

1. **Indicateur de frappe** : "Jean est en train d'écrire..."
2. **Accusés de lecture** : Double check quand le message est lu
3. **Recherche d'utilisateurs** : Autocomplétion lors de l'ajout de participants
4. **Son de notification** : Petit son lors de la réception d'un message
5. **Mode sombre/clair** : Toggle (par défaut sombre)
6. **Export de conversation** : Télécharger en PDF (avant expiration)
7. **Réponse à un message** : Citer un message précédent
8. **Suppression de message** : Supprimer son propre message (remplacé par "Message supprimé")

---

## Instructions de Déploiement (pour INSTRUCTIONS.md)

### Backend (Google Apps Script) :

1. Aller sur **script.google.com**
2. Créer un nouveau projet → Nommer "WhatsHappen"
3. Supprimer le contenu par défaut de Code.gs
4. Copier-coller tout le contenu du fichier Code.gs fourni
5. **Déployer** → Nouveau déploiement → Application Web
   - Exécuter en tant que : **Moi**
   - Accès : **Tout le monde**
6. Copier l'URL de déploiement
7. **Ajouter un trigger** :
   - Fonction : `cleanUpExpiredChats`
   - Source : Axé sur le temps
   - Type : Minutes
   - Intervalle : Toutes les 5 minutes

### Frontend (Netlify) :

1. Aller sur **app.netlify.com**
2. Drag & drop le dossier `netlify/` sur la page
3. Attendre le déploiement
4. Récupérer l'URL du site

### Premier lancement :

1. Aller sur le site Netlify
2. Cliquer sur "Créer un compte"
3. S'inscrire avec `chaouiengage@gmail.com` et le code `15112000`
4. L'utilisateur sera automatiquement admin
5. Se connecter et tester toutes les fonctionnalités

---

## Rappel Final

**Ce que je veux** :
- Une application de messagerie sécurisée fonctionnelle
- Design professionnel "Chaoui Engagé" (Or/Noir)
- Zéro donnée sensible visible dans le code
- Modales stylisées (pas d'alerts moches)
- Suppression immédiate des conversations expirées
- Console admin complète
- Code propre et bien commenté

**Fichiers à livrer** :
1. `Code.gs` - Backend complet
2. `netlify/index.html` - Structure HTML
3. `netlify/style.css` - Styles complets
4. `netlify/app.js` - Logique JavaScript
5. `netlify/logo.js` - Logo en Base64
6. `INSTRUCTIONS.md` - Guide de déploiement

Merci de respecter TOUTES ces spécifications. Si quelque chose n'est pas clair, demande avant de coder.

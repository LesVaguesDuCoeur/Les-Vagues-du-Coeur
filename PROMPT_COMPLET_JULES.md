# PROMPT COMPLET POUR JULES - PROJET WHATSHAPPEN

## Contexte du Projet

Je souhaite développer une **application de messagerie instantanée sécurisée** (type WhatsApp) nommée **"WhatsHappen"** avec le branding **"Chaoui Engagé"**.

### Architecture Obligatoire (TRÈS IMPORTANT)
- **Frontend** : Hébergé sur **Netlify** (app.netlify.com) - fichiers HTML/CSS/JS statiques
- **Backend** : **Google Apps Script** servant d'API JSON (doPost)
- **Base de données** : **Google Drive** - les fichiers Google Docs servent de stockage de données chiffrées
- **PAS de bibliothèques externes** (pas de CryptoJS, etc.) - utiliser un chiffrement natif (XOR/Base64)

---

## Informations de Configuration (À CHIFFRER EN BASE64 DANS LE CODE)

### IMPORTANT : Aucune de ces informations ne doit apparaître en clair dans les fichiers !

| Élément | Valeur | Usage |
|---------|--------|-------|
| Dossier Google Drive | `1IN2pSIhjV_3Fn-B_WLMUgNFcQdLOjbYr` | Stockage de tous les fichiers (Users.db + conversations) |
| URL Apps Script | `https://script.google.com/macros/s/AKfycbxzFevbQJzerwD2L-uNcVTRJE9XVJ4HGdC9KUftOyIKT9pqErsvNfPsfSC12MjBEUDQvA/exec` | Endpoint API backend |
| Email Admin | `chaouiengage@gmail.com` | Super-administrateur |
| Code Admin | `15112000` | Code d'authentification admin (8 chiffres, exception) |

### Encodage Base64 de ces valeurs :
- Dossier ID : `MUlOMnBTSWhqVl8zRm4tQl9XTE1VZ05GY1FkTE9qYlly`
- URL GAS : `aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4ekZldmJRSnplcndEMkwtdW5jVlRSSkU5WFZKNEhHZEM5S1VmdE95SUtUOXBxRXJzdk5mUHNmU0MxMk1qQkVVRFF2QS9leGVj`
- Email Admin : `Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ==`
- Code Admin : `MTUxMTIwMDA=`

---

## Sécurité & Cryptage (PRIORITÉ ABSOLUE - RGPD)

### Règles strictes :
1. **TOUT** ce qui est écrit dans Google Drive doit être chiffré (messages, métadonnées, infos utilisateurs)
2. **AUCUN lien, email, mot de passe ou donnée sensible** ne doit apparaître en clair dans les fichiers du site (HTML, CSS, JS, Code.gs)
3. Utiliser un **chiffrement natif** (XOR + Base64 double encodage) sans bibliothèque externe
4. Les utilisateurs ne voient que les **prénoms** dans les conversations, jamais les emails
5. Implémenter des **protections anti-capture d'écran** (CSS blur quand la fenêtre perd le focus, user-select: none)

### Méthode de chiffrement à utiliser :
```javascript
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

## Fonctionnalités Requises

### 1. Authentification

#### Inscription :
- **Email** + **Prénom** + **Code à 3 chiffres** (choisi par l'utilisateur)
- Exception : Le code admin `15112000` fait 8 chiffres
- Stockage dans `Users.db` (fichier chiffré sur Drive)
- Le prénom et l'email sont stockés une seule fois

#### Connexion :
- **Email** + **Code** (3 chiffres, ou 8 pour l'admin)
- Génération d'un **token de session** (UUID) stocké en LocalStorage
- Validation du token à chaque requête API

#### Mot de passe temporaire :
- L'admin peut réinitialiser le mot de passe d'un utilisateur
- Le nouveau code est temporaire (4 chiffres aléatoires)
- L'utilisateur doit le changer à sa première connexion (`mustChangePassword: true`)

### 2. Conversations Éphémères

#### Création :
- Choix de la durée : **10min**, **12h**, **24h**, **48h**, ou **Illimité**
- Sélection des participants (par email)
- Si un email n'est pas inscrit → Message d'erreur "Email introuvable"
- **1 conversation = 1 fichier Google Doc** dans le dossier Drive
- Seuls les **admins** ou les utilisateurs avec **droits de création** peuvent créer des conversations

#### Messages :
- Envoi de **texte**, **images** et **fichiers** (convertis en Base64)
- Stockage chiffré dans le Google Doc (format append-only pour la performance)
- Rafraîchissement automatique (polling toutes les 3-5 secondes) + bouton "Actualiser"
- Les messages affichent le **prénom** de l'expéditeur, pas l'email

#### Timer / Expiration :
- **Compteur à rebours** visible dans l'en-tête de la conversation
- Format : "Expire dans: XXh XXm XXs"
- Un **trigger Apps Script** (toutes les 10 minutes) supprime les conversations expirées
- Quand une conversation expire, le fichier Google Doc est **supprimé définitivement**

### 3. Groupes

- Une conversation peut avoir **plusieurs participants**
- Bouton **"+"** dans l'en-tête de conversation pour ajouter des membres
- Seuls les **admins** ou les utilisateurs avec **droits de création** peuvent ajouter des personnes
- Quand quelqu'un est ajouté, un message système apparaît : "X a ajouté Y"
- Notification par email aux nouveaux participants

### 4. Console Admin

#### Accès :
- **Cliquer sur le logo "Chaoui Engagé"** dans le dashboard pour accéder à l'admin
- Seuls les utilisateurs avec `isAdmin: true` voient le panneau admin

#### Fonctionnalités admin :
- **Voir tous les utilisateurs** (email, prénom, droits, date d'inscription)
- **Supprimer un utilisateur** (impossible de supprimer le super-admin)
- **Modifier les droits** : donner/retirer le droit de créer des conversations
- **Créer d'autres admins** : donner le statut admin à d'autres utilisateurs
- **Réinitialiser le mot de passe** : génère un code temporaire à 4 chiffres
- **Protection** : Le super-admin (`chaouiengage@gmail.com`) ne peut JAMAIS perdre ses droits ou être supprimé

#### Multi-admins :
- Les autres admins peuvent aussi accéder à leur console en cliquant sur leur avatar/logo
- Ils ont accès aux mêmes fonctionnalités (sauf supprimer le super-admin)

---

## Design & UI (Branding "Chaoui Engagé")

### Thème visuel :
- **Couleurs principales** : Or/Doré (`#D4AF37`, `#C9A227`) sur fond Noir (`#0a0a0a`, `#1a1a1a`)
- **Style** : Glassmorphism (backdrop-filter: blur, fond semi-transparent)
- **Police** : Sans-serif moderne
- **Bordures** : Arrondies, avec effet lumineux doré
- **Boutons** : Fond doré, texte noir, hover avec luminosité accrue

### Éléments spécifiques :
- **Logo** : Rond, centré en haut de la page de connexion
- **Logo cliquable** : Dans le dashboard, cliquer sur le logo ouvre l'admin (si autorisé)
- **Champ Email** : Fond clair (`#f0f0f0`), texte noir
- **Champ Code/Mot de passe** : Fond sombre (`#333`), texte clair
- **Bouton principal** : "CONNEXION" en majuscules, fond doré
- **Lien secondaire** : "Créer un compte" sous le bouton

### Responsive :
- Interface adaptée aux mobiles
- Conversations en plein écran sur mobile
- Clavier virtuel ne cache pas la zone de saisie

---

## Structure des Fichiers à Livrer

### 1. Backend (Google Apps Script) - UN SEUL FICHIER

**`Code.gs`** contenant :
- Configuration (constantes chiffrées en Base64)
- Fonction `doPost(e)` - gestionnaire d'API
- Actions : login, register, changePassword, getState, createChat, sendMessage, getMessages, addParticipant, adminGetUsers, adminUpdateUser, adminDeleteUser, adminResetPassword
- Fonctions de chiffrement/déchiffrement natif
- Helpers : readUsersDb, writeUsersDb, validateUser, getChatsForUser
- Trigger : cleanUpExpiredChats (pour le nettoyage automatique)

### 2. Frontend (Netlify) - DOSSIER `netlify/`

**`netlify/index.html`** :
- Structure SPA avec vues : Login, Register, Dashboard, Chat, Admin
- Pas de framework, juste HTML vanilla
- Inclure les scripts app.js et logo.js

**`netlify/style.css`** :
- Design complet Chaoui Engagé
- Animations et transitions
- Protection anti-screenshot (blur on blur event)
- Responsive

**`netlify/app.js`** :
- URL API chiffrée en Base64 (à décoder au runtime)
- Gestion d'état (currentUser, currentChat, etc.)
- Toutes les fonctions d'appel API (fetch vers doPost)
- Gestion des vues (showLogin, showDashboard, showChat, showAdmin)
- Polling pour les messages
- Timer de countdown
- Gestion fichiers/images en Base64

**`netlify/logo.js`** :
- Logo Chaoui Engagé en Base64 : `const LOGO_BASE64 = "data:image/jpeg;base64,...";`

**`netlify/logo.jpeg`** :
- Fichier image du logo (backup)

### 3. Documentation

**`INSTRUCTIONS.md`** :
- Étapes pour déployer le backend sur Google Apps Script
- Comment créer/mettre à jour le déploiement
- Comment configurer le trigger de nettoyage
- Comment déployer le frontend sur Netlify
- Identifiants admin pour référence personnelle (CE FICHIER NE VA PAS SUR NETLIFY)

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

### Structure d'un fichier conversation (chiffré) :
```json
{
  "id": "googleDocId",
  "createdAt": "2025-01-01T00:00:00Z",
  "expiresAt": "2025-01-02T00:00:00Z",
  "participants": ["email1@x.com", "email2@x.com"],
  "participantNames": ["Jean", "Marie"],
  "messages": []
}
```

### Structure d'un message (chiffré, append-only) :
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

| Action | Paramètres | Description |
|--------|-----------|-------------|
| `login` | email, code | Connexion utilisateur |
| `register` | email, firstName, code | Inscription |
| `changePassword` | email, oldCode, newCode | Changement de mot de passe |
| `getState` | token, email | Récupère les conversations de l'utilisateur |
| `createChat` | token, email, participants[], duration | Crée une conversation |
| `sendMessage` | token, email, chatId, content, type | Envoie un message |
| `getMessages` | token, email, chatId | Récupère les messages d'une conversation |
| `addParticipant` | token, email, chatId, targetEmail | Ajoute un participant |
| `adminGetUsers` | token, email | Liste tous les utilisateurs (admin) |
| `adminUpdateUser` | token, email, targetEmail, canCreate, isAdmin | Modifie les droits |
| `adminDeleteUser` | token, email, targetEmail | Supprime un utilisateur |
| `adminResetPassword` | token, email, targetEmail | Réinitialise le mot de passe |

---

## Points Critiques à Respecter

### NE PAS FAIRE :
- ❌ Afficher des liens, emails ou mots de passe en clair dans le code
- ❌ Utiliser des bibliothèques externes (CryptoJS, etc.)
- ❌ Pré-remplir les champs email avec l'adresse admin
- ❌ Permettre la suppression du super-admin
- ❌ Afficher le bouton "+" si l'utilisateur n'a pas les droits
- ❌ Afficher des alertes de configuration à l'utilisateur

### FAIRE :
- ✅ Chiffrer TOUTES les données sensibles en Base64
- ✅ Utiliser LockService pour les opérations d'écriture (éviter les race conditions)
- ✅ Valider le token de session à CHAQUE requête API
- ✅ Afficher le timer de countdown dans les conversations
- ✅ Rendre le logo cliquable pour accéder à l'admin
- ✅ Implémenter le CSS anti-screenshot (blur on window blur)
- ✅ Supprimer automatiquement les conversations expirées

---

## Logo Chaoui Engagé

Le logo doit être :
- Affiché sur la page de connexion (centré, rond)
- Cliquable dans le dashboard pour accéder à l'admin
- Intégré en Base64 dans `logo.js` pour éviter les problèmes de chargement

**Note** : L'utilisateur fournira le fichier logo.jpeg à encoder en Base64.

---

## Instructions de Déploiement (à inclure dans INSTRUCTIONS.md)

### Backend (Google Apps Script) :
1. Aller sur script.google.com
2. Créer un nouveau projet "WhatsHappen"
3. Copier le contenu de Code.gs
4. Déployer > Nouveau déploiement > Application Web
5. Exécuter en tant que : "Moi"
6. Accès : "Tout le monde"
7. Copier l'URL de déploiement (c'est l'URL API)
8. Configurer le trigger : cleanUpExpiredChats toutes les 10 minutes

### Frontend (Netlify) :
1. Aller sur app.netlify.com
2. Glisser-déposer le dossier `netlify/`
3. Le site est en ligne !

### Identifiants Admin :
- Email : `chaouiengage@gmail.com`
- Code : `15112000`

---

## Résumé

Crée-moi tous les fichiers nécessaires pour cette application de messagerie sécurisée. L'architecture doit être :
- **1 fichier Code.gs** pour Google Apps Script (backend API)
- **1 dossier netlify/** avec index.html, style.css, app.js, logo.js pour Netlify (frontend)
- **1 fichier INSTRUCTIONS.md** pour le déploiement

Tout doit être **chiffré**, **sécurisé**, et respecter le **design Chaoui Engagé** (Or/Noir, Glassmorphism).

Le site doit fonctionner parfaitement : inscription, connexion, création de conversations, envoi de messages, gestion admin, timer d'expiration, et suppression automatique des conversations.

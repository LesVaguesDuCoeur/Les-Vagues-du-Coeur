# Instructions de Vérification et Déploiement

## 1. Déploiement Backend (Google Apps Script)

1.  Allez sur [script.google.com](https://script.google.com) et créez un nouveau projet "WhatsHappen".
2.  Copiez le contenu du fichier `Code.gs` dans l'éditeur.
3.  **Important** : Le code inclut `LEGACY_CONF` pour une auto-configuration initiale.
4.  Déployez :
    *   Bouton "Déployer" > "Nouveau déploiement".
    *   Type: "Application Web".
    *   Exécuter en tant que : "Moi" (votre compte).
    *   Personnes autorisées : "Tout le monde" (ou "Anyone").
    *   Copiez l'URL de l'application web générée.
5.  **Triggers (Déclencheurs)** :
    *   Allez dans le menu de gauche "Déclencheurs" (l'icône d'horloge).
    *   Ajoutez un déclencheur pour la fonction `cleanUpExpiredChats`.
    *   Source de l'événement : "Temporel" (Time-driven).
    *   Type : "Minutes timer" > "Every 5 minutes" (ou 10/15 min).

## 2. Configuration Frontend

1.  Prenez l'URL de votre Web App (ex: `https://script.google.com/macros/s/.../exec`).
2.  Encodez cette URL en Base64 (vous pouvez utiliser un site comme base64encode.org).
3.  Ouvrez `netlify/app.js`.
4.  Remplacez la valeur de `_ENC_URL` par votre URL encodée :
    ```javascript
    const _ENC_URL = "VOTRE_URL_BASE64_ICI";
    ```
5.  Déployez le dossier `netlify/` sur Netlify (Drag & Drop dans l'interface Netlify).

## 3. Tests de Vérification

### Bugs Critiques Corrigés
- [ ] **Boutons Cliquables** : Vérifiez que les boutons "Connexion", "S'inscrire", etc., fonctionnent correctement (clic et touche Entrée).
- [ ] **Logo** : Le logo doit s'afficher sur l'écran de connexion (cercle doré).
- [ ] **Avatar** : L'avatar (initiale du prénom) doit s'afficher en haut à gauche du Dashboard.

### Fonctionnalités Nouvelles & Sécurité
- [ ] **Mot de Passe Oublié** :
    1.  Sur l'écran de connexion, cliquez sur "Mot de passe oublié ?".
    2.  Entrez votre email.
    3.  Vérifiez votre boîte mail (Email "Code de récupération WhatsHappen").
    4.  Entrez le code et définissez un nouveau mot de passe.
    5.  Connectez-vous avec le nouveau code.
- [ ] **Emails Automatiques** :
    1.  Créez un nouveau compte : Vérifiez l'email de "Bienvenue".
    2.  Envoyez un message à un utilisateur inactif (> 5 min sans activité) : Il doit recevoir une notification "Activité détectée".
- [ ] **Migration & Chiffrement** :
    *   Les nouveaux fichiers sur Google Drive (`Users.db`, etc.) doivent contenir du texte commençant par `v1:`.
    *   L'application doit être capable de lire les anciennes données (si vous avez des fichiers existants chiffrés avec l'ancienne méthode XOR).

### Admin & Chat
- [ ] **Admin** : Connectez-vous avec `chaouiengage@gmail.com`. Cliquez sur votre avatar pour ouvrir la console Admin.
- [ ] **Conversations** : Créez un chat, envoyez des messages. Vérifiez que la suppression ("Poubelle") fonctionne et supprime bien le chat de la liste.

## Note sur la Base de Données
Le backend créera automatiquement les fichiers nécessaires (`Users.db`, `Chats.db`, etc.) sur votre Google Drive s'ils n'existent pas lors de la première requête.

# WhatsHappen - Déploiement sur Google Apps Script

Ce projet est conçu pour fonctionner exclusivement sur **Google Apps Script** avec **Google Drive** comme backend.

## Structure des Fichiers
Le code a été généré en 4 fichiers distincts pour respecter la structure Google Apps Script :
1. `Code.gs` (Backend - Copiez le contenu de `Code.js` ici)
2. `Index.html` (Structure principale)
3. `CSS.html` (Styles)
4. `JS.html` (Logique Frontend)

## Procédure d'Installation

### 1. Création du Projet
1. Allez sur [script.google.com](https://script.google.com).
2. Cliquez sur **"Nouveau projet"**.
3. Nommez le projet **"WhatsHappen"**.

### 2. Copie du Code
1. **Code.gs** :
   - Copiez tout le contenu du fichier `Code.js` fourni dans ce dépôt.
   - Collez-le dans le fichier `Code.gs` par défaut de l'éditeur Google.
   - **Important** : Modifiez la constante `ENCRYPTION_KEY` au début du fichier avec une clé secrète complexe de votre choix.
2. **index.html** :
   - Créez un nouveau fichier HTML (bouton `+` -> HTML) et nommez-le `index` (en minuscules).
   - Copiez-collez le contenu de `index.html`.
3. **CSS.html** :
   - Créez un nouveau fichier HTML nommé `CSS`.
   - Copiez-collez le contenu de `CSS.html`.
4. **JS.html** :
   - Créez un nouveau fichier HTML nommé `JS`.
   - Copiez-collez le contenu de `JS.html`.

### 3. Premier Lancement & Initialisation
1. Dans l'éditeur, sélectionnez la fonction `doGet` dans la barre d'outils et cliquez sur **"Exécuter"**.
2. Google va vous demander les **autorisations**. Acceptez-les (accès au Drive et Email).
3. Une fois exécuté sans erreur, la base de données (dossier `WhatsHappen_Data` et fichier `Users.db`) sera créée automatiquement sur votre Drive.

### 4. Configuration du Trigger (Nettoyage Automatique)
Pour que les conversations s'effacent automatiquement une fois expirées :
1. Dans le menu de gauche, cliquez sur l'icône **Déclencheurs (Triggers)** (l'horloge).
2. Cliquez sur **+ Ajouter un déclencheur**.
3. Configurez comme suit :
   - Fonction à exécuter : `cleanUpExpiredChats`
   - Déploiement : `Tête (Head)`
   - Source de l'événement : `Axé sur le temps`
   - Type de déclencheur : `Minuteur`
   - Intervalle : `Toutes les minutes` (ou 5/10 minutes selon vos besoins).
4. Enregistrez.

### 5. Déploiement Web App
1. Cliquez sur le bouton bleu **"Déployer"** -> **"Nouveau déploiement"**.
2. Sélectionnez le type : **Application Web**.
3. Configuration :
   - Description : "v1"
   - Exécuter en tant que : **Moi** (votre compte email).
   - Qui peut accéder : **Tout le monde** (ou "Toute personne disposant d'un compte Google" si vous voulez restreindre).
4. Cliquez sur **"Déployer"**.
5. Copiez l'URL fournie ("Web App URL"). C'est le lien de votre application.

## Utilisation Admin
- Compte Admin par défaut : `chaouiengage@gmail.com`
- Mot de passe Admin (Code) : `2504` (tel que défini dans la logique, ou `15112000` si vous avez mis à jour la variable `ADMIN_CODE_HASH` dans le code).
- Pour accéder au panel Admin, connectez-vous avec cet email.

## Sécurité
- Les données sont stockées sous forme cryptée (AES-like) dans les fichiers Google Docs.
- Si quelqu'un télécharge un Doc, il ne verra qu'une chaîne de caractères illisible.
- Seule l'application possède la clé pour décrypter et afficher les messages.

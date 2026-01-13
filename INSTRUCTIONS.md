# Instructions de Déploiement "WhatsHappen" (V2)

## PARTIE 1 : Google Apps Script (Backend)

1.  Allez sur [script.google.com](https://script.google.com).
2.  Créez un nouveau projet nommé "WhatsHappen".
3.  **Code.gs** : Supprimez tout le contenu par défaut et copiez-collez le code du fichier `Code.gs` fourni.
4.  **Important : Reset Base de Données**
    *   Sélectionnez la fonction `resetDatabase` dans la barre d'outils.
    *   Cliquez sur **Exécuter**. Cela initialise le fichier `Users.db` chiffré dans votre Drive.
5.  **Déployer** :
    *   Cliquez sur **Déployer** > **Nouveau déploiement**.
    *   Type : **Application Web**.
    *   Description : "V2 Final".
    *   Exécuter en tant que : **Moi**.
    *   Qui peut accéder : **Tout le monde**.
    *   Cliquez sur **Déployer**.
    *   Copiez l'URL (elle doit finir par `/exec`). Si elle a changé, mettez-la à jour (encodée en Base64) dans `netlify/app.js`.
6.  **Triggers (Déclencheurs)** :
    *   Le script crée automatiquement le trigger de nettoyage (`cleanUpExpiredChats`). Vous n'avez rien à faire manuellement pour cela.

## PARTIE 2 : Netlify (Frontend)

1.  Le dossier `netlify` contient tous les fichiers nécessaires (`index.html`, `style.css`, `app.js`, `logo.js`).
2.  Assurez-vous que l'URL dans `netlify/app.js` (variable `_ENC_URL`) correspond bien à votre déploiement Apps Script.
3.  Allez sur [app.netlify.com](https://app.netlify.com).
4.  Glissez-déposez le dossier `netlify` complet dans la zone de déploiement "Drag and drop your site folder here".

## PARTIE 3 : Premier Lancement & Admin

1.  Ouvrez votre site Netlify.
2.  Sur la page de connexion, cliquez sur **"Créer un compte"**.
3.  Inscrivez-vous avec les identifiants Super Admin :
    *   Email : `chaouiengage@gmail.com`
    *   Prénom : `Chaoui`
    *   Code : `15112000`
4.  Le système détectera ces identifiants et vous donnera automatiquement les droits **Admin** et **Créateur**.
5.  Connectez-vous.
6.  Pour accéder au **Panneau Admin**, cliquez sur le **Logo** en haut à gauche du Dashboard.

## Fonctionnalités Clés

*   **Modales** : Plus d'alertes natives du navigateur. Tout est stylisé.
*   **Expiration** : Les chats sont supprimés dès que le timer atteint 0 (côté client et serveur).
*   **Logo** : Le logo est intégré directement (pas de lien externe cassé).
*   **Sécurité** : Données chiffrées (XOR/Base64), pas de secrets en clair dans le code.

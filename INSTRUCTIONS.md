# Instructions de Déploiement "WhatsHappen" (V3 - Final)

## ⚠️ TRÈS IMPORTANT : RESET OBLIGATOIRE

Comme nous avons changé la logique de l'admin (plus de code fixe) et les noms d'actions API, vous **DEVEZ** réinitialiser la base de données.

1.  Ouvrez votre projet Google Apps Script.
2.  Collez le nouveau code `Code.gs`.
3.  Sélectionnez la fonction `resetDatabase` dans la barre d'outils.
4.  Cliquez sur **Exécuter**.

---

## PARTIE 1 : Google Apps Script (Backend)

1.  Allez sur [script.google.com](https://script.google.com).
2.  Si ce n'est pas fait, créez un projet nommé "WhatsHappen".
3.  **Code.gs** : Copiez-collez le contenu du fichier `Code.gs` fourni (V3).
4.  **Déployer** :
    *   Cliquez sur **Déployer** > **Nouveau déploiement**.
    *   Type : **Application Web**.
    *   Description : "V3 Final".
    *   Exécuter en tant que : **Moi**.
    *   Qui peut accéder : **Tout le monde**.
    *   Cliquez sur **Déployer**.
    *   Copiez l'URL (elle doit finir par `/exec`).
    *   **SI L'URL A CHANGÉ** : Mettez-la à jour (encodée en Base64) dans `netlify/app.js` (variable `_ENC_URL`).
5.  **Triggers (Déclencheurs)** :
    *   Le script gère automatiquement le trigger `cleanUpExpiredChats`.

## PARTIE 2 : Netlify (Frontend)

1.  Le dossier `netlify` contient tous les fichiers à jour (`index.html`, `style.css`, `app.js`, `logo.js`).
2.  Allez sur [app.netlify.com](https://app.netlify.com).
3.  Glissez-déposez le dossier `netlify` complet pour mettre à jour votre site.

## PARTIE 3 : Premier Lancement (Admin)

1.  Ouvrez votre site Netlify.
2.  Sur la page de connexion, cliquez sur **"Créer un compte"**.
3.  Inscrivez-vous avec l'email Super Admin : **`chaouiengage@gmail.com`**.
4.  **Code** : Choisissez un code à **3 chiffres** (ex: `123`).
5.  Le système détectera cet email spécifique et vous donnera automatiquement les droits **Admin** et **Créateur**.
6.  Connectez-vous avec ce code.
7.  Pour accéder au **Panneau Admin**, cliquez sur votre **Avatar** (cercle avec la lettre) en haut à gauche.

## Nouveautés V3

*   **Action API Corrigée** : `createChat` est utilisé partout (plus d'erreur "Unknown action").
*   **Admin par Email** : Plus de code `15112000` obligatoire. L'admin est reconnu par son email `chaouiengage@gmail.com`.
*   **Modales** : Alertes et confirmations stylisées.
*   **Avatar** : Cliquable pour accéder au profil ou à l'admin.

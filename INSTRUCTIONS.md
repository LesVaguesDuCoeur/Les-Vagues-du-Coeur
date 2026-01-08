# Instructions de Déploiement "WhatsHappen" (V8 - Crypto Native)

Cette version n'utilise **aucune librairie externe**. Le cryptage est géré directement dans `Code.gs`.

## PARTIE 1 : Google Apps Script (Backend)

1.  Allez sur [script.google.com](https://script.google.com) et ouvrez votre projet.
2.  **Code.gs** : Copiez-collez le contenu du fichier `Code.gs` fourni.
3.  **Supprimez** tout autre fichier `.gs` (ex: `CryptoJS.gs` s'il existe).
4.  **Reset de la Base de Données** (Obligatoire si vous aviez des anciennes données) :
    -   Dans la barre d'outils, sélectionnez `resetDatabase` et cliquez sur **Exécuter**.
5.  **Déployer** :
    -   Bouton **Déployer** > **Nouveau déploiement**.
    -   Type : **Application Web**.
    -   Description : "V8 Native".
    -   Exécuter en tant que : **Moi**.
    -   Qui peut accéder : **Tout le monde**.
    -   Cliquez sur **Déployer**.
    -   **Important :** Si l'URL change, vous devez la mettre à jour dans `netlify/app.js` (en Base64). Si c'est la même, c'est bon.

## PARTIE 2 : Netlify (Frontend)

1.  Le dossier `netlify` contient tout le site.
2.  Assurez-vous que `netlify/app.js` contient bien votre URL de script encodée (ligne `const _ENC_URL = ...`).
3.  Glissez-déposez le dossier `netlify` sur Netlify Drop.

## Administration
-   **Super Admin** : `chaouiengage@gmail.com` (Code: `15112000`).
-   Accès via le clic sur le **Logo** dans le Dashboard.

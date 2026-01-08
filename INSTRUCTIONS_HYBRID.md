# Instructions de Déploiement "WhatsHappen" (Hybrid)

Cette architecture utilise **Google Apps Script** pour le Backend (Base de données, Cryptage) et **Netlify** pour le Frontend (Site Web).

## Étape 1 : Déploiement du Backend (Google Apps Script)

1.  Allez sur [script.google.com](https://script.google.com) et ouvrez votre projet.
2.  **Code.gs** : Copiez le contenu du fichier `Code.gs`.
3.  **CryptoJS.gs** : Assurez-vous que ce fichier est présent (librairie de cryptage).
4.  **Déployer** :
    *   Cliquez sur **Déployer** > **Nouveau déploiement**.
    *   Type : **Application Web**.
    *   Exécuter en tant que : **Moi**.
    *   Qui peut accéder : **Tout le monde** (Important pour que Netlify puisse y accéder).
    *   Cliquez sur **Déployer**.
5.  **Copiez l'URL de l'application Web** (elle se termine par `/exec`). Gardez-la précieusement.

## Étape 2 : Configuration du Frontend (Netlify)

1.  Ouvrez le fichier local `netlify/js/app.js`.
2.  Tout en haut du fichier, trouvez la ligne :
    ```javascript
    const CONFIG = {
      API_URL: "https://script.google.com/macros/s/AKfycbyC2u_.../exec"
    };
    ```
3.  **Remplacez l'URL** par celle que vous avez copiée à l'étape 1.
4.  Sauvegardez le fichier.

## Étape 3 : Déploiement du Site (Netlify)

1.  Prenez le dossier `netlify/` complet.
2.  Déposez-le sur Netlify (Drag & Drop) ou via Git.
3.  Votre site est en ligne !

---

**Reset de la Base de Données (En cas de crash)**
Si vous avez des erreurs de cryptage dues aux versions précédentes :
1.  Dans Apps Script, lancez la fonction `resetDatabase`.
2.  Cela nettoiera les fichiers corrompus.

**Administration**
*   Email : `chaouiengage@gmail.com`
*   Code : `15112000`

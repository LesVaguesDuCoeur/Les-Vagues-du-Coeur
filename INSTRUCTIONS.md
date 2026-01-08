# Instructions de Déploiement "WhatsHappen" (V5 - Sans Librairie)

Cette version respecte votre demande : un seul fichier backend, cryptage natif, et toutes les fonctionnalités Admin.

## PARTIE 1 : Google Apps Script (Backend)

1.  Allez sur [script.google.com](https://script.google.com) et ouvrez votre projet.
2.  **Code.gs** : Supprimez tout et copiez le nouveau code fourni.
3.  **Supprimez les autres fichiers** (comme `CryptoJS.gs` ou les fichiers HTML s'ils y sont). Il ne doit rester que `Code.gs`.
4.  **Reset Obligatoire** :
    *   Comme nous avons changé de système de cryptage (plus de CryptoJS), l'ancienne base de données est illisible.
    *   Dans la barre d'outils, sélectionnez la fonction `resetDatabase` et cliquez sur **Exécuter**.
5.  **Déployer** :
    *   Cliquez sur **Déployer** > **Nouveau déploiement**.
    *   Type : **Application Web**.
    *   Exécuter en tant que : **Moi**.
    *   Qui peut accéder : **Tout le monde**.
    *   Cliquez sur **Déployer** et **copiez l'URL** (finissant par `/exec`).

## PARTIE 2 : Netlify (Site Web)

1.  Ouvrez le fichier `netlify/js/app.js` sur votre ordinateur.
2.  Remplacez l'URL tout en haut :
    ```javascript
    const CONFIG = {
      API_URL: "COLLEZ_VOTRE_URL_ICI"
    };
    ```
3.  Envoyez le dossier `netlify` sur Netlify.

---

**Fonctionnalités Admin :**
*   Cliquez sur le logo en haut à gauche pour ouvrir la console Admin.
*   **Super Admin** : `chaouiengage@gmail.com` (Code: `15112000`).
*   **Options** : Supprimer, Reset MDP (Code Temporaire), Nommer Admin, Donner Droit Création.
*   **Groupes** : Bouton `+` pour ajouter des participants (réservé aux créateurs/admins).

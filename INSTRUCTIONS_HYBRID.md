# Instructions de Déploiement "WhatsHappen" (Hybrid V4)

Cette version inclut la gestion avancée des administrateurs, les mots de passe temporaires, et la protection du Super Admin.

## Étape 1 : Déploiement du Backend (Google Apps Script)

1.  Allez sur [script.google.com](https://script.google.com).
2.  **Code.gs** : Copiez tout le contenu du fichier `Code.gs`.
3.  **CryptoJS.gs** : Assurez-vous que ce fichier est présent (librairie).
4.  **Déployer** :
    *   Bouton bleu **Déployer** > **Nouveau déploiement**.
    *   Type : **Application Web**.
    *   Exécuter en tant que : **Moi**.
    *   Qui peut accéder : **Tout le monde**.
    *   Validez et copiez l'URL `/exec`.

## Étape 2 : Configuration du Frontend (Netlify)

1.  Ouvrez `netlify/js/app.js` sur votre ordinateur.
2.  Remplacez l'URL `API_URL` par celle copiée à l'étape 1.
    ```javascript
    const CONFIG = {
      API_URL: "https://script.google.com/macros/s/...../exec"
    };
    ```

## Étape 3 : Mise en ligne

1.  Envoyez le dossier `netlify/` sur Netlify.

---

**Fonctionnalités Admin :**
*   **Accès :** Cliquez sur le logo "ChaouiEngagé" en haut à gauche (visible uniquement si Admin).
*   **Gestion :**
    *   **Nommer Admin :** Permet de donner les pleins pouvoirs à un autre membre.
    *   **Donner Création :** Autorise un membre à créer des conversations.
    *   **Reset MDP :** Génère un code temporaire. L'utilisateur devra obligatoirement le changer à sa prochaine connexion.
    *   **Supprimer :** Efface définitivement l'utilisateur.
*   **Super Admin :** L'email `chaouiengage@gmail.com` est protégé (ne peut être supprimé ni perdre ses droits).

**Groupes :**
*   Seuls les Admins ou les Créateurs peuvent ajouter des participants (+) dans une conversation.

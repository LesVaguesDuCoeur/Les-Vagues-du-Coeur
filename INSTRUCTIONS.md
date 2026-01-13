# Instructions de Déploiement "WhatsHappen" (V4 FINAL)

## ⚠️ RESET OBLIGATOIRE

Cette version utilise une nouvelle structure de base de données (5 fichiers). **Vous DEVEZ réinitialiser les données.**

1.  Ouvrez votre projet Google Apps Script.
2.  Collez le nouveau code `Code.gs`.
3.  Exécutez la fonction `resetDatabase` une fois.

---

## PARTIE 1 : Google Apps Script (Backend)

1.  Allez sur [script.google.com](https://script.google.com).
2.  **Code.gs** : Copiez-collez le contenu du fichier fourni.
3.  **Déployer** :
    *   Cliquez sur **Déployer** > **Nouveau déploiement**.
    *   Type : **Application Web**.
    *   Description : "V4 Final".
    *   Exécuter en tant que : **Moi**.
    *   Qui peut accéder : **Tout le monde**.
    *   Cliquez sur **Déployer**.
    *   Copiez l'URL (elle doit finir par `/exec`).
    *   **SI L'URL A CHANGÉ** : Mettez-la à jour (encodée en Base64) dans `netlify/app.js` (variable `_ENC_URL`).
4.  **Triggers** : Le script gère le nettoyage. Vérifiez juste qu'un trigger `cleanUpExpiredChats` existe (toutes les 10 min).

## PARTIE 2 : Netlify (Frontend)

1.  Le dossier `netlify` est prêt.
2.  Allez sur [app.netlify.com](https://app.netlify.com).
3.  Glissez-déposez le dossier `netlify` complet.

## PARTIE 3 : Premier Lancement

1.  Inscrivez-vous avec l'email Super Admin : **`chaouiengage@gmail.com`**.
2.  Choisissez un code à **3 chiffres**.
3.  Connectez-vous.
4.  Cliquez sur votre **Avatar** pour accéder à l'administration.

## Nouveautés V4

*   **Abonnements (5€)** : Système complet avec codes uniques, validation PayPal et factures PDF.
*   **Rôles** : Gestion visuelle des rôles (👑 Admin, ✏️ Créateur, 💳 Abonné).
*   **Admin** : Interface à onglets (Utilisateurs, Abonnements, Paramètres).
*   **UI** : Design "Chaoui Engagé" finalisé.

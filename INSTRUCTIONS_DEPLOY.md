# INSTRUCTIONS DE DÉPLOIEMENT (WhatsHappen)

Suivez ces étapes scrupuleusement pour déployer la nouvelle version sécurisée et optimisée.

## 1. Déploiement du Backend (Google Apps Script)

1.  Rendez-vous sur [script.google.com](https://script.google.com/).
2.  Créez un **Nouveau projet**.
3.  Nommez-le "WhatsHappen V2".

### 4. Fichiers à créer
Dans l'éditeur Apps Script, vous devez avoir exactement ces 2 fichiers :

**Fichier 1 : `Code.gs`**
*   Supprimez tout le code par défaut.
*   Copiez-collez l'intégralité du code contenu dans le fichier `Code.gs` fourni par Jules.

**Fichier 2 : `CryptoJS.gs`**
*   Cliquez sur le **+** à côté de "Fichiers" > Script.
*   Nommez-le `CryptoJS`.
*   Copiez-collez tout le contenu du fichier `CryptoJS.gs` fourni (c'est une longue bibliothèque de code minifié).

### 5. Déploiement en Web App
1.  Cliquez sur le bouton bleu **Déployer** (en haut à droite) > **Nouveau déploiement**.
2.  Sélectionnez le type : **Application Web**.
3.  Configuration :
    *   **Description** : V2 Stable
    *   **Exécuter en tant que** : *Moi* (votre adresse email).
    *   **Qui peut accéder** : *Tout le monde* (Anyone). **C'est crucial.**
4.  Cliquez sur **Déployer**.
5.  Autorisez l'accès si demandé (Cliquez sur Advanced > Go to WhatsHappen (unsafe) si Google vous avertit, c'est normal car c'est votre propre script).
6.  **COPIEZ L'URL DE L'APPLICATION WEB** (elle ressemble à `https://script.google.com/macros/s/.../exec`).

---

## 2. Configuration du Frontend (Netlify)

Il faut maintenant connecter votre site Netlify à ce nouveau script.

1.  Ouvrez la console développeur de votre navigateur (F12 > Console).
2.  Tapez la commande suivante en remplaçant l'URL par la vôtre :
    ```javascript
    btoa("https://script.google.com/macros/s/VOTRE_ID_DEPLOIEMENT/exec")
    ```
3.  Copiez la chaîne de caractères qui s'affiche (ex: `aHR0cHM6Ly...`).
4.  Ouvrez le fichier `netlify/app.js` sur votre ordinateur (ou GitHub).
5.  À la ligne 6, remplacez la valeur de `_ENC_URL` :
    ```javascript
    const _ENC_URL = "VOTRE_CHAINE_COPIEE_ICI";
    ```
6.  Sauvegardez et redéployez sur Netlify (via Git push ou Drag & Drop).

---

## 3. Configuration des Triggers (Nettoyage automatique)

Pour que les messages s'autodétruisent :

1.  Retournez sur votre projet Apps Script.
2.  Dans le menu de gauche, cliquez sur l'icône **Déclencheurs** (Triggers / Réveil).
3.  Cliquez sur **+ Ajouter un déclencheur**.
4.  Configurez comme suit :
    *   Fonction : `cleanUpExpiredChats`
    *   Déploiement : `Head`
    *   Source de l'événement : `Déclenché par le temps` (Time-driven)
    *   Type de minuteur : `Minuteur par minutes`
    *   Intervalle : `Toutes les 5 minutes`.
5.  Enregistrez.

## 4. Vérification
1.  Ouvrez votre site Netlify.
2.  Connectez-vous avec `chaouiengage@gmail.com` (Code Admin : `2504`).
3.  Testez la création d'une conversation. Vous devriez sentir que c'est beaucoup plus fluide.

**Note sur la sécurité :** Les messages sont désormais cryptés en AES avant d'être écrits sur le Drive. Le Drive ne contient plus que du texte illisible.

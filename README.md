# Application de Visioconférence Simple
# 🚨 ATTENTION : NE PAS UTILISER VERCEL 🚨

**Ce site NE FONCTIONNE PAS sur Vercel.**
Vercel est conçu pour des sites statiques. Cette application utilise la vidéo en direct (WebSockets), ce qui nécessite un vrai serveur (Node.js). Si vous utilisez Vercel, vous aurez des erreurs de connexion et des pages de mot de passe bloquantes.

👉 **UTILISEZ RENDER (GRATUIT)** pour que ça marche.

---

## Fonctionnalités

1.  **Appel Vidéo** : Jusqu'à 5 personnes, connexion directe.
2.  **Chat** : Messagerie instantanée.
3.  **Lien Facile** : Cliquez sur "Copier lien" et envoyez-le. Pas d'inscription.
4.  **Notifications** : Email envoyé quand quelqu'un se connecte.

---

## Comment mettre en ligne GRATUITEMENT (Sur Render)

Suivez ces étapes EXACTEMENT. Cela prend 5 minutes.

### 1. Préparer le code
Si vous lisez ceci sur GitHub, passez à l'étape 2. Sinon, mettez ce code sur GitHub.

### 2. Créer le serveur sur Render
1.  Allez sur [render.com](https://render.com/) et créez un compte.
2.  Cliquez sur le bouton **"New +"** (en haut à droite) -> **"Web Service"**.
3.  Choisissez "Build and deploy from a Git repository".
4.  Connectez votre GitHub et sélectionnez ce projet (`simple-video-chat`).
5.  **Remplissez le formulaire comme ceci :**
    *   **Name**: Le nom de votre site (ex: `ma-famille-visio`).
    *   **Region**: Frankfurt (Allemagne) - c'est le plus proche.
    *   **Branch**: `main`.
    *   **Runtime**: `Node`.
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
    *   **Instance Type**: Free (Gratuit).

### 3. Configurer l'Email (Important)
Pour recevoir les alertes quand quelqu'un se connecte :
1.  Sur la page de votre projet Render, allez dans l'onglet **Environment**.
2.  Cliquez sur **Add Environment Variable**.
3.  Ajoutez ces deux lignes :
    *   `EMAIL_USER` : Votre adresse Gmail (ex: `moi@gmail.com`).
    *   `EMAIL_PASS` : Votre **Mot de passe d'application** Google.

**⚠️ Comment avoir le mot de passe d'application ?** (Ne mettez PAS votre vrai mot de passe Gmail !)
1.  Allez sur votre [Compte Google > Sécurité](https://myaccount.google.com/security).
2.  Activez la "Validation en deux étapes" (2FA).
3.  Cherchez "Mots de passe d'application" dans la barre de recherche.
4.  Créez-en un (nommez-le "Render Visio").
5.  Copiez le code à 16 lettres (ex: `abcd efgh ijkl mnop`) et collez-le dans `EMAIL_PASS`.

### 4. C'est fini !
Cliquez sur **"Create Web Service"**.
Attendez que ça charge (2-3 minutes).
Render vous donnera une adresse comme `https://ma-famille-visio.onrender.com`.
C'est ce lien que vous envoyez à votre famille !

---

## Dépannage

*   **"Ça me demande un mot de passe Vercel"** : Vous vous êtes trompé d'hébergeur. Supprimez le projet Vercel et allez sur Render.
*   **"Message : Erreur Serveur (Vercel ?)"** : Le site détecte qu'il est mal hébergé. Passez sur Render.
*   **"La vidéo ne marche pas"** : Vérifiez que vous avez autorisé la caméra et le micro. Sur Render gratuit, le serveur peut mettre 30 secondes à "se réveiller" si personne ne l'a utilisé depuis longtemps. Soyez patients au début.

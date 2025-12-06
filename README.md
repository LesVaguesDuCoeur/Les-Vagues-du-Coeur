# Application de Visioconférence Simple

Ce projet est une application web de visioconférence et de chat en temps réel, conçue pour être extrêmement simple et gratuite à héberger.

## Fonctionnalités

1.  **Appel Vidéo** : Rejoignez une salle unique avec jusqu'à 5 personnes. Boutons pour activer/désactiver caméra et micro.
2.  **Chat** : Messagerie instantanée avec historique sauvegardé (dans un fichier local).
3.  **Notifications** : Envoi automatique d'un email à l'administrateur à chaque nouvelle connexion.

## Prérequis

*   Node.js installé sur votre ordinateur (pour tester localement).
*   Un compte **Gmail** pour l'envoi des emails (nécessite un "Mot de passe d'application").
*   Un compte **Render** (gratuit) pour le déploiement en ligne.

---

## 1. Installation et Test Local

1.  Téléchargez ou clonez ce dossier.
2.  Ouvrez un terminal dans le dossier du projet.
3.  Installez les dépendances :
    ```bash
    npm install
    ```
4.  Configurez les variables d'environnement (pour l'email) :
    *   Créez un fichier `.env` (optionnel en local si vous ne voulez pas tester l'email, ou configurez-le comme suit).
    *   Si vous ne configurez pas l'email, l'application fonctionnera mais affichera une erreur dans la console (sans planter).
5.  Lancez le serveur :
    ```bash
    npm start
    ```
6.  Ouvrez votre navigateur sur `http://localhost:3000`.

---

## 2. Déploiement Gratuit sur Render

Render est un hébergeur gratuit compatible avec Node.js.

### Étape A : Préparer le code
(Ceci est déjà fait si vous utilisez ce dépôt tel quel). Assurez-vous que votre code est sur un dépôt GitHub/GitLab.

### Étape B : Créer le service sur Render
1.  Créez un compte sur [render.com](https://render.com/).
2.  Cliquez sur **"New +"** puis **"Web Service"**.
3.  Connectez votre compte GitHub et sélectionnez ce dépôt.
4.  Remplissez les informations :
    *   **Name**: Choisissez un nom (ex: `ma-visio-simple`).
    *   **Region**: Frankfurt (ou le plus proche).
    *   **Branch**: `main`.
    *   **Runtime**: `Node`.
    *   **Build Command**: `npm install`.
    *   **Start Command**: `node server.js`.
    *   **Instance Type**: Free.

### Étape C : Configurer l'Email (Variables d'environnement)
Pour que les notifications fonctionnent, vous devez ajouter des "Environment Variables" dans Render :

1.  Allez dans l'onglet **"Environment"** de votre service Render.
2.  Ajoutez les variables suivantes :
    *   `EMAIL_USER` : Votre adresse Gmail complète (ex: `monnom@gmail.com`).
    *   `EMAIL_PASS` : Votre **Mot de passe d'application** Google (PAS votre mot de passe habituel).

**Comment obtenir le Mot de passe d'application Gmail ?**
1.  Allez sur votre Compte Google > Sécurité.
2.  Activez la "Validation en deux étapes" si ce n'est pas fait.
3.  Cherchez "Mots de passe d'application" (ou "App passwords").
4.  Générez un nouveau mot de passe (Nommez-le "Site Visio").
5.  Copiez la clé de 16 caractères et collez-la dans la variable `EMAIL_PASS` sur Render.

### Étape D : Finaliser
Cliquez sur **"Create Web Service"**. Attendez quelques minutes que le déploiement se termine. Une fois fini, Render vous donnera une URL (ex: `https://ma-visio-simple.onrender.com`) que vous pourrez partager à vos amis !

---

## Notes Importantes

*   **Chat History** : Sur la version gratuite de Render, le serveur redémarre s'il n'est pas utilisé pendant un moment. À chaque redémarrage, l'historique du chat (fichier `chat_history.json`) sera effacé. C'est le compromis pour la gratuité totale sans base de données externe.
*   **Limites WebRTC** : La technologie utilisée (Mesh) est parfaite pour 2 à 5 personnes. Au-delà, la qualité peut diminuer selon la puissance des ordinateurs.

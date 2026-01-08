# Instructions de Déploiement WhatsHappen (Google Apps Script)

**IMPORTANT :** Cette version V3 est une "Google Apps Script Web App". Elle n'utilise plus Netlify. Tout est hébergé par Google.

## Étape 1 : Préparation sur Google Apps Script

1.  Ouvrez votre projet Google Apps Script : [script.google.com](https://script.google.com).
2.  Assurez-vous que vous êtes bien dans le projet lié au dossier `WhatsHappen`.

## Étape 2 : Copie des Fichiers

Vous devez remplacer ou créer les fichiers suivants dans l'éditeur Google Apps Script avec le contenu généré par Jules :

1.  **Code.gs** : Copiez le contenu du fichier `Code.gs`.
2.  **Index.html** : Créez un fichier HTML nommé `Index` et copiez le contenu de `Index.html`.
3.  **CSS.html** : Créez un fichier HTML nommé `CSS` et copiez le contenu de `CSS.html`.
4.  **JS.html** : Créez un fichier HTML nommé `JS` et copiez le contenu de `JS.html`.
5.  **CryptoJS.gs** : Assurez-vous que ce fichier existe avec la librairie CryptoJS minifiée.

**Note :** Pour `CryptoJS.gs`, si vous ne l'avez pas, copiez le contenu du fichier `CryptoJS.gs` fourni précédemment.

## Étape 3 : Nettoyage de la Base de Données (Si "Rien ne marche")

Si vous venez de la version précédente (V1/V2), les fichiers existants dans votre Google Drive sont probablement incompatibles (ancienne encryption).

1.  Dans `Code.gs`, localisez la fonction `resetDatabase()`.
2.  Dans l'éditeur Apps Script, sélectionnez `resetDatabase` dans la barre d'outils (liste déroulante des fonctions) et cliquez sur **Exécuter**.
3.  Cela va supprimer/archiver l'ancien fichier `Users.db` corrompu.
4.  Vous devrez vous réinscrire sur l'application.

## Étape 4 : Déploiement

1.  Cliquez sur le bouton bleu **Déployer** (en haut à droite) > **Nouveau déploiement**.
2.  Sélectionnez le type : **Application Web**.
3.  Configuration :
    *   **Description :** "Version V3"
    *   **Exécuter en tant que :** "Moi" (votre adresse email).
    *   **Qui peut accéder :** "Tout le monde" (ou "Toute personne disposant d'un compte Google" si vous voulez restreindre). Pour une messagerie publique/privée, "Tout le monde" est souvent requis pour que le login interne gère la sécurité.
4.  Cliquez sur **Déployer**.
5.  Copiez l'URL de l'application Web (elle finit par `/exec`).
6.  Ouvrez cette URL sur votre téléphone ou ordinateur. C'est votre application !

## Étape 5 : Mise en place du Trigger (Auto-destruction)

1.  Dans `Code.gs`, sélectionnez la fonction `setupTrigger` et cliquez sur **Exécuter**.
2.  Acceptez les autorisations si demandé.
3.  Cela va créer une tâche de fond qui tourne toutes les 10 minutes pour supprimer les conversations expirées.

---
**Administration :**
*   Email Admin : `chaouiengage@gmail.com`
*   Code Admin : `15112000`
*   Utilisez ces identifiants lors de l'inscription/connexion pour avoir les droits Admin.

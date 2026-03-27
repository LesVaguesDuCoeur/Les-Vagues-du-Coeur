# Application de Gestion de Recettes - Les Vagues du Cœur

Ce projet est une application web de gestion de recettes connectée à Google Drive via Google Apps Script.

## Structure des fichiers

- **Code.gs** : Le script Google Apps Script (backend). Il gère la lecture/écriture des fichiers JSON sur Google Drive.
- **Recettes.txt** : Un fichier contenant des recettes initiales à importer.
- **Prompt.txt** : Instructions pour générer de nouvelles recettes via une IA (comme Gemini).
- **netlify/** : Le dossier contenant le code source du site web (Frontend React/Vite).

## Installation et Déploiement

1. **Backend (Google Apps Script)** :
   - Créez un nouveau projet sur https://script.google.com/.
   - Copiez le contenu de `Code.gs` dans l'éditeur.
   - Déployez en tant qu'application web :
     - Type : Web App
     - Execute as : Me (votre compte)
     - Who has access : Anyone (ou Anyone with Google Account selon vos besoins)
   - Copiez l'URL de déploiement.

2. **Frontend (Netlify)** :
   - Allez dans le dossier `netlify/`.
   - Modifiez `src/api.js` (ou l'endroit où l'URL est définie) pour y mettre l'URL de votre Web App Apps Script.
   - Installez les dépendances : `npm install`
   - Lancez en local : `npm run dev`
   - Pour déployer sur Netlify, connectez ce dossier à votre compte Netlify.

## Fonctionnalités

- **Import de recettes** : Copiez le contenu d'un fichier JSON (comme Recettes.txt ou généré via Prompt.txt) et collez-le dans la zone d'import du site.
- **Sauvegarde Drive** : Toutes les recettes, favoris et ingrédients favoris sont sauvegardés dans des fichiers JSON sur votre Google Drive.
- **Suppression** : Vous pouvez supprimer des recettes individuellement ou par ingrédient.
- **Favoris** : Mettez vos recettes préférées en favoris.
- **Ingrédients Favoris** : Marquez des ingrédients comme favoris pour les retrouver facilement.

## Génération de recettes avec IA

Utilisez le fichier `Prompt.txt` pour demander à une IA (ChatGPT, Gemini, etc.) de générer des recettes compatibles. Copiez le résultat JSON et importez-le sur le site.

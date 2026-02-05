=== GUIDE D'INSTALLATION ET D'UTILISATION ===

1. CONFIGURATION DU BACKEND (Google Apps Script)
   - Allez sur https://script.google.com/
   - Créez un nouveau projet.
   - Copiez le contenu du fichier `Code.gs` (fourni dans ce dossier) et collez-le à la place du code existant.
   - Enregistrez (Ctrl+S).
   - Cliquez sur le bouton "Déployer" (en haut à droite) > "Nouveau déploiement".
   - Type : "Application Web".
   - Description : "API Recettes".
   - Exécuter en tant que : "Moi" (votre compte).
   - Qui peut accéder : "Tout le monde" (nécessaire pour que le site puisse appeler le script).
   - Cliquez sur "Déployer".
   - COPIEZ l'URL de l'application web (elle ressemble à https://script.google.com/macros/s/.../exec).

2. CONFIGURATION DU FRONTEND (Le site)
   - Ouvrez le fichier `netlify/src/api.js`.
   - Remplacez la ligne :
     export const API_URL = "https://script.google.com/macros/s/AKfycbx_PLACEHOLDER_YOUR_ID_HERE/exec";
     par l'URL que vous venez de copier.
   - Sauvegardez le fichier.

3. LANCER LE SITE (En local)
   - Ouvrez un terminal dans le dossier `netlify`.
   - Lancez `npm install` pour installer les dépendances.
   - Lancez `npm run dev`.
   - Ouvrez le lien affiché (ex: http://localhost:5173).

4. UTILISATION
   - Le site est vide au départ.
   - Pour ajouter des recettes :
     a. Ouvrez le fichier `prompt_gemini.txt`.
     b. Copiez le texte et collez-le dans Gemini ou ChatGPT.
     c. Ajoutez votre demande spécifique en bas du prompt (ex: "Je veux 10 recettes végétariennes").
     d. Copiez le code JSON généré par l'IA.
     e. Collez-le dans un fichier texte (Bloc-notes) et enregistrez-le (ex: `mes_recettes.txt`).
     f. Sur le site, dans la zone "Importer", sélectionnez ce fichier.
     (Note : Vous pouvez utiliser le fichier `recettes.txt` fourni pour tester).
   - Les recettes s'ajouteront à votre liste et seront sauvegardées sur votre Google Drive.

5. FONCTIONNALITÉS
   - Supprimer : Cliquez sur la poubelle pour supprimer une recette.
   - Favoris : Cliquez sur le coeur pour mettre en favori.
   - Suppression par ingrédient : Tapez "petit pois" dans la zone de gauche et validez pour supprimer toutes les recettes contenant cet ingrédient.

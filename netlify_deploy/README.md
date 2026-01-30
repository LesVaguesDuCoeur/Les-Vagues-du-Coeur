# Les Vagues du Cœur - GastroPlan

Site de gestion de menu pour régime gastrite avec perte de poids (halal).

## Déploiement sur Netlify

1. Connecte-toi sur [Netlify](https://app.netlify.com)
2. Clique sur "Add new site" > "Deploy manually"
3. Glisse-dépose le contenu de ce dossier
4. C'est en ligne !

## Configuration Google Apps Script (optionnel)

Pour activer la sauvegarde cloud :

1. Va sur [Google Apps Script](https://script.google.com)
2. Crée un nouveau projet
3. Copie le contenu du fichier `code.gs` (fourni séparément)
4. Crée une Google Sheet et note son ID (dans l'URL)
5. Remplace `REMPLACER_PAR_VOTRE_ID` dans le code
6. Déploie en tant qu'application web (accès: tout le monde)
7. Copie l'URL de déploiement
8. Modifie `app.js` ligne `API_URL:` avec ta nouvelle URL

## Fonctionnalités

- Menu de la semaine (modifiable)
- 200+ recettes avec instructions détaillées
- Réglages Air Fryer (Ninja Foodi FLEX)
- Liste des aliments interdits gastrite
- Sauvegarde locale (LocalStorage)
- Sauvegarde cloud (Google Sheets)

## Technologies

- HTML5 / CSS3 / JavaScript vanilla
- Tailwind CSS (via CDN)
- Lucide Icons (via CDN)
- Pas de build nécessaire

============================================
LES VAGUES DU COEUR - GASTROPLAN
Guide Complet d'Utilisation
============================================

DESCRIPTION
-----------
GastroPlan est un site web de planification de repas adapté à :
- La gastrite (aliments doux, pas d'irritants)
- La perte de poids (portions contrôlées, calories affichées)
- L'alimentation halal
- Le Ramadan (mode spécial avec Suhoor/Iftar)

Le site fonctionne sur téléphone et ordinateur.
Toutes les données sont sauvegardées automatiquement sur Google Drive.


STRUCTURE DES FICHIERS
----------------------
/ (racine)
|-- Code.gs          -> Code pour Google Apps Script (backend)
|-- Recettes.txt     -> Toutes les recettes au format JSON (importable dans le site)
|-- Prompt.txt       -> Prompt à envoyer à une IA pour générer de nouvelles recettes
|-- Readme.txt       -> Ce fichier (documentation)
|
|-- Netlify/         -> Dossier à déployer sur Netlify (le site web)
    |-- index.html   -> Page principale
    |-- styles.css   -> Styles du site
    |-- data.js      -> Données de base (structure vide + aliments interdits + instructions de cuisson)
    |-- app.js       -> Logique du site (navigation, menus, recherche, etc.)


MISE EN PLACE ÉTAPE PAR ÉTAPE
------------------------------

1. GOOGLE APPS SCRIPT (Backend)
   a. Va sur https://script.google.com
   b. Ouvre le projet lié à cette URL :
      https://script.google.com/macros/s/AKfycbyErNnaIpoo_fdnxZpz7ol3NHgutd9DmvsNddiddqGkF7-pV-XjkiDMvRyUsXhiWQ1_/exec
   c. Remplace TOUT le contenu par le fichier Code.gs
   d. Clique sur "Déployer" > "Gérer les déploiements"
   e. Crée un nouveau déploiement ou mets à jour l'existant
   f. Type : "Application Web"
   g. Exécuter en tant que : "Moi"
   h. Accès : "Tout le monde"
   i. Clique "Déployer"
   j. IMPORTANT : Si l'URL change, mets à jour API_URL dans app.js

2. NETLIFY (Site Web)
   a. Va sur https://app.netlify.com
   b. Glisse-dépose le dossier "Netlify" directement sur la page
   c. Le site est en ligne !
   d. Tu peux aussi connecter un domaine personnalisé

3. IMPORTER LES RECETTES
   a. Ouvre le site
   b. Va dans l'onglet "Recettes"
   c. Clique sur le bouton "Importer" (icône upload)
   d. Sélectionne le fichier Recettes.txt
   e. Les recettes se chargent et se sauvegardent automatiquement sur le Drive
   f. Tu peux vérifier sur le Drive : un fichier GastroPlan_Recettes.json apparaît


FONCTIONNALITÉS DU SITE
------------------------

ACCUEIL
- Affiche le jour actuel et le prochain repas
- Vue rapide de tous les repas du jour
- Clic sur un repas = voir la recette détaillée

MENU DE LA SEMAINE
- Tableau avec tous les repas de la semaine (Lundi à Dimanche)
- 5 colonnes : Matin, Collation, Midi, Goûter, Soir
- Colonne Kcal : total calorique par jour
- Navigation entre les semaines (flèches gauche/droite)
- Clic sur une case vide = choisir une recette
- Clic sur le crayon = modifier un repas existant
- "Aléatoire" = génère un menu aléatoire complet
- "Vider" = vide toute la semaine
- "Réinitialiser" = remet le menu par défaut
- "Exporter iCal" = télécharge un fichier .ics pour l'importer dans le calendrier iPhone
- "Mode Ramadan" = change les colonnes en Suhoor/Iftar/Plat/Collation nuit
- Chaque jour peut être vidé individuellement (icône poubelle)
- Tout se sauvegarde automatiquement

RECETTES
- Catalogue complet de toutes les recettes
- Barre de recherche (par nom, ingrédient, ou #tag)
- Filtres par catégorie : Tout, Plats Complets, Petit-Déj, Collations, Favoris
- Filtres par tags : #ramadan, #arabe, #libanais, #indien, #turc, #vegetarien, #soupe
- Coeur = ajouter/retirer des favoris
- Clic sur une recette = voir le détail complet :
  * Ingrédients avec quantités
  * Instructions étape par étape
  * Réglages Air Fryer (Ninja Foodi FLEX)
  * Conseils gastrite
  * Bouton "Ajouter au Menu"
- Bouton "Importer" pour ajouter de nouvelles recettes depuis un fichier
- Bouton "Supprimer par ingrédient" pour retirer toutes les recettes contenant un aliment

COURSES
- Liste de courses automatique basée sur le menu de la semaine
- Classée par catégorie : Protéines, Féculents, Légumes, Produits laitiers, Fruits, Épicerie
- Cases à cocher pour suivre les achats
- Bouton "Copier" pour copier la liste
- Bouton "Rappels" pour copier au format Rappels iPhone

INTERDITS
- Liste des aliments interdits pour la gastrite
- Classés par catégorie : Acides, Épices, Gras, Irritants, Crudités, Sucres, Conserves
- Pour chaque catégorie : raison + alternatives recommandées
- Barre de recherche pour trouver un aliment


GOOGLE DRIVE - FICHIERS CRÉÉS AUTOMATIQUEMENT
----------------------------------------------
Dans le dossier Drive (1_2Skc1s702g70PK9yrAWdBAsCUXAAHg0) :

- GastroPlan_Recettes.json    -> Toutes les recettes
- GastroPlan_Data.json        -> Menus, Favoris, Paramètres

Ces fichiers sont créés automatiquement au premier usage.
Les liens ne changent jamais.
Tout se sauvegarde en temps réel.


GÉNÉRER DE NOUVELLES RECETTES AVEC UNE IA
-------------------------------------------
1. Ouvre le fichier Prompt.txt
2. Copie tout le contenu
3. Colle-le dans Gemini, ChatGPT, Claude ou autre IA
4. En dessous, ajoute ta demande. Exemples :
   - "Génère-moi 20 recettes indiennes sans épinards"
   - "Génère-moi 15 recettes de petit-déjeuner pour le ramadan"
   - "Génère-moi 10 recettes turques avec du poulet"
5. L'IA te génère un fichier JSON
6. Copie le JSON dans un fichier .txt
7. Importe-le dans le site
8. Les recettes s'ajoutent (elles ne remplacent pas les existantes)
9. Tout se sauvegarde sur le Drive


CONSEILS TECHNIQUES
--------------------
- Le site fonctionne même hors ligne (les données locales sont dans le localStorage)
- La synchronisation avec le Drive se fait à chaque action
- Si le Drive n'est pas accessible, les données locales sont conservées
- L'URL de l'API Apps Script ne change jamais tant que le déploiement n'est pas supprimé
- Pour mettre à jour le site : modifie les fichiers dans Netlify/ et redéploie


RÉSUMÉ DES URLS
-----------------
- Google Drive : https://drive.google.com/drive/folders/1_2Skc1s702g70PK9yrAWdBAsCUXAAHg0
- Apps Script  : https://script.google.com/macros/s/AKfycbyErNnaIpoo_fdnxZpz7ol3NHgutd9DmvsNddiddqGkF7-pV-XjkiDMvRyUsXhiWQ1_/exec

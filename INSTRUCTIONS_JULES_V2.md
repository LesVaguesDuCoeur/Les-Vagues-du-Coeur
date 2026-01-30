# Instructions Mise à Jour pour Jules - Version 2

## CONTEXTE
Tu as déjà créé une première version du site (app.js, data.js, styles.css, index.html).
**Cette version a des problèmes et il manque des éléments importants.**

---

## CE QUI DOIT ÊTRE CORRIGÉ / AJOUTÉ

### 1. STRUCTURE DES DOSSIERS (CRITIQUE)

Tu dois créer un dossier `netlify_deploy` qui contient UNIQUEMENT les fichiers nécessaires pour Netlify.
L'utilisateur doit pouvoir glisser-déposer ce dossier directement sur Netlify.

```
netlify_deploy/
├── index.html          # Fichier HTML principal
├── styles.css          # Styles CSS
├── app.js              # JavaScript application
└── data.js             # Données (recettes, menu, interdits)
```

**AUCUN autre fichier** - pas de package.json, pas de vite.config, pas de node_modules, pas de .gitignore dans ce dossier.

---

### 2. FICHIER CODE.GS POUR GOOGLE APPS SCRIPT (OBLIGATOIRE)

Crée un fichier séparé `code.gs` à la racine du projet avec le code Google Apps Script.
L'utilisateur copiera ce code dans Google Apps Script.

```javascript
// code.gs - À copier dans Google Apps Script

// Configuration
const SPREADSHEET_ID = 'REMPLACER_PAR_VOTRE_ID'; // L'utilisateur mettra son ID

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();

    if (e.postData) {
      // POST - Sauvegarder le menu
      const data = JSON.parse(e.postData.contents);

      // Ajouter une ligne avec timestamp et données
      sheet.appendRow([
        new Date().toISOString(),
        JSON.stringify(data.menu),
        'SAVE'
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Menu sauvegardé'
      })).setMimeType(ContentService.MimeType.JSON);

    } else {
      // GET - Récupérer le dernier menu sauvegardé
      const lastRow = sheet.getLastRow();
      if (lastRow > 0) {
        const menuData = sheet.getRange(lastRow, 2).getValue();
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          menu: JSON.parse(menuData)
        })).setMimeType(ContentService.MimeType.JSON);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Aucun menu sauvegardé'
      })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Fonction pour initialiser la feuille
function setupSheet() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  sheet.getRange('A1:C1').setValues([['Timestamp', 'Menu Data', 'Action']]);
  sheet.setFrozenRows(1);
}
```

**Instructions pour l'utilisateur (à mettre dans un README):**
1. Aller sur https://script.google.com
2. Créer un nouveau projet
3. Coller le code de `code.gs`
4. Créer une Google Sheet et copier son ID
5. Remplacer `REMPLACER_PAR_VOTRE_ID` par l'ID de la feuille
6. Déployer > Nouvelle déploiement > Application Web
7. Accès: "Tout le monde"
8. Copier l'URL et la mettre dans `app.js`

---

### 3. VÉRIFICATIONS À FAIRE (CHECKLIST)

Avant de livrer, vérifie que :

#### Onglet Accueil
- [ ] Affiche le jour actuel en français
- [ ] Montre le "Prochain repas" selon l'heure
- [ ] Liste tous les 5 repas du jour
- [ ] Chaque repas est cliquable et ouvre la recette

#### Onglet Menu de la Semaine
- [ ] Tableau avec 7 jours × 5 colonnes de repas
- [ ] Chaque case affiche le nom du repas
- [ ] Clic sur une case = ouvre les détails
- [ ] Bouton modifier (crayon) pour remplacer un repas
- [ ] Bouton "Réinitialiser" fonctionne

#### Onglet Recettes (CRITIQUE - 200+ recettes)
- [ ] Affiche toutes les recettes générées (6 protéines × 7 féculents × 6 légumes = 252 combinaisons + recettes de base)
- [ ] Filtre "Tout" fonctionne
- [ ] Filtre "Protéines" fonctionne
- [ ] Filtre "Plats Complets" fonctionne
- [ ] Filtre "Légumes" fonctionne
- [ ] Filtre "Petit-Déj" fonctionne
- [ ] Recherche par nom fonctionne
- [ ] Recherche par ingrédient fonctionne
- [ ] Clic sur une recette ouvre le modal avec détails

#### Modal Recette
- [ ] Affiche le nom
- [ ] Affiche la catégorie
- [ ] Affiche le temps de cuisson
- [ ] Liste TOUS les ingrédients avec quantités en grammes
- [ ] Affiche les instructions étape par étape
- [ ] Affiche les réglages Air Fryer (si applicable)
- [ ] Bouton "Ajouter au Menu" fonctionne

#### Onglet Ingrédients Interdits
- [ ] 7 catégories affichées (acides, épices, gras, irritants, crudités, sucres, conserves)
- [ ] Chaque catégorie montre les aliments à éviter en ROUGE
- [ ] Chaque catégorie montre les alternatives en VERT
- [ ] Explication "Pourquoi" pour chaque catégorie

#### Navigation
- [ ] 4 boutons en bas : Accueil, Menu, (Recettes au centre), Interdits
- [ ] Le bouton central ouvre les Recettes
- [ ] L'onglet actif est visuellement marqué

#### Sauvegarde
- [ ] LocalStorage sauvegarde le menu modifié
- [ ] Bouton sync (refresh-cw) envoie à Google
- [ ] Toast de confirmation s'affiche

---

### 4. BUGS À CORRIGER

#### Bug 1: Les recettes du menu ne sont pas trouvées
Le `findRecipeId()` ne trouve pas les recettes car les noms dans le menu ne correspondent pas exactement aux noms des recettes générées.

**Solution**: Améliorer la recherche pour matcher partiellement ou créer des recettes avec les mêmes noms que dans le menu.

```javascript
findRecipeId: function(name) {
    if (!name) return null;
    const nameLower = name.toLowerCase();

    // Recherche exacte d'abord
    let r = this.state.recipes.find(r => r.nom.toLowerCase() === nameLower);
    if (r) return r.id;

    // Recherche partielle ensuite
    r = this.state.recipes.find(r =>
        r.nom.toLowerCase().includes(nameLower) ||
        nameLower.includes(r.nom.toLowerCase())
    );
    if (r) return r.id;

    // Recherche par mots-clés
    const keywords = nameLower.split(' ');
    r = this.state.recipes.find(recipe => {
        const recipeLower = recipe.nom.toLowerCase();
        return keywords.every(kw => recipeLower.includes(kw));
    });

    return r ? r.id : null;
}
```

#### Bug 2: Ajouter des recettes "collation" manquantes
Le data.js ne contient pas de recettes pour les collations (yaourt, compote, banane, fromage blanc).

**Ajouter dans baseRecipes:**
```javascript
{
  "id": "yaourt-amandes",
  "nom": "Yaourt amandes",
  "categorie": "collation",
  "temps_preparation": "2 min",
  "temps_cuisson": "0 min",
  "ingredients": [
    {"nom": "Yaourt nature 0%", "quantite": "125g"},
    {"nom": "Amandes", "quantite": "5-6 unités"}
  ],
  "instructions": [
    "Verse le yaourt dans un bol",
    "Ajoute les amandes",
    "Déguste frais"
  ]
},
{
  "id": "compote-pomme",
  "nom": "Compote pomme",
  "categorie": "collation",
  "temps_preparation": "0 min",
  "temps_cuisson": "0 min",
  "ingredients": [
    {"nom": "Compote pomme sans sucre", "quantite": "100g"}
  ],
  "instructions": [
    "Ouvre le pot de compote",
    "Verse dans un bol ou mange directement",
    "Peut être tiédi au micro-ondes 20 sec"
  ]
},
{
  "id": "fromage-blanc",
  "nom": "Fromage blanc",
  "categorie": "collation",
  "temps_preparation": "1 min",
  "temps_cuisson": "0 min",
  "ingredients": [
    {"nom": "Fromage blanc 0%", "quantite": "125g"}
  ],
  "instructions": [
    "Verse le fromage blanc dans un bol",
    "Peut ajouter un peu de cannelle (optionnel)",
    "Déguste frais"
  ]
},
{
  "id": "banane-snack",
  "nom": "Banane",
  "categorie": "collation",
  "temps_preparation": "1 min",
  "temps_cuisson": "0 min",
  "ingredients": [
    {"nom": "Banane mûre", "quantite": "1 entière"}
  ],
  "instructions": [
    "Choisis une banane bien mûre (avec quelques taches)",
    "Épluche et mange",
    "Les bananes mûres sont plus faciles à digérer"
  ]
}
```

#### Bug 3: Ajouter un filtre "Collation" dans les filtres
Dans index.html, ajouter un bouton de filtre pour les collations:
```html
<button class="filter-chip px-4 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-medium whitespace-nowrap" data-filter="collation">Collations</button>
```

---

### 5. AMÉLIORATIONS DEMANDÉES

#### Ajouter les recettes du menu comme recettes individuelles
Chaque repas du menu doit avoir une recette correspondante avec des instructions détaillées.

Exemple pour "Saumon riz courgettes":
```javascript
{
  "id": "saumon-riz-courgettes",
  "nom": "Saumon riz courgettes",
  "categorie": "plat_complet",
  "temps_preparation": "10 min",
  "temps_cuisson": "20 min",
  "ingredients": [
    {"nom": "Pavé de saumon", "quantite": "130g"},
    {"nom": "Riz basmati", "quantite": "80g cuit"},
    {"nom": "Courgettes", "quantite": "150g"},
    {"nom": "Huile d'olive", "quantite": "1 c. à café"},
    {"nom": "Sel", "quantite": "1 pincée"},
    {"nom": "Herbes de Provence", "quantite": "1 pincée"}
  ],
  "instructions": [
    "Rince le riz et cuis-le selon les instructions du paquet",
    "Coupe les courgettes en rondelles ou demi-lunes",
    "Badigeonne le saumon d'huile d'olive et assaisonne",
    "Place le saumon dans l'air fryer à 180°C pendant 8-10 min",
    "Pendant ce temps, fais cuire les courgettes à l'air fryer à 180°C pendant 12-15 min",
    "Assemble le tout dans une assiette : riz en base, saumon dessus, courgettes autour",
    "Ajoute un filet d'huile d'olive cru"
  ],
  "reglages_airfryer": {
    "mode": "Air Fry",
    "temperature": "180°C",
    "temps": "Saumon: 8-10 min, Courgettes: 12-15 min"
  }
}
```

---

### 6. FICHIER README.md À CRÉER

Crée un fichier `README.md` dans `netlify_deploy/` :

```markdown
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
```

---

## RÉSUMÉ DES FICHIERS À LIVRER

```
projet/
├── netlify_deploy/           # Dossier à déposer sur Netlify
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── data.js
│   └── README.md
│
├── code.gs                   # Code Google Apps Script (à copier manuellement)
│
└── INSTRUCTIONS.md           # Ce fichier (pour référence)
```

---

## TESTS À EFFECTUER

Avant de livrer, ouvre `netlify_deploy/index.html` dans un navigateur et vérifie:

1. **Page charge sans erreur** (ouvre la console F12)
2. **Navigation fonctionne** entre tous les onglets
3. **Recettes s'affichent** (doit y avoir 250+ recettes)
4. **Filtres fonctionnent** tous
5. **Modal recette** s'ouvre avec toutes les infos
6. **Menu semaine** affiche les 7 jours
7. **Ingrédients interdits** affiche les 7 catégories
8. **Pas d'erreur JavaScript** dans la console

---

## RAPPEL DES LIENS

- **API actuelle**: `https://script.google.com/macros/s/AKfycbyErNnaIpoo_fdnxZpz7ol3NHgutd9DmvsNddiddqGkF7-pV-XjkiDMvRyUsXhiWQ1_/exec`
- **Google Drive images**: `https://drive.google.com/drive/folders/1_2Skc1s702g70PK9yrAWdBAsCUXAAHg0?usp=sharing`

---

## C'EST TOUT !

Livre-moi :
1. Le dossier `netlify_deploy/` complet et fonctionnel
2. Le fichier `code.gs` séparé
3. Assure-toi que tout fonctionne en ouvrant index.html localement

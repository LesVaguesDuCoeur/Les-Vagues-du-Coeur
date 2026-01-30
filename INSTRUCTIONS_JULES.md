# Instructions Complètes pour Jules - Site Alimentation Gastrite

## Objectif
Créer un site web complet, ergonomique et joli pour gérer un régime alimentaire gastrite avec perte de poids (halal). Le site doit être simple d'usage, logique et fonctionnel.

## Liens Importants (À INTÉGRER DIRECTEMENT DANS LE CODE)
- **Google Drive Images**: `https://drive.google.com/drive/folders/1_2Skc1s702g70PK9yrAWdBAsCUXAAHg0?usp=sharing`
- **API Google Apps Script**: `https://script.google.com/macros/s/AKfycbyErNnaIpoo_fdnxZpz7ol3NHgutd9DmvsNddiddqGkF7-pV-XjkiDMvRyUsXhiWQ1_/exec`

## Structure du Site

### 1. Pages Principales

#### Page d'Accueil
- Titre: "Les Vagues du Cœur - Mon Alimentation Gastrite"
- Résumé du menu de la semaine actuelle
- Accès rapide aux différentes sections
- Design moderne, couleurs douces (vert menthe, blanc, gris clair)

#### Page Menu de la Semaine
- Affichage en tableau/grille des 7 jours
- 5 repas par jour: Petit-déjeuner, Collation matin (10h), Déjeuner, Collation après-midi (16h), Dîner
- **LOGIQUE IMPORTANTE**: Impossible de mettre un goûter au déjeuner ou un dîner au petit-déjeuner
- Cliquer sur un repas ouvre les détails de la recette

#### Page Catalogue des Recettes (200+ recettes)
- Filtres par type de repas (petit-déj, collation, déjeuner, dîner)
- Filtres par ingrédient principal (poulet, saumon, dinde, etc.)
- Recherche par nom
- Cards avec image, nom, temps de préparation, calories estimées

#### Page Détail Recette
- Nom de la recette
- Image
- Ingrédients avec quantités exactes
- Instructions de préparation pas à pas
- Réglages Air Fryer (Ninja Foodi FLEX 7-en-1, AF500, 10.4L) si applicable
- Informations nutritionnelles

#### Page Ingrédients Interdits (NOUVELLE SECTION)
- Liste complète des aliments à éviter avec gastrite
- Explication pourquoi chaque aliment est à éviter
- Alternatives suggérées

### 2. Design et UX

- Style similaire à "chaouirecette" (moderne, épuré, couleurs appétissantes)
- Responsive (mobile-first)
- Navigation simple et intuitive
- Pas de Vite/React complexe - HTML/CSS/JS pur ou framework léger
- **Un seul fichier HTML** avec CSS et JS intégrés ou fichiers séparés simples
- Pas de build nécessaire - déployable directement sur Netlify

---

## DONNÉES COMPLÈTES

### Menu de la Semaine Type

```json
{
  "lundi": {
    "petit_dejeuner": {
      "nom": "Flocons d'avoine banane poêlée",
      "ingredients": [
        {"nom": "Flocons d'avoine", "quantite": "40g"},
        {"nom": "Lait d'amande", "quantite": "200ml"},
        {"nom": "Banane", "quantite": "1 entière"},
        {"nom": "Cannelle", "quantite": "1 pincée"}
      ]
    },
    "collation_matin": {
      "nom": "Yaourt amandes",
      "ingredients": [
        {"nom": "Yaourt nature 0%", "quantite": "125g"},
        {"nom": "Amandes", "quantite": "6 unités"}
      ]
    },
    "dejeuner": {
      "nom": "Saumon riz courgettes",
      "ingredients": [
        {"nom": "Saumon", "quantite": "130g"},
        {"nom": "Riz basmati", "quantite": "80g cuit"},
        {"nom": "Courgettes rôties", "quantite": "150g"}
      ]
    },
    "collation_apres_midi": {
      "nom": "Compote pomme",
      "ingredients": [
        {"nom": "Compote pomme sans sucre", "quantite": "100g"}
      ]
    },
    "diner": {
      "nom": "Poulet pâtes mozzarella épinards",
      "ingredients": [
        {"nom": "Poulet grillé", "quantite": "130g"},
        {"nom": "Pâtes semi-complètes", "quantite": "80g cuit"},
        {"nom": "Mozzarella", "quantite": "30g"},
        {"nom": "Épinards cuits", "quantite": "100g"}
      ]
    }
  },
  "mardi": {
    "petit_dejeuner": {
      "nom": "Œufs pain compote",
      "ingredients": [
        {"nom": "Œufs à la poêle", "quantite": "2 unités"},
        {"nom": "Pain complet grillé", "quantite": "2 tranches"},
        {"nom": "Compote pomme", "quantite": "100g"}
      ]
    },
    "collation_matin": {
      "nom": "Banane",
      "ingredients": [
        {"nom": "Banane mûre", "quantite": "1 entière"}
      ]
    },
    "dejeuner": {
      "nom": "Dinde quinoa carottes",
      "ingredients": [
        {"nom": "Dinde air fryer", "quantite": "130g"},
        {"nom": "Quinoa", "quantite": "80g cuit"},
        {"nom": "Carottes rôties", "quantite": "150g"}
      ]
    },
    "collation_apres_midi": {
      "nom": "Fromage blanc",
      "ingredients": [
        {"nom": "Fromage blanc 0%", "quantite": "125g"}
      ]
    },
    "diner": {
      "nom": "Saumon patate douce haricots",
      "ingredients": [
        {"nom": "Saumon", "quantite": "120g"},
        {"nom": "Patate douce air fryer", "quantite": "150g"},
        {"nom": "Haricots verts", "quantite": "150g"}
      ]
    }
  },
  "mercredi": {
    "petit_dejeuner": {
      "nom": "Porridge banane cannelle",
      "ingredients": [
        {"nom": "Flocons d'avoine", "quantite": "40g"},
        {"nom": "Lait d'amande", "quantite": "200ml"},
        {"nom": "Banane écrasée", "quantite": "1/2"},
        {"nom": "Cannelle", "quantite": "1 pincée"}
      ]
    },
    "collation_matin": {
      "nom": "Yaourt nature",
      "ingredients": [
        {"nom": "Yaourt nature 0%", "quantite": "125g"}
      ]
    },
    "dejeuner": {
      "nom": "Poulet riz légumes",
      "ingredients": [
        {"nom": "Poulet grillé", "quantite": "130g"},
        {"nom": "Riz basmati", "quantite": "80g cuit"},
        {"nom": "Courgettes-carottes air fryer", "quantite": "200g"}
      ]
    },
    "collation_apres_midi": {
      "nom": "Compote pomme",
      "ingredients": [
        {"nom": "Compote pomme sans sucre", "quantite": "100g"}
      ]
    },
    "diner": {
      "nom": "Omelette mozzarella pommes de terre",
      "ingredients": [
        {"nom": "Œufs", "quantite": "2 unités"},
        {"nom": "Mozzarella", "quantite": "30g"},
        {"nom": "Épinards", "quantite": "50g"},
        {"nom": "Pommes de terre air fryer", "quantite": "150g"}
      ]
    }
  },
  "jeudi": {
    "petit_dejeuner": {
      "nom": "Overnight oats banane",
      "ingredients": [
        {"nom": "Flocons d'avoine", "quantite": "40g"},
        {"nom": "Yaourt 0%", "quantite": "100g"},
        {"nom": "Lait d'amande", "quantite": "50ml"},
        {"nom": "Banane", "quantite": "1/2"}
      ],
      "note": "Préparer la veille au frigo (min 6h)"
    },
    "collation_matin": {
      "nom": "Compote pomme",
      "ingredients": [
        {"nom": "Compote pomme sans sucre", "quantite": "100g"}
      ]
    },
    "dejeuner": {
      "nom": "Saumon lentilles carottes",
      "ingredients": [
        {"nom": "Saumon air fryer", "quantite": "130g"},
        {"nom": "Lentilles corail", "quantite": "80g cuit"},
        {"nom": "Carottes", "quantite": "150g"}
      ]
    },
    "collation_apres_midi": {
      "nom": "Fromage blanc",
      "ingredients": [
        {"nom": "Fromage blanc 0%", "quantite": "125g"}
      ]
    },
    "diner": {
      "nom": "Dinde pâtes brocoli",
      "ingredients": [
        {"nom": "Dinde", "quantite": "120g"},
        {"nom": "Pâtes semi-complètes", "quantite": "80g cuit"},
        {"nom": "Brocoli air fryer", "quantite": "150g"}
      ]
    }
  },
  "vendredi": {
    "petit_dejeuner": {
      "nom": "Œufs durs pain banane",
      "ingredients": [
        {"nom": "Œufs à la poêle", "quantite": "2 unités"},
        {"nom": "Pain grillé", "quantite": "2 tranches"},
        {"nom": "Banane poêlée", "quantite": "1/2"}
      ]
    },
    "collation_matin": {
      "nom": "Yaourt amandes",
      "ingredients": [
        {"nom": "Yaourt 0%", "quantite": "125g"},
        {"nom": "Amandes", "quantite": "5 unités"}
      ]
    },
    "dejeuner": {
      "nom": "Poulet pommes de terre courgettes",
      "ingredients": [
        {"nom": "Poulet", "quantite": "130g"},
        {"nom": "Pommes de terre air fryer", "quantite": "150g"},
        {"nom": "Courgettes", "quantite": "150g"}
      ]
    },
    "collation_apres_midi": {
      "nom": "Banane",
      "ingredients": [
        {"nom": "Banane mûre", "quantite": "1 entière"}
      ]
    },
    "diner": {
      "nom": "Saumon riz épinards mozzarella",
      "ingredients": [
        {"nom": "Saumon", "quantite": "120g"},
        {"nom": "Riz basmati", "quantite": "80g cuit"},
        {"nom": "Épinards", "quantite": "100g"},
        {"nom": "Mozzarella", "quantite": "30g"}
      ]
    }
  },
  "samedi": {
    "petit_dejeuner": {
      "nom": "Flocons d'avoine compote",
      "ingredients": [
        {"nom": "Flocons d'avoine", "quantite": "40g"},
        {"nom": "Lait d'amande", "quantite": "200ml"},
        {"nom": "Compote pomme", "quantite": "100g"}
      ]
    },
    "collation_matin": {
      "nom": "Fromage blanc",
      "ingredients": [
        {"nom": "Fromage blanc 0%", "quantite": "125g"}
      ]
    },
    "dejeuner": {
      "nom": "Dinde patate douce haricots",
      "ingredients": [
        {"nom": "Dinde", "quantite": "130g"},
        {"nom": "Patate douce air fryer", "quantite": "150g"},
        {"nom": "Haricots verts", "quantite": "150g"}
      ]
    },
    "collation_apres_midi": {
      "nom": "Compote",
      "ingredients": [
        {"nom": "Compote sans sucre", "quantite": "100g"}
      ]
    },
    "diner": {
      "nom": "Poulet quinoa brocoli carottes",
      "ingredients": [
        {"nom": "Poulet", "quantite": "120g"},
        {"nom": "Quinoa", "quantite": "80g cuit"},
        {"nom": "Brocoli-carottes air fryer", "quantite": "200g"}
      ]
    }
  },
  "dimanche": {
    "petit_dejeuner": {
      "nom": "Œufs brouillés pain banane",
      "ingredients": [
        {"nom": "Œufs brouillés", "quantite": "2 unités"},
        {"nom": "Pain grillé", "quantite": "2 tranches"},
        {"nom": "Banane poêlée", "quantite": "1/2"}
      ]
    },
    "collation_matin": {
      "nom": "Yaourt nature",
      "ingredients": [
        {"nom": "Yaourt 0%", "quantite": "125g"}
      ]
    },
    "dejeuner": {
      "nom": "Saumon pâtes courgettes mozzarella",
      "ingredients": [
        {"nom": "Saumon", "quantite": "130g"},
        {"nom": "Pâtes semi-complètes", "quantite": "80g cuit"},
        {"nom": "Courgettes", "quantite": "150g"},
        {"nom": "Mozzarella", "quantite": "30g"}
      ]
    },
    "collation_apres_midi": {
      "nom": "Compote pomme",
      "ingredients": [
        {"nom": "Compote pomme sans sucre", "quantite": "100g"}
      ]
    },
    "diner": {
      "nom": "Poulet effiloché pommes de terre légumes",
      "ingredients": [
        {"nom": "Poulet effiloché", "quantite": "120g"},
        {"nom": "Pommes de terre", "quantite": "150g"},
        {"nom": "Légumes air fryer", "quantite": "200g"}
      ]
    }
  }
}
```

---

### Recettes Complètes avec Instructions

#### PROTÉINES

##### Saumon Air Fryer
```json
{
  "nom": "Saumon Air Fryer",
  "categorie": "proteine",
  "temps_preparation": "5 min",
  "temps_cuisson": "8-10 min",
  "ingredients": [
    {"nom": "Pavé de saumon", "quantite": "130g"},
    {"nom": "Huile d'olive", "quantite": "1 c. à café"},
    {"nom": "Sel", "quantite": "1 pincée"},
    {"nom": "Herbes de Provence", "quantite": "1 pincée (optionnel)"}
  ],
  "instructions": [
    "Badigeonne le saumon d'huile d'olive",
    "Sale légèrement, ajoute les herbes",
    "Place dans le tiroir de l'air fryer",
    "Le saumon est prêt quand il s'effeuille facilement"
  ],
  "reglages_airfryer": {
    "mode": "Air Fry",
    "temperature": "180°C",
    "temps": "8-10 min"
  },
  "appareil": "Ninja Foodi FLEX 7-en-1 (AF500, 10.4L)"
}
```

##### Poulet Grillé Air Fryer
```json
{
  "nom": "Poulet Grillé Air Fryer",
  "categorie": "proteine",
  "temps_preparation": "5 min",
  "temps_cuisson": "12-15 min",
  "ingredients": [
    {"nom": "Blanc de poulet", "quantite": "130g"},
    {"nom": "Huile d'olive", "quantite": "1 c. à café"},
    {"nom": "Sel", "quantite": "1 pincée"},
    {"nom": "Paprika doux", "quantite": "1/2 c. à café (non irritant)"}
  ],
  "instructions": [
    "Aplatis légèrement le poulet pour cuisson uniforme",
    "Badigeonne d'huile, sale, paprika",
    "Place dans le tiroir",
    "Retourne à mi-cuisson"
  ],
  "reglages_airfryer": {
    "mode": "Air Fry",
    "temperature": "190°C",
    "temps": "12-15 min"
  }
}
```

##### Dinde Air Fryer
```json
{
  "nom": "Dinde Air Fryer",
  "categorie": "proteine",
  "temps_preparation": "5 min",
  "temps_cuisson": "10-12 min",
  "ingredients": [
    {"nom": "Escalope de dinde", "quantite": "130g"},
    {"nom": "Huile d'olive", "quantite": "1 c. à café"},
    {"nom": "Sel", "quantite": "1 pincée"},
    {"nom": "Paprika doux", "quantite": "1/2 c. à café"}
  ],
  "instructions": [
    "Badigeonne la dinde d'huile d'olive",
    "Assaisonne avec sel et paprika",
    "Place dans le tiroir de l'air fryer"
  ],
  "reglages_airfryer": {
    "mode": "Air Fry",
    "temperature": "185°C",
    "temps": "10-12 min"
  }
}
```

##### Œufs à la Poêle (façon gastrite)
```json
{
  "nom": "Œufs à la Poêle",
  "categorie": "proteine",
  "temps_preparation": "1 min",
  "temps_cuisson": "3-4 min",
  "ingredients": [
    {"nom": "Œufs", "quantite": "2 unités"},
    {"nom": "Sel", "quantite": "1 pincée légère"}
  ],
  "instructions": [
    "Poêle antiadhésive de qualité",
    "Sans matière grasse ou 1 spray d'huile",
    "Feu moyen-doux (pas trop chaud)",
    "Casse les œufs, laisse cuire 3-4 min",
    "Sale légèrement",
    "IMPORTANT: Évite les bords croustillants/brûlés — ils sont plus difficiles à digérer"
  ]
}
```

##### Omelette Mozzarella-Épinards
```json
{
  "nom": "Omelette Mozzarella-Épinards",
  "categorie": "proteine",
  "temps_preparation": "5 min",
  "temps_cuisson": "5 min",
  "ingredients": [
    {"nom": "Œufs", "quantite": "2 unités"},
    {"nom": "Épinards cuits", "quantite": "50g"},
    {"nom": "Mozzarella", "quantite": "30g"},
    {"nom": "Sel", "quantite": "1 pincée"}
  ],
  "instructions": [
    "Bats les œufs avec le sel",
    "Poêle antiadhésive, feu moyen",
    "Verse les œufs, laisse prendre 1 min",
    "Ajoute épinards et mozzarella sur une moitié",
    "Plie l'omelette, laisse 2 min",
    "Sers"
  ]
}
```

#### LÉGUMES

##### Légumes Rôtis Air Fryer (courgettes, carottes, brocoli)
```json
{
  "nom": "Légumes Rôtis Air Fryer",
  "categorie": "legume",
  "temps_preparation": "5 min",
  "temps_cuisson": "10-18 min selon légume",
  "ingredients": [
    {"nom": "Légumes coupés en morceaux", "quantite": "200g"},
    {"nom": "Huile d'olive", "quantite": "1 c. à café"},
    {"nom": "Sel", "quantite": "1 pincée"}
  ],
  "instructions": [
    "Coupe les légumes en morceaux moyens (2-3 cm)",
    "Mélange avec l'huile et le sel",
    "Place en une seule couche dans le tiroir",
    "Secoue le tiroir à mi-cuisson"
  ],
  "reglages_airfryer_par_legume": {
    "courgettes": {"mode": "Air Fry", "temperature": "180°C", "temps": "12-15 min"},
    "carottes": {"mode": "Air Fry", "temperature": "180°C", "temps": "15-18 min"},
    "brocoli": {"mode": "Air Fry", "temperature": "180°C", "temps": "10-12 min"},
    "mix_legumes": {"mode": "Air Fry", "temperature": "180°C", "temps": "15 min"}
  }
}
```

##### Pommes de Terre / Patate Douce Air Fryer
```json
{
  "nom": "Pommes de Terre Air Fryer",
  "categorie": "feculent",
  "temps_preparation": "5 min",
  "temps_cuisson": "18-22 min",
  "ingredients": [
    {"nom": "Pommes de terre ou patate douce", "quantite": "150g"},
    {"nom": "Huile d'olive", "quantite": "1 c. à café"},
    {"nom": "Sel", "quantite": "1 pincée"},
    {"nom": "Romarin", "quantite": "1 pincée (optionnel)"}
  ],
  "instructions": [
    "Coupe en cubes de 2 cm ou en quartiers",
    "Mélange avec huile et sel",
    "Place dans le tiroir",
    "Secoue 2 fois pendant la cuisson"
  ],
  "reglages_airfryer": {
    "mode": "Air Fry",
    "temperature": "190°C",
    "temps": "18-22 min"
  }
}
```

#### PETIT-DÉJEUNER

##### Banane Poêlée
```json
{
  "nom": "Banane Poêlée",
  "categorie": "petit_dejeuner",
  "temps_preparation": "2 min",
  "temps_cuisson": "4-6 min",
  "ingredients": [
    {"nom": "Banane", "quantite": "1 entière"}
  ],
  "instructions_poele": [
    "Coupe la banane en rondelles de 1 cm",
    "Poêle antiadhésive à feu moyen, sans matière grasse",
    "2-3 min par face jusqu'à doré"
  ],
  "instructions_airfryer": [
    "Coupe la banane en rondelles",
    "Place dans le tiroir"
  ],
  "reglages_airfryer": {
    "mode": "Air Fry",
    "temperature": "160°C",
    "temps": "5-6 min"
  }
}
```

##### Overnight Oats
```json
{
  "nom": "Overnight Oats",
  "categorie": "petit_dejeuner",
  "temps_preparation": "5 min (la veille)",
  "temps_cuisson": "0 min",
  "ingredients": [
    {"nom": "Flocons d'avoine", "quantite": "40g"},
    {"nom": "Yaourt 0%", "quantite": "100g"},
    {"nom": "Lait d'amande", "quantite": "50ml"},
    {"nom": "Banane écrasée", "quantite": "1/2"}
  ],
  "instructions": [
    "Mélange tout dans un pot ou bol",
    "Couvre et place au frigo toute la nuit (min 6h)",
    "Le matin, c'est prêt — mange froid ou tiédi 30 sec au micro-ondes"
  ]
}
```

##### Porridge Avoine
```json
{
  "nom": "Porridge Avoine",
  "categorie": "petit_dejeuner",
  "temps_preparation": "2 min",
  "temps_cuisson": "5 min",
  "ingredients": [
    {"nom": "Flocons d'avoine", "quantite": "40g"},
    {"nom": "Lait d'amande", "quantite": "200ml"},
    {"nom": "Banane", "quantite": "1/2 écrasée"},
    {"nom": "Cannelle", "quantite": "1 pincée"}
  ],
  "instructions": [
    "Verse le lait dans une casserole",
    "Ajoute les flocons d'avoine",
    "Fais chauffer à feu moyen en remuant 5 min",
    "Ajoute la banane écrasée et la cannelle",
    "Sers tiède"
  ]
}
```

#### PLATS COMPLETS

##### Pâtes Mozzarella Épinards
```json
{
  "nom": "Pâtes Mozzarella Épinards",
  "categorie": "plat_complet",
  "temps_preparation": "5 min",
  "temps_cuisson": "12 min",
  "ingredients": [
    {"nom": "Pâtes semi-complètes", "quantite": "80g (poids cuit)"},
    {"nom": "Épinards frais ou surgelés", "quantite": "100g"},
    {"nom": "Mozzarella", "quantite": "30g"},
    {"nom": "Huile d'olive", "quantite": "1 c. à café"},
    {"nom": "Sel", "quantite": "1 pincée"}
  ],
  "instructions": [
    "Cuis les pâtes bien al dente à très cuites",
    "Fais revenir les épinards 3 min à la poêle avec l'huile",
    "Mélange pâtes + épinards",
    "Ajoute la mozzarella coupée en dés, mélange (elle fond légèrement)",
    "Sale"
  ]
}
```

---

### ALIMENTS INTERDITS (Page dédiée)

```json
{
  "acides": {
    "titre": "Aliments Acides",
    "aliments": ["Tomates", "Agrumes (citron, orange, pamplemousse)", "Vinaigre", "Cornichons"],
    "raison": "Augmentent l'acidité gastrique et irritent la muqueuse de l'estomac",
    "alternatives": ["Courgettes", "Carottes", "Herbes fraîches pour assaisonner"]
  },
  "epices": {
    "titre": "Épices Fortes",
    "aliments": ["Piment", "Poivre fort", "Harissa", "Curry fort", "Gingembre en excès", "Ail cru", "Oignon cru"],
    "raison": "Irritent directement la paroi de l'estomac",
    "alternatives": ["Paprika doux", "Herbes de Provence", "Cannelle douce", "Curcuma (avec modération)"]
  },
  "gras": {
    "titre": "Aliments Gras",
    "aliments": ["Fritures", "Charcuterie", "Fromages gras", "Crème fraîche", "Beurre en excès", "Viandes grasses"],
    "raison": "Ralentissent la digestion et augmentent la production d'acide",
    "alternatives": ["Cuisson air fryer", "Huile d'olive (1-2 c. à café/jour)", "Mozzarella avec modération", "Viandes maigres"]
  },
  "irritants": {
    "titre": "Boissons et Irritants",
    "aliments": ["Café", "Thé fort", "Sodas", "Alcool", "Boissons gazeuses", "Jus d'orange"],
    "raison": "Stimulent la sécrétion d'acide gastrique",
    "alternatives": ["Eau plate", "Tisanes douces (camomille)", "Lait d'amande", "Lait d'avoine"]
  },
  "crus_difficiles": {
    "titre": "Crudités Difficiles",
    "aliments": ["Oignon cru", "Ail cru", "Poivrons", "Concombre (parfois)", "Radis", "Chou cru"],
    "raison": "Difficiles à digérer et peuvent fermenter dans l'estomac",
    "alternatives": ["Légumes cuits (vapeur, air fryer, four)", "Carottes cuites", "Courgettes cuites", "Épinards cuits"]
  },
  "sucres": {
    "titre": "Sucres et Sucreries",
    "aliments": ["Bonbons", "Gâteaux industriels", "Chocolat", "Sodas sucrés", "Glaces"],
    "raison": "Favorisent l'inflammation et les reflux",
    "alternatives": ["Fruits doux (banane mûre, pomme cuite, poire cuite)", "Compote sans sucre ajouté"]
  },
  "conserves_transformes": {
    "titre": "Conserves et Transformés",
    "aliments": ["Thon en conserve (limiter)", "Plats préparés", "Sauces industrielles", "Ketchup", "Mayonnaise"],
    "raison": "Contiennent souvent des additifs, sel et acidifiants",
    "alternatives": ["Poisson frais", "Sauces maison légères", "Assaisonnement huile d'olive + herbes"]
  }
}
```

---

### Récapitulatif des Quantités Standards

| Aliment | Quantité par portion |
|---------|---------------------|
| Poulet/Dinde | 120-130g |
| Saumon | 120-130g |
| Œufs | 2 unités |
| Riz basmati/Quinoa | 80g cuit |
| Pâtes semi-complètes | 80g cuit |
| Patate douce/Pomme de terre | 150g |
| Lentilles corail | 80g cuit |
| Légumes (courgettes, carottes, etc.) | 150-200g |
| Mozzarella | 30g max |
| Flocons d'avoine | 40g |
| Lait d'amande | 200ml |
| Yaourt/Fromage blanc 0% | 125g |
| Banane | 1 ou ½ selon repas |
| Compote sans sucre | 100g |
| Huile d'olive | 1 c. à soupe/jour max |
| Amandes | 5-6 unités |

---

### Conseils Importants (À afficher sur le site)

1. **Eau**: Boire 1,5-2L/jour ENTRE les repas (pas pendant)
2. **Marche**: 30-45 min/jour — excellent pour le reflux et la perte de poids
3. **Manger lentement**: Bien mastiquer chaque bouchée
4. **Petits repas**: 5 repas par jour plutôt que 3 gros
5. **Pas de repas tardif**: Dîner au moins 2-3h avant le coucher
6. **Position**: Ne pas s'allonger juste après manger

---

### Spécifications Techniques

#### Structure des fichiers (SIMPLE)
```
/
├── index.html          # Page unique ou pages multiples
├── styles.css          # Styles CSS
├── app.js              # JavaScript
├── data.js             # Données des recettes et menus (ou intégré)
└── images/             # Images locales si nécessaire
```

OU tout en un seul fichier HTML pour simplicité maximale.

#### Fonctionnalités Requises

1. **Menu de la semaine**
   - Vue tableau 7 jours × 5 repas
   - Clic sur un repas → affiche détails
   - Possibilité de modifier (avec sauvegarde via API Google)

2. **Catalogue recettes**
   - Minimum 50 recettes de base (les variations comptent)
   - Filtres et recherche
   - Cards cliquables

3. **Détail recette**
   - Modal ou page dédiée
   - Toutes les infos (ingrédients, quantités, instructions, air fryer)

4. **Page Ingrédients Interdits**
   - Liste claire avec catégories
   - Couleurs visuelles (rouge pour interdit, vert pour alternatives)

5. **Sauvegarde**
   - Utiliser l'API Google Apps Script fournie
   - Les liens ne changent jamais donc les mettre en dur dans le code

#### Design
- Couleurs: Vert menthe (#10B981), Blanc (#FFFFFF), Gris clair (#F3F4F6), Texte sombre (#1F2937)
- Police: Sans-serif moderne (Inter, Poppins, ou system-ui)
- Cards avec ombres légères
- Boutons arrondis
- Responsive mobile-first
- Animations subtiles (hover, transitions)

---

### Points Critiques

1. **PAS de build complexe** - Doit fonctionner directement sans npm/vite/webpack
2. **Fichiers propres** - Pas de fichiers inutiles (node_modules, .config, etc.)
3. **Logique des repas** - Impossible de mettre un dîner au petit-déjeuner
4. **Quantités toujours visibles** - Chaque recette doit afficher les grammes
5. **Air Fryer** - Toujours indiquer les réglages Ninja Foodi FLEX
6. **Halal** - Toutes les viandes doivent être halal (rappel dans le site)

---

## Résumé pour Jules

Crée un site statique simple (HTML/CSS/JS) avec:
1. Page Menu semaine (tableau interactif)
2. Page Catalogue recettes (200+ avec filtres)
3. Page Ingrédients interdits gastrite
4. Design moderne type "chaouirecette"
5. Responsive mobile
6. Sauvegarde via Google Apps Script
7. Pas de framework complexe
8. Déployable directement sur Netlify

Utilise les données JSON fournies ci-dessus pour alimenter le site.

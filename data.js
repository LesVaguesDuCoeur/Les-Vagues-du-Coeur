// Données principales du site - GastroPlan

// 1. Menu de la Semaine Type
const defaultWeeklyMenu = {
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
};

// 2. Recettes Détaillées (Base)
const baseRecipes = [
  // PROTÉINES
  {
    "id": "saumon-airfryer",
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
  },
  {
    "id": "poulet-grille-airfryer",
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
  },
  {
    "id": "dinde-airfryer",
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
  },
  {
    "id": "oeufs-poele",
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
  },
  {
    "id": "omelette-mozza-epinards",
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
  },
  // LÉGUMES
  {
    "id": "legumes-rotis-airfryer",
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
  },
  {
    "id": "pommes-terre-airfryer",
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
  },
  // PETIT-DÉJEUNER
  {
    "id": "banane-poelee",
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
  },
  {
    "id": "overnight-oats",
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
  },
  {
    "id": "porridge-avoine",
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
  },
  // PLATS COMPLETS
  {
    "id": "pates-mozza-epinards",
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
];

// 3. Aliments Interdits
const forbiddenIngredients = {
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
};

// 4. Génération de recettes (Combinatoire)
const ingredientsBase = {
  proteines: [
    { nom: "Saumon", id: "saumon", quantite: "130g", icon: "fish" },
    { nom: "Poulet", id: "poulet", quantite: "130g", icon: "drumstick" },
    { nom: "Dinde", id: "dinde", quantite: "130g", icon: "bird" },
    { nom: "Oeufs (2)", id: "oeufs", quantite: "2 unités", icon: "egg" },
    { nom: "Cabillaud", id: "cabillaud", quantite: "130g", icon: "fish" },
    { nom: "Steak haché 5%", id: "steak", quantite: "120g", icon: "beef" }
  ],
  feculents: [
    { nom: "Riz basmati", id: "riz", quantite: "80g cuit", icon: "bowl" },
    { nom: "Pâtes semi-complètes", id: "pates", quantite: "80g cuit", icon: "utensils" },
    { nom: "Quinoa", id: "quinoa", quantite: "80g cuit", icon: "circle" },
    { nom: "Patate douce", id: "patate-douce", quantite: "150g", icon: "potato" },
    { nom: "Pommes de terre", id: "pomme-terre", quantite: "150g", icon: "potato" },
    { nom: "Lentilles corail", id: "lentilles", quantite: "80g cuit", icon: "circle-dot" },
    { nom: "Semoule", id: "semoule", quantite: "80g cuit", icon: "grain" }
  ],
  legumes: [
    { nom: "Courgettes", id: "courgettes", quantite: "150g", icon: "carrot" },
    { nom: "Carottes", id: "carottes", quantite: "150g", icon: "carrot" },
    { nom: "Haricots verts", id: "haricots", quantite: "150g", icon: "bean" },
    { nom: "Brocoli", id: "brocoli", quantite: "150g", icon: "tree-pine" },
    { nom: "Épinards", id: "epinards", quantite: "100g", icon: "leaf" },
    { nom: "Mix légumes Air Fryer", id: "mix", quantite: "200g", icon: "salad" }
  ]
};

function generateRecipes() {
  const generatedRecipes = [];
  let idCounter = 1;

  ingredientsBase.proteines.forEach(prot => {
    ingredientsBase.feculents.forEach(fec => {
      ingredientsBase.legumes.forEach(leg => {
        const nom = `${prot.nom} ${fec.nom} ${leg.nom}`;
        const id = `recette-gen-${prot.id}-${fec.id}-${leg.id}`;

        generatedRecipes.push({
          id: id,
          nom: nom,
          categorie: "plat_complet",
          temps_preparation: "10 min",
          temps_cuisson: "15-20 min",
          ingredients: [
            { nom: prot.nom, quantite: prot.quantite },
            { nom: fec.nom, quantite: fec.quantite },
            { nom: leg.nom, quantite: leg.quantite },
            { nom: "Huile d'olive", quantite: "1 c. à café" }
          ],
          instructions: [
            `Prépare la protéine (${prot.nom}) au Air Fryer ou à la poêle selon ta préférence.`,
            `Cuis le féculent (${fec.nom}) à l'eau ou vapeur.`,
            `Cuis les légumes (${leg.nom}) au Air Fryer (180°C, 15 min) ou vapeur.`,
            "Assemble le tout dans une assiette.",
            "Ajoute un filet d'huile d'olive cru pour les bons lipides."
          ],
          tags: [prot.id, fec.id, leg.id]
        });
      });
    });
  });

  return [...baseRecipes, ...generatedRecipes];
}

const allRecipes = generateRecipes();

// Export pour utilisation dans app.js
// En mode "no build", on peut juste laisser ces variables globales ou les attacher à window
window.GastroData = {
  menu: defaultWeeklyMenu,
  recipes: allRecipes,
  forbidden: forbiddenIngredients,
  ingredientsBase: ingredientsBase
};

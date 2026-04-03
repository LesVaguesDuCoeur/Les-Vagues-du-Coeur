// ============================================
// GASTROPLAN - DATA.JS
// Structure de données (VIDE de recettes)
// Les recettes sont chargées depuis le Drive
// ============================================

// MENU PAR DÉFAUT (Version Lyes)
const defaultMenu = {
  lundi: {
    petit_dejeuner: {nom: "Flocons avoine banane poêlée", ingredients: [{nom: "Flocons avoine", quantite: "40g"}, {nom: "Lait amande", quantite: "200ml"}, {nom: "Banane", quantite: "1"}], kcal: 350},
    collation_matin: {nom: "Yaourt amandes", ingredients: [{nom: "Yaourt 0%", quantite: "125g"}, {nom: "Amandes", quantite: "6"}], kcal: 150},
    dejeuner: {nom: "Saumon Riz basmati Courgettes", ingredients: [{nom: "Saumon", quantite: "130g"}, {nom: "Riz basmati", quantite: "80g"}, {nom: "Courgettes", quantite: "150g"}], kcal: 460},
    collation_apres_midi: {nom: "Compote pomme", ingredients: [{nom: "Compote sans sucre", quantite: "100g"}], kcal: 70},
    diner: {nom: "Poulet Pâtes semi-complètes Épinards", ingredients: [{nom: "Poulet", quantite: "130g"}, {nom: "Pâtes semi-complètes", quantite: "80g"}, {nom: "Mozzarella", quantite: "30g"}, {nom: "Épinards", quantite: "100g"}], kcal: 480}
  },
  mardi: {
    petit_dejeuner: {nom: "Oeufs pain compote", ingredients: [{nom: "Oeufs", quantite: "2"}, {nom: "Pain complet", quantite: "2 tranches"}, {nom: "Compote pomme", quantite: "100g"}], kcal: 380},
    collation_matin: {nom: "Banane", ingredients: [{nom: "Banane mûre", quantite: "1"}], kcal: 90},
    dejeuner: {nom: "Dinde Quinoa Carottes", ingredients: [{nom: "Dinde", quantite: "130g"}, {nom: "Quinoa", quantite: "80g"}, {nom: "Carottes", quantite: "150g"}], kcal: 430},
    collation_apres_midi: {nom: "Fromage blanc nature", ingredients: [{nom: "Fromage blanc 0%", quantite: "125g"}], kcal: 80},
    diner: {nom: "Saumon Patate douce Haricots verts", ingredients: [{nom: "Saumon", quantite: "120g"}, {nom: "Patate douce", quantite: "150g"}, {nom: "Haricots verts", quantite: "150g"}], kcal: 450}
  },
  mercredi: {
    petit_dejeuner: {nom: "Porridge banane cannelle", ingredients: [{nom: "Flocons avoine", quantite: "40g"}, {nom: "Lait amande", quantite: "200ml"}, {nom: "Banane", quantite: "1/2"}, {nom: "Cannelle", quantite: "1 pincée"}], kcal: 340},
    collation_matin: {nom: "Yaourt nature", ingredients: [{nom: "Yaourt 0%", quantite: "125g"}], kcal: 60},
    dejeuner: {nom: "Poulet Riz basmati Courgettes", ingredients: [{nom: "Poulet", quantite: "130g"}, {nom: "Riz basmati", quantite: "80g"}, {nom: "Courgettes", quantite: "150g"}, {nom: "Carottes", quantite: "50g"}], kcal: 440},
    collation_apres_midi: {nom: "Compote pomme", ingredients: [{nom: "Compote sans sucre", quantite: "100g"}], kcal: 70},
    diner: {nom: "Oeufs Pommes de terre Épinards", ingredients: [{nom: "Oeufs", quantite: "2"}, {nom: "Mozzarella", quantite: "30g"}, {nom: "Épinards", quantite: "50g"}, {nom: "Pommes de terre", quantite: "150g"}], kcal: 420}
  },
  jeudi: {
    petit_dejeuner: {nom: "Overnight oats banane", ingredients: [{nom: "Flocons avoine", quantite: "40g"}, {nom: "Yaourt 0%", quantite: "100g"}, {nom: "Lait amande", quantite: "50ml"}, {nom: "Banane", quantite: "1/2"}], kcal: 330},
    collation_matin: {nom: "Compote pomme", ingredients: [{nom: "Compote sans sucre", quantite: "100g"}], kcal: 70},
    dejeuner: {nom: "Saumon Riz basmati Carottes", ingredients: [{nom: "Saumon", quantite: "130g"}, {nom: "Riz basmati", quantite: "80g"}, {nom: "Carottes", quantite: "150g"}], kcal: 480},
    collation_apres_midi: {nom: "Fromage blanc nature", ingredients: [{nom: "Fromage blanc 0%", quantite: "125g"}], kcal: 80},
    diner: {nom: "Dinde Pâtes semi-complètes Brocoli", ingredients: [{nom: "Dinde", quantite: "120g"}, {nom: "Pâtes semi-complètes", quantite: "80g"}, {nom: "Brocoli", quantite: "150g"}], kcal: 420}
  },
  vendredi: {
    petit_dejeuner: {nom: "Oeufs pain banane poêlée", ingredients: [{nom: "Oeufs", quantite: "2"}, {nom: "Pain complet", quantite: "2 tranches"}, {nom: "Banane", quantite: "1/2"}], kcal: 390},
    collation_matin: {nom: "Yaourt amandes", ingredients: [{nom: "Yaourt 0%", quantite: "125g"}, {nom: "Amandes", quantite: "5"}], kcal: 140},
    dejeuner: {nom: "Poulet Pommes de terre Courgettes", ingredients: [{nom: "Poulet", quantite: "130g"}, {nom: "Pommes de terre", quantite: "150g"}, {nom: "Courgettes", quantite: "150g"}], kcal: 430},
    collation_apres_midi: {nom: "Banane", ingredients: [{nom: "Banane mûre", quantite: "1"}], kcal: 90},
    diner: {nom: "Saumon Riz basmati Épinards", ingredients: [{nom: "Saumon", quantite: "120g"}, {nom: "Riz basmati", quantite: "80g"}, {nom: "Épinards", quantite: "100g"}, {nom: "Mozzarella", quantite: "30g"}], kcal: 460}
  },
  samedi: {
    petit_dejeuner: {nom: "Flocons avoine compote", ingredients: [{nom: "Flocons avoine", quantite: "40g"}, {nom: "Lait amande", quantite: "200ml"}, {nom: "Compote pomme", quantite: "100g"}], kcal: 320},
    collation_matin: {nom: "Fromage blanc nature", ingredients: [{nom: "Fromage blanc 0%", quantite: "125g"}], kcal: 80},
    dejeuner: {nom: "Dinde Patate douce Haricots verts", ingredients: [{nom: "Dinde", quantite: "130g"}, {nom: "Patate douce", quantite: "150g"}, {nom: "Haricots verts", quantite: "150g"}], kcal: 420},
    collation_apres_midi: {nom: "Compote pomme", ingredients: [{nom: "Compote sans sucre", quantite: "100g"}], kcal: 70},
    diner: {nom: "Poulet Quinoa Brocoli", ingredients: [{nom: "Poulet", quantite: "120g"}, {nom: "Quinoa", quantite: "80g"}, {nom: "Brocoli", quantite: "100g"}, {nom: "Carottes", quantite: "100g"}], kcal: 430}
  },
  dimanche: {
    petit_dejeuner: {nom: "Oeufs brouillés pain banane", ingredients: [{nom: "Oeufs", quantite: "2"}, {nom: "Pain complet", quantite: "2 tranches"}, {nom: "Banane", quantite: "1/2"}], kcal: 370},
    collation_matin: {nom: "Yaourt nature", ingredients: [{nom: "Yaourt 0%", quantite: "125g"}], kcal: 60},
    dejeuner: {nom: "Saumon Pâtes semi-complètes Courgettes", ingredients: [{nom: "Saumon", quantite: "130g"}, {nom: "Pâtes semi-complètes", quantite: "80g"}, {nom: "Courgettes", quantite: "150g"}, {nom: "Mozzarella", quantite: "30g"}], kcal: 490},
    collation_apres_midi: {nom: "Compote pomme", ingredients: [{nom: "Compote sans sucre", quantite: "100g"}], kcal: 70},
    diner: {nom: "Poulet Pommes de terre Mix légumes", ingredients: [{nom: "Poulet", quantite: "120g"}, {nom: "Pommes de terre", quantite: "150g"}, {nom: "Mix légumes", quantite: "200g"}], kcal: 430}
  }
};

// INSTRUCTIONS DE CUISSON (Air Fryer Ninja Foodi FLEX)
const cookingInstructions = {
  saumon: {
    nom: "Saumon Air Fryer",
    instructions: ["Badigeonne le saumon d'huile d'olive", "Sale légèrement, ajoute les herbes de Provence", "Place dans le tiroir de l'air fryer", "Le saumon est prêt quand il s'effeuille facilement"],
    airfryer: {mode: "Air Fry", temperature: "180°C", temps: "8-10 min"}
  },
  poulet: {
    nom: "Poulet Grillé Air Fryer",
    instructions: ["Aplatis légèrement le poulet pour cuisson uniforme", "Badigeonne d'huile, sale, paprika doux", "Place dans le tiroir", "Retourne à mi-cuisson"],
    airfryer: {mode: "Air Fry", temperature: "190°C", temps: "12-15 min"}
  },
  dinde: {
    nom: "Dinde Air Fryer",
    instructions: ["Coupe l'escalope si elle est trop épaisse", "Huile et assaisonne légèrement", "Place dans le panier"],
    airfryer: {mode: "Air Fry", temperature: "185°C", temps: "10-12 min"}
  },
  oeufs: {
    nom: "Oeufs (Plat/Durs/Brouillés)",
    instructions: ["A la poêle : feu doux, sans bords brûlés", "Durs : 9 min eau bouillante", "Coque : 6 min eau bouillante"],
    airfryer: null
  },
  cabillaud: {
    nom: "Cabillaud Air Fryer",
    instructions: ["Huile d'olive et herbes", "Papillote conseillée pour garder le moelleux"],
    airfryer: {mode: "Air Fry", temperature: "180°C", temps: "8-10 min"}
  },
  poulet_effiloche: {
    nom: "Poulet Effiloché",
    instructions: ["Cuire le poulet entier ou blancs (20 min Air Fryer 180°C)", "Effilocher à la fourchette une fois tiède"],
    airfryer: {mode: "Air Fry", temperature: "180°C", temps: "20 min"}
  },
  legumes_airfryer: {
    instructions: ["Coupe les légumes en morceaux de 2-3 cm", "Mélange avec 1 c. café huile d'olive et sel", "Place en une seule couche dans le tiroir", "Secoue le tiroir à mi-cuisson"],
    airfryer_par_legume: {
      courgettes: {temp: "180°C", temps: "12-15 min"},
      carottes: {temp: "180°C", temps: "15-18 min"},
      brocoli: {temp: "180°C", temps: "10-12 min"},
      haricots_verts: {temp: "180°C", temps: "12-15 min"},
      mix: {temp: "180°C", temps: "15 min"},
      aubergine: {temp: "180°C", temps: "15 min"},
      fenouil: {temp: "180°C", temps: "15 min"},
      courge: {temp: "180°C", temps: "20 min"},
      potiron: {temp: "180°C", temps: "20 min"},
      champignons: {temp: "180°C", temps: "8-10 min"},
      poireaux: {temp: "180°C", temps: "10-12 min"},
      epinards: {temp: "180°C", temps: "8-10 min"}
    }
  },
  pomme_terre: {
    instructions: ["Coupe en cubes de 2 cm ou en quartiers", "Mélange avec huile et sel", "Secoue 2 fois pendant la cuisson"],
    airfryer: {mode: "Air Fry", temperature: "190°C", temps: "18-22 min"}
  },
  patate_douce: {
    instructions: ["Coupe en frites ou cubes", "Huile d'olive et paprika", "Surveille la fin de cuisson car ça brûle vite"],
    airfryer: {mode: "Air Fry", temperature: "190°C", temps: "18-22 min"}
  }
};

// ALIMENTS INTERDITS (Gastrite)
const forbiddenIngredients = {
  acides: {
    titre: "Aliments Acides",
    aliments: ["Tomates", "Agrumes", "Citron", "Orange", "Pamplemousse", "Vinaigre", "Cornichons"],
    raison: "Augmentent l'acidité gastrique",
    alternatives: ["Courgettes", "Carottes", "Herbes fraîches"]
  },
  epices: {
    titre: "Épices Fortes",
    aliments: ["Piment", "Poivre fort", "Harissa", "Curry fort", "Gingembre en excès", "Ail cru", "Oignon cru"],
    raison: "Irritent la paroi de l'estomac",
    alternatives: ["Paprika doux", "Herbes de Provence", "Cannelle douce", "Curcuma (modération)"]
  },
  gras: {
    titre: "Aliments Gras",
    aliments: ["Fritures", "Charcuterie", "Fromages gras", "Crème fraîche", "Beurre en excès", "Viandes grasses"],
    raison: "Ralentissent la digestion",
    alternatives: ["Cuisson air fryer", "Huile d'olive (1-2 c. café/jour)", "Mozzarella modérée", "Viandes maigres"]
  },
  irritants: {
    titre: "Boissons Irritantes",
    aliments: ["Café", "Thé fort", "Sodas", "Alcool", "Boissons gazeuses", "Jus d'orange"],
    raison: "Stimulent la sécrétion d'acide",
    alternatives: ["Eau plate", "Tisanes camomille", "Lait d'amande", "Lait d'avoine"]
  },
  crus: {
    titre: "Crudités Difficiles",
    aliments: ["Oignon cru", "Ail cru", "Poivrons", "Radis", "Chou cru"],
    raison: "Difficiles à digérer, fermentent",
    alternatives: ["Légumes cuits", "Carottes cuites", "Courgettes cuites", "Épinards cuits"]
  },
  sucres: {
    titre: "Sucres",
    aliments: ["Bonbons", "Gâteaux industriels", "Chocolat", "Sodas sucrés", "Glaces"],
    raison: "Favorisent inflammation et reflux",
    alternatives: ["Banane mûre", "Pomme cuite", "Compote sans sucre", "Dattes (modération)"]
  },
  conserves: {
    titre: "Conserves et Transformés",
    aliments: ["Thon en conserve (limiter)", "Plats préparés", "Sauces industrielles", "Ketchup", "Mayonnaise"],
    raison: "Additifs, sel, acidifiants",
    alternatives: ["Poisson frais", "Cuisine maison", "Huile d'olive + herbes"]
  }
};

// Exposer les données globalement
window.GastroData = {
  menu: defaultMenu,
  recipes: [], // VIDE - chargé depuis le Drive
  forbidden: forbiddenIngredients,
  cookingInstructions: cookingInstructions
};

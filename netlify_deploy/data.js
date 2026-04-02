// DONNÉES GASTROPLAN - Version 3
// Menu, Recettes (Générateur), Interdits, Constantes

// 1. MENU PAR DÉFAUT
const defaultMenu = {
  lundi: {
    petit_dejeuner: {nom: "Flocons avoine banane poêlée", ingredients: [{nom: "Flocons avoine", qt: "40g"}, {nom: "Lait amande", qt: "200ml"}, {nom: "Banane", qt: "1"}]},
    collation_matin: {nom: "Yaourt amandes", ingredients: [{nom: "Yaourt 0%", qt: "125g"}, {nom: "Amandes", qt: "6"}]},
    dejeuner: {nom: "Saumon riz courgettes", ingredients: [{nom: "Saumon", qt: "130g"}, {nom: "Riz basmati", qt: "80g"}, {nom: "Courgettes", qt: "150g"}]},
    collation_aprem: {nom: "Compote pomme", ingredients: [{nom: "Compote sans sucre", qt: "100g"}]},
    diner: {nom: "Poulet pâtes mozzarella épinards", ingredients: [{nom: "Poulet", qt: "130g"}, {nom: "Pâtes", qt: "80g"}, {nom: "Mozzarella", qt: "30g"}, {nom: "Épinards", qt: "100g"}]}
  },
  mardi: {
    petit_dejeuner: {nom: "Oeufs pain compote", ingredients: [{nom: "Oeufs", qt: "2"}, {nom: "Pain complet", qt: "2 tr."}, {nom: "Compote", qt: "100g"}]},
    collation_matin: {nom: "Banane", ingredients: [{nom: "Banane mûre", qt: "1"}]},
    dejeuner: {nom: "Dinde quinoa carottes", ingredients: [{nom: "Dinde", qt: "130g"}, {nom: "Quinoa", qt: "80g"}, {nom: "Carottes", qt: "150g"}]},
    collation_aprem: {nom: "Fromage blanc", ingredients: [{nom: "Fromage blanc 0%", qt: "125g"}]},
    diner: {nom: "Saumon patate douce haricots", ingredients: [{nom: "Saumon", qt: "120g"}, {nom: "Patate douce", qt: "150g"}, {nom: "Haricots verts", qt: "150g"}]}
  },
  mercredi: {
    petit_dejeuner: {nom: "Porridge banane cannelle", ingredients: [{nom: "Flocons avoine", qt: "40g"}, {nom: "Lait amande", qt: "200ml"}, {nom: "Banane", qt: "1/2"}, {nom: "Cannelle", qt: "1 pincee"}]},
    collation_matin: {nom: "Yaourt nature", ingredients: [{nom: "Yaourt 0%", qt: "125g"}]},
    dejeuner: {nom: "Poulet riz legumes", ingredients: [{nom: "Poulet", qt: "130g"}, {nom: "Riz basmati", qt: "80g"}, {nom: "Courgettes-carottes", qt: "200g"}]},
    collation_aprem: {nom: "Compote pomme", ingredients: [{nom: "Compote", qt: "100g"}]},
    diner: {nom: "Omelette mozzarella pommes de terre", ingredients: [{nom: "Oeufs", qt: "2"}, {nom: "Mozzarella", qt: "30g"}, {nom: "Epinards", qt: "50g"}, {nom: "Pommes de terre", qt: "150g"}]}
  },
  jeudi: {
    petit_dejeuner: {nom: "Overnight oats banane", ingredients: [{nom: "Flocons avoine", qt: "40g"}, {nom: "Yaourt 0%", qt: "100g"}, {nom: "Lait amande", qt: "50ml"}, {nom: "Banane", qt: "1/2"}]},
    collation_matin: {nom: "Compote pomme", ingredients: [{nom: "Compote", qt: "100g"}]},
    dejeuner: {nom: "Saumon lentilles carottes", ingredients: [{nom: "Saumon", qt: "130g"}, {nom: "Lentilles corail", qt: "80g"}, {nom: "Carottes", qt: "150g"}]},
    collation_aprem: {nom: "Fromage blanc", ingredients: [{nom: "Fromage blanc 0%", qt: "125g"}]},
    diner: {nom: "Dinde pates brocoli", ingredients: [{nom: "Dinde", qt: "120g"}, {nom: "Pates", qt: "80g"}, {nom: "Brocoli", qt: "150g"}]}
  },
  vendredi: {
    petit_dejeuner: {nom: "Oeufs pain banane poelee", ingredients: [{nom: "Oeufs", qt: "2"}, {nom: "Pain grille", qt: "2 tr."}, {nom: "Banane", qt: "1/2"}]},
    collation_matin: {nom: "Yaourt amandes", ingredients: [{nom: "Yaourt 0%", qt: "125g"}, {nom: "Amandes", qt: "5"}]},
    dejeuner: {nom: "Poulet pommes de terre courgettes", ingredients: [{nom: "Poulet", qt: "130g"}, {nom: "Pommes de terre", qt: "150g"}, {nom: "Courgettes", qt: "150g"}]},
    collation_aprem: {nom: "Banane", ingredients: [{nom: "Banane mure", qt: "1"}]},
    diner: {nom: "Saumon riz epinards mozzarella", ingredients: [{nom: "Saumon", qt: "120g"}, {nom: "Riz basmati", qt: "80g"}, {nom: "Epinards", qt: "100g"}, {nom: "Mozzarella", qt: "30g"}]}
  },
  samedi: {
    petit_dejeuner: {nom: "Flocons avoine compote", ingredients: [{nom: "Flocons avoine", qt: "40g"}, {nom: "Lait amande", qt: "200ml"}, {nom: "Compote pomme", qt: "100g"}]},
    collation_matin: {nom: "Fromage blanc", ingredients: [{nom: "Fromage blanc 0%", qt: "125g"}]},
    dejeuner: {nom: "Dinde patate douce haricots", ingredients: [{nom: "Dinde", qt: "130g"}, {nom: "Patate douce", qt: "150g"}, {nom: "Haricots verts", qt: "150g"}]},
    collation_aprem: {nom: "Compote", ingredients: [{nom: "Compote", qt: "100g"}]},
    diner: {nom: "Poulet quinoa brocoli carottes", ingredients: [{nom: "Poulet", qt: "120g"}, {nom: "Quinoa", qt: "80g"}, {nom: "Brocoli-carottes", qt: "200g"}]}
  },
  dimanche: {
    petit_dejeuner: {nom: "Oeufs brouilles pain banane", ingredients: [{nom: "Oeufs brouilles", qt: "2"}, {nom: "Pain grille", qt: "2 tr."}, {nom: "Banane poelee", qt: "1/2"}]},
    collation_matin: {nom: "Yaourt nature", ingredients: [{nom: "Yaourt 0%", qt: "125g"}]},
    dejeuner: {nom: "Saumon pates courgettes mozzarella", ingredients: [{nom: "Saumon", qt: "130g"}, {nom: "Pates", qt: "80g"}, {nom: "Courgettes", qt: "150g"}, {nom: "Mozzarella", qt: "30g"}]},
    collation_aprem: {nom: "Compote pomme", ingredients: [{nom: "Compote", qt: "100g"}]},
    diner: {nom: "Poulet effiloche pommes de terre legumes", ingredients: [{nom: "Poulet effiloche", qt: "120g"}, {nom: "Pommes de terre", qt: "150g"}, {nom: "Legumes", qt: "200g"}]}
  }
};

// 2. RECETTES DE BASE & INSTRUCTIONS SPÉCIFIQUES
const cookingInstructions = {
  saumon: {
    nom: "Saumon Air Fryer",
    instructions: [
      "Badigeonne le saumon d'huile d'olive",
      "Sale légèrement, ajoute les herbes de Provence",
      "Place dans le tiroir de l'air fryer",
      "Le saumon est prêt quand il s'effeuille facilement"
    ],
    airfryer: {mode: "Air Fry", temperature: "180°C", temps: "8-10 min"}
  },
  poulet: {
    nom: "Poulet Grillé Air Fryer",
    instructions: [
      "Aplatis légèrement le poulet pour cuisson uniforme",
      "Badigeonne d'huile, sale, paprika doux",
      "Place dans le tiroir",
      "Retourne à mi-cuisson"
    ],
    airfryer: {mode: "Air Fry", temperature: "190°C", temps: "12-15 min"}
  },
  dinde: {
    nom: "Dinde Air Fryer",
    instructions: [
      "Coupe l'escalope si elle est trop épaisse",
      "Huile et assaisonne légèrement",
      "Place dans le panier"
    ],
    airfryer: {mode: "Air Fry", temperature: "185°C", temps: "10-12 min"}
  },
  oeufs: {
    nom: "Œufs (Coque/Durs/Plat)",
    instructions: [
      "À la poêle : feu doux, sans bords brûlés",
      "Durs : 9 min eau bouillante",
      "Coque : 6 min eau bouillante"
    ],
    airfryer: null
  },
  cabillaud: {
    nom: "Cabillaud Air Fryer",
    instructions: [
      "Huile d'olive et jus de citron",
      "Papillote conseillée pour garder le moelleux"
    ],
    airfryer: {mode: "Air Fry", temperature: "180°C", temps: "8-10 min"}
  },
  poulet_effiloche: {
    nom: "Poulet Effiloché",
    instructions: [
      "Cuire le poulet entier ou blancs (20 min Air Fryer 180°C)",
      "Effilocher à la fourchette une fois tiède"
    ],
    airfryer: {mode: "Air Fry", temperature: "180°C", temps: "20 min"}
  },

  // Légumes
  legumes_airfryer: {
    instructions: [
      "Coupe les légumes en morceaux de 2-3 cm",
      "Mélange avec 1 c. café huile d'olive et sel",
      "Place en une seule couche dans le tiroir",
      "Secoue le tiroir à mi-cuisson"
    ],
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
      poireaux: {temp: "180°C", temps: "10-12 min"}
    }
  },

  // Féculents
  pomme_terre: {
    instructions: [
      "Coupe en cubes de 2 cm ou en quartiers",
      "Mélange avec huile et sel",
      "Secoue 2 fois pendant la cuisson"
    ],
    airfryer: {mode: "Air Fry", temperature: "190°C", temps: "18-22 min"}
  },
  patate_douce: {
    instructions: [
      "Coupe en frites ou cubes",
      "Huile d'olive et paprika",
      "Surveille la fin de cuisson car ça brûle vite"
    ],
    airfryer: {mode: "Air Fry", temperature: "190°C", temps: "18-22 min"}
  }
};

// 3. GÉNÉRATEUR DE RECETTES (COMBINATOIRE)
const ingredientsBase = {
  proteines: [
    { nom: "Saumon", id: "saumon", quantite: "130g", icon: "fish" },
    { nom: "Poulet", id: "poulet", quantite: "130g", icon: "drumstick" },
    { nom: "Dinde", id: "dinde", quantite: "130g", icon: "bird" },
    { nom: "Oeufs x2", id: "oeufs", quantite: "2 unités", icon: "egg" },
    { nom: "Cabillaud", id: "cabillaud", quantite: "130g", icon: "fish" },
    { nom: "Poulet effiloche", id: "poulet_effiloche", quantite: "120g", icon: "drumstick" }
  ],
  feculents: [
    { nom: "Riz basmati", id: "riz", quantite: "80g cuit", icon: "bowl" },
    { nom: "Pates semi-completes", id: "pates", quantite: "80g cuit", icon: "utensils" },
    { nom: "Quinoa", id: "quinoa", quantite: "80g cuit", icon: "circle" },
    { nom: "Patate douce", id: "patate_douce", quantite: "150g", icon: "potato" },
    { nom: "Pommes de terre", id: "pomme_terre", quantite: "150g", icon: "potato" },
    { nom: "Lentilles corail", id: "lentilles", quantite: "80g cuit", icon: "circle-dot" },
    { nom: "Semoule", id: "semoule", quantite: "80g cuit", icon: "grain" }
  ],
  legumes: [
    { nom: "Courgettes", id: "courgettes", quantite: "150g", icon: "carrot" },
    { nom: "Carottes", id: "carottes", quantite: "150g", icon: "carrot" },
    { nom: "Haricots verts", id: "haricots_verts", quantite: "150g", icon: "bean" },
    { nom: "Brocoli", id: "brocoli", quantite: "150g", icon: "tree-pine" },
    { nom: "Epinards", id: "epinards", quantite: "100g", icon: "leaf" },
    { nom: "Mix legumes", id: "mix", quantite: "200g", icon: "salad" },
    { nom: "Aubergine", id: "aubergine", quantite: "150g", icon: "eggplant" },
    { nom: "Fenouil", id: "fenouil", quantite: "150g", icon: "leaf" },
    { nom: "Courge", id: "courge", quantite: "150g", icon: "circle" },
    { nom: "Potiron", id: "potiron", quantite: "150g", icon: "circle" },
    { nom: "Champignons", id: "champignons", quantite: "100g", icon: "mushroom" },
    { nom: "Poireaux", id: "poireaux", quantite: "150g", icon: "leaf" }
  ]
};

// Recettes Manuelles (Petit-Déj & Collation)
const manualRecipes = [
  // PETIT-DÉJEUNER
  {id: "pdj1", nom: "Flocons avoine banane poêlée", categorie: "petit_dejeuner", ingredients: [{nom: "Flocons avoine", qt: "40g"}, {nom: "Lait amande", qt: "200ml"}, {nom: "Banane", qt: "1"}], instructions: ["Chauffer lait+avoine", "Poêler banane"], temps_cuisson: "5 min"},
  {id: "pdj2", nom: "Flocons avoine compote", categorie: "petit_dejeuner", ingredients: [{nom: "Flocons avoine", qt: "40g"}, {nom: "Lait amande", qt: "200ml"}, {nom: "Compote pomme", qt: "100g"}], instructions: ["Chauffer lait+avoine", "Ajouter compote"], temps_cuisson: "5 min"},
  {id: "pdj3", nom: "Overnight oats banane", categorie: "petit_dejeuner", ingredients: [{nom: "Flocons avoine", qt: "40g"}, {nom: "Yaourt 0%", qt: "100g"}, {nom: "Banane", qt: "1/2"}], instructions: ["Mélanger tout la veille", "Frigo min 6h"], temps_cuisson: "0 min"},
  {id: "pdj4", nom: "Porridge banane cannelle", categorie: "petit_dejeuner", ingredients: [{nom: "Flocons", qt: "40g"}, {nom: "Lait", qt: "200ml"}, {nom: "Banane", qt: "1/2"}, {nom: "Cannelle", qt: "1p"}], instructions: ["Cuire à la casserole 5min"], temps_cuisson: "5 min"},
  {id: "pdj5", nom: "Oeufs pain compote", categorie: "petit_dejeuner", ingredients: [{nom: "Oeufs", qt: "2"}, {nom: "Pain complet", qt: "2tr"}, {nom: "Compote", qt: "100g"}], instructions: ["Oeufs au plat ou durs", "Griller pain"], temps_cuisson: "5 min"},
  {id: "pdj6", nom: "Oeufs pain banane poêlée", categorie: "petit_dejeuner", ingredients: [{nom: "Oeufs", qt: "2"}, {nom: "Pain", qt: "2tr"}, {nom: "Banane", qt: "1/2"}], instructions: ["Poêler banane", "Cuire oeufs"], temps_cuisson: "5 min"},
  {id: "pdj7", nom: "Oeufs brouillés pain banane", categorie: "petit_dejeuner", ingredients: [{nom: "Oeufs", qt: "2"}, {nom: "Pain", qt: "2tr"}, {nom: "Banane", qt: "1/2"}], instructions: ["Brouiller oeufs doux", "Manger banane crue"], temps_cuisson: "5 min"},
  {id: "pdj8", nom: "Pancakes banane", categorie: "petit_dejeuner", ingredients: [{nom: "Banane", qt: "1"}, {nom: "Oeuf", qt: "1"}, {nom: "Flocons", qt: "30g"}], instructions: ["Mixer tout", "Cuire petite louche à la poêle"], temps_cuisson: "10 min"},
  {id: "pdj9", nom: "Smoothie bowl banane", categorie: "petit_dejeuner", ingredients: [{nom: "Banane congelée", qt: "1"}, {nom: "Yaourt", qt: "1"}, {nom: "Lait", qt: "splash"}], instructions: ["Mixer", "Top avec avoine"], temps_cuisson: "0 min"},
  {id: "pdj10", nom: "Riz au lait cannelle", categorie: "petit_dejeuner", ingredients: [{nom: "Riz rond", qt: "40g"}, {nom: "Lait amande", qt: "200ml"}, {nom: "Cannelle", qt: "1p"}], instructions: ["Cuire doucement 20min"], temps_cuisson: "20 min"},
  {id: "pdj11", nom: "Yaourt flocons banane", categorie: "petit_dejeuner", ingredients: [{nom: "Yaourt", qt: "125g"}, {nom: "Flocons", qt: "30g"}, {nom: "Banane", qt: "1"}], instructions: ["Mélanger tout"], temps_cuisson: "0 min"},

  // COLLATIONS
  {id: "col1", nom: "Yaourt amandes", categorie: "collation", ingredients: [{nom: "Yaourt 0%", qt: "125g"}, {nom: "Amandes", qt: "6"}], instructions: ["Mélanger"], temps_cuisson: "0 min"},
  {id: "col2", nom: "Fromage blanc", categorie: "collation", ingredients: [{nom: "Fromage blanc 0%", qt: "125g"}], instructions: ["Manger frais"], temps_cuisson: "0 min"},
  {id: "col3", nom: "Compote pomme", categorie: "collation", ingredients: [{nom: "Compote sans sucre", qt: "100g"}], instructions: ["Manger"], temps_cuisson: "0 min"},
  {id: "col4", nom: "Banane", categorie: "collation", ingredients: [{nom: "Banane mûre", qt: "1"}], instructions: ["Manger"], temps_cuisson: "0 min"},
  {id: "col5", nom: "Yaourt nature", categorie: "collation", ingredients: [{nom: "Yaourt 0%", qt: "125g"}], instructions: ["Manger"], temps_cuisson: "0 min"},
  {id: "col6", nom: "Fromage blanc cannelle", categorie: "collation", ingredients: [{nom: "FB 0%", qt: "125g"}, {nom: "Cannelle", qt: "1p"}], instructions: ["Mélanger"], temps_cuisson: "0 min"}
];

// RECETTES SPÉCIALES JEÛNE / RAMADAN
const jeuneRecipes = [
    {
        id: "suhoor-overnight-dattes",
        nom: "Suhoor Overnight Oats Dattes",
        categorie: "suhoor",
        kcal: 450,
        temps_preparation: "5 min (veille)",
        temps_cuisson: "0 min",
        ingredients: [
            {nom: "Flocons avoine", quantite: "50g"},
            {nom: "Lait d'amande", quantite: "200ml"},
            {nom: "Dattes", quantite: "3 unites"},
            {nom: "Amandes", quantite: "10 unites"},
            {nom: "Miel", quantite: "1 c. cafe"}
        ],
        instructions: [
            "Melanger flocons + lait dans un pot",
            "Couper les dattes en morceaux, ajouter",
            "Couvrir et refrigerer toute la nuit",
            "Le matin (suhoor), ajouter amandes et miel",
            "Manger lentement pour tenir la journee"
        ]
    },
    {
        id: "suhoor-oeufs-complet",
        nom: "Suhoor Oeufs Pain Banane",
        categorie: "suhoor",
        kcal: 500,
        temps_preparation: "5 min",
        temps_cuisson: "5 min",
        ingredients: [
            {nom: "Oeufs", quantite: "3 unites"},
            {nom: "Pain complet", quantite: "2 tranches"},
            {nom: "Banane", quantite: "1 entiere"},
            {nom: "Fromage blanc", quantite: "100g"},
            {nom: "Eau", quantite: "500ml"}
        ],
        instructions: [
            "Cuire les oeufs a la poele (pas trop cuits)",
            "Griller le pain legerement",
            "Manger la banane entiere",
            "Terminer par le fromage blanc",
            "IMPORTANT: Boire beaucoup d'eau avant la fin du suhoor"
        ]
    },
    {
        id: "iftar-soupe-legumes",
        nom: "Iftar Soupe + Dattes",
        categorie: "iftar",
        kcal: 200,
        temps_preparation: "10 min",
        temps_cuisson: "20 min",
        ingredients: [
            {nom: "Dattes", quantite: "3 unites"},
            {nom: "Eau", quantite: "1 grand verre"},
            {nom: "Courgettes", quantite: "100g"},
            {nom: "Carottes", quantite: "100g"},
            {nom: "Pomme de terre", quantite: "1 petite"},
            {nom: "Sel", quantite: "1 pincee"}
        ],
        instructions: [
            "RUPTURE: 3 dattes + grand verre d'eau",
            "Attendre 15-20 min avant de manger plus",
            "Preparer la soupe: couper legumes en des",
            "Cuire dans l'eau 20 min, mixer",
            "Manger la soupe doucement"
        ]
    },
    {
        id: "iftar-plat-principal",
        nom: "Iftar Poulet Riz Legumes",
        categorie: "iftar_plat",
        kcal: 550,
        temps_preparation: "10 min",
        temps_cuisson: "25 min",
        ingredients: [
            {nom: "Poulet", quantite: "150g"},
            {nom: "Riz basmati", quantite: "100g"},
            {nom: "Courgettes", quantite: "150g"},
            {nom: "Carottes", quantite: "100g"},
            {nom: "Huile olive", quantite: "1 c. soupe"}
        ],
        instructions: [
            "A manger 30-45 min apres la soupe/dattes",
            "Cuire le riz selon instructions",
            "Griller le poulet a l'air fryer 180°C 15 min",
            "Cuire legumes air fryer 180°C 12 min",
            "Assembler, ne pas trop manger d'un coup"
        ]
    },
    {
        id: "collation-nuit-jeune",
        nom: "Collation Nuit Yaourt Fruits",
        categorie: "collation_nuit",
        kcal: 200,
        temps_preparation: "2 min",
        ingredients: [
            {nom: "Yaourt 0%", quantite: "150g"},
            {nom: "Banane", quantite: "1/2"},
            {nom: "Amandes", quantite: "5 unites"},
            {nom: "Miel", quantite: "1 c. cafe (optionnel)"}
        ],
        instructions: [
            "Melanger yaourt + banane ecrasee",
            "Ajouter amandes",
            "Manger 2-3h avant le suhoor",
            "Boire de l'eau apres"
        ]
    }
];

function generateCombinations() {
  const generated = [];

  ingredientsBase.proteines.forEach(prot => {
    ingredientsBase.feculents.forEach(fec => {
      ingredientsBase.legumes.forEach(leg => {
        // Build Title
        let nom = `${prot.nom} ${fec.nom} ${leg.nom}`;
        // Clean up names (e.g. "Oeufs x2" -> "Oeufs")
        nom = nom.replace(" x2", "").replace(" (poids cuit)", "");

        // Build Instructions based on ingredients
        const instructions = [];
        let tempsCuisson = 0;

        // Protein Instructions
        const pInstr = cookingInstructions[prot.id] || cookingInstructions.poulet; // default
        instructions.push(`<strong>PROTÉINE (${prot.nom}):</strong>`);
        pInstr.instructions.forEach(i => instructions.push("- " + i));

        // Feculent Instructions
        instructions.push(`<strong>FÉCULENT (${fec.nom}):</strong>`);
        if(fec.id === 'pomme_terre' || fec.id === 'patate_douce') {
           const fInstr = cookingInstructions[fec.id];
           fInstr.instructions.forEach(i => instructions.push("- " + i));
        } else {
           instructions.push("- Cuire à l'eau ou vapeur selon paquet (env 10-12 min)");
        }

        // Veggie Instructions
        instructions.push(`<strong>LÉGUMES (${leg.nom}):</strong>`);
        const vBase = cookingInstructions.legumes_airfryer;
        vBase.instructions.forEach(i => instructions.push("- " + i));

        // Air Fryer settings aggregation
        let afSettings = null;
        if (pInstr.airfryer) {
            afSettings = {...pInstr.airfryer};
            // Merge logic strictly for display text could be complex,
            // so we keep the protein one as primary or composite string
            if(cookingInstructions.legumes_airfryer.airfryer_par_legume[leg.id]) {
                const lSet = cookingInstructions.legumes_airfryer.airfryer_par_legume[leg.id];
                afSettings.details = `Prot: ${afSettings.temperature}/${afSettings.temps} | Lég: ${lSet.temp}/${lSet.temps}`;
            }
        }

        generated.push({
          id: `gen-${prot.id}-${fec.id}-${leg.id}`,
          nom: nom,
          categorie: "plat_complet",
          temps_preparation: "10 min",
          temps_cuisson: "20-25 min", // Average
          ingredients: [
             {nom: prot.nom, quantite: prot.quantite},
             {nom: fec.nom, quantite: fec.quantite},
             {nom: leg.nom, quantite: leg.quantite},
             {nom: "Huile d'olive", quantite: "1 c. café"},
             {nom: "Sel/Herbes", quantite: "au goût"}
          ],
          instructions: instructions,
          reglages_airfryer: afSettings
        });
      });
    });
  });

  return [...manualRecipes, ...jeuneRecipes, ...generated];
}

// 4. ALIMENTS INTERDITS (Nouvelle Structure)
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
    aliments: ["Oignon cru", "Ail cru", "Poivrons", "Concombre", "Radis", "Chou cru"],
    raison: "Difficiles à digérer, fermentent",
    alternatives: ["Légumes cuits", "Carottes cuites", "Courgettes cuites", "Épinards cuits"]
  },
  sucres: {
    titre: "Sucres",
    aliments: ["Bonbons", "Gâteaux industriels", "Chocolat", "Sodas sucrés", "Glaces"],
    raison: "Favorisent inflammation et reflux",
    alternatives: ["Banane mûre", "Pomme cuite", "Compote sans sucre"]
  },
  conserves: {
    titre: "Conserves et Transformés",
    aliments: ["Thon en conserve (limiter)", "Plats préparés", "Sauces industrielles", "Ketchup", "Mayonnaise"],
    raison: "Additifs, sel, acidifiants",
    alternatives: ["Poisson frais", "Cuisine maison", "Huile d'olive + herbes"]
  }
};

const allRecipes = generateCombinations();

window.GastroData = {
  menu: defaultMenu,
  recipes: allRecipes,
  forbidden: forbiddenIngredients,
  ingredientsBase: ingredientsBase
};

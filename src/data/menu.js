import { v4 as uuidv4 } from 'uuid';

export const INITIAL_MENU = {
  lundi: {
    breakfast: {
        id: uuidv4(),
        title: "Flocons d'avoine & Banane Poêlée",
        type: 'breakfast',
        calories: 350,
        ingredients: [
            { name: "Flocons d'avoine", quantity: "40g" },
            { name: "Lait d'amande", quantity: "200ml" },
            { name: "Banane", quantity: "1" }
        ],
        instructions: ["Cuire avoine+lait. Poêler la banane (rondelles) à sec ou peu d'huile coco."]
    },
    snack1: {
        id: uuidv4(),
        title: "Yaourt & Amandes",
        type: 'snack',
        calories: 100,
        ingredients: [{ name: "Yaourt 0%", quantity: "125g" }, { name: "Amandes", quantity: "6" }],
        instructions: ["Mélanger."]
    },
    lunch: {
        id: uuidv4(),
        title: "Saumon Air Fryer, Riz & Courgettes",
        type: 'meal',
        calories: 450,
        ingredients: [
            { name: "Saumon", quantity: "130g" },
            { name: "Riz Basmati", quantity: "80g cuit" },
            { name: "Courgettes", quantity: "150g" }
        ],
        instructions: [
            "**Saumon:** Huiler, herbes. Air Fryer 180°C 8-10 min.",
            "**Courgettes:** Cubes, huiler. Air Fryer 180°C 12-15 min.",
            "**Riz:** Cuire à l'eau."
        ]
    },
    snack2: {
        id: uuidv4(),
        title: "Compote Pomme",
        type: 'snack',
        calories: 90,
        ingredients: [{ name: "Compote sans sucre", quantity: "100g" }],
        instructions: ["Déguster."]
    },
    dinner: {
        id: uuidv4(),
        title: "Poulet Grillé, Pâtes & Mozza-Epinards",
        type: 'meal',
        calories: 500,
        ingredients: [
            { name: "Poulet", quantity: "130g" },
            { name: "Pâtes semi-complètes", quantity: "80g cuit" },
            { name: "Mozzarella", quantity: "30g" },
            { name: "Epinards", quantity: "100g" }
        ],
        instructions: [
            "**Poulet:** Huiler, paprika. Air Fryer 190°C 12-15 min.",
            "**Pâtes:** Cuire al dente.",
            "**Légumes:** Poêler épinards, mélanger aux pâtes chaudes avec mozza."
        ]
    }
  },
  mardi: {
    breakfast: {
        id: uuidv4(),
        title: "Oeufs au plat & Pain grillé",
        type: 'breakfast',
        calories: 350,
        ingredients: [{name: "Oeufs", quantity: "2"}, {name: "Pain complet", quantity: "2 tranches"}, {name: "Compote", quantity: "1"}],
        instructions: ["Cuire oeufs poêle antiadhésive."]
    },
    snack1: { id: uuidv4(), title: "Banane", type: 'snack', ingredients: [{name: "Banane", quantity: "1"}], instructions: [] },
    lunch: {
        id: uuidv4(),
        title: "Dinde Air Fryer, Quinoa & Carottes",
        type: 'meal',
        calories: 450,
        ingredients: [{name: "Dinde", quantity: "130g"}, {name: "Quinoa", quantity: "80g cuit"}, {name: "Carottes", quantity: "150g"}],
        instructions: ["**Dinde:** Air Fryer 185°C 10-12 min.", "**Carottes:** Air Fryer 180°C 15-18 min."]
    },
    snack2: { id: uuidv4(), title: "Fromage Blanc", type: 'snack', ingredients: [{name: "Fromage Blanc 0%", quantity: "125g"}], instructions: [] },
    dinner: {
        id: uuidv4(),
        title: "Saumon, Patate Douce & Haricots Verts",
        type: 'meal',
        calories: 500,
        ingredients: [{name: "Saumon", quantity: "120g"}, {name: "Patate Douce", quantity: "150g"}, {name: "Haricots Verts", quantity: "150g"}],
        instructions: ["**Saumon:** Air Fryer 180°C 8-10 min.", "**Patate Douce:** Cubes, Air Fryer 190°C 18-22 min."]
    }
  },
  mercredi: {
    breakfast: {
        id: uuidv4(),
        title: "Porridge Avoine & Banane",
        type: 'breakfast',
        calories: 300,
        ingredients: [{name: "Avoine", quantity: "40g"}, {name: "Lait Amande", quantity: "200ml"}, {name: "Banane", quantity: "1/2"}],
        instructions: ["Cuire avoine dans lait."]
    },
    snack1: { id: uuidv4(), title: "Yaourt", type: 'snack', ingredients: [{name: "Yaourt", quantity: "125g"}], instructions: [] },
    lunch: {
        id: uuidv4(),
        title: "Poulet Grillé, Riz & Courgettes-Carottes",
        type: 'meal',
        calories: 450,
        ingredients: [{name: "Poulet", quantity: "130g"}, {name: "Riz", quantity: "80g"}, {name: "Courgettes/Carottes", quantity: "200g"}],
        instructions: ["**Poulet:** Air Fryer 190°C 12-15 min.", "**Légumes:** Air Fryer 180°C 15 min."]
    },
    snack2: { id: uuidv4(), title: "Compote", type: 'snack', ingredients: [{name: "Compote", quantity: "100g"}], instructions: [] },
    dinner: {
        id: uuidv4(),
        title: "Omelette Mozza-Epinards & Pommes de terre",
        type: 'meal',
        calories: 450,
        ingredients: [{name: "Oeufs", quantity: "2"}, {name: "Mozza", quantity: "30g"}, {name: "Epinards", quantity: "50g"}, {name: "Pommes de terre", quantity: "150g"}],
        instructions: ["**Omelette:** Battre oeufs, cuire poêle, ajouter mozza/épinards.", "**Pommes de terre:** Air Fryer 190°C 20 min."]
    }
  },
  jeudi: {
    breakfast: {
        id: uuidv4(),
        title: "Overnight Oats",
        type: 'breakfast',
        calories: 300,
        ingredients: [{name: "Avoine", quantity: "40g"}, {name: "Yaourt", quantity: "100g"}, {name: "Banane", quantity: "1/2"}],
        instructions: ["Préparer la veille."]
    },
    snack1: { id: uuidv4(), title: "Compote", type: 'snack', ingredients: [{name: "Compote", quantity: "100g"}], instructions: [] },
    lunch: {
        id: uuidv4(),
        title: "Saumon, Lentilles Corail & Carottes",
        type: 'meal',
        calories: 480,
        ingredients: [{name: "Saumon", quantity: "130g"}, {name: "Lentilles Corail", quantity: "80g cuit"}, {name: "Carottes", quantity: "150g"}],
        instructions: ["**Saumon:** Air Fryer.", "**Lentilles:** Cuire eau 10-15 min.", "**Carottes:** Air Fryer."]
    },
    snack2: { id: uuidv4(), title: "Fromage Blanc", type: 'snack', ingredients: [{name: "Fromage Blanc", quantity: "125g"}], instructions: [] },
    dinner: {
        id: uuidv4(),
        title: "Dinde, Pâtes & Brocoli",
        type: 'meal',
        calories: 450,
        ingredients: [{name: "Dinde", quantity: "120g"}, {name: "Pâtes", quantity: "80g"}, {name: "Brocoli", quantity: "150g"}],
        instructions: ["**Dinde:** Air Fryer.", "**Brocoli:** Air Fryer 180°C 10-12 min."]
    }
  },
  vendredi: {
    breakfast: {
        id: uuidv4(),
        title: "Oeufs au plat & Pain grillé",
        type: 'breakfast',
        calories: 350,
        ingredients: [{name: "Oeufs", quantity: "2"}, {name: "Pain", quantity: "2 tranches"}, {name: "Banane poêlée", quantity: "1/2"}],
        instructions: ["Cuire oeufs."]
    },
    snack1: { id: uuidv4(), title: "Yaourt & Amandes", type: 'snack', ingredients: [{name: "Yaourt", quantity: "125g"}, {name: "Amandes", quantity: "5"}], instructions: [] },
    lunch: {
        id: uuidv4(),
        title: "Poulet, Pommes de terre & Courgettes",
        type: 'meal',
        calories: 480,
        ingredients: [{name: "Poulet", quantity: "130g"}, {name: "Pommes de terre", quantity: "150g"}, {name: "Courgettes", quantity: "150g"}],
        instructions: ["**Tout au Air Fryer:** Poulet 15 min, PDT 20 min, Courgettes 15 min."]
    },
    snack2: { id: uuidv4(), title: "Banane", type: 'snack', ingredients: [{name: "Banane", quantity: "1"}], instructions: [] },
    dinner: {
        id: uuidv4(),
        title: "Saumon, Riz & Epinards Mozza",
        type: 'meal',
        calories: 500,
        ingredients: [{name: "Saumon", quantity: "120g"}, {name: "Riz", quantity: "80g"}, {name: "Epinards", quantity: "100g"}, {name: "Mozza", quantity: "30g"}],
        instructions: ["**Saumon:** Air Fryer.", "**Epinards:** Poêle avec mozza."]
    }
  },
  samedi: {
    breakfast: {
        id: uuidv4(),
        title: "Flocons d'avoine & Compote",
        type: 'breakfast',
        calories: 300,
        ingredients: [{name: "Avoine", quantity: "40g"}, {name: "Lait Amande", quantity: "200ml"}, {name: "Compote", quantity: "100g"}],
        instructions: ["Cuire avoine."]
    },
    snack1: { id: uuidv4(), title: "Fromage Blanc", type: 'snack', ingredients: [{name: "Fromage Blanc", quantity: "125g"}], instructions: [] },
    lunch: {
        id: uuidv4(),
        title: "Dinde, Patate Douce & Haricots Verts",
        type: 'meal',
        calories: 450,
        ingredients: [{name: "Dinde", quantity: "130g"}, {name: "Patate Douce", quantity: "150g"}, {name: "Haricots Verts", quantity: "150g"}],
        instructions: ["**Dinde:** Air Fryer.", "**Patate Douce:** Air Fryer."]
    },
    snack2: { id: uuidv4(), title: "Compote", type: 'snack', ingredients: [{name: "Compote", quantity: "100g"}], instructions: [] },
    dinner: {
        id: uuidv4(),
        title: "Poulet, Quinoa & Brocoli-Carottes",
        type: 'meal',
        calories: 450,
        ingredients: [{name: "Poulet", quantity: "120g"}, {name: "Quinoa", quantity: "80g"}, {name: "Légumes", quantity: "200g"}],
        instructions: ["**Poulet/Légumes:** Air Fryer."]
    }
  },
  dimanche: {
    breakfast: {
        id: uuidv4(),
        title: "Oeufs Brouillés & Pain Grillé",
        type: 'breakfast',
        calories: 350,
        ingredients: [{name: "Oeufs", quantity: "2"}, {name: "Pain", quantity: "1 tr."}, {name: "Banane poêlée", quantity: "1"}],
        instructions: ["Brouiller oeufs."]
    },
    snack1: { id: uuidv4(), title: "Yaourt", type: 'snack', ingredients: [{name: "Yaourt", quantity: "125g"}], instructions: [] },
    lunch: {
        id: uuidv4(),
        title: "Saumon, Pâtes & Courgettes Mozza",
        type: 'meal',
        calories: 500,
        ingredients: [{name: "Saumon", quantity: "130g"}, {name: "Pâtes", quantity: "80g"}, {name: "Courgettes", quantity: "150g"}, {name: "Mozza", quantity: "30g"}],
        instructions: ["**Saumon:** Air Fryer.", "**Pâtes/Légumes:** Mélanger avec mozza."]
    },
    snack2: { id: uuidv4(), title: "Compote", type: 'snack', ingredients: [{name: "Compote", quantity: "100g"}], instructions: [] },
    dinner: {
        id: uuidv4(),
        title: "Poulet Effiloché, PDT & Légumes",
        type: 'meal',
        calories: 450,
        ingredients: [{name: "Poulet", quantity: "120g"}, {name: "Pommes de terre", quantity: "150g"}, {name: "Légumes", quantity: "200g"}],
        instructions: ["Tout cuire et mélanger."]
    }
  }
};

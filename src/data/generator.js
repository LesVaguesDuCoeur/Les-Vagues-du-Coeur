import { v4 as uuidv4 } from 'uuid';

const PROTEINS = [
  { name: 'Saumon', quantity: '130g', type: 'fish', cooking: ['Air Fryer', 'Poêle'] },
  { name: 'Blanc de Poulet', quantity: '130g', type: 'meat', cooking: ['Air Fryer', 'Poêle'] },
  { name: 'Escalope de Dinde', quantity: '130g', type: 'meat', cooking: ['Air Fryer', 'Poêle'] },
  { name: 'Oeufs', quantity: '2', type: 'egg', cooking: ['Poêle', 'Brouillés', 'Pochés'] },
];

const CARBS = [
  { name: 'Riz Basmati', quantity: '80g cuit', cooking: 'Casserole' },
  { name: 'Quinoa', quantity: '80g cuit', cooking: 'Casserole' },
  { name: 'Patate Douce', quantity: '150g', cooking: 'Air Fryer' },
  { name: 'Pommes de Terre', quantity: '150g', cooking: 'Air Fryer' },
  { name: 'Pâtes Semi-complètes', quantity: '80g cuit', cooking: 'Casserole' },
  { name: 'Lentilles Corail', quantity: '80g cuit', cooking: 'Casserole' },
];

const VEGGIES = [
  { name: 'Courgettes', quantity: '200g', cooking: 'Air Fryer' },
  { name: 'Carottes', quantity: '150g', cooking: 'Air Fryer' },
  { name: 'Brocoli', quantity: '150g', cooking: 'Air Fryer' },
  { name: 'Haricots Verts', quantity: '150g', cooking: 'Casserole/Poêle' },
  { name: 'Épinards', quantity: '150g', cooking: 'Poêle' },
  { name: 'Mélange Courgettes/Carottes', quantity: '200g', cooking: 'Air Fryer' },
];

const SEASONINGS = [
  { name: 'Herbes de Provence', label: 'aux Herbes' },
  { name: 'Paprika Doux', label: 'au Paprika' },
  { name: 'Nature', label: 'Nature' },
];

export const generateRecipes = () => {
  const recipes = [];

  // Generate Meals (Lunch/Dinner)
  PROTEINS.forEach(protein => {
    CARBS.forEach(carb => {
      VEGGIES.forEach(veggie => {
        SEASONINGS.forEach(seasoning => {
            const title = `${protein.name} ${seasoning.label}, ${carb.name} & ${veggie.name}`;
            const id = uuidv4();

            const instructions = generateInstructions(protein, carb, veggie, seasoning);

            recipes.push({
                id,
                title,
                type: 'meal',
                tags: ['halal', 'gastrite', 'perte-de-poids', protein.type],
                calories: estimateCalories(protein, carb, veggie),
                ingredients: [
                    { name: protein.name, quantity: protein.quantity },
                    { name: carb.name, quantity: carb.quantity },
                    { name: veggie.name, quantity: veggie.quantity },
                    { name: 'Huile d\'olive', quantity: '1 c.à.c' },
                    { name: seasoning.name, quantity: '1 pincée' }
                ],
                instructions
            });
        });
      });
    });
  });

  // Add Breakfasts
  const breakfasts = generateBreakfasts();
  recipes.push(...breakfasts);

  // Add Snacks
  const snacks = generateSnacks();
  recipes.push(...snacks);

  return recipes;
};

const generateInstructions = (protein, carb, veggie, seasoning) => {
    let steps = [];

    // Protein
    if (protein.cooking.includes('Air Fryer')) {
        steps.push(`**${protein.name} (Air Fryer):** Badigeonner d'huile et de ${seasoning.name}. Cuire à 180°C/190°C pendant 10-15 min (retourner à mi-cuisson).`);
    } else {
        steps.push(`**${protein.name} (Poêle):** Cuire à la poêle antiadhésive sans gras ou peu d'huile, feu moyen.`);
    }

    // Carb
    if (carb.cooking === 'Air Fryer') {
         steps.push(`**${carb.name}:** Couper en cubes, huiler légèrement. Air Fryer 190°C pendant 18-22 min.`);
    } else {
         steps.push(`**${carb.name}:** Cuire à l'eau bouillante selon instructions paquet (viser ${carb.quantity}).`);
    }

    // Veggie
    if (veggie.cooking === 'Air Fryer') {
        steps.push(`**${veggie.name}:** Couper en morceaux. Air Fryer 180°C pendant 12-15 min.`);
    } else {
        steps.push(`**${veggie.name}:** Cuire à la vapeur ou poêle douce.`);
    }

    return steps;
};


const estimateCalories = (p, c, v) => {
    // Rough estimation
    let cal = 0;
    if (p.type === 'fish') cal += 180;
    if (p.type === 'meat') cal += 150;
    if (p.type === 'egg') cal += 140;

    cal += 100; // Average carb portion
    cal += 50; // Veggies
    cal += 40; // Oil
    return cal;
};

const generateBreakfasts = () => {
    return [
        {
            id: uuidv4(),
            title: "Porridge Avoine Banane Cannelle",
            type: 'breakfast',
            tags: ['gastrite', 'petit-dej'],
            calories: 300,
            ingredients: [
                { name: "Flocons d'avoine", quantity: "40g" },
                { name: "Lait d'amande", quantity: "200ml" },
                { name: "Banane", quantity: "1/2" },
                { name: "Cannelle", quantity: "1 pincée" }
            ],
            instructions: ["Mélanger avoine et lait, chauffer 2 min micro-ondes ou casserole. Ajouter banane écrasée et cannelle."]
        },
         {
            id: uuidv4(),
            title: "Overnight Oats Banane",
            type: 'breakfast',
            tags: ['gastrite', 'petit-dej', 'froid'],
            calories: 300,
            ingredients: [
                { name: "Flocons d'avoine", quantity: "40g" },
                { name: "Yaourt 0%", quantity: "100g" },
                { name: "Banane", quantity: "1/2" }
            ],
            instructions: ["Mélanger tout la veille. Laisser au frigo nuit."]
        },
         {
            id: uuidv4(),
            title: "Oeufs Brouillés & Pain Grillé",
            type: 'breakfast',
            tags: ['gastrite', 'petit-dej', 'salé'],
            calories: 320,
            ingredients: [
                { name: "Oeufs", quantity: "2" },
                { name: "Pain complet", quantity: "1 tranche" },
                { name: "Banane", quantity: "1/2 (à côté)" }
            ],
            instructions: ["Brouiller les oeufs doux sans gras. Griller le pain."]
        },
        {
            id: uuidv4(),
            title: "Oeufs Pochés & Pain Grillé",
            type: 'breakfast',
            tags: ['gastrite', 'petit-dej', 'salé'],
            calories: 320,
            ingredients: [
                { name: "Oeufs", quantity: "2" },
                { name: "Pain complet", quantity: "1 tranche" },
                { name: "Compote", quantity: "1 pot" }
            ],
            instructions: ["Pocher les oeufs 3min dans eau frémissante vinaigrée."]
        }
    ];
};

const generateSnacks = () => {
    return [
        {
            id: uuidv4(),
            title: "Yaourt & Amandes",
            type: 'snack',
            ingredients: [{name: "Yaourt Nature 0%", quantity: "125g"}, {name: "Amandes", quantity: "5-6"}],
            calories: 100,
            instructions: ["Mélanger."]
        },
        {
            id: uuidv4(),
            title: "Compote & Amandes",
            type: 'snack',
            ingredients: [{name: "Compote sans sucre", quantity: "100g"}, {name: "Amandes", quantity: "5-6"}],
            calories: 90,
            instructions: ["Déguster frais."]
        },
         {
            id: uuidv4(),
            title: "Banane",
            type: 'snack',
            ingredients: [{name: "Banane", quantity: "1"}],
            calories: 90,
            instructions: ["Manger mûr."]
        },
         {
            id: uuidv4(),
            title: "Fromage Blanc",
            type: 'snack',
            ingredients: [{name: "Fromage Blanc 0%", quantity: "150g"}],
            calories: 80,
            instructions: ["Nature ou avec un peu de cannelle."]
        },
        {
            id: uuidv4(),
            title: "Poire bien mûre",
            type: 'snack',
            ingredients: [{name: "Poire", quantity: "1"}],
            calories: 60,
            instructions: ["Manger mûr."]
        }
    ];
};

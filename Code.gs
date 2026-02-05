const FOLDER_ID = "1_2Skc1s702g70PK9yrAWdBAsCUXAAHg0";
const RECIPES_FILE = "recipes.json";
const FAV_INGREDIENTS_FILE = "favorite_ingredients.json";

function doGet(e) {
  return createJSONOutput(getAllData());
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const payload = request.payload;

    let data = getAllData();
    let recipes = data.recipes;
    let favoriteIngredients = data.favoriteIngredients;
    let recipesChanged = false;
    let ingredientsChanged = false;

    if (action === "import_recipes") {
      const newRecipes = payload.map(r => ({
        ...r,
        id: r.id || Utilities.getUuid(),
        isFavorite: r.isFavorite || false,
        addedAt: new Date().toISOString()
      }));
      recipes = [...recipes, ...newRecipes];
      recipesChanged = true;

    } else if (action === "delete_recipe") {
      recipes = recipes.filter(r => r.id !== payload.id);
      recipesChanged = true;

    } else if (action === "bulk_delete_ingredient") {
      const ingredientToRemove = payload.ingredient.toLowerCase().trim();
      if (ingredientToRemove) {
        recipes = recipes.filter(r => {
          // Check if any ingredient in the recipe matches the one to remove
          const hasIngredient = r.ingredients && r.ingredients.some(i => i.toLowerCase().includes(ingredientToRemove));
          return !hasIngredient;
        });
        recipesChanged = true;
      }

    } else if (action === "toggle_favorite") {
       recipes = recipes.map(r => {
         if (r.id === payload.id) {
           return { ...r, isFavorite: !r.isFavorite };
         }
         return r;
       });
       recipesChanged = true;

    } else if (action === "toggle_ingredient_favorite") {
       const ingredient = payload.ingredient;
       if (favoriteIngredients.includes(ingredient)) {
         favoriteIngredients = favoriteIngredients.filter(i => i !== ingredient);
       } else {
         favoriteIngredients.push(ingredient);
       }
       ingredientsChanged = true;

    } else {
      return createJSONOutput({ error: "Unknown action" });
    }

    if (recipesChanged) saveRecipes(recipes);
    if (ingredientsChanged) saveFavoriteIngredients(favoriteIngredients);

    return createJSONOutput({
      success: true,
      recipes: recipes,
      favoriteIngredients: favoriteIngredients
    });

  } catch (err) {
    return createJSONOutput({ error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getFolder() {
  return DriveApp.getFolderById(FOLDER_ID);
}

function getAllData() {
  return {
    recipes: getListFromFile(RECIPES_FILE),
    favoriteIngredients: getListFromFile(FAV_INGREDIENTS_FILE)
  };
}

function getListFromFile(filename) {
  try {
    const folder = getFolder();
    const files = folder.getFilesByName(filename);
    if (files.hasNext()) {
      const file = files.next();
      const content = file.getBlob().getDataAsString();
      return content ? JSON.parse(content) : [];
    }
  } catch (e) {
    // Return empty list if file doesn't exist or error parsing
  }
  return [];
}

function saveRecipes(data) {
  saveFile(RECIPES_FILE, data);
}

function saveFavoriteIngredients(data) {
  saveFile(FAV_INGREDIENTS_FILE, data);
}

function saveFile(filename, data) {
  const folder = getFolder();
  const files = folder.getFilesByName(filename);
  if (files.hasNext()) {
    files.next().setContent(JSON.stringify(data));
  } else {
    folder.createFile(filename, JSON.stringify(data));
  }
}

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

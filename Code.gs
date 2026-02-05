const FOLDER_ID = "1_2Skc1s702g70PK9yrAWdBAsCUXAAHg0";
const FILE_NAME = "recipes.json";

function doGet(e) {
  return createJSONOutput(getRecipes());
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const payload = request.payload;
    let result = {};
    let recipes = getRecipes();

    if (action === "import_recipes") {
      const newRecipes = payload.map(r => ({
        ...r,
        id: r.id || Utilities.getUuid(),
        isFavorite: r.isFavorite || false,
        addedAt: new Date().toISOString()
      }));
      recipes = [...recipes, ...newRecipes];
      saveRecipes(recipes);
      result = { success: true, recipes: recipes };
    } else if (action === "delete_recipe") {
      const originalLength = recipes.length;
      recipes = recipes.filter(r => r.id !== payload.id);
      if (recipes.length !== originalLength) saveRecipes(recipes);
      result = { success: true, recipes: recipes };
    } else if (action === "bulk_delete_ingredient") {
      const ingredient = payload.ingredient.toLowerCase().trim();
      if (ingredient) {
        recipes = recipes.filter(r => {
          const hasIngredient = r.ingredients && r.ingredients.some(i => i.toLowerCase().includes(ingredient));
          return !hasIngredient;
        });
        saveRecipes(recipes);
      }
      result = { success: true, recipes: recipes };
    } else if (action === "toggle_favorite") {
       let updated = false;
       recipes = recipes.map(r => {
         if (r.id === payload.id) {
           updated = true;
           return { ...r, isFavorite: !r.isFavorite };
         }
         return r;
       });
       if (updated) saveRecipes(recipes);
       result = { success: true, recipes: recipes };
    } else {
      result = { error: "Unknown action" };
    }
    return createJSONOutput(result);
  } catch (err) {
    return createJSONOutput({ error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getFolder() {
  return DriveApp.getFolderById(FOLDER_ID);
}

function getRecipes() {
  try {
    const folder = getFolder();
    const files = folder.getFilesByName(FILE_NAME);
    if (files.hasNext()) {
      const file = files.next();
      return JSON.parse(file.getBlob().getDataAsString());
    }
  } catch (e) {}
  return [];
}

function saveRecipes(data) {
  const folder = getFolder();
  const files = folder.getFilesByName(FILE_NAME);
  if (files.hasNext()) {
    files.next().setContent(JSON.stringify(data));
  } else {
    folder.createFile(FILE_NAME, JSON.stringify(data));
  }
}

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
// ===========================================
// CODE_RECIPES.GS - Gestion des Recettes Custom
// Dossier Google Drive : 1_2Skc1s702g70PK9yrAWdBAsCUXAAHg0
// ===========================================

const FOLDER_ID = '1_2Skc1s702g70PK9yrAWdBAsCUXAAHg0';
const RECIPES_FILE_NAME = 'GastroPlan_CustomRecipes.json';

function doGet(e) {
  const action = e.parameter.action || 'load';

  try {
    if (action === 'loadRecipes') {
      const recipes = loadCustomRecipes();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        recipes: recipes
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Action inconnue'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    let payload;
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Pas de donnees'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const action = payload.action || 'addRecipe';

    if (action === 'addRecipe') {
      const newRecipe = payload.recipe;
      if (!newRecipe || !newRecipe.nom) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Recette invalide'
        })).setMimeType(ContentService.MimeType.JSON);
      }

      // Generer un ID unique
      newRecipe.id = 'custom-' + Date.now();
      newRecipe.isCustom = true;
      newRecipe.createdAt = new Date().toISOString();

      // Charger les recettes existantes
      let allRecipes = loadCustomRecipes();
      allRecipes.push(newRecipe);

      // Sauvegarder
      saveCustomRecipes(allRecipes);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Recette ajoutee',
        recipe: newRecipe
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'deleteRecipe') {
      const recipeId = payload.recipeId;
      let allRecipes = loadCustomRecipes();
      allRecipes = allRecipes.filter(r => r.id !== recipeId);
      saveCustomRecipes(allRecipes);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Recette supprimee'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'updateRecipe') {
      const updatedRecipe = payload.recipe;
      let allRecipes = loadCustomRecipes();
      const index = allRecipes.findIndex(r => r.id === updatedRecipe.id);
      if (index !== -1) {
        allRecipes[index] = {...allRecipes[index], ...updatedRecipe, updatedAt: new Date().toISOString()};
        saveCustomRecipes(allRecipes);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Recette mise a jour'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Action inconnue'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function loadCustomRecipes() {
  try {
    const file = getOrCreateRecipesFile();
    const content = file.getBlob().getDataAsString();
    if (!content || content.trim() === '' || content === '[]') {
      return [];
    }
    return JSON.parse(content);
  } catch (e) {
    Logger.log('Erreur loadCustomRecipes: ' + e.toString());
    return [];
  }
}

function saveCustomRecipes(recipes) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);

    // Supprimer l'ancien fichier
    const files = folder.getFilesByName(RECIPES_FILE_NAME);
    while (files.hasNext()) {
      files.next().setTrashed(true);
    }

    // Creer le nouveau
    folder.createFile(RECIPES_FILE_NAME, JSON.stringify(recipes, null, 2), MimeType.PLAIN_TEXT);
    Logger.log('Recettes sauvegardees: ' + recipes.length);
    return true;
  } catch (e) {
    Logger.log('Erreur saveCustomRecipes: ' + e.toString());
    throw e;
  }
}

function getOrCreateRecipesFile() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByName(RECIPES_FILE_NAME);

  if (files.hasNext()) {
    return files.next();
  }

  // Creer le fichier vide
  return folder.createFile(RECIPES_FILE_NAME, '[]', MimeType.PLAIN_TEXT);
}

// Test
function testRecipes() {
  const recipes = loadCustomRecipes();
  Logger.log('Recettes custom: ' + recipes.length);
  return recipes;
}

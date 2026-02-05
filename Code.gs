const FOLDER_ID = "1_2Skc1s702g70PK9yrAWdBAsCUXAAHg0";
const FILES = {
  RECIPES: "GastroPlan_Recettes.json",
  MENUS: "GastroPlan_Menus.json",
  FAVORITES: "GastroPlan_Favoris.json",
  SETTINGS: "GastroPlan_Settings.json",
  FORBIDDEN: "GastroPlan_Interdits.json"
};

function doGet(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = loadAllData();
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    if (!e.postData || !e.postData.contents) {
      return createOutput({ success: false, error: "No data" });
    }

    const request = JSON.parse(e.postData.contents);
    const action = request.action;

    if (action === 'save') {
      // General save (Menu, Favorites, Settings)
      saveData(request);
      return createOutput({ success: true, message: "Sauvegarde effectuée" });
    }

    if (action === 'import_recipes') {
      const result = importRecipes(request.recipes);
      return createOutput(result);
    }

    if (action === 'delete_recipes') {
      const result = deleteRecipes(request.recipeIds);
      return createOutput(result);
    }

    return createOutput({ success: false, error: "Action inconnue" });

  } catch (error) {
    return createOutput({ success: false, error: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getFolder() {
  return DriveApp.getFolderById(FOLDER_ID);
}

function getFileContent(filename, defaultVal) {
  const folder = getFolder();
  const files = folder.getFilesByName(filename);
  if (files.hasNext()) {
    try {
      return JSON.parse(files.next().getBlob().getDataAsString());
    } catch (e) { return defaultVal; }
  }
  return defaultVal;
}

function writeFileContent(filename, data) {
  const folder = getFolder();
  const files = folder.getFilesByName(filename);
  const content = JSON.stringify(data);
  if (files.hasNext()) {
    files.next().setContent(content);
  } else {
    folder.createFile(filename, content, MimeType.PLAIN_TEXT);
  }
}

function loadAllData() {
  return {
    recipes: getFileContent(FILES.RECIPES, []),
    menus: getFileContent(FILES.MENUS, {}),
    favorites: getFileContent(FILES.FAVORITES, []),
    settings: getFileContent(FILES.SETTINGS, {}),
    forbidden: getFileContent(FILES.FORBIDDEN, null) // null means use default client-side
  };
}

function saveData(payload) {
  if (payload.menu) {
    let menus = getFileContent(FILES.MENUS, {});
    if (payload.weekKey && payload.menu) {
      menus[payload.weekKey] = payload.menu;
      writeFileContent(FILES.MENUS, menus);
    }
  }

  if (payload.recipes) {
    writeFileContent(FILES.RECIPES, payload.recipes);
  }

  if (payload.favorites) {
    writeFileContent(FILES.FAVORITES, payload.favorites);
  }

  if (payload.ramadanMode !== undefined) {
    let settings = getFileContent(FILES.SETTINGS, {});
    settings.ramadanMode = payload.ramadanMode;
    writeFileContent(FILES.SETTINGS, settings);
  }
}

function importRecipes(newRecipes) {
  if (!Array.isArray(newRecipes)) return { success: false, error: "Format invalide" };

  let currentRecipes = getFileContent(FILES.RECIPES, []);
  let addedCount = 0;

  newRecipes.forEach(newR => {
    // Check duplication by ID
    const exists = currentRecipes.find(r => r.id === newR.id);
    if (!exists) {
      currentRecipes.push(newR);
      addedCount++;
    } else {
      // Update existing
      Object.assign(exists, newR);
    }
  });

  writeFileContent(FILES.RECIPES, currentRecipes);
  return { success: true, message: addedCount + " recettes importées", recipes: currentRecipes };
}

function deleteRecipes(idsToDelete) {
  if (!Array.isArray(idsToDelete)) return { success: false, error: "IDs invalides" };

  let currentRecipes = getFileContent(FILES.RECIPES, []);
  const initialCount = currentRecipes.length;
  currentRecipes = currentRecipes.filter(r => !idsToDelete.includes(r.id));

  if (currentRecipes.length !== initialCount) {
    writeFileContent(FILES.RECIPES, currentRecipes);
  }

  return { success: true, message: "Recettes supprimées", recipes: currentRecipes };
}

function createOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
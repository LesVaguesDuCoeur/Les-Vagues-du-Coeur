const FOLDER_ID = "1_2Skc1s702g70PK9yrAWdBAsCUXAAHg0";
const RECIPES_FILE = "GastroPlan_Recettes.json";
const DATA_FILE = "GastroPlan_Data.json";

function doGet(e) {
  const data = loadAllData();
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Wait for up to 30 seconds for other processes to finish.
    lock.waitLock(30000);

    if (!e.postData || !e.postData.contents) {
      return createError("No data provided");
    }

    const request = JSON.parse(e.postData.contents);
    const action = request.action;

    if (action === 'save') {
      saveData(request);
      return createSuccess({ message: "Saved successfully" });
    }

    return createError("Unknown action");

  } catch (error) {
    return createError(error.toString());
  } finally {
    lock.releaseLock();
  }
}

function loadAllData() {
  const folder = getFolder();

  // Load Recipes
  let recipes = [];
  const recipeFiles = folder.getFilesByName(RECIPES_FILE);
  if (recipeFiles.hasNext()) {
    try {
      const content = recipeFiles.next().getBlob().getDataAsString();
      recipes = JSON.parse(content);
    } catch (e) { recipes = []; }
  }

  // Load Other Data (Menu, Favorites, Settings)
  let otherData = { menu: null, favorites: [], ramadanMode: false };
  const dataFiles = folder.getFilesByName(DATA_FILE);
  if (dataFiles.hasNext()) {
    try {
      const content = dataFiles.next().getBlob().getDataAsString();
      otherData = JSON.parse(content);
    } catch (e) { }
  }

  return {
    recipes: Array.isArray(recipes) ? recipes : [],
    menu: otherData.menu || null,
    favorites: Array.isArray(otherData.favorites) ? otherData.favorites : [],
    ramadanMode: !!otherData.ramadanMode
  };
}

function saveData(payload) {
  const folder = getFolder();

  // Save Recipes if provided (it might be large, so only if sent)
  if (payload.recipes) {
    const files = folder.getFilesByName(RECIPES_FILE);
    if (files.hasNext()) {
      files.next().setContent(JSON.stringify(payload.recipes));
    } else {
      folder.createFile(RECIPES_FILE, JSON.stringify(payload.recipes), MimeType.PLAIN_TEXT);
    }
  }

  // Save Other Data
  const otherData = {
    menu: payload.menu,
    favorites: payload.favorites,
    ramadanMode: payload.ramadanMode
  };

  const files = folder.getFilesByName(DATA_FILE);
  if (files.hasNext()) {
    files.next().setContent(JSON.stringify(otherData));
  } else {
    folder.createFile(DATA_FILE, JSON.stringify(otherData), MimeType.PLAIN_TEXT);
  }
}

function getFolder() {
  return DriveApp.getFolderById(FOLDER_ID);
}

function createSuccess(data) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, ...data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function createError(message) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

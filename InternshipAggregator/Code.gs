// Code.gs
// Backend for Job Aggregator
// Handles persistence of user data to Google Drive

const FOLDER_ID = '1-fTOnfKF1h2U33Y69BFtW-ZKXnDuCwGO'; // User provided folder ID
const FILES = {
  FAVORITES: 'favorites.json',
  APPLIED: 'applied.json',
  HIDDEN: 'hidden.json',
  PREFERENCES: 'preferences.json'
};

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'getUserData') {
    return getUserData();
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // Handle CORS
  if (e.postData && e.postData.type === "application/json") {
      // It's a JSON payload
      // GAS doPost normally receives form data, but if we send JSON blob, we need to parse it
      // However, typical fetch with CORS to GAS often uses text/plain to avoid preflight issues or handling it manually.
      // We'll assume the client sends JSON string in the body.
  }

  // To simplify CORS issues, we often treat GET and POST similarly or ensure we return correct headers.
  // Actually, standard GAS `doPost` output handles CORS if returning ContentService.

  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return response({ status: 'error', message: 'Invalid JSON body' });
  }

  const action = data.action;
  const payload = data.payload;

  switch (action) {
    case 'saveJob':
      return addItem(FILES.FAVORITES, payload);
    case 'removeSavedJob':
      return removeItem(FILES.FAVORITES, payload.id);
    case 'markApplied':
      return addItem(FILES.APPLIED, payload); // Payload includes date
    case 'hideJob':
      return addItem(FILES.HIDDEN, payload); // Payload might just be ID or object
    case 'savePreferences':
      return saveFile(FILES.PREFERENCES, payload);
    default:
      return response({ status: 'error', message: 'Unknown action' });
  }
}

function getUserData() {
  const favorites = getFileContent(FILES.FAVORITES) || [];
  const applied = getFileContent(FILES.APPLIED) || [];
  const hidden = getFileContent(FILES.HIDDEN) || [];
  const preferences = getFileContent(FILES.PREFERENCES) || {};

  return response({
    status: 'success',
    data: {
      favorites,
      applied,
      hidden,
      preferences
    }
  });
}

function addItem(filename, item) {
  const list = getFileContent(filename) || [];
  // Check if exists to avoid duplicates (based on ID)
  const existingIndex = list.findIndex(i => i.id === item.id);

  if (existingIndex > -1) {
    // Update existing
    list[existingIndex] = item;
  } else {
    list.push(item);
  }

  saveFile(filename, list);
  return response({ status: 'success', data: list });
}

function removeItem(filename, id) {
  let list = getFileContent(filename) || [];
  list = list.filter(item => item.id !== id);
  saveFile(filename, list);
  return response({ status: 'success', data: list });
}

function getFileContent(filename) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByName(filename);
  if (files.hasNext()) {
    const file = files.next();
    const content = file.getBlob().getDataAsString();
    try {
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function saveFile(filename, content) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByName(filename);
  const jsonContent = JSON.stringify(content, null, 2);

  if (files.hasNext()) {
    const file = files.next();
    file.setContent(jsonContent);
  } else {
    folder.createFile(filename, jsonContent, MimeType.PLAIN_TEXT);
  }
  return response({ status: 'success' });
}

function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

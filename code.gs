// ===========================================
// CODE.GS - GOOGLE APPS SCRIPT POUR GASTROPLAN
// A copier dans : Extensions > Apps Script
// ===========================================

// ID du dossier Google Drive ou sauvegarder (creer un dossier et copier son ID depuis l'URL)
const FOLDER_ID = '1_2Skc1s702g70PK9yrAWdBAsCUXAAHg0';
const FILE_NAME = 'GastroPlan_Backup.json';

function doGet(e) {
  return handleCORS(handleGetRequest(e));
}

function doPost(e) {
  return handleCORS(handlePostRequest(e));
}

function handleCORS(response) {
  return ContentService.createTextOutput(response)
    .setMimeType(ContentService.MimeType.JSON);
}

function handleGetRequest(e) {
  try {
    const action = e.parameter.action || 'load';
    const weekKey = e.parameter.weekKey || 'default';

    if (action === 'load') {
      const data = loadData();
      if (data && data.menus && data.menus[weekKey]) {
        return JSON.stringify({
          success: true,
          menu: data.menus[weekKey],
          favorites: data.favorites || [],
          settings: data.settings || {}
        });
      }
      return JSON.stringify({
        success: false,
        message: 'Aucune donnee trouvee pour ' + weekKey
      });
    }

    if (action === 'loadAll') {
      const data = loadData();
      return JSON.stringify({
        success: true,
        data: data
      });
    }

    return JSON.stringify({success: false, message: 'Action inconnue'});

  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error.toString()
    });
  }
}

function handlePostRequest(e) {
  try {
    let payload;

    // Parser le body
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      return JSON.stringify({success: false, error: 'Pas de donnees recues'});
    }

    const action = payload.action || 'save';

    if (action === 'save') {
      const weekKey = payload.weekKey || 'default';
      const menuData = payload.menu;
      const favorites = payload.favorites || [];
      const settings = payload.settings || {};

      // Charger donnees existantes ou creer nouveau
      let allData = loadData() || {
        menus: {},
        favorites: [],
        settings: {},
        lastUpdated: null
      };

      // Mettre a jour
      allData.menus[weekKey] = menuData;
      allData.favorites = favorites;
      allData.settings = settings;
      allData.lastUpdated = new Date().toISOString();

      // Sauvegarder
      saveData(allData);

      return JSON.stringify({
        success: true,
        message: 'Sauvegarde OK',
        timestamp: allData.lastUpdated
      });
    }

    if (action === 'delete') {
      const weekKey = payload.weekKey;
      let allData = loadData();
      if (allData && allData.menus && allData.menus[weekKey]) {
        delete allData.menus[weekKey];
        saveData(allData);
        return JSON.stringify({success: true, message: 'Semaine supprimee'});
      }
      return JSON.stringify({success: false, message: 'Semaine non trouvee'});
    }

    return JSON.stringify({success: false, message: 'Action inconnue'});

  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error.toString(),
      stack: error.stack
    });
  }
}

// ========== FONCTIONS DRIVE ==========

function loadData() {
  try {
    const file = getOrCreateFile();
    const content = file.getBlob().getDataAsString();
    if (!content || content.trim() === '') {
      return null;
    }
    return JSON.parse(content);
  } catch (e) {
    Logger.log('Erreur loadData: ' + e.toString());
    return null;
  }
}

function saveData(data) {
  try {
    const file = getOrCreateFile();
    const jsonString = JSON.stringify(data, null, 2);

    // Supprimer l'ancien fichier et en creer un nouveau avec le meme nom
    const folder = DriveApp.getFolderById(FOLDER_ID);
    file.setTrashed(true);

    folder.createFile(FILE_NAME, jsonString, MimeType.PLAIN_TEXT);

    Logger.log('Sauvegarde reussie: ' + new Date().toISOString());
    return true;
  } catch (e) {
    Logger.log('Erreur saveData: ' + e.toString());
    throw e;
  }
}

function getOrCreateFile() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByName(FILE_NAME);

  if (files.hasNext()) {
    Logger.log('Fichier existant trouve');
    return files.next();
  }

  // Creer le fichier s'il n'existe pas
  Logger.log('Creation du fichier de sauvegarde');
  const initialData = {
    menus: {},
    favorites: [],
    settings: {},
    created: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };

  const newFile = folder.createFile(FILE_NAME, JSON.stringify(initialData, null, 2), MimeType.PLAIN_TEXT);
  return newFile;
}

// ========== FONCTION DE TEST ==========

function testSetup() {
  try {
    // Test acces au dossier
    const folder = DriveApp.getFolderById(FOLDER_ID);
    Logger.log('Dossier trouve: ' + folder.getName());

    // Test creation/lecture fichier
    const file = getOrCreateFile();
    Logger.log('Fichier: ' + file.getName() + ' (ID: ' + file.getId() + ')');

    // Test sauvegarde
    const testData = {
      menus: {
        'test-week': {
          lundi: {petit_dejeuner: {nom: 'Test'}}
        }
      },
      favorites: [],
      settings: {},
      lastUpdated: new Date().toISOString()
    };

    saveData(testData);
    Logger.log('Test sauvegarde OK');

    // Test lecture
    const loaded = loadData();
    Logger.log('Test lecture OK: ' + JSON.stringify(loaded).substring(0, 100));

    return 'TOUS LES TESTS OK';
  } catch (e) {
    Logger.log('ERREUR: ' + e.toString());
    return 'ERREUR: ' + e.toString();
  }
}

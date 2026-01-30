// code.gs - À copier dans Google Apps Script

// Configuration
const SPREADSHEET_ID = 'REMPLACER_PAR_VOTRE_ID'; // L'utilisateur mettra son ID

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();

    if (e.postData) {
      // POST - Sauvegarder le menu
      const data = JSON.parse(e.postData.contents);

      // Ajouter une ligne avec timestamp et données
      sheet.appendRow([
        new Date().toISOString(),
        JSON.stringify(data.menu),
        'SAVE'
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Menu sauvegardé'
      })).setMimeType(ContentService.MimeType.JSON);

    } else {
      // GET - Récupérer le dernier menu sauvegardé
      const lastRow = sheet.getLastRow();
      if (lastRow > 0) {
        const menuData = sheet.getRange(lastRow, 2).getValue();
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          menu: JSON.parse(menuData)
        })).setMimeType(ContentService.MimeType.JSON);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Aucun menu sauvegardé'
      })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Fonction pour initialiser la feuille
function setupSheet() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  sheet.getRange('A1:C1').setValues([['Timestamp', 'Menu Data', 'Action']]);
  sheet.setFrozenRows(1);
}

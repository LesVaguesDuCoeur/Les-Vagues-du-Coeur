// Constants obfuscated in Base64 for basic obfuscation.
// Folder ID and Filename are not specified, using Google Sheets per specs.

// In the current context, the specs mention "Google Sheets comme base de données".
// To operate generically in Google Apps Script attached to a Spreadsheet or standalone using PropertiesService/DriveApp:
// Here we'll assume a specific sheet name 'Data'.
const SHEET_NAME_B64 = "RGF0YQ=="; // "Data"

function _dec(b64) {
  return Utilities.newBlob(Utilities.base64Decode(b64)).getDataAsString();
}

function _getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // If no spreadsheet is active (standalone), this would fail. We'd need a specific ID.
  // Assuming the script is bound to a Google Sheet as standard.
  if(!ss) {
    throw new Error("Script must be bound to a Google Sheet");
  }
  let sheet = ss.getSheetByName(_dec(SHEET_NAME_B64));
  if (!sheet) {
    sheet = ss.insertSheet(_dec(SHEET_NAME_B64));
  }
  return sheet;
}

function _getData() {
  const sheet = _getSheet();
  const range = sheet.getRange(1, 1);
  const data = range.getValue();
  if (!data) return {};
  try {
    return JSON.parse(data);
  } catch(e) {
    return {};
  }
}

function _saveData(obj) {
  const sheet = _getSheet();
  sheet.getRange(1, 1).setValue(JSON.stringify(obj));
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    let result = {};

    if (action === 'setup') {
      const data = payload.data;
      const currentData = _getData();

      // Update data with hashes and email
      currentData.contactHash = data.contactHash;
      currentData.adminHash = data.adminHash;
      currentData.vaultHash = data.vaultHash;
      currentData.testamentHash = data.testamentHash;
      currentData.email = data.email;
      currentData.encryptedContactKey = data.encryptedContactKey;
      currentData.encryptedVaultKey = data.encryptedVaultKey;
      currentData.encryptedTestamentKey = data.encryptedTestamentKey;

      _saveData(currentData);
      result = { status: 'success', message: 'Setup complet.' };

    } else if (action === 'save') {
      // payload is { action: 'save', data: actualData }
      const actualData = payload.data;
      const currentData = _getData();

      // Merge properties. Actual data may contain contacts, vault, or testament.
      // We overwrite existing keys with the new ones provided.
      for (const key in actualData) {
        currentData[key] = actualData[key];
      }

      _saveData(currentData);
      result = { status: 'success', message: 'Sauvegardé.' };

    } else if (action === 'load') {
      result = _getData();

    } else if (action === 'emergencyAccess') {
      // payload is { action: 'emergencyAccess', name: '...', section: '...', timestamp: '...' }
      const currentData = _getData();
      const configEmail = currentData.email;

      const subject = `[URGENCE] Accès à la section: ${payload.section}`;
      const body = `Bonjour,\n\n` +
                   `Une personne a accédé à vos informations sécurisées.\n\n` +
                   `Détails :\n` +
                   `- Personne : ${payload.name}\n` +
                   `- Section : ${payload.section}\n` +
                   `- Date/Heure : ${payload.timestamp}\n\n` +
                   `Ceci est une alerte automatique.`;

      // Send to configured email if it exists
      if (configEmail) {
         try { MailApp.sendEmail(configEmail, subject, body); } catch(e){}
      }

      result = { status: 'success', message: 'Alerte envoyée.' };
    } else {
      result = { status: 'error', message: 'Action inconnue.' };
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Enable CORS for testing if necessary
function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

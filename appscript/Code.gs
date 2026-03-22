const FOLDER_ID = '1OCvYhOgw8Qj8hxSRppt7Q7Ux8ZLtgxER';
const FILE_NAME = 'secure_contacts_data.json';
const ALERT_EMAIL = 'lyesmadhi@icloud.com';

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    };

    if (method === 'GET') {
      const data = getData();
      return createJsonResponse(data, headers);
    }

    if (method === 'POST') {
      const payload = JSON.parse(e.postData.contents);

      if (payload.emergencyAccess) {
        sendEmergencyAlert(payload);
        return createJsonResponse({ success: true, message: 'Alert sent' }, headers);
      }

      // Save data
      const success = saveData(payload);
      return createJsonResponse({ success: success }, headers);
    }
  } catch (error) {
    return createJsonResponse({ error: error.message }, {
      'Access-Control-Allow-Origin': '*'
    });
  }
}

function createJsonResponse(data, headers) {
  const response = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return response;
}

function getFile() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByName(FILE_NAME);
  if (files.hasNext()) {
    return files.next();
  }
  return null;
}

function getData() {
  const file = getFile();
  if (!file) {
    return { isSetup: false };
  }
  const content = file.getBlob().getDataAsString();
  return JSON.parse(content);
}

function saveData(data) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  let file = getFile();

  if (file) {
    file.setContent(JSON.stringify(data));
  } else {
    folder.createFile(FILE_NAME, JSON.stringify(data), MimeType.PLAIN_TEXT);
  }
  return true;
}

function sendEmergencyAlert(data) {
  const timestamp = new Date().toLocaleString('fr-FR');
  const ip = data.ip || 'non disponible';
  const userAgent = data.userAgent || 'non disponible';
  const gps = data.gps ? `${data.gps.lat}, ${data.gps.lng}` : 'non disponible';

  const subject = '⚠️ ALERTE URGENCE — Accès au carnet de contacts';
  const message = `⚠️ ALERTE URGENCE — Accès au carnet de contacts
Date : ${timestamp}
IP : ${ip}
Navigateur : ${userAgent}
Localisation GPS : ${gps}

Cet accès a été réalisé via le mot de passe d'urgence.`;

  GmailApp.sendEmail(ALERT_EMAIL, subject, message);
}

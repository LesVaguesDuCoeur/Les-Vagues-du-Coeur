var _x = function(s) {
  var b = Utilities.base64Decode(s);
  return b.reduce(function(r,c){return r+String.fromCharCode(c);}, '');
};
var FOLDER_ID   = _x('MU9DdlloT2d3OFFqOGh4U1JwcHQ3UTdVeDhaTHRneEVS');
var DATA_FILE   = _x('c2VjdXJlX2NvbnRhY3RzX2RhdGEuanNvbg==');
var ALERT_EMAIL = _x('bHllc21hZGhpQGljbG91ZC5jb20=');

function doGet(e) {
  return _hr(e, 'GET');
}

function doPost(e) {
  return _hr(e, 'POST');
}

function _hr(e, method) {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    };

    if (method === 'GET') {
      const data = _gd();
      return _jr(data, headers);
    }

    if (method === 'POST') {
      const payload = JSON.parse(e.postData.contents);

      if (payload.emergencyAccess) {
        _ea(payload);
        return _jr({ success: true, message: 'Alert sent' }, headers);
      }

      if (payload.action === 'testamentAccess') {
        sendTestamentAlert(payload);
        return _jr({ success: true }, headers);
      }

      const success = _sd(payload);
      return _jr({ success: success }, headers);
    }
  } catch (error) {
    return _jr({ error: error.message }, {
      'Access-Control-Allow-Origin': '*'
    });
  }
}

function _jr(data, headers) {
  const response = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return response;
}

function _gf() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFilesByName(DATA_FILE);
  if (files.hasNext()) {
    return files.next();
  }
  return null;
}

function _gd() {
  const file = _gf();
  if (!file) {
    return { isSetup: false };
  }
  const content = file.getBlob().getDataAsString();
  return JSON.parse(content);
}

function _sd(data) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  let file = _gf();

  if (file) {
    file.setContent(JSON.stringify(data));
  } else {
    folder.createFile(DATA_FILE, JSON.stringify(data), MimeType.PLAIN_TEXT);
  }
  return true;
}

function _ea(data) {
  const timestamp = new Date().toLocaleString('fr-FR');
  const ip = data.ip || 'non disponible';
  const userAgent = data.userAgent || 'non disponible';
  const gps = data.gps ? `${data.gps.lat}, ${data.gps.lng}` : 'non disponible';

  const subject = '⚠️ ALERTE URGENCE — Accès au carnet de contacts';
  const message = `⚠️ ALERTE URGENCE — Accès au carnet de contacts\nDate : ${timestamp}\nIP : ${ip}\nNavigateur : ${userAgent}\nLocalisation GPS : ${gps}\n\nCet accès a été réalisé via le mot de passe d'urgence.`;

  GmailApp.sendEmail(ALERT_EMAIL, subject, message);
}

function sendTestamentAlert(data) {
  var timestamp = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
  var nom = data.nomDeclare || 'Inconnu';
  var ua = data.userAgent || 'N/A';
  var body = [
    '⚠️ ALERTE : Accès au testament',
    '',
    'Date : ' + timestamp,
    'Nom déclaré : ' + nom,
    'Navigateur : ' + ua,
    '',
    'Si vous n\'êtes pas à l\'origine de cet accès, changez vos mots de passe immédiatement.'
  ].join('\n');

  GmailApp.sendEmail(ALERT_EMAIL, '⚠️ Accès à votre Testament — ' + nom, body);
}

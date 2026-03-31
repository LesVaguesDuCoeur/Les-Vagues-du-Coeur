const _x = (s) => Utilities.base64Decode(s).reduce((r,b) => r + String.fromCharCode(b), '');
const _0 = _x('MU9DdlloT2d3OFFqOGh4U1JwcHQ3UTdVeDhaTHRneEVS');
const _1 = _x('c2VjdXJlX2NvbnRhY3RzX2RhdGEuanNvbg==');
const _2 = _x('bHllc21hZGhpQGljbG91ZC5jb20=');

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
        _ta(payload);
        return _jr({ success: true, message: 'Testament alert sent' }, headers);
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
  const folder = DriveApp.getFolderById(_0);
  const files = folder.getFilesByName(_1);
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
  const folder = DriveApp.getFolderById(_0);
  let file = _gf();

  if (file) {
    file.setContent(JSON.stringify(data));
  } else {
    folder.createFile(_1, JSON.stringify(data), MimeType.PLAIN_TEXT);
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

  GmailApp.sendEmail(_2, subject, message);
}

function _ta(data) {
  const timestamp = new Date().toLocaleString('fr-FR');
  const ip = data.ip || 'non disponible';
  const userAgent = data.userAgent || 'non disponible';
  const gps = data.gps ? `${data.gps.lat}, ${data.gps.lng}` : 'non disponible';
  const nom = data.nomDeclare || 'Inconnu';

  const subject = '📜 ALERTE — Accès au Testament';
  const message = `📜 ACCÈS AU TESTAMENT\nDate/heure : ${timestamp}\nNom déclaré : ${nom}\nIP : ${ip}\nNavigateur : ${userAgent}\nLocalisation GPS : ${gps}\n\nCet accès a été réalisé via le mot de passe du testament.`;

  GmailApp.sendEmail(_2, subject, message);
}

// CONSTANTS (Base64 obfuscated to prevent easy scraping)
// 1OCvYhOgw8Qj8hxSRppt7Q7Ux8ZLtgxER -> MU9DdlloT2d3OFFqOGh4U1JwcHQ3UTdVeDhaTHRneEVS
// secure_contacts_data.json -> c2VjdXJlX2NvbnRhY3RzX2RhdGEuanNvbg==
// lyesmadhi@icloud.com -> bHllc21hZGhpQGljbG91ZC5jb20=

function _gB(str) {
  return Utilities.newBlob(Utilities.base64Decode(str)).getDataAsString();
}

var _F_ID = _gB('MU9DdlloT2d3OFFqOGh4U1JwcHQ3UTdVeDhaTHRneEVS');
var _F_NM = _gB('c2VjdXJlX2NvbnRhY3RzX2RhdGEuanNvbg==');
var _A_EM = _gB('bHllc21hZGhpQGljbG91ZC5jb20=');

function _gHF() {
  var d = DriveApp.getFolderById(_F_ID);
  var f = d.getFilesByName(_F_NM);
  if (f.hasNext()) {
    return f.next();
  }
  return null;
}

function doGet(e) {
  try {
    var f = _gHF();
    var data = null;
    if (f) {
      data = f.getBlob().getDataAsString();
    } else {
      data = JSON.stringify({ isSetup: false });
    }
    return ContentService.createTextOutput(data).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message, isSetup: false })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var payload;
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'No payload' })).setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.action === 'emergencyAccess' || payload.emergencyAccess === true) {
      _sEA(payload);
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.action === 'vaultAccess' || payload.vaultAccess === true || payload.action === 'testamentAccess' || payload.testamentAccess === true) {
      _sAA(payload);
      // We can also let the backend append an encrypted log entry to the accessLogs array
      // But wait, the backend doesn't have the encryption key.
      // We must append to an unencrypted log buffer, or the frontend must send an encrypted log entry.
      // We will handle it by letting the frontend append it.
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.action === 'suspiciousActivity' || payload.suspiciousActivity === true) {
      _sSA(payload);
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.action === 'panicAlert' || payload.panicAlert === true) {
      _sPA(payload);
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // Save data (Setup or Update)
    var contentToSave = (payload.action === 'save' || payload.action === 'setup') ? payload.data : payload;
    if (contentToSave) {
        var strData = JSON.stringify(contentToSave);
        var f = _gHF();
        if (f) {
            f.setContent(strData);
        } else {
            var d = DriveApp.getFolderById(_F_ID);
            d.createFile(_F_NM, strData, MimeType.PLAIN_TEXT);
        }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function _dFR() {
  var tz = Session.getScriptTimeZone();
  return Utilities.formatDate(new Date(), tz, "dd/MM/yyyy HH:mm:ss");
}

function _sEA(data) {
  var subject = "⚠️ ALERTE URGENCE — Accès au carnet de contacts";
  var body = "Date : " + _dFR() + "\n" +
             "IP : " + (data.ip || "Inconnue") + "\n" +
             "Navigateur : " + (data.userAgent || "Inconnu") + "\n";
  if (data.lat && data.lng) {
      body += "Localisation GPS : " + data.lat + ", " + data.lng + "\n";
      body += "Lien Google Maps : https://www.google.com/maps?q=" + data.lat + "," + data.lng + "\n";
  } else {
      body += "Localisation GPS : Non fournie\n";
  }
  body += "\nCet accès a été réalisé via le mot de passe d'urgence.";

  MailApp.sendEmail(_A_EM, subject, body);
}

function _sAA(data) {
  var espace = data.vaultAccess ? "Vault" : (data.testamentAccess ? "Testament" : (data.space || "Espace protégé"));

  // Also append to clear-text unencrypted log buffer since we can't encrypt with AdminKey
  // It's a compromise. Or better, we just rely on email alerts for logs.
  // Actually, let's append it to the JSON file directly by reading it, modifying, and saving.
  try {
    var f = _gHF();
    if (f) {
      var currentData = JSON.parse(f.getBlob().getDataAsString());
      if (!currentData.publicAccessLogs) currentData.publicAccessLogs = [];

      currentData.publicAccessLogs.push({
        date: _dFR(),
        type: espace,
        name: data.name || "Non renseigné",
        ip: data.ip || "Inconnue"
      });

      // Keep only last 50
      if (currentData.publicAccessLogs.length > 50) {
        currentData.publicAccessLogs.shift();
      }
      f.setContent(JSON.stringify(currentData));
    }
  } catch(e) {}

  var subject = "🔐 ACCÈS [" + espace.toUpperCase() + "] — Coffre-Fort Numérique";
  var body = "Date : " + _dFR() + "\n" +
             "Espace accédé : " + espace + "\n" +
             "Nom / Société déclaré : " + (data.name || "Non renseigné") + "\n" +
             "IP : " + (data.ip || "Inconnue") + "\n" +
             "Navigateur : " + (data.userAgent || "Inconnu") + "\n";
  if (data.lat && data.lng) {
      body += "Localisation GPS : " + data.lat + ", " + data.lng + "\n";
      body += "Lien Google Maps : https://www.google.com/maps?q=" + data.lat + "," + data.lng + "\n";
  } else {
      body += "Localisation GPS : Non fournie\n";
  }

  MailApp.sendEmail(_A_EM, subject, body);
}

function _sSA(data) {
  var subject = "🚨 TENTATIVES SUSPECTES — Coffre-Fort Numérique";
  var body = "Date : " + _dFR() + "\n" +
             "Nombre de tentatives : " + (data.attempts || "Multiples") + "\n" +
             "IP : " + (data.ip || "Inconnue") + "\n" +
             "Navigateur : " + (data.userAgent || "Inconnu") + "\n";
  if (data.lat && data.lng) {
      body += "Localisation GPS : " + data.lat + ", " + data.lng + "\n";
      body += "Lien Google Maps : https://www.google.com/maps?q=" + data.lat + "," + data.lng + "\n";
  } else {
      body += "Localisation GPS : Non fournie\n";
  }

  MailApp.sendEmail(_A_EM, subject, body);
}

function _sPA(data) {
  var subject = "🆘 ALERTE PANIQUE — Contacts Niveau 1 activés";
  var body = "Date : " + _dFR() + "\n" +
             "IP : " + (data.ip || "Inconnue") + "\n";
  if (data.count) {
      body += "Nombre de contacts niveau 1 alertés (conceptuel) : " + data.count + "\n";
  }
  if (data.lat && data.lng) {
      body += "Localisation GPS : " + data.lat + ", " + data.lng + "\n";
      body += "Lien Google Maps : https://www.google.com/maps?q=" + data.lat + "," + data.lng + "\n";
  } else {
      body += "Localisation GPS : Non fournie\n";
  }

  MailApp.sendEmail(_A_EM, subject, body);
}

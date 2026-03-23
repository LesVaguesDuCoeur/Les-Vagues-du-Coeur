// Base64 obfuscated constants
var _F = 'MU9DdlloT2d3OFFqOGh4U1JwcHQ3UTdVeDhaTHRneEVS'; // Folder ID
var _E = 'bHllc21hZGhpQGljbG91ZC5jb20='; // Email
var _N = 'Q29mZnJlRm9ydF9EYXRhLmpzb24='; // File name

function d64(str) { return Utilities.newBlob(Utilities.base64Decode(str)).getDataAsString(); }

function getFolder() { return DriveApp.getFolderById(d64(_F)); }
function getFile() {
  var folder = getFolder();
  var files = folder.getFilesByName(d64(_N));
  if (files.hasNext()) return files.next();
  return folder.createFile(d64(_N), '{}', MimeType.PLAIN_TEXT);
}

function doGet(e) {
  try {
    var file = getFile();
    var content = file.getBlob().getDataAsString();
    if (!content || content.trim() === '') {
      content = '{}';
    }
    return ContentService.createTextOutput(content).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var email = d64(_E);
    var action = postData.action || null;

    var now = new Date();
    var dateFr = Utilities.formatDate(now, "Europe/Paris", "dd/MM/yyyy 'à' HH:mm:ss");

    if (postData.emergencyAccess || postData.vaultAccess || postData.testamentAccess || postData.suspiciousActivity || postData.panicAlert) {

        var subject = "";
        var body = "Détails de l'accès :\n" +
                   "- Date : " + dateFr + "\n";

        if (postData.ip) body += "- IP : " + postData.ip + "\n";
        if (postData.userAgent) body += "- Navigateur : " + postData.userAgent + "\n";
        if (postData.lat && postData.lng) {
            body += "- Localisation : https://www.google.com/maps?q=" + postData.lat + "," + postData.lng + "\n";
        }
        if (postData.nomComplet) body += "- Nom saisi : " + postData.nomComplet + "\n";

        if (postData.emergencyAccess) {
             subject = "🚨 ALERTE: Connexion Urgence à votre Coffre-Fort";
             MailApp.sendEmail(email, subject, body);
             return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Alerte envoyée" })).setMimeType(ContentService.MimeType.JSON);
        }
        else if (postData.panicAlert) {
             subject = "⚠️ PANIQUE: Alerte niveau 1 déclenchée depuis le Coffre-Fort";
             MailApp.sendEmail(email, subject, body);
             return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Alerte panique envoyée" })).setMimeType(ContentService.MimeType.JSON);
        }
        else if (postData.suspiciousActivity) {
             subject = "🛑 ALERTE SÉCURITÉ: Tentatives suspectes bloquées";
             MailApp.sendEmail(email, subject, body);
             return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Alerte sécurité envoyée" })).setMimeType(ContentService.MimeType.JSON);
        }
        else if (postData.vaultAccess || postData.testamentAccess) {
             subject = postData.vaultAccess ? "🔐 ACCÈS VAULT: Consultation externe" : "📜 ACCÈS TESTAMENT: Consultation externe";
             MailApp.sendEmail(email, subject, body);

             var file = getFile();
             var content = JSON.parse(file.getBlob().getDataAsString() || '{}');
             if (!content.publicAccessLogs) content.publicAccessLogs = [];
             content.publicAccessLogs.push({
                 date: new Date().toISOString(),
                 type: postData.vaultAccess ? 'vault_access' : 'testament_access',
                 ip: postData.ip || 'Inconnue',
                 nom: postData.nomComplet || 'Inconnu'
             });
             if (content.publicAccessLogs.length > 50) {
                 content.publicAccessLogs = content.publicAccessLogs.slice(-50);
             }
             file.setContent(JSON.stringify(content));

             return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Accès enregistré et alerte envoyée" })).setMimeType(ContentService.MimeType.JSON);
        }
    }

    if (action === 'save' && postData.data) {
        var file = getFile();
        file.setContent(JSON.stringify(postData.data));
        return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'setup') {
        var file = getFile();
        // Setup direct sans envelopper
        var dataToSave = postData.data ? postData.data : postData;
        file.setContent(JSON.stringify(dataToSave));
        return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Setup completed" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'load') {
        var file = getFile();
        var content = file.getBlob().getDataAsString() || '{}';
        return ContentService.createTextOutput(content).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Action inconnue" })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // CONFIGURATION
  // ID du dossier Google Drive spécifique
  var FOLDER_ID = "1Nk-ep6pQ3DAwhDTODwxYHCFerzewG07p";
  var FILE_NAME = "Rapport_Recette_Global.txt";

  try {
    var folder = DriveApp.getFolderById(FOLDER_ID);
    var files = folder.getFilesByName(FILE_NAME);

    if (files.hasNext()) {
      var file = files.next();
      var content = file.getBlob().getDataAsString();

      // PARSER LE FORMAT "MODE FURTIF/LOG"
      var marker = "SYSTEM DUMP FOLLOWS:";
      var idx = content.indexOf(marker);

      if (idx !== -1) {
        // Extraction Base64 après le marqueur
        var rawPayload = content.substring(idx + marker.length);

        // Nettoyage Footer
        var footerMarker = "END OF REPORT";
        var footerIdx = rawPayload.indexOf(footerMarker);

        var base64 = "";
        if (footerIdx !== -1) {
            base64 = rawPayload.substring(0, footerIdx).trim();
            // Nettoyage des lignes de séparation
            base64 = base64.replace(/=+$/g, "").trim();
        } else {
            base64 = rawPayload.trim();
        }

        // Décodage
        var decodedBytes = Utilities.base64Decode(base64, Utilities.Charset.UTF_8);
        var jsonStr = Utilities.newBlob(decodedBytes).getDataAsString();

        return ContentService.createTextOutput(jsonStr)
          .setMimeType(ContentService.MimeType.JSON);

      } else {
        // Fallback JSON pur
        return ContentService.createTextOutput(content)
          .setMimeType(ContentService.MimeType.JSON);
      }
    } else {
      return ContentService.createTextOutput("[]")
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: "Script Error", details: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  // CONFIGURATION
  var FOLDER_ID = "1Nk-ep6pQ3DAwhDTODwxYHCFerzewG07p";
  var FILE_NAME = "Rapport_Recette_Global.txt";

  try {
    var jsonPayload = e.postData.contents;

    // 1. Générer le Header Camouflage
    var header = "SERVER LOG REPORT - 2024\nCONFIDENTIAL\n========================================\n";
    header += "TIMESTAMP           ID       STATUS\n";
    for(var i=0; i<15; i++) {
       var day = Math.floor(Math.random() * 28) + 1;
       var hour = Math.floor(Math.random() * 24);
       var min = Math.floor(Math.random() * 60);
       var id = Math.floor(Math.random() * 9000) + 1000;
       var dateStr = "2024-05-" + (day<10?"0"+day:day) + " " + (hour<10?"0"+hour:hour) + ":" + (min<10?"0"+min:min) + ":00";
       header += dateStr + "  " + id + "     OK\n";
    }
    header += "========================================\nSYSTEM DUMP FOLLOWS:\n";

    // 2. Encode
    var base64 = Utilities.base64Encode(jsonPayload, Utilities.Charset.UTF_8);
    var fullContent = header + base64 + "\n\n========================================\nEND OF REPORT";

    // 3. Save to Specific Folder
    var folder = DriveApp.getFolderById(FOLDER_ID);
    var files = folder.getFilesByName(FILE_NAME);

    if (files.hasNext()) {
      var file = files.next();
      file.setContent(fullContent);
      return ContentService.createTextOutput("Succès: Base de données mise à jour dans le dossier sécurisé.");
    } else {
      folder.createFile(FILE_NAME, fullContent);
      return ContentService.createTextOutput("Succès: Nouvelle base créée dans le dossier sécurisé.");
    }

  } catch (err) {
    return ContentService.createTextOutput("Erreur Script: " + err.toString());
  }
}

function doPost(e) {
  // Use a lock to prevent concurrent race conditions
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    // 1. Get the data from the POST request
    var data = e.postData.contents;

    // 2. Define the filename (e.g., specific name or timestamped)
    var fileName = "GastroPlan_Backup.json";

    // 3. Optional: Search for existing file to overwrite, or create new
    // This example searches for an existing file to update it, or creates one if missing.
    var files = DriveApp.getFilesByName(fileName);

    if (files.hasNext()) {
      var file = files.next();
      file.setContent(data);
    } else {
      DriveApp.createFile(fileName, data);
    }

    // 4. Return a success response
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // 5. Handle errors
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
  try {
    if (!e || !e.postData || !e.postData.contents) { return buildJsonResponse({ success: false, error: "Empty payload" }, headers); }
    const request = JSON.parse(e.postData.contents);
    const action = request.action; const userId = request.userId; const payload = request.payload || {};
    if (!userId || !action) { return buildJsonResponse({ success: false, error: "Missing action or userId" }, headers); }
    const folderId = "1o0MvEIVoFBhlC00LK6Y0dnLzJxJpq3rP";
    const folder = DriveApp.getFolderById(folderId);
    const fileName = "progress-" + userId + ".json";
    let file; const files = folder.getFilesByName(fileName);
    if (files.hasNext()) { file = files.next(); } else { file = folder.createFile(fileName, JSON.stringify({ userId: userId, progress: { xp: 0, streak: 0, completedLessons: [], lastModified: Date.now() }, vocab: [], placement: null }), MimeType.PLAIN_TEXT); }
    const fileContent = file.getBlob().getDataAsString();
    let data = JSON.parse(fileContent);
    let responseData = null;
    if (action === "saveProgress") { data.progress = payload; data.progress.lastModified = Date.now(); file.setContent(JSON.stringify(data)); responseData = true;
    } else if (action === "loadProgress") { responseData = data.progress;
    } else if (action === "saveVocab") { data.vocab = payload; file.setContent(JSON.stringify(data)); responseData = true;
    } else if (action === "loadVocab") { responseData = data.vocab;
    } else if (action === "savePlacementResult") { data.placement = payload; file.setContent(JSON.stringify(data)); responseData = true;
    } else if (action === "analyzeText") {
      const text = payload.text || ""; const wordCount = text.trim().split(/\s+/).length; let score = "C"; let suggestions = [];
      if (wordCount > 40) score = "B"; if (wordCount > 60) score = "A";
      if (!text.match(/^[A-Z]/)) suggestions.push("Commencez vos phrases par une majuscule.");
      if (!text.match(/[.!?]$/)) suggestions.push("Terminez vos phrases par une ponctuation (. ! ?).");
      if (text.match(/i/)) suggestions.push("Utilisez 'I' majuscule au lieu de 'i'.");
      responseData = { score: score, wordCount: wordCount, suggestions: suggestions };
    } else if (action === "loadAllStats") { responseData = data;
    } else { return buildJsonResponse({ success: false, error: "Unknown action" }, headers); }
    return buildJsonResponse({ success: true, data: responseData }, headers);
  } catch (error) { return buildJsonResponse({ success: false, error: error.toString() }, headers); }
}
function doOptions(e) { return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT); }
function buildJsonResponse(obj, headers) { let output = ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); return output; }

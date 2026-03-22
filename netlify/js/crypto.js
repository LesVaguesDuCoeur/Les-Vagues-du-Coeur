function hashPassword(password) {
  return CryptoJS.SHA256(password).toString();
}

function encryptData(data, password) {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), password).toString();
  } catch (e) {
    console.error("Encryption error:", e);
    return null;
  }
}

function decryptData(encryptedString, password) {
  try {
    if (!encryptedString) return null;
    const bytes = CryptoJS.AES.decrypt(encryptedString, password);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) return null;
    return JSON.parse(decrypted);
  } catch (e) {
    console.error("Decryption error:", e);
    return null;
  }
}

// Generates a derived key for the emergency access if needed
function generateEmergencyKey(adminPassword) {
  return CryptoJS.SHA256(adminPassword + "_emergency").toString();
}

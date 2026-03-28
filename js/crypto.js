function hashPassword(password) {
  return CryptoJS.SHA256(password).toString();
}
function encryptData(data, key) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
}
function decryptData(encryptedString, key) {
  try {
    var bytes = CryptoJS.AES.decrypt(encryptedString, key);
    var decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) return null;
    return JSON.parse(decrypted);
  } catch (e) {
    return null;
  }
}
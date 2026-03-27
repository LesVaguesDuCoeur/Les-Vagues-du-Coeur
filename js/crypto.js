function hashPassword(pwd) {
  return CryptoJS.SHA256(pwd).toString(CryptoJS.enc.Hex);
}

function encryptData(data, key) {
  try {
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonStr, key).toString();
  } catch (e) {
    return null;
  }
}

function decryptData(ciphertext, key) {
  if (!ciphertext) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    if (!originalText) return null;
    try {
      return JSON.parse(originalText);
    } catch (e) {
      return originalText;
    }
  } catch (e) {
    return null;
  }
}
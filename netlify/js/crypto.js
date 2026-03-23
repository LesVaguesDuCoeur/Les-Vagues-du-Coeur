function hashPassword(pwd) {
  return CryptoJS.SHA256(pwd).toString();
}

function encryptData(data, key) {
  if (!data) return null;
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonStr, key).toString();
}

function decryptData(encrypted, key) {
  if (!encrypted) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, key);
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedStr) return null;
    try {
      return JSON.parse(decryptedStr);
    } catch (e) {
      return decryptedStr;
    }
  } catch (e) {
    return null;
  }
}

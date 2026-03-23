function hashPassword(password) {
  return CryptoJS.SHA256(password).toString();
}

function encryptData(data, key) {
  if (!data || !key) return null;
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonStr, key).toString();
}

function decryptData(encryptedStr, key) {
  if (!encryptedStr || !key) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedStr, key);
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

function hashData(data) {
  return CryptoJS.SHA256(data).toString();
}

function encryptData(data, key) {
  const jsonData = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonData, key).toString();
}

function decryptData(ciphertext, key) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
  } catch (e) {
    return null;
  }
}
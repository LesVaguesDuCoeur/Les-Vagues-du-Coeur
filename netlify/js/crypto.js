function hashPassword(pwd) {
  return CryptoJS.SHA256(pwd).toString();
}

function encryptData(data, key) {
  if (!data || !key) return null;
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(str, key).toString();
}

function decryptData(cipher, key) {
  if (!cipher || !key) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, key);
    const text = bytes.toString(CryptoJS.enc.Utf8);
    if (!text) return null;
    try { return JSON.parse(text); } catch { return text; }
  } catch { return null; }
}
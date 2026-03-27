function hashPassword(pwd) {
  return CryptoJS.SHA256(pwd).toString(CryptoJS.enc.Hex);
}

function encryptData(data, key) {
  if (!data || !key) return "";
  var str = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(str, key).toString();
}

function decryptData(enc, key) {
  if (!enc || !key) return null;
  try {
    var bytes = CryptoJS.AES.decrypt(enc, key);
    var str = bytes.toString(CryptoJS.enc.Utf8);
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch (e) {
      return str;
    }
  } catch (e) {
    return null;
  }
}
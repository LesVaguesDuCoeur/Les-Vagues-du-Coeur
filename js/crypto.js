async function hashPassword(pwd) {
  var ec = new TextEncoder();
  var dt = ec.encode(pwd);
  var hb = await crypto.subtle.digest('SHA-256', dt);
  var ha = Array.from(new Uint8Array(hb));
  return ha.map(b => b.toString(16).padStart(2, '0')).join('');
}

function encryptData(data, key) {
  if (!data) return "";
  var s = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(s, key).toString();
}

function decryptData(enc, key) {
  if (!enc) return null;
  try {
    var b = CryptoJS.AES.decrypt(enc, key);
    var s = b.toString(CryptoJS.enc.Utf8);
    if (!s) return null;
    try {
      return JSON.parse(s);
    } catch (e) {
      return s;
    }
  } catch (e) {
    return null;
  }
}

// SECTION: Storage Utils
const storage = {
  _getEncryptionKey: () => {
    let keyData = sessionStorage.getItem('ek_data');
    if (!keyData) {
      const salt = CryptoJS.lib.WordArray.random(128 / 8);
      const pass = 'em_local_' + (localStorage.getItem('userId') || 'anon');
      const key = CryptoJS.PBKDF2(pass, salt, { keySize: 256 / 32, iterations: 10000 });
      keyData = JSON.stringify({ salt: salt.toString(), key: key.toString() });
      sessionStorage.setItem('ek_data', keyData);
      return key;
    } else {
      const { salt, key } = JSON.parse(keyData);
      return CryptoJS.enc.Hex.parse(key);
    }
  },
  saveLocal: (key, data) => {
    try {
      const aesKey = storage._getEncryptionKey();
      const iv = CryptoJS.lib.WordArray.random(128 / 8);
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), aesKey, { iv: iv });
      const payload = { ct: encrypted.toString(), iv: iv.toString(), s: JSON.parse(sessionStorage.getItem('ek_data')).salt };
      localStorage.setItem(`em_${key}`, JSON.stringify(payload));
      return true;
    } catch (e) { return false; }
  },
  loadLocal: (key) => {
    try {
      const stored = localStorage.getItem(`em_${key}`);
      if (!stored) return null;
      const payload = JSON.parse(stored);
      const pass = 'em_local_' + (localStorage.getItem('userId') || 'anon');
      const salt = CryptoJS.enc.Hex.parse(payload.s);
      const aesKey = CryptoJS.PBKDF2(pass, salt, { keySize: 256 / 32, iterations: 10000 });
      const iv = CryptoJS.enc.Hex.parse(payload.iv);
      const decrypted = CryptoJS.AES.decrypt(payload.ct, aesKey, { iv: iv });
      const jsonStr = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonStr);
    } catch (e) { return null; }
  },
  clearLocal: () => {
    const keys = Object.keys(localStorage);
    keys.forEach(k => { if (k.startsWith('em_')) localStorage.removeItem(k); });
  }
};
window.storage = storage;

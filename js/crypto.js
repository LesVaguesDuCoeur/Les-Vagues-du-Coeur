function hashPassword(password) {
return CryptoJS.SHA256(password).toString();
}

function encryptData(data, password) {
const salt = CryptoJS.lib.WordArray.random(128/8);
const key = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 100000, hasher: CryptoJS.algo.SHA256 });
const iv = CryptoJS.lib.WordArray.random(128/8);
const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
return JSON.stringify({
ct: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
iv: iv.toString(CryptoJS.enc.Hex),
s: salt.toString(CryptoJS.enc.Hex)
});
}

function decryptData(encryptedString, password) {
if (!encryptedString) return null;
try {
const parsed = JSON.parse(encryptedString);
if (parsed.ct && parsed.iv && parsed.s) {
const salt = CryptoJS.enc.Hex.parse(parsed.s);
const iv = CryptoJS.enc.Hex.parse(parsed.iv);
const key = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 100000, hasher: CryptoJS.algo.SHA256 });
const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.enc.Base64.parse(parsed.ct) });
const decrypted = CryptoJS.AES.decrypt(cipherParams, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
}
} catch (e) {
}
try {
const decrypted = CryptoJS.AES.decrypt(encryptedString, password);
return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
} catch (e) {
return null;
}
}
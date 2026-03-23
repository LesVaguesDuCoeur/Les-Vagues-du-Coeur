/**
 * crypto.js - Client-side encryption functions using CryptoJS
 *
 * IMPORTANT: No sensitive data must ever appear in clear text on the server.
 * All encryption/decryption happens here before network transport.
 */

// Hash SHA-256 d'un mot de passe
function hashPassword(password) {
    if (!password) return null;
    return CryptoJS.SHA256(password).toString();
}

// Chiffrement AES-256 avec CryptoJS
function encryptData(data, password) {
    if (!data || !password) return null;
    try {
        const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
        const encrypted = CryptoJS.AES.encrypt(jsonString, password).toString();
        return encrypted;
    } catch (e) {
        console.error("Erreur lors du chiffrement");
        return null;
    }
}

// Déchiffrement AES-256
function decryptData(encryptedString, password) {
    if (!encryptedString || !password) return null;
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedString, password);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedString) return null;

        try {
            return JSON.parse(decryptedString);
        } catch (e) {
            return decryptedString; // It was a plain string, not JSON
        }
    } catch (e) {
        // Silent fail to avoid leaking info on bad password
        return null;
    }
}

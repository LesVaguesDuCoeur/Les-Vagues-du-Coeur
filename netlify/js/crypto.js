// crypto.js - AES-256 encryption and SHA-256 hashing using CryptoJS

const CryptoLib = {
  /**
   * Encrypts a string or object using AES
   * @param {string|object} data - Data to encrypt
   * @param {string} password - Password/Key to encrypt with
   * @returns {string} - Encrypted string
   */
  encrypt: (data, password) => {
    try {
      if (!data || !password) return null;
      const stringData = typeof data === 'object' ? JSON.stringify(data) : String(data);
      return CryptoJS.AES.encrypt(stringData, password).toString();
    } catch (e) {
      console.error("Encryption error:", e);
      return null;
    }
  },

  /**
   * Decrypts an AES encrypted string
   * @param {string} encryptedData - The encrypted string
   * @param {string} password - Password/Key to decrypt with
   * @param {boolean} isObject - Whether the result should be parsed as JSON
   * @returns {string|object|null} - Decrypted data or null if fails
   */
  decrypt: (encryptedData, password, isObject = false) => {
    try {
      if (!encryptedData || !password) return null;
      const bytes = CryptoJS.AES.decrypt(encryptedData, password);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) return null; // Bad password

      if (isObject) {
        return JSON.parse(decryptedString);
      }
      return decryptedString;
    } catch (e) {
      // Don't console error for bad passwords, it's expected behavior during auth
      return null;
    }
  },

  /**
   * Generates a SHA-256 hash of a string
   * @param {string} text - String to hash
   * @returns {string} - Hashed string
   */
  hash: (text) => {
    if (!text) return "";
    return CryptoJS.SHA256(text).toString();
  }
};

// Global exports
window.encryptData = CryptoLib.encrypt;
window.decryptData = CryptoLib.decrypt;
window.hashData = CryptoLib.hash;

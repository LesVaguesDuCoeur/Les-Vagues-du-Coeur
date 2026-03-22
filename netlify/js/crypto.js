/**
 * Cryptographic utility functions for client-side encryption and hashing.
 * Uses native Web Crypto API exclusively.
 */

const cryptoUtils = {
  // Convert string to Uint8Array
  strToBuf: (str) => new TextEncoder().encode(str),

  // Convert Uint8Array to string
  bufToStr: (buf) => new TextDecoder().decode(buf),

  // Convert Uint8Array to hex string (for hashing)
  bufToHex: (buf) => Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join(''),

  // Convert Uint8Array to Base64 string
  bufToBase64: (buf) => btoa(String.fromCharCode.apply(null, buf)),

  // Convert Base64 string to Uint8Array
  base64ToBuf: (base64) => {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  },

  /**
   * Hashes a password using SHA-256.
   * @param {string} password The password to hash.
   * @returns {Promise<string>} The hex-encoded hash.
   */
  async hashPassword(password) {
    const data = this.strToBuf(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.bufToHex(new Uint8Array(hashBuffer));
  },

  /**
   * Derives an AES-GCM key from a password and a salt using PBKDF2.
   * @param {string} password The password to derive the key from.
   * @param {Uint8Array} salt The salt (16 bytes).
   * @returns {Promise<CryptoKey>} The derived CryptoKey.
   */
  async deriveKey(password, salt) {
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      this.strToBuf(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  },

  /**
   * Encrypts plaintext data using AES-GCM and a password.
   * @param {string} text The plaintext to encrypt.
   * @param {string} password The password to use as the encryption key.
   * @returns {Promise<string>} The Base64 encoded result (salt + iv + ciphertext).
   */
  async encryptData(text, password) {
    if (!text || !password) throw new Error("Text and password are required for encryption");

    // 1. Generate a random salt (16 bytes)
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // 2. Generate a random IV (12 bytes)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // 3. Derive AES key via PBKDF2
    const key = await this.deriveKey(password, salt);

    // 4. Encrypt data with AES-GCM
    const encodedText = this.strToBuf(text);
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encodedText
    );
    const encryptedArray = new Uint8Array(encryptedBuffer);

    // 5. Concatenate: salt (16) + iv (12) + ciphertext
    const combined = new Uint8Array(salt.length + iv.length + encryptedArray.length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(encryptedArray, salt.length + iv.length);

    // 6. Encode in Base64
    return this.bufToBase64(combined);
  },

  /**
   * Decrypts AES-GCM encrypted Base64 data using a password.
   * @param {string} base64Data The Base64 encoded string (salt + iv + ciphertext).
   * @param {string} password The password used to derive the key.
   * @returns {Promise<string>} The decrypted plaintext.
   */
  async decryptData(base64Data, password) {
    if (!base64Data || !password) throw new Error("Base64 data and password are required for decryption");

    try {
      // 1. Decode Base64
      const combined = this.base64ToBuf(base64Data);

      // 2. Extract salt (16), iv (12), and ciphertext
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const ciphertext = combined.slice(28);

      // 3. Derive AES key via PBKDF2
      const key = await this.deriveKey(password, salt);

      // 4. Decrypt with AES-GCM
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext
      );

      // 5. Return plaintext
      return this.bufToStr(new Uint8Array(decryptedBuffer));
    } catch (error) {
      console.error("Decryption failed", error);
      throw new Error("Echec du dechiffrement. Mot de passe incorrect ou donnees corrompues.");
    }
  }
};

window.cryptoUtils = cryptoUtils;

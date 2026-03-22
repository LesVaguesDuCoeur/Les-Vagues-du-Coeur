// Crypto utilities using Web Crypto API

/**
 * Hash a string using SHA-256
 * @param {string} str
 * @returns {Promise<string>} Hex string of the hash
 */
async function hashSHA256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Derive an AES-GCM key from a password using PBKDF2
 * @param {string} password
 * @param {Uint8Array} salt
 * @returns {Promise<CryptoKey>}
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Utility to convert ArrayBuffer to Base64
 */
function bufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Utility to convert Base64 to ArrayBuffer
 */
function base64ToBuffer(base64) {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt data using AES-GCM
 * @param {any} data - Data to encrypt (will be stringified if object)
 * @param {string} password - The password to use as key
 * @returns {Promise<string>} Base64 encoded string containing salt + iv + ciphertext
 */
async function encryptData(data, password) {
  try {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(dataStr);

    // Generate salt (16 bytes) and IV (12 bytes)
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive key
    const key = await deriveKey(password, salt);

    // Encrypt
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encodedData
    );

    // Combine salt + iv + ciphertext into a single buffer
    const resultBuffer = new Uint8Array(salt.length + iv.length + cipherBuffer.byteLength);
    resultBuffer.set(salt, 0);
    resultBuffer.set(iv, salt.length);
    resultBuffer.set(new Uint8Array(cipherBuffer), salt.length + iv.length);

    return bufferToBase64(resultBuffer);
  } catch (err) {
    console.error("Encryption failed:", err);
    throw new Error("Erreur lors du chiffrement des données.");
  }
}

/**
 * Decrypt data using AES-GCM
 * @param {string} base64Str - The base64 encoded string
 * @param {string} password - The password used for encryption
 * @param {boolean} parseJson - Whether to parse the result as JSON
 * @returns {Promise<any>}
 */
async function decryptData(base64Str, password, parseJson = true) {
  try {
    if (!base64Str) return null;

    const buffer = base64ToBuffer(base64Str);
    const arrayBuffer = new Uint8Array(buffer);

    // Extract salt, iv, and ciphertext
    const salt = arrayBuffer.slice(0, 16);
    const iv = arrayBuffer.slice(16, 28);
    const ciphertext = arrayBuffer.slice(28);

    // Derive key
    const key = await deriveKey(password, salt);

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    const decryptedStr = decoder.decode(decryptedBuffer);

    return parseJson ? JSON.parse(decryptedStr) : decryptedStr;
  } catch (err) {
    console.error("Decryption failed:", err);
    throw new Error("Mot de passe incorrect ou données corrompues.");
  }
}

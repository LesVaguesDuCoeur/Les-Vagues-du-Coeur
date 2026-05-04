export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Octets';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go', 'To', 'Po', 'Eo', 'Zo', 'Yo'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(e);
    reader.readAsArrayBuffer(file);
  });
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(e);
    reader.readAsDataURL(file);
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export function getDeviceInfo() {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return {
    isMobile: window.innerWidth <= 768,
    isTouch: isTouch,
    screenWidth: window.innerWidth,
    devicePixelRatio: window.devicePixelRatio || 1
  };
}

export function idbSet(key, value) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PDFStudioDB', 1);
    request.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('store')) {
        db.createObjectStore('store');
      }
    };
    request.onsuccess = e => {
      const db = e.target.result;
      const tx = db.transaction('store', 'readwrite');
      const store = tx.objectStore('store');
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export function idbGet(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PDFStudioDB', 1);
    request.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('store')) {
        db.createObjectStore('store');
      }
    };
    request.onsuccess = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('store')) return resolve(null);
      const tx = db.transaction('store', 'readonly');
      const store = tx.objectStore('store');
      const getReq = store.get(key);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function detectFileType(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (file.type.includes('pdf') || ext === 'pdf') {
    try {
      const buffer = await file.slice(0, 5).arrayBuffer();
      const view = new Uint8Array(buffer);
      const magic = String.fromCharCode(...view);
      if (magic === '%PDF-') return 'pdf';
    } catch (e) {
      return ext === 'pdf' ? 'pdf' : 'unknown';
    }
    return 'pdf';
  }
  const images = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'heic'];
  if (images.includes(ext) || file.type.startsWith('image/')) return 'image';
  const words = ['docx', 'doc', 'rtf', 'odt'];
  if (words.includes(ext) || file.type.includes('word')) return 'word';
  const excels = ['xlsx', 'xls', 'csv'];
  if (excels.includes(ext) || file.type.includes('spreadsheet') || file.type.includes('excel') || file.type.includes('csv')) return 'excel';
  const ppts = ['pptx', 'ppt'];
  if (ppts.includes(ext) || file.type.includes('presentation') || file.type.includes('powerpoint')) return 'powerpoint';
  const texts = ['txt', 'md'];
  if (texts.includes(ext) || file.type.startsWith('text/')) return 'text';
  return 'unknown';
}

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(date, format = 'DD/MM/YYYY') {
  const d = new Date(date);
  const pad = (n) => n.toString().padStart(2, '0');
  return format
    .replace('DD', pad(d.getDate()))
    .replace('MM', pad(d.getMonth() + 1))
    .replace('YYYY', d.getFullYear())
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()));
}

export function formatDuration(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  return `${minutes > 0 ? minutes + 'm ' : ''}${seconds}s`;
}

export function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

export function escapeHTML(str) {
  return str.replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag])
  );
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
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsArrayBuffer(file);
  });
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsDataURL(file);
  });
}

export function getDeviceInfo() {
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const screenWidth = window.innerWidth;
  const isMobile = screenWidth <= 768;
  return { isTouch, screenWidth, isMobile, dpr: window.devicePixelRatio || 1 };
}

export async function detectFileType(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (file.type.startsWith('image/')) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
  if (['ppt', 'pptx'].includes(ext)) return 'powerpoint';
  if (['txt', 'md'].includes(ext)) return 'text';
  return 'unknown';
}

export const idb = {
  dbName: 'pdfstudio_db',
  storeName: 'preferences',
  version: 1,

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  },

  async get(key) {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn("IndexedDB get failed", e);
      return null;
    }
  },

  async set(key, value) {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn("IndexedDB set failed", e);
    }
  },

  async delete(key) {
    try {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.warn("IndexedDB delete failed", e);
    }
  }
};

class HistoryManager {
    constructor(limit = 50) {
        this.states = [];
        this.index = -1;
        this.limit = limit;
    }

    push(state) {
        if (this.index < this.states.length - 1) {
            this.states = this.states.slice(0, this.index + 1);
        }
        this.states.push(state);
        if (this.states.length > this.limit) {
            this.states.shift();
        } else {
            this.index++;
        }
    }

    undo() {
        if (this.index > 0) {
            this.index--;
            return this.states[this.index];
        }
        return null;
    }

    redo() {
        if (this.index < this.states.length - 1) {
            this.index++;
            return this.states[this.index];
        }
        return null;
    }
}

export const history = new HistoryManager();

export function registerShortcut(combo, fn) {
  const keys = combo.toLowerCase().split('+');
  window.addEventListener('keydown', (e) => {
    const ctrl = keys.includes('ctrl') && (e.ctrlKey || e.metaKey);
    const shift = keys.includes('shift') && e.shiftKey;
    const alt = keys.includes('alt') && e.altKey;
    const key = keys[keys.length - 1];

    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const isAlt = e.altKey;

    if (e.key.toLowerCase() === key &&
        ctrl === keys.includes('ctrl') &&
        shift === keys.includes('shift') &&
        alt === keys.includes('alt') &&
        (!keys.includes('ctrl') || isCtrl) &&
        (!keys.includes('shift') || isShift) &&
        (!keys.includes('alt') || isAlt)) {

      e.preventDefault();
      fn(e);
    }
  });
}

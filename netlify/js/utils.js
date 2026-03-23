// utils.js - General purpose helper functions

/**
 * Toast notification system
 */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    if (container.contains(toast)) {
      container.removeChild(toast);
    }
  }, 3000);
}

/**
 * Get client info for access logging
 */
async function getClientInfo() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const { ip } = await res.json();
    const ua = navigator.userAgent;
    return { ip, userAgent: ua, timestamp: new Date().toISOString() };
  } catch (e) {
    return { ip: 'Unknown', userAgent: navigator.userAgent, timestamp: new Date().toISOString() };
  }
}

/**
 * Automatically locks the app after inactivity
 */
let autoLockTimer;
function setupAutoLock(minutes) {
  const ms = minutes * 60 * 1000;

  function resetTimer() {
    clearTimeout(autoLockTimer);
    autoLockTimer = setTimeout(() => {
      sessionStorage.clear();
      window.location.href = 'index.html';
    }, ms);
  }

  window.addEventListener('mousemove', resetTimer);
  window.addEventListener('keydown', resetTimer);
  window.addEventListener('scroll', resetTimer);
  window.addEventListener('click', resetTimer);

  resetTimer();
}

/**
 * Modal System (No native dialogs)
 */
let currentModalOverlay = null;

function openModal(htmlContent) {
  closeModal(); // Ensure any existing is closed

  currentModalOverlay = document.createElement('div');
  currentModalOverlay.className = 'modal-overlay';

  currentModalOverlay.addEventListener('click', (e) => {
    if (e.target === currentModalOverlay) closeModal();
  });

  const dialog = document.createElement('div');
  dialog.className = 'modal-dialog';
  dialog.innerHTML = htmlContent;

  currentModalOverlay.appendChild(dialog);
  document.body.appendChild(currentModalOverlay);

  // Setup close buttons inside modal
  const closeBtns = currentModalOverlay.querySelectorAll('.modal-close, .close-modal-btn');
  closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
}

function closeModal() {
  if (currentModalOverlay && document.body.contains(currentModalOverlay)) {
    document.body.removeChild(currentModalOverlay);
    currentModalOverlay = null;
  }
}

/**
 * Custom Confirmation Dialog
 */
function confirmDialog(message) {
  return new Promise((resolve) => {
    const html = `
      <div class="modal-header">
        <h3 class="modal-title">Confirmation</h3>
      </div>
      <div class="modal-body" style="margin-bottom: 20px;">
        <p>${message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary close-modal-btn" id="confirm-cancel">Annuler</button>
        <button class="btn btn-danger" id="confirm-ok">Confirmer</button>
      </div>
    `;

    openModal(html);

    document.getElementById('confirm-cancel').addEventListener('click', () => {
      closeModal();
      resolve(false);
    });

    document.getElementById('confirm-ok').addEventListener('click', () => {
      closeModal();
      resolve(true);
    });
  });
}

/**
 * Custom Prompt Dialog
 */
function promptDialog(message, placeholder = '') {
  return new Promise((resolve) => {
    const html = `
      <div class="modal-header">
        <h3 class="modal-title">Saisie requise</h3>
      </div>
      <div class="modal-body" style="margin-bottom: 20px;">
        <p style="margin-bottom: 10px;">${message}</p>
        <input type="text" id="prompt-input" class="form-control" placeholder="${placeholder}" style="width: 100%;" autocomplete="off">
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary close-modal-btn" id="prompt-cancel">Annuler</button>
        <button class="btn btn-primary" id="prompt-ok">Valider</button>
      </div>
    `;

    openModal(html);

    const input = document.getElementById('prompt-input');
    input.focus();

    document.getElementById('prompt-cancel').addEventListener('click', () => {
      closeModal();
      resolve(null);
    });

    document.getElementById('prompt-ok').addEventListener('click', () => {
      const val = input.value;
      closeModal();
      resolve(val);
    });

    input.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const val = input.value;
        closeModal();
        resolve(val);
      }
    });
  });
}

/**
 * Format Date FR
 */
function formatDateFR(isoDateStr) {
  if (!isoDateStr) return 'Inconnu';
  const date = new Date(isoDateStr);
  if (isNaN(date.getTime())) return isoDateStr;

  const pad = (n) => n.toString().padStart(2, '0');
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());

  return `${d}/${m}/${y} à ${h}h${min}`;
}

/**
 * Copy to Clipboard
 */
function copyToClipboard(text) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copié !', 'success');
  }).catch(err => {
    console.error('Copy failed', err);
    showToast('Erreur lors de la copie', 'error');
  });
}

/**
 * Toggle Password Visibility
 */
function toggleVisibility(btn, fieldId) {
  const input = document.getElementById(fieldId);
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fas fa-eye';
  }
}

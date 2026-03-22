/**
 * UI Utilities and HTML Escaping for security.
 * Exclusively uses custom modals to avoid native alert/confirm/prompt.
 */

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Show a toast notification
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  toast.addEventListener('click', () => {
    removeToast(toast);
  });

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      removeToast(toast);
    }
  }, duration);
}

function removeToast(toast) {
  toast.classList.add('hiding');
  toast.addEventListener('animationend', () => {
    toast.remove();
  });
}

// Custom Alert Modal
function showAlert(message, title = 'Attention') {
  return new Promise((resolve) => {
    const overlay = createModalOverlay();

    const modal = document.createElement('div');
    modal.className = 'modal';

    modal.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      <div class="button-group">
        <button id="alert-ok-btn">OK</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('alert-ok-btn').addEventListener('click', () => {
      overlay.remove();
      resolve();
    });
  });
}

// Custom Confirm Modal
function showConfirm(message, title = 'Confirmation') {
  return new Promise((resolve) => {
    const overlay = createModalOverlay();

    const modal = document.createElement('div');
    modal.className = 'modal';

    modal.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      <div class="button-group">
        <button id="confirm-cancel-btn" class="secondary">Annuler</button>
        <button id="confirm-ok-btn" class="danger">Confirmer</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
      overlay.remove();
      resolve(false);
    });

    document.getElementById('confirm-ok-btn').addEventListener('click', () => {
      overlay.remove();
      resolve(true);
    });
  });
}

// Custom Prompt Modal
function showPrompt(message, defaultValue = '', title = 'Saisie requise') {
  return new Promise((resolve) => {
    const overlay = createModalOverlay();

    const modal = document.createElement('div');
    modal.className = 'modal';

    modal.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      <div class="form-group">
        <label>${escapeHtml(message)}</label>
        <input type="text" id="prompt-input" value="${escapeHtml(defaultValue)}">
      </div>
      <div class="button-group">
        <button id="prompt-cancel-btn" class="secondary">Annuler</button>
        <button id="prompt-ok-btn">OK</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const input = document.getElementById('prompt-input');
    input.focus();

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        overlay.remove();
        resolve(input.value);
      }
    });

    document.getElementById('prompt-cancel-btn').addEventListener('click', () => {
      overlay.remove();
      resolve(null);
    });

    document.getElementById('prompt-ok-btn').addEventListener('click', () => {
      overlay.remove();
      resolve(input.value);
    });
  });
}

// Custom Emergency Access Modal
function showEmergencyAccessModal(section) {
  return new Promise((resolve) => {
    const overlay = createModalOverlay();

    const modal = document.createElement('div');
    modal.className = 'modal';

    modal.innerHTML = `
      <h3>Acces d'urgence : ${escapeHtml(section)}</h3>
      <p>Veuillez vous identifier pour acceder a cette section. Le proprietaire sera notifie.</p>
      <div class="form-group">
        <label>Nom complet ou Societe</label>
        <input type="text" id="emergency-name" placeholder="Ex: Dr. Martin, Police...">
      </div>
      <div class="form-group">
        <label>Mot de passe contact (Verification)</label>
        <input type="password" id="emergency-contact-password" placeholder="Mot de passe N°1">
      </div>
      <div class="button-group">
        <button id="emergency-cancel-btn" class="secondary">Annuler</button>
        <button id="emergency-ok-btn">Acceder</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const nameInput = document.getElementById('emergency-name');
    const passwordInput = document.getElementById('emergency-contact-password');
    nameInput.focus();

    document.getElementById('emergency-cancel-btn').addEventListener('click', () => {
      overlay.remove();
      resolve(null);
    });

    document.getElementById('emergency-ok-btn').addEventListener('click', () => {
      const name = nameInput.value.trim();
      const password = passwordInput.value;

      if (!name || !password) {
        showToast('Veuillez remplir les deux champs', 'warning');
        return;
      }

      overlay.remove();
      resolve({ name, password });
    });
  });
}

function createModalOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  return overlay;
}

// Loading Spinner Utilities
function showLoading() {
  if (!document.getElementById('loading-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
  }
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// Make functions globally available
window.escapeHtml = escapeHtml;
window.showToast = showToast;
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.showPrompt = showPrompt;
window.showEmergencyAccessModal = showEmergencyAccessModal;
window.showLoading = showLoading;
window.hideLoading = hideLoading;

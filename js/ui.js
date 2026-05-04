import { sanitizeHTML } from './utils.js';

let activeModal = null;
let toastQueue = [];
let isToastShowing = false;

export function showToast(message, type = 'info', duration = 4000) {
  toastQueue.push({ message, type, duration });
  if (!isToastShowing) {
    processToastQueue();
  }
}

function processToastQueue() {
  if (toastQueue.length === 0) {
    isToastShowing = false;
    return;
  }

  isToastShowing = true;
  const { message, type, duration } = toastQueue.shift();

  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');

  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-check-circle';
  if (type === 'error') icon = 'fa-exclamation-circle';
  if (type === 'warning') icon = 'fa-exclamation-triangle';

  toast.innerHTML = `<i class="fas ${icon}"></i><span>${sanitizeHTML(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
      processToastQueue();
    }, 300);
  }, duration);
}

export function showModal(title, bodyHtml, footerHtml = '', onOpen = null) {
  return new Promise((resolve) => {
    const container = document.getElementById('modalContainer');
    const titleEl = document.getElementById('modalTitle');
    const bodyEl = document.getElementById('modalBody');
    const footerEl = document.getElementById('modalFooter');

    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    footerEl.innerHTML = footerHtml;

    container.style.display = 'flex';
    activeModal = { container, resolve };

    const closeBtn = container.querySelector('.btn-close-modal');
    closeBtn.onclick = () => closeModal(null);

    if (onOpen) onOpen(bodyEl, footerEl);
  });
}

export function closeModal(result = null) {
  if (activeModal) {
    activeModal.container.style.display = 'none';
    if (activeModal.resolve) activeModal.resolve(result);
    activeModal = null;
  }
}

export function confirmDialog(title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', destructive = false) {
  const bodyHtml = `<p>${sanitizeHTML(message)}</p>`;
  const footerHtml = `
    <button class="btn-ghost" id="btnDialogCancel">${cancelLabel}</button>
    <button class="btn-primary ${destructive ? 'btn-destructive' : ''}" id="btnDialogConfirm">${confirmLabel}</button>
  `;

  return showModal(title, bodyHtml, footerHtml, (body, footer) => {
    const btnCancel = footer.querySelector('#btnDialogCancel');
    const btnConfirm = footer.querySelector('#btnDialogConfirm');

    btnCancel.onclick = () => closeModal(false);
    btnConfirm.onclick = () => closeModal(true);
    btnCancel.focus();
  });
}

export function promptDialog(title, label, defaultValue = '') {
    const bodyHtml = `
        <div class="form-group">
            <label for="promptInput">${sanitizeHTML(label)}</label>
            <input type="text" id="promptInput" value="${sanitizeHTML(defaultValue)}">
        </div>
    `;
    const footerHtml = `
        <button class="btn-ghost" id="btnPromptCancel">Annuler</button>
        <button class="btn-primary" id="btnPromptConfirm">Valider</button>
    `;

    return showModal(title, bodyHtml, footerHtml, (body, footer) => {
        const input = body.querySelector('#promptInput');
        const btnCancel = footer.querySelector('#btnPromptCancel');
        const btnConfirm = footer.querySelector('#btnPromptConfirm');

        btnCancel.onclick = () => closeModal(null);
        btnConfirm.onclick = () => closeModal(input.value);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') btnConfirm.click();
        });

        input.focus();
    });
}


export function showLoader(message = 'Chargement...') {
  const overlay = document.getElementById('loaderOverlay');
  const msgEl = document.getElementById('loaderMessage');
  const progressFill = document.getElementById('loaderProgress');

  if (overlay && msgEl) {
    msgEl.textContent = message;
    progressFill.style.width = '0%';
    overlay.style.display = 'flex';
  }
}

export function updateProgress(percent, message = null) {
  const progressFill = document.getElementById('loaderProgress');
  const msgEl = document.getElementById('loaderMessage');

  if (progressFill) progressFill.style.width = `${percent}%`;
  if (message && msgEl) msgEl.textContent = message;
}

export function hideLoader() {
  const overlay = document.getElementById('loaderOverlay');
  if (overlay) overlay.style.display = 'none';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && activeModal) {
    closeModal(null);
  }
});
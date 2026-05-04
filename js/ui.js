import { sanitizeHTML, getDeviceInfo } from './utils.js';

let toastQueue = [];
let isToastShowing = false;

export function showToast(message, type = 'info', duration = 4000) {
  toastQueue.push({ message, type, duration });
  processToastQueue();
}

function processToastQueue() {
  if (isToastShowing || toastQueue.length === 0) return;
  isToastShowing = true;
  const { message, type, duration } = toastQueue.shift();

  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');

  let iconClass = 'fa-circle-info';
  if (type === 'success') iconClass = 'fa-circle-check';
  if (type === 'error') iconClass = 'fa-circle-xmark';
  if (type === 'warning') iconClass = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass} toast-icon"></i>
    <div class="toast-content">${sanitizeHTML(message)}</div>
  `;

  container.appendChild(toast);

  const { isTouch } = getDeviceInfo();
  if (isTouch) {
    let startX = 0;
    toast.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
    }, { passive: true });
    toast.addEventListener('touchmove', e => {
      const diffX = e.touches[0].clientX - startX;
      if (diffX > 50) {
        closeToast(toast);
      }
    }, { passive: true });
  } else {
    toast.addEventListener('click', () => closeToast(toast));
  }

  const closeTimeout = setTimeout(() => {
    closeToast(toast);
  }, duration);

  toast.dataset.timeout = closeTimeout;
}

function closeToast(toast) {
  if (toast.classList.contains('closing')) return;
  clearTimeout(toast.dataset.timeout);
  toast.classList.add('closing');
  toast.addEventListener('animationend', () => {
    toast.remove();
    isToastShowing = false;
    processToastQueue();
  });
}

export function showLoader(message = 'Chargement...') {
  const overlay = document.getElementById('loader-overlay');
  const text = document.getElementById('loader-text');
  const progress = document.getElementById('loader-progress');
  text.textContent = message;
  progress.style.width = '0%';
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
}

export function hideLoader() {
  const overlay = document.getElementById('loader-overlay');
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}

export function updateProgress(percent, message = null) {
  const progress = document.getElementById('loader-progress');
  const text = document.getElementById('loader-text');
  progress.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  if (message) text.textContent = message;
}

export function confirmDialog(title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', destructive = false) {
  return new Promise(resolve => {
    const modal = document.getElementById('modal-container');
    const mTitle = document.getElementById('modal-title');
    const mBody = document.getElementById('modal-body');
    const mFooter = document.getElementById('modal-footer');

    mTitle.textContent = title;
    mBody.innerHTML = `<p>${sanitizeHTML(message)}</p>`;

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn ghost';
    cancelBtn.textContent = cancelLabel;

    const confirmBtn = document.createElement('button');
    confirmBtn.className = `btn ${destructive ? 'destructive' : 'primary'}`;
    confirmBtn.textContent = confirmLabel;

    mFooter.innerHTML = '';
    mFooter.appendChild(cancelBtn);
    mFooter.appendChild(confirmBtn);

    modal.classList.remove('hidden');
    cancelBtn.focus();

    const closeAndResolve = (val) => {
      modal.classList.add('hidden');
      cleanup();
      resolve(val);
    };

    const handleKeydown = (e) => {
      if (e.key === 'Escape') closeAndResolve(false);
    };

    cancelBtn.addEventListener('click', () => closeAndResolve(false));
    confirmBtn.addEventListener('click', () => closeAndResolve(true));
    document.addEventListener('keydown', handleKeydown);

    const closeBtn = document.getElementById('btn-modal-close');
    const handleClose = () => closeAndResolve(false);
    closeBtn.addEventListener('click', handleClose);

    function cleanup() {
      document.removeEventListener('keydown', handleKeydown);
      closeBtn.removeEventListener('click', handleClose);
    }
  });
}

export function promptDialog(title, label, defaultValue = '', validator = null) {
  return new Promise(resolve => {
    const modal = document.getElementById('modal-container');
    const mTitle = document.getElementById('modal-title');
    const mBody = document.getElementById('modal-body');
    const mFooter = document.getElementById('modal-footer');

    mTitle.textContent = title;
    mBody.innerHTML = `
      <div class="form-group">
        <label for="prompt-input">${sanitizeHTML(label)}</label>
        <input type="text" id="prompt-input" class="form-control" value="${escapeHTML(defaultValue)}">
      </div>
    `;

    const input = document.getElementById('prompt-input');

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn ghost';
    cancelBtn.textContent = 'Annuler';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn primary';
    confirmBtn.textContent = 'Valider';

    mFooter.innerHTML = '';
    mFooter.appendChild(cancelBtn);
    mFooter.appendChild(confirmBtn);

    modal.classList.remove('hidden');
    input.focus();
    input.select();

    const closeAndResolve = (val) => {
      modal.classList.add('hidden');
      cleanup();
      resolve(val);
    };

    const submit = () => {
      const val = input.value.trim();
      if (validator && !validator(val)) {
        input.focus();
        return;
      }
      closeAndResolve(val);
    };

    const handleKeydown = (e) => {
      if (e.key === 'Escape') closeAndResolve(null);
      if (e.key === 'Enter') submit();
    };

    cancelBtn.addEventListener('click', () => closeAndResolve(null));
    confirmBtn.addEventListener('click', submit);
    document.addEventListener('keydown', handleKeydown);

    const closeBtn = document.getElementById('btn-modal-close');
    const handleClose = () => closeAndResolve(null);
    closeBtn.addEventListener('click', handleClose);

    function cleanup() {
      document.removeEventListener('keydown', handleKeydown);
      closeBtn.removeEventListener('click', handleClose);
    }
  });
}

export function openModal(title, bodyHTML, footerHTML, onOpen = null, onClose = null) {
  const modal = document.getElementById('modal-container');
  const mTitle = document.getElementById('modal-title');
  const mBody = document.getElementById('modal-body');
  const mFooter = document.getElementById('modal-footer');

  mTitle.textContent = title;
  mBody.innerHTML = bodyHTML;

  if (footerHTML) {
    mFooter.innerHTML = footerHTML;
    mFooter.style.display = 'flex';
  } else {
    mFooter.innerHTML = '';
    mFooter.style.display = 'none';
  }

  modal.classList.remove('hidden');

  if (onOpen) setTimeout(onOpen, 10);

  const handleKeydown = (e) => {
    if (e.key === 'Escape') closeModal();
  };

  const closeBtn = document.getElementById('btn-modal-close');
  const backdrop = modal.querySelector('.modal-backdrop');

  const closeModal = () => {
    modal.classList.add('hidden');
    document.removeEventListener('keydown', handleKeydown);
    closeBtn.removeEventListener('click', closeModal);
    backdrop.removeEventListener('click', closeModal);
    if (onClose) onClose();
  };

  document.addEventListener('keydown', handleKeydown);
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  return closeModal;
}

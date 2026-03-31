// Utility functions for UI: Toast, Alert, Confirm, Prompt

// Container for toasts
let toastContainer = null;

function initToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
}

/**
 * Show a toast notification
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 */
function showToast(message, type = 'info') {
  initToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    });
  }, 3000);
}

/**
 * Creates and shows a generic modal overlay
 * @param {HTMLElement} contentNode
 * @returns {function} close function
 */
function showModalOverlay(contentNode) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const content = document.createElement('div');
  content.className = 'modal-content';
  content.appendChild(contentNode);

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  // Prevent scrolling
  document.body.style.overflow = 'hidden';

  const close = () => {
    document.body.style.overflow = '';
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  };

  return close;
}

/**
 * Custom alert replacement
 * @param {string} message
 * @param {string} title
 * @returns {Promise<void>}
 */
function showAlert(message, title = 'Information') {
  return new Promise((resolve) => {
    const container = document.createElement('div');

    const h2 = document.createElement('h2');
    h2.className = 'modal-title';
    h2.textContent = title;

    const p = document.createElement('div');
    p.className = 'modal-body';
    p.textContent = message;

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.textContent = 'OK';

    actions.appendChild(btn);
    container.appendChild(h2);
    container.appendChild(p);
    container.appendChild(actions);

    const close = showModalOverlay(container);

    btn.addEventListener('click', () => {
      close();
      resolve();
    });
  });
}

/**
 * Custom confirm replacement
 * @param {string} message
 * @param {string} title
 * @returns {Promise<boolean>}
 */
function showConfirm(message, title = 'Confirmation') {
  return new Promise((resolve) => {
    const container = document.createElement('div');

    const h2 = document.createElement('h2');
    h2.className = 'modal-title';
    h2.textContent = title;

    const p = document.createElement('div');
    p.className = 'modal-body';
    p.textContent = message;

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    const btnCancel = document.createElement('button');
    btnCancel.className = 'btn btn-secondary';
    btnCancel.textContent = 'Annuler';

    const btnOk = document.createElement('button');
    btnOk.className = 'btn btn-primary';
    btnOk.textContent = 'Confirmer';

    actions.appendChild(btnCancel);
    actions.appendChild(btnOk);

    container.appendChild(h2);
    container.appendChild(p);
    container.appendChild(actions);

    const close = showModalOverlay(container);

    btnCancel.addEventListener('click', () => {
      close();
      resolve(false);
    });

    btnOk.addEventListener('click', () => {
      close();
      resolve(true);
    });
  });
}

/**
 * Custom prompt replacement
 * @param {string} message
 * @param {string} defaultValue
 * @param {string} title
 * @param {string} inputType
 * @returns {Promise<string|null>}
 */
function showPrompt(message, defaultValue = '', title = 'Saisie', inputType = 'text') {
  return new Promise((resolve) => {
    const container = document.createElement('div');

    const h2 = document.createElement('h2');
    h2.className = 'modal-title';
    h2.textContent = title;

    const p = document.createElement('div');
    p.className = 'modal-body';
    p.textContent = message;
    p.style.marginBottom = '1rem';

    const inputContainer = document.createElement('div');
    inputContainer.className = 'form-group';
    inputContainer.style.marginBottom = '1.5rem';

    const input = document.createElement('input');
    input.type = inputType;
    input.value = defaultValue;
    input.className = 'form-control'; // Ensure it picks up input styling (handled via input[...] in CSS)

    inputContainer.appendChild(input);

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    const btnCancel = document.createElement('button');
    btnCancel.className = 'btn btn-secondary';
    btnCancel.textContent = 'Annuler';

    const btnOk = document.createElement('button');
    btnOk.className = 'btn btn-primary';
    btnOk.textContent = 'Valider';

    actions.appendChild(btnCancel);
    actions.appendChild(btnOk);

    container.appendChild(h2);
    container.appendChild(p);
    container.appendChild(inputContainer);
    container.appendChild(actions);

    const close = showModalOverlay(container);

    // Focus input automatically
    setTimeout(() => input.focus(), 100);

    const submit = () => {
      close();
      resolve(input.value);
    };

    btnCancel.addEventListener('click', () => {
      close();
      resolve(null);
    });

    btnOk.addEventListener('click', submit);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
      if (e.key === 'Escape') {
        close();
        resolve(null);
      }
    });
  });
}

/**
 * Show/hide full page loader
 */
let loaderOverlay = null;

function showLoader() {
  if (!loaderOverlay) {
    loaderOverlay = document.createElement('div');
    loaderOverlay.className = 'loader-overlay';
    const loader = document.createElement('div');
    loader.className = 'loader';
    loaderOverlay.appendChild(loader);
    document.body.appendChild(loaderOverlay);
  }
  loaderOverlay.classList.remove('hidden');
}

function hideLoader() {
  if (loaderOverlay) {
    loaderOverlay.classList.add('hidden');
  }
}

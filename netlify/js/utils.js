function showToast(message, type = 'error') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `background: ${type === 'error' ? '#e63946' : '#457b9d'}; color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 10px; animation: slideInRight 0.3s ease-out; font-size: 0.95rem;`;

  const icon = type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' : '<i class="fas fa-check-circle"></i>';
  toast.innerHTML = `${icon} <span>${message}</span>`;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

const styles = document.createElement('style');
styles.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(styles);

// Replace default confirm with a promise-based modal
function showConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;';

    const box = document.createElement('div');
    box.className = 'modal-box';
    box.style.cssText = 'background: #1a1a24; padding: 25px; border-radius: 8px; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.5);';

    box.innerHTML = `
      <h3 style="margin-bottom: 15px; font-size: 1.2rem;">Confirmation</h3>
      <p style="margin-bottom: 25px; color: #ccc;">${message}</p>
      <div style="display: flex; gap: 10px;">
        <button id="btn-confirm-yes" class="btn btn-danger" style="flex: 1;">Confirmer</button>
        <button id="btn-confirm-no" class="btn btn-ghost" style="flex: 1; border-color: #555;">Annuler</button>
      </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    document.getElementById('btn-confirm-yes').onclick = () => {
      overlay.remove();
      resolve(true);
    };

    document.getElementById('btn-confirm-no').onclick = () => {
      overlay.remove();
      resolve(false);
    };
  });
}

// Replace prompt for emergency password
function showPrompt(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;';

    const box = document.createElement('div');
    box.className = 'modal-box';
    box.style.cssText = 'background: #1a1a24; padding: 25px; border-radius: 8px; width: 90%; max-width: 400px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.5);';

    box.innerHTML = `
      <h3 style="margin-bottom: 15px; font-size: 1.2rem;">Action Requise</h3>
      <p style="margin-bottom: 15px; color: #ccc; font-size: 0.9rem;">${message}</p>
      <input type="password" id="prompt-input" style="width: 100%; padding: 10px; margin-bottom: 20px; background: rgba(0,0,0,0.5); border: 1px solid #333; color: #fff; border-radius: 6px; text-align: center;" autocomplete="off" autofocus>
      <div style="display: flex; gap: 10px;">
        <button id="btn-prompt-submit" class="btn btn-primary" style="flex: 1;">Valider</button>
        <button id="btn-prompt-cancel" class="btn btn-ghost" style="flex: 1; border-color: #555;">Annuler</button>
      </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const input = document.getElementById('prompt-input');
    input.focus();

    const submit = () => {
      const val = input.value;
      overlay.remove();
      resolve(val || null);
    };

    document.getElementById('btn-prompt-submit').onclick = submit;
    document.getElementById('btn-prompt-cancel').onclick = () => {
      overlay.remove();
      resolve(null);
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });
  });
}

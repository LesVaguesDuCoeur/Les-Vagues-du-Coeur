function showToast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function getClientInfo() {
  const info = { ip: 'Inconnue', userAgent: navigator.userAgent, lat: null, lng: null };
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    if (res.ok) {
      const data = await res.json();
      info.ip = data.ip;
    }
  } catch (e) {}
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
    });
    info.lat = pos.coords.latitude;
    info.lng = pos.coords.longitude;
  } catch (e) {}
  return info;
}

function setupAutoLock(min) {
  let timer;
  const resetTimer = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      sessionStorage.clear();
      window.location.href = 'index.html';
    }, min * 60000);
  };
  document.addEventListener('mousemove', resetTimer);
  document.addEventListener('keypress', resetTimer);
  document.addEventListener('click', resetTimer);
  resetTimer();
}

let currentModal = null;
function openModal(htmlContent) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'dynamic-modal';
  const dialog = document.createElement('div');
  dialog.className = 'modal-dialog flex flex-col gap-4';
  dialog.innerHTML = htmlContent;
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  currentModal = overlay;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

function closeModal() {
  if (currentModal) {
    currentModal.remove();
    currentModal = null;
  }
}

function confirmDialog(msg) {
  return new Promise((resolve) => {
    const html = `
      <h3 class="m-0 text-xl font-bold">Confirmation</h3>
      <p class="m-0">${msg}</p>
      <div class="flex justify-between gap-4 mt-4">
        <button id="confirm-cancel" class="flex-1 p-2 rounded" style="background:transparent;color:var(--text);border:1px solid var(--border);">Annuler</button>
        <button id="confirm-ok" class="flex-1 p-2 rounded" style="background:var(--danger);color:var(--text);border:none;">Confirmer</button>
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

function promptDialog(title, inputType = 'text', placeholder = '') {
  return new Promise((resolve) => {
    const html = `
      <h3 class="m-0 text-xl font-bold">${title}</h3>
      <input type="${inputType}" id="prompt-input" placeholder="${placeholder}" class="w-full p-3 rounded border mt-4" style="background:var(--bg-element);color:var(--text);border-color:var(--border);" autocomplete="off">
      <div class="flex justify-between gap-4 mt-4">
        <button id="prompt-cancel" class="flex-1 p-2 rounded" style="background:transparent;color:var(--text);border:1px solid var(--border);">Annuler</button>
        <button id="prompt-ok" class="flex-1 p-2 rounded" style="background:var(--accent);color:var(--text);border:none;">Valider</button>
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
      const val = input.value.trim();
      closeModal();
      resolve(val || null);
    });
  });
}
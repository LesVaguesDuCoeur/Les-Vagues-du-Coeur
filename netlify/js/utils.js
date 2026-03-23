function showToast(msg, type = '') {
  const toast = document.createElement('div');
  toast.className = `toast ${type} show`;
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function getClientInfo() {
  const info = { ip: 'Inconnue', userAgent: navigator.userAgent, lat: null, lng: null };
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    info.ip = data.ip;
  } catch (e) {}
  try {
    const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 }));
    info.lat = pos.coords.latitude;
    info.lng = pos.coords.longitude;
  } catch (e) {}
  return info;
}

function setupAutoLock(minutes) {
  let timer;
  const resetTimer = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      sessionStorage.clear();
      window.location.href = 'index.html';
    }, minutes * 60 * 1000);
  };
  ['mousemove', 'keydown', 'scroll', 'click'].forEach(e => window.addEventListener(e, resetTimer));
  resetTimer();
}

function openModal(html) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'dynamic-modal';
  const dialog = document.createElement('div');
  dialog.className = 'modal-dialog';
  dialog.innerHTML = html;
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });
}

function closeModal() {
  const modal = document.getElementById('dynamic-modal');
  if (modal) modal.remove();
}

function confirmDialog(msg) {
  return new Promise(resolve => {
    openModal(`
      <h3 class="font-bold text-xl mb-4">Confirmation</h3>
      <p class="mb-6">${escapeHtml(msg)}</p>
      <div class="flex justify-between gap-4">
        <button class="flex-1 btn-danger" id="btn-cancel">Annuler</button>
        <button class="flex-1 btn-success" id="btn-confirm">Confirmer</button>
      </div>
    `);
    document.getElementById('btn-cancel').onclick = () => { closeModal(); resolve(false); };
    document.getElementById('btn-confirm').onclick = () => { closeModal(); resolve(true); };
  });
}

function formatDateFR(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copié !', 'success');
  } catch (err) {
    showToast('Erreur copie', 'error');
  }
}

function toggleVisibility(btn, fieldId) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  const isHidden = el.type === 'password';
  el.type = isHidden ? 'text' : 'password';
  btn.innerHTML = isHidden ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
}

function escapeHtml(str) {
  if (!str) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return str.toString().replace(/[&<>"']/g, m => map[m]);
}
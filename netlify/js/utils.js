function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  let icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  toast.innerHTML = `<i class="fas fa-${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function getClientInfo() {
  let info = { ip: 'Inconnue', userAgent: navigator.userAgent, lat: null, lng: null };
  try {
    const r = await fetch('https://api.ipify.org?format=json');
    const data = await r.json();
    info.ip = data.ip;
  } catch (e) {}
  return new Promise(resolve => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => { info.lat = p.coords.latitude; info.lng = p.coords.longitude; resolve(info); },
        () => resolve(info),
        { timeout: 5000 }
      );
    } else {
      resolve(info);
    }
  });
}

function setupAutoLock(minutes) {
  let timeout;
  const resetTimer = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      sessionStorage.clear();
      window.location.href = 'index.html';
    }, minutes * 60000);
  };
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(e => {
    document.addEventListener(e, resetTimer, true);
  });
  resetTimer();
}

function openModal(htmlContent) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'dynamicModal';
  const dialog = document.createElement('div');
  dialog.className = 'modal-dialog';
  dialog.innerHTML = htmlContent;
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if(e.target === overlay) closeModal();
  });
}

function closeModal() {
  const modal = document.getElementById('dynamicModal');
  if (modal) modal.remove();
}

function confirmDialog(message) {
  return new Promise(resolve => {
    const html = `
      <div class="flex-col gap-4">
        <h3 class="m-0"><i class="fas fa-question-circle text-warning"></i> Confirmation</h3>
        <p class="m-0">${message}</p>
        <div class="flex justify-between mt-4">
          <button class="btn btn-outline" id="confirmCancelBtn">Annuler</button>
          <button class="btn btn-primary" id="confirmOkBtn">Confirmer</button>
        </div>
      </div>
    `;
    openModal(html);
    document.getElementById('confirmCancelBtn').onclick = () => {
      closeModal();
      resolve(false);
    };
    document.getElementById('confirmOkBtn').onclick = () => {
      closeModal();
      resolve(true);
    };
  });
}

function formatDateFR(date) {
  if (!date) return '';
  const d = new Date(date);
  const dd = ('0' + d.getDate()).slice(-2);
  const mm = ('0' + (d.getMonth() + 1)).slice(-2);
  const yy = d.getFullYear();
  const hh = ('0' + d.getHours()).slice(-2);
  const mn = ('0' + d.getMinutes()).slice(-2);
  return `${dd}/${mm}/${yy} à ${hh}h${mn}`;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copié dans le presse-papiers');
  }).catch(() => {
    showToast('Erreur lors de la copie', 'error');
  });
}

function toggleVisibility(btn, fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    if (field.type === 'password') {
      field.type = 'text';
      btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
      field.type = 'password';
      btn.innerHTML = '<i class="fas fa-eye"></i>';
    }
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag]));
}

function checkSession(keyName) {
  const key = sessionStorage.getItem(keyName);
  if (!key) {
    window.location.href = 'index.html';
    return null;
  }
  return key;
}

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.clear();
      window.location.href = 'index.html';
    });
  }
});
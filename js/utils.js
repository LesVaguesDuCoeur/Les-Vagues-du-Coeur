function showToast(message, type) {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  let i = '';
  if (type === 'success') i = '<i class="fas fa-check-circle"></i>';
  else if (type === 'error') i = '<i class="fas fa-times-circle"></i>';
  else if (type === 'warning') i = '<i class="fas fa-exclamation-triangle"></i>';
  else if (type === 'info') i = '<i class="fas fa-info-circle"></i>';
  t.innerHTML = `${i} <span>${message}</span>`;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'slideIn 0.3s ease-in reverse forwards';
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

async function getClientInfo() {
  let ip = "?";
  let lat = null;
  let lng = null;
  let userAgent = navigator.userAgent;
  try {
    const r = await fetch('https://api.ipify.org?format=json');
    const d = await r.json();
    ip = d.ip;
  } catch (e) {}
  if (navigator.geolocation) {
    try {
      const pos = await new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch (e) {}
  }
  return { ip, userAgent, lat, lng };
}

async function sendAlertThenRedirect(logType, url, extra = {}) {
  showLoading();
  let info = await getClientInfo();
  let payload = { logType: logType, ip: info.ip, userAgent: info.userAgent };
  if (info.lat && info.lng) {
    payload.lat = info.lat;
    payload.lng = info.lng;
  }
  for (let k in extra) {
    payload[k] = extra[k];
  }

  if (logType === "Tentative suspecte") {
    payload.suspiciousActivity = true;
  } else if (logType === "Panique") {
    payload.panicAlert = true;
  } else {
    payload.logAccess = true;
  }

  try {
    await postToApi(payload);
  } catch (e) {}

  if (url) {
    window.location.href = url;
  } else {
    hideLoading();
  }
}

function setupAutoLock(minutes) {
  let timeout;
  const reset = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      sessionStorage.clear();
      window.location.href = 'index.html';
    }, minutes * 60000);
  };
  ['mousemove', 'keydown', 'click', 'touchstart'].forEach(e => document.addEventListener(e, reset));
  reset();
}

function openModal(htmlContent) {
  const c = document.getElementById('modal-container');
  c.innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this) closeModal()">
      <div class="modal-dialog">
        ${htmlContent}
      </div>
    </div>
  `;
}

function closeModal() {
  const c = document.getElementById('modal-container');
  c.innerHTML = '';
}

function confirmDialog(message) {
  return new Promise(resolve => {
    const html = `
      <div class="modal-header">
        <h3 class="m-0"><i class="fas fa-question-circle text-warning"></i> Confirmation</h3>
        <button class="btn-close" onclick="closeConfirmDialog(false)">&times;</button>
      </div>
      <p class="mb-24">${message}</p>
      <div class="flex-align-center gap-16" style="justify-content: flex-end;">
        <button class="btn-secondary" onclick="closeConfirmDialog(false)">Annuler</button>
        <button class="btn-primary" onclick="closeConfirmDialog(true)">Confirmer</button>
      </div>
    `;
    window.closeConfirmDialog = (res) => {
      closeModal();
      resolve(res);
    };
    openModal(html);
  });
}

function formatDateFR(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = n => n < 10 ? '0'+n : n;
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} à ${pad(d.getHours())}h${pad(d.getMinutes())}`;
}

function copyToClipboard(text) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copié dans le presse-papier', 'success');
  }).catch(() => {
    showToast('Erreur lors de la copie', 'error');
  });
}

function toggleVisibility(btn, fieldId) {
  const f = document.getElementById(fieldId);
  const i = btn.querySelector('i');
  if (f.type === 'password') {
    f.type = 'text';
    i.className = 'fas fa-eye-slash';
  } else {
    f.type = 'password';
    i.className = 'fas fa-eye';
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"']/g, function(m) {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#039;';
      default: return m;
    }
  });
}

function showLoading() {
  const l = document.getElementById('loading');
  if (l) l.style.display = 'flex';
}

function hideLoading() {
  const l = document.getElementById('loading');
  if (l) l.style.display = 'none';
}
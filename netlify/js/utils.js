function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

async function getClientInfo() {
  let ip = 'Inconnue', lat = null, lng = null;
  try {
    const r = await fetch('https://api.ipify.org?format=json');
    const d = await r.json();
    ip = d.ip;
  } catch(e){}

  if (navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch(e){}
  }

  return { ip, userAgent: navigator.userAgent, lat, lng };
}

function setupAutoLock(min) {
  let timeLeft = min * 60;
  const tEl = document.getElementById('timer');
  const iv = setInterval(() => {
    timeLeft--;
    if (tEl) {
      const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
      const s = (timeLeft % 60).toString().padStart(2, '0');
      tEl.textContent = `${m}:${s}`;
    }
    if (timeLeft <= 0) {
      clearInterval(iv);
      sessionStorage.clear();
      window.location.href = 'index.html';
    }
  }, 1000);

  const reset = () => timeLeft = min * 60;
  document.addEventListener('mousemove', reset);
  document.addEventListener('keypress', reset);
  document.addEventListener('click', reset);
  document.addEventListener('scroll', reset);
}

function openModal(html) {
  const c = document.getElementById('modalContainer');
  c.innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal-dialog">
        ${html}
      </div>
    </div>
  `;
}

function closeModal() {
  document.getElementById('modalContainer').innerHTML = '';
}

function confirmDialog(msg) {
  return new Promise(resolve => {
    openModal(`
      <h3 class="text-xl font-bold mb-4">Confirmation</h3>
      <p class="mb-6">${escapeHtml(msg)}</p>
      <div class="flex justify-end gap-2">
        <button class="btn" onclick="document.getElementById('btnCnfrmNo').click()">Annuler</button>
        <button class="btn btn-danger" onclick="document.getElementById('btnCnfrmYes').click()">Confirmer</button>
      </div>
      <button id="btnCnfrmNo" class="hidden"></button>
      <button id="btnCnfrmYes" class="hidden"></button>
    `);
    document.getElementById('btnCnfrmNo').onclick = () => { closeModal(); resolve(false); };
    document.getElementById('btnCnfrmYes').onclick = () => { closeModal(); resolve(true); };
  });
}

function formatDateFR(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('fr-FR');
}

function copyToClipboard(text) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copié !', 'success');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast('Copié !', 'success');
  });
}

function toggleVisibility(btn, fieldId) {
  const f = document.getElementById(fieldId);
  if (f.type === 'password') {
    f.type = 'text';
    btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
  } else {
    f.type = 'password';
    btn.innerHTML = '<i class="fas fa-eye"></i>';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.clear();
      window.location.href = 'index.html';
    });
  }
});

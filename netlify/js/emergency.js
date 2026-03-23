let currentKey = sessionStorage.getItem('emergencyKey');
let contacts = [];
let lockoutTimer = null;

window.onload = async () => {
  if (!currentKey) { window.location.href = 'index.html'; return; }
  const appData = await loadData();

  if (hashPassword(currentKey) !== appData.emergencyHash) {
    sessionStorage.removeItem('emergencyKey');
    window.location.href = 'index.html';
    return;
  }

  const decryptedContacts = decryptData(appData.emergencyContacts, currentKey);
  contacts = Array.isArray(decryptedContacts) ? decryptedContacts : [];

  const msg = decryptData(appData.emergencyMessageForEmergency, currentKey);
  if (msg) {
    document.getElementById('urgMessageText').textContent = msg;
    document.getElementById('urgMessageContainer').classList.remove('hidden');
  }

  renderContacts();
  startLockoutTimer();

  document.addEventListener('mousemove', resetLockoutTimer);
  document.addEventListener('keydown', resetLockoutTimer);
};

function startLockoutTimer() {
  clearTimeout(lockoutTimer);
  lockoutTimer = setTimeout(logout, 600000);
}

function resetLockoutTimer() {
  startLockoutTimer();
}

function renderContacts(query = '') {
  const list = document.getElementById('contactsList');
  const filtered = contacts.filter(c =>
    c.nom.toLowerCase().includes(query.toLowerCase()) ||
    c.relation.toLowerCase().includes(query.toLowerCase())
  );

  list.innerHTML = filtered.length === 0 ? '<p class="text-muted">Aucun contact trouvé.</p>' : filtered.map(c => `
    <div class="contact-row imp-${c.importance}">
      <div class="flex justify-between items-center">
        <div>
          <div class="font-bold text-xl">${c.nom}</div>
          <div class="text-muted text-sm">${c.relation}</div>
        </div>
      </div>
      <div class="social-links mt-2">
        ${['tel', 'email', 'whatsapp', 'telegram', 'snapchat', 'instagram', 'messenger'].map(type =>
          c[type] ? `<a href="${buildSocialLink(type, c[type])}" class="social-link" target="_blank"><i class="${getSocialIcon(type)}"></i></a>` : ''
        ).join('')}
      </div>
      ${c.notes ? `<div class="mt-2 text-sm italic">${c.notes}</div>` : ''}
    </div>
  `).join('');
}

function filterContacts() {
  renderContacts(document.getElementById('searchInput').value);
}

async function triggerPanic() {
  const btn = document.querySelector('.alert-level-1');
  btn.disabled = true;
  btn.textContent = 'Envoi en cours...';

  try {
    const info = await getClientInfo();
    await postToApi({ panicAlert: true, ...info });
    showToast('Alerte de niveau 1 envoyée avec succès.', 'success');
  } catch (e) {
    showToast("Erreur lors de l'envoi de l'alerte.", 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> DÉCLENCHER ALERTE NIVEAU 1';
  }
}

function logout() {
  sessionStorage.removeItem('emergencyKey');
  window.location.href = 'index.html';
}
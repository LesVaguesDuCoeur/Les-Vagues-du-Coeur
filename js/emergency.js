let fullData = null;
let emergencyCode = null;

document.addEventListener('DOMContentLoaded', async () => {
  setupAutoLock(10);
  const k = sessionStorage.getItem('_key');
  const p = sessionStorage.getItem('_page');

  if (!k || p !== 'emergency') {
    window.location.href = 'index.html';
    return;
  }

  try {
    fullData = await loadData();
    if (hashPassword(k) !== fullData.config.emergencyHash) {
      window.location.href = 'index.html';
      return;
    }
  } catch (e) {
    window.location.href = 'index.html';
    return;
  }

  emergencyCode = k;

  if (fullData.config.emergencyMessageForEmergency) {
    const msg = decryptData(fullData.config.emergencyMessageForEmergency, emergencyCode);
    if (msg) {
      document.getElementById('emergency-msg-container').style.display = 'block';
      document.getElementById('emergency-msg-content').textContent = msg;
    }
  }

  renderContacts();
  hideLoading();
});

function renderContacts() {
  const list = decryptData(fullData.contacts.emergencyContacts, emergencyCode) || [];
  const container = document.getElementById('contacts-list');
  const term = document.getElementById('search-contacts').value.toLowerCase();

  container.innerHTML = '';
  list.filter(c => c.nom.toLowerCase().includes(term)).forEach((c) => {
    const d = document.createElement('div');
    d.className = 'contact-card';
    let border = '#555';
    if(c.imp==1) border='#e63946'; else if(c.imp==2) border='#fca311'; else if(c.imp==3) border='#ffd166'; else if(c.imp==4) border='#06d6a0';
    d.style.borderLeft = `4px solid ${border}`;

    let links = '';
    if (c.tel) links += `<a href="tel:${c.tel}" class="link-icon link-phone"><i class="fas fa-phone"></i></a>`;
    if (c.email) links += `<a href="mailto:${c.email}" class="link-icon link-email"><i class="fas fa-envelope"></i></a>`;
    if (c.wa) links += `<a href="https://wa.me/${c.wa}" class="link-icon link-whatsapp" target="_blank"><i class="fab fa-whatsapp"></i></a>`;
    if (c.tg) links += `<a href="https://t.me/${c.tg}" class="link-icon link-telegram" target="_blank"><i class="fab fa-telegram"></i></a>`;
    if (c.snap) links += `<a href="https://www.snapchat.com/add/${c.snap}" class="link-icon link-snap" target="_blank"><i class="fab fa-snapchat-ghost"></i></a>`;
    if (c.ig) links += `<a href="https://www.instagram.com/${c.ig}" class="link-icon link-insta" target="_blank"><i class="fab fa-instagram"></i></a>`;
    if (c.msg) links += `<a href="https://m.me/${c.msg}" class="link-icon link-messenger" target="_blank"><i class="fab fa-facebook-messenger"></i></a>`;

    d.innerHTML = `
      <h3 class="mb-4">${escapeHtml(c.nom)}</h3>
      <p class="text-secondary text-sm mb-16">${escapeHtml(c.rel)}${c.relAutre ? ' - ' + escapeHtml(c.relAutre) : ''}</p>
      <div class="flex-wrap gap-8" style="display:flex;">${links}</div>
    `;
    container.appendChild(d);
  });
}

document.getElementById('search-contacts').addEventListener('input', renderContacts);
document.getElementById('btn-logout').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'index.html';
});

document.getElementById('btn-panic').addEventListener('click', async () => {
  const res = await confirmDialog("Déclencher l'alerte Panique Niveau 1 ? Cette action enregistrera l'incident.");
  if (res) {
    showLoading();
    const info = await getClientInfo();
    await postToApi({ panicAlert: true, logType: "Panique", ip: info.ip, userAgent: info.userAgent, lat: info.lat, lng: info.lng });
    hideLoading();
    showToast('Alerte déclenchée', 'success');
  }
});
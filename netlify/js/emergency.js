let emergencyKey = null;
let appData = null;

async function initEmergency() {
  emergencyKey = checkSession('emergencyKey');
  if (!emergencyKey) return;
  setupAutoLock(10);

  appData = await loadData();
  if (!appData || !appData.isSetup) {
    window.location.href = 'index.html';
    return;
  }

  const hash = hashPassword(emergencyKey);
  if (hash !== appData.emergencyHash) {
    sessionStorage.clear();
    window.location.href = 'index.html';
    return;
  }

  loadEmergencyContacts();
  loadEmergencyMessage();

  document.getElementById('searchInput').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('.contact-row');
    rows.forEach(r => {
      const text = r.textContent.toLowerCase();
      r.style.display = text.includes(term) ? 'flex' : 'none';
    });
  });

  document.getElementById('panicBtn').addEventListener('click', async () => {
    if (await confirmDialog('Déclencher l\'alerte de PANIQUE niveau 1 ? Un email avec votre position sera envoyé immédiatement.')) {
      const btn = document.getElementById('panicBtn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mb-2"></i><br>ENVOI...';

      const info = await getClientInfo();
      const payload = {
        panicAlert: true,
        ip: info.ip,
        userAgent: info.userAgent,
        lat: info.lat,
        lng: info.lng
      };

      await postToApi(payload);

      showToast('ALERTE DÉCLENCHÉE', 'success');
      btn.innerHTML = '<i class="fas fa-check mb-2"></i><br>ENVOYÉ';
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-bullhorn mb-2"></i><br>PANIQUE';
      }, 5000);
    }
  });
}

function loadEmergencyContacts() {
  const contacts = decryptData(appData.emergencyContacts, emergencyKey) || [];
  const list = document.getElementById('emergencyContactsList');
  list.innerHTML = '';

  if (contacts.length === 0) {
    list.innerHTML = '<div class="text-center text-muted p-4">Aucun contact d\'urgence</div>';
  } else {
    contacts.forEach((c) => {
      const row = document.createElement('div');
      row.className = `contact-row imp-${c.importance}`;

      let linksHTML = '';
      if (c.phone) linksHTML += `<a href="tel:${c.phone}" class="link-icon link-phone" title="Téléphone"><i class="fas fa-phone"></i></a>`;
      if (c.email) linksHTML += `<a href="mailto:${c.email}" class="link-icon link-email" title="Email"><i class="fas fa-envelope"></i></a>`;
      if (c.whatsapp) linksHTML += `<a href="https://wa.me/${c.whatsapp.replace(/\D/g,'')}" target="_blank" class="link-icon link-whatsapp" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>`;
      if (c.telegram) linksHTML += `<a href="https://t.me/${c.telegram.replace('@','')}" target="_blank" class="link-icon link-telegram" title="Telegram"><i class="fab fa-telegram"></i></a>`;
      if (c.snapchat) linksHTML += `<a href="https://www.snapchat.com/add/${c.snapchat.replace('@','')}" target="_blank" class="link-icon link-snap" title="Snapchat"><i class="fab fa-snapchat-ghost"></i></a>`;
      if (c.instagram) linksHTML += `<a href="https://www.instagram.com/${c.instagram.replace('@','')}" target="_blank" class="link-icon link-insta" title="Instagram"><i class="fab fa-instagram"></i></a>`;
      if (c.messenger) linksHTML += `<a href="https://m.me/${c.messenger}" target="_blank" class="link-icon link-messenger" title="Messenger"><i class="fab fa-facebook-messenger"></i></a>`;

      row.innerHTML = `
        <div class="contact-info">
          <span class="contact-name">${escapeHtml(c.name)}</span>
          <span class="contact-relation">${escapeHtml(c.relation)}</span>
        </div>
        <div class="contact-links">
          ${linksHTML}
        </div>
      `;
      list.appendChild(row);
    });
  }
}

function loadEmergencyMessage() {
  const msg = decryptData(appData.emergencyMessageForEmergency, emergencyKey);
  const card = document.getElementById('emergencyMessageCard');
  const txt = document.getElementById('emergencyMessageText');

  if (msg && msg.trim() !== '') {
    txt.textContent = msg;
    card.classList.remove('hidden');
  } else {
    card.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', initEmergency);
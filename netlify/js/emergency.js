// emergency.js - Emergency mode logic

const state = {
  key: sessionStorage.getItem('emergencyKey'),
  contacts: [],
  message: ''
};

document.addEventListener('DOMContentLoaded', async () => {
  if (!state.key) {
    window.location.href = 'index.html';
    return;
  }

  setupAutoLock(10); // Auto-lock 10 minutes

  document.getElementById('btn-logout').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  document.getElementById('btn-panic').addEventListener('click', async () => {
    if (await confirmDialog("Voulez-vous déclencher une Alerte Niveau 1 à l'administrateur ?")) {
      try {
        const clientInfo = await getClientInfo();
        await postToApi({
          action: 'panicAlert',
          data: { level: 1, info: clientInfo }
        });
        showToast('Alerte envoyée', 'success');
      } catch (e) {
        showToast("Erreur d'envoi", 'error');
      }
    }
  });

  try {
    const data = await fetchData();

    // Decrypt Emergency Message
    state.message = decryptData(data.emergencyMessageForEmergency, state.key);
    if (state.message) {
      const banner = document.getElementById('emergency-message-container');
      banner.innerHTML = `
        <div class="emergency-banner">
          <i class="fas fa-exclamation-circle"></i>
          <div>
            <strong>Message Vital :</strong><br>
            ${state.message.replace(/\n/g, '<br>')}
          </div>
        </div>
      `;
      banner.classList.remove('hidden');
    }

    // Decrypt Contacts
    state.contacts = decryptData(data.emergencyContacts, state.key, true) || [];

    // UI Update
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');

    renderContacts();
  } catch (err) {
    console.error(err);
    alert("Erreur de déchiffrement. Veuillez vous reconnecter.");
    sessionStorage.clear();
    window.location.href = 'index.html';
  }
});

function renderContacts() {
  const list = document.getElementById('contacts-list');
  list.innerHTML = '';

  const query = (document.getElementById('search-contacts')?.value || '').toLowerCase();

  const filtered = state.contacts.filter(c =>
    c.nom.toLowerCase().includes(query) ||
    (c.relation && c.relation.toLowerCase().includes(query))
  );

  if (filtered.length === 0) {
    list.innerHTML = `<div class="text-center text-muted p-4">Aucun contact trouvé.</div>`;
    return;
  }

  // Sort by importance (1 = high)
  filtered.sort((a, b) => a.importance - b.importance);

  filtered.forEach(c => {
    const row = document.createElement('div');
    row.className = `contact-row imp-${c.importance}`;

    // Build links
    let linksHtml = '';
    if (c.tel) linksHtml += `<a href="tel:${c.tel}" class="link-icon link-phone" title="Appeler"><i class="fas fa-phone"></i></a>`;
    if (c.email) linksHtml += `<a href="mailto:${c.email}" class="link-icon link-email" title="Email"><i class="fas fa-envelope"></i></a>`;
    if (c.whatsapp) linksHtml += `<a href="https://wa.me/${c.whatsapp.replace(/\D/g,'')}" target="_blank" class="link-icon link-whatsapp" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>`;
    if (c.telegram) linksHtml += `<a href="https://t.me/${c.telegram}" target="_blank" class="link-icon link-telegram" title="Telegram"><i class="fab fa-telegram"></i></a>`;
    if (c.snapchat) linksHtml += `<a href="https://www.snapchat.com/add/${c.snapchat}" target="_blank" class="link-icon link-snap" title="Snapchat"><i class="fab fa-snapchat-ghost"></i></a>`;
    if (c.instagram) linksHtml += `<a href="https://www.instagram.com/${c.instagram}" target="_blank" class="link-icon link-insta" title="Instagram"><i class="fab fa-instagram"></i></a>`;
    if (c.messenger) linksHtml += `<a href="https://m.me/${c.messenger}" target="_blank" class="link-icon link-messenger" title="Messenger"><i class="fab fa-facebook-messenger"></i></a>`;

    // No actions array since readonly
    row.innerHTML = `
      <div class="contact-info">
        <span class="contact-name">${c.nom}</span>
        <span class="contact-relation">${c.relation || ''}</span>
      </div>
      <div class="contact-links">
        ${linksHtml}
      </div>
    `;
    list.appendChild(row);
  });
}

document.getElementById('search-contacts')?.addEventListener('input', renderContacts);
let contactsData = [];

document.addEventListener('DOMContentLoaded', async () => {
  const emKey = sessionStorage.getItem('emergencyKey');
  if (!emKey) {
    window.location.href = 'index.html';
    return;
  }
  setupAutoLock(10);

  const data = await loadData();
  contactsData = decryptData(data.emergencyContacts, emKey) || [];
  const emMsg = decryptData(data.emergencyMessageForEmergency, emKey);

  if (emMsg) {
    const msgDiv = document.getElementById('emergency-message-display');
    msgDiv.innerText = emMsg;
    msgDiv.classList.remove('hidden');
  }

  renderContacts();

  document.getElementById('search-input').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = contactsData.filter(c => c.nomComplet.toLowerCase().includes(term) || c.relation.toLowerCase().includes(term) || (c.relationAutre && c.relationAutre.toLowerCase().includes(term)));
    renderContacts(filtered);
  });

  document.getElementById('panic-btn').addEventListener('click', async () => {
    if (await confirmDialog('Déclencher l\'alerte panique de niveau 1 ? Un email d\'urgence sera envoyé immédiatement.')) {
      const info = await getClientInfo();
      await postToApi({ panicAlert: true, ip: info.ip, userAgent: info.userAgent, lat: info.lat, lng: info.lng });
      showToast('Alerte déclenchée', 'error');
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });
});

function renderContacts(list = contactsData) {
  const listEl = document.getElementById('contacts-list');
  listEl.innerHTML = '';
  if (list.length === 0) {
    listEl.innerHTML = '<p class="text-center text-muted p-4">Aucun contact trouvé.</p>';
    return;
  }

  const sortedList = [...list].sort((a, b) => {
    if (a.importance < b.importance) return -1;
    if (a.importance > b.importance) return 1;
    return a.nomComplet.localeCompare(b.nomComplet);
  });

  sortedList.forEach(c => {
    const row = document.createElement('div');
    row.className = `contact-row imp-${c.importance}`;
    row.innerHTML = `
      <div class="contact-info">
        <span class="contact-name">${c.nomComplet}</span>
        <span class="contact-relation">${c.relation === 'Autre' ? c.relationAutre : c.relation}</span>
      </div>
      <div class="contact-links">
        ${c.tel ? `<a href="tel:${c.tel}" class="link-icon link-phone"><i class="fas fa-phone"></i></a>` : ''}
        ${c.email ? `<a href="mailto:${c.email}" class="link-icon link-email"><i class="fas fa-envelope"></i></a>` : ''}
        ${c.whatsapp ? `<a href="https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}" class="link-icon link-whatsapp" target="_blank"><i class="fab fa-whatsapp"></i></a>` : ''}
        ${c.telegram ? `<a href="https://t.me/${c.telegram.replace('@', '')}" class="link-icon link-telegram" target="_blank"><i class="fab fa-telegram"></i></a>` : ''}
        ${c.snapchat ? `<a href="https://www.snapchat.com/add/${c.snapchat}" class="link-icon link-snap" target="_blank"><i class="fab fa-snapchat-ghost"></i></a>` : ''}
        ${c.instagram ? `<a href="https://www.instagram.com/${c.instagram.replace('@', '')}" class="link-icon link-insta" target="_blank"><i class="fab fa-instagram"></i></a>` : ''}
        ${c.messenger ? `<a href="https://m.me/${c.messenger}" class="link-icon link-messenger" target="_blank"><i class="fab fa-facebook-messenger"></i></a>` : ''}
      </div>
    `;
    listEl.appendChild(row);
  });
}
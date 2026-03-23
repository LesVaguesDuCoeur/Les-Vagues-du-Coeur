let emergencyKey = sessionStorage.getItem('emergencyKey');
let contacts = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!emergencyKey) { window.location.href = 'index.html'; return; }
  setupAutoLock(10);

  document.getElementById('btn-logout').onclick = () => { sessionStorage.clear(); window.location.href = 'index.html'; };

  try {
    const globalData = await loadData();
    if (hashPassword(emergencyKey) !== globalData.emergencyHash) throw new Error('Invalid key');

    contacts = decryptData(globalData.emergencyContacts, emergencyKey) || [];
    const msg = decryptData(globalData.emergencyMessageForEmergency, emergencyKey);

    if (msg) {
      document.getElementById('emergency-msg-container').classList.remove('hidden');
      document.getElementById('emergency-msg-content').innerText = msg;
    }

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content-container').classList.remove('hidden');
    document.getElementById('content-container').classList.add('flex');

    renderContacts(contacts);

    document.getElementById('search-contact').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      renderContacts(contacts.filter(c =>
        (c.nom || '').toLowerCase().includes(q) ||
        (c.relation || '').toLowerCase().includes(q) ||
        (c.notes || '').toLowerCase().includes(q)
      ));
    });

    document.getElementById('btn-panic').onclick = async () => {
      if (await confirmDialog("Voulez-vous vraiment déclencher l'alerte de niveau 1 ?")) {
        const btn = document.getElementById('btn-panic');
        btn.disabled = true;
        btn.innerText = "Envoi en cours...";
        try {
          const info = await getClientInfo();
          await postToApi({ panicAlert: true, ip: info.ip, userAgent: info.userAgent, lat: info.lat, lng: info.lng });
          showToast('Alerte déclenchée avec succès', 'success');
          btn.innerHTML = `<i class="fas fa-check"></i> Alerte Envoyée`;
          btn.style.background = 'var(--success)';
        } catch (e) {
          showToast("Erreur d'envoi", 'error');
          btn.disabled = false;
          btn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Réessayer`;
        }
      }
    };

  } catch (err) {
    sessionStorage.clear();
    window.location.href = 'index.html';
  }
});

function renderContacts(list) {
  const container = document.getElementById('contacts-list');
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<p class="text-muted">Aucun contact trouvé.</p>';
    return;
  }

  list.sort((a,b) => a.importance - b.importance).forEach((c) => {
    const row = document.createElement('div');
    row.className = `contact-row imp-${c.importance}`;

    let linksHtml = '';
    if(c.phone) linksHtml += `<a href="tel:${c.phone}" class="link-icon link-phone"><i class="fas fa-phone"></i></a>`;
    if(c.email) linksHtml += `<a href="mailto:${c.email}" class="link-icon link-email"><i class="fas fa-envelope"></i></a>`;
    if(c.whatsapp) linksHtml += `<a href="https://wa.me/${c.whatsapp.replace(/\D/g,'')}" target="_blank" class="link-icon link-whatsapp"><i class="fab fa-whatsapp"></i></a>`;
    if(c.telegram) linksHtml += `<a href="https://t.me/${c.telegram}" target="_blank" class="link-icon link-telegram"><i class="fab fa-telegram"></i></a>`;
    if(c.snapchat) linksHtml += `<a href="https://www.snapchat.com/add/${c.snapchat}" target="_blank" class="link-icon link-snap"><i class="fab fa-snapchat-ghost"></i></a>`;
    if(c.instagram) linksHtml += `<a href="https://www.instagram.com/${c.instagram}" target="_blank" class="link-icon link-insta"><i class="fab fa-instagram"></i></a>`;
    if(c.messenger) linksHtml += `<a href="https://m.me/${c.messenger}" target="_blank" class="link-icon link-messenger"><i class="fab fa-facebook-messenger"></i></a>`;

    row.innerHTML = `
      <div class="contact-info">
        <span class="contact-name">${escapeHtml(c.nom)}</span>
        <span class="contact-relation">${escapeHtml(c.relation === 'Autre' ? c.relationAutre : c.relation)}</span>
        ${c.notes ? `<p class="text-xs text-muted mt-1" style="white-space:pre-wrap;">${escapeHtml(c.notes)}</p>` : ''}
      </div>
      <div class="contact-links">${linksHtml}</div>
    `;
    container.appendChild(row);
  });
}
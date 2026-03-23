document.addEventListener('DOMContentLoaded', async () => {
  const kU = sessionStorage.getItem('k_emergency');
  if (!kU) { window.location.href = 'index.html'; return; }

  const d = await loadData();
  const cl = decryptData(d.emergencyContacts, kU) || [];
  const msg = decryptData(d.emergencyMessageForEmergency, kU) || '';

  setupAutoLock(10);

  if (msg) {
    const mc = document.getElementById('messageContainer');
    mc.classList.remove('hidden');
    mc.innerHTML = `<strong>Message d'urgence :</strong><br>${escapeHtml(msg).replace(/\n/g, '<br>')}`;
  }

  document.getElementById('panicBtn').addEventListener('click', async () => {
    if (await confirmDialog('Déclencher l\'alerte panique niveau 1 ? Un email urgent sera envoyé.')) {
      const btn = document.getElementById('panicBtn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ENVOI EN COURS...';
      const info = await getClientInfo();
      await postToApi({ panicAlert: true, ip: info.ip, userAgent: info.userAgent, lat: info.lat, lng: info.lng });
      btn.innerHTML = '<i class="fas fa-check-circle"></i> ALERTE ENVOYÉE';
      btn.style.backgroundColor = 'var(--success)';
      showToast('Alerte panique envoyée', 'success');
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-bell"></i> ALERTER NIVEAU 1';
        btn.style.backgroundColor = '#cc0000';
      }, 5000);
    }
  });

  function render(term = '') {
    const l = document.getElementById('contactsList');
    l.innerHTML = '';
    const t = term.toLowerCase();

    cl.forEach(c => {
      if (t && !c.nom.toLowerCase().includes(t) && !c.telephone.includes(t)) return;

      const r = document.createElement('div');
      r.className = `contact-row imp-${c.importance}`;

      let lh = '';
      if (c.telephone) lh += `<a href="tel:${c.telephone}" class="link-icon link-phone"><i class="fas fa-phone"></i></a>`;
      if (c.email) lh += `<a href="mailto:${c.email}" class="link-icon link-email"><i class="fas fa-envelope"></i></a>`;
      if (c.whatsapp) lh += `<a href="https://wa.me/${c.whatsapp.replace(/\D/g, '')}" class="link-icon link-whatsapp" target="_blank"><i class="fab fa-whatsapp"></i></a>`;
      if (c.telegram) lh += `<a href="https://t.me/${c.telegram}" class="link-icon link-telegram" target="_blank"><i class="fab fa-telegram"></i></a>`;
      if (c.snapchat) lh += `<a href="https://www.snapchat.com/add/${c.snapchat}" class="link-icon link-snap" target="_blank"><i class="fab fa-snapchat-ghost"></i></a>`;
      if (c.instagram) lh += `<a href="https://www.instagram.com/${c.instagram}" class="link-icon link-insta" target="_blank"><i class="fab fa-instagram"></i></a>`;
      if (c.messenger) lh += `<a href="https://m.me/${c.messenger}" class="link-icon link-messenger" target="_blank"><i class="fab fa-facebook-messenger"></i></a>`;

      let nh = c.notes ? `<div class="text-xs text-muted mt-2">${escapeHtml(c.notes)}</div>` : '';

      r.innerHTML = `
        <div class="contact-info">
          <div class="flex items-center gap-2 mb-1">
            <span class="contact-name">${escapeHtml(c.nom)}</span>
            <span class="contact-relation">${escapeHtml(c.relation)}</span>
          </div>
          ${nh}
        </div>
        <div class="contact-links">${lh}</div>
      `;
      l.appendChild(r);
    });
  }

  document.getElementById('searchContacts').addEventListener('input', (e) => render(e.target.value));
  render();
});

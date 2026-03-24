document.addEventListener('DOMContentLoaded', async function() {
  setupAutoLock(10);
  var ek = sessionStorage.getItem('ek');
  if (!ek) { window.location.href = 'index.html'; return; }

  var d = null, c = [];
  try {
    d = await loadData();
    var h = await hashPassword(ek);
    if (h !== d.emergencyHash) { sessionStorage.clear(); window.location.href = 'index.html'; return; }

    var msg = decryptData(d.emergencyMessageForEmergency, ek);
    if (msg) {
      document.getElementById('msg-container').classList.remove('hidden');
      document.getElementById('msg-content').textContent = msg;
    }

    c = decryptData(d.emergencyContacts, ek) || [];
    renderUrgContacts();
  } catch (e) {
    showToast("Erreur init urgence", "error");
  }

  document.getElementById('btn-logout-u').addEventListener('click', function() {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  document.getElementById('btn-panic').addEventListener('click', async function() {
    if (await confirmDialog("Déclencher une Alerte Panique Niveau 1 ?")) {
      var b = document.getElementById('btn-panic');
      b.disabled = true;
      b.innerHTML = '<i class="fas fa-spinner fa-spin mr-2" style="margin-right:8px;"></i> Alerte en cours...';
      await sendAlertThenRedirect('panicAlert', null);
      showToast("Alerte Panique Niveau 1 déclenchée", "error");
      b.innerHTML = '<i class="fas fa-check mr-2" style="margin-right:8px;"></i> Alerte envoyée';
    }
  });

  document.getElementById('search-urg').addEventListener('input', renderUrgContacts);

  function renderUrgContacts() {
    var v = document.getElementById('search-urg').value.toLowerCase();
    var l = document.getElementById('list-urg-contacts');
    var fc = c.filter(function(x) {
      return (x.nom || "").toLowerCase().includes(v) || (x.relation || "").toLowerCase().includes(v) || (x.tel || "").toLowerCase().includes(v);
    });
    fc.sort(function(a, b) { return (a.importance || 5) - (b.importance || 5); });
    l.innerHTML = '';

    if (fc.length === 0) {
      l.innerHTML = '<div class="text-gray text-center p-4">Aucun contact trouvé.</div>';
      return;
    }

    fc.forEach(function(x) {
      var d = document.createElement('div');
      d.className = 'contact-item imp-' + (x.importance || 5) + ' flex justify-between items-center bg-card p-4 rounded-lg mb-4';

      var ic = '';
      if (x.tel) ic += '<a href="tel:' + escapeHtml(x.tel) + '" class="link-icon link-phone"><i class="fas fa-phone"></i></a> ';
      if (x.email) ic += '<a href="mailto:' + escapeHtml(x.email) + '" class="link-icon link-email"><i class="fas fa-envelope"></i></a> ';
      if (x.wa) ic += '<a href="https://wa.me/' + escapeHtml(x.wa) + '" class="link-icon link-whatsapp" target="_blank"><i class="fab fa-whatsapp"></i></a> ';
      if (x.tg) ic += '<a href="https://t.me/' + escapeHtml(x.tg) + '" class="link-icon link-telegram" target="_blank"><i class="fab fa-telegram"></i></a> ';
      if (x.snap) ic += '<a href="https://www.snapchat.com/add/' + escapeHtml(x.snap) + '" class="link-icon link-snap" target="_blank"><i class="fab fa-snapchat-ghost"></i></a> ';
      if (x.insta) ic += '<a href="https://www.instagram.com/' + escapeHtml(x.insta) + '" class="link-icon link-insta" target="_blank"><i class="fab fa-instagram"></i></a> ';
      if (x.msn) ic += '<a href="https://m.me/' + escapeHtml(x.msn) + '" class="link-icon link-messenger" target="_blank"><i class="fab fa-facebook-messenger"></i></a> ';

      var nb = '';
      if (x.notes) nb = '<div class="text-sm text-gray mt-2" style="white-space:pre-wrap; background:rgba(255,255,255,0.05); padding:8px; border-radius:4px;">' + escapeHtml(x.notes) + '</div>';

      d.innerHTML = '<div style="flex:1;">' +
        '<div style="font-weight:600; font-size:1.1rem; color:#fff;">' + escapeHtml(x.nom) + '</div>' +
        '<div class="text-sm text-gray mb-3">' + escapeHtml(x.relation) + (x.relation === 'Autre' && x.relationDesc ? ' - ' + escapeHtml(x.relationDesc) : '') + '</div>' +
        '<div class="flex gap-2">' + ic + '</div>' + nb + '</div>';

      l.appendChild(d);
    });
  }
});

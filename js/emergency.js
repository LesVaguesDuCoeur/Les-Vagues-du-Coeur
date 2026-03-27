var gD = null;
var gK = null;

document.addEventListener('DOMContentLoaded', async function() {
  setupAutoLock(10);

  var ek = sessionStorage.getItem('ek');
  if (!ek) { window.location.href = 'index.html'; return; }
  gK = ek;

  document.getElementById('btn-logout').addEventListener('click', function() {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  try {
    gD = await loadData();
    if (!gD.isSetup) { window.location.href = 'index.html'; return; }

    var msg = decryptData(gD.emergencyMessageForEmergency, gK);
    if (msg && msg.trim() !== '') {
      document.getElementById('msg-box').style.display = 'block';
      document.getElementById('urg-msg-txt').textContent = msg;
    }

    renderContacts();
  } catch (e) {
    showToast('Erreur', 'error');
  }

  document.getElementById('search-contact').addEventListener('input', function() {
    var v = this.value.toLowerCase();
    var cs = decryptData(gD.emergencyContacts, gK) || [];
    var f = cs.filter(function(c) {
      return (c.nom && c.nom.toLowerCase().indexOf(v) > -1) ||
             (c.relation && c.relation.toLowerCase().indexOf(v) > -1) ||
             (c.relationAutre && c.relationAutre.toLowerCase().indexOf(v) > -1) ||
             (c.notes && c.notes.toLowerCase().indexOf(v) > -1);
    });
    renderContactsList(f);
  });

  document.getElementById('btn-panic').addEventListener('click', async function() {
    if (!await confirmDialog('Envoyer une alerte niveau 1 ?')) return;
    this.disabled = true;
    this.textContent = 'Envoi...';
    await sendAlertThenRedirect('panicAlert');
    this.textContent = 'Alerte envoyée';
    this.classList.replace('danger', 'success');
  });
});

function renderContacts() {
  var cs = decryptData(gD.emergencyContacts, gK) || [];
  cs.sort(function(a, b) { return a.importance - b.importance; });
  renderContactsList(cs);
}

function renderContactsList(cs) {
  var html = '';
  cs.forEach(function(c) {
    var rel = c.relation === 'Autre' ? c.relationAutre : c.relation;
    html += '<div class="contact-item" data-imp="'+c.importance+'">';
    html += '<div class="contact-header">';
    html += '<div><div class="contact-name">'+escapeHtml(c.nom)+'</div><div class="contact-relation">'+escapeHtml(rel)+'</div></div>';
    html += '</div>';
    html += '<div class="contact-actions">';
    if (c.tel) html += '<a href="tel:'+escapeHtml(c.tel)+'" class="link-icon link-phone"><i class="fas fa-phone"></i></a>';
    if (c.mail) html += '<a href="mailto:'+escapeHtml(c.mail)+'" class="link-icon link-email"><i class="fas fa-envelope"></i></a>';
    if (c.wa) html += '<a href="https://wa.me/'+escapeHtml(c.wa)+'" target="_blank" class="link-icon link-whatsapp"><i class="fab fa-whatsapp"></i></a>';
    if (c.tg) html += '<a href="https://t.me/'+escapeHtml(c.tg)+'" target="_blank" class="link-icon link-telegram"><i class="fab fa-telegram-plane"></i></a>';
    if (c.snap) html += '<a href="https://www.snapchat.com/add/'+escapeHtml(c.snap)+'" target="_blank" class="link-icon link-snap"><i class="fab fa-snapchat-ghost"></i></a>';
    if (c.ig) html += '<a href="https://www.instagram.com/'+escapeHtml(c.ig)+'" target="_blank" class="link-icon link-insta"><i class="fab fa-instagram"></i></a>';
    if (c.msg) html += '<a href="https://m.me/'+escapeHtml(c.msg)+'" target="_blank" class="link-icon link-messenger"><i class="fab fa-facebook-messenger"></i></a>';
    html += '</div>';
    if (c.notes) html += '<div style="margin-top:8px; padding:8px; background:rgba(0,0,0,0.2); border-radius:4px; font-size:0.85rem; color:#ccc;">'+escapeHtml(c.notes).replace(/\n/g, '<br>')+'</div>';
    html += '</div>';
  });
  if (cs.length === 0) html = '<p class="text-center" style="color:#aaa;">Aucun contact</p>';
  document.getElementById('contacts-list').innerHTML = html;
}
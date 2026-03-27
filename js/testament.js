var gD = null;
var gK = null;

document.addEventListener('DOMContentLoaded', async function() {
  setupAutoLock(15);

  var tk = sessionStorage.getItem('tk');
  if (!tk) { window.location.href = 'index.html'; return; }
  gK = tk;

  document.getElementById('btn-logout').addEventListener('click', function() {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  document.getElementById('btn-pdf').addEventListener('click', function() {
    var e = document.getElementById('pdf-content');
    html2pdf().from(e).save('Testament.pdf');
  });

  try {
    gD = await loadData();
    if (!gD.isSetup) { window.location.href = 'index.html'; return; }

    var td = decryptData(gD.testamentData, gK) || { identity: {}, content: '' };

    document.getElementById('t-nom-prenom').textContent = (td.identity.nom || '') + ' ' + (td.identity.prenom || '');
    document.getElementById('t-dateN').textContent = td.identity.dateNaissance || '...';
    document.getElementById('t-lieuN').textContent = td.identity.lieuNaissance || '...';
    document.getElementById('t-nat').textContent = td.identity.nationalite || '...';
    document.getElementById('t-adresse').textContent = td.identity.adresse || '...';
    document.getElementById('t-dateNow').textContent = formatDateFR(new Date());
    document.getElementById('t-content').innerHTML = td.content;

  } catch (e) {
    showToast('Erreur de chargement', 'error');
  }
});
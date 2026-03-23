let testamentKey = sessionStorage.getItem('testamentKey');
let testamentData = {};

document.addEventListener('DOMContentLoaded', async () => {
  if (!testamentKey) { window.location.href = 'index.html'; return; }
  setupAutoLock(15);
  document.getElementById('btn-logout').onclick = () => { sessionStorage.clear(); window.location.href = 'index.html'; };

  try {
    const globalData = await loadData();
    if (hashPassword(testamentKey) !== globalData.testamentHash) throw new Error('Invalid key');

    testamentData = decryptData(globalData.testamentData, testamentKey) || { identity: {}, content: '', lastModified: null };

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content-container').classList.remove('hidden');

    renderTestament();

    document.getElementById('btn-pdf-testament').onclick = exportPdf;
  } catch (err) {
    sessionStorage.clear();
    window.location.href = 'index.html';
  }
});

function renderTestament() {
  const d = testamentData;
  const civil = document.getElementById('civil-content');
  civil.innerHTML = `
    <p><b>Nom Complet :</b> ${escapeHtml(d.identity.nom || 'Non renseigné')}</p>
    <p><b>Date de naissance :</b> ${formatDateFR(d.identity.dob)}</p>
    <p><b>Lieu de naissance :</b> ${escapeHtml(d.identity.lieu || 'Non renseigné')}</p>
    <p><b>Nationalité :</b> ${escapeHtml(d.identity.nat || 'Non renseigné')}</p>
    <p><b>Adresse :</b> ${escapeHtml(d.identity.addr || 'Non renseigné')}</p>
  `;
  document.getElementById('testament-body').innerHTML = d.content || '<p class="text-center text-muted">Testament vide.</p>';
}

function exportPdf() {
  const d = testamentData;
  const content = document.createElement('div');
  content.innerHTML = `
    <h1 style="text-align:center; margin-bottom: 20px;">TESTAMENT — DERNIÈRES VOLONTÉS</h1>
    <div style="margin-bottom: 30px; padding: 10px; border: 1px solid #ccc;">
      <h3>État Civil</h3>
      <p><b>Nom :</b> ${escapeHtml(d.identity.nom || '')}</p>
      <p><b>Né(e) le :</b> ${formatDateFR(d.identity.dob)} à ${escapeHtml(d.identity.lieu || '')}</p>
      <p><b>Nationalité :</b> ${escapeHtml(d.identity.nat || '')}</p>
      <p><b>Adresse :</b> ${escapeHtml(d.identity.addr || '')}</p>
    </div>
    <div style="margin-bottom: 30px;">
      ${d.content || ''}
    </div>
    <p style="text-align:right; margin-top: 50px;">Fait le ${new Date().toLocaleDateString('fr-FR')}</p>
  `;
  html2pdf().from(content).save('Testament.pdf');
}
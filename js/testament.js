let fullData = null;
let testamentCode = null;

document.addEventListener('DOMContentLoaded', async () => {
  setupAutoLock(15);
  const k = sessionStorage.getItem('_key');
  const p = sessionStorage.getItem('_page');

  if (!k || p !== 'testament') {
    window.location.href = 'index.html';
    return;
  }

  try {
    fullData = await loadData();
    if (hashPassword(k) !== fullData.config.testamentHash) {
      window.location.href = 'index.html';
      return;
    }
  } catch (e) {
    window.location.href = 'index.html';
    return;
  }

  testamentCode = k;

  renderTestament();
  hideLoading();
});

document.getElementById('btn-logout').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'index.html';
});

function renderTestament() {
  const d = decryptData(fullData.testament.testamentData, testamentCode) || {};

  document.getElementById('t-nom').textContent = d.nom || '';
  document.getElementById('t-prenom').textContent = d.prenom || '';
  document.getElementById('t-ddn').textContent = d.ddn || '';
  document.getElementById('t-ldn').textContent = d.ldn || '';
  document.getElementById('t-nat').textContent = d.nat || '';
  document.getElementById('t-adr').textContent = d.adr || '';

  document.getElementById('testament-content').innerHTML = d.content || '<p class="text-secondary text-center">Aucun contenu</p>';
}

document.getElementById('btn-export-pdf').addEventListener('click', () => {
  const d = decryptData(fullData.testament.testamentData, testamentCode) || {};
  const html = `
    <div style="padding: 40px; font-family: 'Inter', sans-serif; color: #000; background: #fff;">
      <h1 style="text-align: center; color: #457b9d; margin-bottom: 40px;">TESTAMENT — DERNIÈRES VOLONTÉS</h1>
      <div style="margin-bottom: 40px; padding: 20px; border: 1px solid #ccc; background: #f9f9f9;">
        <h3>Identité</h3>
        <p><strong>Nom:</strong> ${escapeHtml(d.nom)}</p>
        <p><strong>Prénom:</strong> ${escapeHtml(d.prenom)}</p>
        <p><strong>Date de naissance:</strong> ${escapeHtml(d.ddn)}</p>
        <p><strong>Lieu de naissance:</strong> ${escapeHtml(d.ldn)}</p>
        <p><strong>Nationalité:</strong> ${escapeHtml(d.nat)}</p>
        <p><strong>Adresse:</strong> ${escapeHtml(d.adr)}</p>
      </div>
      <p style="text-align: right; font-style: italic; margin-bottom: 40px;">Dernière modification : ${formatDateFR(d.lastModified)}</p>
      <div style="margin-bottom: 60px;">${d.content || ''}</div>
      <hr style="margin-top: 60px;">
      <p style="text-align: center; font-size: 12px; color: #888;">Document généré le ${formatDateFR(new Date())} — Utilitaire</p>
    </div>
  `;
  const opt = {
    margin: 10,
    filename: 'Testament.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(html).save();
});
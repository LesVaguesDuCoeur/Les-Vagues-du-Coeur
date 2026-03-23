let testamentData = {};

document.addEventListener('DOMContentLoaded', async () => {
  const testamentKey = sessionStorage.getItem('testamentKey');
  if (!testamentKey) {
    window.location.href = 'index.html';
    return;
  }
  setupAutoLock(15);

  const data = await loadData();
  testamentData = decryptData(data.testamentData, testamentKey) || { identity: {}, content: '', lastModified: null };

  document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  renderTestament();

  document.getElementById('pdf-btn').addEventListener('click', generatePDF);
});

function renderTestament() {
  const container = document.getElementById('testament-content');
  const id = testamentData.identity || {};

  const html = `
    <h1 class="text-center mb-6" style="color:#333;">TESTAMENT — DERNIÈRES VOLONTÉS</h1>
    <div class="mb-6 p-4 rounded" style="background:#f9f9f9;border:1px solid #ccc;">
      <h3 class="mt-0 mb-4 border-b pb-2" style="border-color:#ccc;">État Civil</h3>
      <p><strong>Nom :</strong> ${id.nom || ''}</p>
      <p><strong>Prénoms :</strong> ${id.prenom || ''}</p>
      <p><strong>Date de naissance :</strong> ${id.naissance || ''}</p>
      <p><strong>Lieu de naissance :</strong> ${id.lieu || ''}</p>
      <p><strong>Nationalité :</strong> ${id.nationalite || ''}</p>
      <p><strong>Adresse :</strong> ${id.adresse || ''}</p>
    </div>
    <div class="testament-text">
      ${testamentData.content || '<p class="text-muted">Aucun contenu trouvé.</p>'}
    </div>
  `;
  container.innerHTML = html;
}

function generatePDF() {
  const container = document.getElementById('testament-content');
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 40px; color: black; background: white;">
      ${container.innerHTML}
      <div style="margin-top: 50px; text-align: right; color: #666; font-size: 0.9em; border-top: 1px solid #ccc; padding-top: 10px;">
        <p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
    </div>
  `;
  const opt = {
    margin: 1,
    filename: 'Testament.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(html).save();
}
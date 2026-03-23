document.addEventListener('DOMContentLoaded', async () => {
  const kT = sessionStorage.getItem('k_testament');
  if (!kT) { window.location.href = 'index.html'; return; }

  const d = await loadData();
  const td = decryptData(d.testamentData, kT);
  if (!td) { showToast('Erreur déchiffrement', 'error'); return; }

  setupAutoLock(15);

  const cs = document.getElementById('civilState');
  const id = td.identity || {};

  cs.innerHTML = `
    <div><span class="text-muted">Nom:</span> ${escapeHtml(id.nom || '')}</div>
    <div><span class="text-muted">Prénom:</span> ${escapeHtml(id.prenom || '')}</div>
    <div><span class="text-muted">Date de naissance:</span> ${escapeHtml(id.date || '')}</div>
    <div><span class="text-muted">Lieu de naissance:</span> ${escapeHtml(id.lieu || '')}</div>
    <div><span class="text-muted">Nationalité:</span> ${escapeHtml(id.natio || '')}</div>
    <div><span class="text-muted">Adresse:</span> ${escapeHtml(id.adr || '')}</div>
  `;

  document.getElementById('testamentBody').innerHTML = td.content || '<div class="text-muted text-center">Aucune volonté rédigée.</div>';

  document.getElementById('exportPdfBtn').addEventListener('click', () => {
    const opt = {
      margin: 10,
      filename: `Testament_${id.nom || 'Anonyme'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(document.getElementById('pdfContent')).save();
  });
});

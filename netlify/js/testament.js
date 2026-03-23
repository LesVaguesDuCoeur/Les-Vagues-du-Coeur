// testament.js - Testament read-only access logic

const state = {
  key: sessionStorage.getItem('testamentKey'),
  emergencyKey: sessionStorage.getItem('emergencyKey'),
  identity: sessionStorage.getItem('accessorIdentity'),
  testament: null
};

document.addEventListener('DOMContentLoaded', async () => {
  if (!state.key || !state.emergencyKey || !state.identity) {
    window.location.href = 'index.html';
    return;
  }

  setupAutoLock(15); // Auto-lock 15 mins

  document.getElementById('btn-logout').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  try {
    const data = await fetchData();
    state.testament = decryptData(data.testamentData, state.key, true);

    if (!state.testament || !state.testament.identity) {
      throw new Error("Testament non trouvé ou corrompu.");
    }

    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');
    document.getElementById('btn-export-pdf').classList.remove('hidden');

    renderTestament();
  } catch (err) {
    console.error(err);
    alert("Erreur de déchiffrement. Veuillez vous reconnecter.");
    sessionStorage.clear();
    window.location.href = 'index.html';
  }
});

function renderTestament() {
  const t = state.testament.identity;

  document.getElementById('testament-identity').innerHTML = `
    <p>Je soussigné(e),</p>
    <p><strong>Nom, Prénom :</strong> ${t.nom || '___________'} ${t.prenom || '___________'}</p>
    <p><strong>Né(e) le :</strong> ${t.dateNaissance || '___________'} à ${t.lieuNaissance || '___________'}</p>
    <p><strong>De nationalité :</strong> ${t.nationalite || '___________'}</p>
    <p><strong>Demeurant :</strong> ${t.adresse || '___________'}</p>
  `;

  document.getElementById('testament-content').innerHTML = state.testament.content || '<p class="text-muted">Aucun contenu rédigé.</p>';

  document.getElementById('testament-footer').innerHTML = `
    <em>Rédigé et mis à jour le ${formatDateFR(state.testament.lastModified)}</em>
  `;
}

document.getElementById('btn-export-pdf').addEventListener('click', () => {
  const t = state.testament.identity;
  const wrapper = document.createElement('div');
  wrapper.style.padding = '40px';
  wrapper.style.fontFamily = 'Arial, sans-serif';
  wrapper.style.color = 'black';
  wrapper.style.background = 'white';

  wrapper.innerHTML = `
    <h1 style="text-align: center; margin-bottom: 30px; text-transform: uppercase;">TESTAMENT — DERNIÈRES VOLONTÉS</h1>
    <div style="margin-bottom: 30px; line-height: 1.6;">
      <p>Je soussigné(e),</p>
      <p><strong>Nom, Prénom :</strong> ${t.nom || '___________'} ${t.prenom || '___________'}</p>
      <p><strong>Né(e) le :</strong> ${t.dateNaissance || '___________'} à ${t.lieuNaissance || '___________'}</p>
      <p><strong>De nationalité :</strong> ${t.nationalite || '___________'}</p>
      <p><strong>Demeurant :</strong> ${t.adresse || '___________'}</p>
      <br>
      <p><em>Rédigé et mis à jour le ${formatDateFR(state.testament.lastModified)}</em></p>
    </div>
    <hr style="margin-bottom: 30px;">
    <div>${state.testament.content || ''}</div>
    <div style="margin-top: 50px; text-align: right; font-size: 0.8rem; color: gray;">
      Document généré le ${formatDateFR(new Date().toISOString())} par ${state.identity}
    </div>
  `;

  html2pdf().from(wrapper).set({
    margin: 10,
    filename: 'Testament.pdf',
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait' }
  }).save();
});

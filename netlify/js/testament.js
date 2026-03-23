let testamentData = null;
let lockoutTimer = null;

window.onload = async () => {
  const tKey = sessionStorage.getItem('testamentKey');
  const uKey = sessionStorage.getItem('testamentUrgKey');
  if (!tKey || !uKey) { window.location.href = 'index.html'; return; }

  const appData = await loadData();
  if (hashPassword(tKey) !== appData.testamentHash || hashPassword(uKey) !== appData.emergencyHash) {
    logout();
    return;
  }

  const decrypted = decryptData(appData.testamentData, tKey);
  testamentData = decrypted || { identity: {}, content: '', lastModified: null };

  renderTestament();
  startLockoutTimer();

  document.addEventListener('mousemove', resetLockoutTimer);
  document.addEventListener('keydown', resetLockoutTimer);
};

function startLockoutTimer() {
  clearTimeout(lockoutTimer);
  lockoutTimer = setTimeout(logout, 900000);
}

function resetLockoutTimer() {
  startLockoutTimer();
}

function renderTestament() {
  const idDiv = document.getElementById('identityContent');
  const fields = [
    { k: 'nom', l: 'Nom' }, { k: 'prenom', l: 'Prénom' },
    { k: 'naissance', l: 'Date de naissance' }, { k: 'lieu', l: 'Lieu de naissance' },
    { k: 'nationalite', l: 'Nationalité' }, { k: 'adresse', l: 'Adresse' }
  ];

  idDiv.innerHTML = fields.map(f => `
    <div><span class="text-muted">${f.l}:</span> <span class="font-bold">${testamentData.identity[f.k] || 'Non renseigné'}</span></div>
  `).join('');

  document.getElementById('testamentContent').innerHTML = testamentData.content || '<p class="text-muted">Aucun contenu renseigné.</p>';
}

function exportPdf() {
  const element = document.createElement('div');
  element.style.padding = '20px';
  element.innerHTML = `
    <h1>Testament Numérique</h1>
    <h3>État civil & Identité</h3>
    ${document.getElementById('identityContent').innerHTML}
    <hr style="margin:20px 0;">
    <h3>Dernières volontés & Directives</h3>
    ${document.getElementById('testamentContent').innerHTML}
  `;
  html2pdf().from(element).save('Testament_Numerique.pdf');
}

function logout() {
  sessionStorage.removeItem('testamentKey');
  sessionStorage.removeItem('testamentUrgKey');
  window.location.href = 'index.html';
}
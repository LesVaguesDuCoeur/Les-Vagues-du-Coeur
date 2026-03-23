const VAULT_CATS = [
  { id: 'civil', name: 'État civil / Mon identité', fields: [
    { id: 'nom', label: 'Nom', type: 'text' },
    { id: 'prenom', label: 'Prénom', type: 'text' },
    { id: 'naissance', label: 'Date de naissance', type: 'date' },
    { id: 'lieu', label: 'Lieu de naissance', type: 'text' },
    { id: 'nationalite', label: 'Nationalité', type: 'text' },
    { id: 'adresse', label: 'Adresse', type: 'textarea' },
    { id: 'notes', label: 'Notes', type: 'textarea' }
  ]},
  { id: 'login', name: 'Identifiants & MDP', fields: [
    { id: 'service', label: 'Service', type: 'text' },
    { id: 'url', label: 'URL', type: 'url' },
    { id: 'id', label: 'Identifiant', type: 'text' },
    { id: 'pwd', label: 'Mot de passe', type: 'password' },
    { id: 'notes', label: 'Notes', type: 'textarea' }
  ]},
  { id: 'cb', name: 'Cartes bancaires', fields: [
    { id: 'banque', label: 'Banque', type: 'text' },
    { id: 'nom_carte', label: 'Nom carte', type: 'text' },
    { id: 'numero', label: 'Numéro', type: 'password' },
    { id: 'expiration', label: 'Expiration', type: 'text' },
    { id: 'cvv', label: 'CVV', type: 'password' },
    { id: 'pin', label: 'PIN', type: 'password' },
    { id: 'plafond', label: 'Plafond', type: 'text' },
    { id: 'notes', label: 'Notes', type: 'textarea' }
  ]},
  { id: 'docs', name: 'Documents', fields: [
    { id: 'type', label: 'Type (CNI, Passeport...)', type: 'text' },
    { id: 'numero', label: 'Numéro', type: 'text' },
    { id: 'dates', label: 'Dates (délivrance/expiration)', type: 'text' },
    { id: 'lieu', label: 'Lieu de délivrance', type: 'text' },
    { id: 'notes', label: 'Notes', type: 'textarea' }
  ]},
  { id: 'comptes', name: 'Comptes bancaires', fields: [
    { id: 'banque', label: 'Banque', type: 'text' },
    { id: 'titulaire', label: 'Titulaire', type: 'text' },
    { id: 'iban', label: 'IBAN', type: 'password' },
    { id: 'bic', label: 'BIC', type: 'text' },
    { id: 'numero', label: 'Numéro de compte', type: 'text' },
    { id: 'agence', label: 'Agence', type: 'text' },
    { id: 'notes', label: 'Notes', type: 'textarea' }
  ]},
  { id: 'codes', name: 'Codes & PIN', fields: [
    { id: 'nom', label: 'Nom (ex: Alarme, Digicode)', type: 'text' },
    { id: 'code', label: 'Code', type: 'password' },
    { id: 'notes', label: 'Notes', type: 'textarea' }
  ]},
  { id: 'medical', name: 'Infos médicales', fields: [
    { id: 'groupe_sanguin', label: 'Groupe sanguin', type: 'text' },
    { id: 'allergies', label: 'Allergies', type: 'textarea' },
    { id: 'traitements', label: 'Traitements', type: 'textarea' },
    { id: 'medecin', label: 'Médecin traitant', type: 'text' },
    { id: 'secu', label: 'N° Sécu', type: 'password' },
    { id: 'mutuelle', label: 'Mutuelle', type: 'text' },
    { id: 'adherent', label: 'N° adhérent mutuelle', type: 'text' },
    { id: 'notes', label: 'Notes', type: 'textarea' }
  ]},
  { id: 'assurances', name: 'Assurances', fields: [
    { id: 'type', label: 'Type (Auto, Habitation...)', type: 'text' },
    { id: 'compagnie', label: 'Compagnie', type: 'text' },
    { id: 'contrat', label: 'N° contrat', type: 'text' },
    { id: 'tel', label: 'Téléphone', type: 'tel' },
    { id: 'echeance', label: 'Échéance', type: 'text' },
    { id: 'notes', label: 'Notes', type: 'textarea' }
  ]},
  { id: 'licences', name: 'Licences', fields: [
    { id: 'service', label: 'Service / Logiciel', type: 'text' },
    { id: 'cle', label: 'Clé', type: 'password' },
    { id: 'email', label: 'Email associé', type: 'email' },
    { id: 'renouvellement', label: 'Renouvellement', type: 'text' },
    { id: 'notes', label: 'Notes', type: 'textarea' }
  ]},
  { id: 'notes_libres', name: 'Notes libres', fields: [
    { id: 'titre', label: 'Titre', type: 'text' },
    { id: 'contenu', label: 'Contenu', type: 'textarea' }
  ]}
];

let vaultData = [];
let currentCategory = 'civil';
let lockoutTimer = null;

window.onload = async () => {
  const vKey = sessionStorage.getItem('vaultKey');
  const uKey = sessionStorage.getItem('vaultUrgKey');
  if (!vKey || !uKey) { window.location.href = 'index.html'; return; }

  const appData = await loadData();
  if (hashPassword(vKey) !== appData.vaultHash || hashPassword(uKey) !== appData.emergencyHash) {
    logout();
    return;
  }

  const decryptedVault = decryptData(appData.vaultData, vKey);
  vaultData = Array.isArray(decryptedVault) ? decryptedVault : [];

  initVaultCategories();
  renderVault();
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

function initVaultCategories() {
  const list = document.getElementById('vaultCategories');
  list.innerHTML = VAULT_CATS.map(c => `
    <button class="btn ${currentCategory === c.id ? 'btn-primary' : ''} w-full text-left" onclick="selectVaultCategory('${c.id}')">${c.name}</button>
  `).join('');
}

function selectVaultCategory(id) {
  currentCategory = id;
  initVaultCategories();
  renderVault();
}

function renderVault() {
  const cat = VAULT_CATS.find(c => c.id === currentCategory);
  document.getElementById('currentCategoryTitle').textContent = cat.name;
  const items = vaultData.filter(x => x.categoryId === currentCategory);

  document.getElementById('vaultItemsList').innerHTML = items.length === 0 ? '<p class="text-muted">Aucun élément dans cette catégorie.</p>' : items.map(item => `
    <div class="card mb-4">
      <h4 class="font-bold mb-4">${item.data.nom || item.data.service || 'Élément'}</h4>
      <div class="flex-col gap-2">
        ${cat.fields.map(f => {
          if (!item.data[f.id]) return '';
          if (f.type === 'password') {
            return `
              <div class="flex justify-between items-center border-b border-[var(--border)] py-1">
                <span class="text-muted">${f.label}:</span>
                <div class="flex items-center gap-2">
                  <span id="pwd_${item.id}_${f.id}">••••••••</span>
                  <button class="icon-btn" onclick="togglePwd('pwd_${item.id}_${f.id}', '${item.data[f.id]}')"><i class="fas fa-eye"></i></button>
                  <button class="icon-btn" onclick="navigator.clipboard.writeText('${item.data[f.id]}');showToast('Copié')"><i class="fas fa-copy"></i></button>
                </div>
              </div>
            `;
          }
          return `
            <div class="flex justify-between border-b border-[var(--border)] py-1">
              <span class="text-muted">${f.label}:</span>
              <span>${item.data[f.id]}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
}

function togglePwd(id, val) {
  const el = document.getElementById(id);
  if (el.textContent === '••••••••') el.textContent = val;
  else el.textContent = '••••••••';
}

function logout() {
  sessionStorage.removeItem('vaultKey');
  sessionStorage.removeItem('vaultUrgKey');
  window.location.href = 'index.html';
}
// vault.js - Vault read-only access logic

const state = {
  key: sessionStorage.getItem('vaultKey'),
  emergencyKey: sessionStorage.getItem('emergencyKey'),
  identity: sessionStorage.getItem('accessorIdentity'),
  vault: []
};

const VAULT_CATS = [
  { id: 0, icon: 'fa-user', name: 'État civil / Mon identité' },
  { id: 1, icon: 'fa-key', name: 'Identifiants & MDP' },
  { id: 2, icon: 'fa-credit-card', name: 'Cartes bancaires' },
  { id: 3, icon: 'fa-id-card', name: 'Documents d\'identité' },
  { id: 4, icon: 'fa-university', name: 'Comptes bancaires' },
  { id: 5, icon: 'fa-lock', name: 'Codes & PIN' },
  { id: 6, icon: 'fa-heartbeat', name: 'Infos médicales' },
  { id: 7, icon: 'fa-shield-alt', name: 'Assurances' },
  { id: 8, icon: 'fa-barcode', name: 'Licences & Abonnements' },
  { id: 9, icon: 'fa-sticky-note', name: 'Notes libres' }
];

let activeVaultCat = 0;
let unlockedEntries = new Set();

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
    state.vault = decryptData(data.vaultData, state.key, true) || [];

    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');

    renderVault();
  } catch (err) {
    console.error(err);
    alert("Erreur de déchiffrement. Veuillez vous reconnecter.");
    sessionStorage.clear();
    window.location.href = 'index.html';
  }
});

function renderVault() {
  const sidebar = document.getElementById('vault-categories');
  sidebar.innerHTML = '';
  VAULT_CATS.forEach(c => {
    const btn = document.createElement('button');
    btn.className = `vault-cat ${activeVaultCat === c.id ? 'active' : ''}`;
    btn.innerHTML = `<i class="fas ${c.icon}"></i> ${c.name}`;
    btn.addEventListener('click', () => {
      activeVaultCat = c.id;
      renderVault();
    });
    sidebar.appendChild(btn);
  });

  const content = document.getElementById('vault-entries');
  content.innerHTML = '';

  const entries = state.vault.filter(e => e.catId === activeVaultCat);

  if (entries.length === 0) {
    content.innerHTML = `<div class="text-center text-muted p-4">Aucune entrée dans cette catégorie.</div>`;
    return;
  }

  entries.forEach(entry => {
    const isLockedAndUnauthed = entry.isLocked && !unlockedEntries.has(entry.id);

    const el = document.createElement('div');
    el.className = 'vault-entry';

    if (isLockedAndUnauthed) {
      el.innerHTML = `
        <div class="locked-overlay">
          <i class="fas fa-lock"></i>
          <h4 style="margin-bottom: 15px;">Entrée verrouillée</h4>
          <button class="btn btn-primary" onclick="attemptUnlock('${entry.id}')">Dévérouiller</button>
        </div>
        <div class="vault-entry-header" style="opacity: 0.2">
          <div class="vault-entry-title">${entry.title}</div>
        </div>
      `;
      content.appendChild(el);
      return;
    }

    let fieldsHtml = '';
    Object.keys(entry.fields).forEach(key => {
      const field = entry.fields[key];
      if (!field.value) return;

      const isSensitive = field.type === 'password';
      let displayValue = isSensitive ? '••••••••' : field.value;
      if (key === 'cvv') displayValue = '•••';
      if (key === 'pin') displayValue = '••••';
      if (key === 'cb_num' && field.value.length > 4) {
        displayValue = '•••• •••• •••• ' + field.value.slice(-4);
      }

      fieldsHtml += `
        <div class="vault-field">
          <div class="vault-field-label">${field.label}</div>
          <div class="vault-field-value" id="val-${entry.id}-${key}">${displayValue}</div>
          <div class="vault-field-actions">
            ${isSensitive ? `<button class="field-btn" onclick="toggleVaultField('${entry.id}', '${key}', '${field.value.replace(/'/g, "\\'")}', this)"><i class="fas fa-eye"></i></button>` : ''}
            <button class="field-btn" onclick="copyToClipboard('${field.value.replace(/'/g, "\\'")}')" title="Copier"><i class="fas fa-copy"></i></button>
          </div>
        </div>
      `;
    });

    el.innerHTML = `
      <div class="vault-entry-header">
        <div class="vault-entry-title">${entry.title}</div>
      </div>
      <div class="vault-fields-container">${fieldsHtml}</div>
    `;
    content.appendChild(el);
  });
}

window.toggleVaultField = (entryId, key, realValue, btnNode) => {
  const valNode = document.getElementById(`val-${entryId}-${key}`);
  const icon = btnNode.querySelector('i');

  if (icon.classList.contains('fa-eye')) {
    valNode.textContent = realValue;
    icon.className = 'fas fa-eye-slash';
  } else {
    valNode.textContent = '••••••••';
    icon.className = 'fas fa-eye';
  }
};

window.attemptUnlock = async (id) => {
  const entry = state.vault.find(e => e.id === id);
  if (!entry) return;

  if (entry.lockName && state.identity.toLowerCase() !== entry.lockName.toLowerCase()) {
    showToast(`Accès refusé. Cette entrée est restreinte à : ${entry.lockName}`, 'error');
    return;
  }

  if (entry.lockPwd) {
    const pwd = await promptDialog(`Mot de passe requis pour : ${entry.title}`);
    if (pwd !== entry.lockPwd) {
      if (pwd !== null) showToast('Mot de passe incorrect', 'error');
      return;
    }
  }

  unlockedEntries.add(id);
  renderVault();
};

let vaultData = [];
const vaultCategories = {
  etat_civil: { title: 'État civil / Mon identité' },
  identifiants: { title: 'Identifiants & MDP' },
  cartes_bancaires: { title: 'Cartes bancaires' },
  documents: { title: 'Documents' },
  comptes_bancaires: { title: 'Comptes bancaires' },
  codes_pin: { title: 'Codes & PIN' },
  infos_medicales: { title: 'Infos médicales' },
  assurances: { title: 'Assurances' },
  licences: { title: 'Licences' },
  notes: { title: 'Notes libres' }
};
let currentVaultCat = 'etat_civil';

document.addEventListener('DOMContentLoaded', async () => {
  const vaultKey = sessionStorage.getItem('vaultKey');
  if (!vaultKey) {
    window.location.href = 'index.html';
    return;
  }
  setupAutoLock(15);

  const data = await loadData();
  vaultData = decryptData(data.vaultData, vaultKey) || [];

  document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  renderVault();
});

function renderVault() {
  document.querySelectorAll('.vault-cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.vault-cat-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentVaultCat = e.currentTarget.getAttribute('data-cat');
      document.getElementById('current-vault-cat').innerText = vaultCategories[currentVaultCat].title;
      renderVaultList();
    });
  });
  renderVaultList();
}

function renderVaultList() {
  const list = document.getElementById('vault-items-list');
  list.innerHTML = '';
  const items = vaultData.filter(v => v.category === currentVaultCat);
  if (items.length === 0) {
    list.innerHTML = '<p class="text-muted text-center p-4">Aucun élément dans cette catégorie.</p>';
    return;
  }
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'vault-item-row relative';

    row.innerHTML = `<div class="absolute top-2 right-2 text-muted"><i class="fas fa-lock"></i></div>`;

    const fieldsHtml = Object.keys(item.data).map(k => {
      const val = item.data[k];
      const isMasked = ['MDP', 'Code', 'PIN', 'CVV', 'Clé', 'N° Sécu', 'IBAN'].includes(k);
      const isCardNum = k === 'Numéro' && currentVaultCat === 'cartes_bancaires';

      let displayVal = val;
      if (isMasked) displayVal = '••••••••';
      if (isCardNum) displayVal = '•••• •••• •••• ' + val.slice(-4);

      const actionsHtml = [];
      if (isMasked) {
        actionsHtml.push(`<button class="toggle-vis-btn" onclick="toggleVis(this, '${val.replace(/'/g, "\\'")}')"><i class="fas fa-eye"></i></button>`);
      }
      actionsHtml.push(`<button class="copy-btn" onclick="copyToClipboard('${val.replace(/'/g, "\\'")}')"><i class="fas fa-copy"></i></button>`);

      return `
        <div class="vault-item-field row">
          <label class="w-32">${k}:</label>
          <span class="flex-1 truncate data-span" data-val="${val}">${displayVal}</span>
          <div class="flex gap-2">
            ${actionsHtml.join('')}
          </div>
        </div>
      `;
    }).join('');

    row.innerHTML += `<div class="flex-col gap-2">${fieldsHtml}</div>`;
    list.appendChild(row);
  });
}

window.toggleVis = (btn, realVal) => {
  const span = btn.parentElement.previousElementSibling;
  const icon = btn.querySelector('i');
  if (icon.classList.contains('fa-eye')) {
    span.innerText = realVal;
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    span.innerText = '••••••••';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
};

window.copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copié dans le presse-papiers', 'success');
  });
};
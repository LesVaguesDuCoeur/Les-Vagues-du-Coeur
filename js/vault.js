let fullData = null;
let vaultCode = null;

const categoriesVault = [
  { id: 'identite', icon: 'fa-user', name: 'État civil / Mon identité' },
  { id: 'identifiants', icon: 'fa-key', name: 'Identifiants & MDP' },
  { id: 'cb', icon: 'fa-credit-card', name: 'Cartes bancaires' },
  { id: 'documents', icon: 'fa-id-card', name: 'Documents' },
  { id: 'banques', icon: 'fa-university', name: 'Comptes bancaires' },
  { id: 'codes', icon: 'fa-lock', name: 'Codes & PIN' },
  { id: 'medical', icon: 'fa-heartbeat', name: 'Infos médicales' },
  { id: 'assurances', icon: 'fa-shield-alt', name: 'Assurances' },
  { id: 'licences', icon: 'fa-barcode', name: 'Licences & Clés' },
  { id: 'notes', icon: 'fa-sticky-note', name: 'Notes libres' }
];

let currentVaultCategory = 'identite';

document.addEventListener('DOMContentLoaded', async () => {
  setupAutoLock(15);
  const k = sessionStorage.getItem('_key');
  const p = sessionStorage.getItem('_page');

  if (!k || p !== 'vault') {
    window.location.href = 'index.html';
    return;
  }

  try {
    fullData = await loadData();
    if (hashPassword(k) !== fullData.config.vaultHash) {
      window.location.href = 'index.html';
      return;
    }
  } catch (e) {
    window.location.href = 'index.html';
    return;
  }

  vaultCode = k;

  setupVaultSidebar();
  renderVault();
  hideLoading();
});

document.getElementById('btn-logout').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'index.html';
});

function setupVaultSidebar() {
  const c = document.getElementById('vault-categories');
  c.innerHTML = categoriesVault.map(cat => `
    <a href="#" class="nav-item ${cat.id===currentVaultCategory?'active':''}" data-vc="${cat.id}">
      <i class="fas ${cat.icon}"></i> ${cat.name}
    </a>
  `).join('');

  c.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      c.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      el.classList.add('active');
      currentVaultCategory = el.dataset.vc;
      renderVault();
    });
  });
}

function renderVault() {
  const cat = categoriesVault.find(c => c.id === currentVaultCategory);
  document.getElementById('current-category-title').innerHTML = `<i class="fas ${cat.icon}"></i> ${cat.name}`;

  const list = decryptData(fullData.vault.vaultData, vaultCode) || [];
  const filtered = list.filter(i => i.cat === currentVaultCategory);
  const container = document.getElementById('vault-items-list');
  container.innerHTML = '';

  filtered.forEach(item => {
    const d = document.createElement('div');
    d.className = 'vault-card';

    let content = '';
    const renderRow = (label, val) => val ? `<div class="mb-8"><span class="text-secondary text-sm d-block">${label}</span><div class="text-white">${escapeHtml(val)}</div></div>` : '';
    const renderSecretRow = (label, val, id) => val ? `
      <div class="mb-8"><span class="text-secondary text-sm d-block">${label}</span>
      <div class="input-group">
        <input type="password" id="${id}" value="${escapeHtml(val)}" readonly style="background:transparent;border:none;padding:0;color:var(--text-main);width:calc(100% - 70px);">
        <button type="button" class="toggle-pwd" style="right:30px" onclick="toggleVisibility(this, '${id}')"><i class="fas fa-eye"></i></button>
        <button type="button" class="toggle-pwd" onclick="copyToClipboard(document.getElementById('${id}').value)"><i class="fas fa-copy"></i></button>
      </div></div>
    ` : '';

    if (currentVaultCategory === 'identite') {
      content = `
        <h3 class="mb-8">${escapeHtml(item.nom)} ${escapeHtml(item.prenom)}</h3>
        ${renderRow('Date de naissance', item.ddn)}
        ${renderRow('Lieu de naissance', item.ldn)}
        ${renderRow('Nationalité', item.nat)}
        ${renderRow('Adresse', item.adr)}
        ${renderRow('Notes', item.notes)}
      `;
    } else if (currentVaultCategory === 'identifiants') {
      const uId = Math.random().toString(36).substr(2, 9);
      content = `
        <h3 class="mb-8">${escapeHtml(item.service)}</h3>
        ${item.url ? `<div class="mb-8"><span class="text-secondary text-sm d-block">URL</span><a href="${escapeHtml(item.url)}" target="_blank" class="text-accent">${escapeHtml(item.url)}</a></div>` : ''}
        ${renderRow('Identifiant', item.id)}
        ${renderSecretRow('Mot de passe', item.mdp, 'v-mdp-' + uId)}
        ${renderRow('Notes', item.notes)}
      `;
    } else if (currentVaultCategory === 'cb') {
      const uId = Math.random().toString(36).substr(2, 9);
      content = `
        <h3 class="mb-8">${escapeHtml(item.banque)}</h3>
        ${renderRow('Nom sur la carte', item.nom)}
        ${renderSecretRow('Numéro de carte', item.num, 'v-num-' + uId)}
        ${renderRow("Date d'expiration", item.exp)}
        ${renderSecretRow('CVV', item.cvv, 'v-cvv-' + uId)}
        ${renderSecretRow('Code PIN', item.pin, 'v-pin-' + uId)}
        ${renderRow('Plafond', item.plafond)}
        ${renderRow('Notes', item.notes)}
      `;
    } else if (currentVaultCategory === 'documents') {
      content = `
        <h3 class="mb-8">${escapeHtml(item.type)} - ${escapeHtml(item.num)}</h3>
        ${renderRow('Date de délivrance', item.deliv)}
        ${renderRow("Date d'expiration", item.exp)}
        ${renderRow('Lieu de délivrance', item.lieu)}
        ${renderRow('Notes', item.notes)}
      `;
    } else if (currentVaultCategory === 'banques') {
      const uId = Math.random().toString(36).substr(2, 9);
      content = `
        <h3 class="mb-8">${escapeHtml(item.banque)}</h3>
        ${renderRow('Titulaire', item.titulaire)}
        ${renderSecretRow('IBAN', item.iban, 'v-iban-' + uId)}
        ${renderRow('BIC', item.bic)}
        ${renderRow('Numéro de compte', item.compte)}
        ${renderRow('Agence', item.agence)}
        ${renderRow('Notes', item.notes)}
      `;
    } else if (currentVaultCategory === 'codes') {
      const uId = Math.random().toString(36).substr(2, 9);
      content = `
        <h3 class="mb-8">${escapeHtml(item.nom)}</h3>
        ${renderSecretRow('Code / PIN', item.code, 'v-code-' + uId)}
        ${renderRow('Notes', item.notes)}
      `;
    } else if (currentVaultCategory === 'medical') {
      content = `
        <h3 class="mb-8">Dossier Médical</h3>
        ${renderRow('Groupe sanguin', item.sang)}
        ${renderRow('N° Sécurité Sociale', item.secu)}
        ${renderRow('Mutuelle', item.mutuelle)}
        ${renderRow('N° Adhérent', item.num_adh)}
        ${renderRow('Médecin traitant', item.medecin)}
        ${renderRow('Allergies', item.allergies)}
        ${renderRow('Traitements en cours', item.traitement)}
        ${renderRow('Notes', item.notes)}
      `;
    } else if (currentVaultCategory === 'assurances') {
      content = `
        <h3 class="mb-8">${escapeHtml(item.compagnie)} - ${escapeHtml(item.type)}</h3>
        ${renderRow('N° de contrat', item.contrat)}
        ${item.tel ? `<div class="mb-8"><span class="text-secondary text-sm d-block">Téléphone</span><a href="tel:${escapeHtml(item.tel)}" class="text-accent">${escapeHtml(item.tel)}</a></div>` : ''}
        ${renderRow("Date d'échéance", item.ech)}
        ${renderRow('Notes', item.notes)}
      `;
    } else if (currentVaultCategory === 'licences') {
      const uId = Math.random().toString(36).substr(2, 9);
      content = `
        <h3 class="mb-8">${escapeHtml(item.service)}</h3>
        ${renderSecretRow('Clé de licence', item.cle, 'v-cle-' + uId)}
        ${renderRow('Email associé', item.email)}
        ${renderRow('Date de renouvellement', item.renouv)}
        ${renderRow('Notes', item.notes)}
      `;
    } else if (currentVaultCategory === 'notes') {
      content = `
        <h3 class="mb-8">${escapeHtml(item.titre)}</h3>
        <div class="mb-8"><div class="text-white" style="white-space: pre-wrap;">${escapeHtml(item.contenu)}</div></div>
      `;
    }

    d.innerHTML = content;
    container.appendChild(d);
  });
}
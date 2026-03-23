let vaultKey = sessionStorage.getItem('vaultKey');
let vaultData = [];
let activeVaultCat = 0;

const vaultCategories = [
  { id: 0, name: 'État civil / Mon identité', icon: 'fa-user' },
  { id: 1, name: 'Identifiants & MDP', icon: 'fa-key' },
  { id: 2, name: 'Cartes bancaires', icon: 'fa-credit-card' },
  { id: 3, name: 'Documents', icon: 'fa-id-card' },
  { id: 4, name: 'Comptes bancaires', icon: 'fa-university' },
  { id: 5, name: 'Codes & PIN', icon: 'fa-lock' },
  { id: 6, name: 'Infos médicales', icon: 'fa-heartbeat' },
  { id: 7, name: 'Assurances', icon: 'fa-shield-alt' },
  { id: 8, name: 'Licences', icon: 'fa-barcode' },
  { id: 9, name: 'Notes libres', icon: 'fa-sticky-note' }
];

document.addEventListener('DOMContentLoaded', async () => {
  if (!vaultKey) { window.location.href = 'index.html'; return; }
  setupAutoLock(15);
  document.getElementById('btn-logout').onclick = () => { sessionStorage.clear(); window.location.href = 'index.html'; };

  try {
    const globalData = await loadData();
    if (hashPassword(vaultKey) !== globalData.vaultHash) throw new Error('Invalid key');

    vaultData = decryptData(globalData.vaultData, vaultKey) || [];

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content-container').classList.remove('hidden');

    initVaultSidebar();
    renderVault();
  } catch (err) {
    sessionStorage.clear();
    window.location.href = 'index.html';
  }
});

function initVaultSidebar() {
  const sb = document.getElementById('vault-sidebar');
  sb.innerHTML = '';
  vaultCategories.forEach(cat => {
    const d = document.createElement('div');
    d.className = `cat-item ${cat.id === activeVaultCat ? 'active' : ''}`;
    d.innerHTML = `<i class="fas ${cat.icon} w-6 text-center"></i> ${cat.name}`;
    d.onclick = () => {
      activeVaultCat = cat.id;
      document.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
      d.classList.add('active');
      document.getElementById('vault-cat-title').innerText = cat.name;
      renderVault();
    };
    sb.appendChild(d);
  });
  document.getElementById('vault-cat-title').innerText = vaultCategories[activeVaultCat].name;
}

function renderVault() {
  const list = document.getElementById('vault-list');
  list.innerHTML = '';
  const items = vaultData.filter(v => v.categoryId === activeVaultCat);

  if (items.length === 0) {
    list.innerHTML = '<p class="text-muted">Aucun élément dans cette catégorie.</p>';
    return;
  }

  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'vault-item relative';

    let html = `<h3 class="font-bold mb-2 text-accent">${escapeHtml(item.title || 'Sans titre')}</h3>`;
    html += `<div class="absolute top-4 right-4 text-muted"><i class="fas fa-lock"></i></div>`;

    for (const [k, v] of Object.entries(item.data)) {
      if(!v) continue;
      const isPwd = ['Mot de passe','CVV','PIN','IBAN','Code','Clé','Numéro de Sécurité Sociale'].includes(k);
      const isCardNumber = k === 'Numéro' && item.categoryId === 2;
      let valHtml = '';

      if (isPwd) {
        valHtml = `<input type="password" id="v_${item.id}_${k.replace(/\s/g,'')}" value="${escapeHtml(v)}" readonly style="background:transparent;border:none;padding:0;color:var(--text);flex:1;outline:none">
                   <button class="eye-btn" onclick="toggleVisibility(this, 'v_${item.id}_${k.replace(/\s/g,'')}')"><i class="fas fa-eye"></i></button>`;
      } else if (isCardNumber) {
        const masked = '*'.repeat(Math.max(0, v.length - 4)) + v.slice(-4);
        valHtml = `<span style="flex:1" title="${escapeHtml(v)}">${escapeHtml(masked)}</span>`;
      } else {
        valHtml = `<span style="flex:1">${escapeHtml(v)}</span>`;
      }

      html += `
        <div class="vault-field">
          <span class="vault-label">${k}</span>
          <div class="vault-value">
            ${valHtml}
            <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(v).replace(/'/g,"\\'").replace(/"/g,"&quot;")}')"><i class="fas fa-copy"></i></button>
          </div>
        </div>
      `;
    }
    el.innerHTML = html;
    list.appendChild(el);
  });
}
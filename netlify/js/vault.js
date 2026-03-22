let vaultKey = null;
let serverData = null;
let vaultData = { apps: [], bank: [], docs: [], notes: '' };

document.addEventListener('DOMContentLoaded', async () => {
  // LOGOUT
  document.getElementById('btn-logout').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  // BYPASS ADMIN
  const adminKey = sessionStorage.getItem('adminKey');
  if (adminKey) {
    showLoader('vault-loader');
    serverData = await fetchFromApi();
    const realKey = decryptData(serverData.vaultKeyEnc, adminKey);
    if (!realKey) { alert('Erreur déchiffrement clé vault'); return; }
    vaultKey = realKey;
    hideLoader('vault-loader');
    await openVault();
    return;
  }

  // LOGIN NORMAL
  document.getElementById('btn-vault-login').addEventListener('click', loginVault);
  document.getElementById('vault-emg-input').addEventListener('keydown', e => { if (e.key === 'Enter') loginVault(); });
});

async function loginVault() {
  const vPwd = document.getElementById('vault-pwd-input').value;
  const ePwd = document.getElementById('vault-emg-input').value;
  if (!vPwd || !ePwd) return;

  document.getElementById('vault-error').classList.add('hidden');
  showLoader('vault-loader');
  serverData = await fetchFromApi();
  hideLoader('vault-loader');

  const vHash = CryptoJS.SHA256(vPwd).toString();
  const eHash = CryptoJS.SHA256(ePwd).toString();

  if (vHash === serverData.vaultHash && eHash === serverData.emergencyHash) {
    vaultKey = vPwd;
    sessionStorage.setItem('vaultKey', vPwd);
    await openVault();
  } else {
    document.getElementById('vault-error').classList.remove('hidden');
  }
}

async function openVault() {
  document.getElementById('vault-login').classList.add('hidden');
  document.getElementById('vault-data').classList.remove('hidden');

  const decrypted = decryptData(serverData.vault, vaultKey);
  if (decrypted) vaultData = decrypted;

  renderAllSections();

  // Notes
  document.getElementById('vault-notes').value = vaultData.notes || '';

  // Boutons ajouter
  document.getElementById('btn-add-app').addEventListener('click', () => openModal('apps'));
  document.getElementById('btn-add-bank').addEventListener('click', () => openModal('bank'));
  document.getElementById('btn-add-doc').addEventListener('click', () => openModal('docs'));

  // Sauvegarder
  document.getElementById('btn-vault-save').addEventListener('click', saveVault);

  // Modal
  document.getElementById('vault-modal-close').addEventListener('click', () => {
    document.getElementById('vault-modal').classList.add('hidden');
  });
  document.getElementById('vf-locked').addEventListener('change', e => {
    document.getElementById('vf-lock-options').classList.toggle('hidden', !e.target.checked);
  });
  document.getElementById('vault-form').addEventListener('submit', e => {
    e.preventDefault();
    submitVaultItem();
  });

  // Modal déverrouillage
  document.getElementById('btn-unlock-cancel').addEventListener('click', () => {
    document.getElementById('unlock-modal').classList.add('hidden');
  });
}

function renderAllSections() {
  renderSection('apps', 'apps-list');
  renderSection('bank', 'bank-list');
  renderSection('docs', 'docs-list');
}

function renderSection(section, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const items = vaultData[section] || [];

  if (items.length === 0) {
    container.innerHTML = '<p class="text-muted" style="padding:10px 0; font-size:0.9em;">Aucun élément — cliquez sur Ajouter</p>';
    return;
  }

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'vault-item' + (item.locked ? ' locked' : '');
    div.innerHTML = buildItemHTML(section, item);
    container.appendChild(div);

    // Events
    div.querySelector('.btn-edit-item')?.addEventListener('click', () => openModal(section, item));
    div.querySelector('.btn-del-item')?.addEventListener('click', () => deleteItem(section, item.id));
    div.querySelector('.btn-unlock-item')?.addEventListener('click', () => unlockItem(section, item));
  });
}

function buildItemHTML(section, item) {
  if (item.locked) {
    return `
      <div class="vault-item-content">
        <div class="vault-item-title">
          <i class="fas fa-lock lock-icon"></i>
          <strong>${escHtml(item.label || '—')}</strong>
          <span class="auth-badge"><i class="fas fa-user"></i> ${escHtml(item.authName || '')}</span>
        </div>
        <p class="text-muted" style="font-size:0.85em;">Verrouillé</p>
      </div>
      <div class="vault-item-actions">
        <button class="btn btn-sm btn-secondary btn-unlock-item"><i class="fas fa-unlock"></i> Ouvrir</button>
        <button class="btn btn-sm btn-ghost btn-edit-item"><i class="fas fa-pen"></i></button>
        <button class="btn btn-sm btn-danger btn-del-item"><i class="fas fa-trash"></i></button>
      </div>`;
  }

  let details = '';
  if (section === 'apps') {
    details = `
      ${item.url ? `<a href="${escHtml(item.url)}" target="_blank" class="vault-link"><i class="fas fa-globe"></i> ${escHtml(item.url)}</a>` : ''}
      ${item.user ? `<div><i class="fas fa-user"></i> <span class="vault-field-label">Identifiant :</span> <code>${escHtml(item.user)}</code></div>` : ''}
      ${item.pass ? `<div><i class="fas fa-key"></i> <span class="vault-field-label">Mot de passe :</span> <code class="vault-pass">${escHtml(item.pass)}</code></div>` : ''}
      ${item.note ? `<div class="vault-note"><i class="fas fa-sticky-note"></i> ${escHtml(item.note)}</div>` : ''}`;
  } else if (section === 'bank') {
    details = `
      ${item.bank ? `<div><i class="fas fa-university"></i> ${escHtml(item.bank)}</div>` : ''}
      ${item.code ? `<div><i class="fas fa-hashtag"></i> <span class="vault-field-label">Numéro / Code :</span> <code>${escHtml(item.code)}</code></div>` : ''}
      ${item.note ? `<div class="vault-note"><i class="fas fa-sticky-note"></i> ${escHtml(item.note)}</div>` : ''}`;
  } else if (section === 'docs') {
    details = `
      ${item.ref ? `<div><i class="fas fa-hashtag"></i> <span class="vault-field-label">Référence :</span> <code>${escHtml(item.ref)}</code></div>` : ''}
      ${item.expiry ? `<div><i class="fas fa-calendar"></i> Expiration : ${escHtml(item.expiry)}</div>` : ''}
      ${item.note ? `<div class="vault-note"><i class="fas fa-sticky-note"></i> ${escHtml(item.note)}</div>` : ''}`;
  }

  return `
    <div class="vault-item-content">
      <div class="vault-item-title"><strong>${escHtml(item.label || '—')}</strong></div>
      <div class="vault-item-details">${details}</div>
    </div>
    <div class="vault-item-actions">
      <button class="btn btn-sm btn-ghost btn-edit-item"><i class="fas fa-pen"></i></button>
      <button class="btn btn-sm btn-danger btn-del-item"><i class="fas fa-trash"></i></button>
    </div>`;
}

function openModal(section, item = null) {
  const titles = { apps: 'Application / Mot de passe', bank: 'Infos bancaires', docs: 'Document important' };
  document.getElementById('vault-modal-title').textContent = item ? 'Modifier' : `Ajouter — ${titles[section]}`;
  document.getElementById('vf-section').value = section;
  document.getElementById('vf-id').value = item ? item.id : '';
  document.getElementById('vf-locked').checked = item ? !!item.locked : false;
  document.getElementById('vf-lock-options').classList.toggle('hidden', !(item && item.locked));
  document.getElementById('vf-auth-name').value = item ? (item.authName || '') : '';
  document.getElementById('vf-item-pwd').value = '';

  const fields = document.getElementById('vf-fields');
  const v = (key) => item ? (item[key] || '') : '';

  if (section === 'apps') {
    fields.innerHTML = `
      <div class="form-group"><label>Nom de l'application / service</label><input type="text" id="vf-label" value="${escHtml(v('label'))}" required></div>
      <div class="form-group"><label>URL du site</label><input type="url" id="vf-url" value="${escHtml(v('url'))}"></div>
      <div class="form-group"><label>Identifiant / Email</label><input type="text" id="vf-user" value="${escHtml(v('user'))}" autocomplete="off"></div>
      <div class="form-group"><label>Mot de passe</label><input type="text" id="vf-pass" value="${escHtml(v('pass'))}" autocomplete="new-password"></div>
      <div class="form-group"><label>Note</label><input type="text" id="vf-note" value="${escHtml(v('note'))}"></div>`;
  } else if (section === 'bank') {
    fields.innerHTML = `
      <div class="form-group"><label>Intitulé (ex: Carte Visa, Livret A...)</label><input type="text" id="vf-label" value="${escHtml(v('label'))}" required></div>
      <div class="form-group"><label>Banque / Organisme</label><input type="text" id="vf-bank" value="${escHtml(v('bank'))}"></div>
      <div class="form-group"><label>Numéro / Code / PIN</label><input type="text" id="vf-code" value="${escHtml(v('code'))}" autocomplete="off"></div>
      <div class="form-group"><label>Note</label><input type="text" id="vf-note" value="${escHtml(v('note'))}"></div>`;
  } else if (section === 'docs') {
    fields.innerHTML = `
      <div class="form-group"><label>Type de document (ex: Passeport, CNI, Sécu...)</label><input type="text" id="vf-label" value="${escHtml(v('label'))}" required></div>
      <div class="form-group"><label>Numéro / Référence</label><input type="text" id="vf-ref" value="${escHtml(v('ref'))}" autocomplete="off"></div>
      <div class="form-group"><label>Date d'expiration</label><input type="date" id="vf-expiry" value="${escHtml(v('expiry'))}"></div>
      <div class="form-group"><label>Note</label><input type="text" id="vf-note" value="${escHtml(v('note'))}"></div>`;
  }

  document.getElementById('vault-modal').classList.remove('hidden');
  document.getElementById('vf-fields').querySelector('input')?.focus();
}

function submitVaultItem() {
  const section = document.getElementById('vf-section').value;
  const existingId = document.getElementById('vf-id').value;
  const locked = document.getElementById('vf-locked').checked;

  const g = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };

  let item = { id: existingId || Date.now().toString(), label: g('vf-label'), locked };

  if (locked) {
    item.authName = g('vf-auth-name');
    const rawPwd = g('vf-item-pwd');
    if (rawPwd) {
      item.itemHash = CryptoJS.SHA256(rawPwd).toString();
    } else if (existingId) {
      const old = (vaultData[section] || []).find(x => x.id === existingId);
      if (old) item.itemHash = old.itemHash;
    }
  }

  if (section === 'apps') { item.url = g('vf-url'); item.user = g('vf-user'); item.pass = g('vf-pass'); item.note = g('vf-note'); }
  else if (section === 'bank') { item.bank = g('vf-bank'); item.code = g('vf-code'); item.note = g('vf-note'); }
  else if (section === 'docs') { item.ref = g('vf-ref'); item.expiry = g('vf-expiry'); item.note = g('vf-note'); }

  if (existingId) {
    const idx = (vaultData[section] || []).findIndex(x => x.id === existingId);
    if (idx > -1) vaultData[section][idx] = item;
    else vaultData[section].push(item);
  } else {
    if (!vaultData[section]) vaultData[section] = [];
    vaultData[section].push(item);
  }

  document.getElementById('vault-modal').classList.add('hidden');
  renderSection(section, { apps: 'apps-list', bank: 'bank-list', docs: 'docs-list' }[section]);
}

function deleteItem(section, id) {
  if (!confirm('Supprimer cet élément ?')) return;
  vaultData[section] = (vaultData[section] || []).filter(x => x.id !== id);
  renderSection(section, { apps: 'apps-list', bank: 'bank-list', docs: 'docs-list' }[section]);
}

function unlockItem(section, item) {
  document.getElementById('unlock-modal-title').textContent = `Déverrouiller : ${item.label || ''}`;
  document.getElementById('unlock-modal-desc').textContent = item.authName ? `Autorisé : ${item.authName}` : '';
  document.getElementById('unlock-pwd-input').value = '';
  document.getElementById('unlock-error').classList.add('hidden');
  document.getElementById('unlock-modal').classList.remove('hidden');

  const confirmBtn = document.getElementById('btn-unlock-confirm');
  const newBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

  newBtn.addEventListener('click', () => {
    const pwd = document.getElementById('unlock-pwd-input').value;
    if (CryptoJS.SHA256(pwd).toString() === item.itemHash) {
      document.getElementById('unlock-modal').classList.add('hidden');
      // Afficher temporairement sans verrouillage
      const itemCopy = { ...item, locked: false };
      const listId = { apps: 'apps-list', bank: 'bank-list', docs: 'docs-list' }[section];
      const container = document.getElementById(listId);
      const divs = container.querySelectorAll('.vault-item');
      divs.forEach(div => {
        // Trouver la div correspondante et la remplacer temporairement
        const editBtn = div.querySelector('.btn-unlock-item');
        if (editBtn) {
          const parent = div;
          parent.classList.remove('locked');
          parent.innerHTML = buildItemHTML(section, itemCopy);
          // Rebind events
          parent.querySelector('.btn-edit-item')?.addEventListener('click', () => openModal(section, item));
          parent.querySelector('.btn-del-item')?.addEventListener('click', () => deleteItem(section, item.id));
        }
      });
    } else {
      document.getElementById('unlock-error').classList.remove('hidden');
    }
  });
}

async function saveVault() {
  vaultData.notes = document.getElementById('vault-notes').value;
  const btn = document.getElementById('btn-vault-save');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sauvegarde...';
  serverData.vault = encryptData(vaultData, vaultKey);
  await postToApi(serverData);
  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-check"></i> Sauvegardé !';
  setTimeout(() => { btn.innerHTML = '<i class="fas fa-save"></i> Enregistrer'; }, 2500);
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showLoader(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hideLoader(id) { document.getElementById(id)?.classList.add('hidden'); }
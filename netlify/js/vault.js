let vaultKey = null;
let currentCategory = 0;
let isVaultAdmin = false;
let vaultItems = [];

const VAULT_CATEGORIES = [
  { id: 0, title: 'État civil', icon: 'fa-user', required: true },
  { id: 1, title: 'Identifiants & MDP', icon: 'fa-key' },
  { id: 2, title: 'Cartes bancaires', icon: 'fa-credit-card' },
  { id: 3, title: 'Documents d\'identité', icon: 'fa-id-card' },
  { id: 4, title: 'Comptes bancaires', icon: 'fa-university' },
  { id: 5, title: 'Codes & PIN', icon: 'fa-lock' },
  { id: 6, title: 'Infos médicales', icon: 'fa-heartbeat' },
  { id: 7, title: 'Assurances', icon: 'fa-shield-alt' },
  { id: 8, title: 'Licences', icon: 'fa-barcode' },
  { id: 9, title: 'Notes libres', icon: 'fa-sticky-note' }
];

async function initVaultAdmin() {
  isVaultAdmin = true;
  vaultKey = vaultPwd;
  appData = await loadData();
  vaultItems = decryptData(appData.vaultData, vaultKey) || [];
  renderCategories();
  renderItems(currentCategory);

  const addBtn = document.getElementById('addVaultItemBtn');
  if (addBtn) {
    addBtn.classList.remove('hidden');
    addBtn.onclick = () => openVaultItemModal(currentCategory);
  }
}

async function initVaultExternal() {
  vaultKey = checkSession('vaultKey');
  if (!vaultKey) return;
  setupAutoLock(15);
  isVaultAdmin = false;

  appData = await loadData();
  if (!appData || !appData.isSetup) {
    window.location.href = 'index.html';
    return;
  }

  const hash = hashPassword(vaultKey);
  if (hash !== appData.vaultHash) {
    sessionStorage.clear();
    window.location.href = 'index.html';
    return;
  }

  vaultItems = decryptData(appData.vaultData, vaultKey) || [];
  renderCategories();
  renderItems(currentCategory);
}

function renderCategories() {
  const container = document.getElementById('vaultCategories');
  container.innerHTML = '';

  VAULT_CATEGORIES.forEach(cat => {
    const a = document.createElement('a');
    a.href = '#';
    a.className = `menu-item ${cat.id === currentCategory ? 'active' : ''}`;
    a.innerHTML = `<i class="fas ${cat.icon}"></i> ${escapeHtml(cat.title)}`;
    a.onclick = (e) => {
      e.preventDefault();
      currentCategory = cat.id;
      renderCategories();
      renderItems(currentCategory);
    };
    container.appendChild(a);
  });

  const titleEl = document.getElementById('currentCategoryTitle');
  if (titleEl) {
    titleEl.textContent = VAULT_CATEGORIES.find(c => c.id === currentCategory).title;
  }
}

function renderItems(categoryId) {
  const container = document.getElementById('vaultItemsList');
  container.innerHTML = '';

  const items = vaultItems.filter(i => i.categoryId === categoryId);

  if (items.length === 0) {
    container.innerHTML = '<div class="text-center text-muted p-4">Aucun élément dans cette catégorie</div>';

    if (categoryId === 0 && isVaultAdmin) {
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary mt-4';
      btn.innerHTML = '<i class="fas fa-plus"></i> Créer l\'état civil';
      btn.onclick = () => openVaultItemModal(0);
      container.appendChild(btn);
    }
    return;
  }

  items.forEach((item, idx) => {
    const isLocked = item.locked && !isVaultAdmin && !item.unlocked;
    let contentHTML = '';

    if (isLocked) {
      contentHTML = `
        <div class="text-center p-4" id="lockScreen_${item.id}">
          <i class="fas fa-lock text-warning text-2xl mb-2"></i>
          <p class="text-sm mb-4">Cet élément est verrouillé. Entrez le prénom et le mot de passe pour y accéder.</p>
          <div class="flex-col gap-2 max-w-md mx-auto">
            <input type="text" id="unlockName_${item.id}" class="form-control" placeholder="Prénom autorisé">
            <input type="password" id="unlockPwd_${item.id}" class="form-control" placeholder="Mot de passe spécifique">
            <button class="btn btn-primary" onclick="unlockItem('${item.id}')">Déverrouiller</button>
            <div id="unlockMsg_${item.id}" class="text-danger text-sm mt-2 hidden"></div>
          </div>
        </div>
        <div id="contentScreen_${item.id}" class="hidden">
          ${getFieldsHtml(item)}
        </div>
      `;
    } else {
      contentHTML = getFieldsHtml(item);
    }

    let actionsHTML = '';
    if (isVaultAdmin) {
      actionsHTML = `
        <button class="action-btn edit-btn" onclick="openVaultItemModal(${categoryId}, '${item.id}')" title="Modifier"><i class="fas fa-pen"></i></button>
        ${categoryId !== 0 ? `<button class="action-btn delete-btn" onclick="deleteVaultItem('${item.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>` : ''}
      `;
    }

    const div = document.createElement('div');
    div.className = 'vault-item';
    div.innerHTML = `
      <div class="vault-item-header">
        <div class="vault-item-title flex items-center gap-2">
          ${item.locked ? '<i class="fas fa-lock text-warning text-sm"></i>' : ''}
          ${escapeHtml(item.displayTitle || 'Élément')}
        </div>
        ${isVaultAdmin ? `<div class="contact-actions">${actionsHTML}</div>` : ''}
      </div>
      <div>${contentHTML}</div>
    `;
    container.appendChild(div);
  });
}

function getFieldsHtml(item) {
  let html = '';
  const makeField = (label, val, isSecret = false, isCopy = true, isUrl = false) => {
    if (!val) return '';
    let valHtml = '';
    if (isSecret) {
      const id = 'v_' + Math.random().toString(36).substr(2, 9);
      valHtml = `
        <div class="vault-field">
          <div class="vault-field-label">${escapeHtml(label)}</div>
          <div class="vault-field-value">
            <input type="password" id="${id}" value="${escapeHtml(val)}" readonly style="background:transparent; border:none; color:inherit; outline:none; font-family:inherit; width:100%;">
          </div>
          <div class="vault-field-actions">
            <button class="action-btn" onclick="toggleVisibility(this, '${id}')"><i class="fas fa-eye"></i></button>
            <button class="action-btn" onclick="copyToClipboard('${escapeHtml(val).replace(/'/g, "\\'")}')"><i class="fas fa-copy"></i></button>
          </div>
        </div>
      `;
      return valHtml;
    }

    if (isUrl) {
      return `
        <div class="vault-field">
          <div class="vault-field-label">${escapeHtml(label)}</div>
          <div class="vault-field-value"><a href="${escapeHtml(val)}" target="_blank" class="text-accent">${escapeHtml(val)}</a></div>
          <div class="vault-field-actions">
            ${isCopy ? `<button class="action-btn" onclick="copyToClipboard('${escapeHtml(val).replace(/'/g, "\\'")}')"><i class="fas fa-copy"></i></button>` : ''}
            <a href="${escapeHtml(val)}" target="_blank" class="action-btn"><i class="fas fa-external-link-alt"></i></a>
          </div>
        </div>
      `;
    }

    return `
      <div class="vault-field">
        <div class="vault-field-label">${escapeHtml(label)}</div>
        <div class="vault-field-value">${escapeHtml(val)}</div>
        ${isCopy ? `
        <div class="vault-field-actions">
          <button class="action-btn" onclick="copyToClipboard('${escapeHtml(val).replace(/'/g, "\\'")}')"><i class="fas fa-copy"></i></button>
        </div>` : ''}
      </div>
    `;
  };

  if (item.categoryId === 0) {
    html += makeField('Nom', item.nom, false, true);
    html += makeField('Prénom', item.prenom, false, true);
    html += makeField('Date naissance', item.dateN, false, true);
    html += makeField('Lieu naissance', item.lieuN, false, true);
    html += makeField('Nationalité', item.nat, false, true);
    html += makeField('Adresse', item.adr, false, true);
    if (item.notes) html += `<div class="mt-2 text-sm whitespace-pre-wrap">${escapeHtml(item.notes)}</div>`;
  } else if (item.categoryId === 1) {
    html += makeField('Service', item.service, false, true);
    html += makeField('URL', item.url, false, true, true);
    html += makeField('Identifiant', item.login, false, true);
    html += makeField('Mot de passe', item.pwd, true, true);
    if (item.notes) html += `<div class="mt-2 text-sm whitespace-pre-wrap">${escapeHtml(item.notes)}</div>`;
  } else if (item.categoryId === 2) {
    html += makeField('Banque', item.banque, false, true);
    html += makeField('Nom carte', item.nomCarte, false, true);
    const maskedNum = item.num ? '**** **** **** ' + item.num.slice(-4) : '';
    html += `
      <div class="vault-field">
        <div class="vault-field-label">Numéro</div>
        <div class="vault-field-value">${escapeHtml(maskedNum)}</div>
        <div class="vault-field-actions">
          <button class="action-btn" onclick="copyToClipboard('${escapeHtml(item.num || '').replace(/'/g, "\\'")}')"><i class="fas fa-copy"></i></button>
        </div>
      </div>
    `;
    html += makeField('Expiration', item.exp, false, true);
    html += makeField('CVV', item.cvv, true, true);
    html += makeField('PIN', item.pin, true, true);
    html += makeField('Plafond', item.plafond, false, true);
    if (item.notes) html += `<div class="mt-2 text-sm whitespace-pre-wrap">${escapeHtml(item.notes)}</div>`;
  } else if (item.categoryId === 3) {
    html += makeField('Type', item.typeDoc, false, true);
    html += makeField('Numéro', item.numDoc, false, true);
    html += makeField('Délivrance', item.dateDeliv, false, true);
    html += makeField('Expiration', item.dateExp, false, true);
    html += makeField('Lieu', item.lieuDoc, false, true);
    if (item.notes) html += `<div class="mt-2 text-sm whitespace-pre-wrap">${escapeHtml(item.notes)}</div>`;
  } else if (item.categoryId === 4) {
    html += makeField('Banque', item.banque, false, true);
    html += makeField('Titulaire', item.titulaire, false, true);
    html += makeField('IBAN', item.iban, true, true);
    html += makeField('BIC', item.bic, false, true);
    html += makeField('N° compte', item.numCpt, false, true);
    html += makeField('Agence', item.agence, false, true);
    if (item.notes) html += `<div class="mt-2 text-sm whitespace-pre-wrap">${escapeHtml(item.notes)}</div>`;
  } else if (item.categoryId === 5) {
    html += makeField('Nom', item.nom, false, true);
    html += makeField('Code', item.code, true, true);
    if (item.notes) html += `<div class="mt-2 text-sm whitespace-pre-wrap">${escapeHtml(item.notes)}</div>`;
  } else if (item.categoryId === 6) {
    html += makeField('Gr. Sanguin', item.gs, false, true);
    html += makeField('Allergies', item.allergies, false, true);
    html += makeField('Traitements', item.traitements, false, true);
    html += makeField('Médecin', item.medecin, false, true);
    html += makeField('N° Sécu', item.secu, true, true);
    html += makeField('Mutuelle', item.mutuelle, false, true);
    html += makeField('N° Adhérent', item.numMutuelle, false, true);
    if (item.notes) html += `<div class="mt-2 text-sm whitespace-pre-wrap">${escapeHtml(item.notes)}</div>`;
  } else if (item.categoryId === 7) {
    html += makeField('Type', item.typeAss, false, true);
    html += makeField('Compagnie', item.compagnie, false, true);
    html += makeField('N° contrat', item.numContrat, false, true);
    if (item.telAss) {
      html += `
        <div class="vault-field">
          <div class="vault-field-label">Tél</div>
          <div class="vault-field-value"><a href="tel:${escapeHtml(item.telAss)}" class="text-accent">${escapeHtml(item.telAss)}</a></div>
          <div class="vault-field-actions">
            <button class="action-btn" onclick="copyToClipboard('${escapeHtml(item.telAss).replace(/'/g, "\\'")}')"><i class="fas fa-copy"></i></button>
          </div>
        </div>
      `;
    }
    html += makeField('Échéance', item.echeance, false, true);
    if (item.notes) html += `<div class="mt-2 text-sm whitespace-pre-wrap">${escapeHtml(item.notes)}</div>`;
  } else if (item.categoryId === 8) {
    html += makeField('Service', item.service, false, true);
    html += makeField('Clé', item.cle, true, true);
    html += makeField('Email', item.email, false, true);
    html += makeField('Renouvellement', item.renouv, false, true);
    if (item.notes) html += `<div class="mt-2 text-sm whitespace-pre-wrap">${escapeHtml(item.notes)}</div>`;
  } else if (item.categoryId === 9) {
    html += `<div><strong>${escapeHtml(item.titre)}</strong></div>`;
    if (item.contenu) html += `<div class="mt-2 text-sm whitespace-pre-wrap">${escapeHtml(item.contenu)}</div>`;
  }

  return html;
}

function openVaultItemModal(categoryId, itemId = null) {
  let item = itemId ? vaultItems.find(i => i.id === itemId) : {};
  const isEdit = !!itemId;

  let fieldsHTML = '';
  if (categoryId === 0) {
    fieldsHTML = `
      <div class="form-row">
        <div class="form-group"><label>Nom *</label><input type="text" id="v_nom" class="form-control" required value="${item.nom||''}"></div>
        <div class="form-group"><label>Prénom *</label><input type="text" id="v_prenom" class="form-control" required value="${item.prenom||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Date de naissance</label><input type="date" id="v_dateN" class="form-control" value="${item.dateN||''}"></div>
        <div class="form-group"><label>Lieu de naissance</label><input type="text" id="v_lieuN" class="form-control" value="${item.lieuN||''}"></div>
      </div>
      <div class="form-group"><label>Nationalité</label><input type="text" id="v_nat" class="form-control" value="${item.nat||''}"></div>
      <div class="form-group"><label>Adresse</label><input type="text" id="v_adr" class="form-control" value="${item.adr||''}"></div>
      <div class="form-group"><label>Notes</label><textarea id="v_notes" class="form-control" rows="3">${item.notes||''}</textarea></div>
    `;
  } else if (categoryId === 1) {
    fieldsHTML = `
      <div class="form-group"><label>Service *</label><input type="text" id="v_service" class="form-control" required value="${item.service||''}"></div>
      <div class="form-group"><label>URL</label><input type="url" id="v_url" class="form-control" value="${item.url||''}"></div>
      <div class="form-row">
        <div class="form-group"><label>Identifiant</label><input type="text" id="v_login" class="form-control" value="${item.login||''}"></div>
        <div class="form-group"><label>Mot de passe</label><input type="text" id="v_pwd" class="form-control" value="${item.pwd||''}"></div>
      </div>
      <div class="form-group"><label>Notes</label><textarea id="v_notes" class="form-control" rows="3">${item.notes||''}</textarea></div>
    `;
  } else if (categoryId === 2) {
    fieldsHTML = `
      <div class="form-row">
        <div class="form-group"><label>Banque *</label><input type="text" id="v_banque" class="form-control" required value="${item.banque||''}"></div>
        <div class="form-group"><label>Nom de la carte</label><input type="text" id="v_nomCarte" class="form-control" value="${item.nomCarte||''}"></div>
      </div>
      <div class="form-group"><label>Numéro</label><input type="text" id="v_num" class="form-control" value="${item.num||''}"></div>
      <div class="form-row">
        <div class="form-group"><label>Expiration (MM/AA)</label><input type="text" id="v_exp" class="form-control" value="${item.exp||''}"></div>
        <div class="form-group"><label>CVV</label><input type="text" id="v_cvv" class="form-control" value="${item.cvv||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>PIN</label><input type="text" id="v_pin" class="form-control" value="${item.pin||''}"></div>
        <div class="form-group"><label>Plafond</label><input type="text" id="v_plafond" class="form-control" value="${item.plafond||''}"></div>
      </div>
      <div class="form-group"><label>Notes</label><textarea id="v_notes" class="form-control" rows="3">${item.notes||''}</textarea></div>
    `;
  } else if (categoryId === 3) {
    fieldsHTML = `
      <div class="form-row">
        <div class="form-group">
          <label>Type de document *</label>
          <select id="v_typeDoc" class="form-control" required>
            <option value="CNI" ${item.typeDoc==='CNI'?'selected':''}>CNI</option>
            <option value="Passeport" ${item.typeDoc==='Passeport'?'selected':''}>Passeport</option>
            <option value="Permis de conduire" ${item.typeDoc==='Permis de conduire'?'selected':''}>Permis de conduire</option>
            <option value="Titre de séjour" ${item.typeDoc==='Titre de séjour'?'selected':''}>Titre de séjour</option>
            <option value="Autre" ${item.typeDoc==='Autre'?'selected':''}>Autre</option>
          </select>
        </div>
        <div class="form-group"><label>Numéro</label><input type="text" id="v_numDoc" class="form-control" value="${item.numDoc||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Délivrance</label><input type="date" id="v_dateDeliv" class="form-control" value="${item.dateDeliv||''}"></div>
        <div class="form-group"><label>Expiration</label><input type="date" id="v_dateExp" class="form-control" value="${item.dateExp||''}"></div>
      </div>
      <div class="form-group"><label>Lieu de délivrance</label><input type="text" id="v_lieuDoc" class="form-control" value="${item.lieuDoc||''}"></div>
      <div class="form-group"><label>Notes</label><textarea id="v_notes" class="form-control" rows="3">${item.notes||''}</textarea></div>
    `;
  } else if (categoryId === 4) {
    fieldsHTML = `
      <div class="form-row">
        <div class="form-group"><label>Banque *</label><input type="text" id="v_banque" class="form-control" required value="${item.banque||''}"></div>
        <div class="form-group"><label>Titulaire</label><input type="text" id="v_titulaire" class="form-control" value="${item.titulaire||''}"></div>
      </div>
      <div class="form-group"><label>IBAN</label><input type="text" id="v_iban" class="form-control" value="${item.iban||''}"></div>
      <div class="form-row">
        <div class="form-group"><label>BIC</label><input type="text" id="v_bic" class="form-control" value="${item.bic||''}"></div>
        <div class="form-group"><label>N° compte</label><input type="text" id="v_numCpt" class="form-control" value="${item.numCpt||''}"></div>
      </div>
      <div class="form-group"><label>Agence</label><input type="text" id="v_agence" class="form-control" value="${item.agence||''}"></div>
      <div class="form-group"><label>Notes</label><textarea id="v_notes" class="form-control" rows="3">${item.notes||''}</textarea></div>
    `;
  } else if (categoryId === 5) {
    fieldsHTML = `
      <div class="form-group"><label>Nom *</label><input type="text" id="v_nom" class="form-control" required value="${item.nom||''}"></div>
      <div class="form-group"><label>Code / PIN</label><input type="text" id="v_code" class="form-control" value="${item.code||''}"></div>
      <div class="form-group"><label>Notes</label><textarea id="v_notes" class="form-control" rows="3">${item.notes||''}</textarea></div>
    `;
  } else if (categoryId === 6) {
    fieldsHTML = `
      <div class="form-row">
        <div class="form-group">
          <label>Groupe sanguin</label>
          <select id="v_gs" class="form-control">
            <option value="">Sélectionner</option>
            ${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => `<option value="${g}" ${item.gs===g?'selected':''}>${g}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>N° Sécu</label><input type="text" id="v_secu" class="form-control" value="${item.secu||''}"></div>
      </div>
      <div class="form-group"><label>Allergies</label><input type="text" id="v_allergies" class="form-control" value="${item.allergies||''}"></div>
      <div class="form-group"><label>Traitements</label><input type="text" id="v_traitements" class="form-control" value="${item.traitements||''}"></div>
      <div class="form-row">
        <div class="form-group"><label>Médecin traitant</label><input type="text" id="v_medecin" class="form-control" value="${item.medecin||''}"></div>
        <div class="form-group"><label>Mutuelle</label><input type="text" id="v_mutuelle" class="form-control" value="${item.mutuelle||''}"></div>
      </div>
      <div class="form-group"><label>N° Adhérent Mutuelle</label><input type="text" id="v_numMutuelle" class="form-control" value="${item.numMutuelle||''}"></div>
      <div class="form-group"><label>Notes</label><textarea id="v_notes" class="form-control" rows="3">${item.notes||''}</textarea></div>
    `;
  } else if (categoryId === 7) {
    fieldsHTML = `
      <div class="form-row">
        <div class="form-group">
          <label>Type *</label>
          <select id="v_typeAss" class="form-control" required>
            <option value="Auto" ${item.typeAss==='Auto'?'selected':''}>Auto</option>
            <option value="Habitation" ${item.typeAss==='Habitation'?'selected':''}>Habitation</option>
            <option value="Santé" ${item.typeAss==='Santé'?'selected':''}>Santé</option>
            <option value="Vie" ${item.typeAss==='Vie'?'selected':''}>Vie</option>
            <option value="Responsabilité civile" ${item.typeAss==='Responsabilité civile'?'selected':''}>Responsabilité civile</option>
            <option value="Autre" ${item.typeAss==='Autre'?'selected':''}>Autre</option>
          </select>
        </div>
        <div class="form-group"><label>Compagnie *</label><input type="text" id="v_compagnie" class="form-control" required value="${item.compagnie||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>N° contrat</label><input type="text" id="v_numContrat" class="form-control" value="${item.numContrat||''}"></div>
        <div class="form-group"><label>Téléphone assistance</label><input type="tel" id="v_telAss" class="form-control" value="${item.telAss||''}"></div>
      </div>
      <div class="form-group"><label>Date d'échéance</label><input type="date" id="v_echeance" class="form-control" value="${item.echeance||''}"></div>
      <div class="form-group"><label>Notes</label><textarea id="v_notes" class="form-control" rows="3">${item.notes||''}</textarea></div>
    `;
  } else if (categoryId === 8) {
    fieldsHTML = `
      <div class="form-group"><label>Service / Logiciel *</label><input type="text" id="v_service" class="form-control" required value="${item.service||''}"></div>
      <div class="form-group"><label>Clé / Licence</label><input type="text" id="v_cle" class="form-control" value="${item.cle||''}"></div>
      <div class="form-row">
        <div class="form-group"><label>Email associé</label><input type="email" id="v_email" class="form-control" value="${item.email||''}"></div>
        <div class="form-group"><label>Date renouvellement</label><input type="date" id="v_renouv" class="form-control" value="${item.renouv||''}"></div>
      </div>
      <div class="form-group"><label>Notes</label><textarea id="v_notes" class="form-control" rows="3">${item.notes||''}</textarea></div>
    `;
  } else if (categoryId === 9) {
    fieldsHTML = `
      <div class="form-group"><label>Titre *</label><input type="text" id="v_titre" class="form-control" required value="${item.titre||''}"></div>
      <div class="form-group"><label>Contenu</label><textarea id="v_contenu" class="form-control" rows="8" style="min-height:200px">${item.contenu||''}</textarea></div>
    `;
  }

  let lockHTML = '';
  if (categoryId !== 0) {
    lockHTML = `
      <div class="form-group mt-4 border-t border-border pt-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" id="v_locked" ${item.locked ? 'checked' : ''} onchange="document.getElementById('lockOptions').classList.toggle('hidden', !this.checked)">
          <span><i class="fas fa-lock text-warning"></i> Verrouiller l'élément</span>
        </label>
      </div>
      <div id="lockOptions" class="form-row ${item.locked ? '' : 'hidden'}">
        <div class="form-group">
          <label>Prénom autorisé</label>
          <input type="text" id="v_lockName" class="form-control" value="${escapeHtml(item.lockName || '')}">
        </div>
        <div class="form-group">
          <label>Mot de passe spécifique</label>
          <input type="password" id="v_lockPwd" class="form-control" value="${escapeHtml(item.lockPwd || '')}">
        </div>
      </div>
    `;
  }

  const html = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="m-0 text-xl font-bold">${isEdit ? 'Modifier' : 'Ajouter'}</h2>
      <button class="btn btn-outline" onclick="closeModal()"><i class="fas fa-times"></i></button>
    </div>
    <form id="vaultItemForm" class="flex-col gap-4">
      ${fieldsHTML}
      ${lockHTML}
      <div class="flex justify-between mt-4">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Annuler</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Sauvegarder' : 'Ajouter'}</button>
      </div>
    </form>
  `;

  openModal(html);

  document.getElementById('vaultItemForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const getVal = (id) => { const el = document.getElementById('v_' + id); return el ? el.value.trim() : ''; };

    const newItem = {
      id: itemId || 'vi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      categoryId: categoryId,
      locked: document.getElementById('v_locked') ? document.getElementById('v_locked').checked : false,
      lockName: getVal('lockName'),
      lockPwd: getVal('lockPwd'),
      notes: getVal('notes')
    };

    if (categoryId === 0) {
      newItem.nom = getVal('nom'); newItem.prenom = getVal('prenom'); newItem.dateN = getVal('dateN');
      newItem.lieuN = getVal('lieuN'); newItem.nat = getVal('nat'); newItem.adr = getVal('adr');
      newItem.displayTitle = `${newItem.prenom} ${newItem.nom}`;
    } else if (categoryId === 1) {
      newItem.service = getVal('service'); newItem.url = getVal('url'); newItem.login = getVal('login'); newItem.pwd = getVal('pwd');
      newItem.displayTitle = newItem.service;
    } else if (categoryId === 2) {
      newItem.banque = getVal('banque'); newItem.nomCarte = getVal('nomCarte'); newItem.num = getVal('num');
      newItem.exp = getVal('exp'); newItem.cvv = getVal('cvv'); newItem.pin = getVal('pin'); newItem.plafond = getVal('plafond');
      newItem.displayTitle = newItem.banque + (newItem.nomCarte ? ` - ${newItem.nomCarte}` : '');
    } else if (categoryId === 3) {
      newItem.typeDoc = getVal('typeDoc'); newItem.numDoc = getVal('numDoc'); newItem.dateDeliv = getVal('dateDeliv');
      newItem.dateExp = getVal('dateExp'); newItem.lieuDoc = getVal('lieuDoc');
      newItem.displayTitle = newItem.typeDoc + (newItem.numDoc ? ` - ${newItem.numDoc}` : '');
    } else if (categoryId === 4) {
      newItem.banque = getVal('banque'); newItem.titulaire = getVal('titulaire'); newItem.iban = getVal('iban');
      newItem.bic = getVal('bic'); newItem.numCpt = getVal('numCpt'); newItem.agence = getVal('agence');
      newItem.displayTitle = newItem.banque + (newItem.titulaire ? ` - ${newItem.titulaire}` : '');
    } else if (categoryId === 5) {
      newItem.nom = getVal('nom'); newItem.code = getVal('code');
      newItem.displayTitle = newItem.nom;
    } else if (categoryId === 6) {
      newItem.gs = getVal('gs'); newItem.secu = getVal('secu'); newItem.allergies = getVal('allergies');
      newItem.traitements = getVal('traitements'); newItem.medecin = getVal('medecin'); newItem.mutuelle = getVal('mutuelle');
      newItem.numMutuelle = getVal('numMutuelle');
      newItem.displayTitle = 'Fiche médicale';
    } else if (categoryId === 7) {
      newItem.typeAss = getVal('typeAss'); newItem.compagnie = getVal('compagnie'); newItem.numContrat = getVal('numContrat');
      newItem.telAss = getVal('telAss'); newItem.echeance = getVal('echeance');
      newItem.displayTitle = `${newItem.typeAss} - ${newItem.compagnie}`;
    } else if (categoryId === 8) {
      newItem.service = getVal('service'); newItem.cle = getVal('cle'); newItem.email = getVal('email'); newItem.renouv = getVal('renouv');
      newItem.displayTitle = newItem.service;
    } else if (categoryId === 9) {
      newItem.titre = getVal('titre'); newItem.contenu = getVal('contenu');
      newItem.displayTitle = newItem.titre;
    }

    if (isEdit) {
      const idx = vaultItems.findIndex(i => i.id === itemId);
      vaultItems[idx] = newItem;
    } else {
      vaultItems.push(newItem);
    }

    appData.vaultData = encryptData(vaultItems, vaultKey);

    if (await saveData(appData)) {
      showToast('Sauvegardé');
      closeModal();
      renderItems(categoryId);
      if (categoryId === 0 && typeof syncTestamentCivilState === 'function') {
        syncTestamentCivilState();
      }
    } else {
      showToast('Erreur lors de la sauvegarde', 'error');
    }
  });
}

async function deleteVaultItem(itemId) {
  if (await confirmDialog('Voulez-vous vraiment supprimer cet élément ?')) {
    vaultItems = vaultItems.filter(i => i.id !== itemId);
    appData.vaultData = encryptData(vaultItems, vaultKey);
    if (await saveData(appData)) {
      showToast('Supprimé');
      renderItems(currentCategory);
    }
  }
}

function unlockItem(id) {
  const item = vaultItems.find(i => i.id === id);
  if (!item) return;

  const nameInput = document.getElementById('unlockName_' + id).value.trim();
  const pwdInput = document.getElementById('unlockPwd_' + id).value;
  const msg = document.getElementById('unlockMsg_' + id);

  if (nameInput.toLowerCase() === (item.lockName || '').toLowerCase() && pwdInput === item.lockPwd) {
    item.unlocked = true;
    document.getElementById('lockScreen_' + id).classList.add('hidden');
    document.getElementById('contentScreen_' + id).classList.remove('hidden');
  } else {
    msg.textContent = "Prénom ou mot de passe incorrect";
    msg.classList.remove('hidden');
  }
}

if (!window.location.pathname.includes('admin.html')) {
  document.addEventListener('DOMContentLoaded', initVaultExternal);
}

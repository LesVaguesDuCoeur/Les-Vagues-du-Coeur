document.addEventListener('DOMContentLoaded', async () => {
  const adminKey = sessionStorage.getItem('k_admin');
  if (!adminKey) { window.location.href = 'index.html'; return; }

  const rawData = await loadData();
  const emergencyPwd = decryptData(rawData.encryptedEmergencyPassword, adminKey);
  const vaultPwd = decryptData(rawData.encryptedVaultPassword, adminKey);
  const testamentPwd = decryptData(rawData.encryptedTestamentPassword, adminKey);

  if (!emergencyPwd || !vaultPwd || !testamentPwd) {
    sessionStorage.clear();
    window.location.href = 'index.html';
    return;
  }

  let contactsList = decryptData(rawData.contacts, adminKey) || [];
  let vaultData = decryptData(rawData.vaultData, vaultPwd) || [];
  let testamentData = decryptData(rawData.testamentData, testamentPwd) || { identity: {}, content: '', lastModified: null };
  let emergencyMessage = decryptData(rawData.emergencyMessage, adminKey) || '';
  let accessLogs = decryptData(rawData.accessLogs, adminKey) || [];
  let publicAccessLogs = rawData.publicAccessLogs || [];

  setupAutoLock(15);

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      tab.classList.add('active');
      const tabId = tab.dataset.tab;
      document.getElementById('tab-' + tabId).classList.remove('hidden');
      if (tabId === 'testament' && !window.quill) initQuill();
    });
  });

  renderContacts();
  renderVaultSidebar();
  renderTestament();
  renderSettings();

  async function saveData() {
    rawData.contacts = encryptData(contactsList, adminKey);
    rawData.emergencyContacts = encryptData(contactsList, emergencyPwd);
    rawData.vaultData = encryptData(vaultData, vaultPwd);
    rawData.testamentData = encryptData(testamentData, testamentPwd);
    rawData.emergencyMessage = encryptData(emergencyMessage, adminKey);
    rawData.emergencyMessageForEmergency = encryptData(emergencyMessage, emergencyPwd);
    rawData.accessLogs = encryptData(accessLogs, adminKey);
    rawData.publicAccessLogs = publicAccessLogs;

    await postToApi({ action: 'save', data: rawData });
    showToast('Sauvegardé', 'success');
  }

  function renderContacts() {
    const list = document.getElementById('contactsList');
    list.innerHTML = '';
    const term = document.getElementById('searchContacts').value.toLowerCase();

    contactsList.forEach((c, idx) => {
      if (term && !c.nom.toLowerCase().includes(term) && !c.telephone.includes(term)) return;

      const row = document.createElement('div');
      row.className = `contact-row imp-${c.importance}`;

      let linksHTML = '';
      if (c.telephone) linksHTML += `<a href="tel:${c.telephone}" class="link-icon link-phone"><i class="fas fa-phone"></i></a>`;
      if (c.email) linksHTML += `<a href="mailto:${c.email}" class="link-icon link-email"><i class="fas fa-envelope"></i></a>`;
      if (c.whatsapp) linksHTML += `<a href="https://wa.me/${c.whatsapp.replace(/\D/g, '')}" class="link-icon link-whatsapp" target="_blank"><i class="fab fa-whatsapp"></i></a>`;
      if (c.telegram) linksHTML += `<a href="https://t.me/${c.telegram}" class="link-icon link-telegram" target="_blank"><i class="fab fa-telegram"></i></a>`;
      if (c.snapchat) linksHTML += `<a href="https://www.snapchat.com/add/${c.snapchat}" class="link-icon link-snap" target="_blank"><i class="fab fa-snapchat-ghost"></i></a>`;
      if (c.instagram) linksHTML += `<a href="https://www.instagram.com/${c.instagram}" class="link-icon link-insta" target="_blank"><i class="fab fa-instagram"></i></a>`;
      if (c.messenger) linksHTML += `<a href="https://m.me/${c.messenger}" class="link-icon link-messenger" target="_blank"><i class="fab fa-facebook-messenger"></i></a>`;

      row.innerHTML = `
        <div class="contact-info">
          <span class="contact-name">${escapeHtml(c.nom)}</span>
          <span class="contact-relation">${escapeHtml(c.relation)}</span>
        </div>
        <div class="contact-links">${linksHTML}</div>
        <div class="contact-actions">
          <button class="action-btn" onclick="editContact(${idx})"><i class="fas fa-pen"></i></button>
          <button class="action-btn delete-btn" onclick="deleteContact(${idx})"><i class="fas fa-trash"></i></button>
        </div>
      `;
      list.appendChild(row);
    });
  }

  document.getElementById('searchContacts').addEventListener('input', renderContacts);
  document.getElementById('addContactBtn').addEventListener('click', () => openContactModal());

  window.editContact = (idx) => openContactModal(idx);
  window.deleteContact = async (idx) => {
    if (await confirmDialog('Supprimer ce contact ?')) {
      contactsList.splice(idx, 1);
      await saveData();
      renderContacts();
    }
  };

  function openContactModal(idx = -1) {
    const c = idx >= 0 ? contactsList[idx] : { importance: '3', relation: 'Famille' };
    const relations = ['Mère', 'Père', 'Frère', 'Sœur', 'Demi-frère', 'Demi-sœur', 'Grand-père', 'Grand-mère', 'Oncle', 'Tante', 'Cousin(e)', 'Fils', 'Fille', 'Conjoint(e)', 'Ex-conjoint(e)', 'Ami(e) proche', 'Meilleur(e) ami(e)', 'Connaissance', 'Collègue', 'Patron/Manager', 'Associé(e)', 'Client', 'Médecin', 'Avocat', 'Notaire', 'Comptable', 'Banquier', 'Assureur', 'Voisin(e)', 'Propriétaire/Bailleur', 'Professeur', 'Famille éloignée', 'Autre'];

    let relOptions = relations.map(r => `<option value="${r}" ${c.relation === r ? 'selected' : ''}>${r}</option>`).join('');
    if (c.relation && !relations.includes(c.relation) && c.relation !== 'Autre') {
      relOptions += `<option value="${escapeHtml(c.relation)}" selected>${escapeHtml(c.relation)}</option>`;
    }

    openModal(`
      <h2 class="text-xl font-bold mb-4">${idx >= 0 ? 'Modifier' : 'Nouveau'} Contact</h2>
      <form id="contactForm" class="flex flex-col gap-4">
        <div>
          <label class="text-sm text-muted">Nom Complet *</label>
          <input type="text" id="cNom" value="${c.nom || ''}" required>
        </div>
        <div class="flex gap-4">
          <div class="flex-1">
            <label class="text-sm text-muted">Relation</label>
            <select id="cRelation" onchange="document.getElementById('cRelationAutre').classList.toggle('hidden', this.value !== 'Autre')">
              ${relOptions}
            </select>
          </div>
          <div class="flex-1">
            <label class="text-sm text-muted">Importance</label>
            <div class="importance-selector">
              ${[1,2,3,4,5].map(i => `
                <label class="imp-btn" data-value="${i}">
                  <input type="radio" name="cImportance" value="${i}" ${c.importance == i ? 'checked' : ''}>
                  <span>${i}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>
        <div id="cRelationAutre" class="${c.relation === 'Autre' ? '' : 'hidden'}">
          <input type="text" id="cRelationText" placeholder="Précisez la relation..." value="${c.relation === 'Autre' ? '' : (c.relation && !relations.includes(c.relation) ? c.relation : '')}">
        </div>
        <div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <input type="tel" id="cTel" placeholder="Téléphone" value="${c.telephone || ''}">
          <input type="email" id="cEmail" placeholder="Email" value="${c.email || ''}">
          <input type="text" id="cWa" placeholder="WhatsApp (numéro)" value="${c.whatsapp || ''}">
          <input type="text" id="cTg" placeholder="Telegram (username)" value="${c.telegram || ''}">
          <input type="text" id="cSnap" placeholder="Snapchat" value="${c.snapchat || ''}">
          <input type="text" id="cInsta" placeholder="Instagram" value="${c.instagram || ''}">
          <input type="text" id="cMsg" placeholder="Messenger (username)" value="${c.messenger || ''}">
        </div>
        <textarea id="cNotes" placeholder="Notes (facultatif)" rows="2">${c.notes || ''}</textarea>
        <div class="flex justify-end gap-2 mt-4">
          <button type="button" class="btn" onclick="closeModal()">Annuler</button>
          <button type="submit" class="btn btn-primary">Enregistrer</button>
        </div>
      </form>
    `);

    document.getElementById('contactForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      let rel = document.getElementById('cRelation').value;
      if (rel === 'Autre') {
        const tr = document.getElementById('cRelationText').value.trim();
        if (tr) rel = tr;
      }

      const newC = {
        nom: document.getElementById('cNom').value,
        relation: rel,
        importance: document.querySelector('input[name="cImportance"]:checked').value,
        telephone: document.getElementById('cTel').value,
        email: document.getElementById('cEmail').value,
        whatsapp: document.getElementById('cWa').value,
        telegram: document.getElementById('cTg').value,
        snapchat: document.getElementById('cSnap').value,
        instagram: document.getElementById('cInsta').value,
        messenger: document.getElementById('cMsg').value,
        notes: document.getElementById('cNotes').value
      };

      if (idx >= 0) contactsList[idx] = newC;
      else contactsList.push(newC);

      await saveData();
      renderContacts();
      closeModal();
    });
  }

  const vaultCats = [
    { id: 0, icon: 'fa-user', name: 'État civil / Mon identité' },
    { id: 1, icon: 'fa-key', name: 'Identifiants & MDP' },
    { id: 2, icon: 'fa-credit-card', name: 'Cartes bancaires' },
    { id: 3, icon: 'fa-id-card', name: 'Documents' },
    { id: 4, icon: 'fa-university', name: 'Comptes bancaires' },
    { id: 5, icon: 'fa-lock', name: 'Codes & PIN' },
    { id: 6, icon: 'fa-heartbeat', name: 'Infos médicales' },
    { id: 7, icon: 'fa-shield-alt', name: 'Assurances' },
    { id: 8, icon: 'fa-barcode', name: 'Licences' },
    { id: 9, icon: 'fa-sticky-note', name: 'Notes libres' }
  ];
  let currentVaultCat = 0;

  function renderVaultSidebar() {
    const sb = document.getElementById('vaultSidebar');
    sb.innerHTML = vaultCats.map(c => `
      <button class="vault-cat ${currentVaultCat === c.id ? 'active' : ''}" onclick="window.selectVaultCat(${c.id})">
        <i class="fas ${c.icon} w-6 text-center"></i> ${escapeHtml(c.name)}
      </button>
    `).join('');

    document.getElementById('vaultCatTitle').innerHTML = `<i class="fas ${vaultCats[currentVaultCat].icon}"></i> ${escapeHtml(vaultCats[currentVaultCat].name)}`;
    renderVaultItems();
  }

  window.selectVaultCat = (id) => {
    currentVaultCat = id;
    renderVaultSidebar();
  };

  function renderVaultItems() {
    const list = document.getElementById('vaultItemList');
    list.innerHTML = '';
    const items = vaultData.filter(i => i.catId === currentVaultCat);

    if (items.length === 0) {
      list.innerHTML = '<div class="text-center text-muted py-8">Aucun élément dans cette catégorie</div>';
      return;
    }

    items.forEach((item, idx) => {
      const globalIdx = vaultData.indexOf(item);
      const el = document.createElement('div');
      el.className = 'bg-element p-4 rounded border flex justify-between items-center';

      let preview = '';
      if (currentVaultCat === 0) preview = `${item.nom} ${item.prenom}`;
      else if (currentVaultCat === 1) preview = item.service;
      else if (currentVaultCat === 2) preview = `${item.banque} - ${item.num.slice(-4)}`;
      else if (currentVaultCat === 3) preview = `${item.type} - ${item.num}`;
      else if (currentVaultCat === 4) preview = `${item.banque} - ${item.iban.slice(0,4)}...`;
      else if (currentVaultCat === 5) preview = item.nom;
      else if (currentVaultCat === 6) preview = `Groupe: ${item.gs}`;
      else if (currentVaultCat === 7) preview = `${item.type} - ${item.compagnie}`;
      else if (currentVaultCat === 8) preview = item.service;
      else if (currentVaultCat === 9) preview = item.titre;

      let lockHtml = item.locked ? `<i class="fas fa-lock text-warning" title="Verrouillé (accès externe)"></i>` : '';

      let delBtnHtml = currentVaultCat !== 0 ? `<button class="action-btn delete-btn" onclick="deleteVaultItem(${globalIdx})"><i class="fas fa-trash"></i></button>` : '';

      el.innerHTML = `
        <div class="flex items-center gap-4">
          ${lockHtml}
          <div class="font-bold">${escapeHtml(preview)}</div>
        </div>
        <div class="contact-actions">
          <button class="action-btn" onclick="editVaultItem(${globalIdx})"><i class="fas fa-pen"></i></button>
          ${delBtnHtml}
        </div>
      `;
      list.appendChild(el);
    });
  }

  document.getElementById('addVaultItemBtn').addEventListener('click', () => openVaultModal());

  window.editVaultItem = (idx) => openVaultModal(idx);
  window.deleteVaultItem = async (idx) => {
    if (await confirmDialog('Supprimer cet élément ?')) {
      vaultData.splice(idx, 1);
      await saveData();
      renderVaultItems();
    }
  };

  function openVaultModal(idx = -1) {
    const item = idx >= 0 ? vaultData[idx] : { catId: currentVaultCat, locked: false };

    let fieldsHtml = '';

    if (currentVaultCat === 0) {
      fieldsHtml = `
        <input type="text" id="v_nom" placeholder="Nom" value="${item.nom || ''}">
        <input type="text" id="v_prenom" placeholder="Prénom" value="${item.prenom || ''}">
        <input type="text" id="v_date" placeholder="Date de naissance" value="${item.date || ''}">
        <input type="text" id="v_lieu" placeholder="Lieu de naissance" value="${item.lieu || ''}">
        <input type="text" id="v_natio" placeholder="Nationalité" value="${item.natio || ''}">
        <textarea id="v_adr" placeholder="Adresse">${item.adr || ''}</textarea>
        <textarea id="v_notes" placeholder="Notes">${item.notes || ''}</textarea>
      `;
    } else if (currentVaultCat === 1) {
      fieldsHtml = `
        <input type="text" id="v_service" placeholder="Service / Site" value="${item.service || ''}">
        <input type="text" id="v_url" placeholder="URL" value="${item.url || ''}">
        <input type="text" id="v_id" placeholder="Identifiant" value="${item.id || ''}">
        <div class="flex gap-2">
          <input type="password" id="v_pwd" placeholder="Mot de passe" value="${item.pwd || ''}" class="flex-1">
          <button type="button" class="btn" onclick="toggleVisibility(this, 'v_pwd')"><i class="fas fa-eye"></i></button>
        </div>
        <textarea id="v_notes" placeholder="Notes">${item.notes || ''}</textarea>
      `;
    } else if (currentVaultCat === 2) {
      fieldsHtml = `
        <input type="text" id="v_banque" placeholder="Banque" value="${item.banque || ''}">
        <input type="text" id="v_nom" placeholder="Nom sur la carte" value="${item.nom || ''}">
        <input type="text" id="v_num" placeholder="Numéro (16 chiffres)" value="${item.num || ''}">
        <input type="text" id="v_exp" placeholder="Expiration (MM/AA)" value="${item.exp || ''}">
        <div class="flex gap-2">
          <input type="password" id="v_cvv" placeholder="CVV" value="${item.cvv || ''}" class="flex-1">
          <button type="button" class="btn" onclick="toggleVisibility(this, 'v_cvv')"><i class="fas fa-eye"></i></button>
        </div>
        <div class="flex gap-2">
          <input type="password" id="v_pin" placeholder="Code PIN" value="${item.pin || ''}" class="flex-1">
          <button type="button" class="btn" onclick="toggleVisibility(this, 'v_pin')"><i class="fas fa-eye"></i></button>
        </div>
        <input type="text" id="v_plafond" placeholder="Plafonds" value="${item.plafond || ''}">
        <textarea id="v_notes" placeholder="Notes">${item.notes || ''}</textarea>
      `;
    } else if (currentVaultCat === 3) {
      const types = ['CNI', 'Passeport', 'Permis de conduire', 'Titre de séjour', 'Autre'];
      let opts = types.map(t => `<option value="${t}" ${item.type === t ? 'selected' : ''}>${t}</option>`).join('');
      fieldsHtml = `
        <select id="v_type">${opts}</select>
        <input type="text" id="v_num" placeholder="Numéro du document" value="${item.num || ''}">
        <input type="text" id="v_dates" placeholder="Date d'émission / Expiration" value="${item.dates || ''}">
        <input type="text" id="v_lieu" placeholder="Lieu de délivrance" value="${item.lieu || ''}">
        <textarea id="v_notes" placeholder="Notes">${item.notes || ''}</textarea>
      `;
    } else if (currentVaultCat === 4) {
      fieldsHtml = `
        <input type="text" id="v_banque" placeholder="Banque" value="${item.banque || ''}">
        <input type="text" id="v_titulaire" placeholder="Titulaire" value="${item.titulaire || ''}">
        <div class="flex gap-2">
          <input type="password" id="v_iban" placeholder="IBAN" value="${item.iban || ''}" class="flex-1">
          <button type="button" class="btn" onclick="toggleVisibility(this, 'v_iban')"><i class="fas fa-eye"></i></button>
        </div>
        <input type="text" id="v_bic" placeholder="BIC" value="${item.bic || ''}">
        <input type="text" id="v_num" placeholder="Numéro de compte" value="${item.num || ''}">
        <input type="text" id="v_agence" placeholder="Agence" value="${item.agence || ''}">
        <textarea id="v_notes" placeholder="Notes">${item.notes || ''}</textarea>
      `;
    } else if (currentVaultCat === 5) {
      fieldsHtml = `
        <input type="text" id="v_nom" placeholder="Nom du code (ex: Digicode, Cadenas, Alarme)" value="${item.nom || ''}">
        <div class="flex gap-2">
          <input type="password" id="v_code" placeholder="Code" value="${item.code || ''}" class="flex-1">
          <button type="button" class="btn" onclick="toggleVisibility(this, 'v_code')"><i class="fas fa-eye"></i></button>
        </div>
        <textarea id="v_notes" placeholder="Notes">${item.notes || ''}</textarea>
      `;
    } else if (currentVaultCat === 6) {
      const gs = ['Non connu', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      let opts = gs.map(g => `<option value="${g}" ${item.gs === g ? 'selected' : ''}>${g}</option>`).join('');
      fieldsHtml = `
        <label class="text-sm text-muted">Groupe sanguin</label>
        <select id="v_gs">${opts}</select>
        <input type="text" id="v_allergies" placeholder="Allergies" value="${item.allergies || ''}">
        <input type="text" id="v_traitements" placeholder="Traitements en cours" value="${item.traitements || ''}">
        <input type="text" id="v_medecin" placeholder="Médecin traitant (Nom & Tél)" value="${item.medecin || ''}">
        <input type="text" id="v_secu" placeholder="Numéro de sécurité sociale" value="${item.secu || ''}">
        <input type="text" id="v_mutuelle" placeholder="Mutuelle" value="${item.mutuelle || ''}">
        <input type="text" id="v_adherent" placeholder="Numéro adhérent" value="${item.adherent || ''}">
        <textarea id="v_notes" placeholder="Notes">${item.notes || ''}</textarea>
      `;
    } else if (currentVaultCat === 7) {
      const types = ['Auto', 'Moto', 'Habitation', 'Santé', 'Prévoyance', 'Vie', 'Scolaire', 'Responsabilité civile', 'Autre'];
      let opts = types.map(t => `<option value="${t}" ${item.type === t ? 'selected' : ''}>${t}</option>`).join('');
      fieldsHtml = `
        <select id="v_type">${opts}</select>
        <input type="text" id="v_compagnie" placeholder="Compagnie d'assurance" value="${item.compagnie || ''}">
        <input type="text" id="v_contrat" placeholder="Numéro de contrat" value="${item.contrat || ''}">
        <input type="tel" id="v_tel" placeholder="Téléphone assistance" value="${item.tel || ''}">
        <input type="text" id="v_echeance" placeholder="Date d'échéance" value="${item.echeance || ''}">
        <textarea id="v_notes" placeholder="Notes">${item.notes || ''}</textarea>
      `;
    } else if (currentVaultCat === 8) {
      fieldsHtml = `
        <input type="text" id="v_service" placeholder="Logiciel / Service" value="${item.service || ''}">
        <div class="flex gap-2">
          <input type="password" id="v_cle" placeholder="Clé de licence" value="${item.cle || ''}" class="flex-1">
          <button type="button" class="btn" onclick="toggleVisibility(this, 'v_cle')"><i class="fas fa-eye"></i></button>
        </div>
        <input type="email" id="v_email" placeholder="Email associé" value="${item.email || ''}">
        <input type="text" id="v_renouv" placeholder="Date de renouvellement" value="${item.renouv || ''}">
        <textarea id="v_notes" placeholder="Notes">${item.notes || ''}</textarea>
      `;
    } else if (currentVaultCat === 9) {
      fieldsHtml = `
        <input type="text" id="v_titre" placeholder="Titre de la note" value="${item.titre || ''}">
        <textarea id="v_content" placeholder="Contenu..." style="min-height: 200px;">${item.content || ''}</textarea>
      `;
    }

    openModal(`
      <h2 class="text-xl font-bold mb-4">${idx >= 0 ? 'Modifier' : 'Ajouter'} - ${vaultCats[currentVaultCat].name}</h2>
      <form id="vaultForm" class="flex flex-col gap-4">
        <div class="flex flex-col gap-4" style="max-height: 50vh; overflow-y: auto; padding-right: 8px;">
          ${fieldsHtml}
        </div>
        <div class="mt-4 flex items-center gap-2">
          <input type="checkbox" id="v_locked" ${item.locked ? 'checked' : ''}>
          <label for="v_locked">Verrouiller (Masqué par défaut en accès externe)</label>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button type="button" class="btn" onclick="closeModal()">Annuler</button>
          <button type="submit" class="btn btn-primary">Enregistrer</button>
        </div>
      </form>
    `);

    document.getElementById('vaultForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const newItem = { catId: currentVaultCat, locked: document.getElementById('v_locked').checked };

      if (currentVaultCat === 0) {
        newItem.nom = document.getElementById('v_nom').value;
        newItem.prenom = document.getElementById('v_prenom').value;
        newItem.date = document.getElementById('v_date').value;
        newItem.lieu = document.getElementById('v_lieu').value;
        newItem.natio = document.getElementById('v_natio').value;
        newItem.adr = document.getElementById('v_adr').value;
        newItem.notes = document.getElementById('v_notes').value;
      } else if (currentVaultCat === 1) {
        newItem.service = document.getElementById('v_service').value;
        newItem.url = document.getElementById('v_url').value;
        newItem.id = document.getElementById('v_id').value;
        newItem.pwd = document.getElementById('v_pwd').value;
        newItem.notes = document.getElementById('v_notes').value;
      } else if (currentVaultCat === 2) {
        newItem.banque = document.getElementById('v_banque').value;
        newItem.nom = document.getElementById('v_nom').value;
        newItem.num = document.getElementById('v_num').value;
        newItem.exp = document.getElementById('v_exp').value;
        newItem.cvv = document.getElementById('v_cvv').value;
        newItem.pin = document.getElementById('v_pin').value;
        newItem.plafond = document.getElementById('v_plafond').value;
        newItem.notes = document.getElementById('v_notes').value;
      } else if (currentVaultCat === 3) {
        newItem.type = document.getElementById('v_type').value;
        newItem.num = document.getElementById('v_num').value;
        newItem.dates = document.getElementById('v_dates').value;
        newItem.lieu = document.getElementById('v_lieu').value;
        newItem.notes = document.getElementById('v_notes').value;
      } else if (currentVaultCat === 4) {
        newItem.banque = document.getElementById('v_banque').value;
        newItem.titulaire = document.getElementById('v_titulaire').value;
        newItem.iban = document.getElementById('v_iban').value;
        newItem.bic = document.getElementById('v_bic').value;
        newItem.num = document.getElementById('v_num').value;
        newItem.agence = document.getElementById('v_agence').value;
        newItem.notes = document.getElementById('v_notes').value;
      } else if (currentVaultCat === 5) {
        newItem.nom = document.getElementById('v_nom').value;
        newItem.code = document.getElementById('v_code').value;
        newItem.notes = document.getElementById('v_notes').value;
      } else if (currentVaultCat === 6) {
        newItem.gs = document.getElementById('v_gs').value;
        newItem.allergies = document.getElementById('v_allergies').value;
        newItem.traitements = document.getElementById('v_traitements').value;
        newItem.medecin = document.getElementById('v_medecin').value;
        newItem.secu = document.getElementById('v_secu').value;
        newItem.mutuelle = document.getElementById('v_mutuelle').value;
        newItem.adherent = document.getElementById('v_adherent').value;
        newItem.notes = document.getElementById('v_notes').value;
      } else if (currentVaultCat === 7) {
        newItem.type = document.getElementById('v_type').value;
        newItem.compagnie = document.getElementById('v_compagnie').value;
        newItem.contrat = document.getElementById('v_contrat').value;
        newItem.tel = document.getElementById('v_tel').value;
        newItem.echeance = document.getElementById('v_echeance').value;
        newItem.notes = document.getElementById('v_notes').value;
      } else if (currentVaultCat === 8) {
        newItem.service = document.getElementById('v_service').value;
        newItem.cle = document.getElementById('v_cle').value;
        newItem.email = document.getElementById('v_email').value;
        newItem.renouv = document.getElementById('v_renouv').value;
        newItem.notes = document.getElementById('v_notes').value;
      } else if (currentVaultCat === 9) {
        newItem.titre = document.getElementById('v_titre').value;
        newItem.content = document.getElementById('v_content').value;
      }

      if (idx >= 0) vaultData[idx] = newItem;
      else vaultData.push(newItem);

      await saveData();
      renderVaultItems();
      closeModal();
    });
  }

  function initQuill() {
    window.quill = new Quill('#editor-container', {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'align': [] }],
          ['clean']
        ]
      }
    });
    if (testamentData.content) window.quill.root.innerHTML = testamentData.content;

    document.getElementById('tNom').value = testamentData.identity.nom || '';
    document.getElementById('tPrenom').value = testamentData.identity.prenom || '';
    document.getElementById('tDateNais').value = testamentData.identity.date || '';
    document.getElementById('tLieuNais').value = testamentData.identity.lieu || '';
    document.getElementById('tNationalite').value = testamentData.identity.natio || '';
    document.getElementById('tAdresse').value = testamentData.identity.adr || '';

    if (testamentData.lastModified) {
      document.getElementById('lastSavedTestament').textContent = `Dernière sauvegarde : ${formatDateFR(testamentData.lastModified)}`;
    }

    setInterval(async () => {
      if (document.getElementById('tab-testament').classList.contains('hidden')) return;
      await saveTestamentLogic(true);
    }, 30000);
  }

  function renderTestament() {}

  async function saveTestamentLogic(silent = false) {
    if (!window.quill) return;

    testamentData.identity = {
      nom: document.getElementById('tNom').value,
      prenom: document.getElementById('tPrenom').value,
      date: document.getElementById('tDateNais').value,
      lieu: document.getElementById('tLieuNais').value,
      natio: document.getElementById('tNationalite').value,
      adr: document.getElementById('tAdresse').value
    };
    testamentData.content = window.quill.root.innerHTML;
    testamentData.lastModified = new Date().toISOString();

    await saveData();
    if (!silent) showToast('Testament sauvegardé', 'success');
    document.getElementById('lastSavedTestament').textContent = `Dernière sauvegarde : ${formatDateFR(testamentData.lastModified)}`;
  }

  document.getElementById('saveTestamentBtn').addEventListener('click', () => saveTestamentLogic(false));

  document.getElementById('exportPdfBtn').addEventListener('click', async () => {
    await saveTestamentLogic(true);
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: black; background: white;">
        <h1 style="text-align: center; text-transform: uppercase; font-size: 24px; margin-bottom: 40px;">TESTAMENT — DERNIÈRES VOLONTÉS</h1>
        <div style="margin-bottom: 30px; font-size: 14px;">
          <p><strong>Nom :</strong> ${escapeHtml(testamentData.identity.nom || '')}</p>
          <p><strong>Prénom :</strong> ${escapeHtml(testamentData.identity.prenom || '')}</p>
          <p><strong>Date de naissance :</strong> ${escapeHtml(testamentData.identity.date || '')}</p>
          <p><strong>Lieu de naissance :</strong> ${escapeHtml(testamentData.identity.lieu || '')}</p>
          <p><strong>Nationalité :</strong> ${escapeHtml(testamentData.identity.natio || '')}</p>
          <p><strong>Adresse :</strong> ${escapeHtml(testamentData.identity.adr || '')}</p>
        </div>
        <hr style="margin-bottom: 30px;">
        <div style="font-size: 14px; line-height: 1.6;">${testamentData.content}</div>
        <div style="margin-top: 50px; text-align: right; font-size: 12px; color: #555;">
          Fait le ${new Date().toLocaleDateString('fr-FR')}
        </div>
      </div>
    `;
    const opt = {
      margin: 10,
      filename: `Testament_${testamentData.identity.nom || 'Anonyme'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(html).save();
  });

  function renderSettings() {
    document.getElementById('emergencyMessage').value = emergencyMessage;

    const logsList = document.getElementById('accessLogsList');
    logsList.innerHTML = publicAccessLogs.map(l => `
      <div class="bg-element p-3 rounded text-sm">
        <span class="font-bold text-accent">${l.type}</span> - ${l.date}
        <div class="text-muted mt-1">IP: ${l.ip} | Nom saisi: ${l.nom}</div>
      </div>
    `).join('');
    if(publicAccessLogs.length === 0) logsList.innerHTML = '<div class="text-muted">Aucun log</div>';
  }

  document.getElementById('saveMsgBtn').addEventListener('click', async () => {
    emergencyMessage = document.getElementById('emergencyMessage').value;
    await saveData();
  });

  document.getElementById('changePwdForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pA = document.getElementById('newPwdAdmin').value;
    const pU = document.getElementById('newPwdUrgence').value;
    const pV = document.getElementById('newPwdVault').value;
    const pT = document.getElementById('newPwdTestament').value;

    if(!pA || !pU || !pV || !pT) { showToast('Remplissez tous les champs', 'error'); return; }

    if (await confirmDialog('Êtes-vous sûr ? Tous les mots de passe vont être changés.')) {
      rawData.adminHash = hashPassword(pA);
      rawData.emergencyHash = hashPassword(pU);
      rawData.vaultHash = hashPassword(pV);
      rawData.testamentHash = hashPassword(pT);

      rawData.encryptedEmergencyPassword = encryptData(pU, pA);
      rawData.encryptedVaultPassword = encryptData(pV, pA);
      rawData.encryptedTestamentPassword = encryptData(pT, pA);

      rawData.contacts = encryptData(contactsList, pA);
      rawData.emergencyContacts = encryptData(contactsList, pU);
      rawData.vaultData = encryptData(vaultData, pV);
      rawData.testamentData = encryptData(testamentData, pT);
      rawData.emergencyMessage = encryptData(emergencyMessage, pA);
      rawData.emergencyMessageForEmergency = encryptData(emergencyMessage, pU);
      rawData.accessLogs = encryptData(accessLogs, pA);

      await postToApi({ action: 'save', data: rawData });
      sessionStorage.clear();
      window.location.href = 'index.html';
    }
  });
});

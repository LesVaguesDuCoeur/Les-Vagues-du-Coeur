let quill;
let isQuillInit = false;
let contactsData = [];
let vaultData = [];
let testamentData = { identity: {}, content: '', lastModified: null };
let settingsData = { emergencyMessage: '', logs: [] };

document.addEventListener('DOMContentLoaded', async () => {
  const adminKey = sessionStorage.getItem('adminKey');
  if (!adminKey) {
    window.location.href = 'index.html';
    return;
  }
  setupAutoLock(30);

  const data = await loadData();
  if (!data.isSetup) {
    window.location.href = 'setup.html';
    return;
  }

  const emPwd = decryptData(data.encryptedEmergencyPassword, adminKey);
  const vaultPwd = decryptData(data.encryptedVaultPassword, adminKey);
  const testamentPwd = decryptData(data.encryptedTestamentPassword, adminKey);

  if (!emPwd || !vaultPwd || !testamentPwd) {
    showToast('Erreur de déchiffrement', 'error');
    sessionStorage.clear();
    window.location.href = 'index.html';
    return;
  }

  contactsData = decryptData(data.contacts, adminKey) || [];
  vaultData = decryptData(data.vaultData, vaultPwd) || [];
  testamentData = decryptData(data.testamentData, testamentPwd) || { identity: {}, content: '', lastModified: null };
  settingsData.emergencyMessage = decryptData(data.emergencyMessage, adminKey) || '';
  settingsData.logs = data.publicAccessLogs || [];

  renderContacts();
  renderVault();
  renderSettings();
  initTabs();

  document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });
  document.getElementById('add-contact-btn').addEventListener('click', openContactModal);
  document.getElementById('add-vault-item-btn').addEventListener('click', openVaultItemModal);
  document.getElementById('save-testament-btn').addEventListener('click', async () => {
    await saveTestament(testamentPwd);
  });
  document.getElementById('pdf-testament-btn').addEventListener('click', generatePDF);
  document.getElementById('save-emergency-message-btn').addEventListener('click', async () => {
    const msg = document.getElementById('emergency-message-input').value;
    const newData = await loadData();
    newData.emergencyMessage = encryptData(msg, adminKey);
    newData.emergencyMessageForEmergency = encryptData(msg, emPwd);
    await postToApi({ action: 'save', data: newData });
    showToast('Message sauvegardé', 'success');
  });

  const changePasswordsBtn = document.getElementById('change-passwords-btn');
  if (changePasswordsBtn) {
    changePasswordsBtn.addEventListener('click', async () => {
      if (await confirmDialog('Attention, changer un mot de passe va rechiffrer toutes les données associées. Continuer ?')) {
        openChangePasswordsModal(adminKey, emPwd, vaultPwd, testamentPwd);
      }
    });
  }

  setInterval(async () => {
    if (document.getElementById('testament-tab').classList.contains('active')) {
      await saveTestament(testamentPwd, true);
    }
  }, 30000);
});

function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      t.classList.add('active');
      const targetId = t.getAttribute('data-target');
      document.getElementById(targetId).classList.remove('hidden');

      if (targetId === 'testament-tab' && !isQuillInit) {
        quill = new Quill('#quill-editor', { theme: 'snow' });
        if (testamentData.content) quill.root.innerHTML = testamentData.content;
        const identity = testamentData.identity || {};
        document.getElementById('t-nom').value = identity.nom || '';
        document.getElementById('t-prenom').value = identity.prenom || '';
        document.getElementById('t-naissance').value = identity.naissance || '';
        document.getElementById('t-lieu').value = identity.lieu || '';
        document.getElementById('t-nationalite').value = identity.nationalite || '';
        document.getElementById('t-adresse').value = identity.adresse || '';
        isQuillInit = true;
      }
    });
  });
}

function renderContacts() {
  const list = document.getElementById('contacts-list');
  list.innerHTML = '';
  contactsData.forEach((c, idx) => {
    const row = document.createElement('div');
    row.className = `contact-row imp-${c.importance}`;
    row.innerHTML = `
      <div class="contact-info">
        <span class="contact-name">${c.nomComplet}</span>
        <span class="contact-relation">${c.relation === 'Autre' ? c.relationAutre : c.relation}</span>
      </div>
      <div class="contact-links">
        ${c.tel ? `<a href="tel:${c.tel}" class="link-icon link-phone"><i class="fas fa-phone"></i></a>` : ''}
        ${c.email ? `<a href="mailto:${c.email}" class="link-icon link-email"><i class="fas fa-envelope"></i></a>` : ''}
        ${c.whatsapp ? `<a href="https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}" class="link-icon link-whatsapp" target="_blank"><i class="fab fa-whatsapp"></i></a>` : ''}
        ${c.telegram ? `<a href="https://t.me/${c.telegram.replace('@', '')}" class="link-icon link-telegram" target="_blank"><i class="fab fa-telegram"></i></a>` : ''}
        ${c.snapchat ? `<a href="https://www.snapchat.com/add/${c.snapchat}" class="link-icon link-snap" target="_blank"><i class="fab fa-snapchat-ghost"></i></a>` : ''}
        ${c.instagram ? `<a href="https://www.instagram.com/${c.instagram.replace('@', '')}" class="link-icon link-insta" target="_blank"><i class="fab fa-instagram"></i></a>` : ''}
        ${c.messenger ? `<a href="https://m.me/${c.messenger}" class="link-icon link-messenger" target="_blank"><i class="fab fa-facebook-messenger"></i></a>` : ''}
      </div>
      <div class="contact-actions">
        <button class="action-btn" onclick="editContact(${idx})"><i class="fas fa-edit"></i></button>
        <button class="action-btn delete-btn" onclick="deleteContact(${idx})"><i class="fas fa-trash"></i></button>
      </div>
    `;
    list.appendChild(row);
  });
}

function openContactModal(idx = null) {
  const isEdit = idx !== null;
  const c = isEdit ? contactsData[idx] : {};
  const relations = ['Mère', 'Père', 'Frère', 'Sœur', 'Demi-frère', 'Demi-sœur', 'Grand-père', 'Grand-mère', 'Oncle', 'Tante', 'Cousin(e)', 'Fils', 'Fille', 'Conjoint(e)', 'Ex-conjoint(e)', 'Ami(e) proche', 'Meilleur(e) ami(e)', 'Connaissance', 'Collègue', 'Patron/Manager', 'Associé(e)', 'Client', 'Médecin', 'Avocat', 'Notaire', 'Comptable', 'Banquier', 'Assureur', 'Voisin(e)', 'Propriétaire/Bailleur', 'Professeur', 'Famille éloignée', 'Autre'];

  const options = relations.map(r => `<option value="${r}" ${c.relation === r ? 'selected' : ''}>${r}</option>`).join('');

  const html = `
    <h3 class="m-0 mb-4 text-xl font-bold">${isEdit ? 'Modifier Contact' : 'Nouveau Contact'}</h3>
    <div class="flex flex-col gap-4">
      <input type="text" id="c-nom" placeholder="Nom Complet *" value="${c.nomComplet || ''}" class="p-3 rounded border" style="background:var(--bg-element);color:var(--text);border-color:var(--border);">
      <select id="c-relation" class="p-3 rounded border w-full">
        <option value="" disabled ${!c.relation ? 'selected' : ''}>Relation *</option>
        ${options}
      </select>
      <input type="text" id="c-relation-autre" placeholder="Préciser la relation..." value="${c.relationAutre || ''}" class="p-3 rounded border ${c.relation === 'Autre' ? '' : 'hidden'}" style="background:var(--bg-element);color:var(--text);border-color:var(--border);">

      <div class="flex flex-col gap-2">
        <label class="text-sm font-bold">Niveau d'importance *</label>
        <div class="importance-selector">
          ${[1, 2, 3, 4, 5].map(i => `
            <label class="imp-btn" data-value="${i}">
              <input type="radio" name="c-imp" value="${i}" ${c.importance == i ? 'checked' : (i === 3 && !c.importance ? 'checked' : '')}>
              <span>${i}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <input type="tel" id="c-tel" placeholder="Téléphone" value="${c.tel || ''}" class="p-3 rounded border" style="background:var(--bg-element);color:var(--text);border-color:var(--border);">
      <input type="email" id="c-email" placeholder="Email" value="${c.email || ''}" class="p-3 rounded border" style="background:var(--bg-element);color:var(--text);border-color:var(--border);">
      <input type="text" id="c-whatsapp" placeholder="WhatsApp" value="${c.whatsapp || ''}" class="p-3 rounded border" style="background:var(--bg-element);color:var(--text);border-color:var(--border);">
      <input type="text" id="c-telegram" placeholder="Telegram" value="${c.telegram || ''}" class="p-3 rounded border" style="background:var(--bg-element);color:var(--text);border-color:var(--border);">
      <input type="text" id="c-snap" placeholder="Snapchat" value="${c.snapchat || ''}" class="p-3 rounded border" style="background:var(--bg-element);color:var(--text);border-color:var(--border);">
      <input type="text" id="c-insta" placeholder="Instagram" value="${c.instagram || ''}" class="p-3 rounded border" style="background:var(--bg-element);color:var(--text);border-color:var(--border);">
      <input type="text" id="c-messenger" placeholder="Messenger (ID)" value="${c.messenger || ''}" class="p-3 rounded border" style="background:var(--bg-element);color:var(--text);border-color:var(--border);">
      <textarea id="c-notes" placeholder="Notes..." class="p-3 rounded border" rows="3" style="background:var(--bg-element);color:var(--text);border-color:var(--border);">${c.notes || ''}</textarea>

      <div class="flex justify-between gap-4 mt-2">
        <button id="modal-cancel" class="flex-1 p-3 rounded" style="background:transparent;color:var(--text);border:1px solid var(--border);">Annuler</button>
        <button id="modal-save" class="flex-1 p-3 rounded" style="background:var(--success);color:var(--text);border:none;">Enregistrer</button>
      </div>
    </div>
  `;
  openModal(html);

  const relSelect = document.getElementById('c-relation');
  const relAutre = document.getElementById('c-relation-autre');
  relSelect.addEventListener('change', () => {
    if (relSelect.value === 'Autre') relAutre.classList.remove('hidden');
    else relAutre.classList.add('hidden');
  });

  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', async () => {
    const nom = document.getElementById('c-nom').value.trim();
    const relation = relSelect.value;
    if (!nom || !relation) {
      showToast('Nom et relation requis', 'error');
      return;
    }

    const newC = {
      nomComplet: nom,
      relation: relation,
      relationAutre: relAutre.value.trim(),
      importance: document.querySelector('input[name="c-imp"]:checked').value,
      tel: document.getElementById('c-tel').value.trim(),
      email: document.getElementById('c-email').value.trim(),
      whatsapp: document.getElementById('c-whatsapp').value.trim(),
      telegram: document.getElementById('c-telegram').value.trim(),
      snapchat: document.getElementById('c-snap').value.trim(),
      instagram: document.getElementById('c-insta').value.trim(),
      messenger: document.getElementById('c-messenger').value.trim(),
      notes: document.getElementById('c-notes').value.trim()
    };

    if (isEdit) contactsData[idx] = newC;
    else contactsData.push(newC);

    await saveContacts();
    renderContacts();
    closeModal();
  });
}

window.editContact = openContactModal;
window.deleteContact = async (idx) => {
  if (await confirmDialog('Supprimer ce contact ?')) {
    contactsData.splice(idx, 1);
    await saveContacts();
    renderContacts();
  }
};

async function saveContacts() {
  const adminKey = sessionStorage.getItem('adminKey');
  const d = await loadData();
  const emPwd = decryptData(d.encryptedEmergencyPassword, adminKey);
  d.contacts = encryptData(contactsData, adminKey);
  d.emergencyContacts = encryptData(contactsData, emPwd);
  await postToApi({ action: 'save', data: d });
  showToast('Contacts sauvegardés', 'success');
}

const vaultCategories = {
  etat_civil: { title: 'État civil / Mon identité', fields: ['Nom', 'Prénom', 'Date naissance', 'Lieu', 'Nationalité', 'Adresse', 'Notes'] },
  identifiants: { title: 'Identifiants & MDP', fields: ['Service', 'URL', 'Identifiant', 'MDP', 'Notes'] },
  cartes_bancaires: { title: 'Cartes bancaires', fields: ['Banque', 'Nom carte', 'Numéro', 'Expiration', 'CVV', 'PIN', 'Plafond', 'Notes'] },
  documents: { title: 'Documents', fields: ['Type', 'Numéro', 'Dates', 'Lieu', 'Notes'] },
  comptes_bancaires: { title: 'Comptes bancaires', fields: ['Banque', 'Titulaire', 'IBAN', 'BIC', 'N°', 'Agence', 'Notes'] },
  codes_pin: { title: 'Codes & PIN', fields: ['Nom', 'Code', 'Notes'] },
  infos_medicales: { title: 'Infos médicales', fields: ['Groupe sanguin', 'Allergies', 'Traitements', 'Médecin', 'N° Sécu', 'Mutuelle', 'N° adhérent', 'Notes'] },
  assurances: { title: 'Assurances', fields: ['Type', 'Compagnie', 'N° contrat', 'Tél', 'Échéance', 'Notes'] },
  licences: { title: 'Licences', fields: ['Service', 'Clé', 'Email', 'Renouvellement', 'Notes'] },
  notes: { title: 'Notes libres', fields: ['Titre', 'Contenu'] }
};
let currentVaultCat = 'etat_civil';

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
    row.className = 'vault-item-row';
    const fieldsHtml = Object.keys(item.data).map(k => {
      const val = item.data[k];
      return `<div class="vault-item-field row">
        <label class="w-32">${k}:</label>
        <span class="flex-1 truncate">${val}</span>
      </div>`;
    }).join('');

    row.innerHTML = `
      <div class="flex-col gap-2">
        ${fieldsHtml}
      </div>
      <div class="flex justify-end gap-2 mt-2 pt-2 border-t" style="border-color:var(--border);">
        <button class="action-btn" onclick="editVaultItem('${item.id}')"><i class="fas fa-edit"></i></button>
        ${currentVaultCat === 'etat_civil' ? '' : `<button class="action-btn delete-btn" onclick="deleteVaultItem('${item.id}')"><i class="fas fa-trash"></i></button>`}
      </div>
    `;
    list.appendChild(row);
  });
}

function openVaultItemModal(itemId = null) {
  const isEdit = itemId !== null;
  const item = isEdit ? vaultData.find(v => v.id === itemId) : { category: currentVaultCat, data: {} };
  const catDef = vaultCategories[currentVaultCat];

  let fieldsHtml = catDef.fields.map(f => {
    let inputHtml;
    if (f === 'Notes' || f === 'Contenu') {
      inputHtml = `<textarea id="v-${f}" class="p-3 rounded border w-full" rows="3" style="background:var(--bg-element);color:var(--text);border-color:var(--border);">${item.data[f] || ''}</textarea>`;
    } else if (f === 'Type' && currentVaultCat === 'documents') {
       inputHtml = `<select id="v-${f}" class="p-3 rounded border w-full">
         <option value="CNI" ${item.data[f]==='CNI'?'selected':''}>CNI</option>
         <option value="Passeport" ${item.data[f]==='Passeport'?'selected':''}>Passeport</option>
         <option value="Permis" ${item.data[f]==='Permis'?'selected':''}>Permis de conduire</option>
         <option value="Autre" ${item.data[f]==='Autre'?'selected':''}>Autre</option>
       </select>`;
    } else if (f === 'Groupe sanguin') {
       inputHtml = `<select id="v-${f}" class="p-3 rounded border w-full">
         <option value="A+" ${item.data[f]==='A+'?'selected':''}>A+</option>
         <option value="A-" ${item.data[f]==='A-'?'selected':''}>A-</option>
         <option value="B+" ${item.data[f]==='B+'?'selected':''}>B+</option>
         <option value="B-" ${item.data[f]==='B-'?'selected':''}>B-</option>
         <option value="AB+" ${item.data[f]==='AB+'?'selected':''}>AB+</option>
         <option value="AB-" ${item.data[f]==='AB-'?'selected':''}>AB-</option>
         <option value="O+" ${item.data[f]==='O+'?'selected':''}>O+</option>
         <option value="O-" ${item.data[f]==='O-'?'selected':''}>O-</option>
         <option value="Inconnu" ${item.data[f]==='Inconnu'?'selected':''}>Inconnu</option>
       </select>`;
    } else if (f === 'Type' && currentVaultCat === 'assurances') {
       inputHtml = `<select id="v-${f}" class="p-3 rounded border w-full">
         <option value="Auto" ${item.data[f]==='Auto'?'selected':''}>Auto / Moto</option>
         <option value="Habitation" ${item.data[f]==='Habitation'?'selected':''}>Habitation</option>
         <option value="Santé" ${item.data[f]==='Santé'?'selected':''}>Santé / Mutuelle</option>
         <option value="Prévoyance" ${item.data[f]==='Prévoyance'?'selected':''}>Prévoyance / Décès</option>
         <option value="Scolaire" ${item.data[f]==='Scolaire'?'selected':''}>Scolaire</option>
         <option value="Autre" ${item.data[f]==='Autre'?'selected':''}>Autre</option>
       </select>`;
    } else {
      inputHtml = `<input type="text" id="v-${f}" placeholder="${f}" value="${item.data[f] || ''}" class="p-3 rounded border w-full" style="background:var(--bg-element);color:var(--text);border-color:var(--border);">`;
    }
    return `<div class="flex flex-col gap-1"><label class="text-sm font-bold text-muted">${f}</label>${inputHtml}</div>`;
  }).join('');

  const html = `
    <h3 class="m-0 mb-4 text-xl font-bold">${isEdit ? 'Modifier' : 'Ajouter'} - ${catDef.title}</h3>
    <div class="flex flex-col gap-4">
      ${fieldsHtml}
      <div class="flex justify-between gap-4 mt-4">
        <button id="modal-cancel" class="flex-1 p-3 rounded" style="background:transparent;color:var(--text);border:1px solid var(--border);">Annuler</button>
        <button id="modal-save" class="flex-1 p-3 rounded" style="background:var(--success);color:var(--text);border:none;">Enregistrer</button>
      </div>
    </div>
  `;
  openModal(html);

  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', async () => {
    const newData = {};
    catDef.fields.forEach(f => {
      newData[f] = document.getElementById(`v-${f}`).value.trim();
    });

    if (isEdit) {
      const idx = vaultData.findIndex(v => v.id === itemId);
      vaultData[idx].data = newData;
    } else {
      vaultData.push({ id: Date.now().toString(), category: currentVaultCat, data: newData });
    }

    await saveVault();
    renderVaultList();
    closeModal();
  });
}

window.editVaultItem = openVaultItemModal;
window.deleteVaultItem = async (id) => {
  if (currentVaultCat === 'etat_civil') return;
  if (await confirmDialog('Supprimer cet élément ?')) {
    vaultData = vaultData.filter(v => v.id !== id);
    await saveVault();
    renderVaultList();
  }
};

async function saveVault() {
  const adminKey = sessionStorage.getItem('adminKey');
  const d = await loadData();
  const vaultPwd = decryptData(d.encryptedVaultPassword, adminKey);
  d.vaultData = encryptData(vaultData, vaultPwd);
  await postToApi({ action: 'save', data: d });
  showToast('Vault sauvegardé', 'success');
}

async function saveTestament(testamentPwd, silent = false) {
  if (!isQuillInit) return;
  testamentData.content = quill.root.innerHTML;
  testamentData.identity = {
    nom: document.getElementById('t-nom').value.trim(),
    prenom: document.getElementById('t-prenom').value.trim(),
    naissance: document.getElementById('t-naissance').value.trim(),
    lieu: document.getElementById('t-lieu').value.trim(),
    nationalite: document.getElementById('t-nationalite').value.trim(),
    adresse: document.getElementById('t-adresse').value.trim()
  };
  testamentData.lastModified = new Date().toISOString();

  const d = await loadData();
  d.testamentData = encryptData(testamentData, testamentPwd);
  await postToApi({ action: 'save', data: d });
  if (!silent) showToast('Testament sauvegardé', 'success');
}

function generatePDF() {
  const id = testamentData.identity || {};
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 40px; color: black; background: white;">
      <h1 style="text-align: center; color: #333; margin-bottom: 30px;">TESTAMENT — DERNIÈRES VOLONTÉS</h1>
      <div style="border: 1px solid #ccc; padding: 20px; margin-bottom: 30px; background: #f9f9f9;">
        <h3 style="margin-top: 0; border-bottom: 1px solid #ccc; padding-bottom: 10px;">État Civil</h3>
        <p><strong>Nom :</strong> ${id.nom || ''}</p>
        <p><strong>Prénoms :</strong> ${id.prenom || ''}</p>
        <p><strong>Date de naissance :</strong> ${id.naissance || ''}</p>
        <p><strong>Lieu de naissance :</strong> ${id.lieu || ''}</p>
        <p><strong>Nationalité :</strong> ${id.nationalite || ''}</p>
        <p><strong>Adresse :</strong> ${id.adresse || ''}</p>
      </div>
      <div>
        ${isQuillInit ? quill.root.innerHTML : testamentData.content}
      </div>
      <div style="margin-top: 50px; text-align: right; color: #666; font-size: 0.9em; border-top: 1px solid #ccc; padding-top: 10px;">
        <p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
    </div>
  `;
  const opt = {
    margin: 1,
    filename: 'Testament.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(html).save();
}

function openChangePasswordsModal(adminKey, oldEm, oldVault, oldTestament) {
  const html = `
    <h3 class="m-0 mb-4 text-xl font-bold">Changer les mots de passe</h3>
    <div class="flex flex-col gap-4">
      <input type="password" id="ch-admin" placeholder="Nouveau mdp Admin (laisser vide pour ne pas changer)" class="p-3 rounded border w-full" style="background:var(--bg-element);color:var(--text);border-color:var(--border);">
      <input type="password" id="ch-emergency" placeholder="Nouveau mdp Urgence" class="p-3 rounded border w-full" style="background:var(--bg-element);color:var(--text);border-color:var(--border);">
      <input type="password" id="ch-vault" placeholder="Nouveau mdp Vault" class="p-3 rounded border w-full" style="background:var(--bg-element);color:var(--text);border-color:var(--border);">
      <input type="password" id="ch-testament" placeholder="Nouveau mdp Testament" class="p-3 rounded border w-full" style="background:var(--bg-element);color:var(--text);border-color:var(--border);">
      <div class="flex justify-between gap-4 mt-4">
        <button id="modal-cancel" class="flex-1 p-3 rounded" style="background:transparent;color:var(--text);border:1px solid var(--border);">Annuler</button>
        <button id="modal-save" class="flex-1 p-3 rounded" style="background:var(--danger);color:var(--text);border:none;">Rechiffrer & Sauvegarder</button>
      </div>
    </div>
  `;
  openModal(html);

  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', async () => {
    const nAdmin = document.getElementById('ch-admin').value.trim() || adminKey;
    const nEm = document.getElementById('ch-emergency').value.trim() || oldEm;
    const nVault = document.getElementById('ch-vault').value.trim() || oldVault;
    const nTestament = document.getElementById('ch-testament').value.trim() || oldTestament;

    const btn = document.getElementById('modal-save');
    btn.disabled = true;
    btn.innerText = 'Chiffrement en cours...';

    const d = await loadData();
    d.adminHash = hashData(nAdmin);
    d.emergencyHash = hashData(nEm);
    d.vaultHash = hashData(nVault);
    d.testamentHash = hashData(nTestament);

    d.encryptedEmergencyPassword = encryptData(nEm, nAdmin);
    d.encryptedVaultPassword = encryptData(nVault, nAdmin);
    d.encryptedTestamentPassword = encryptData(nTestament, nAdmin);

    d.contacts = encryptData(contactsData, nAdmin);
    d.emergencyContacts = encryptData(contactsData, nEm);
    d.vaultData = encryptData(vaultData, nVault);
    d.testamentData = encryptData(testamentData, nTestament);
    d.emergencyMessage = encryptData(settingsData.emergencyMessage, nAdmin);
    d.emergencyMessageForEmergency = encryptData(settingsData.emergencyMessage, nEm);
    d.accessLogs = encryptData([], nAdmin);

    await postToApi({ action: 'save', data: d });
    closeModal();
    sessionStorage.clear();
    showToast('Mots de passe changés. Veuillez vous reconnecter.', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  });
}

function renderSettings() {
  document.getElementById('emergency-message-input').value = settingsData.emergencyMessage || '';
  const logList = document.getElementById('access-logs-list');
  logList.innerHTML = '';
  if (!settingsData.logs || settingsData.logs.length === 0) {
    logList.innerHTML = '<p class="text-muted">Aucun log récent.</p>';
    return;
  }
  settingsData.logs.forEach(l => {
    const logEl = document.createElement('div');
    logEl.className = 'p-2 rounded border-b flex justify-between';
    logEl.style.borderColor = 'var(--border)';
    logEl.innerHTML = `<span><strong>${l.type}</strong> - ${l.date}</span> <span class="text-muted">${l.ip} / ${l.nom}</span>`;
    logList.appendChild(logEl);
  });
}
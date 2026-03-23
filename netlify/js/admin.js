const RELATIONS = ['Mère', 'Père', 'Frère', 'Sœur', 'Demi-frère', 'Demi-sœur', 'Grand-père', 'Grand-mère', 'Oncle', 'Tante', 'Cousin(e)', 'Fils', 'Fille', 'Conjoint(e)', 'Ex-conjoint(e)', 'Ami(e) proche', 'Meilleur(e) ami(e)', 'Connaissance', 'Collègue', 'Patron/Manager', 'Associé(e)', 'Client', 'Médecin', 'Avocat', 'Notaire', 'Comptable', 'Banquier', 'Assureur', 'Voisin(e)', 'Propriétaire/Bailleur', 'Professeur', 'Famille éloignée', 'Autre'];
const VAULT_CATS = [
  { id: 'civil', name: 'État civil / Mon identité', required: true, fields: [
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

let appData = null;
let currentKey = sessionStorage.getItem('adminKey');
let quill = null;
let currentCategory = 'civil';
let dataCache = { contacts: [], vault: [], testament: {} };
let testamentSaveTimer = null;

window.onload = async () => {
  if (!currentKey) { window.location.href = 'index.html'; return; }
  appData = await loadData();
  if (hashPassword(currentKey) !== appData.adminHash) {
    sessionStorage.removeItem('adminKey');
    window.location.href = 'index.html';
    return;
  }

  decryptAllData();
  document.getElementById('loading').classList.add('hidden');
  initRelations();
  initVaultCategories();
  switchTab('contacts');
  renderContacts();
  renderPublicLogs();

  const mdpUrg = decryptData(appData.encryptedEmergencyPassword, currentKey);
  const mdpV = decryptData(appData.encryptedVaultPassword, currentKey);
  const mdpT = decryptData(appData.encryptedTestamentPassword, currentKey);
  if (!mdpUrg || !mdpV || !mdpT) {
    showToast('Erreur critique de déchiffrement des sous-clés.', 'error');
  }
};

function decryptAllData() {
  dataCache.contacts = decryptData(appData.contacts, currentKey) || [];
  dataCache.vault = decryptData(appData.vaultData, decryptData(appData.encryptedVaultPassword, currentKey)) || [];
  dataCache.testament = decryptData(appData.testamentData, decryptData(appData.encryptedTestamentPassword, currentKey)) || { identity: {}, content: '', lastModified: null };
  document.getElementById('settingsUrgMsg').value = decryptData(appData.emergencyMessage, currentKey) || '';
}

async function saveAllData() {
  const urgKey = decryptData(appData.encryptedEmergencyPassword, currentKey);
  const vaultKey = decryptData(appData.encryptedVaultPassword, currentKey);
  const testKey = decryptData(appData.encryptedTestamentPassword, currentKey);

  appData.contacts = encryptData(dataCache.contacts, currentKey);
  appData.emergencyContacts = encryptData(dataCache.contacts, urgKey);
  appData.vaultData = encryptData(dataCache.vault, vaultKey);
  appData.testamentData = encryptData(dataCache.testament, testKey);

  const msg = document.getElementById('settingsUrgMsg').value;
  appData.emergencyMessage = encryptData(msg, currentKey);
  appData.emergencyMessageForEmergency = encryptData(msg, urgKey);

  await postToApi({ action: 'save', data: appData });
  showToast('Données sauvegardées.', 'success');
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('[id^="content-"]').forEach(c => c.classList.add('hidden'));
  document.querySelector(`.tab[onclick="switchTab('${tab}')"]`).classList.add('active');
  document.getElementById(`content-${tab}`).classList.remove('hidden');

  if (tab === 'vault') renderVault();
  if (tab === 'testament') initQuill();
}

function initRelations() {
  const sel = document.getElementById('contactRelation');
  sel.innerHTML = RELATIONS.map(r => `<option value="${r}">${r}</option>`).join('');
}

function checkRelation() {
  const sel = document.getElementById('contactRelation');
  const other = document.getElementById('contactRelationOther');
  if (sel.value === 'Autre') {
    other.classList.remove('hidden');
    other.required = true;
  } else {
    other.classList.add('hidden');
    other.required = false;
  }
}

document.getElementById('contactForm').onsubmit = async (e) => {
  e.preventDefault();
  const id = document.getElementById('contactId').value;
  const c = {
    id: id || Date.now().toString(),
    nom: document.getElementById('contactName').value,
    relation: document.getElementById('contactRelation').value === 'Autre' ? document.getElementById('contactRelationOther').value : document.getElementById('contactRelation').value,
    importance: document.querySelector('input[name="cImp"]:checked').value,
    tel: document.getElementById('contactTel').value,
    email: document.getElementById('contactEmail').value,
    whatsapp: document.getElementById('contactWA').value,
    telegram: document.getElementById('contactTG').value,
    snapchat: document.getElementById('contactSnap').value,
    instagram: document.getElementById('contactInsta').value,
    messenger: document.getElementById('contactMessenger').value,
    notes: document.getElementById('contactNotes').value
  };

  if (id) {
    const idx = dataCache.contacts.findIndex(x => x.id === id);
    if (idx > -1) dataCache.contacts[idx] = c;
  } else {
    dataCache.contacts.push(c);
  }

  dataCache.contacts.sort((a, b) => b.importance - a.importance);
  hideModal('contactModal');
  renderContacts();
  await saveAllData();
};

function renderContacts() {
  const list = document.getElementById('contactsList');
  list.innerHTML = dataCache.contacts.map(c => `
    <div class="contact-row imp-${c.importance}">
      <div class="flex justify-between items-center">
        <div>
          <div class="font-bold text-xl">${c.nom}</div>
          <div class="text-muted text-sm">${c.relation}</div>
        </div>
        <div class="flex gap-2">
          <button class="icon-btn" onclick="editContact('${c.id}')"><i class="fas fa-edit"></i></button>
          <button class="icon-btn text-danger" onclick="deleteContact('${c.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
      <div class="social-links mt-2">
        ${['tel', 'email', 'whatsapp', 'telegram', 'snapchat', 'instagram', 'messenger'].map(type =>
          c[type] ? `<a href="${buildSocialLink(type, c[type])}" class="social-link" target="_blank"><i class="${getSocialIcon(type)}"></i></a>` : ''
        ).join('')}
      </div>
      ${c.notes ? `<div class="mt-2 text-sm italic">${c.notes}</div>` : ''}
    </div>
  `).join('');
}

function editContact(id) {
  const c = dataCache.contacts.find(x => x.id === id);
  if (!c) return;
  document.getElementById('contactId').value = c.id;
  document.getElementById('contactName').value = c.nom;
  const relSel = document.getElementById('contactRelation');
  if (RELATIONS.includes(c.relation)) {
    relSel.value = c.relation;
    document.getElementById('contactRelationOther').classList.add('hidden');
  } else {
    relSel.value = 'Autre';
    document.getElementById('contactRelationOther').value = c.relation;
    document.getElementById('contactRelationOther').classList.remove('hidden');
  }
  document.querySelector(`input[name="cImp"][value="${c.importance}"]`).checked = true;
  document.getElementById('contactTel').value = c.tel || '';
  document.getElementById('contactEmail').value = c.email || '';
  document.getElementById('contactWA').value = c.whatsapp || '';
  document.getElementById('contactTG').value = c.telegram || '';
  document.getElementById('contactSnap').value = c.snapchat || '';
  document.getElementById('contactInsta').value = c.instagram || '';
  document.getElementById('contactMessenger').value = c.messenger || '';
  document.getElementById('contactNotes').value = c.notes || '';
  document.getElementById('contactModalTitle').textContent = 'Modifier Contact';
  showModal('contactModal');
}

async function deleteContact(id) {
  if (confirm('Supprimer ce contact ?')) {
    dataCache.contacts = dataCache.contacts.filter(x => x.id !== id);
    renderContacts();
    await saveAllData();
  }
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
  const items = dataCache.vault.filter(x => x.categoryId === currentCategory);

  if (currentCategory === 'civil' && items.length === 0) {
    const defaultCivil = { id: 'civil_1', categoryId: 'civil', data: {} };
    dataCache.vault.push(defaultCivil);
    items.push(defaultCivil);
  }

  document.getElementById('vaultItemsList').innerHTML = items.map(item => `
    <div class="card mb-4">
      <div class="flex justify-between items-center mb-2">
        <h4 class="font-bold">${item.data.nom || item.data.service || 'Élément'}</h4>
        <div class="flex gap-2">
          <button class="icon-btn" onclick="editVaultItem('${item.id}')"><i class="fas fa-edit"></i></button>
          ${currentCategory !== 'civil' ? `<button class="icon-btn text-danger" onclick="deleteVaultItem('${item.id}')"><i class="fas fa-trash"></i></button>` : ''}
        </div>
      </div>
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

function addVaultItem() {
  document.getElementById('vaultForm').reset();
  const formHtml = '<input type="hidden" id="vItemId">';
  const cat = VAULT_CATS.find(c => c.id === currentCategory);
  document.getElementById('vaultDynamicFields').innerHTML = formHtml + cat.fields.map(f => `
    <div>
      <label>${f.label}</label>
      ${f.type === 'textarea' ? `<textarea id="vf_${f.id}"></textarea>` : `<input type="${f.type}" id="vf_${f.id}">`}
    </div>
  `).join('');
  showModal('vaultItemModal');
}

function editVaultItem(id) {
  addVaultItem();
  const item = dataCache.vault.find(x => x.id === id);
  document.getElementById('vItemId').value = item.id;
  const cat = VAULT_CATS.find(c => c.id === currentCategory);
  cat.fields.forEach(f => {
    if (item.data[f.id]) document.getElementById(`vf_${f.id}`).value = item.data[f.id];
  });
}

document.getElementById('vaultForm').onsubmit = async (e) => {
  e.preventDefault();
  const id = document.getElementById('vItemId').value;
  const cat = VAULT_CATS.find(c => c.id === currentCategory);
  const data = {};
  cat.fields.forEach(f => {
    data[f.id] = document.getElementById(`vf_${f.id}`).value;
  });

  if (id) {
    const idx = dataCache.vault.findIndex(x => x.id === id);
    if (idx > -1) dataCache.vault[idx].data = data;
  } else {
    dataCache.vault.push({ id: Date.now().toString(), categoryId: currentCategory, data });
  }

  hideModal('vaultItemModal');
  renderVault();
  await saveAllData();
};

async function deleteVaultItem(id) {
  if (currentCategory === 'civil') return;
  if (confirm('Supprimer cet élément ?')) {
    dataCache.vault = dataCache.vault.filter(x => x.id !== id);
    renderVault();
    await saveAllData();
  }
}

function initQuill() {
  if (!quill && document.getElementById('editor')) {
    quill = new Quill('#editor', {
      theme: 'snow',
      modules: { toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['clean']
      ]}
    });
    if (dataCache.testament) {
      if (dataCache.testament.content) quill.root.innerHTML = dataCache.testament.content;
      if (dataCache.testament.identity) {
        document.getElementById('tNom').value = dataCache.testament.identity.nom || '';
        document.getElementById('tPrenom').value = dataCache.testament.identity.prenom || '';
        document.getElementById('tNaissance').value = dataCache.testament.identity.naissance || '';
        document.getElementById('tLieu').value = dataCache.testament.identity.lieu || '';
        document.getElementById('tNationalite').value = dataCache.testament.identity.nationalite || '';
        document.getElementById('tAdresse').value = dataCache.testament.identity.adresse || '';
      }
    }

    quill.on('text-change', () => {
      clearTimeout(testamentSaveTimer);
      testamentSaveTimer = setTimeout(saveTestament, 30000);
    });
  }
}

async function saveTestament() {
  if (!quill) return;
  dataCache.testament.content = quill.root.innerHTML;
  dataCache.testament.identity = {
    nom: document.getElementById('tNom').value,
    prenom: document.getElementById('tPrenom').value,
    naissance: document.getElementById('tNaissance').value,
    lieu: document.getElementById('tLieu').value,
    nationalite: document.getElementById('tNationalite').value,
    adresse: document.getElementById('tAdresse').value
  };
  dataCache.testament.lastModified = new Date().toISOString();
  await saveAllData();
}

function exportPdf() {
  if (!quill) return;
  const element = document.createElement('div');
  element.innerHTML = quill.root.innerHTML;
  html2pdf().from(element).save('Testament.pdf');
}

async function saveGlobalMessage() {
  await saveAllData();
}

function renderPublicLogs() {
  const logs = appData.publicAccessLogs || [];
  document.getElementById('publicLogs').innerHTML = logs.length === 0 ? '<p>Aucun log.</p>' : logs.map(l => `
    <div class="border-b border-[var(--border)] py-2">
      <span class="font-bold text-danger">[${l.type}]</span> ${l.date} - IP: ${l.ip} - Nom: ${l.nom}
    </div>
  `).join('');
}

function logout() {
  sessionStorage.clear();
  window.location.href = 'index.html';
}
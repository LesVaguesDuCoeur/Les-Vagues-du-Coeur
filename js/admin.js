let fullData = null;
let adminCode = null;
let urgCode = null;
let vltCode = null;
let tstCode = null;

let quill = null;

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
  setupAutoLock(30);
  const k = sessionStorage.getItem('_key');
  const p = sessionStorage.getItem('_page');

  if (!k || p !== 'admin') {
    window.location.href = 'index.html';
    return;
  }

  try {
    fullData = await loadData();
    if (hashPassword(k) !== fullData.config.adminHash) {
      window.location.href = 'index.html';
      return;
    }
    adminCode = k;
  } catch (e) {
    window.location.href = 'index.html';
    return;
  }

  urgCode = decryptData(fullData.config.encryptedEmergencyPassword, adminCode);
  vltCode = decryptData(fullData.config.encryptedVaultPassword, adminCode);
  tstCode = decryptData(fullData.config.encryptedTestamentPassword, adminCode);

  if (!urgCode || !vltCode || !tstCode) {
    window.location.href = 'index.html';
    return;
  }

  if (!fullData.contacts.contacts) fullData.contacts.contacts = encryptData([], adminCode);
  if (!fullData.vault.vaultData) fullData.vault.vaultData = encryptData([], vltCode);
  if (!fullData.testament.testamentData) fullData.testament.testamentData = encryptData({}, tstCode);

  renderContacts();
  setupVaultSidebar();
  renderVault();
  renderSettings();

  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      el.classList.add('active');
      const tab = el.dataset.tab;
      document.querySelectorAll('.tab-pane').forEach(t => t.style.display = 'none');
      document.getElementById(`tab-${tab}`).style.display = 'block';

      if (tab === 'testament' && !quill) {
        initTestament();
      }
    });
  });

  hideLoading();
});

document.getElementById('btn-logout').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'index.html';
});

async function saveAllContacts(clearList) {
  showLoading();
  const encAdmin = encryptData(clearList, adminCode);
  const encUrg = encryptData(clearList, urgCode);
  fullData.contacts.contacts = encAdmin;
  await postToApi({ action: 'saveContacts', data: { contacts: encAdmin, emergencyContacts: encUrg } });
  hideLoading();
  showToast('Contacts sauvegardés', 'success');
  renderContacts();
}

function renderContacts() {
  const list = decryptData(fullData.contacts.contacts, adminCode) || [];
  const container = document.getElementById('contacts-list');
  const term = document.getElementById('search-contacts').value.toLowerCase();

  container.innerHTML = '';
  list.filter(c => c.nom.toLowerCase().includes(term)).forEach((c, idx) => {
    const d = document.createElement('div');
    d.className = 'contact-card';
    let border = '#555';
    if(c.imp==1) border='#e63946'; else if(c.imp==2) border='#fca311'; else if(c.imp==3) border='#ffd166'; else if(c.imp==4) border='#06d6a0';
    d.style.borderLeft = `4px solid ${border}`;

    let links = '';
    if (c.tel) links += `<a href="tel:${c.tel}" class="link-icon link-phone"><i class="fas fa-phone"></i></a>`;
    if (c.email) links += `<a href="mailto:${c.email}" class="link-icon link-email"><i class="fas fa-envelope"></i></a>`;
    if (c.wa) links += `<a href="https://wa.me/${c.wa}" class="link-icon link-whatsapp" target="_blank"><i class="fab fa-whatsapp"></i></a>`;
    if (c.tg) links += `<a href="https://t.me/${c.tg}" class="link-icon link-telegram" target="_blank"><i class="fab fa-telegram"></i></a>`;
    if (c.snap) links += `<a href="https://www.snapchat.com/add/${c.snap}" class="link-icon link-snap" target="_blank"><i class="fab fa-snapchat-ghost"></i></a>`;
    if (c.ig) links += `<a href="https://www.instagram.com/${c.ig}" class="link-icon link-insta" target="_blank"><i class="fab fa-instagram"></i></a>`;
    if (c.msg) links += `<a href="https://m.me/${c.msg}" class="link-icon link-messenger" target="_blank"><i class="fab fa-facebook-messenger"></i></a>`;

    d.innerHTML = `
      <div class="contact-actions">
        <button class="btn-icon" style="color:var(--accent);background:none;" onclick="openContactModal(${idx})"><i class="fas fa-edit"></i></button>
        <button class="btn-icon" style="color:var(--danger);background:none;" onclick="deleteContact(${idx})"><i class="fas fa-trash"></i></button>
      </div>
      <h3 class="mb-4">${escapeHtml(c.nom)}</h3>
      <p class="text-secondary text-sm mb-16">${escapeHtml(c.rel)}${c.relAutre ? ' - ' + escapeHtml(c.relAutre) : ''}</p>
      <div class="flex-wrap gap-8" style="display:flex;">${links}</div>
    `;
    container.appendChild(d);
  });
}

document.getElementById('search-contacts').addEventListener('input', renderContacts);
document.getElementById('btn-add-contact').addEventListener('click', () => openContactModal(-1));

async function deleteContact(idx) {
  const res = await confirmDialog("Supprimer ce contact ?");
  if (res) {
    let list = decryptData(fullData.contacts.contacts, adminCode) || [];
    list.splice(idx, 1);
    await saveAllContacts(list);
  }
}

function openContactModal(idx) {
  let c = { nom:'', rel:'', relAutre:'', imp:3, tel:'', email:'', wa:'', tg:'', snap:'', ig:'', msg:'', notes:'' };
  let list = decryptData(fullData.contacts.contacts, adminCode) || [];
  if (idx >= 0) c = list[idx];

  const rels = ["Mère", "Père", "Frère", "Sœur", "Demi-frère", "Demi-sœur", "Grand-père", "Grand-mère", "Oncle", "Tante", "Cousin(e)", "Fils", "Fille", "Conjoint(e)", "Ex-conjoint(e)", "Ami(e) proche", "Meilleur(e) ami(e)", "Connaissance", "Collègue", "Patron/Manager", "Associé(e)", "Client", "Médecin", "Avocat", "Notaire", "Comptable", "Banquier", "Assureur", "Voisin(e)", "Propriétaire/Bailleur", "Professeur", "Famille éloignée", "Autre"];
  let relOpts = rels.map(r => `<option value="${r}" ${c.rel===r?'selected':''}>${r}</option>`).join('');

  const html = `
    <div class="modal-header">
      <h3 class="m-0"><i class="fas fa-address-book text-accent"></i> ${idx>=0?'Modifier':'Ajouter'} contact</h3>
      <button class="btn-close" onclick="closeModal()">&times;</button>
    </div>
    <form id="contact-form">
      <div class="grid-2 gap-16 mb-16">
        <input type="text" id="c-nom" placeholder="Nom complet *" value="${escapeHtml(c.nom)}" required>
        <div>
          <select id="c-rel" required>
            <option value="" disabled ${!c.rel?'selected':''}>Relation *</option>
            ${relOpts}
          </select>
        </div>
      </div>
      <div class="mb-16">
        <input type="text" id="c-relAutre" placeholder="Précisez la relation..." value="${escapeHtml(c.relAutre)}" style="display:${c.rel==='Autre'?'block':'none'}">
      </div>
      <div class="mb-16 flex-align-center gap-16">
        <span class="text-secondary">Importance :</span>
        <div class="importance-selector">
          ${[1,2,3,4,5].map(i => `
            <label class="imp-btn" data-value="${i}">
              <input type="radio" name="c-imp" value="${i}" ${c.imp==i?'checked':''}>
              <span>${i}</span>
            </label>
          `).join('')}
        </div>
      </div>
      <div class="grid-2 gap-16 mb-16">
        <input type="tel" id="c-tel" placeholder="Téléphone" value="${escapeHtml(c.tel)}">
        <input type="email" id="c-email" placeholder="Email" value="${escapeHtml(c.email)}">
        <input type="text" id="c-wa" placeholder="WhatsApp (Numéro)" value="${escapeHtml(c.wa)}">
        <input type="text" id="c-tg" placeholder="Telegram (Username)" value="${escapeHtml(c.tg)}">
        <input type="text" id="c-snap" placeholder="Snapchat (Username)" value="${escapeHtml(c.snap)}">
        <input type="text" id="c-ig" placeholder="Instagram (Username)" value="${escapeHtml(c.ig)}">
        <input type="text" id="c-msg" placeholder="Messenger (Username/ID)" value="${escapeHtml(c.msg)}">
      </div>
      <div class="mb-24">
        <textarea id="c-notes" placeholder="Notes..." rows="3">${escapeHtml(c.notes)}</textarea>
      </div>
      <button type="submit" class="btn-primary w-100">Sauvegarder</button>
    </form>
  `;
  openModal(html);

  setTimeout(() => {
    document.getElementById('c-rel').addEventListener('change', (e) => {
      document.getElementById('c-relAutre').style.display = e.target.value === 'Autre' ? 'block' : 'none';
    });
    document.getElementById('contact-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const nc = {
        nom: document.getElementById('c-nom').value,
        rel: document.getElementById('c-rel').value,
        relAutre: document.getElementById('c-relAutre').value,
        imp: document.querySelector('input[name="c-imp"]:checked').value,
        tel: document.getElementById('c-tel').value,
        email: document.getElementById('c-email').value,
        wa: document.getElementById('c-wa').value,
        tg: document.getElementById('c-tg').value,
        snap: document.getElementById('c-snap').value,
        ig: document.getElementById('c-ig').value,
        msg: document.getElementById('c-msg').value,
        notes: document.getElementById('c-notes').value
      };
      if (idx >= 0) list[idx] = nc; else list.push(nc);
      closeModal();
      await saveAllContacts(list);
    });
  }, 100);
}

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

async function saveVault(clearData) {
  showLoading();
  const enc = encryptData(clearData, vltCode);
  fullData.vault.vaultData = enc;
  await postToApi({ action: 'saveVault', data: { vaultData: enc } });
  hideLoading();
  showToast('Vault sauvegardé', 'success');
  renderVault();
}

function renderVault() {
  const cat = categoriesVault.find(c => c.id === currentVaultCategory);
  document.getElementById('current-category-title').innerHTML = `<i class="fas ${cat.icon}"></i> ${cat.name}`;
  const btnAdd = document.getElementById('btn-add-vault-item');

  if (currentVaultCategory === 'identite') {
    btnAdd.style.display = 'none';
  } else {
    btnAdd.style.display = 'block';
    btnAdd.onclick = () => openVaultModal(-1);
  }

  let list = decryptData(fullData.vault.vaultData, vltCode) || [];
  let filtered = list.filter(i => i.cat === currentVaultCategory);
  const container = document.getElementById('vault-items-list');
  container.innerHTML = '';

  if (currentVaultCategory === 'identite' && filtered.length === 0) {
    const defaultId = { cat: 'identite', nom: '', prenom: '', ddn: '', ldn: '', nat: '', adr: '', notes: '' };
    list.push(defaultId);
    filtered.push(defaultId);
    fullData.vault.vaultData = encryptData(list, vltCode);
  }

  filtered.forEach(item => {
    const idx = list.indexOf(item);
    const d = document.createElement('div');
    d.className = 'vault-card';

    let actions = `<button class="btn-icon" style="color:var(--accent);background:none;" onclick="openVaultModal(${idx})"><i class="fas fa-edit"></i></button>`;
    if (currentVaultCategory !== 'identite') {
      actions += `<button class="btn-icon" style="color:var(--danger);background:none;" onclick="deleteVaultItem(${idx})"><i class="fas fa-trash"></i></button>`;
    }

    let content = '';
    if (currentVaultCategory === 'identite') {
      content = `
        <h3 class="mb-8">${item.nom} ${item.prenom}</h3>
        <p class="text-secondary text-sm mb-4">Né(e) le: ${item.ddn} à ${item.ldn}</p>
        <p class="text-secondary text-sm">Adresse: ${item.adr}</p>
      `;
    } else if (currentVaultCategory === 'identifiants') {
      content = `
        <h3 class="mb-8">${item.service}</h3>
        <p class="text-secondary text-sm mb-4">ID: ${item.id} <i class="fas fa-copy cursor-pointer ml-4" onclick="copyToClipboard('${escapeHtml(item.id)}')"></i></p>
      `;
    } else {
      content = `<h3 class="mb-8">${item.service || item.banque || item.nom || item.type || item.titre || 'Élément'}</h3>`;
    }

    d.innerHTML = `<div class="vault-actions">${actions}</div>${content}`;
    container.appendChild(d);
  });
}

async function deleteVaultItem(idx) {
  const res = await confirmDialog("Supprimer cet élément ?");
  if (res) {
    let list = decryptData(fullData.vault.vaultData, vltCode) || [];
    list.splice(idx, 1);
    await saveVault(list);
  }
}

function openVaultModal(idx) {
  let list = decryptData(fullData.vault.vaultData, vltCode) || [];
  let item = idx >= 0 ? list[idx] : { cat: currentVaultCategory };

  let fieldsHtml = '';

  const generateInput = (id, placeholder, type='text', val='', req=false) => `
    <div class="mb-16">
      <input type="${type}" id="v-${id}" placeholder="${placeholder}" value="${escapeHtml(val)}" ${req?'required':''}>
    </div>
  `;
  const generateSecret = (id, placeholder, val='', req=false) => `
    <div class="input-group mb-16">
      <input type="password" id="v-${id}" placeholder="${placeholder}" value="${escapeHtml(val)}" ${req?'required':''}>
      <button type="button" class="toggle-pwd" style="right:40px" onclick="toggleVisibility(this, 'v-${id}')"><i class="fas fa-eye"></i></button>
      <button type="button" class="toggle-pwd" onclick="copyToClipboard(document.getElementById('v-${id}').value)"><i class="fas fa-copy"></i></button>
    </div>
  `;

  if (currentVaultCategory === 'identite') {
    fieldsHtml = `
      ${generateInput('nom', 'Nom', 'text', item.nom, true)}
      ${generateInput('prenom', 'Prénom', 'text', item.prenom, true)}
      ${generateInput('ddn', 'Date de naissance', 'date', item.ddn)}
      ${generateInput('ldn', 'Lieu de naissance', 'text', item.ldn)}
      ${generateInput('nat', 'Nationalité', 'text', item.nat)}
      ${generateInput('adr', 'Adresse complète', 'text', item.adr)}
      <textarea id="v-notes" placeholder="Notes..." rows="3" class="w-100">${escapeHtml(item.notes||'')}</textarea>
    `;
  } else if (currentVaultCategory === 'identifiants') {
    fieldsHtml = `
      ${generateInput('service', 'Service / Site', 'text', item.service, true)}
      ${generateInput('url', 'URL', 'url', item.url)}
      ${generateInput('id', 'Identifiant / Email', 'text', item.id, true)}
      ${generateSecret('mdp', 'Mot de passe', item.mdp, true)}
      <textarea id="v-notes" placeholder="Notes..." rows="3" class="w-100">${escapeHtml(item.notes||'')}</textarea>
    `;
  } else if (currentVaultCategory === 'cb') {
    fieldsHtml = `
      ${generateInput('banque', 'Banque', 'text', item.banque, true)}
      ${generateInput('nom', 'Nom sur la carte', 'text', item.nom)}
      ${generateSecret('num', 'Numéro de carte', item.num, true)}
      ${generateInput('exp', "Date d'expiration (MM/AA)", 'text', item.exp)}
      ${generateSecret('cvv', 'CVV', item.cvv)}
      ${generateSecret('pin', 'Code PIN', item.pin)}
      ${generateInput('plafond', 'Plafond', 'text', item.plafond)}
      <textarea id="v-notes" placeholder="Notes..." rows="3" class="w-100">${escapeHtml(item.notes||'')}</textarea>
    `;
  } else if (currentVaultCategory === 'documents') {
    fieldsHtml = `
      <select id="v-type" class="mb-16">
        <option value="CNI" ${item.type==='CNI'?'selected':''}>CNI</option>
        <option value="Passeport" ${item.type==='Passeport'?'selected':''}>Passeport</option>
        <option value="Permis" ${item.type==='Permis'?'selected':''}>Permis de conduire</option>
        <option value="Titre de séjour" ${item.type==='Titre de séjour'?'selected':''}>Titre de séjour</option>
        <option value="Autre" ${item.type==='Autre'?'selected':''}>Autre</option>
      </select>
      ${generateInput('num', 'Numéro de document', 'text', item.num, true)}
      ${generateInput('deliv', 'Date de délivrance', 'date', item.deliv)}
      ${generateInput('exp', "Date d'expiration", 'date', item.exp)}
      ${generateInput('lieu', 'Lieu de délivrance', 'text', item.lieu)}
      <textarea id="v-notes" placeholder="Notes..." rows="3" class="w-100">${escapeHtml(item.notes||'')}</textarea>
    `;
  } else if (currentVaultCategory === 'banques') {
    fieldsHtml = `
      ${generateInput('banque', 'Banque', 'text', item.banque, true)}
      ${generateInput('titulaire', 'Titulaire', 'text', item.titulaire)}
      ${generateSecret('iban', 'IBAN', item.iban, true)}
      ${generateInput('bic', 'BIC', 'text', item.bic)}
      ${generateInput('compte', 'Numéro de compte', 'text', item.compte)}
      ${generateInput('agence', 'Agence', 'text', item.agence)}
      <textarea id="v-notes" placeholder="Notes..." rows="3" class="w-100">${escapeHtml(item.notes||'')}</textarea>
    `;
  } else if (currentVaultCategory === 'codes') {
    fieldsHtml = `
      ${generateInput('nom', 'Nom / Description', 'text', item.nom, true)}
      ${generateSecret('code', 'Code / PIN', item.code, true)}
      <textarea id="v-notes" placeholder="Notes..." rows="3" class="w-100">${escapeHtml(item.notes||'')}</textarea>
    `;
  } else if (currentVaultCategory === 'medical') {
    fieldsHtml = `
      <select id="v-sang" class="mb-16">
        <option value="">Groupe sanguin</option>
        ${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(s => `<option value="${s}" ${item.sang===s?'selected':''}>${s}</option>`).join('')}
      </select>
      ${generateInput('secu', 'N° Sécurité Sociale', 'text', item.secu)}
      ${generateInput('mutuelle', 'Mutuelle', 'text', item.mutuelle)}
      ${generateInput('num_adh', 'N° Adhérent', 'text', item.num_adh)}
      ${generateInput('medecin', 'Médecin traitant', 'text', item.medecin)}
      <textarea id="v-allergies" placeholder="Allergies..." rows="2" class="w-100 mb-16">${escapeHtml(item.allergies||'')}</textarea>
      <textarea id="v-traitement" placeholder="Traitements en cours..." rows="2" class="w-100 mb-16">${escapeHtml(item.traitement||'')}</textarea>
      <textarea id="v-notes" placeholder="Notes..." rows="2" class="w-100">${escapeHtml(item.notes||'')}</textarea>
    `;
  } else if (currentVaultCategory === 'assurances') {
    fieldsHtml = `
      <select id="v-type" class="mb-16">
        <option value="Auto" ${item.type==='Auto'?'selected':''}>Auto</option>
        <option value="Habitation" ${item.type==='Habitation'?'selected':''}>Habitation</option>
        <option value="Santé" ${item.type==='Santé'?'selected':''}>Santé</option>
        <option value="Vie" ${item.type==='Vie'?'selected':''}>Assurance Vie</option>
        <option value="Responsabilité civile" ${item.type==='Responsabilité civile'?'selected':''}>Responsabilité civile</option>
        <option value="Autre" ${item.type==='Autre'?'selected':''}>Autre</option>
      </select>
      ${generateInput('compagnie', 'Compagnie', 'text', item.compagnie, true)}
      ${generateInput('contrat', 'N° de contrat', 'text', item.contrat, true)}
      ${generateInput('tel', 'Téléphone assistance', 'tel', item.tel)}
      ${generateInput('ech', "Date d'échéance", 'date', item.ech)}
      <textarea id="v-notes" placeholder="Notes..." rows="3" class="w-100">${escapeHtml(item.notes||'')}</textarea>
    `;
  } else if (currentVaultCategory === 'licences') {
    fieldsHtml = `
      ${generateInput('service', 'Logiciel / Service', 'text', item.service, true)}
      ${generateSecret('cle', 'Clé de licence', item.cle, true)}
      ${generateInput('email', 'Email associé', 'email', item.email)}
      ${generateInput('renouv', 'Date de renouvellement', 'date', item.renouv)}
      <textarea id="v-notes" placeholder="Notes..." rows="3" class="w-100">${escapeHtml(item.notes||'')}</textarea>
    `;
  } else if (currentVaultCategory === 'notes') {
    fieldsHtml = `
      ${generateInput('titre', 'Titre de la note', 'text', item.titre, true)}
      <textarea id="v-contenu" placeholder="Contenu de la note..." rows="10" class="w-100 mb-16" required>${escapeHtml(item.contenu||'')}</textarea>
    `;
  }

  const html = `
    <div class="modal-header">
      <h3 class="m-0"><i class="fas fa-shield-alt text-accent"></i> ${idx>=0?'Modifier':'Ajouter'}</h3>
      <button class="btn-close" onclick="closeModal()">&times;</button>
    </div>
    <form id="vault-form">
      ${fieldsHtml}
      <button type="submit" class="btn-primary w-100 mt-16">Sauvegarder</button>
    </form>
  `;
  openModal(html);

  setTimeout(() => {
    document.getElementById('vault-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      let ni = { cat: currentVaultCategory };
      document.querySelectorAll('#vault-form input, #vault-form select, #vault-form textarea').forEach(el => {
        if(el.id.startsWith('v-')) {
          ni[el.id.substring(2)] = el.value;
        }
      });
      if (idx >= 0) list[idx] = ni; else list.push(ni);
      closeModal();
      await saveVault(list);
    });
  }, 100);
}

function initTestament() {
  quill = new Quill('#quill-editor', {
    theme: 'snow',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'header': [1, 2, 3, false] }],
        [{ 'color': [] }]
      ]
    }
  });

  const d = decryptData(fullData.testament.testamentData, tstCode) || {};
  if (d.nom) document.getElementById('testament-nom').value = d.nom;
  if (d.prenom) document.getElementById('testament-prenom').value = d.prenom;
  if (d.ddn) document.getElementById('testament-ddn').value = d.ddn;
  if (d.ldn) document.getElementById('testament-ldn').value = d.ldn;
  if (d.nat) document.getElementById('testament-nationalite').value = d.nat;
  if (d.adr) document.getElementById('testament-adresse').value = d.adr;
  if (d.content) quill.root.innerHTML = d.content;

  let lastSaved = JSON.stringify(d);

  setInterval(() => {
    if (document.getElementById('tab-testament').style.display !== 'none') {
      const current = JSON.stringify(getTestamentData());
      if (current !== lastSaved) {
        saveTestament(true);
        lastSaved = current;
      }
    }
  }, 30000);
}

function getTestamentData() {
  return {
    nom: document.getElementById('testament-nom').value,
    prenom: document.getElementById('testament-prenom').value,
    ddn: document.getElementById('testament-ddn').value,
    ldn: document.getElementById('testament-ldn').value,
    nat: document.getElementById('testament-nationalite').value,
    adr: document.getElementById('testament-adresse').value,
    content: quill.root.innerHTML,
    lastModified: new Date().toISOString()
  };
}

async function saveTestament(silent = false) {
  if (!silent) showLoading();
  const d = getTestamentData();
  const enc = encryptData(d, tstCode);
  fullData.testament.testamentData = enc;
  await postToApi({ action: 'saveTestament', data: { testamentData: enc } });
  if (!silent) {
    hideLoading();
    showToast('Testament sauvegardé', 'success');
  }
}

document.getElementById('btn-save-testament').addEventListener('click', () => saveTestament(false));
document.getElementById('btn-export-pdf').addEventListener('click', () => {
  const d = getTestamentData();
  const html = `
    <div style="padding: 40px; font-family: 'Inter', sans-serif; color: #000; background: #fff;">
      <h1 style="text-align: center; color: #457b9d; margin-bottom: 40px;">TESTAMENT — DERNIÈRES VOLONTÉS</h1>
      <div style="margin-bottom: 40px; padding: 20px; border: 1px solid #ccc; background: #f9f9f9;">
        <h3>Identité</h3>
        <p><strong>Nom:</strong> ${escapeHtml(d.nom)}</p>
        <p><strong>Prénom:</strong> ${escapeHtml(d.prenom)}</p>
        <p><strong>Date de naissance:</strong> ${escapeHtml(d.ddn)}</p>
        <p><strong>Lieu de naissance:</strong> ${escapeHtml(d.ldn)}</p>
        <p><strong>Nationalité:</strong> ${escapeHtml(d.nat)}</p>
        <p><strong>Adresse:</strong> ${escapeHtml(d.adr)}</p>
      </div>
      <p style="text-align: right; font-style: italic; margin-bottom: 40px;">Dernière modification : ${formatDateFR(d.lastModified)}</p>
      <div style="margin-bottom: 60px;">${d.content}</div>
      <hr style="margin-top: 60px;">
      <p style="text-align: center; font-size: 12px; color: #888;">Document généré le ${formatDateFR(new Date())} — Utilitaire</p>
    </div>
  `;
  const opt = {
    margin: 10,
    filename: 'Testament.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(html).save();
});

function renderSettings() {
  const msg = decryptData(fullData.config.emergencyMessage, adminCode) || "";
  document.getElementById('settings-emergency-msg').value = msg;

  const tbody = document.getElementById('logs-tbody');
  tbody.innerHTML = '';
  const logs = fullData.config.publicAccessLogs || [];
  logs.forEach(l => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(l.date)}</td>
      <td><span class="${l.type==='Panique'||l.type==='Tentative suspecte'?'text-danger font-bold':''}">${escapeHtml(l.type)}</span></td>
      <td>${escapeHtml(l.ip)}</td>
      <td>${escapeHtml(l.nom || '-')}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById('btn-save-emergency-msg').addEventListener('click', async () => {
  const msg = document.getElementById('settings-emergency-msg').value;
  showLoading();
  fullData.config.emergencyMessage = encryptData(msg, adminCode);
  fullData.config.emergencyMessageForEmergency = encryptData(msg, urgCode);
  await postToApi({ action: 'saveConfig', data: fullData.config });
  hideLoading();
  showToast('Message sauvegardé', 'success');
});

document.getElementById('btn-test-log').addEventListener('click', async () => {
  showLoading();
  const info = await getClientInfo();
  await postToApi({ logAccess: true, logType: "Test", ip: info.ip, userAgent: info.userAgent, lat: info.lat, lng: info.lng, nomComplet: "Test Admin" });
  fullData = await loadData();
  renderSettings();
  hideLoading();
  showToast('Log envoyé', 'success');
});

document.getElementById('btn-wipe-data').addEventListener('click', async () => {
  const res1 = await confirmDialog("Êtes-vous sûr de vouloir tout effacer ? Cette action est irréversible.");
  if (res1) {
    const res2 = await confirmDialog("Êtes-vous VRAIMENT sûr ? Tapez confirmer pour valider.");
    if (res2) {
      showLoading();
      await postToApi({ action: 'saveConfig', data: { isSetup: false } });
      await postToApi({ action: 'saveContacts', data: {} });
      await postToApi({ action: 'saveVault', data: {} });
      await postToApi({ action: 'saveTestament', data: {} });
      sessionStorage.clear();
      window.location.href = 'setup.html';
    }
  }
});

async function changeCode(type) {
  const oldC = document.getElementById(`change-${type}-old`).value;
  const newC = document.getElementById(`change-${type}-new`).value;
  const confC = document.getElementById(`change-${type}-conf`).value;

  if (newC !== confC) {
    showToast('La confirmation ne correspond pas', 'error');
    return;
  }

  if (type === 'admin' && newC.length < 8) {
    showToast('Le code admin doit faire min 8 caractères', 'error');
    return;
  }
  if (type !== 'admin' && newC.length < 6) {
    showToast(`Le code ${type} doit faire min 6 caractères`, 'error');
    return;
  }

  if (type === 'admin' && hashPassword(oldC) !== fullData.config.adminHash) { showToast('Ancien code incorrect', 'error'); return; }
  if (type === 'emergency' && hashPassword(oldC) !== fullData.config.emergencyHash) { showToast('Ancien code incorrect', 'error'); return; }
  if (type === 'vault' && hashPassword(oldC) !== fullData.config.vaultHash) { showToast('Ancien code incorrect', 'error'); return; }
  if (type === 'testament' && hashPassword(oldC) !== fullData.config.testamentHash) { showToast('Ancien code incorrect', 'error'); return; }

  showLoading();

  if (type === 'admin') {
    adminCode = newC;
    fullData.config.adminHash = hashPassword(newC);

    let cList = decryptData(fullData.contacts.contacts, oldC) || [];
    fullData.contacts.contacts = encryptData(cList, adminCode);
    await postToApi({ action: 'saveContacts', data: fullData.contacts });

    fullData.config.encryptedEmergencyPassword = encryptData(urgCode, adminCode);
    fullData.config.encryptedVaultPassword = encryptData(vltCode, adminCode);
    fullData.config.encryptedTestamentPassword = encryptData(tstCode, adminCode);

    const msg = decryptData(fullData.config.emergencyMessage, oldC) || "";
    fullData.config.emergencyMessage = encryptData(msg, adminCode);

    await postToApi({ action: 'saveConfig', data: fullData.config });
    sessionStorage.setItem('_key', adminCode);
  }
  else if (type === 'emergency') {
    urgCode = newC;
    fullData.config.emergencyHash = hashPassword(newC);

    let cList = decryptData(fullData.contacts.emergencyContacts, oldC) || [];
    fullData.contacts.emergencyContacts = encryptData(cList, urgCode);
    await postToApi({ action: 'saveContacts', data: fullData.contacts });

    fullData.config.encryptedEmergencyPassword = encryptData(urgCode, adminCode);

    const msg = decryptData(fullData.config.emergencyMessageForEmergency, oldC) || "";
    fullData.config.emergencyMessageForEmergency = encryptData(msg, urgCode);

    await postToApi({ action: 'saveConfig', data: fullData.config });
  }
  else if (type === 'vault') {
    vltCode = newC;
    fullData.config.vaultHash = hashPassword(newC);

    let vList = decryptData(fullData.vault.vaultData, oldC) || [];
    fullData.vault.vaultData = encryptData(vList, vltCode);
    await postToApi({ action: 'saveVault', data: fullData.vault });

    fullData.config.encryptedVaultPassword = encryptData(vltCode, adminCode);
    await postToApi({ action: 'saveConfig', data: fullData.config });
  }
  else if (type === 'testament') {
    tstCode = newC;
    fullData.config.testamentHash = hashPassword(newC);

    let tData = decryptData(fullData.testament.testamentData, oldC) || {};
    fullData.testament.testamentData = encryptData(tData, tstCode);
    await postToApi({ action: 'saveTestament', data: fullData.testament });

    fullData.config.encryptedTestamentPassword = encryptData(tstCode, adminCode);
    await postToApi({ action: 'saveConfig', data: fullData.config });
  }

  ['old', 'new', 'conf'].forEach(s => document.getElementById(`change-${type}-${s}`).value = '');
  hideLoading();
  showToast('Code modifié avec succès', 'success');
}
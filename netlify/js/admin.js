let adminKey = sessionStorage.getItem('adminKey');
let globalData = null;
let emergencyPwd, vaultPwd, testamentPwd;
let contacts = [], vaultData = [], testamentData = {};
let quill = null;
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

const relations = ['Mère','Père','Frère','Sœur','Demi-frère','Demi-sœur','Grand-père','Grand-mère','Oncle','Tante','Cousin(e)','Fils','Fille','Conjoint(e)','Ex-conjoint(e)','Ami(e) proche','Meilleur(e) ami(e)','Connaissance','Collègue','Patron/Manager','Associé(e)','Client','Médecin','Avocat','Notaire','Comptable','Banquier','Assureur','Voisin(e)','Propriétaire/Bailleur','Professeur','Famille éloignée','Autre'];

document.addEventListener('DOMContentLoaded', async () => {
  if (!adminKey) { window.location.href = 'index.html'; return; }
  setupAutoLock(15);
  document.getElementById('btn-logout').onclick = () => { sessionStorage.clear(); window.location.href = 'index.html'; };

  try {
    globalData = await loadData();
    if (hashPassword(adminKey) !== globalData.adminHash) throw new Error('Invalid key');

    emergencyPwd = decryptData(globalData.encryptedEmergencyPassword, adminKey);
    vaultPwd = decryptData(globalData.encryptedVaultPassword, adminKey);
    testamentPwd = decryptData(globalData.encryptedTestamentPassword, adminKey);

    contacts = decryptData(globalData.contacts, adminKey) || [];
    vaultData = decryptData(globalData.vaultData, vaultPwd) || [];
    testamentData = decryptData(globalData.testamentData, testamentPwd) || { identity: {}, content: '', lastModified: null };

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content-container').classList.remove('hidden');

    initTabs();
    renderContacts();
    initVaultSidebar();
    renderVault();
    initSettings();
  } catch (err) {
    sessionStorage.clear();
    window.location.href = 'index.html';
  }
});

function initTabs() {
  document.querySelectorAll('.tab[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      document.getElementById(target).classList.remove('hidden');
      document.getElementById(target).classList.add('flex');
      if (target === 'tab-testament' && !quill) {
        initTestament();
      }
    });
  });
}

function renderContacts() {
  const list = document.getElementById('contacts-list');
  list.innerHTML = '';
  contacts.sort((a,b) => a.importance - b.importance).forEach((c, idx) => {
    const row = document.createElement('div');
    row.className = `contact-row imp-${c.importance}`;

    let linksHtml = '';
    if(c.phone) linksHtml += `<a href="tel:${c.phone}" class="link-icon link-phone"><i class="fas fa-phone"></i></a>`;
    if(c.email) linksHtml += `<a href="mailto:${c.email}" class="link-icon link-email"><i class="fas fa-envelope"></i></a>`;
    if(c.whatsapp) linksHtml += `<a href="https://wa.me/${c.whatsapp.replace(/\D/g,'')}" target="_blank" class="link-icon link-whatsapp"><i class="fab fa-whatsapp"></i></a>`;
    if(c.telegram) linksHtml += `<a href="https://t.me/${c.telegram}" target="_blank" class="link-icon link-telegram"><i class="fab fa-telegram"></i></a>`;
    if(c.snapchat) linksHtml += `<a href="https://www.snapchat.com/add/${c.snapchat}" target="_blank" class="link-icon link-snap"><i class="fab fa-snapchat-ghost"></i></a>`;
    if(c.instagram) linksHtml += `<a href="https://www.instagram.com/${c.instagram}" target="_blank" class="link-icon link-insta"><i class="fab fa-instagram"></i></a>`;
    if(c.messenger) linksHtml += `<a href="https://m.me/${c.messenger}" target="_blank" class="link-icon link-messenger"><i class="fab fa-facebook-messenger"></i></a>`;

    row.innerHTML = `
      <div class="contact-info">
        <span class="contact-name">${escapeHtml(c.nom)}</span>
        <span class="contact-relation">${escapeHtml(c.relation === 'Autre' ? c.relationAutre : c.relation)}</span>
      </div>
      <div class="contact-links">${linksHtml}</div>
      <div class="contact-actions">
        <button class="action-btn" onclick="editContact(${idx})"><i class="fas fa-edit"></i></button>
        <button class="action-btn delete-btn" onclick="deleteContact(${idx})"><i class="fas fa-trash"></i></button>
      </div>
    `;
    list.appendChild(row);
  });
}

document.getElementById('btn-add-contact').onclick = () => openContactModal();

function openContactModal(idx = null) {
  const c = idx !== null ? contacts[idx] : {};
  let relOptions = relations.map(r => `<option value="${r}" ${c.relation===r?'selected':''}>${r}</option>`).join('');

  const html = `
    <h3 class="font-bold text-xl mb-4">${idx !== null ? 'Modifier' : 'Ajouter'} Contact</h3>
    <div class="flex-col gap-4">
      <div class="flex-col gap-2"><label>Nom Complet *</label><input type="text" id="c-nom" value="${escapeHtml(c.nom||'')}" required></div>
      <div class="flex-col gap-2"><label>Relation</label>
        <select id="c-rel" onchange="document.getElementById('c-rel-autre-div').style.display=this.value==='Autre'?'block':'none'">${relOptions}</select>
      </div>
      <div class="flex-col gap-2" id="c-rel-autre-div" style="display:${c.relation==='Autre'?'block':'none'}">
        <label>Préciser la relation</label><input type="text" id="c-rel-autre" value="${escapeHtml(c.relationAutre||'')}">
      </div>
      <div class="flex-col gap-2"><label>Importance (1=Max, 5=Min)</label>
        <div class="importance-selector">
          ${[1,2,3,4,5].map(i => `
            <label class="imp-btn" data-value="${i}">
              <input type="radio" name="c-imp" value="${i}" ${c.importance==i || (!c.importance && i==5) ? 'checked' : ''}>
              <span>${i}</span>
            </label>
          `).join('')}
        </div>
      </div>
      <div class="flex gap-4 flex-row-mobile-col">
        <div class="flex-1 flex-col gap-2"><label>Téléphone</label><input type="text" id="c-tel" value="${escapeHtml(c.phone||'')}"></div>
        <div class="flex-1 flex-col gap-2"><label>Email</label><input type="email" id="c-email" value="${escapeHtml(c.email||'')}"></div>
      </div>
      <div class="flex gap-4 flex-row-mobile-col">
        <div class="flex-1 flex-col gap-2"><label>WhatsApp</label><input type="text" id="c-wa" value="${escapeHtml(c.whatsapp||'')}"></div>
        <div class="flex-1 flex-col gap-2"><label>Telegram</label><input type="text" id="c-tg" value="${escapeHtml(c.telegram||'')}"></div>
      </div>
      <div class="flex gap-4 flex-row-mobile-col">
        <div class="flex-1 flex-col gap-2"><label>Snapchat</label><input type="text" id="c-snap" value="${escapeHtml(c.snapchat||'')}"></div>
        <div class="flex-1 flex-col gap-2"><label>Instagram</label><input type="text" id="c-insta" value="${escapeHtml(c.instagram||'')}"></div>
      </div>
      <div class="flex-col gap-2"><label>Messenger</label><input type="text" id="c-msn" value="${escapeHtml(c.messenger||'')}"></div>
      <div class="flex-col gap-2"><label>Notes</label><textarea id="c-notes">${escapeHtml(c.notes||'')}</textarea></div>
      <div class="flex justify-end gap-2 mt-4">
        <button class="btn-danger" onclick="closeModal()">Annuler</button>
        <button class="btn-success" onclick="saveContact(${idx})">Enregistrer</button>
      </div>
    </div>
  `;
  openModal(html);
}

window.saveContact = async (idx) => {
  const nom = document.getElementById('c-nom').value;
  if (!nom) return showToast('Nom requis', 'error');

  const contact = {
    nom,
    relation: document.getElementById('c-rel').value,
    relationAutre: document.getElementById('c-rel-autre').value,
    importance: parseInt(document.querySelector('input[name="c-imp"]:checked').value),
    phone: document.getElementById('c-tel').value,
    email: document.getElementById('c-email').value,
    whatsapp: document.getElementById('c-wa').value,
    telegram: document.getElementById('c-tg').value,
    snapchat: document.getElementById('c-snap').value,
    instagram: document.getElementById('c-insta').value,
    messenger: document.getElementById('c-msn').value,
    notes: document.getElementById('c-notes').value
  };

  if (idx === null) contacts.push(contact);
  else contacts[idx] = contact;

  closeModal();
  renderContacts();
  await syncContacts();
};

window.editContact = (idx) => openContactModal(idx);
window.deleteContact = async (idx) => {
  if (await confirmDialog('Supprimer ce contact ?')) {
    contacts.splice(idx, 1);
    renderContacts();
    await syncContacts();
  }
};

async function syncContacts() {
  globalData.contacts = encryptData(contacts, adminKey);
  globalData.emergencyContacts = encryptData(contacts, emergencyPwd);
  await postToApi({ action: 'save', data: globalData });
  showToast('Contacts sauvegardés', 'success');
}

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

  if(items.length===0 && activeVaultCat===0) {
    vaultData.push({ id: Date.now().toString(), categoryId: 0, title: 'Mon identité', data: {} });
    renderVault();
    return;
  }

  items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'vault-item relative';

    let html = `<h3 class="font-bold mb-2 text-accent">${escapeHtml(item.title || 'Sans titre')}</h3>`;

    for (const [k, v] of Object.entries(item.data)) {
      if(!v) continue;
      const isPwd = ['Mot de passe','CVV','PIN','IBAN','Code','Clé','Numéro de Sécurité Sociale'].includes(k);
      const isCardNumber = k === 'Numéro' && item.categoryId === 2;
      let valHtml = '';

      const idStr = `v_${item.id}_${k.replace(/\s/g,'')}`;
      if (isPwd) {
        valHtml = `<input type="password" id="${idStr}" value="${escapeHtml(v)}" readonly style="background:transparent;border:none;padding:0;color:var(--text);flex:1;outline:none">
                   <button class="eye-btn" onclick="toggleVisibility(this, '${idStr}')"><i class="fas fa-eye"></i></button>`;
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

    if (activeVaultCat !== 0) {
      html += `
        <div class="absolute top-4 right-4 flex gap-2">
          <button class="action-btn" onclick="editVault('${item.id}')"><i class="fas fa-edit"></i></button>
          <button class="action-btn delete-btn" onclick="deleteVault('${item.id}')"><i class="fas fa-trash"></i></button>
        </div>
      `;
    } else {
      html += `
        <div class="absolute top-4 right-4 flex gap-2">
          <button class="action-btn" onclick="editVault('${item.id}')"><i class="fas fa-edit"></i></button>
        </div>
      `;
    }

    el.innerHTML = html;
    list.appendChild(el);
  });
}

document.getElementById('btn-add-vault').onclick = () => openVaultModal();

window.editVault = (id) => {
  const item = vaultData.find(v => v.id === id);
  if(item) openVaultModal(item);
};

window.deleteVault = async (id) => {
  if (activeVaultCat === 0) return;
  if (await confirmDialog('Supprimer cet élément ?')) {
    vaultData = vaultData.filter(v => v.id !== id);
    renderVault();
    await syncVault();
  }
};

function openVaultModal(item = null) {
  const isEdit = !!item;
  const data = isEdit ? item.data : {};
  let fieldsHtml = '';

  const makeField = (label, type='text', isTextarea=false) => {
    const v = escapeHtml(data[label] || '');
    if (isTextarea) return `<div class="flex-col gap-2"><label>${label}</label><textarea id="vf_${label.replace(/\s/g,'')}">${v}</textarea></div>`;
    return `<div class="flex-col gap-2"><label>${label}</label><input type="${type}" id="vf_${label.replace(/\s/g,'')}" value="${v}"></div>`;
  };

  switch(activeVaultCat) {
    case 0:
      fieldsHtml += makeField('Nom Complet') + makeField('Date de naissance', 'date') + makeField('Lieu de naissance') + makeField('Nationalité') + makeField('Adresse', 'text', true) + makeField('Notes', 'text', true);
      break;
    case 1:
      fieldsHtml += makeField('Service') + makeField('URL') + makeField('Identifiant') + makeField('Mot de passe', 'password') + makeField('Notes', 'text', true);
      break;
    case 2:
      fieldsHtml += makeField('Banque') + makeField('Nom carte') + makeField('Numéro') + makeField('Expiration') + makeField('CVV', 'password') + makeField('PIN', 'password') + makeField('Plafond') + makeField('Notes', 'text', true);
      break;
    case 3:
      fieldsHtml += makeField('Type de document') + makeField('Numéro') + makeField('Dates (Émission/Exp)') + makeField('Lieu de délivrance') + makeField('Notes', 'text', true);
      break;
    case 4:
      fieldsHtml += makeField('Banque') + makeField('Titulaire') + makeField('IBAN', 'password') + makeField('BIC') + makeField('Numéro de compte') + makeField('Agence') + makeField('Notes', 'text', true);
      break;
    case 5:
      fieldsHtml += makeField('Nom') + makeField('Code', 'password') + makeField('Notes', 'text', true);
      break;
    case 6:
      fieldsHtml += makeField('Groupe sanguin') + makeField('Allergies') + makeField('Traitements') + makeField('Médecin traitant') + makeField('Numéro de Sécurité Sociale', 'password') + makeField('Mutuelle') + makeField('Numéro adhérent') + makeField('Notes', 'text', true);
      break;
    case 7:
      fieldsHtml += makeField('Type d\'assurance') + makeField('Compagnie') + makeField('Numéro contrat') + makeField('Téléphone sinistre') + makeField('Échéance') + makeField('Notes', 'text', true);
      break;
    case 8:
      fieldsHtml += makeField('Service') + makeField('Clé', 'password') + makeField('Email associé') + makeField('Date de renouvellement') + makeField('Notes', 'text', true);
      break;
    case 9:
      fieldsHtml += makeField('Titre') + makeField('Contenu', 'text', true);
      break;
  }

  const html = `
    <h3 class="font-bold text-xl mb-4">${isEdit ? 'Modifier' : 'Ajouter'} dans ${vaultCategories[activeVaultCat].name}</h3>
    <div class="flex flex-col gap-4" id="vault-form-fields">
      ${activeVaultCat === 0 ? '' : `<div class="flex-col gap-2"><label>Titre (Libellé principal)</label><input type="text" id="v_title" value="${escapeHtml(item?.title||'')}"></div>`}
      ${fieldsHtml}
      <div class="flex justify-end gap-2 mt-4">
        <button class="btn-danger" onclick="closeModal()">Annuler</button>
        <button class="btn-success" onclick="saveVault('${item?.id||''}')">Enregistrer</button>
      </div>
    </div>
  `;
  openModal(html);
}

window.saveVault = async (id) => {
  const container = document.getElementById('vault-form-fields');
  const newData = {};
  container.querySelectorAll('input[id^="vf_"], textarea[id^="vf_"]').forEach(el => {
    const label = el.previousElementSibling.innerText;
    newData[label] = el.value;
  });

  let title = document.getElementById('v_title')?.value || newData['Nom Complet'] || newData['Service'] || newData['Banque'] || newData['Nom'] || newData['Type de document'] || newData['Titre'] || 'Élément';
  if(activeVaultCat === 0) title = "Mon identité";

  if (id) {
    const idx = vaultData.findIndex(v => v.id === id);
    if(idx > -1) { vaultData[idx].title = title; vaultData[idx].data = newData; }
  } else {
    vaultData.push({ id: Date.now().toString(), categoryId: activeVaultCat, title, data: newData });
  }

  closeModal();
  renderVault();
  await syncVault();
};

async function syncVault() {
  globalData.vaultData = encryptData(vaultData, vaultPwd);
  await postToApi({ action: 'save', data: globalData });
  showToast('Vault sauvegardé', 'success');
}

function initTestament() {
  quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: { toolbar: [ [{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline'], [{'list': 'ordered'}, {'list': 'bullet'}], [{ 'color': [] }, { 'background': [] }], ['clean'] ] }
  });

  const d = testamentData;
  if(d.identity) {
    document.getElementById('test-nom').value = d.identity.nom || '';
    document.getElementById('test-dob').value = d.identity.dob || '';
    document.getElementById('test-lieu').value = d.identity.lieu || '';
    document.getElementById('test-nat').value = d.identity.nat || '';
    document.getElementById('test-addr').value = d.identity.addr || '';
  }
  if(d.content) quill.root.innerHTML = d.content;

  document.getElementById('btn-save-testament').onclick = saveTestament;
  document.getElementById('btn-pdf-testament').onclick = exportPdf;

  setInterval(saveTestament, 30000);
}

async function saveTestament() {
  if(!quill) return;
  testamentData = {
    identity: {
      nom: document.getElementById('test-nom').value,
      dob: document.getElementById('test-dob').value,
      lieu: document.getElementById('test-lieu').value,
      nat: document.getElementById('test-nat').value,
      addr: document.getElementById('test-addr').value
    },
    content: quill.root.innerHTML,
    lastModified: new Date().toISOString()
  };
  globalData.testamentData = encryptData(testamentData, testamentPwd);
  await postToApi({ action: 'save', data: globalData });
  showToast('Testament auto-sauvegardé', 'success');
}

function exportPdf() {
  const d = testamentData;
  const content = document.createElement('div');
  content.innerHTML = `
    <h1 style="text-align:center; margin-bottom: 20px;">TESTAMENT — DERNIÈRES VOLONTÉS</h1>
    <div style="margin-bottom: 30px; padding: 10px; border: 1px solid #ccc;">
      <h3>État Civil</h3>
      <p><b>Nom :</b> ${d.identity.nom}</p>
      <p><b>Né(e) le :</b> ${d.identity.dob} à ${d.identity.lieu}</p>
      <p><b>Nationalité :</b> ${d.identity.nat}</p>
      <p><b>Adresse :</b> ${d.identity.addr}</p>
    </div>
    <div style="margin-bottom: 30px;">
      ${d.content}
    </div>
    <p style="text-align:right; margin-top: 50px;">Fait le ${new Date().toLocaleDateString('fr-FR')}</p>
  `;
  html2pdf().from(content).save('Testament.pdf');
}

function initSettings() {
  const msg = decryptData(globalData.emergencyMessage, adminKey) || '';
  document.getElementById('settings-msg').value = msg;

  document.getElementById('btn-save-msg').onclick = async () => {
    const val = document.getElementById('settings-msg').value;
    globalData.emergencyMessage = encryptData(val, adminKey);
    globalData.emergencyMessageForEmergency = encryptData(val, emergencyPwd);
    await postToApi({ action: 'save', data: globalData });
    showToast('Message enregistré', 'success');
  };

  const logsList = document.getElementById('access-logs-list');
  logsList.innerHTML = '';
  if (globalData.publicAccessLogs) {
    globalData.publicAccessLogs.forEach(l => {
      logsList.innerHTML += `<div class="p-2 border-b"><b>${l.date}</b> - ${l.type} - IP: ${l.ip} - Nom: ${l.nom||'N/A'}</div>`;
    });
  }

  const changePwd = async (type) => {
    const newPwd = prompt(`Nouveau mot de passe pour ${type} :`);
    if (!newPwd) return;
    const hash = hashPassword(newPwd);

    if (type === 'admin') {
      globalData.adminHash = hash;
      globalData.encryptedEmergencyPassword = encryptData(emergencyPwd, newPwd);
      globalData.encryptedVaultPassword = encryptData(vaultPwd, newPwd);
      globalData.encryptedTestamentPassword = encryptData(testamentPwd, newPwd);
      globalData.contacts = encryptData(contacts, newPwd);
      globalData.emergencyMessage = encryptData(document.getElementById('settings-msg').value, newPwd);
      sessionStorage.setItem('adminKey', newPwd);
      adminKey = newPwd;
    } else if (type === 'urgence') {
      globalData.emergencyHash = hash;
      globalData.encryptedEmergencyPassword = encryptData(newPwd, adminKey);
      globalData.emergencyContacts = encryptData(contacts, newPwd);
      globalData.emergencyMessageForEmergency = encryptData(document.getElementById('settings-msg').value, newPwd);
      emergencyPwd = newPwd;
    } else if (type === 'vault') {
      globalData.vaultHash = hash;
      globalData.encryptedVaultPassword = encryptData(newPwd, adminKey);
      globalData.vaultData = encryptData(vaultData, newPwd);
      vaultPwd = newPwd;
    } else if (type === 'testament') {
      globalData.testamentHash = hash;
      globalData.encryptedTestamentPassword = encryptData(newPwd, adminKey);
      globalData.testamentData = encryptData(testamentData, newPwd);
      testamentPwd = newPwd;
    }

    await postToApi({ action: 'save', data: globalData });
    showToast(`Mot de passe ${type} mis à jour et données re-chiffrées`, 'success');
  };

  document.getElementById('btn-change-admin').onclick = () => changePwd('admin');
  document.getElementById('btn-change-urgence').onclick = () => changePwd('urgence');
  document.getElementById('btn-change-vault').onclick = () => changePwd('vault');
  document.getElementById('btn-change-testament').onclick = () => changePwd('testament');
}
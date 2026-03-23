let adminKey = null;
let emergencyPwd = null;
let vaultPwd = null;
let testamentPwd = null;
let vaultData = [];
let testamentData = { identity: {}, content: '', lastModified: null };
let appData = null;

const RELATIONS = [
  'Mère', 'Père', 'Frère', 'Sœur', 'Demi-frère', 'Demi-sœur',
  'Grand-père', 'Grand-mère', 'Oncle', 'Tante', 'Cousin(e)',
  'Fils', 'Fille', 'Conjoint(e)', 'Ex-conjoint(e)', 'Ami(e) proche',
  'Meilleur(e) ami(e)', 'Connaissance', 'Collègue', 'Patron/Manager',
  'Associé(e)', 'Client', 'Médecin', 'Avocat', 'Notaire', 'Comptable',
  'Banquier', 'Assureur', 'Voisin(e)', 'Propriétaire/Bailleur', 'Professeur',
  'Famille éloignée', 'Autre'
];

async function initAdmin() {
  adminKey = checkSession('adminKey');
  if (!adminKey) return;
  setupAutoLock(30);

  appData = await loadData();
  if (!appData || !appData.isSetup) {
    window.location.href = 'index.html';
    return;
  }

  const hash = hashPassword(adminKey);
  if (hash !== appData.adminHash) {
    sessionStorage.clear();
    window.location.href = 'index.html';
    return;
  }

  emergencyPwd = decryptData(appData.encryptedEmergencyPassword, adminKey);
  vaultPwd = decryptData(appData.encryptedVaultPassword, adminKey);
  testamentPwd = decryptData(appData.encryptedTestamentPassword, adminKey);

  if (!emergencyPwd || !vaultPwd || !testamentPwd) {
    showToast('Erreur de déchiffrement', 'error');
    return;
  }

  setupNavigation();
  loadContacts();
  loadSettings();
  initVaultAdmin();
  initTestamentAdmin();
}

function setupNavigation() {
  const tabs = document.querySelectorAll('.menu-item[data-tab]');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
      });
      document.getElementById(targetId).classList.remove('hidden');

      if (targetId === 'testament' && typeof initQuill === 'function') {
        initQuill();
      }
    });
  });
}

function loadContacts() {
  const contacts = decryptData(appData.contacts, adminKey) || [];
  const list = document.getElementById('contactsList');
  list.innerHTML = '';

  if (contacts.length === 0) {
    list.innerHTML = '<div class="text-center text-muted p-4">Aucun contact d\'urgence</div>';
  } else {
    contacts.forEach((c, i) => {
      const row = document.createElement('div');
      row.className = `contact-row imp-${c.importance}`;

      let linksHTML = '';
      if (c.phone) linksHTML += `<a href="tel:${c.phone}" class="link-icon link-phone" title="Téléphone"><i class="fas fa-phone"></i></a>`;
      if (c.email) linksHTML += `<a href="mailto:${c.email}" class="link-icon link-email" title="Email"><i class="fas fa-envelope"></i></a>`;
      if (c.whatsapp) linksHTML += `<a href="https://wa.me/${c.whatsapp.replace(/\D/g,'')}" target="_blank" class="link-icon link-whatsapp" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>`;
      if (c.telegram) linksHTML += `<a href="https://t.me/${c.telegram.replace('@','')}" target="_blank" class="link-icon link-telegram" title="Telegram"><i class="fab fa-telegram"></i></a>`;
      if (c.snapchat) linksHTML += `<a href="https://www.snapchat.com/add/${c.snapchat.replace('@','')}" target="_blank" class="link-icon link-snap" title="Snapchat"><i class="fab fa-snapchat-ghost"></i></a>`;
      if (c.instagram) linksHTML += `<a href="https://www.instagram.com/${c.instagram.replace('@','')}" target="_blank" class="link-icon link-insta" title="Instagram"><i class="fab fa-instagram"></i></a>`;
      if (c.messenger) linksHTML += `<a href="https://m.me/${c.messenger}" target="_blank" class="link-icon link-messenger" title="Messenger"><i class="fab fa-facebook-messenger"></i></a>`;

      row.innerHTML = `
        <div class="contact-info">
          <span class="contact-name">${escapeHtml(c.name)}</span>
          <span class="contact-relation">${escapeHtml(c.relation)}</span>
        </div>
        <div class="contact-links">
          ${linksHTML}
        </div>
        <div class="contact-actions">
          <button class="action-btn edit-btn" onclick="openContactModal(${i})" title="Modifier"><i class="fas fa-pen"></i></button>
          <button class="action-btn delete-btn" onclick="deleteContact(${i})" title="Supprimer"><i class="fas fa-trash"></i></button>
        </div>
      `;
      list.appendChild(row);
    });
  }

  const btn = document.getElementById('addContactBtn');
  if(btn) {
    btn.onclick = () => openContactModal();
  }
}

function openContactModal(index = null) {
  let c = { name: '', relation: '', relationCustom: '', importance: 3, phone: '', email: '', whatsapp: '', telegram: '', snapchat: '', instagram: '', messenger: '', notes: '' };
  let isEdit = false;
  let contacts = decryptData(appData.contacts, adminKey) || [];

  if (index !== null && contacts[index]) {
    c = contacts[index];
    isEdit = true;
    if (!RELATIONS.includes(c.relation)) {
      c.relationCustom = c.relation;
      c.relation = 'Autre';
    }
  }

  let optionsHTML = RELATIONS.map(r => `<option value="${r}" ${r === c.relation ? 'selected' : ''}>${r}</option>`).join('');

  const html = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="m-0 text-xl font-bold">${isEdit ? 'Modifier' : 'Ajouter'} un contact</h2>
      <button class="btn btn-outline" onclick="closeModal()"><i class="fas fa-times"></i></button>
    </div>
    <form id="contactForm" class="flex-col gap-4">
      <div class="form-row">
        <div class="form-group">
          <label>Nom Complet *</label>
          <input type="text" id="cName" class="form-control" value="${escapeHtml(c.name)}" required>
        </div>
        <div class="form-group">
          <label>Relation *</label>
          <select id="cRelation" class="form-control" required>
            ${optionsHTML}
          </select>
          <input type="text" id="cRelationCustom" class="form-control mt-2 ${c.relation === 'Autre' ? '' : 'hidden'}" placeholder="Précisez..." value="${escapeHtml(c.relationCustom)}">
        </div>
      </div>
      <div class="form-group">
        <label>Importance *</label>
        <div class="importance-selector">
          ${[1,2,3,4,5].map(v => `
            <label class="imp-btn" data-value="${v}">
              <input type="radio" name="cImportance" value="${v}" ${c.importance == v ? 'checked' : ''}>
              <span>${v}</span>
            </label>
          `).join('')}
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Téléphone</label>
          <input type="tel" id="cPhone" class="form-control" value="${escapeHtml(c.phone)}">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="cEmail" class="form-control" value="${escapeHtml(c.email)}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>WhatsApp</label>
          <input type="text" id="cWhatsApp" class="form-control" value="${escapeHtml(c.whatsapp)}">
        </div>
        <div class="form-group">
          <label>Telegram</label>
          <input type="text" id="cTelegram" class="form-control" value="${escapeHtml(c.telegram)}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Snapchat</label>
          <input type="text" id="cSnapchat" class="form-control" value="${escapeHtml(c.snapchat)}">
        </div>
        <div class="form-group">
          <label>Instagram</label>
          <input type="text" id="cInstagram" class="form-control" value="${escapeHtml(c.instagram)}">
        </div>
      </div>
      <div class="form-group">
        <label>Messenger</label>
        <input type="text" id="cMessenger" class="form-control" value="${escapeHtml(c.messenger)}">
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea id="cNotes" class="form-control" rows="3">${escapeHtml(c.notes)}</textarea>
      </div>
      <div class="flex justify-between mt-4">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Annuler</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Sauvegarder' : 'Ajouter'}</button>
      </div>
    </form>
  `;

  openModal(html);

  const sel = document.getElementById('cRelation');
  const cust = document.getElementById('cRelationCustom');
  sel.addEventListener('change', () => {
    if (sel.value === 'Autre') {
      cust.classList.remove('hidden');
      cust.required = true;
    } else {
      cust.classList.add('hidden');
      cust.required = false;
      cust.value = '';
    }
  });

  document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    let rel = sel.value;
    if (rel === 'Autre') {
      rel = cust.value.trim();
      if (!rel) {
        showToast('Veuillez préciser la relation', 'error');
        return;
      }
    }

    const newContact = {
      name: document.getElementById('cName').value.trim(),
      relation: rel,
      importance: parseInt(document.querySelector('input[name="cImportance"]:checked').value),
      phone: document.getElementById('cPhone').value.trim(),
      email: document.getElementById('cEmail').value.trim(),
      whatsapp: document.getElementById('cWhatsApp').value.trim(),
      telegram: document.getElementById('cTelegram').value.trim(),
      snapchat: document.getElementById('cSnapchat').value.trim(),
      instagram: document.getElementById('cInstagram').value.trim(),
      messenger: document.getElementById('cMessenger').value.trim(),
      notes: document.getElementById('cNotes').value.trim()
    };

    if (isEdit) {
      contacts[index] = newContact;
    } else {
      contacts.push(newContact);
    }

    appData.contacts = encryptData(contacts, adminKey);
    appData.emergencyContacts = encryptData(contacts, emergencyPwd);

    if (await saveData(appData)) {
      showToast('Contact sauvegardé');
      closeModal();
      loadContacts();
    } else {
      showToast('Erreur lors de la sauvegarde', 'error');
    }
  });
}

async function deleteContact(index) {
  if (await confirmDialog('Voulez-vous vraiment supprimer ce contact ?')) {
    let contacts = decryptData(appData.contacts, adminKey) || [];
    contacts.splice(index, 1);
    appData.contacts = encryptData(contacts, adminKey);
    appData.emergencyContacts = encryptData(contacts, emergencyPwd);
    if (await saveData(appData)) {
      showToast('Contact supprimé');
      loadContacts();
    }
  }
}

function loadSettings() {
  const msgAdmin = document.getElementById('emergencyMessageAdmin');
  if (msgAdmin && appData.emergencyMessage) {
    msgAdmin.value = decryptData(appData.emergencyMessage, adminKey) || '';
  }

  const saveMsgBtn = document.getElementById('saveEmergencyMessageBtn');
  if (saveMsgBtn) {
    saveMsgBtn.onclick = async () => {
      const val = msgAdmin.value;
      appData.emergencyMessage = encryptData(val, adminKey);
      appData.emergencyMessageForEmergency = encryptData(val, emergencyPwd);
      if (await saveData(appData)) {
        showToast('Message sauvegardé');
      } else {
        showToast('Erreur lors de la sauvegarde', 'error');
      }
    };
  }

  const formPwd = document.getElementById('changePwdForm');
  if (formPwd) {
    formPwd.onsubmit = async (e) => {
      e.preventDefault();
      const oldPwd = document.getElementById('oldAdminPwd').value;
      const newAdmin = document.getElementById('newAdminPwd').value;
      const newUrg = document.getElementById('newEmergencyPwd').value;
      const newVlt = document.getElementById('newVaultPwd').value;
      const newTst = document.getElementById('newTestamentPwd').value;

      if (hashPassword(oldPwd) !== appData.adminHash) {
        showToast('Ancien mot de passe incorrect', 'error');
        return;
      }

      const finalAdmin = newAdmin || adminKey;
      const finalUrg = newUrg || emergencyPwd;
      const finalVlt = newVlt || vaultPwd;
      const finalTst = newTst || testamentPwd;

      if (finalAdmin.length < 8 || finalUrg.length < 6 || finalVlt.length < 6 || finalTst.length < 6) {
        showToast('Longueur des mots de passe invalide', 'error');
        return;
      }

      if (new Set([finalAdmin, finalUrg, finalVlt, finalTst]).size !== 4) {
        showToast('Tous les mots de passe doivent être différents', 'error');
        return;
      }

      if (!await confirmDialog('Voulez-vous vraiment modifier les mots de passe ? Tout le coffre sera rechiffré.')) {
        return;
      }

      appData.adminHash = hashPassword(finalAdmin);
      appData.emergencyHash = hashPassword(finalUrg);
      appData.vaultHash = hashPassword(finalVlt);
      appData.testamentHash = hashPassword(finalTst);

      appData.encryptedEmergencyPassword = encryptData(finalUrg, finalAdmin);
      appData.encryptedVaultPassword = encryptData(finalVlt, finalAdmin);
      appData.encryptedTestamentPassword = encryptData(finalTst, finalAdmin);

      const contacts = decryptData(appData.contacts, adminKey) || [];
      appData.contacts = encryptData(contacts, finalAdmin);
      appData.emergencyContacts = encryptData(contacts, finalUrg);

      const vData = decryptData(appData.vaultData, vaultPwd) || [];
      appData.vaultData = encryptData(vData, finalVlt);

      const tData = decryptData(appData.testamentData, testamentPwd) || { identity: {}, content: '', lastModified: null };
      appData.testamentData = encryptData(tData, finalTst);

      const emMsg = decryptData(appData.emergencyMessage, adminKey) || '';
      appData.emergencyMessage = encryptData(emMsg, finalAdmin);
      appData.emergencyMessageForEmergency = encryptData(emMsg, finalUrg);

      const logs = decryptData(appData.accessLogs, adminKey) || [];
      appData.accessLogs = encryptData(logs, finalAdmin);

      if (await saveData(appData)) {
        showToast('Mots de passe mis à jour');
        sessionStorage.setItem('adminKey', finalAdmin);
        setTimeout(() => location.reload(), 1500);
      } else {
        showToast('Erreur lors de la mise à jour', 'error');
      }
    };
  }

  loadLogs();
}

function loadLogs() {
  const logsList = decryptData(appData.accessLogs, adminKey) || [];
  const publicLogs = appData.publicAccessLogs || [];
  const allLogs = [...logsList, ...publicLogs].sort((a,b) => {
    return 0;
  });

  const body = document.getElementById('logsTableBody');
  const count = document.getElementById('logsCount');

  if (body) {
    body.innerHTML = '';
    publicLogs.forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(l.date)}</td>
        <td><span class="badge">${escapeHtml(l.type)}</span></td>
        <td>${escapeHtml(l.nom)}</td>
        <td>${escapeHtml(l.ip)}</td>
      `;
      body.appendChild(tr);
    });
    if (publicLogs.length === 0) {
      body.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Aucun historique récent</td></tr>';
    }
  }
  if (count) {
    count.textContent = publicLogs.length;
  }
}

document.addEventListener('DOMContentLoaded', initAdmin);

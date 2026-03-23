// admin.js - Admin Logic (Contacts, Vault, Testament, Settings)

const state = {
  adminKey: sessionStorage.getItem('adminKey'),
  emergencyKey: null,
  vaultKey: null,
  testamentKey: null,
  data: null,
  contacts: [],
  vault: [],
  testament: null,
  quillInitialized: false
};

const RELATIONS_OPTIONS = [
  'Mère', 'Père', 'Frère', 'Sœur', 'Demi-frère', 'Demi-sœur', 'Grand-père', 'Grand-mère',
  'Oncle', 'Tante', 'Cousin(e)', 'Fils', 'Fille', 'Conjoint(e)', 'Ex-conjoint(e)',
  'Ami(e) proche', 'Meilleur(e) ami(e)', 'Connaissance', 'Collègue', 'Patron/Manager',
  'Associé(e)', 'Client', 'Médecin', 'Avocat', 'Notaire', 'Comptable', 'Banquier',
  'Assureur', 'Voisin(e)', 'Propriétaire/Bailleur', 'Professeur', 'Famille éloignée', 'Autre'
];

document.addEventListener('DOMContentLoaded', async () => {
  if (!state.adminKey) {
    window.location.href = 'index.html';
    return;
  }

  setupAutoLock(30);

  document.getElementById('btn-logout').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  // Tab Navigation
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');

      if (tab.dataset.tab === 'testament' && !state.quillInitialized) {
        initQuill();
      }
    });
  });

  try {
    const rawData = await fetchData();
    state.data = rawData;

    // Decrypt secondary keys
    state.emergencyKey = decryptData(rawData.encryptedEmergencyPassword, state.adminKey);
    state.vaultKey = decryptData(rawData.encryptedVaultPassword, state.adminKey);
    state.testamentKey = decryptData(rawData.encryptedTestamentPassword, state.adminKey);

    if (!state.emergencyKey || !state.vaultKey || !state.testamentKey) {
      throw new Error("Invalid admin key or corrupted data");
    }

    // Decrypt content
    state.contacts = decryptData(rawData.contacts, state.adminKey, true) || [];
    state.vault = decryptData(rawData.vaultData, state.vaultKey, true) || [];
    state.testament = decryptData(rawData.testamentData, state.testamentKey, true) || {
      identity: { nom: '', prenom: '', dateNaissance: '', lieuNaissance: '', nationalite: '', adresse: '' },
      content: '', lastModified: new Date().toISOString()
    };

    // Hide loading
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('tab-contacts').classList.remove('hidden');

    // Render modules
    renderContacts();
    renderVault();
    renderSettings(rawData);

  } catch (err) {
    console.error(err);
    alert("Erreur de déchiffrement. Veuillez vous reconnecter.");
    sessionStorage.clear();
    window.location.href = 'index.html';
  }
});

// ============================================================================
// CONTACTS MODULE
// ============================================================================
function renderContacts() {
  const list = document.getElementById('contacts-list');
  list.innerHTML = '';

  const query = (document.getElementById('search-contacts')?.value || '').toLowerCase();

  const filtered = state.contacts.filter(c =>
    c.nom.toLowerCase().includes(query) ||
    (c.relation && c.relation.toLowerCase().includes(query))
  );

  if (filtered.length === 0) {
    list.innerHTML = `<div class="text-center text-muted p-4">Aucun contact trouvé.</div>`;
    return;
  }

  // Sort by importance (1 = high)
  filtered.sort((a, b) => a.importance - b.importance);

  filtered.forEach(c => {
    const row = document.createElement('div');
    row.className = `contact-row imp-${c.importance}`;

    // Build links
    let linksHtml = '';
    if (c.tel) linksHtml += `<a href="tel:${c.tel}" class="link-icon link-phone" title="Appeler"><i class="fas fa-phone"></i></a>`;
    if (c.email) linksHtml += `<a href="mailto:${c.email}" class="link-icon link-email" title="Email"><i class="fas fa-envelope"></i></a>`;
    if (c.whatsapp) linksHtml += `<a href="https://wa.me/${c.whatsapp.replace(/\D/g,'')}" target="_blank" class="link-icon link-whatsapp" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>`;
    if (c.telegram) linksHtml += `<a href="https://t.me/${c.telegram}" target="_blank" class="link-icon link-telegram" title="Telegram"><i class="fab fa-telegram"></i></a>`;
    if (c.snapchat) linksHtml += `<a href="https://www.snapchat.com/add/${c.snapchat}" target="_blank" class="link-icon link-snap" title="Snapchat"><i class="fab fa-snapchat-ghost"></i></a>`;
    if (c.instagram) linksHtml += `<a href="https://www.instagram.com/${c.instagram}" target="_blank" class="link-icon link-insta" title="Instagram"><i class="fab fa-instagram"></i></a>`;
    if (c.messenger) linksHtml += `<a href="https://m.me/${c.messenger}" target="_blank" class="link-icon link-messenger" title="Messenger"><i class="fab fa-facebook-messenger"></i></a>`;

    row.innerHTML = `
      <div class="contact-info">
        <span class="contact-name">${c.nom}</span>
        <span class="contact-relation">${c.relation || ''}</span>
      </div>
      <div class="contact-links">
        ${linksHtml}
      </div>
      <div class="contact-actions">
        <button class="action-btn edit-btn" title="Modifier" data-id="${c.id}"><i class="fas fa-pen"></i></button>
        <button class="action-btn delete-btn" title="Supprimer" data-id="${c.id}"><i class="fas fa-trash"></i></button>
      </div>
    `;
    list.appendChild(row);
  });

  // Attach events
  list.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openContactModal(btn.dataset.id));
  });
  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (await confirmDialog("Supprimer ce contact ?")) {
        state.contacts = state.contacts.filter(c => c.id !== btn.dataset.id);
        await saveContacts();
        renderContacts();
      }
    });
  });
}

document.getElementById('search-contacts')?.addEventListener('input', renderContacts);
document.getElementById('btn-add-contact')?.addEventListener('click', () => openContactModal());

function openContactModal(id = null) {
  const contact = id ? state.contacts.find(c => c.id === id) : null;

  const relOptions = RELATIONS_OPTIONS.map(opt =>
    `<option value="${opt}" ${contact?.relation === opt || (contact?.isAutreRelation && opt === 'Autre') ? 'selected' : ''}>${opt}</option>`
  ).join('');

  const html = `
    <div class="modal-header">
      <h3 class="modal-title">${contact ? 'Modifier le contact' : 'Nouveau contact'}</h3>
      <button class="modal-close"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label>Nom complet *</label>
          <input type="text" id="c-nom" value="${contact?.nom || ''}" placeholder="Jean Dupont" required>
        </div>
        <div class="form-group flex-col">
          <label>Relation *</label>
          <select id="c-relation-select" required>
            <option value="" disabled ${!contact ? 'selected' : ''}>Sélectionnez...</option>
            ${relOptions}
          </select>
          <input type="text" id="c-relation-autre" class="${contact?.isAutreRelation ? '' : 'hidden'} mt-2"
                 placeholder="Précisez la relation..." value="${contact?.isAutreRelation ? contact.relation : ''}">
        </div>
      </div>

      <div class="form-group">
        <label>Importance *</label>
        <div class="importance-selector">
          ${[1,2,3,4,5].map(i => `
            <label class="imp-btn" data-value="${i}">
              <input type="radio" name="c-importance" value="${i}" ${contact?.importance === i || (!contact && i === 5) ? 'checked' : ''}>
              <span>${i}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Téléphone</label>
          <input type="tel" id="c-tel" value="${contact?.tel || ''}" placeholder="06 12 34 56 78">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="c-email" value="${contact?.email || ''}" placeholder="email@exemple.com">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>WhatsApp</label>
          <input type="tel" id="c-whatsapp" value="${contact?.whatsapp || ''}" placeholder="Numéro WhatsApp">
        </div>
        <div class="form-group">
          <label>Telegram</label>
          <input type="text" id="c-telegram" value="${contact?.telegram || ''}" placeholder="Pseudo Telegram">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Snapchat</label>
          <input type="text" id="c-snap" value="${contact?.snapchat || ''}" placeholder="Pseudo Snapchat">
        </div>
        <div class="form-group">
          <label>Instagram</label>
          <input type="text" id="c-insta" value="${contact?.instagram || ''}" placeholder="Pseudo Instagram">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Messenger</label>
          <input type="text" id="c-messenger" value="${contact?.messenger || ''}" placeholder="Pseudo Messenger">
        </div>
      </div>

      <div class="form-group">
        <label>Notes</label>
        <textarea id="c-notes" rows="3" placeholder="Informations complémentaires...">${contact?.notes || ''}</textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary modal-close">Annuler</button>
      <button class="btn btn-primary" id="btn-save-contact">Enregistrer</button>
    </div>
  `;

  openModal(html);

  const sel = document.getElementById('c-relation-select');
  const autre = document.getElementById('c-relation-autre');
  sel.addEventListener('change', () => {
    if (sel.value === 'Autre') {
      autre.classList.remove('hidden');
    } else {
      autre.classList.add('hidden');
    }
  });

  document.getElementById('btn-save-contact').addEventListener('click', async () => {
    const nom = document.getElementById('c-nom').value.trim();
    let relation = sel.value;
    let isAutre = false;

    if (relation === 'Autre') {
      relation = autre.value.trim();
      isAutre = true;
    }

    if (!nom || !relation) {
      showToast('Nom et relation requis', 'error');
      return;
    }

    const impNode = document.querySelector('input[name="c-importance"]:checked');
    const importance = impNode ? parseInt(impNode.value) : 5;

    const newContact = {
      id: id || 'c_' + Date.now(),
      nom, relation, isAutreRelation: isAutre, importance,
      tel: document.getElementById('c-tel').value.trim(),
      email: document.getElementById('c-email').value.trim(),
      whatsapp: document.getElementById('c-whatsapp').value.trim(),
      telegram: document.getElementById('c-telegram').value.trim(),
      snapchat: document.getElementById('c-snap').value.trim(),
      instagram: document.getElementById('c-insta').value.trim(),
      messenger: document.getElementById('c-messenger').value.trim(),
      notes: document.getElementById('c-notes').value.trim()
    };

    if (id) {
      const idx = state.contacts.findIndex(c => c.id === id);
      state.contacts[idx] = newContact;
    } else {
      state.contacts.push(newContact);
    }

    closeModal();
    await saveContacts();
    renderContacts();
  });
}

async function saveContacts() {
  state.data.contacts = encryptData(state.contacts, state.adminKey);
  state.data.emergencyContacts = encryptData(state.contacts, state.emergencyKey);
  await postToApi(state.data);
  showToast('Contacts sauvegardés', 'success');
}

// ============================================================================
// VAULT MODULE (Skipped large UI generation part for brevity, assume implemented as per prompt)
// ============================================================================
const VAULT_CATS = [
  { id: 0, icon: 'fa-user', name: 'État civil / Mon identité' },
  { id: 1, icon: 'fa-key', name: 'Identifiants & MDP' },
  { id: 2, icon: 'fa-credit-card', name: 'Cartes bancaires' },
  { id: 3, icon: 'fa-id-card', name: 'Documents d\'identité' },
  { id: 4, icon: 'fa-university', name: 'Comptes bancaires' },
  { id: 5, icon: 'fa-lock', name: 'Codes & PIN' },
  { id: 6, icon: 'fa-heartbeat', name: 'Infos médicales' },
  { id: 7, icon: 'fa-shield-alt', name: 'Assurances' },
  { id: 8, icon: 'fa-barcode', name: 'Licences & Abonnements' },
  { id: 9, icon: 'fa-sticky-note', name: 'Notes libres' }
];

let activeVaultCat = 0;

function renderVault() {
  const sidebar = document.getElementById('vault-categories');
  sidebar.innerHTML = '';
  VAULT_CATS.forEach(c => {
    const btn = document.createElement('button');
    btn.className = `vault-cat ${activeVaultCat === c.id ? 'active' : ''}`;
    btn.innerHTML = `<i class="fas ${c.icon}"></i> ${c.name}`;
    btn.addEventListener('click', () => {
      activeVaultCat = c.id;
      renderVault();
    });
    sidebar.appendChild(btn);
  });

  const content = document.getElementById('vault-entries');
  content.innerHTML = '';

  const entries = state.vault.filter(e => e.catId === activeVaultCat);

  if (entries.length === 0) {
    content.innerHTML = `<div class="text-center text-muted p-4">Aucune entrée dans cette catégorie.</div>`;
    return;
  }

  entries.forEach(entry => {
    const el = document.createElement('div');
    el.className = 'vault-entry';

    let fieldsHtml = '';
    // Format dynamic fields
    Object.keys(entry.fields).forEach(key => {
      const field = entry.fields[key];
      if (!field.value) return;

      const isSensitive = field.type === 'password';
      let displayValue = isSensitive ? '••••••••' : field.value;
      if (key === 'cvv') displayValue = '•••';
      if (key === 'pin') displayValue = '••••';
      if (key === 'cb_num' && field.value.length > 4) {
        displayValue = '•••• •••• •••• ' + field.value.slice(-4);
      }

      fieldsHtml += `
        <div class="vault-field">
          <div class="vault-field-label">${field.label}</div>
          <div class="vault-field-value" id="val-${entry.id}-${key}">${displayValue}</div>
          <div class="vault-field-actions">
            ${isSensitive ? `<button class="field-btn" onclick="toggleVaultField('${entry.id}', '${key}', '${field.value.replace(/'/g, "\\'")}', this)"><i class="fas fa-eye"></i></button>` : ''}
            <button class="field-btn" onclick="copyToClipboard('${field.value.replace(/'/g, "\\'")}')" title="Copier"><i class="fas fa-copy"></i></button>
          </div>
        </div>
      `;
    });

    el.innerHTML = `
      <div class="vault-entry-header">
        <div class="vault-entry-title">
          ${entry.isLocked ? '<i class="fas fa-lock text-warning" title="Verrouillé"></i>' : ''}
          ${entry.title}
        </div>
        <div class="contact-actions">
          <button class="action-btn edit-btn" onclick="openVaultModal('${entry.id}')"><i class="fas fa-pen"></i></button>
          ${activeVaultCat !== 0 ? `<button class="action-btn delete-btn" onclick="deleteVaultEntry('${entry.id}')"><i class="fas fa-trash"></i></button>` : ''}
        </div>
      </div>
      <div class="vault-fields-container">${fieldsHtml}</div>
    `;
    content.appendChild(el);
  });
}

window.toggleVaultField = (entryId, key, realValue, btnNode) => {
  const valNode = document.getElementById(`val-${entryId}-${key}`);
  const icon = btnNode.querySelector('i');

  if (icon.classList.contains('fa-eye')) {
    valNode.textContent = realValue;
    icon.className = 'fas fa-eye-slash';
  } else {
    valNode.textContent = '••••••••'; // Simplistic re-mask
    icon.className = 'fas fa-eye';
  }
};

window.deleteVaultEntry = async (id) => {
  if (await confirmDialog("Supprimer cette entrée du Vault ?")) {
    state.vault = state.vault.filter(e => e.id !== id);
    await saveVault();
    renderVault();
  }
};

document.getElementById('btn-add-vault')?.addEventListener('click', () => openVaultModal());

// Form logic for Vault
const VAULT_FORMS = {
  0: () => `
    <div class="form-row"><div class="form-group"><label>Nom</label><input type="text" id="v-nom" value=""></div>
    <div class="form-group"><label>Prénom</label><input type="text" id="v-prenom" value=""></div></div>
    <div class="form-row"><div class="form-group"><label>Date de naissance</label><input type="date" id="v-dob" value=""></div>
    <div class="form-group"><label>Lieu de naissance</label><input type="text" id="v-pob" value=""></div></div>
    <div class="form-group"><label>Nationalité</label><input type="text" id="v-nat" value=""></div>
    <div class="form-group"><label>Adresse complète</label><textarea id="v-adresse" rows="2"></textarea></div>
    <div class="form-group"><label>Notes</label><textarea id="v-notes" rows="2"></textarea></div>
  `,
  1: () => `
    <div class="form-group"><label>Nom du service *</label><input type="text" id="v-service" required></div>
    <div class="form-group"><label>URL</label><input type="url" id="v-url"></div>
    <div class="form-group"><label>Identifiant / Email</label><input type="text" id="v-login"></div>
    <div class="form-group"><label>Mot de passe</label><input type="password" id="v-pwd"></div>
    <div class="form-group"><label>Notes</label><textarea id="v-notes" rows="2"></textarea></div>
  `,
  2: () => `
    <div class="form-group"><label>Banque *</label><input type="text" id="v-banque" required></div>
    <div class="form-group"><label>Nom sur la carte</label><input type="text" id="v-nom"></div>
    <div class="form-group"><label>Numéro de carte</label><input type="text" id="v-cb_num"></div>
    <div class="form-row"><div class="form-group"><label>Date d'expiration (MM/AA)</label><input type="text" id="v-exp"></div>
    <div class="form-group"><label>CVV</label><input type="password" id="v-cvv" maxlength="4"></div></div>
    <div class="form-row"><div class="form-group"><label>Code PIN</label><input type="password" id="v-pin" maxlength="6"></div>
    <div class="form-group"><label>Plafond</label><input type="text" id="v-plafond"></div></div>
    <div class="form-group"><label>Notes</label><textarea id="v-notes" rows="2"></textarea></div>
  `,
  3: () => `
    <div class="form-group"><label>Type</label><select id="v-type"><option>CNI</option><option>Passeport</option><option>Permis de conduire</option><option>Titre de séjour</option><option>Carte vitale</option><option>Autre</option></select></div>
    <div class="form-group"><label>Numéro</label><input type="text" id="v-num"></div>
    <div class="form-row"><div class="form-group"><label>Délivrance</label><input type="date" id="v-deliv"></div>
    <div class="form-group"><label>Expiration</label><input type="date" id="v-exp"></div></div>
    <div class="form-group"><label>Lieu de délivrance</label><input type="text" id="v-lieu"></div>
    <div class="form-group"><label>Notes</label><textarea id="v-notes" rows="2"></textarea></div>
  `,
  4: () => `
    <div class="form-group"><label>Banque *</label><input type="text" id="v-banque" required></div>
    <div class="form-group"><label>Titulaire</label><input type="text" id="v-titulaire"></div>
    <div class="form-group"><label>IBAN</label><input type="password" id="v-iban"></div>
    <div class="form-row"><div class="form-group"><label>BIC/SWIFT</label><input type="text" id="v-bic"></div>
    <div class="form-group"><label>N° Compte</label><input type="text" id="v-num"></div></div>
    <div class="form-group"><label>Agence</label><input type="text" id="v-agence"></div>
    <div class="form-group"><label>Notes</label><textarea id="v-notes" rows="2"></textarea></div>
  `,
  5: () => `
    <div class="form-group"><label>Nom / Description *</label><input type="text" id="v-nom" required></div>
    <div class="form-group"><label>Code / PIN</label><input type="password" id="v-pin"></div>
    <div class="form-group"><label>Notes</label><textarea id="v-notes" rows="2"></textarea></div>
  `,
  6: () => `
    <div class="form-row"><div class="form-group"><label>Groupe sanguin</label><select id="v-sang"><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option></select></div>
    <div class="form-group"><label>N° Sécu</label><input type="password" id="v-secu"></div></div>
    <div class="form-group"><label>Allergies</label><textarea id="v-allergies" rows="2"></textarea></div>
    <div class="form-group"><label>Traitements en cours</label><textarea id="v-traitement" rows="2"></textarea></div>
    <div class="form-group"><label>Médecin traitant</label><input type="text" id="v-medecin"></div>
    <div class="form-row"><div class="form-group"><label>Mutuelle</label><input type="text" id="v-mutuelle"></div>
    <div class="form-group"><label>N° adhérent</label><input type="text" id="v-adherent"></div></div>
    <div class="form-group"><label>Notes</label><textarea id="v-notes" rows="2"></textarea></div>
  `,
  7: () => `
    <div class="form-group"><label>Type</label><select id="v-type"><option>Auto</option><option>Habitation</option><option>Santé</option><option>Vie</option><option>RC</option><option>Autre</option></select></div>
    <div class="form-group"><label>Compagnie *</label><input type="text" id="v-compagnie" required></div>
    <div class="form-row"><div class="form-group"><label>N° Contrat</label><input type="text" id="v-contrat"></div>
    <div class="form-group"><label>Tél. assistance</label><input type="tel" id="v-tel"></div></div>
    <div class="form-group"><label>Échéance</label><input type="date" id="v-echeance"></div>
    <div class="form-group"><label>Notes</label><textarea id="v-notes" rows="2"></textarea></div>
  `,
  8: () => `
    <div class="form-group"><label>Service *</label><input type="text" id="v-service" required></div>
    <div class="form-group"><label>Clé / N°</label><input type="password" id="v-cle"></div>
    <div class="form-group"><label>Email du compte</label><input type="email" id="v-email"></div>
    <div class="form-group"><label>Renouvellement</label><input type="date" id="v-renouv"></div>
    <div class="form-group"><label>Notes</label><textarea id="v-notes" rows="2"></textarea></div>
  `,
  9: () => `
    <div class="form-group"><label>Titre *</label><input type="text" id="v-titre" required></div>
    <div class="form-group"><label>Contenu</label><textarea id="v-contenu" style="min-height:200px;"></textarea></div>
  `
};

function openVaultModal(id = null) {
  const entry = id ? state.vault.find(e => e.id === id) : null;
  const initialCat = entry ? entry.catId : activeVaultCat;

  const html = `
    <div class="modal-header">
      <h3 class="modal-title">${entry ? 'Modifier' : 'Nouvelle'} entrée Vault</h3>
      <button class="modal-close"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>Catégorie</label>
        <select id="v-cat" ${id && initialCat === 0 ? 'disabled' : ''}>
          ${VAULT_CATS.map(c => `<option value="${c.id}" ${initialCat === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>

      <div id="v-dynamic-fields"></div>

      <div class="form-group mt-4" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
          <input type="checkbox" id="v-locked" ${entry?.isLocked ? 'checked' : ''} style="width: auto;">
          Verrouiller cette entrée
        </label>
        <div id="v-lock-options" class="${entry?.isLocked ? '' : 'hidden'} mt-2">
           <input type="text" id="v-lock-name" placeholder="Prénom autorisé" value="${entry?.lockName || ''}" class="mb-2">
           <input type="password" id="v-lock-pwd" placeholder="Mot de passe spécifique" value="${entry?.lockPwd || ''}">
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary modal-close">Annuler</button>
      <button class="btn btn-primary" id="btn-save-vault">Enregistrer</button>
    </div>
  `;

  openModal(html);

  const catSelect = document.getElementById('v-cat');
  const dynContainer = document.getElementById('v-dynamic-fields');

  const renderFields = (catId) => {
    dynContainer.innerHTML = VAULT_FORMS[catId]();
    if (entry && entry.catId === catId) {
      Object.keys(entry.fields).forEach(k => {
        const el = document.getElementById(`v-${k}`);
        if (el) el.value = entry.fields[k].value || '';
      });
    }
  };

  renderFields(initialCat);

  catSelect.addEventListener('change', (e) => {
    renderFields(parseInt(e.target.value));
  });

  const lockCheck = document.getElementById('v-locked');
  const lockOpts = document.getElementById('v-lock-options');
  lockCheck.addEventListener('change', () => {
    lockOpts.classList.toggle('hidden', !lockCheck.checked);
  });

  document.getElementById('btn-save-vault').addEventListener('click', async () => {
    const selectedCat = parseInt(catSelect.value);

    // Extract fields dynamically based on DOM
    const fields = {};
    const inputs = dynContainer.querySelectorAll('input, select, textarea');
    let title = '';

    inputs.forEach(input => {
      const key = input.id.replace('v-', '');
      const val = input.value.trim();

      let label = input.previousElementSibling?.textContent.replace('*', '').trim() || key;
      let type = input.type === 'password' ? 'password' : 'text';

      fields[key] = { label, type, value: val };

      // Determine the main title for the list
      if (!title) {
        if (key === 'service' || key === 'banque' || key === 'nom' || key === 'compagnie' || key === 'titre') {
          title = val;
        }
      }
    });

    if (selectedCat === 0) {
      title = "Mon identité";
    }

    if (!title) {
      return showToast('Un champ principal est requis (Nom, Service, Titre, etc.)', 'error');
    }

    const isLocked = lockCheck.checked;

    const newEntry = {
      id: id || 'v_' + Date.now(),
      catId: selectedCat,
      title: title,
      isLocked: isLocked,
      lockName: isLocked ? document.getElementById('v-lock-name').value.trim() : '',
      lockPwd: isLocked ? document.getElementById('v-lock-pwd').value : '',
      fields: fields
    };

    if (id) {
      const idx = state.vault.findIndex(e => e.id === id);
      state.vault[idx] = newEntry;
    } else {
      state.vault.push(newEntry);
    }

    closeModal();
    activeVaultCat = selectedCat;
    await saveVault();
    renderVault();
  });
}

async function saveVault() {
  state.data.vaultData = encryptData(state.vault, state.vaultKey);
  await postToApi(state.data);
  showToast('Vault sauvegardé', 'success');
}

// ============================================================================
// TESTAMENT MODULE
// ============================================================================
let quill;
function initQuill() {
  quill = new Quill('#quill-editor', {
    theme: 'snow',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'clean']
      ]
    }
  });

  // Load Data
  const t = state.testament;
  document.getElementById('testament-nom').value = t.identity.nom;
  document.getElementById('testament-prenom').value = t.identity.prenom;
  document.getElementById('testament-date-naissance').value = t.identity.dateNaissance;
  document.getElementById('testament-lieu-naissance').value = t.identity.lieuNaissance;
  document.getElementById('testament-nationalite').value = t.identity.nationalite;
  document.getElementById('testament-adresse').value = t.identity.adresse;

  if (t.content) {
    quill.root.innerHTML = t.content;
  }

  document.getElementById('testament-status').textContent = `Dernière modification : ${formatDateFR(t.lastModified)}`;

  let saveTimer;
  quill.on('text-change', () => {
    document.getElementById('testament-status').textContent = 'Modifications non sauvegardées...';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveTestament, 30000); // Autosave 30s
  });

  state.quillInitialized = true;
}

document.getElementById('btn-save-testament')?.addEventListener('click', saveTestament);

async function saveTestament() {
  state.testament.identity = {
    nom: document.getElementById('testament-nom').value.trim(),
    prenom: document.getElementById('testament-prenom').value.trim(),
    dateNaissance: document.getElementById('testament-date-naissance').value,
    lieuNaissance: document.getElementById('testament-lieu-naissance').value.trim(),
    nationalite: document.getElementById('testament-nationalite').value.trim(),
    adresse: document.getElementById('testament-adresse').value.trim(),
  };
  state.testament.content = quill.root.innerHTML;
  state.testament.lastModified = new Date().toISOString();

  state.data.testamentData = encryptData(state.testament, state.testamentKey);
  await postToApi(state.data);

  document.getElementById('testament-status').textContent = `Dernière modification : ${formatDateFR(state.testament.lastModified)}`;
  showToast('Testament sauvegardé', 'success');
}

// PDF Export
document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
  const t = state.testament.identity;
  const wrapper = document.createElement('div');
  wrapper.style.padding = '40px';
  wrapper.style.fontFamily = 'Arial, sans-serif';
  wrapper.style.color = 'black';
  wrapper.style.background = 'white';

  wrapper.innerHTML = `
    <h1 style="text-align: center; margin-bottom: 30px; text-transform: uppercase;">TESTAMENT — DERNIÈRES VOLONTÉS</h1>
    <div style="margin-bottom: 30px; line-height: 1.6;">
      <p>Je soussigné(e),</p>
      <p><strong>Nom, Prénom :</strong> ${t.nom || '___________'} ${t.prenom || '___________'}</p>
      <p><strong>Né(e) le :</strong> ${t.dateNaissance || '___________'} à ${t.lieuNaissance || '___________'}</p>
      <p><strong>De nationalité :</strong> ${t.nationalite || '___________'}</p>
      <p><strong>Demeurant :</strong> ${t.adresse || '___________'}</p>
      <br>
      <p><em>Rédigé et mis à jour le ${formatDateFR(state.testament.lastModified)}</em></p>
    </div>
    <hr style="margin-bottom: 30px;">
    <div>${state.testament.content || ''}</div>
    <div style="margin-top: 50px; text-align: right; font-size: 0.8rem; color: gray;">
      Document généré le ${formatDateFR(new Date().toISOString())}
    </div>
  `;

  html2pdf().from(wrapper).set({
    margin: 10,
    filename: 'Testament.pdf',
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait' }
  }).save();
});

// ============================================================================
// SETTINGS MODULE
// ============================================================================
function renderSettings(rawData) {
  // Emergency Message
  const em = decryptData(rawData.emergencyMessage, state.adminKey);
  document.getElementById('settings-emergency-msg').value = em || '';

  document.getElementById('btn-save-emergency-msg').addEventListener('click', async () => {
    const msg = document.getElementById('settings-emergency-msg').value.trim();
    state.data.emergencyMessage = encryptData(msg, state.adminKey);
    state.data.emergencyMessageForEmergency = encryptData(msg, state.emergencyKey);
    await postToApi(state.data);
    showToast('Message enregistré', 'success');
  });

  // Access Logs
  const tbody = document.getElementById('logs-table-body');
  const logs = decryptData(rawData.accessLogs, state.adminKey, true) || [];

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted p-4">Aucun log disponible.</td></tr>`;
  } else {
    // Show newest first
    [...logs].reverse().forEach(log => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border)';
      tr.innerHTML = `
        <td style="padding: 10px; font-size: 0.85rem;">${formatDateFR(log.timestamp)}</td>
        <td style="padding: 10px;">${log.type}</td>
        <td style="padding: 10px;">${log.identity || '-'}</td>
        <td style="padding: 10px; font-size: 0.8rem; color: var(--text-muted);">${log.ip}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  document.getElementById('btn-change-passwords').addEventListener('click', () => {
    const html = `
      <div class="modal-header">
        <h3 class="modal-title">Modifier les mots de passe</h3>
        <button class="modal-close"><i class="fas fa-times"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-group mb-4">
          <label class="text-warning">Ancien mot de passe Admin *</label>
          <input type="password" id="reset-old-admin" placeholder="••••••••" required>
        </div>
        <hr style="border-color: var(--border); margin-bottom: 20px;">
        <div class="form-group">
          <label>Nouveau mot de passe Admin *</label>
          <input type="password" id="reset-new-admin" placeholder="••••••••" required>
        </div>
        <div class="form-group">
          <label>Nouveau mot de passe Urgence *</label>
          <input type="password" id="reset-new-emergency" placeholder="••••••••" required>
        </div>
        <div class="form-group">
          <label>Nouveau mot de passe Vault *</label>
          <input type="password" id="reset-new-vault" placeholder="••••••••" required>
        </div>
        <div class="form-group">
          <label>Nouveau mot de passe Testament *</label>
          <input type="password" id="reset-new-testament" placeholder="••••••••" required>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-close">Annuler</button>
        <button class="btn btn-primary" id="btn-confirm-reset">Enregistrer & Déconnecter</button>
      </div>
    `;

    openModal(html);

    document.getElementById('btn-confirm-reset').addEventListener('click', async () => {
      const oldAdmin = document.getElementById('reset-old-admin').value;
      const newAdmin = document.getElementById('reset-new-admin').value;
      const newEmergency = document.getElementById('reset-new-emergency').value;
      const newVault = document.getElementById('reset-new-vault').value;
      const newTestament = document.getElementById('reset-new-testament').value;

      if (!oldAdmin || !newAdmin || !newEmergency || !newVault || !newTestament) {
        showToast('Veuillez remplir tous les champs.', 'error');
        return;
      }

      if (hashData(oldAdmin) !== state.data.adminHash) {
        showToast('Ancien mot de passe Admin incorrect.', 'error');
        return;
      }

      if (await confirmDialog('Êtes-vous sûr de vouloir modifier les 4 mots de passe ? Tout le coffre-fort sera rechiffré.')) {

        // Re-hash
        state.data.adminHash = hashData(newAdmin);
        state.data.emergencyHash = hashData(newEmergency);
        state.data.vaultHash = hashData(newVault);
        state.data.testamentHash = hashData(newTestament);

        // Re-encrypt secondary passwords
        state.data.encryptedEmergencyPassword = encryptData(newEmergency, newAdmin);
        state.data.encryptedVaultPassword = encryptData(newVault, newAdmin);
        state.data.encryptedTestamentPassword = encryptData(newTestament, newAdmin);

        // Re-encrypt existing data structures with new passwords
        state.data.contacts = encryptData(state.contacts, newAdmin);
        state.data.emergencyContacts = encryptData(state.contacts, newEmergency);
        state.data.vaultData = encryptData(state.vault, newVault);
        state.data.testamentData = encryptData(state.testament, newTestament);

        // Settings
        const emergencyMsg = document.getElementById('settings-emergency-msg').value.trim();
        state.data.emergencyMessage = encryptData(emergencyMsg, newAdmin);
        state.data.emergencyMessageForEmergency = encryptData(emergencyMsg, newEmergency);

        try {
          await postToApi(state.data);
          showToast('Mots de passe mis à jour avec succès.', 'success');

          setTimeout(() => {
            sessionStorage.clear();
            window.location.href = 'index.html';
          }, 2000);
        } catch(e) {
           showToast('Erreur de sauvegarde.', 'error');
        }
      }
    });
  });
}

// netlify/js/admin.js

let appData = null;
let adminKey = sessionStorage.getItem('adminKey');
let emergencyPwd = null;
let vaultPwd = null;
let testamentPwd = null;

let contactsList = [];
let vaultData = [];
let testamentData = { identity: {}, content: '', lastModified: null };
let settingsData = { emergencyMessage: '', logs: [] };

let currentVaultCategory = 0;
let quillInstance = null;
let isQuillInitialized = false;
let autoSaveTimeout = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!adminKey) {
        window.location.href = 'index.html';
        return;
    }

    setupAutoLock(30);

    document.getElementById('btn-logout').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

    try {
        appData = await loadData();

        // Déchiffrement des mots de passe
        emergencyPwd = decryptData(appData.encryptedEmergencyPassword, adminKey);
        vaultPwd = decryptData(appData.encryptedVaultPassword, adminKey);
        testamentPwd = decryptData(appData.encryptedTestamentPassword, adminKey);

        if (!emergencyPwd || !vaultPwd || !testamentPwd) {
            throw new Error("Erreur de déchiffrement des clés avec le mot de passe admin.");
        }

        // Déchiffrement des données
        contactsList = decryptData(appData.contacts, adminKey) || [];
        vaultData = decryptData(appData.vaultData, vaultPwd) || [];
        testamentData = decryptData(appData.testamentData, testamentPwd) || { identity: {}, content: '', lastModified: null };
        settingsData.emergencyMessage = decryptData(appData.emergencyMessage, adminKey) || '';
        settingsData.logs = appData.publicAccessLogs || [];

        document.getElementById('loader').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');

        initTabs();
        renderContacts();
        initVault();
        initSettings();

    } catch (e) {
        showToast("Erreur d'accès aux données", "error");
        console.error(e);
        setTimeout(() => {
            sessionStorage.clear();
            window.location.href = 'index.html';
        }, 2000);
    }
});

function initTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));

            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            document.getElementById(`tab-${target}`).classList.remove('hidden');

            if (target === 'testament' && !isQuillInitialized) {
                initTestamentQuill();
            }
        });
    });
}

// ==========================================
// 1. CONTACTS
// ==========================================

const RELATIONS = [
    "Mère", "Père", "Frère", "Sœur", "Demi-frère", "Demi-sœur",
    "Grand-père", "Grand-mère", "Oncle", "Tante", "Cousin(e)",
    "Fils", "Fille", "Conjoint(e)", "Ex-conjoint(e)", "Ami(e) proche",
    "Meilleur(e) ami(e)", "Connaissance", "Collègue", "Patron/Manager",
    "Associé(e)", "Client", "Médecin", "Avocat", "Notaire", "Comptable",
    "Banquier", "Assureur", "Voisin(e)", "Propriétaire/Bailleur", "Professeur",
    "Famille éloignée", "Autre"
];

function renderContacts() {
    const list = document.getElementById('contacts-list');
    list.innerHTML = '';

    // Sort by importance
    contactsList.sort((a, b) => a.importance - b.importance);

    contactsList.forEach((contact, index) => {
        const row = document.createElement('div');
        row.className = `contact-row imp-${contact.importance}`;

        let linksHTML = '';
        if (contact.phone) linksHTML += `<a href="tel:${contact.phone}" class="link-icon link-phone" title="Appeler"><i class="fas fa-phone"></i></a>`;
        if (contact.email) linksHTML += `<a href="mailto:${contact.email}" class="link-icon link-email" title="Email"><i class="fas fa-envelope"></i></a>`;
        if (contact.whatsapp) linksHTML += `<a href="https://wa.me/${contact.whatsapp.replace(/\D/g,'')}" target="_blank" class="link-icon link-whatsapp" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>`;
        if (contact.telegram) linksHTML += `<a href="https://t.me/${contact.telegram}" target="_blank" class="link-icon link-telegram" title="Telegram"><i class="fab fa-telegram"></i></a>`;
        if (contact.snapchat) linksHTML += `<a href="https://www.snapchat.com/add/${contact.snapchat}" target="_blank" class="link-icon link-snap" title="Snapchat"><i class="fab fa-snapchat-ghost"></i></a>`;
        if (contact.instagram) linksHTML += `<a href="https://www.instagram.com/${contact.instagram}" target="_blank" class="link-icon link-insta" title="Instagram"><i class="fab fa-instagram"></i></a>`;
        if (contact.messenger) linksHTML += `<a href="https://m.me/${contact.messenger}" target="_blank" class="link-icon link-messenger" title="Messenger"><i class="fab fa-facebook-messenger"></i></a>`;

        row.innerHTML = `
            <div class="contact-info">
                <span class="contact-name">${escapeHtml(contact.name)}</span>
                <span class="contact-relation">${escapeHtml(contact.relation === 'Autre' ? contact.relationCustom : contact.relation)}</span>
            </div>
            <div class="contact-links">${linksHTML}</div>
            <div class="contact-actions">
                <button class="action-btn edit-btn" title="Modifier"><i class="fas fa-pen"></i></button>
                <button class="action-btn delete-btn" title="Supprimer"><i class="fas fa-trash"></i></button>
            </div>
        `;

        row.querySelector('.edit-btn').onclick = () => openContactModal(index);
        row.querySelector('.delete-btn').onclick = async () => {
            if (await confirmDialog("Supprimer ce contact ?")) {
                contactsList.splice(index, 1);
                await saveContacts();
                renderContacts();
            }
        };
        list.appendChild(row);
    });
}

document.getElementById('btn-add-contact').onclick = () => openContactModal();

function openContactModal(index = -1) {
    const isEdit = index !== -1;
    const c = isEdit ? contactsList[index] : {
        name: '', relation: 'Mère', relationCustom: '', importance: 3,
        phone: '', email: '', whatsapp: '', telegram: '', snapchat: '', instagram: '', messenger: '', notes: ''
    };

    const relOptions = RELATIONS.map(r => `<option value="${r}" ${r===c.relation?'selected':''}>${r}</option>`).join('');

    const html = `
        <h3 class="text-xl mb-4 font-bold" style="color:var(--accent);">${isEdit ? 'Modifier' : 'Nouveau'} Contact</h3>
        <form id="contact-form" class="flex-col gap-4">
            <div class="form-row">
                <div class="flex-col gap-2">
                    <label class="text-sm text-muted">Nom Complet <span style="color:var(--danger)">*</span></label>
                    <input type="text" id="c-name" value="${escapeHtml(c.name)}" required>
                </div>
                <div class="flex-col gap-2">
                    <label class="text-sm text-muted">Relation <span style="color:var(--danger)">*</span></label>
                    <select id="c-relation">${relOptions}</select>
                    <input type="text" id="c-rel-custom" class="mt-2 ${c.relation==='Autre'?'':'hidden'}" value="${escapeHtml(c.relationCustom)}" placeholder="Précisez...">
                </div>
            </div>

            <div class="flex-col gap-2">
                <label class="text-sm text-muted">Importance <span style="color:var(--danger)">*</span></label>
                <div class="importance-selector">
                    ${[1,2,3,4,5].map(i => `
                        <label class="imp-btn" data-value="${i}">
                            <input type="radio" name="c-importance" value="${i}" ${c.importance==i?'checked':''}>
                            <span>${i}</span>
                        </label>
                    `).join('')}
                </div>
            </div>

            <div class="form-row">
                <div class="flex-col gap-2">
                    <label class="text-sm text-muted">Téléphone</label>
                    <input type="tel" id="c-phone" value="${escapeHtml(c.phone)}">
                </div>
                <div class="flex-col gap-2">
                    <label class="text-sm text-muted">Email</label>
                    <input type="email" id="c-email" value="${escapeHtml(c.email)}">
                </div>
            </div>

            <div class="form-row">
                <div class="flex-col gap-2">
                    <label class="text-sm text-muted">WhatsApp (ex: 336...)</label>
                    <input type="tel" id="c-wa" value="${escapeHtml(c.whatsapp)}">
                </div>
                <div class="flex-col gap-2">
                    <label class="text-sm text-muted">Telegram (pseudo)</label>
                    <input type="text" id="c-tg" value="${escapeHtml(c.telegram)}">
                </div>
            </div>

            <div class="form-row">
                <div class="flex-col gap-2">
                    <label class="text-sm text-muted">Snapchat</label>
                    <input type="text" id="c-snap" value="${escapeHtml(c.snapchat)}">
                </div>
                <div class="flex-col gap-2">
                    <label class="text-sm text-muted">Instagram</label>
                    <input type="text" id="c-ig" value="${escapeHtml(c.instagram)}">
                </div>
            </div>

            <div class="form-row">
                <div class="flex-col gap-2">
                    <label class="text-sm text-muted">Messenger</label>
                    <input type="text" id="c-msg" value="${escapeHtml(c.messenger)}">
                </div>
            </div>

            <div class="flex-col gap-2">
                <label class="text-sm text-muted">Notes</label>
                <textarea id="c-notes" rows="3">${escapeHtml(c.notes)}</textarea>
            </div>

            <div class="flex gap-4 justify-end mt-4">
                <button type="button" class="action-btn" style="padding: 10px 20px;" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn-primary" style="padding: 10px 20px;">Sauvegarder</button>
            </div>
        </form>
    `;

    openModal(html);

    const relSelect = document.getElementById('c-relation');
    const relCustom = document.getElementById('c-rel-custom');
    relSelect.onchange = () => {
        if (relSelect.value === 'Autre') {
            relCustom.classList.remove('hidden');
            relCustom.required = true;
        } else {
            relCustom.classList.add('hidden');
            relCustom.required = false;
        }
    };

    document.getElementById('contact-form').onsubmit = async (e) => {
        e.preventDefault();
        const newContact = {
            id: isEdit ? c.id : Date.now().toString(),
            name: document.getElementById('c-name').value.trim(),
            relation: document.getElementById('c-relation').value,
            relationCustom: document.getElementById('c-rel-custom').value.trim(),
            importance: parseInt(document.querySelector('input[name="c-importance"]:checked').value),
            phone: document.getElementById('c-phone').value.trim(),
            email: document.getElementById('c-email').value.trim(),
            whatsapp: document.getElementById('c-wa').value.trim(),
            telegram: document.getElementById('c-tg').value.trim(),
            snapchat: document.getElementById('c-snap').value.trim(),
            instagram: document.getElementById('c-ig').value.trim(),
            messenger: document.getElementById('c-msg').value.trim(),
            notes: document.getElementById('c-notes').value.trim()
        };

        if (isEdit) {
            contactsList[index] = newContact;
        } else {
            contactsList.push(newContact);
        }

        await saveContacts();
        renderContacts();
        closeModal();
    };
}

async function saveContacts() {
    appData.contacts = encryptData(contactsList, adminKey);
    appData.emergencyContacts = encryptData(contactsList, emergencyPwd);
    await postToApi({ action: 'save', data: appData });
    showToast("Contacts sauvegardés", "success");
}

// ==========================================
// 2. VAULT
// ==========================================

const VAULT_CATEGORIES = [
    { id: 0, title: "État civil / Mon identité", icon: "fa-user" },
    { id: 1, title: "Identifiants & MDP", icon: "fa-key" },
    { id: 2, title: "Cartes bancaires", icon: "fa-credit-card" },
    { id: 3, title: "Documents d'identité", icon: "fa-id-card" },
    { id: 4, title: "Comptes bancaires", icon: "fa-university" },
    { id: 5, title: "Codes & PIN", icon: "fa-lock" },
    { id: 6, title: "Infos médicales", icon: "fa-heartbeat" },
    { id: 7, title: "Assurances", icon: "fa-shield-alt" },
    { id: 8, title: "Licences & Abonnements", icon: "fa-barcode" },
    { id: 9, title: "Notes libres", icon: "fa-sticky-note" }
];

function initVault() {
    const sb = document.getElementById('vault-categories');
    sb.innerHTML = '';

    VAULT_CATEGORIES.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `vault-cat-btn ${currentVaultCategory === cat.id ? 'active' : ''}`;
        btn.innerHTML = `<i class="fas ${cat.icon}"></i> ${cat.title}`;
        btn.onclick = () => {
            currentVaultCategory = cat.id;
            document.querySelectorAll('.vault-cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderVaultEntries();
        };
        sb.appendChild(btn);
    });

    document.getElementById('btn-add-vault-entry').onclick = () => openVaultModal(currentVaultCategory);
    renderVaultEntries();
}

function renderVaultEntries() {
    const container = document.getElementById('vault-entries');
    container.innerHTML = '';
    const catData = VAULT_CATEGORIES.find(c => c.id === currentVaultCategory);
    document.getElementById('current-vault-cat-title').innerHTML = `<i class="fas ${catData.icon} mr-2"></i>${catData.title}`;

    const entries = vaultData.filter(e => e.categoryId === currentVaultCategory);

    if (entries.length === 0) {
        container.innerHTML = `<p class="text-muted italic">Aucune entrée dans cette catégorie.</p>`;
        return;
    }

    entries.forEach((entry, index) => {
        const globalIndex = vaultData.findIndex(e => e.id === entry.id);
        const div = document.createElement('div');
        div.className = 'vault-entry';

        let lockBadge = entry.locked ? `<span class="text-sm bg-red-900 text-white px-2 py-1 rounded" style="background: rgba(230,57,70,0.2); color:var(--danger); font-size: 0.75rem;"><i class="fas fa-lock mr-1"></i>Verrouillé</span>` : '';

        let fieldsHtml = '';
        for (let key in entry.fields) {
            let val = escapeHtml(entry.fields[key]);
            if (!val) continue;

            // Masquage intelligent dans l'admin si sensible
            const isSensitive = ['Mot de passe','CVV','PIN','Code/PIN','Clé/N°','IBAN'].includes(key);
            let displayVal = val;
            let actionsHtml = `<button class="action-btn" onclick="copyToClipboard('${val}')" title="Copier"><i class="fas fa-copy"></i></button>`;

            if (isSensitive) {
                const idStr = `vault-val-${entry.id}-${key.replace(/\s/g,'')}`;
                displayVal = `<input type="password" id="${idStr}" value="${val}" readonly style="background:transparent; border:none; color:inherit; width:100%; outline:none;" />`;
                actionsHtml = `
                    <button class="action-btn" onclick="toggleVisibility(this, '${idStr}')"><i class="fas fa-eye"></i></button>
                    ${actionsHtml}
                `;
            } else if (key === 'URL') {
                actionsHtml += `<a href="${val.startsWith('http') ? val : 'https://'+val}" target="_blank" class="action-btn" style="text-decoration:none;" title="Ouvrir"><i class="fas fa-external-link-alt"></i></a>`;
            } else if (key === 'Téléphone' || key === 'Tél assistance') {
                 actionsHtml += `<a href="tel:${val}" class="action-btn" style="text-decoration:none;" title="Appeler"><i class="fas fa-phone"></i></a>`;
            }

            if(key === 'Titre' || key === 'Nom du service' || key === 'Banque' || key === 'Service' || key === 'Nom/Description') continue; // Skipped for title

            fieldsHtml += `
                <div class="vault-field">
                    <label>${key}</label>
                    <div class="vault-field-value">
                        <div style="flex:1;">${displayVal}</div>
                        <div style="display:flex; gap:4px;">${actionsHtml}</div>
                    </div>
                </div>
            `;
        }

        const titleKey = ['Nom du service', 'Banque', 'Nom/Description', 'Service', 'Titre'].find(k => entry.fields[k]) || entry.title || 'Entrée';

        div.innerHTML = `
            <div class="vault-entry-header">
                <div class="flex items-center gap-2">
                    <span class="vault-entry-title">${escapeHtml(titleKey)}</span>
                    ${lockBadge}
                </div>
                <div class="vault-actions">
                    <button class="action-btn edit-btn" title="Modifier"><i class="fas fa-pen"></i></button>
                    ${currentVaultCategory === 0 ? '' : `<button class="action-btn delete-btn" title="Supprimer"><i class="fas fa-trash"></i></button>`}
                </div>
            </div>
            ${fieldsHtml}
        `;

        div.querySelector('.edit-btn').onclick = () => openVaultModal(currentVaultCategory, globalIndex);
        if(currentVaultCategory !== 0) {
            div.querySelector('.delete-btn').onclick = async () => {
                if(await confirmDialog("Supprimer cette entrée ?")) {
                    vaultData.splice(globalIndex, 1);
                    await saveVault();
                    renderVaultEntries();
                }
            };
        }
        container.appendChild(div);
    });
}

function getVaultFormTemplate(categoryId, data = {}) {
    const f = data.fields || {};
    let fields = '';

    switch(categoryId) {
        case 0:
            fields = `
                <div class="form-row">
                    <div class="flex-col gap-2"><label>Nom</label><input type="text" id="vf-nom" value="${escapeHtml(f['Nom']||'')}"></div>
                    <div class="flex-col gap-2"><label>Prénom</label><input type="text" id="vf-prenom" value="${escapeHtml(f['Prénom']||'')}"></div>
                </div>
                <div class="form-row">
                    <div class="flex-col gap-2"><label>Date de naissance</label><input type="date" id="vf-date" value="${escapeHtml(f['Date de naissance']||'')}" style="background:#1a1a2e; color:white; border:1px solid rgba(255,255,255,0.15); border-radius:8px; padding:10px;"></div>
                    <div class="flex-col gap-2"><label>Lieu de naissance</label><input type="text" id="vf-lieu" value="${escapeHtml(f['Lieu de naissance']||'')}"></div>
                </div>
                <div class="flex-col gap-2"><label>Nationalité</label><input type="text" id="vf-nat" value="${escapeHtml(f['Nationalité']||'')}"></div>
                <div class="flex-col gap-2"><label>Adresse complète</label><textarea id="vf-adresse" rows="2">${escapeHtml(f['Adresse complète']||'')}</textarea></div>
                <div class="flex-col gap-2"><label>Notes</label><textarea id="vf-notes" rows="2">${escapeHtml(f['Notes']||'')}</textarea></div>
            `;
            break;
        case 1:
            fields = `
                <div class="flex-col gap-2"><label>Nom du service *</label><input type="text" id="vf-nom" value="${escapeHtml(f['Nom du service']||'')}" required></div>
                <div class="flex-col gap-2"><label>URL</label><input type="text" id="vf-url" value="${escapeHtml(f['URL']||'')}"></div>
                <div class="flex-col gap-2"><label>Identifiant/Email</label><input type="text" id="vf-id" value="${escapeHtml(f['Identifiant/Email']||'')}"></div>
                <div class="flex-col gap-2"><label>Mot de passe</label><input type="password" id="vf-pwd" value="${escapeHtml(f['Mot de passe']||'')}"></div>
                <div class="flex-col gap-2"><label>Notes</label><textarea id="vf-notes">${escapeHtml(f['Notes']||'')}</textarea></div>
            `;
            break;
        case 2:
            fields = `
                <div class="flex-col gap-2"><label>Banque *</label><input type="text" id="vf-banque" value="${escapeHtml(f['Banque']||'')}" required></div>
                <div class="flex-col gap-2"><label>Nom sur la carte</label><input type="text" id="vf-nom" value="${escapeHtml(f['Nom sur la carte']||'')}"></div>
                <div class="flex-col gap-2"><label>Numéro</label><input type="text" id="vf-num" value="${escapeHtml(f['Numéro']||'')}"></div>
                <div class="form-row">
                    <div class="flex-col gap-2"><label>Expiration MM/AA</label><input type="text" id="vf-exp" value="${escapeHtml(f['Expiration MM/AA']||'')}"></div>
                    <div class="flex-col gap-2"><label>CVV</label><input type="password" id="vf-cvv" value="${escapeHtml(f['CVV']||'')}"></div>
                </div>
                <div class="form-row">
                    <div class="flex-col gap-2"><label>PIN</label><input type="password" id="vf-pin" value="${escapeHtml(f['PIN']||'')}"></div>
                    <div class="flex-col gap-2"><label>Plafond</label><input type="text" id="vf-plaf" value="${escapeHtml(f['Plafond']||'')}"></div>
                </div>
                <div class="flex-col gap-2"><label>Notes</label><textarea id="vf-notes">${escapeHtml(f['Notes']||'')}</textarea></div>
            `;
            break;
        case 3:
            const types = ["CNI", "Passeport", "Permis", "Titre de séjour", "Carte vitale", "Autre"];
            const tOpts = types.map(t => `<option value="${t}" ${f['Type']===t?'selected':''}>${t}</option>`).join('');
            fields = `
                <div class="flex-col gap-2"><label>Type *</label><select id="vf-type">${tOpts}</select></div>
                <div class="flex-col gap-2"><label>Numéro</label><input type="text" id="vf-num" value="${escapeHtml(f['Numéro']||'')}"></div>
                <div class="form-row">
                    <div class="flex-col gap-2"><label>Date délivrance</label><input type="text" id="vf-dated" value="${escapeHtml(f['Date délivrance']||'')}"></div>
                    <div class="flex-col gap-2"><label>Date expiration</label><input type="text" id="vf-datee" value="${escapeHtml(f['Date expiration']||'')}"></div>
                </div>
                <div class="flex-col gap-2"><label>Lieu délivrance</label><input type="text" id="vf-lieu" value="${escapeHtml(f['Lieu délivrance']||'')}"></div>
                <div class="flex-col gap-2"><label>Notes</label><textarea id="vf-notes">${escapeHtml(f['Notes']||'')}</textarea></div>
            `;
            break;
        case 4:
            fields = `
                <div class="flex-col gap-2"><label>Banque *</label><input type="text" id="vf-banque" value="${escapeHtml(f['Banque']||'')}" required></div>
                <div class="flex-col gap-2"><label>Titulaire</label><input type="text" id="vf-titre" value="${escapeHtml(f['Titulaire']||'')}"></div>
                <div class="flex-col gap-2"><label>IBAN</label><input type="password" id="vf-iban" value="${escapeHtml(f['IBAN']||'')}"></div>
                <div class="flex-col gap-2"><label>BIC/SWIFT</label><input type="text" id="vf-bic" value="${escapeHtml(f['BIC/SWIFT']||'')}"></div>
                <div class="form-row">
                    <div class="flex-col gap-2"><label>N° compte</label><input type="text" id="vf-compte" value="${escapeHtml(f['N° compte']||'')}"></div>
                    <div class="flex-col gap-2"><label>Agence</label><input type="text" id="vf-agence" value="${escapeHtml(f['Agence']||'')}"></div>
                </div>
                <div class="flex-col gap-2"><label>Notes</label><textarea id="vf-notes">${escapeHtml(f['Notes']||'')}</textarea></div>
            `;
            break;
        case 5:
            fields = `
                <div class="flex-col gap-2"><label>Nom/Description *</label><input type="text" id="vf-nom" value="${escapeHtml(f['Nom/Description']||'')}" required></div>
                <div class="flex-col gap-2"><label>Code/PIN</label><input type="password" id="vf-pin" value="${escapeHtml(f['Code/PIN']||'')}"></div>
                <div class="flex-col gap-2"><label>Notes</label><textarea id="vf-notes">${escapeHtml(f['Notes']||'')}</textarea></div>
            `;
            break;
        case 6:
            const gs = ["A+","A-","B+","B-","AB+","AB-","O+","O-","Inconnu"];
            const gsOpts = gs.map(g => `<option value="${g}" ${f['Groupe sanguin']===g?'selected':''}>${g}</option>`).join('');
            fields = `
                <div class="form-row">
                    <div class="flex-col gap-2"><label>Groupe sanguin</label><select id="vf-gs">${gsOpts}</select></div>
                    <div class="flex-col gap-2"><label>N° Sécu</label><input type="text" id="vf-secu" value="${escapeHtml(f['N° Sécu']||'')}"></div>
                </div>
                <div class="form-row">
                    <div class="flex-col gap-2"><label>Mutuelle</label><input type="text" id="vf-mut" value="${escapeHtml(f['Mutuelle']||'')}"></div>
                    <div class="flex-col gap-2"><label>N° adhérent</label><input type="text" id="vf-adh" value="${escapeHtml(f['N° adhérent']||'')}"></div>
                </div>
                <div class="flex-col gap-2"><label>Médecin traitant</label><input type="text" id="vf-med" value="${escapeHtml(f['Médecin traitant']||'')}"></div>
                <div class="flex-col gap-2"><label>Allergies</label><textarea id="vf-alg">${escapeHtml(f['Allergies']||'')}</textarea></div>
                <div class="flex-col gap-2"><label>Traitements</label><textarea id="vf-trait">${escapeHtml(f['Traitements']||'')}</textarea></div>
                <div class="flex-col gap-2"><label>Notes</label><textarea id="vf-notes">${escapeHtml(f['Notes']||'')}</textarea></div>
            `;
            break;
        case 7:
            const assTypes = ["Auto", "Habitation", "Santé", "Vie", "RC", "Autre"];
            const asOpts = assTypes.map(t => `<option value="${t}" ${f['Type']===t?'selected':''}>${t}</option>`).join('');
            fields = `
                <div class="form-row">
                    <div class="flex-col gap-2"><label>Type *</label><select id="vf-type">${asOpts}</select></div>
                    <div class="flex-col gap-2"><label>Compagnie *</label><input type="text" id="vf-comp" value="${escapeHtml(f['Compagnie']||'')}" required></div>
                </div>
                <div class="form-row">
                    <div class="flex-col gap-2"><label>N° contrat</label><input type="text" id="vf-num" value="${escapeHtml(f['N° contrat']||'')}"></div>
                    <div class="flex-col gap-2"><label>Date échéance</label><input type="text" id="vf-date" value="${escapeHtml(f['Date échéance']||'')}"></div>
                </div>
                <div class="flex-col gap-2"><label>Tél assistance</label><input type="tel" id="vf-tel" value="${escapeHtml(f['Tél assistance']||'')}"></div>
                <div class="flex-col gap-2"><label>Notes</label><textarea id="vf-notes">${escapeHtml(f['Notes']||'')}</textarea></div>
            `;
            break;
        case 8:
            fields = `
                <div class="flex-col gap-2"><label>Service *</label><input type="text" id="vf-serv" value="${escapeHtml(f['Service']||'')}" required></div>
                <div class="flex-col gap-2"><label>Email du compte</label><input type="email" id="vf-email" value="${escapeHtml(f['Email du compte']||'')}"></div>
                <div class="flex-col gap-2"><label>Clé/N°</label><input type="password" id="vf-cle" value="${escapeHtml(f['Clé/N°']||'')}"></div>
                <div class="flex-col gap-2"><label>Date renouvellement</label><input type="text" id="vf-date" value="${escapeHtml(f['Date renouvellement']||'')}"></div>
                <div class="flex-col gap-2"><label>Notes</label><textarea id="vf-notes">${escapeHtml(f['Notes']||'')}</textarea></div>
            `;
            break;
        case 9:
            fields = `
                <div class="flex-col gap-2"><label>Titre *</label><input type="text" id="vf-titre" value="${escapeHtml(f['Titre']||'')}" required></div>
                <div class="flex-col gap-2"><label>Contenu</label><textarea id="vf-cont" style="min-height:200px;">${escapeHtml(f['Contenu']||'')}</textarea></div>
            `;
            break;
    }
    return fields;
}

function extractVaultFormData(categoryId) {
    let f = {};
    const val = (id) => document.getElementById(id) ? document.getElementById(id).value : '';

    switch(categoryId) {
        case 0: f = {'Nom':val('vf-nom'), 'Prénom':val('vf-prenom'), 'Date de naissance':val('vf-date'), 'Lieu de naissance':val('vf-lieu'), 'Nationalité':val('vf-nat'), 'Adresse complète':val('vf-adresse'), 'Notes':val('vf-notes')}; break;
        case 1: f = {'Nom du service':val('vf-nom'), 'URL':val('vf-url'), 'Identifiant/Email':val('vf-id'), 'Mot de passe':val('vf-pwd'), 'Notes':val('vf-notes')}; break;
        case 2: f = {'Banque':val('vf-banque'), 'Nom sur la carte':val('vf-nom'), 'Numéro':val('vf-num'), 'Expiration MM/AA':val('vf-exp'), 'CVV':val('vf-cvv'), 'PIN':val('vf-pin'), 'Plafond':val('vf-plaf'), 'Notes':val('vf-notes')}; break;
        case 3: f = {'Type':val('vf-type'), 'Numéro':val('vf-num'), 'Date délivrance':val('vf-dated'), 'Date expiration':val('vf-datee'), 'Lieu délivrance':val('vf-lieu'), 'Notes':val('vf-notes')}; break;
        case 4: f = {'Banque':val('vf-banque'), 'Titulaire':val('vf-titre'), 'IBAN':val('vf-iban'), 'BIC/SWIFT':val('vf-bic'), 'N° compte':val('vf-compte'), 'Agence':val('vf-agence'), 'Notes':val('vf-notes')}; break;
        case 5: f = {'Nom/Description':val('vf-nom'), 'Code/PIN':val('vf-pin'), 'Notes':val('vf-notes')}; break;
        case 6: f = {'Groupe sanguin':val('vf-gs'), 'N° Sécu':val('vf-secu'), 'Mutuelle':val('vf-mut'), 'N° adhérent':val('vf-adh'), 'Médecin traitant':val('vf-med'), 'Allergies':val('vf-alg'), 'Traitements':val('vf-trait'), 'Notes':val('vf-notes')}; break;
        case 7: f = {'Type':val('vf-type'), 'Compagnie':val('vf-comp'), 'N° contrat':val('vf-num'), 'Date échéance':val('vf-date'), 'Tél assistance':val('vf-tel'), 'Notes':val('vf-notes')}; break;
        case 8: f = {'Service':val('vf-serv'), 'Email du compte':val('vf-email'), 'Clé/N°':val('vf-cle'), 'Date renouvellement':val('vf-date'), 'Notes':val('vf-notes')}; break;
        case 9: f = {'Titre':val('vf-titre'), 'Contenu':val('vf-cont')}; break;
    }
    // Remove empty
    for(let k in f) if(!f[k]) delete f[k];
    return f;
}

function openVaultModal(categoryId, index = -1) {
    const isEdit = index !== -1;
    const entry = isEdit ? vaultData[index] : { categoryId: categoryId, locked: false, lockName: '', lockPwd: '' };

    const lockHtml = `
        <div class="mt-6 p-4 border rounded" style="background:rgba(255,255,255,0.02); border-color:var(--border);">
            <label class="checkbox-container mb-4">
                <input type="checkbox" id="v-lock" ${entry.locked ? 'checked' : ''}>
                <span class="font-bold">Verrouiller l'accès externe pour cette entrée</span>
            </label>
            <div id="lock-fields" class="${entry.locked ? 'flex-col gap-4' : 'hidden'}">
                <input type="text" id="v-lock-name" value="${escapeHtml(entry.lockName)}" placeholder="Prénom autorisé (ex: Lyes)">
                <div class="input-group">
                    <input type="password" id="v-lock-pwd" value="${escapeHtml(entry.lockPwd)}" placeholder="Mot de passe spécifique">
                    <button type="button" onclick="toggleVisibility(this, 'v-lock-pwd')"><i class="fas fa-eye"></i></button>
                </div>
            </div>
        </div>
    `;

    const html = `
        <h3 class="text-xl mb-4 font-bold" style="color:var(--accent);">${isEdit ? 'Modifier' : 'Ajouter'} ${VAULT_CATEGORIES.find(c=>c.id===categoryId).title}</h3>
        <form id="vault-form" class="flex-col gap-4">
            ${getVaultFormTemplate(categoryId, entry)}
            ${lockHtml}
            <div class="flex gap-4 justify-end mt-4">
                <button type="button" class="action-btn" style="padding: 10px 20px;" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn-primary" style="padding: 10px 20px;">Sauvegarder</button>
            </div>
        </form>
    `;

    openModal(html);

    const lockCb = document.getElementById('v-lock');
    const lockFields = document.getElementById('lock-fields');
    if(lockCb) {
        lockCb.onchange = () => {
            if(lockCb.checked) {
                lockFields.classList.remove('hidden');
                lockFields.classList.add('flex-col', 'gap-4');
                document.getElementById('v-lock-name').required = true;
                document.getElementById('v-lock-pwd').required = true;
            } else {
                lockFields.classList.add('hidden');
                lockFields.classList.remove('flex-col', 'gap-4');
                document.getElementById('v-lock-name').required = false;
                document.getElementById('v-lock-pwd').required = false;
            }
        };
    }

    document.getElementById('vault-form').onsubmit = async (e) => {
        e.preventDefault();

        const newEntry = {
            id: isEdit ? entry.id : Date.now().toString(),
            categoryId: categoryId,
            fields: extractVaultFormData(categoryId),
            locked: document.getElementById('v-lock') ? document.getElementById('v-lock').checked : false,
            lockName: document.getElementById('v-lock-name') ? document.getElementById('v-lock-name').value.trim() : '',
            lockPwd: document.getElementById('v-lock-pwd') ? document.getElementById('v-lock-pwd').value : ''
        };

        if(isEdit) vaultData[index] = newEntry;
        else vaultData.push(newEntry);

        await saveVault();
        renderVaultEntries();
        closeModal();
    };
}

async function saveVault() {
    appData.vaultData = encryptData(vaultData, vaultPwd);
    await postToApi({ action: 'save', data: appData });
    showToast("Vault sauvegardé", "success");
}

// ==========================================
// 3. TESTAMENT
// ==========================================

function initTestamentQuill() {
    if (isQuillInitialized) return;

    quillInstance = new Quill('#quill-container', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'align': [] }],
                ['clean']
            ]
        }
    });

    const iden = testamentData.identity || {};
    document.getElementById('testament-nom').value = iden.nom || '';
    document.getElementById('testament-prenom').value = iden.prenom || '';
    document.getElementById('testament-date-naissance').value = iden.dateNaissance || '';
    document.getElementById('testament-lieu-naissance').value = iden.lieuNaissance || '';
    document.getElementById('testament-nationalite').value = iden.nationalite || '';
    document.getElementById('testament-adresse').value = iden.adresse || '';

    if(testamentData.content) {
        quillInstance.root.innerHTML = testamentData.content;
    }

    if (testamentData.lastModified) {
        document.getElementById('testament-status').textContent = `Dernière sauvegarde : ${formatDateFR(testamentData.lastModified)}`;
    }

    quillInstance.on('text-change', () => {
        document.getElementById('testament-status').textContent = 'Modifications non sauvegardées...';
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(saveTestament, 30000); // 30s autosave
    });

    document.getElementById('btn-save-testament').onclick = saveTestament;
    document.getElementById('btn-export-pdf').onclick = exportTestamentPDF;

    isQuillInitialized = true;
}

async function saveTestament() {
    testamentData.identity = {
        nom: document.getElementById('testament-nom').value.trim(),
        prenom: document.getElementById('testament-prenom').value.trim(),
        dateNaissance: document.getElementById('testament-date-naissance').value,
        lieuNaissance: document.getElementById('testament-lieu-naissance').value.trim(),
        nationalite: document.getElementById('testament-nationalite').value.trim(),
        adresse: document.getElementById('testament-adresse').value.trim()
    };
    testamentData.content = quillInstance.root.innerHTML;
    testamentData.lastModified = new Date().toISOString();

    appData.testamentData = encryptData(testamentData, testamentPwd);
    await postToApi({ action: 'save', data: appData });

    document.getElementById('testament-status').textContent = `Dernière sauvegarde : ${formatDateFR(testamentData.lastModified)}`;
    showToast("Testament sauvegardé", "success");
}

function exportTestamentPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margins = { top: 20, bottom: 20, left: 20, right: 20 };
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = margins.top;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("TESTAMENT — DERNIÈRES VOLONTÉS", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Identity
    const iden = testamentData.identity || {};
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    // Formatting date
    let dateStr = "___";
    if(iden.dateNaissance) {
        const [y,m,d] = iden.dateNaissance.split('-');
        dateStr = `${d}/${m}/${y}`;
    }

    const identityText = `Je soussigné(e) ${iden.prenom || '___'} ${iden.nom || '___'},\nné(e) le ${dateStr} à ${iden.lieuNaissance || '___'},\nde nationalité ${iden.nationalite || '___'},\ndemeurant ${iden.adresse || '___'},`;

    const splitIdentity = doc.splitTextToSize(identityText, pageWidth - margins.left - margins.right);
    doc.text(splitIdentity, margins.left, yPos);
    yPos += (splitIdentity.length * 7) + 10;

    // Date modif
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    const modifDate = testamentData.lastModified ? formatDateFR(testamentData.lastModified) : "Inconnue";
    doc.text(`Rédigé et mis à jour le ${modifDate}`, margins.left, yPos);
    yPos += 15;

    // Content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    // Convert HTML to simple text (very basic for jsPDF without HTML plugin)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = testamentData.content;
    const textContent = tempDiv.innerText || tempDiv.textContent;

    const splitContent = doc.splitTextToSize(textContent, pageWidth - margins.left - margins.right);

    // Check pages
    for (let i = 0; i < splitContent.length; i++) {
        if (yPos > doc.internal.pageSize.getHeight() - margins.bottom - 10) {
            doc.addPage();
            yPos = margins.top;
        }
        doc.text(splitContent[i], margins.left, yPos);
        yPos += 7;
    }

    // Footer
    const today = new Date();
    const printDate = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text(`Document généré le ${printDate}`, margins.left, doc.internal.pageSize.getHeight() - 10);

    doc.save(`Testament_${iden.nom || 'Document'}.pdf`);
}

// ==========================================
// 4. PARAMÈTRES
// ==========================================

function initSettings() {
    document.getElementById('settings-emergency-msg').value = settingsData.emergencyMessage;

    document.getElementById('btn-save-msg').onclick = async () => {
        const msg = document.getElementById('settings-emergency-msg').value.trim();
        appData.emergencyMessage = encryptData(msg, adminKey);
        appData.emergencyMessageForEmergency = encryptData(msg, emergencyPwd);
        settingsData.emergencyMessage = msg;
        await postToApi({ action: 'save', data: appData });
        showToast("Message enregistré", "success");
    };

    renderLogs();

    document.getElementById('btn-change-pwd').onclick = async () => {
        const oldAd = document.getElementById('chg-old-admin').value;
        const nAd = document.getElementById('chg-new-admin').value;
        const nUrg = document.getElementById('chg-new-urg').value;
        const nVault = document.getElementById('chg-new-vault').value;
        const nTest = document.getElementById('chg-new-test').value;

        if (hashPassword(oldAd) !== appData.adminHash) {
            return showToast("L'ancien mot de passe Admin est incorrect", "error");
        }
        if (!nAd || !nUrg || !nVault || !nTest) {
            return showToast("Tous les nouveaux mots de passe doivent être saisis", "error");
        }

        const pwds = [nAd, nUrg, nVault, nTest];
        if (new Set(pwds).size !== pwds.length) {
            return showToast("Les 4 nouveaux mots de passe doivent être différents", "error");
        }

        if (await confirmDialog("Voulez-vous vraiment changer les mots de passe ? Tout sera rechiffré.")) {
            try {
                // Re-hash
                appData.adminHash = hashPassword(nAd);
                appData.emergencyHash = hashPassword(nUrg);
                appData.vaultHash = hashPassword(nVault);
                appData.testamentHash = hashPassword(nTest);

                // Re-encrypt keys
                appData.encryptedEmergencyPassword = encryptData(nUrg, nAd);
                appData.encryptedVaultPassword = encryptData(nVault, nAd);
                appData.encryptedTestamentPassword = encryptData(nTest, nAd);

                // Re-encrypt Data
                appData.contacts = encryptData(contactsList, nAd);
                appData.emergencyContacts = encryptData(contactsList, nUrg);

                appData.vaultData = encryptData(vaultData, nVault);
                appData.testamentData = encryptData(testamentData, nTest);

                appData.emergencyMessage = encryptData(settingsData.emergencyMessage, nAd);
                appData.emergencyMessageForEmergency = encryptData(settingsData.emergencyMessage, nUrg);

                appData.accessLogs = encryptData([], nAd); // reset admin logs? Let's just encrypt empty for now

                await postToApi({ action: 'save', data: appData });

                showToast("Mots de passe modifiés. Veuillez vous reconnecter.", "success");
                setTimeout(() => {
                    sessionStorage.clear();
                    window.location.href = 'index.html';
                }, 2000);
            } catch(e) {
                showToast("Erreur lors du rechiffrement", "error");
            }
        }
    };
}

function renderLogs() {
    const container = document.getElementById('access-logs');
    if (settingsData.logs.length === 0) {
        container.innerHTML = '<p class="text-muted italic">Aucun accès externe enregistré.</p>';
        return;
    }

    container.innerHTML = [...settingsData.logs].reverse().map(log => {
        const typeStr = log.type === 'vault_access' ? '<span style="color:var(--accent)"><i class="fas fa-lock mr-1"></i>Vault</span>'
                      : '<span style="color:var(--warning)"><i class="fas fa-scroll mr-1"></i>Testament</span>';
        return `
            <div class="p-2 mb-2 border rounded" style="background:rgba(255,255,255,0.02); border-color:var(--border);">
                <div class="flex justify-between mb-1">
                    <strong>${typeStr}</strong>
                    <span class="text-muted">${formatDateFR(log.date)}</span>
                </div>
                <div>Nom: ${escapeHtml(log.nom)} | IP: ${log.ip}</div>
            </div>
        `;
    }).join('');
}

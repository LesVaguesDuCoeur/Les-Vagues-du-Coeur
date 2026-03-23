// State
const state = {
    adminKey: sessionStorage.getItem('adminKey'),
    serverData: null,
    contacts: [],
    vault: [],
    testament: {},
    logs: [],
    passwords: {
        emergency: null,
        vault: null,
        testament: null
    },
    quill: null
};

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    if (!state.adminKey) {
        window.location.href = 'index.html';
        return;
    }

    setupAutoLock(30);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

    try {
        state.serverData = await api.load();

        // Decrypt keys
        state.passwords.emergency = decryptData(state.serverData.encryptedEmergencyPassword, state.adminKey);
        state.passwords.vault = decryptData(state.serverData.encryptedVaultPassword, state.adminKey);
        state.passwords.testament = decryptData(state.serverData.encryptedTestamentPassword, state.adminKey);

        if (!state.passwords.emergency || !state.passwords.vault || !state.passwords.testament) {
            throw new Error("Erreur de déchiffrement des clés avec le mot de passe Admin.");
        }

        // Initialize Tab Navigation
        initTabs();

        // Load specific sections
        loadContacts();
        loadVault();
        loadSettings();

    } catch (e) {
        showToast("Erreur d'authentification ou de déchiffrement.", "error");
        setTimeout(() => {
            sessionStorage.clear();
            window.location.href = 'index.html';
        }, 2000);
    }
});

function initTabs() {
    const tabs = document.querySelectorAll('.nav-tab[data-target]');
    const sections = document.querySelectorAll('.tab-content');
    const title = document.getElementById('navTitle');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.add('hidden'));

            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');

            title.innerText = tab.querySelector('.tab-label').innerText;

            // Initialize Quill lazily when Testament tab is opened
            if (targetId === 'testament-section' && !state.quill) {
                initTestament();
            }
        });
    });
}
// --- Contacts Logic ---
const relationsOptions = [
    "Mère", "Père", "Frère", "Sœur", "Demi-frère", "Demi-sœur", "Grand-père", "Grand-mère",
    "Oncle", "Tante", "Cousin(e)", "Fils", "Fille", "Conjoint(e)", "Ex-conjoint(e)",
    "Ami(e) proche", "Meilleur(e) ami(e)", "Connaissance", "Collègue", "Patron/Manager",
    "Associé(e)", "Client", "Médecin", "Avocat", "Notaire", "Comptable", "Banquier",
    "Assureur", "Voisin(e)", "Propriétaire/Bailleur", "Professeur", "Famille éloignée", "Autre"
];

function loadContacts() {
    if (state.serverData.contacts) {
        state.contacts = decryptData(state.serverData.contacts, state.adminKey) || [];
    }

    // Set up search
    document.getElementById('contactSearch').addEventListener('input', (e) => {
        renderContacts(e.target.value);
    });

    // Add contact button
    document.getElementById('addContactBtn').addEventListener('click', () => {
        showContactModal();
    });

    // Export PDF
    document.getElementById('exportContactsBtn').addEventListener('click', () => {
        exportContactsPDF();
    });

    renderContacts();
}

function renderContacts(query = '') {
    const list = document.getElementById('contactsList');
    list.innerHTML = '';

    const filtered = state.contacts.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.relation.toLowerCase().includes(query.toLowerCase())
    ).sort((a, b) => a.importance - b.importance); // 1 = most important

    const colors = {1: '#e63946', 2: '#fca311', 3: '#ffbe0b', 4: '#06d6a0', 5: '#8d99ae'};

    if (filtered.length === 0) {
        list.innerHTML = `<div class="p-4 text-center text-muted">Aucun contact trouvé.</div>`;
        return;
    }

    filtered.forEach(contact => {
        const borderCol = colors[contact.importance] || colors[5];

        let actionsHtml = `
            <button class="btn btn-icon" onclick="showContactModal('${contact.id}')" title="Modifier"><i class="fas fa-edit"></i></button>
            <button class="btn btn-icon text-accent-danger" onclick="deleteContact('${contact.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
        `;

        let linksHtml = '';
        if(contact.phone) linksHtml += `<a href="tel:${contact.phone}" class="contact-icon-btn" style="--hover-color:#25D366" title="Appeler"><i class="fas fa-phone"></i></a>`;
        if(contact.email) linksHtml += `<a href="mailto:${contact.email}" class="contact-icon-btn" style="--hover-color:#457b9d" title="Email"><i class="fas fa-envelope"></i></a>`;
        if(contact.whatsapp) {
            let waNum = contact.whatsapp.replace(/\s+/g, '').replace('+', '');
            linksHtml += `<a href="https://wa.me/${waNum}" target="_blank" class="contact-icon-btn" style="--hover-color:#25D366" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>`;
        }
        if(contact.telegram) {
            let tgUser = contact.telegram.replace('@', '');
            linksHtml += `<a href="https://t.me/${tgUser}" target="_blank" class="contact-icon-btn" style="--hover-color:#0088cc" title="Telegram"><i class="fab fa-telegram"></i></a>`;
        }
        if(contact.snap) {
            let snapUser = contact.snap.replace('@', '');
            linksHtml += `<a href="https://www.snapchat.com/add/${snapUser}" target="_blank" class="contact-icon-btn" style="--hover-color:#FFFC00; --hover-text-color:#000" title="Snapchat"><i class="fab fa-snapchat-ghost"></i></a>`;
        }
        if(contact.insta) {
            let instaUser = contact.insta.replace('@', '');
            linksHtml += `<a href="https://www.instagram.com/${instaUser}" target="_blank" class="contact-icon-btn" style="--hover-color:#E1306C" title="Instagram"><i class="fab fa-instagram"></i></a>`;
        }
        if(contact.messenger) {
            linksHtml += `<a href="https://m.me/${contact.messenger}" target="_blank" class="contact-icon-btn" style="--hover-color:#0084ff" title="Messenger"><i class="fab fa-facebook-messenger"></i></a>`;
        }

        const row = document.createElement('div');
        row.className = 'contact-row';
        row.style.borderLeft = `4px solid ${borderCol}`;

        row.innerHTML = `
            <div class="contact-info">
                <span class="contact-name">${escapeHTML(contact.name)}</span>
                <span class="contact-relation">${escapeHTML(contact.relation)}</span>
            </div>
            <div class="contact-icons">
                ${linksHtml}
            </div>
            <div class="contact-actions">
                ${actionsHtml}
            </div>
        `;

        list.appendChild(row);
    });
}

function showContactModal(contactId = null) {
    let contact = contactId ? state.contacts.find(c => c.id === contactId) : {
        id: crypto.randomUUID(), name: '', relation: 'Ami(e) proche', importance: 3,
        phone: '', snap: '', insta: '', messenger: '', email: '', whatsapp: '', telegram: '', notes: ''
    };

    const isEdit = !!contactId;
    const title = isEdit ? 'Modifier le contact' : 'Ajouter un contact';

    let selectedRelation = contact.relation;
    let isAutre = false;
    if (!relationsOptions.includes(selectedRelation)) {
        isAutre = true;
        selectedRelation = 'Autre';
    }

    const optionsHtml = relationsOptions.map(opt =>
        `<option value="${opt}" ${selectedRelation === opt ? 'selected' : ''}>${opt}</option>`
    ).join('');

    const html = `
        <h3 class="mb-4">${title}</h3>
        <form id="contactForm" class="flex-col gap-4">
            <div class="flex gap-4">
                <div class="form-group flex-1">
                    <label>Nom Complet</label>
                    <input type="text" id="c_name" value="${escapeHTML(contact.name)}" required>
                </div>
                <div class="form-group flex-1">
                    <label>Relation</label>
                    <select id="c_relation" required>
                        ${optionsHtml}
                    </select>
                    <input type="text" id="c_relation_autre" class="mt-2 ${isAutre ? '' : 'hidden'}" placeholder="Précisez la relation..." value="${isAutre ? escapeHTML(contact.relation) : ''}">
                </div>
            </div>
            <div class="form-group">
                <label>Importance (1=Vital, 5=Faible)</label>
                <div class="importance-radio-group">
                    <label class="importance-radio-label" style="--radio-color: #e63946;">
                        <input type="radio" name="c_importance" value="1" ${contact.importance === 1 ? 'checked' : ''}> 1
                    </label>
                    <label class="importance-radio-label" style="--radio-color: #fca311;">
                        <input type="radio" name="c_importance" value="2" ${contact.importance === 2 ? 'checked' : ''}> 2
                    </label>
                    <label class="importance-radio-label" style="--radio-color: #ffd166;">
                        <input type="radio" name="c_importance" value="3" ${contact.importance === 3 ? 'checked' : ''}> 3
                    </label>
                    <label class="importance-radio-label" style="--radio-color: #06d6a0;">
                        <input type="radio" name="c_importance" value="4" ${contact.importance === 4 ? 'checked' : ''}> 4
                    </label>
                    <label class="importance-radio-label" style="--radio-color: #555;">
                        <input type="radio" name="c_importance" value="5" ${contact.importance === 5 ? 'checked' : ''}> 5
                    </label>
                </div>
            </div>
            <div class="flex gap-4">
                <div class="form-group flex-1">
                    <label>Téléphone</label>
                    <input type="tel" id="c_phone" value="${escapeHTML(contact.phone)}">
                </div>
                <div class="form-group flex-1">
                    <label>Email</label>
                    <input type="email" id="c_email" value="${escapeHTML(contact.email)}">
                </div>
            </div>
             <div class="flex gap-4">
                <div class="form-group flex-1">
                    <label>WhatsApp (Format: 336...)</label>
                    <input type="text" id="c_whatsapp" value="${escapeHTML(contact.whatsapp)}">
                </div>
                <div class="form-group flex-1">
                    <label>Telegram (Pseudo)</label>
                    <input type="text" id="c_telegram" value="${escapeHTML(contact.telegram)}">
                </div>
            </div>
             <div class="flex gap-4">
                <div class="form-group flex-1">
                    <label>Snapchat</label>
                    <input type="text" id="c_snap" value="${escapeHTML(contact.snap)}">
                </div>
                <div class="form-group flex-1">
                    <label>Instagram</label>
                    <input type="text" id="c_insta" value="${escapeHTML(contact.insta)}">
                </div>
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="c_notes" rows="3">${escapeHTML(contact.notes)}</textarea>
            </div>

            <div class="flex justify-between mt-4">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary" id="c_saveBtn">${isEdit ? 'Sauvegarder' : 'Ajouter'}</button>
            </div>
        </form>
    `;

    openModal(html);

    // Need to set timeout or wait for the form to be injected by openModal
    setTimeout(() => {
        const relationSelect = document.getElementById('c_relation');
        const relationAutre = document.getElementById('c_relation_autre');

        relationSelect.addEventListener('change', (e) => {
            if (e.target.value === 'Autre') {
                relationAutre.classList.remove('hidden');
                relationAutre.required = true;
            } else {
                relationAutre.classList.add('hidden');
                relationAutre.required = false;
                relationAutre.value = '';
            }
        });

        document.getElementById('contactForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            document.getElementById('c_saveBtn').disabled = true;

            contact.name = document.getElementById('c_name').value;

            if (relationSelect.value === 'Autre') {
                contact.relation = relationAutre.value;
            } else {
                contact.relation = relationSelect.value;
            }

            const importanceRadio = document.querySelector('input[name="c_importance"]:checked');
            contact.importance = importanceRadio ? parseInt(importanceRadio.value, 10) : 5;
            contact.phone = document.getElementById('c_phone').value;
            contact.email = document.getElementById('c_email').value;
            contact.whatsapp = document.getElementById('c_whatsapp').value;
            contact.telegram = document.getElementById('c_telegram').value;
            contact.snap = document.getElementById('c_snap').value;
            contact.insta = document.getElementById('c_insta').value;
            contact.notes = document.getElementById('c_notes').value;

            if (isEdit) {
                const index = state.contacts.findIndex(c => c.id === contactId);
                if(index > -1) state.contacts[index] = contact;
            } else {
                state.contacts.push(contact);
            }

            await saveContacts();
            closeModal();
            renderContacts(document.getElementById('contactSearch').value);
            showToast("Contact enregistré avec succès", "success");
        });
    }, 100);
}

async function deleteContact(id) {
    const confirmed = await confirmDialog("Voulez-vous vraiment supprimer ce contact ?");
    if (!confirmed) return;

    state.contacts = state.contacts.filter(c => c.id !== id);
    await saveContacts();
    renderContacts(document.getElementById('contactSearch').value);
    showToast("Contact supprimé", "info");
}

async function saveContacts() {
    // Encrypt with admin
    state.serverData.contacts = encryptData(state.contacts, state.adminKey);
    // Encrypt with emergency
    state.serverData.emergencyContacts = encryptData(state.contacts, state.passwords.emergency);

    await api.save(state.serverData);
}

function exportContactsPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Liste des Contacts", 20, 20);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    let y = 30;

    [...state.contacts].sort((a,b) => a.importance - b.importance).forEach(contact => {
        if(y > 270) {
            doc.addPage();
            y = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.text(`${contact.name} (${contact.relation}) - Import. ${contact.importance}`, 20, y);
        y += 6;

        doc.setFont("helvetica", "normal");
        if(contact.phone) doc.text(`Tél: ${contact.phone}`, 25, y);
        if(contact.email) doc.text(`Email: ${contact.email}`, 100, y);
        y += 6;

        if(contact.notes) {
            const splitNotes = doc.splitTextToSize(`Notes: ${contact.notes}`, 170);
            doc.text(splitNotes, 25, y);
            y += splitNotes.length * 6;
        }

        y += 4; // Space between contacts
    });

    doc.save("Contacts.pdf");
}


// --- Vault Logic ---
const vaultCategories = [
    { id: 'all', name: 'Toutes les entrées', icon: 'fa-list' },
    { id: 'identifiants', name: 'Identifiants & MDP', icon: 'fa-key' },
    { id: 'cartes', name: 'Cartes bancaires', icon: 'fa-credit-card' },
    { id: 'documents', name: "Documents d'identité", icon: 'fa-id-card' },
    { id: 'comptes', name: 'Comptes bancaires', icon: 'fa-university' },
    { id: 'codes', name: 'Codes & PIN', icon: 'fa-lock' },
    { id: 'medical', name: 'Infos médicales', icon: 'fa-heartbeat' },
    { id: 'assurances', name: 'Assurances', icon: 'fa-shield-alt' },
    { id: 'licences', name: 'Licences & Abos', icon: 'fa-barcode' },
    { id: 'notes', name: 'Notes libres', icon: 'fa-sticky-note' }
];

let currentVaultCategory = 'all';

function loadVault() {
    if (state.serverData.vaultData) {
        state.vault = decryptData(state.serverData.vaultData, state.passwords.vault) || [];
    }

    renderVaultSidebar();

    document.getElementById('addVaultBtn').addEventListener('click', () => {
        showVaultModal();
    });

    renderVaultList();
}

function renderVaultSidebar() {
    const sidebar = document.getElementById('vaultCategories');
    sidebar.innerHTML = '';

    vaultCategories.forEach(cat => {
        const btn = document.createElement('div');
        btn.className = `nav-tab ${cat.id === currentVaultCategory ? 'active' : ''}`;
        btn.style.marginBottom = '5px';
        btn.innerHTML = `<i class="fas ${cat.icon} w-6"></i> <span>${cat.name}</span>`;
        btn.onclick = () => {
            currentVaultCategory = cat.id;
            document.getElementById('currentCategoryTitle').innerText = cat.name;
            renderVaultSidebar(); // Refresh active state
            renderVaultList();
        };
        sidebar.appendChild(btn);
    });
}

function renderVaultList() {
    const list = document.getElementById('vaultList');
    list.innerHTML = '';

    const filtered = currentVaultCategory === 'all'
        ? state.vault
        : state.vault.filter(v => v.category === currentVaultCategory);

    if (filtered.length === 0) {
        list.innerHTML = `<div class="p-4 text-center text-muted">Aucune entrée dans cette catégorie.</div>`;
        return;
    }

    filtered.forEach(entry => {
        const catObj = vaultCategories.find(c => c.id === entry.category) || vaultCategories[0];
        const isLocked = entry.isLocked;

        let lockBadge = isLocked
            ? `<span class="text-accent-warning ml-2" title="Verrouillé"><i class="fas fa-lock"></i></span>`
            : '';

        let actionsHtml = `
            <button class="btn btn-icon" onclick="showVaultModal('${entry.id}')" title="Modifier"><i class="fas fa-edit"></i></button>
            <button class="btn btn-icon text-accent-danger" onclick="deleteVaultEntry('${entry.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
        `;

        // Render fields based on what they are
        let fieldsHtml = '';
        if (entry.fields) {
            entry.fields.forEach((f, idx) => {
                if(!f.value) return;
                let displayVal = escapeHTML(f.value);
                let copyBtn = '';

                // Add Open URL button if it is a URL field
                let cleanValForHtml = escapeHTML(f.value).replace(/"/g, '&quot;');

                if (f.label === 'URL du site') {
                    let urlVal = f.value.startsWith('http') ? escapeHTML(f.value) : 'https://' + escapeHTML(f.value);
                    copyBtn = `<a href="${urlVal}" target="_blank" class="ml-2 text-accent-main" title="Ouvrir le lien"><i class="fas fa-external-link-alt"></i> Ouvrir</a>`;
                } else {
                    copyBtn = `<i class="fas fa-copy ml-2 cursor-pointer text-muted" onclick="copyToClipboard(this.dataset.val)" data-val="${cleanValForHtml}" title="Copier"></i>`;
                }

                if (f.isSensitive) {
                    let maskedVal = '••••••••';
                    if (f.label === 'Numéro de carte' && f.value.length > 4) {
                        maskedVal = '•••• •••• •••• ' + f.value.slice(-4);
                    }

                    displayVal = maskedVal;
                    copyBtn = `
                        <i class="fas fa-eye ml-2 cursor-pointer text-muted" onclick="toggleReveal(this, '${maskedVal}')" data-val="${cleanValForHtml}" title="Révéler"></i>
                        <i class="fas fa-copy ml-2 cursor-pointer text-muted" onclick="copyToClipboard(this.dataset.val)" data-val="${cleanValForHtml}" title="Copier"></i>
                    `;
                }

                fieldsHtml += `
                    <div class="mb-2">
                        <span class="text-sm text-muted">${escapeHTML(f.label)}:</span>
                        <span class="font-bold ml-1"><span>${displayVal}</span>${copyBtn}</span>
                    </div>
                `;
            });
        }

        const row = document.createElement('div');
        row.className = 'vault-item';
        row.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="font-bold text-xl"><i class="fas ${catObj.icon} text-muted mr-2"></i> ${escapeHTML(entry.title)} ${lockBadge}</div>
                <div class="flex gap-2">${actionsHtml}</div>
            </div>
            <div>${fieldsHtml}</div>
            ${entry.notes ? `<div class="mt-4 text-sm text-muted border-t pt-2 border-gray-700">${escapeHTML(entry.notes)}</div>` : ''}
        `;

        list.appendChild(row);
    });
}

window.toggleReveal = function(el, maskedVal) {
    const target = el.previousElementSibling;
    if (target.innerText === maskedVal) {
        target.innerText = el.dataset.val;
    } else {
        target.innerText = maskedVal;
    }
};

function showVaultModal(entryId = null) {
    let entry = entryId ? state.vault.find(v => v.id === entryId) : {
        id: crypto.randomUUID(),
        category: currentVaultCategory === 'all' ? 'identifiants' : currentVaultCategory,
        title: '',
        fields: [{ label: 'Identifiant', value: '', isSensitive: false }, { label: 'Mot de passe', value: '', isSensitive: true }],
        notes: '',
        isLocked: false,
        lockName: '',
        lockPassword: ''
    };

    const isEdit = !!entryId;
    const modalTitle = isEdit ? 'Modifier l\'entrée' : 'Ajouter une entrée';

    const catOptions = vaultCategories.filter(c => c.id !== 'all').map(c =>
        `<option value="${c.id}" ${entry.category === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    const categoryTemplates = {
        'identifiants': [
            { id: 'f_url', label: 'URL du site', type: 'text', sensitive: false },
            { id: 'f_id', label: 'Identifiant / Email', type: 'text', sensitive: false },
            { id: 'f_pwd', label: 'Mot de passe', type: 'password', sensitive: true }
        ],
        'cartes': [
            { id: 'f_name', label: 'Nom sur la carte', type: 'text', sensitive: false },
            { id: 'f_num', label: 'Numéro de carte', type: 'text', sensitive: true, mask: true },
            { id: 'f_exp', label: 'Date d\'expiration (MM/AA)', type: 'text', sensitive: false },
            { id: 'f_cvv', label: 'CVV', type: 'password', sensitive: true },
            { id: 'f_pin', label: 'Code PIN', type: 'password', sensitive: true },
            { id: 'f_limit', label: 'Plafond de paiement', type: 'text', sensitive: false }
        ],
        'documents': [
            { id: 'f_type', label: 'Type (CNI, Passeport...)', type: 'select', options: ['CNI', 'Passeport', 'Permis de conduire', 'Titre de séjour', 'Carte vitale', 'Autre'], sensitive: false },
            { id: 'f_num', label: 'Numéro du document', type: 'text', sensitive: false },
            { id: 'f_issue', label: 'Date de délivrance', type: 'date', sensitive: false },
            { id: 'f_exp', label: 'Date d\'expiration', type: 'date', sensitive: false },
            { id: 'f_place', label: 'Lieu de délivrance', type: 'text', sensitive: false }
        ],
        'comptes': [
            { id: 'f_owner', label: 'Titulaire du compte', type: 'text', sensitive: false },
            { id: 'f_iban', label: 'IBAN', type: 'text', sensitive: true },
            { id: 'f_bic', label: 'BIC/SWIFT', type: 'text', sensitive: false },
            { id: 'f_num', label: 'Numéro de compte', type: 'text', sensitive: false },
            { id: 'f_agency', label: 'Agence', type: 'text', sensitive: false }
        ],
        'codes': [
            { id: 'f_code', label: 'Code / PIN', type: 'password', sensitive: true }
        ],
        'medical': [
            { id: 'f_blood', label: 'Groupe sanguin', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], sensitive: false },
            { id: 'f_allergies', label: 'Allergies', type: 'textarea', sensitive: false },
            { id: 'f_treatments', label: 'Traitements en cours', type: 'textarea', sensitive: false },
            { id: 'f_doctor', label: 'Médecin traitant', type: 'text', sensitive: false },
            { id: 'f_secu', label: 'N° Sécurité sociale', type: 'text', sensitive: true },
            { id: 'f_mutuelle', label: 'Mutuelle', type: 'text', sensitive: false },
            { id: 'f_mutuelle_num', label: 'N° adhérent mutuelle', type: 'text', sensitive: false }
        ],
        'assurances': [
            { id: 'f_type', label: 'Type', type: 'select', options: ['Auto', 'Habitation', 'Santé complémentaire', 'Vie', 'Responsabilité civile', 'Autre'], sensitive: false },
            { id: 'f_contract', label: 'N° de contrat', type: 'text', sensitive: false },
            { id: 'f_phone', label: 'Téléphone assistance', type: 'tel', sensitive: false },
            { id: 'f_exp', label: 'Date d\'échéance', type: 'date', sensitive: false }
        ],
        'licences': [
            { id: 'f_key', label: 'Clé de licence / N° abonnement', type: 'text', sensitive: true },
            { id: 'f_email', label: 'Email du compte', type: 'email', sensitive: false },
            { id: 'f_exp', label: 'Date de renouvellement', type: 'date', sensitive: false }
        ],
        'notes': [
            { id: 'f_content', label: 'Contenu', type: 'textarea', sensitive: false }
        ]
    };

    function renderFields(category) {
        const template = categoryTemplates[category] || [];
        return template.map(t => {
            const existingField = entry.fields ? entry.fields.find(f => f.label === t.label) : null;
            const val = existingField ? escapeHTML(existingField.value) : '';

            let inputHtml = '';
            if (t.type === 'select') {
                const opts = t.options.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('');
                inputHtml = `<select id="${t.id}" class="cat-field" data-label="${t.label}" data-sensitive="${t.sensitive}">${opts}</select>`;
            } else if (t.type === 'textarea') {
                inputHtml = `<textarea id="${t.id}" class="cat-field" data-label="${t.label}" data-sensitive="${t.sensitive}" rows="3">${val}</textarea>`;
            } else {
                inputHtml = `<input type="${t.type}" id="${t.id}" class="cat-field" data-label="${t.label}" data-sensitive="${t.sensitive}" value="${val}">`;
            }

            return `
                <div class="form-group mb-2">
                    <label>${t.label}</label>
                    ${inputHtml}
                </div>
            `;
        }).join('');
    }

    let fieldsHtml = renderFields(entry.category);

    const html = `
        <h3 class="mb-4">${modalTitle}</h3>
        <form id="vaultForm" class="flex-col gap-4">
            <div class="flex gap-4">
                <div class="form-group flex-1">
                    <label>Titre (Ex: Nom du site, Nom de la banque)</label>
                    <input type="text" id="v_title" value="${escapeHTML(entry.title)}" required>
                </div>
                <div class="form-group flex-1">
                    <label>Catégorie</label>
                    <select id="v_category" required>${catOptions}</select>
                </div>
            </div>

            <div id="v_fields_container" class="mt-2 border p-4 border-gray-700 rounded bg-opacity-20" style="background: rgba(0,0,0,0.2)">
                ${fieldsHtml}
            </div>

            <div class="form-group">
                <label>Notes supplémentaires</label>
                <textarea id="v_notes" rows="2">${escapeHTML(entry.notes || '')}</textarea>
            </div>

            <div class="vault-item mt-4" style="background: rgba(255,163,17,0.1); border: 1px solid var(--accent-warning);">
                <label class="flex items-center gap-2 font-bold text-accent-warning cursor-pointer">
                    <input type="checkbox" id="v_isLocked" ${entry.isLocked ? 'checked' : ''}>
                    Verrouiller cette entrée (Accès externe)
                </label>
                <div id="v_lockDetails" class="${entry.isLocked ? '' : 'hidden'} mt-4">
                    <p class="text-sm mb-2 text-muted">Exige un mot de passe spécifique pour voir cette entrée depuis l'accès Vault externe.</p>
                    <div class="flex gap-4">
                        <input type="text" id="v_lockName" value="${escapeHTML(entry.lockName || '')}" placeholder="Prénom de la personne">
                        <input type="password" id="v_lockPwd" value="${escapeHTML(entry.lockPassword || '')}" placeholder="Mot de passe spécifique">
                    </div>
                </div>
            </div>

            <div class="flex justify-between mt-4">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary" id="v_saveBtn">${isEdit ? 'Sauvegarder' : 'Ajouter'}</button>
            </div>
        </form>
    `;

    openModal(html);

    setTimeout(() => {
        const lockCheckbox = document.getElementById('v_isLocked');
        const lockDetails = document.getElementById('v_lockDetails');
        lockCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) lockDetails.classList.remove('hidden');
            else lockDetails.classList.add('hidden');
        });

        const catSelect = document.getElementById('v_category');
        catSelect.addEventListener('change', (e) => {
            const newCat = e.target.value;
            entry.category = newCat; // Temporary update for render
            document.getElementById('v_fields_container').innerHTML = renderFields(newCat);
        });

        document.getElementById('vaultForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            document.getElementById('v_saveBtn').disabled = true;

            entry.title = document.getElementById('v_title').value;
            entry.category = document.getElementById('v_category').value;
            entry.notes = document.getElementById('v_notes').value;

            entry.isLocked = document.getElementById('v_isLocked').checked;
            if(entry.isLocked) {
                entry.lockName = document.getElementById('v_lockName').value;
                entry.lockPassword = document.getElementById('v_lockPwd').value;
            } else {
                entry.lockName = '';
                entry.lockPassword = '';
            }

            // Gather fields
            entry.fields = [];
            document.querySelectorAll('.cat-field').forEach(input => {
                const label = input.getAttribute('data-label');
                const value = input.value;
                const isSensitive = input.getAttribute('data-sensitive') === 'true';
                if(label || value) {
                    entry.fields.push({ label, value, isSensitive });
                }
            });

            if (isEdit) {
                const index = state.vault.findIndex(v => v.id === entryId);
                if(index > -1) state.vault[index] = entry;
            } else {
                state.vault.push(entry);
            }

            await saveVault();
            closeModal();
            renderVaultList();
            showToast("Entrée sauvegardée", "success");
        });
    }, 100);
}

async function deleteVaultEntry(id) {
    const confirmed = await confirmDialog("Voulez-vous vraiment supprimer cette entrée ?");
    if (!confirmed) return;

    state.vault = state.vault.filter(v => v.id !== id);
    await saveVault();
    renderVaultList();
    showToast("Entrée supprimée", "info");
}

async function saveVault() {
    state.serverData.vaultData = encryptData(state.vault, state.passwords.vault);
    await api.save(state.serverData);
}


// --- Testament Logic ---
let testamentSaveTimer = null;

function initTestament() {
    state.quill = new Quill('#testamentEditor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'color': [] }, { 'background': [] }],
                ['link', 'clean']
            ]
        }
    });

    if (state.serverData.testamentData) {
        state.testament = decryptData(state.serverData.testamentData, state.passwords.testament) || { content: '', lastModified: null, identity: {} };
        if (state.testament.content) {
            state.quill.root.innerHTML = state.testament.content;
        }
        if (state.testament.identity) {
            document.getElementById('t_nom').value = state.testament.identity.nom || '';
            document.getElementById('t_prenom').value = state.testament.identity.prenom || '';
            document.getElementById('t_date_naissance').value = state.testament.identity.date_naissance || '';
            document.getElementById('t_lieu_naissance').value = state.testament.identity.lieu_naissance || '';
            document.getElementById('t_nationalite').value = state.testament.identity.nationalite || '';
            document.getElementById('t_adresse').value = state.testament.identity.adresse || '';
        }
        updateTestamentStatus();
    }

    state.quill.on('text-change', () => {
        document.getElementById('testamentStatus').innerText = "Modifications non sauvegardées...";
        clearTimeout(testamentSaveTimer);
        testamentSaveTimer = setTimeout(saveTestament, 30000); // Auto-save after 30s
    });

    document.getElementById('exportTestamentBtn').addEventListener('click', () => {
        exportTestamentPDF();
    });

    document.getElementById('saveTestamentBtn').addEventListener('click', () => {
        saveTestament();
    });
}

async function saveTestament() {
    state.testament.content = state.quill.root.innerHTML;
    state.testament.lastModified = new Date().toISOString();

    state.testament.identity = {
        nom: document.getElementById('t_nom').value,
        prenom: document.getElementById('t_prenom').value,
        date_naissance: document.getElementById('t_date_naissance').value,
        lieu_naissance: document.getElementById('t_lieu_naissance').value,
        nationalite: document.getElementById('t_nationalite').value,
        adresse: document.getElementById('t_adresse').value
    };

    state.serverData.testamentData = encryptData(state.testament, state.passwords.testament);
    await api.save(state.serverData);

    updateTestamentStatus();
    showToast("Testament sauvegardé", "success");
}

function updateTestamentStatus() {
    const statusEl = document.getElementById('testamentStatus');
    if (state.testament.lastModified) {
        statusEl.innerText = `Dernière sauvegarde : ${formatDateFR(state.testament.lastModified)}`;
    } else {
        statusEl.innerText = `Dernière sauvegarde : Jamais`;
    }
}

function exportTestamentPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Mon Testament", 20, 20);

    if(state.testament.lastModified) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Dernière mise à jour : ${formatDateFR(state.testament.lastModified)}`, 20, 30);
    }

    doc.setFontSize(12);
    const contentText = state.quill.getText();
    const splitText = doc.splitTextToSize(contentText, 170);

    doc.text(splitText, 20, 45);
    doc.save("Testament.pdf");
}

// --- Settings Logic ---
function loadSettings() {
    // Access Logs
    const logsContainer = document.getElementById('accessLogsContainer');
    logsContainer.innerHTML = '';

    let logs = [];
    if(state.serverData.accessLogs) {
        logs = decryptData(state.serverData.accessLogs, state.adminKey) || [];
    }

    if(logs.length === 0) {
        logsContainer.innerHTML = `<div class="p-4 text-center text-muted">Aucun accès récent.</div>`;
    } else {
        // Show last 10 logs
        logs.slice(-10).reverse().forEach(log => {
            const row = document.createElement('div');
            row.className = 'vault-item border-l-4 border-accent-main p-3 mb-2';
            row.style.borderLeftColor = log.action === 'panic' ? 'var(--accent-danger)' : 'var(--accent-main)';
            row.innerHTML = `
                <div class="flex justify-between">
                    <span class="font-bold text-sm">${formatDateFR(log.timestamp)}</span>
                    <span class="text-sm px-2 rounded bg-opacity-20 ${log.action === 'panic' ? 'bg-accent-danger text-accent-danger' : 'bg-accent-main text-accent-main'}">${escapeHTML(log.action)}</span>
                </div>
                <div class="text-sm text-muted mt-1">
                    IP: ${escapeHTML(log.ip)} - ${escapeHTML(log.name || 'Inconnu')} - Cible: ${escapeHTML(log.space || 'Système')}
                </div>
            `;
            logsContainer.appendChild(row);
        });
    }

    // Emergency Message
    const msgInput = document.getElementById('settingsEmergencyMsg');
    if (state.serverData.emergencyMessage) {
        msgInput.value = decryptData(state.serverData.emergencyMessage, state.adminKey) || '';
    }

    document.getElementById('saveEmergencyMsgBtn').addEventListener('click', async () => {
        const msg = msgInput.value;
        const btn = document.getElementById('saveEmergencyMsgBtn');
        btn.disabled = true;

        state.serverData.emergencyMessage = encryptData(msg, state.adminKey);
        state.serverData.emergencyMessageForEmergency = encryptData(msg, state.passwords.emergency);

        await api.save(state.serverData);
        showToast("Message d'urgence sauvegardé", "success");
        btn.disabled = false;
    });

    // Change Password
    document.getElementById('changePwdBtn').addEventListener('click', () => {
        showChangePasswordModal();
    });
}

function showChangePasswordModal() {
    openModal(`
        <h3 class="mb-4">Modifier les mots de passe</h3>
        <form id="changePwdForm" class="flex-col gap-4">
            <div class="form-group mb-4">
                <label>Mot de passe Admin Actuel (Requis pour continuer)</label>
                <input type="password" id="cp_currentAdmin" required>
            </div>

            <hr class="border-gray-700 my-4">
            <p class="text-sm text-muted mb-2">Laissez vide les mots de passe que vous ne souhaitez pas modifier.</p>

            <div class="flex gap-4">
                <div class="form-group flex-1">
                    <label>Nouveau Admin (min 8 chars)</label>
                    <input type="password" id="cp_newAdmin">
                </div>
                <div class="form-group flex-1">
                    <label>Nouveau Urgence/Contacts (min 6)</label>
                    <input type="password" id="cp_newEmergency">
                </div>
            </div>

            <div class="flex gap-4">
                <div class="form-group flex-1">
                    <label>Nouveau Vault (min 6 chars)</label>
                    <input type="password" id="cp_newVault">
                </div>
                <div class="form-group flex-1">
                    <label>Nouveau Testament (min 6 chars)</label>
                    <input type="password" id="cp_newTestament">
                </div>
            </div>

            <div id="cp_error" class="error-message text-center mt-2"></div>

            <div class="flex justify-between mt-4">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary" id="cp_saveBtn">Appliquer & Re-chiffrer</button>
            </div>
        </form>
    `);

    setTimeout(() => {
        document.getElementById('changePwdForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentAdmin = document.getElementById('cp_currentAdmin').value;
            const newAdmin = document.getElementById('cp_newAdmin').value;
            const newEmergency = document.getElementById('cp_newEmergency').value;
            const newVault = document.getElementById('cp_newVault').value;
            const newTestament = document.getElementById('cp_newTestament').value;

            const errorDiv = document.getElementById('cp_error');
            const saveBtn = document.getElementById('cp_saveBtn');

            if (hashPassword(currentAdmin) !== state.serverData.adminHash) {
                errorDiv.innerText = "Mot de passe admin actuel incorrect.";
                return;
            }

            if (!newAdmin && !newEmergency && !newVault && !newTestament) {
                errorDiv.innerText = "Aucun nouveau mot de passe saisi.";
                return;
            }

            // Validations
            if (newAdmin && newAdmin.length < 8) return errorDiv.innerText = "Admin min 8 caractères.";
            if (newEmergency && newEmergency.length < 6) return errorDiv.innerText = "Urgence min 6 caractères.";
            if (newVault && newVault.length < 6) return errorDiv.innerText = "Vault min 6 caractères.";
            if (newTestament && newTestament.length < 6) return errorDiv.innerText = "Testament min 6 caractères.";

            const finalAdmin = newAdmin || state.adminKey;
            const finalEmergency = newEmergency || state.passwords.emergency;
            const finalVault = newVault || state.passwords.vault;
            const finalTestament = newTestament || state.passwords.testament;

            // Check uniqueness
            const pwdSet = new Set([finalAdmin, finalEmergency, finalVault, finalTestament]);
            if (pwdSet.size !== 4) {
                return errorDiv.innerText = "Les 4 mots de passe doivent être tous différents.";
            }

            saveBtn.disabled = true;
            errorDiv.innerText = "Re-chiffrement en cours, veuillez patienter...";
            errorDiv.style.color = "var(--text-main)";

            try {
                // Prepare new hashes
                state.serverData.adminHash = hashPassword(finalAdmin);
                state.serverData.emergencyHash = hashPassword(finalEmergency);
                state.serverData.vaultHash = hashPassword(finalVault);
                state.serverData.testamentHash = hashPassword(finalTestament);

                // Re-encrypt keys with new admin key
                state.serverData.encryptedEmergencyPassword = encryptData(finalEmergency, finalAdmin);
                state.serverData.encryptedVaultPassword = encryptData(finalVault, finalAdmin);
                state.serverData.encryptedTestamentPassword = encryptData(finalTestament, finalAdmin);

                // Re-encrypt data payload
                state.serverData.contacts = encryptData(state.contacts, finalAdmin);
                state.serverData.emergencyContacts = encryptData(state.contacts, finalEmergency);
                state.serverData.vaultData = encryptData(state.vault, finalVault);

                // For testament, need to ensure we have latest content
                if (state.quill) state.testament.content = state.quill.root.innerHTML;
                state.serverData.testamentData = encryptData(state.testament, finalTestament);

                // Emergency message
                const currentMsg = document.getElementById('settingsEmergencyMsg').value;
                state.serverData.emergencyMessage = encryptData(currentMsg, finalAdmin);
                state.serverData.emergencyMessageForEmergency = encryptData(currentMsg, finalEmergency);

                // Logs (keep with admin key)
                let logs = decryptData(state.serverData.accessLogs, state.adminKey) || [];
                state.serverData.accessLogs = encryptData(logs, finalAdmin);

                await api.save(state.serverData);

                // Update session
                sessionStorage.setItem('adminKey', finalAdmin);

                closeModal();
                showToast("Mots de passe mis à jour et données re-chiffrées avec succès", "success");

                setTimeout(() => {
                    window.location.reload();
                }, 2000);

            } catch (err) {
                console.error(err);
                errorDiv.innerText = "Erreur lors du re-chiffrement. Données non modifiées.";
                errorDiv.style.color = "var(--accent-danger)";
                saveBtn.disabled = false;
            }
        });
    }, 100);
}

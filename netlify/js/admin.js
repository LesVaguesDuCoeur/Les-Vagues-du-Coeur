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
        if(contact.phone) linksHtml += `<a href="tel:${contact.phone}" class="mr-2" style="color:var(--accent-main)"><i class="fas fa-phone"></i></a>`;
        if(contact.email) linksHtml += `<a href="mailto:${contact.email}" class="mr-2" style="color:var(--accent-main)"><i class="fas fa-envelope"></i></a>`;
        if(contact.whatsapp) linksHtml += `<a href="https://wa.me/${contact.whatsapp}" target="_blank" class="mr-2" style="color:var(--accent-success)"><i class="fab fa-whatsapp"></i></a>`;

        const row = document.createElement('div');
        row.className = 'vault-item flex justify-between items-center';
        row.style.borderLeft = `4px solid ${borderCol}`;
        row.style.marginBottom = '0.5rem';
        row.style.padding = '1rem';

        row.innerHTML = `
            <div>
                <div class="font-bold">${escapeHTML(contact.name)} <span class="text-sm text-muted font-normal ml-2">${escapeHTML(contact.relation)}</span></div>
                <div class="text-sm text-muted mt-2">${linksHtml}</div>
            </div>
            <div class="flex gap-2">
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

    const optionsHtml = relationsOptions.map(opt =>
        `<option value="${opt}" ${contact.relation === opt ? 'selected' : ''}>${opt}</option>`
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
                </div>
            </div>
            <div class="form-group">
                <label>Importance (1=Vital, 5=Faible)</label>
                <input type="range" id="c_importance" min="1" max="5" value="${contact.importance}">
                <div class="flex justify-between text-sm text-muted mt-1">
                    <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
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
        document.getElementById('contactForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            document.getElementById('c_saveBtn').disabled = true;

            contact.name = document.getElementById('c_name').value;
            contact.relation = document.getElementById('c_relation').value;
            contact.importance = parseInt(document.getElementById('c_importance').value, 10);
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
                let copyBtn = `<i class="fas fa-copy ml-2 cursor-pointer text-muted" onclick="navigator.clipboard.writeText('${f.value.replace(/'/g, "\\'")}')" title="Copier"></i>`;

                if (f.isSensitive) {
                    displayVal = '••••••••';
                    let realVal = escapeHTML(f.value).replace(/'/g, "\\'");
                    copyBtn = `
                        <i class="fas fa-eye ml-2 cursor-pointer text-muted" onclick="this.previousElementSibling.innerText = this.previousElementSibling.innerText === '••••••••' ? '${realVal}' : '••••••••'" title="Révéler"></i>
                        <i class="fas fa-copy ml-2 cursor-pointer text-muted" onclick="navigator.clipboard.writeText('${realVal}')" title="Copier"></i>
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

    // Pre-render fields
    let fieldsHtml = entry.fields.map((f, i) => `
        <div class="flex gap-2 items-center mb-2 field-row" data-index="${i}">
            <input type="text" class="f-label w-64" value="${escapeHTML(f.label)}" placeholder="Nom du champ (ex: Username)">
            <input type="${f.isSensitive ? 'password' : 'text'}" class="f-value flex-1" value="${escapeHTML(f.value)}" placeholder="Valeur">
            <label class="flex items-center gap-1 text-sm"><input type="checkbox" class="f-sensitive" ${f.isSensitive ? 'checked' : ''}> Masquer</label>
            <button type="button" class="btn btn-icon text-accent-danger remove-field"><i class="fas fa-times"></i></button>
        </div>
    `).join('');

    const html = `
        <h3 class="mb-4">${modalTitle}</h3>
        <form id="vaultForm" class="flex-col gap-4">
            <div class="flex gap-4">
                <div class="form-group flex-1">
                    <label>Titre</label>
                    <input type="text" id="v_title" value="${escapeHTML(entry.title)}" required>
                </div>
                <div class="form-group flex-1">
                    <label>Catégorie</label>
                    <select id="v_category" required>${catOptions}</select>
                </div>
            </div>

            <div class="form-group">
                <label>Champs</label>
                <div id="v_fields_container">${fieldsHtml}</div>
                <button type="button" id="v_addFieldBtn" class="btn btn-sm btn-secondary mt-2"><i class="fas fa-plus"></i> Ajouter un champ</button>
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

        document.getElementById('v_addFieldBtn').addEventListener('click', () => {
            const container = document.getElementById('v_fields_container');
            const row = document.createElement('div');
            row.className = 'flex gap-2 items-center mb-2 field-row';
            row.innerHTML = `
                <input type="text" class="f-label w-64" placeholder="Nom du champ">
                <input type="text" class="f-value flex-1" placeholder="Valeur">
                <label class="flex items-center gap-1 text-sm"><input type="checkbox" class="f-sensitive"> Masquer</label>
                <button type="button" class="btn btn-icon text-accent-danger remove-field"><i class="fas fa-times"></i></button>
            `;
            container.appendChild(row);
        });

        document.getElementById('v_fields_container').addEventListener('click', (e) => {
            const btn = e.target.closest('.remove-field');
            if(btn) btn.closest('.field-row').remove();
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
            document.querySelectorAll('.field-row').forEach(row => {
                const label = row.querySelector('.f-label').value;
                const value = row.querySelector('.f-value').value;
                const isSensitive = row.querySelector('.f-sensitive').checked;
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
        state.testament = decryptData(state.serverData.testamentData, state.passwords.testament) || { content: '', lastModified: null };
        if (state.testament.content) {
            state.quill.root.innerHTML = state.testament.content;
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
}

async function saveTestament() {
    state.testament.content = state.quill.root.innerHTML;
    state.testament.lastModified = new Date().toISOString();

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

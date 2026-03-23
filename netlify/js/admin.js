document.addEventListener('DOMContentLoaded', async () => {
    // Session Verification
    const adminKey = sessionStorage.getItem('adminKey');
    if (!adminKey) {
        window.location.href = 'index.html';
        return;
    }

    setupAutoLock(30);

    // Global App State
    const AppState = {
        data: null,
        contacts: [],
        vaultData: [],
        testamentData: "",
        vaultKey: null,
        testamentKey: null,
        emergencyMsg: ""
    };

    // Load Data
    try {
        const encryptedPayload = await api.load();
        if (!encryptedPayload.isSetup) throw new Error("App not setup");

        AppState.data = encryptedPayload;

        // Decrypt keys stored during setup
        AppState.vaultKey = decryptData(encryptedPayload.encryptedVaultPassword, adminKey);
        AppState.testamentKey = decryptData(encryptedPayload.encryptedTestamentPassword, adminKey);

        if (!AppState.vaultKey || !AppState.testamentKey) {
            throw new Error("Impossible de déchiffrer les clés secondaires.");
        }

        AppState.contacts = decryptData(encryptedPayload.contacts, adminKey) || [];
        AppState.vaultData = decryptData(encryptedPayload.vaultData, AppState.vaultKey) || [];
        AppState.testamentData = decryptData(encryptedPayload.testamentData, AppState.testamentKey) || "";

        AppState.encryptedEmergencyMsg = encryptedPayload.emergencyMessage;
        let derivedEkey = sessionStorage.getItem('derivedEmergencyKey');
        AppState.emergencyMsg = derivedEkey ? decryptData(encryptedPayload.emergencyMessage, derivedEkey) : "";

        initUI();
    } catch (e) {
        console.error(e);
        showAlert("Session expirée ou erreur de déchiffrement.");
        sessionStorage.clear();
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }

    // --- Navigation ---
    const navTabs = document.querySelectorAll('.nav-tab');
    const sections = document.querySelectorAll('.tab-content');
    const navTitle = document.getElementById('navTitle');

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            sections.forEach(s => s.classList.add('hidden'));
            const target = tab.getAttribute('data-target');
            document.getElementById(target).classList.remove('hidden');

            navTitle.innerText = tab.querySelector('.tab-label').innerText;

            if (target === 'contacts-section') renderContacts();
            if (target === 'vault-section') renderVaultCategories();
            if (target === 'settings-section') renderSettings();
        });
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

    // --- Helpers ---
    async function saveAllData(emergencyKeyPrompt = null) {
        try {
            let eKey = sessionStorage.getItem('derivedEmergencyKey') || emergencyKeyPrompt;
            if (!eKey) {
                return new Promise((resolve, reject) => {
                    showPrompt("Veuillez saisir le mot de passe Urgence pour mettre à jour la vue publique :", "password", async (val) => {
                        if (hashPassword(val) === AppState.data.emergencyHash) {
                            sessionStorage.setItem('derivedEmergencyKey', val);
                            resolve(await saveAllData(val));
                        } else {
                            showAlert("Mot de passe urgence incorrect. Sauvegarde annulée.");
                            reject(new Error("Invalid emergency key"));
                        }
                    });
                });
            }

            let publicLogs = AppState.data.publicAccessLogs || [];
            let encryptedLogs = decryptData(AppState.data.accessLogs, adminKey) || [];
            let allLogs = [...publicLogs.reverse(), ...encryptedLogs].slice(0, 50);

            if (!AppState.emergencyMsg && eKey && AppState.encryptedEmergencyMsg) {
                AppState.emergencyMsg = decryptData(AppState.encryptedEmergencyMsg, eKey) || "";
            }

            const payload = {
                ...AppState.data,
                contacts: encryptData(AppState.contacts, adminKey),
                emergencyContacts: encryptData(AppState.contacts, eKey),
                vaultData: encryptData(AppState.vaultData, AppState.vaultKey),
                testamentData: encryptData(AppState.testamentData, AppState.testamentKey),
                emergencyMessage: encryptData(AppState.emergencyMsg, eKey),
                accessLogs: encryptData(allLogs, adminKey),
                publicAccessLogs: []
            };

            showToast("Sauvegarde en cours...", "info");
            const res = await api.save(payload);
            if (res.success) {
                AppState.data = payload;
                showToast("Sauvegardé avec succès", "success");
            } else {
                showToast("Erreur de sauvegarde", "error");
            }
        } catch (e) {
            console.error(e);
        }
    }

    // --- Contacts Logic ---
    function renderContacts() {
        const list = document.getElementById('contactsList');
        const search = document.getElementById('contactSearch').value.toLowerCase();

        list.innerHTML = '';

        let filtered = AppState.contacts.filter(c =>
            c.name.toLowerCase().includes(search) ||
            (c.relation && c.relation.toLowerCase().includes(search))
        );

        filtered.sort((a, b) => a.importance - b.importance);

        filtered.forEach(c => {
            const div = document.createElement('div');
            div.className = `contact-item priority-${c.importance}`;
            div.innerHTML = `
                <div class="contact-info">
                    <div class="contact-name">${escapeHTML(c.name)}</div>
                    <div class="contact-relation">${escapeHTML(c.relation)} - Niveau ${c.importance}</div>
                </div>
                <div class="contact-actions">
                    <button class="btn-icon btn-edit-contact" data-id="${c.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-delete-contact" data-id="${c.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            list.appendChild(div);
        });

        document.querySelectorAll('.btn-edit-contact').forEach(btn => {
            btn.addEventListener('click', (e) => openContactModal(e.currentTarget.getAttribute('data-id')));
        });
        document.querySelectorAll('.btn-delete-contact').forEach(btn => {
            btn.addEventListener('click', (e) => deleteContact(e.currentTarget.getAttribute('data-id')));
        });
    }

    document.getElementById('contactSearch').addEventListener('input', renderContacts);
    document.getElementById('addContactBtn').addEventListener('click', () => openContactModal());

    function openContactModal(id = null) {
        const contact = id ? AppState.contacts.find(c => c.id === id) : {
            id: Date.now().toString(), name: '', relation: 'Ami(e) proche', importance: '3',
            phone: '', email: '', snapchat: '', instagram: '', messenger: '', whatsapp: '', telegram: '', notes: '', otherRelation: ''
        };

        const allRelations = ['Mère', 'Père', 'Frère', 'Sœur', 'Demi-frère', 'Demi-sœur', 'Grand-père', 'Grand-mère', 'Oncle', 'Tante', 'Cousin(e)', 'Fils', 'Fille', 'Conjoint(e)', 'Ex-conjoint(e)', 'Ami(e) proche', 'Meilleur(e) ami(e)', 'Connaissance', 'Collègue', 'Patron/Manager', 'Associé(e)', 'Client', 'Médecin', 'Avocat', 'Notaire', 'Comptable', 'Banquier', 'Assureur', 'Voisin(e)', 'Propriétaire/Bailleur', 'Professeur', 'Famille éloignée', 'Autre'];

        const modalHtml = `
            <div class="custom-modal-overlay" id="contactModal">
                <div class="custom-modal-dialog" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
                    <h3 class="mb-4">${id ? 'Modifier' : 'Ajouter'} un contact</h3>
                    <div class="form-group">
                        <label>Nom complet *</label>
                        <input type="text" id="c_name" value="${escapeHTML(contact.name)}">
                    </div>
                    <div class="flex gap-4">
                        <div class="form-group flex-1">
                            <label>Relation *</label>
                            <select id="c_relation">
                                ${allRelations.map(r => `<option value="${r}" ${contact.relation === r ? 'selected' : ''}>${r}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group flex-1 ${contact.relation === 'Autre' ? '' : 'hidden'}" id="c_otherRelGroup">
                            <label>Précisez</label>
                            <input type="text" id="c_otherRel" value="${escapeHTML(contact.otherRelation)}">
                        </div>
                        <div class="form-group flex-1">
                            <label>Importance * (1 = Max)</label>
                            <select id="c_importance">
                                ${[1,2,3,4,5].map(i => `<option value="${i}" ${contact.importance == i ? 'selected' : ''}>${i}</option>`).join('')}
                            </select>
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
                            <label>WhatsApp (sans +)</label>
                            <input type="text" id="c_whatsapp" value="${escapeHTML(contact.whatsapp)}">
                        </div>
                        <div class="form-group flex-1">
                            <label>Telegram (@)</label>
                            <input type="text" id="c_telegram" value="${escapeHTML(contact.telegram)}">
                        </div>
                    </div>
                    <div class="flex gap-4">
                        <div class="form-group flex-1">
                            <label>Snapchat (@)</label>
                            <input type="text" id="c_snapchat" value="${escapeHTML(contact.snapchat)}">
                        </div>
                        <div class="form-group flex-1">
                            <label>Instagram (@)</label>
                            <input type="text" id="c_instagram" value="${escapeHTML(contact.instagram)}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Messenger (ID)</label>
                        <input type="text" id="c_messenger" value="${escapeHTML(contact.messenger)}">
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea id="c_notes" rows="2">${escapeHTML(contact.notes)}</textarea>
                    </div>
                    <div class="flex justify-between mt-4">
                        <button class="btn btn-secondary" id="cancelContactBtn">Annuler</button>
                        <button class="btn btn-primary" id="saveContactBtn">Sauvegarder</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalContainer').innerHTML = modalHtml;

        document.getElementById('c_relation').addEventListener('change', (e) => {
            document.getElementById('c_otherRelGroup').classList.toggle('hidden', e.target.value !== 'Autre');
        });

        document.getElementById('cancelContactBtn').addEventListener('click', () => {
            document.getElementById('modalContainer').innerHTML = '';
        });

        document.getElementById('saveContactBtn').addEventListener('click', async () => {
            const name = document.getElementById('c_name').value.trim();
            if (!name) return showAlert("Le nom est obligatoire.");

            contact.name = name;
            contact.relation = document.getElementById('c_relation').value;
            contact.otherRelation = document.getElementById('c_otherRel').value;
            contact.importance = document.getElementById('c_importance').value;
            contact.phone = document.getElementById('c_phone').value;
            contact.email = document.getElementById('c_email').value;
            contact.whatsapp = document.getElementById('c_whatsapp').value;
            contact.telegram = document.getElementById('c_telegram').value;
            contact.snapchat = document.getElementById('c_snapchat').value;
            contact.instagram = document.getElementById('c_instagram').value;
            contact.messenger = document.getElementById('c_messenger').value;
            contact.notes = document.getElementById('c_notes').value;

            if (id) {
                const idx = AppState.contacts.findIndex(c => c.id === id);
                if (idx > -1) AppState.contacts[idx] = contact;
            } else {
                AppState.contacts.push(contact);
            }

            document.getElementById('modalContainer').innerHTML = '';
            renderContacts();
            await saveAllData();
        });
    }

    function deleteContact(id) {
        showConfirm("Supprimer ce contact ?", async () => {
            AppState.contacts = AppState.contacts.filter(c => c.id !== id);
            renderContacts();
            await saveAllData();
        });
    }

    // --- Vault Logic ---
    const vaultCategoriesList = [
        { id: 'ids', name: 'Identifiants & Mots de passe', icon: 'fa-key' },
        { id: 'cards', name: 'Cartes bancaires', icon: 'fa-credit-card' },
        { id: 'docs', name: 'Documents d\'identité', icon: 'fa-id-card' },
        { id: 'accounts', name: 'Comptes bancaires', icon: 'fa-university' },
        { id: 'codes', name: 'Codes & PIN divers', icon: 'fa-lock' },
        { id: 'medical', name: 'Informations médicales', icon: 'fa-heartbeat' },
        { id: 'insurance', name: 'Assurances', icon: 'fa-shield-alt' },
        { id: 'subscriptions', name: 'Licences & Abonnements', icon: 'fa-barcode' },
        { id: 'notes', name: 'Notes libres', icon: 'fa-sticky-note' }
    ];
    let currentVaultCategory = 'ids';

    function renderVaultCategories() {
        const container = document.getElementById('vaultCategories');
        container.innerHTML = '';
        vaultCategoriesList.forEach(cat => {
            const div = document.createElement('div');
            div.className = `vault-category ${cat.id === currentVaultCategory ? 'active' : ''}`;
            div.innerHTML = `<i class="fas ${cat.icon} w-6 text-center"></i> <span>${cat.name}</span>`;
            div.addEventListener('click', () => {
                currentVaultCategory = cat.id;
                document.getElementById('currentCategoryTitle').innerText = cat.name;
                renderVaultCategories();
                renderVaultItems();
            });
            container.appendChild(div);
        });
        renderVaultItems();
    }

    function renderVaultItems() {
        const container = document.getElementById('vaultList');
        container.innerHTML = '';

        const items = AppState.vaultData.filter(i => i.categoryId === currentVaultCategory);

        if (items.length === 0) {
            container.innerHTML = '<p class="text-muted text-center mt-8">Aucune entrée dans cette catégorie.</p>';
            return;
        }

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'vault-item fade-in';
            div.innerHTML = `
                <div class="vault-item-header">
                    <div class="vault-item-title">
                        ${escapeHTML(item.name)}
                        ${item.locked ? `<i class="fas fa-lock text-accent-warning" title="Verrouillé pour ${escapeHTML(item.lockedFor)}"></i>` : ''}
                    </div>
                    <div class="flex gap-2">
                        <button class="btn-icon btn-edit-vault" data-id="${item.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon btn-delete-vault" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                ${Object.entries(item.fields).map(([k, v]) => {
                    if (k === '_encrypted' || k === '_adminEncrypted') return '';
                    return `
                    <div class="vault-field">
                        <span class="vault-field-label">${escapeHTML(k)}</span>
                        <span class="vault-field-value">
                            <span class="truncate max-w-[200px]">${v.type === 'password' ? '••••••••' : escapeHTML(v.value)}</span>
                        </span>
                    </div>
                    `;
                }).join('')}
                ${(() => {
                    if (item.locked && item.fields['_adminEncrypted']) {
                        try {
                            const decryptedObj = JSON.parse(decryptData(item.fields['_adminEncrypted'], adminKey));
                            return Object.entries(decryptedObj).map(([dk, dv]) => `
                                <div class="vault-field mt-1 border-t border-gray-700 pt-1">
                                    <span class="vault-field-label text-accent-success">${escapeHTML(dk)}</span>
                                    <span class="vault-field-value text-accent-success">
                                        <span class="truncate max-w-[200px]" id="val-${item.id}-admin-${dk}">${dv.type === 'password' ? '••••••••' : escapeHTML(dv.value)}</span>
                                        <div class="flex gap-2 text-white">
                                            <button class="btn-icon text-xs btn-reveal" data-target="val-${item.id}-admin-${dk}" data-val="${escapeHTML(dv.value)}"><i class="fas fa-eye"></i></button>
                                            <button class="btn-icon text-xs btn-copy" data-val="${escapeHTML(dv.value)}"><i class="fas fa-copy"></i></button>
                                        </div>
                                    </span>
                                </div>
                            `).join('');
                        } catch(e) {
                            return `<div class="vault-field mt-2 border-t border-gray-700 pt-2 text-accent-danger">Erreur déchiffrement Admin</div>`;
                        }
                    }
                    return '';
                })()}
            `;
            container.appendChild(div);
        });

        document.querySelectorAll('.btn-edit-vault').forEach(btn => {
            btn.addEventListener('click', (e) => openVaultModal(e.currentTarget.getAttribute('data-id')));
        });
        document.querySelectorAll('.btn-delete-vault').forEach(btn => {
            btn.addEventListener('click', (e) => deleteVaultItem(e.currentTarget.getAttribute('data-id')));
        });

        // Add event listeners for new elements
        document.querySelectorAll('.btn-reveal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');
                const val = e.currentTarget.getAttribute('data-val');
                const span = document.getElementById(targetId);
                const isHidden = span.innerText === '••••••••';
                span.innerText = isHidden ? val : '••••••••';
                e.currentTarget.innerHTML = isHidden ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
            });
        });

        document.querySelectorAll('.btn-copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = e.currentTarget.getAttribute('data-val');
                navigator.clipboard.writeText(val).then(() => showToast("Copié", "success"));
            });
        });
    }

    document.getElementById('addVaultBtn').addEventListener('click', () => openVaultModal());

    const vaultSchema = {
        'ids': [{name: 'URL', type: 'text'}, {name: 'Identifiant', type: 'text'}, {name: 'Mot de passe', type: 'password'}, {name: 'Notes', type: 'textarea'}],
        'cards': [{name: 'Nom sur la carte', type: 'text'}, {name: 'Numéro', type: 'text'}, {name: 'Date d\'expiration', type: 'text'}, {name: 'CVV', type: 'password'}, {name: 'Code PIN', type: 'password'}, {name: 'Notes', type: 'textarea'}],
        'docs': [{name: 'Type', type: 'text'}, {name: 'Numéro', type: 'text'}, {name: 'Date d\'expiration', type: 'text'}, {name: 'Lieu de délivrance', type: 'text'}, {name: 'Notes', type: 'textarea'}],
        'accounts': [{name: 'Banque', type: 'text'}, {name: 'IBAN', type: 'text'}, {name: 'BIC/SWIFT', type: 'text'}, {name: 'Numéro de compte', type: 'text'}, {name: 'Notes', type: 'textarea'}],
        'codes': [{name: 'Code/PIN', type: 'password'}, {name: 'Notes', type: 'textarea'}],
        'medical': [{name: 'Groupe sanguin', type: 'text'}, {name: 'Allergies', type: 'text'}, {name: 'Traitements', type: 'textarea'}, {name: 'Médecin', type: 'text'}, {name: 'Numéro sécu', type: 'text'}, {name: 'Mutuelle', type: 'text'}, {name: 'Notes', type: 'textarea'}],
        'insurance': [{name: 'Type', type: 'text'}, {name: 'Compagnie', type: 'text'}, {name: 'N° contrat', type: 'text'}, {name: 'Téléphone', type: 'tel'}, {name: 'Notes', type: 'textarea'}],
        'subscriptions': [{name: 'Clé/N° abonnement', type: 'text'}, {name: 'Date de renouvellement', type: 'text'}, {name: 'Notes', type: 'textarea'}],
        'notes': [{name: 'Contenu', type: 'textarea'}]
    };

    function openVaultModal(id = null) {
        const item = id ? AppState.vaultData.find(i => i.id === id) : {
            id: Date.now().toString(), categoryId: currentVaultCategory, name: '', locked: false, lockedFor: '', fields: {}
        };

        const schema = vaultSchema[currentVaultCategory] || vaultSchema['notes'];

        let fieldsHtml = '';

        // If locked, the real fields are inside _adminEncrypted as a JSON string for the admin to read
        let actualFields = item.fields;
        if (item.locked && item.fields['_adminEncrypted']) {
             try {
                 actualFields = JSON.parse(decryptData(item.fields['_adminEncrypted'], adminKey));
             } catch(e) {
                 actualFields = {};
             }
        }

        schema.forEach(field => {
            let val = actualFields[field.name] ? actualFields[field.name].value : '';
            if (field.type === 'textarea') {
                fieldsHtml += `<div class="form-group"><label>${field.name}</label><textarea id="vf_${field.name}" rows="3">${escapeHTML(val)}</textarea></div>`;
            } else {
                fieldsHtml += `<div class="form-group"><label>${field.name}</label><input type="${field.type === 'password' ? 'text' : field.type}" id="vf_${field.name}" value="${escapeHTML(val)}"></div>`;
            }
        });

        const modalHtml = `
            <div class="custom-modal-overlay">
                <div class="custom-modal-dialog" style="max-width: 500px; max-height: 90vh; overflow-y: auto;">
                    <h3 class="mb-4">${id ? 'Modifier' : 'Ajouter'} une entrée</h3>
                    <div class="form-group">
                        <label>Nom de l'entrée *</label>
                        <input type="text" id="v_name" value="${escapeHTML(item.name)}">
                    </div>
                    ${fieldsHtml}
                    <div class="form-group">
                        <label class="flex items-center gap-2">
                            <input type="checkbox" id="v_locked" ${item.locked ? 'checked' : ''} style="width: auto;">
                            Verrouiller avec un mot de passe spécifique
                        </label>
                    </div>
                    <div class="form-group ${item.locked ? '' : 'hidden'}" id="v_locked_group">
                        <label>Prénom de la personne</label>
                        <input type="text" id="v_lockedFor" value="${escapeHTML(item.lockedFor)}">
                        <label class="mt-2">Mot de passe spécifique</label>
                        <input type="text" id="v_lockedPwd" placeholder="${item.locked ? 'Laissez vide pour garder l\\'ancien' : 'Nouveau mot de passe'}">
                    </div>
                    <div id="v_err" class="error-message mb-2"></div>
                    <div class="flex justify-between mt-4">
                        <button class="btn btn-secondary" id="cancelVaultBtn">Annuler</button>
                        <button class="btn btn-primary" id="saveVaultBtn">Sauvegarder</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalContainer').innerHTML = modalHtml;

        document.getElementById('v_locked').addEventListener('change', (e) => {
            document.getElementById('v_locked_group').classList.toggle('hidden', !e.target.checked);
        });

        document.getElementById('cancelVaultBtn').addEventListener('click', () => {
            document.getElementById('modalContainer').innerHTML = '';
        });

        document.getElementById('saveVaultBtn').addEventListener('click', async () => {
            const name = document.getElementById('v_name').value.trim();
            if (!name) return document.getElementById('v_err').innerText = "Le nom est obligatoire.";

            item.name = name;
            const isLocked = document.getElementById('v_locked').checked;
            item.locked = isLocked;

            let newFields = {};
            schema.forEach(field => {
                newFields[field.name] = { type: field.type, value: document.getElementById(`vf_${field.name}`).value };
            });

            if (isLocked) {
                item.lockedFor = document.getElementById('v_lockedFor').value.trim();
                const newPwd = document.getElementById('v_lockedPwd').value;

                if (!item.specificHash && !newPwd) {
                    return document.getElementById('v_err').innerText = "Un mot de passe spécifique est requis pour une nouvelle entrée verrouillée.";
                }

                if (newPwd) {
                    item.specificHash = hashPassword(newPwd);
                    // L'admin stocke le contenu de base chiffré avec le mot de passe spécifique.
                    // Et stocke aussi en parallèle pour lui-même le contenu chiffré avec la clé Admin
                    item.fields = {
                        'Contenu': { type: 'text', value: 'Contenu masqué' },
                        '_encrypted': encryptData(JSON.stringify(newFields), newPwd),
                        '_adminEncrypted': encryptData(JSON.stringify(newFields), adminKey)
                    };
                } else {
                    // Check if fields changed
                    if (JSON.stringify(newFields) !== JSON.stringify(actualFields)) {
                        return document.getElementById('v_err').innerText = "Pour modifier le contenu d'une entrée verrouillée, veuillez re-saisir son mot de passe spécifique (laissez vide uniquement pour modifier le nom ou la personne).";
                    }
                }
            } else {
                item.fields = newFields;
                item.lockedFor = '';
                item.specificHash = null;
            }

            if (id) {
                const idx = AppState.vaultData.findIndex(i => i.id === id);
                if (idx > -1) AppState.vaultData[idx] = item;
            } else {
                AppState.vaultData.push(item);
            }

            document.getElementById('modalContainer').innerHTML = '';
            renderVaultItems();
            await saveAllData();
        });
    }

    function deleteVaultItem(id) {
        showConfirm("Supprimer cette entrée ?", async () => {
            AppState.vaultData = AppState.vaultData.filter(i => i.id !== id);
            renderVaultItems();
            await saveAllData();
        });
    }

    // --- Testament Logic ---
    const tStatus = document.getElementById('testamentStatus');
    let tTimeout = null;
    let quill;

    function initTestament() {
        quill = new Quill('#testamentEditor', {
            theme: 'snow',
            placeholder: 'Rédigez votre testament...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['clean']
                ]
            }
        });

        // Set initial content if it's HTML, else text
        if (AppState.testamentData.startsWith('<')) {
            quill.clipboard.dangerouslyPasteHTML(AppState.testamentData);
        } else {
            quill.setText(AppState.testamentData);
        }

        quill.on('text-change', () => {
            tStatus.innerText = "Modifications non sauvegardées...";
            clearTimeout(tTimeout);
            tTimeout = setTimeout(async () => {
                AppState.testamentData = quill.root.innerHTML;
                await saveAllData();
                tStatus.innerText = `Dernière sauvegarde: ${new Date().toLocaleTimeString()}`;
            }, 30000); // Auto-save after 30s of inactivity
        });
    }

    // --- PDF Exports ---
    document.getElementById('exportContactsBtn').addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text("Carnet de Contacts", 10, 10);
        let y = 20;
        AppState.contacts.forEach(c => {
            doc.text(`${c.name} - ${c.relation} - Tel: ${c.phone || 'N/A'}`, 10, y);
            y += 10;
        });
        doc.save("contacts.pdf");
    });

    document.getElementById('exportTestamentBtn').addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text("Testament", 10, 10);
        // Extract plain text for simple PDF export since standard jsPDF doesn't handle HTML well out of the box
        const plainText = quill ? quill.getText() : AppState.testamentData.replace(/<[^>]*>?/gm, '');
        const splitText = doc.splitTextToSize(plainText, 180);
        doc.text(splitText, 10, 20);
        doc.save("testament.pdf");
    });

    // --- Settings & Logs ---
    function renderSettings() {
        const logsContainer = document.getElementById('accessLogsContainer');

        // Merge the backend's unencrypted public logs (for visitors) with any existing encrypted logs
        // Note: as per requirements to not have clear text, we'll encrypt them now and clear the public buffer
        // if they exist.
        let publicLogs = AppState.data.publicAccessLogs || [];
        let encryptedLogs = decryptData(AppState.data.accessLogs, adminKey) || [];

        let allLogs = [...publicLogs.reverse(), ...encryptedLogs];

        logsContainer.innerHTML = allLogs.length === 0 ? '<p class="text-muted">Aucun log récent enregistré dans le fichier JSON.</p>' : '';

        allLogs.forEach(log => {
            const div = document.createElement('div');
            div.className = 'contact-item';
            div.innerHTML = `
                <div class="contact-info">
                    <div class="contact-name">${escapeHTML(log.date)} - ${escapeHTML(log.type)}</div>
                    <div class="contact-relation">Par: ${escapeHTML(log.name)} | IP: ${escapeHTML(log.ip)}</div>
                </div>
            `;
            logsContainer.appendChild(div);
        });

        const msgBox = document.getElementById('settingsEmergencyMsg');
        msgBox.value = AppState.emergencyMsg;
        if (!AppState.emergencyMsg && AppState.encryptedEmergencyMsg) {
             msgBox.placeholder = "Mot de passe urgence requis pour afficher l'ancien message. Entrez un nouveau ou sauvegardez la page avec le mot de passe pour le charger.";
        }
    }

    document.getElementById('saveEmergencyMsgBtn').addEventListener('click', async () => {
        AppState.emergencyMsg = document.getElementById('settingsEmergencyMsg').value;
        await saveAllData();
        showToast("Message sauvegardé", "success");
    });

    // --- Change Password Logic ---
    document.getElementById('changePwdBtn').addEventListener('click', () => {
        const modalHtml = `
            <div class="custom-modal-overlay">
                <div class="custom-modal-dialog" style="max-width: 500px; max-height: 90vh; overflow-y: auto;">
                    <h3 class="mb-4">Changer les mots de passe</h3>
                    <div class="form-group">
                        <label>Vérification: Mot de passe Admin actuel *</label>
                        <input type="password" id="cp_currentAdmin">
                    </div>
                    <hr class="my-4" style="border-color: rgba(255,255,255,0.1);">
                    <p class="text-sm text-muted mb-4">Laissez vide un champ pour conserver le mot de passe actuel.</p>
                    <div class="form-group">
                        <label>Nouveau mot de passe Admin (min 8 chars)</label>
                        <input type="password" id="cp_newAdmin">
                    </div>
                    <div class="form-group">
                        <label>Nouveau mot de passe Urgence (min 6 chars)</label>
                        <input type="password" id="cp_newEmergency">
                    </div>
                    <div class="form-group">
                        <label>Nouveau mot de passe Vault (min 6 chars)</label>
                        <input type="password" id="cp_newVault">
                    </div>
                    <div class="form-group">
                        <label>Nouveau mot de passe Testament (min 6 chars)</label>
                        <input type="password" id="cp_newTestament">
                    </div>
                    <div id="cp_err" class="error-message mb-2"></div>
                    <div class="flex justify-between mt-4">
                        <button class="btn btn-secondary" id="cancelCpBtn">Annuler</button>
                        <button class="btn btn-primary" id="saveCpBtn">Appliquer les changements</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('modalContainer').innerHTML = modalHtml;

        document.getElementById('cancelCpBtn').addEventListener('click', () => {
            document.getElementById('modalContainer').innerHTML = '';
        });

        document.getElementById('saveCpBtn').addEventListener('click', async () => {
            const currentAdmin = document.getElementById('cp_currentAdmin').value;
            const newAdmin = document.getElementById('cp_newAdmin').value;
            const newEmergency = document.getElementById('cp_newEmergency').value;
            const newVault = document.getElementById('cp_newVault').value;
            const newTestament = document.getElementById('cp_newTestament').value;
            const errDiv = document.getElementById('cp_err');

            if (hashPassword(currentAdmin) !== AppState.data.adminHash) {
                return errDiv.innerText = "Le mot de passe admin actuel est incorrect.";
            }

            if ((newAdmin && newAdmin.length < 8) ||
                (newEmergency && newEmergency.length < 6) ||
                (newVault && newVault.length < 6) ||
                (newTestament && newTestament.length < 6)) {
                return errDiv.innerText = "Veuillez respecter la longueur minimale.";
            }

            const btn = document.getElementById('saveCpBtn');
            btn.innerHTML = '<span class="loader"></span>';
            btn.disabled = true;

            try {
                // Update keys if provided, otherwise keep old ones
                const finalAdminKey = newAdmin || currentAdmin;
                let eKey = newEmergency || sessionStorage.getItem('derivedEmergencyKey');
                if (!eKey) {
                    errDiv.innerText = "Le mot de passe urgence est requis pour chiffrer les données publiques. Veuillez le saisir comme nouveau mot de passe ou annuler.";
                    btn.innerHTML = 'Appliquer les changements';
                    btn.disabled = false;
                    return;
                }

                const finalVaultKey = newVault || AppState.vaultKey;
                const finalTestamentKey = newTestament || AppState.testamentKey;

                const newPayload = {
                    isSetup: true,
                    adminHash: hashPassword(finalAdminKey),
                    emergencyHash: hashPassword(eKey),
                    vaultHash: hashPassword(finalVaultKey),
                    testamentHash: hashPassword(finalTestamentKey),

                    encryptedVaultPassword: encryptData(finalVaultKey, finalAdminKey),
                    encryptedTestamentPassword: encryptData(finalTestamentKey, finalAdminKey),

                    contacts: encryptData(AppState.contacts, finalAdminKey),
                    emergencyContacts: encryptData(AppState.contacts, eKey),
                    vaultData: encryptData(AppState.vaultData, finalVaultKey),
                    testamentData: encryptData(AppState.testamentData, finalTestamentKey),

                    emergencyMessage: encryptData(AppState.emergencyMsg, eKey),
                    accessLogs: encryptData(decryptData(AppState.data.accessLogs, adminKey), finalAdminKey)
                };

                const res = await api.save(newPayload);
                if (res.success) {
                    sessionStorage.setItem('adminKey', finalAdminKey);
                    sessionStorage.setItem('derivedEmergencyKey', eKey);

                    // Update AppState
                    AppState.data = newPayload;
                    AppState.vaultKey = finalVaultKey;
                    AppState.testamentKey = finalTestamentKey;

                    document.getElementById('modalContainer').innerHTML = '';
                    showToast("Mots de passe modifiés avec succès.", "success");
                } else {
                    errDiv.innerText = "Erreur réseau.";
                }
            } catch (error) {
                errDiv.innerText = "Erreur inattendue.";
            }
            btn.innerHTML = 'Appliquer les changements';
            btn.disabled = false;
        });
    });

    function initUI() {
        renderContacts();
        renderVaultCategories();
        initTestament();
        renderSettings();
    }
});
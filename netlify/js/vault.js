document.addEventListener('DOMContentLoaded', async () => {
    const vaultKey = sessionStorage.getItem('vaultKey');

    if (!vaultKey) {
        window.location.href = 'index.html';
        return;
    }

    setupAutoLock(15); // 15 minutes auto lock

    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

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
    let vaultData = [];

    try {
        const data = await api.load();

        if (data.vaultData) {
            vaultData = decryptData(data.vaultData, vaultKey) || [];
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
                    renderVaultSidebar();
                    renderVaultList();
                };
                sidebar.appendChild(btn);
            });
        }

        function renderVaultList() {
            const list = document.getElementById('vaultList');
            list.innerHTML = '';

            const filtered = currentVaultCategory === 'all'
                ? vaultData
                : vaultData.filter(v => v.category === currentVaultCategory);

            if (filtered.length === 0) {
                list.innerHTML = `<div class="p-4 text-center text-muted">Aucune entrée dans cette catégorie.</div>`;
                return;
            }

            filtered.forEach(entry => {
                const catObj = vaultCategories.find(c => c.id === entry.category) || vaultCategories[0];

                const row = document.createElement('div');
                row.className = 'vault-item relative';

                if (entry.isLocked) {
                    row.innerHTML = `
                        <div class="flex items-center mb-2">
                            <i class="fas ${catObj.icon} text-muted mr-3 text-xl"></i>
                            <div class="font-bold text-xl">${escapeHTML(entry.title)}</div>
                        </div>
                        <div class="p-4 border border-accent-warning rounded mt-4 text-center bg-accent-warning bg-opacity-20">
                            <i class="fas fa-lock text-accent-warning text-3xl mb-2"></i>
                            <p class="text-sm text-accent-warning mb-4">Cette entrée est verrouillée pour ${escapeHTML(entry.lockName)}.</p>
                            <input type="password" id="unlock-${entry.id}" placeholder="Mot de passe spécifique" class="w-64 mb-2">
                            <br>
                            <button class="btn btn-primary btn-sm" onclick="unlockEntry('${entry.id}', '${entry.lockPassword}')">Déverrouiller</button>
                            <div id="unlock-err-${entry.id}" class="text-accent-danger text-sm mt-2 hidden">Mot de passe incorrect</div>
                        </div>
                        <div id="content-${entry.id}" class="hidden mt-4"></div>
                    `;
                } else {
                    row.innerHTML = buildEntryContent(entry, catObj);
                }

                list.appendChild(row);
            });
        }

        // Expose unlock function
        window.unlockEntry = function(id, expectedPwd) {
            const input = document.getElementById(`unlock-${id}`);
            const err = document.getElementById(`unlock-err-${id}`);
            const content = document.getElementById(`content-${id}`);

            if (input.value === expectedPwd) {
                const entry = vaultData.find(v => v.id === id);
                const catObj = vaultCategories.find(c => c.id === entry.category) || vaultCategories[0];
                content.innerHTML = buildEntryFields(entry);
                content.classList.remove('hidden');

                // Hide unlock prompt
                input.parentElement.classList.add('hidden');
            } else {
                err.classList.remove('hidden');
                input.value = '';
            }
        };

        function buildEntryContent(entry, catObj) {
            return `
                <div class="flex items-center mb-4">
                    <i class="fas ${catObj.icon} text-muted mr-3 text-xl"></i>
                    <div class="font-bold text-xl">${escapeHTML(entry.title)}</div>
                </div>
                ${buildEntryFields(entry)}
            `;
        }

        function buildEntryFields(entry) {
            let fieldsHtml = '';
            if (entry.fields) {
                entry.fields.forEach((f) => {
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
                        <div class="mb-2 flex items-center">
                            <span class="text-sm text-muted w-32">${escapeHTML(f.label)}</span>
                            <span class="font-bold ml-1 flex-1"><span>${displayVal}</span>${copyBtn}</span>
                        </div>
                    `;
                });
            }

            let notesHtml = entry.notes ? `<div class="mt-4 text-sm text-muted border-t pt-2 border-gray-700">${escapeHTML(entry.notes)}</div>` : '';
            return `<div>${fieldsHtml}</div>${notesHtml}`;
        }

        renderVaultSidebar();
        document.getElementById('currentCategoryTitle').innerText = vaultCategories.find(c => c.id === currentVaultCategory).name;
        renderVaultList();

    } catch (e) {
        showToast("Erreur de déchiffrement.", "error");
        setTimeout(() => {
            sessionStorage.clear();
            window.location.href = 'index.html';
        }, 2000);
    }
});
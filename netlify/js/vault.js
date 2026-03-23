document.addEventListener('DOMContentLoaded', async () => {
    const vaultKey = sessionStorage.getItem('vaultKey');
    const emergencyKey = sessionStorage.getItem('emergencyKey'); // Double verification logic implies both are present in session

    if (!vaultKey || !emergencyKey) {
        window.location.href = 'index.html';
        return;
    }

    setupAutoLock(15); // 15 minutes timeout

    let vaultData = [];
    const vaultCategoriesList = [
        { id: 'ids', name: 'Identifiants & Mots de passe', icon: 'fa-key' },
        { id: 'cards', name: 'Cartes bancaires', icon: 'fa-credit-card' },
        { id: 'docs', name: 'Documents d\'identité', icon: 'fa-id-card' },
        { id: 'notes', name: 'Notes libres', icon: 'fa-sticky-note' }
    ];
    let currentVaultCategory = 'ids';

    try {
        const encryptedPayload = await api.load();
        if (!encryptedPayload.isSetup) throw new Error("App not setup");

        vaultData = decryptData(encryptedPayload.vaultData, vaultKey) || [];
        renderVaultCategories();
    } catch (e) {
        console.error(e);
        showAlert("Erreur de déchiffrement. Clé incorrecte.");
        sessionStorage.clear();
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

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

        const items = vaultData.filter(i => i.categoryId === currentVaultCategory);

        if (items.length === 0) {
            container.innerHTML = '<p class="text-muted text-center mt-8">Aucune entrée disponible.</p>';
            return;
        }

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'vault-item fade-in';
            div.id = `vault-item-${item.id}`;

            if (item.locked) {
                div.innerHTML = `
                    <div class="vault-item-header">
                        <div class="vault-item-title text-accent-warning">
                            <i class="fas fa-lock"></i> ${escapeHTML(item.name)}
                        </div>
                        <span class="text-xs text-muted">Réservé à ${escapeHTML(item.lockedFor)}</span>
                    </div>
                    <button class="btn btn-secondary btn-unlock" data-id="${item.id}">
                        Déverrouiller
                    </button>
                    <div class="unlocked-content hidden" id="content-${item.id}"></div>
                `;
            } else {
                div.innerHTML = `
                    <div class="vault-item-header">
                        <div class="vault-item-title">${escapeHTML(item.name)}</div>
                    </div>
                    ${Object.entries(item.fields).map(([k, v]) => `
                        <div class="vault-field">
                            <span class="vault-field-label">${escapeHTML(k)}</span>
                            <span class="vault-field-value">
                                <span class="truncate max-w-[200px]" id="val-${item.id}-${k}">••••••••</span>
                                <div class="flex gap-2">
                                    <button class="btn-icon text-xs btn-reveal" data-target="val-${item.id}-${k}" data-val="${escapeHTML(v.value)}"><i class="fas fa-eye"></i></button>
                                    <button class="btn-icon text-xs btn-copy" data-val="${escapeHTML(v.value)}"><i class="fas fa-copy"></i></button>
                                </div>
                            </span>
                        </div>
                    `).join('')}
                `;
            }
            container.appendChild(div);
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

        document.querySelectorAll('.btn-unlock').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const item = vaultData.find(i => i.id === id);
                showPrompt(`Entrez le mot de passe pour ${item.name}`, "password", (pwd) => {
                    if (hashPassword(pwd) === item.specificHash) {
                        e.currentTarget.classList.add('hidden');
                        const contentDiv = document.getElementById(`content-${item.id}`);
                        contentDiv.classList.remove('hidden');

                        // Decrypt nested content
                        const decrypted = decryptData(item.fields._encrypted, pwd);
                        contentDiv.innerHTML = `
                            <div class="vault-field mt-2">
                                <span class="vault-field-label">Contenu</span>
                                <span class="vault-field-value" style="white-space: pre-wrap; font-family: inherit;">${escapeHTML(decrypted || 'Erreur déchiffrement')}</span>
                            </div>
                        `;
                    } else {
                        showAlert("Mot de passe incorrect.");
                    }
                });
            });
        });
    }
});
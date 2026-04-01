// netlify/js/vault.js

let vaultKey = sessionStorage.getItem('vaultKey');
let vaultUrgKey = sessionStorage.getItem('vaultUrgKey');
let appData = null;
let vaultData = [];
let currentVaultCategory = 0;

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

document.addEventListener('DOMContentLoaded', async () => {
    if (!vaultKey || !vaultUrgKey) {
        window.location.href = 'index.html';
        return;
    }

    setupAutoLock(15);

    document.getElementById('btn-logout').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

    try {
        appData = await loadData();
        vaultData = decryptData(appData.vaultData, vaultKey) || [];

        document.getElementById('loader').classList.add('hidden');
        initVault();

    } catch (e) {
        showToast("Erreur d'accès aux données", "error");
        console.error(e);
        setTimeout(() => {
            sessionStorage.clear();
            window.location.href = 'index.html';
        }, 2000);
    }
});

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

    renderVaultEntries();
}

function renderVaultEntries() {
    const container = document.getElementById('vault-entries');
    container.innerHTML = '';
    const catData = VAULT_CATEGORIES.find(c => c.id === currentVaultCategory);
    document.getElementById('current-cat-title').innerHTML = `<i class="fas ${catData.icon} mr-2"></i>${catData.title}`;

    const entries = vaultData.filter(e => e.categoryId === currentVaultCategory);

    if (entries.length === 0) {
        container.innerHTML = `<p class="text-muted italic">Aucune entrée dans cette catégorie.</p>`;
        return;
    }

    entries.forEach((entry, index) => {
        const div = document.createElement('div');
        div.className = 'vault-entry';

        const titleKey = ['Nom du service', 'Banque', 'Nom/Description', 'Service', 'Titre'].find(k => entry.fields[k]) || entry.title || 'Entrée';

        if (entry.locked) {
            div.innerHTML = `
                <div class="flex justify-between items-center text-muted italic">
                    <span class="vault-entry-title" style="color:var(--text);"><i class="fas fa-lock mr-2 text-red-500" style="color:var(--danger)"></i>${escapeHtml(titleKey)}</span>
                    <button class="action-btn" onclick="unlockEntry('${entry.id}')" style="background:var(--accent); color:white; padding: 4px 12px; border-radius:4px;"><i class="fas fa-key mr-1"></i> Déverrouiller</button>
                </div>
            `;
        } else {
            let fieldsHtml = '';
            for (let key in entry.fields) {
                let val = escapeHtml(entry.fields[key]);
                if (!val) continue;

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

            div.innerHTML = `
                <div class="vault-entry-header mb-4 border-b pb-2" style="border-color: rgba(255,255,255,0.05);">
                    <span class="vault-entry-title">${escapeHtml(titleKey)}</span>
                </div>
                ${fieldsHtml}
            `;
        }

        container.appendChild(div);
    });
}

function unlockEntry(id) {
    const entry = vaultData.find(e => e.id === id);
    if (!entry) return;

    const html = `
        <h3 class="text-xl mb-4 font-bold" style="color:var(--danger);"><i class="fas fa-lock mr-2"></i>Accès protégé</h3>
        <p class="text-sm text-muted mb-4">Cette entrée est protégée par un mot de passe spécifique configuré par l'administrateur.</p>
        <form id="unlock-form" class="flex-col gap-4">
            <input type="password" id="unlock-pwd" placeholder="Mot de passe spécifique" required>
            <div class="flex gap-4 justify-end mt-4">
                <button type="button" class="action-btn" style="padding: 10px 20px;" onclick="closeModal()">Annuler</button>
                <button type="submit" class="btn-primary" style="padding: 10px 20px;">Déverrouiller</button>
            </div>
        </form>
    `;

    openModal(html);

    document.getElementById('unlock-form').onsubmit = (e) => {
        e.preventDefault();
        const pwd = document.getElementById('unlock-pwd').value;
        if (pwd === entry.lockPwd) {
            entry.locked = false; // unlock for this session only (in memory)
            closeModal();
            renderVaultEntries();
            showToast("Entrée déverrouillée", "success");
        } else {
            showToast("Mot de passe incorrect", "error");
        }
    };
}

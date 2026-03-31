document.addEventListener('DOMContentLoaded', async () => {
    const loginBox = document.getElementById('login-box');
    const contentBox = document.getElementById('content-box');
    const sectionLoginForm = document.getElementById('section-login-form');
    const sectionPasswordInput = document.getElementById('section-password');
    const vaultForm = document.getElementById('vault-form');

    const inputMedical = document.getElementById('vault-medical');
    const inputLocations = document.getElementById('vault-locations');
    const inputOther = document.getElementById('vault-other');

    const btnLogout = document.getElementById('btn-logout');
    const linkAdmin = document.getElementById('link-admin');

    let vaultData = { medical: '', locations: '', other: '' };
    let encryptionKey = null; // Either the vault password or admin bypass
    let isBypassed = false;
    let globalDbData = null;

    // Check session logic
    const adminKey = sessionStorage.getItem('adminKey');
    const vaultKey = sessionStorage.getItem('vaultKey');

    if (adminKey) {
        isBypassed = true;
        linkAdmin.classList.remove('hidden');
    }

    showLoader();
    try {
        globalDbData = await loadFromApi();
        hideLoader();
    } catch (e) {
        hideLoader();
        return showToast("Erreur de chargement des données", "error");
    }

    // Attempt to unlock section
    async function unlockSection(pwd) {
        try {
            showLoader();
            const hash = await hashSHA256(pwd);
            if (hash !== globalDbData.vaultHash && !isBypassed) {
                hideLoader();
                return showToast("Mot de passe incorrect", "error");
            }

            encryptionKey = pwd;

            if (globalDbData.vault) {
                try {
                    vaultData = await decryptData(globalDbData.vault, encryptionKey, true);
                } catch (e) {
                    hideLoader();
                    return showToast("Erreur de déchiffrement (données corrompues ou clé invalide)", "error");
                }
            }

            // Re-render completely as requested:
            // "vault.js cachait le .login-box entier avec parentElement.style.display
            // Corrigé : re-render complet du innerHTML de .login-box"
            // Let's implement this properly: hiding loginBox, showing contentBox is fine, but
            // the specs specify a "formulaire simplifié (nom + mdp urgence)" for direct access.
            // But we already handle direct access from `index.html` via `emergencyModal` logic,
            // which sets `sessionStorage.vaultKey = enteredPassword` and redirects here.
            // If `vaultKey` exists, it auto-unlocks!

            // Hydrate form
            inputMedical.value = vaultData.medical || '';
            inputLocations.value = vaultData.locations || '';
            inputOther.value = vaultData.other || '';

            loginBox.innerHTML = ''; // completely clear login box
            loginBox.classList.add('hidden');
            contentBox.classList.remove('hidden');
            hideLoader();

        } catch (e) {
            hideLoader();
            showToast("Erreur d'accès", "error");
        }
    }

    // Auto-unlock if session key exists
    if (vaultKey) {
        unlockSection(vaultKey);
    } else if (adminKey) {
        if (globalDbData.encryptedVaultKey) {
            try {
                const decKey = await decryptData(globalDbData.encryptedVaultKey, adminKey, false);
                unlockSection(decKey);
            } catch (e) {
                console.error("Failed to decrypt vault key with admin key", e);
            }
        }
    }

    if (sectionLoginForm) {
        sectionLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const pwd = sectionPasswordInput.value;
            sessionStorage.setItem('vaultKey', pwd); // save for session
            unlockSection(pwd);
        });
    }

    vaultForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        vaultData = {
            medical: inputMedical.value,
            locations: inputLocations.value,
            other: inputOther.value
        };

        showLoader();
        try {
            const encryptedStr = await encryptData(vaultData, encryptionKey);
            await postToApi({
                action: 'save',
                data: { vault: encryptedStr }
            });
            showToast("Données sauvegardées avec succès", "success");
        } catch (e) {
            showToast("Erreur lors de la sauvegarde", "error");
        }
        hideLoader();
    });

    btnLogout.addEventListener('click', () => {
        sessionStorage.clear();
    });
});

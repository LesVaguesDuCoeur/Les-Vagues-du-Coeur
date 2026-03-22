document.addEventListener('DOMContentLoaded', async () => {
    // Check configuration
    if (!api.getApiUrl()) {
        window.location.href = 'setup.html';
        return;
    }

    const loginContainer = document.getElementById('login-container');
    const adminContent = document.getElementById('admin-content');
    const loginForm = document.getElementById('login-form');
    let serverData = null;

    // Load data silently to check authentication and status
    try {
        window.showLoading();
        serverData = await api.loadFromApi();
        window.hideLoading();
    } catch (error) {
        window.hideLoading();
        window.showToast("Erreur de connexion a l'API.", "error");
        console.error("Failed to load data", error);
        return;
    }

    // Check if adminKey is already in sessionStorage
    if (sessionStorage.getItem('adminKey')) {
        showAdminPanel();
    } else {
        loginContainer.classList.remove('hidden');
    }

    // Handle Login Form
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const passwordInput = document.getElementById('password');
        const password = passwordInput.value;
        if (!password) {
            window.showToast("Veuillez entrer le mot de passe admin.", "warning");
            return;
        }

        window.showLoading();
        const hash = await cryptoUtils.hashPassword(password);
        window.hideLoading();

        if (hash === serverData.adminHash) {
            sessionStorage.setItem('adminKey', password);
            loginContainer.classList.add('hidden');
            showAdminPanel();
        } else {
            window.showToast("Mot de passe administrateur incorrect.", "error");
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    function showAdminPanel() {
        adminContent.classList.remove('hidden');
        document.getElementById('admin-email').value = serverData.email || '';

        // Update status indicators
        updateStatus('status-contacts', serverData.contacts);
        updateStatus('status-vault', serverData.vault);
        updateStatus('status-testament', serverData.testament);

        setupAdminActions();
    }

    function updateStatus(elementId, data) {
        const el = document.getElementById(elementId);
        if (data && data.trim() !== '') {
            el.textContent = 'Configure (Chiffre)';
            el.className = 'status configured';
        } else {
            el.textContent = 'Vide';
            el.className = 'status empty';
        }
    }

    function setupAdminActions() {
        // Change Password
        document.getElementById('btn-change-pwd').addEventListener('click', async () => {
            const sectionStr = await window.showPrompt("Quelle section modifier ? (contact, admin, vault, testament)", "contact", "Changer un mot de passe");
            if (!sectionStr) return;

            const section = sectionStr.toLowerCase().trim();
            const validSections = ['contact', 'admin', 'vault', 'testament'];

            if (!validSections.includes(section)) {
                window.showToast("Section invalide. Utilisez: contact, admin, vault, ou testament.", "error");
                return;
            }

            const newPwd = await window.showPrompt(`Entrez le NOUVEAU mot de passe pour [${section}] (min. 4 caracteres)`, "", "Nouveau mot de passe");
            if (!newPwd) return;

            if (newPwd.length < 4) {
                window.showToast("Le mot de passe doit faire au moins 4 caracteres.", "error");
                return;
            }

            const confirmPwd = await window.showPrompt(`Confirmez le NOUVEAU mot de passe pour [${section}]`, "", "Confirmation");
            if (newPwd !== confirmPwd) {
                window.showToast("Les mots de passe ne correspondent pas. Annulation.", "error");
                return;
            }

            // Important: Data must be re-encrypted if contact, vault, or testament password changes
            // Since this app only hashes, re-encrypting the data requires the OLD password to decrypt first.
            // To simplify per requirements, we only update the hash. If the user changes a decryption password,
            // they must manually update the data in that section or lose it. We warn them.

            if (section !== 'admin') {
                 const proceed = await window.showConfirm(`ATTENTION: Changer ce mot de passe ne dechiffrera pas les donnees existantes. Vous devrez re-saisir les donnees de la section "${section}". Continuer ?`, "Avertissement Critique");
                 if (!proceed) return;
            }

            try {
                window.showLoading();
                const newHash = await cryptoUtils.hashPassword(newPwd);

                const payload = {};
                payload[`${section}Hash`] = newHash;

                // Also clear the section data if it's not admin to prevent un-decryptable garbage
                if (section !== 'admin') {
                    payload[section] = '';
                    // contacts special case mapping
                    if(section === 'contact') payload['contacts'] = '';
                }

                await api.postToApi(payload);

                // Update local serverData
                serverData[`${section}Hash`] = newHash;
                if (section !== 'admin') {
                    serverData[section === 'contact' ? 'contacts' : section] = '';
                    updateStatus(`status-${section === 'contact' ? 'contacts' : section}`, '');
                }

                // If admin password changed, update session
                if (section === 'admin') {
                    sessionStorage.setItem('adminKey', newPwd);
                }

                window.hideLoading();
                window.showToast(`Mot de passe ${section} mis a jour.`, "success");
            } catch (error) {
                window.hideLoading();
                window.showToast("Erreur lors de la mise a jour.", "error");
            }
        });

        // Export Data
        document.getElementById('btn-export-data').addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(serverData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "urgences_export_" + new Date().toISOString().split('T')[0] + ".json");
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            window.showToast("Export lance.", "info");
        });

        // Reset App
        document.getElementById('btn-reset-app').addEventListener('click', async () => {
            const confirm1 = await window.showConfirm("Voulez-vous VRAIMENT reinitialiser toute l'application ? TOUTES les donnees seront effacees.", "Danger");
            if (!confirm1) return;

            const confirm2 = await window.showPrompt("Pour confirmer, tapez le mot 'SUPPRIMER' en majuscules.", "", "Confirmation finale");

            if (confirm2 === "SUPPRIMER") {
                try {
                    window.showLoading();
                    // Clear the sheet using a mock setup with empty fields
                    await api.postToApi({
                        action: 'setup',
                        contactHash: '', adminHash: '', vaultHash: '', testamentHash: '',
                        email: '', contacts: '', vault: '', testament: ''
                    });

                    localStorage.removeItem('apiUrl');
                    sessionStorage.clear();
                    window.hideLoading();

                    window.showToast("Application reinitialisee. Redirection...", "success");
                    setTimeout(() => {
                        window.location.href = 'setup.html';
                    }, 1500);
                } catch (error) {
                    window.hideLoading();
                    window.showToast("Erreur lors de la reinitialisation.", "error");
                }
            } else {
                window.showToast("Reinitialisation annulee.", "info");
            }
        });
    }
});
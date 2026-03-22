document.addEventListener('DOMContentLoaded', async () => {
    if (!api.getApiUrl()) {
        window.location.href = 'setup.html';
        return;
    }

    const loginContainer = document.getElementById('login-container');
    const contentContainer = document.getElementById('content-container');
    const loginForm = document.getElementById('login-form');

    let serverData = null;

    // Load API data
    try {
        window.showLoading();
        serverData = await api.loadFromApi();
        window.hideLoading();
    } catch (error) {
        window.hideLoading();
        window.showToast("Erreur de connexion a l'API.", "error");
        return;
    }

    // Adjust UI if accessed by emergency or admin
    const emName = sessionStorage.getItem('emergencyName');
    if (emName) {
        document.getElementById('header-status').textContent = `Accedé par : ${emName}`;
        document.getElementById('header-status').style.color = 'var(--warning)';
    }

    if (sessionStorage.getItem('adminKey')) {
        document.getElementById('back-link').href = 'admin.html';
        document.getElementById('login-title').textContent = "Dechiffrement";
    }

    // Check if we have the specific section key
    if (sessionStorage.getItem('vaultKey')) {
        await loadVaultData(sessionStorage.getItem('vaultKey'));
    } else {
        loginContainer.classList.remove('hidden');
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const passwordInput = document.getElementById('password');
        const password = passwordInput.value;
        if (!password) {
            window.showToast("Mot de passe requis.", "warning");
            return;
        }

        window.showLoading();
        const hash = await cryptoUtils.hashPassword(password);
        window.hideLoading();

        if (hash === serverData.vaultHash) {
            sessionStorage.setItem('vaultKey', password);
            loginContainer.classList.add('hidden');
            await loadVaultData(password);
        } else {
            window.showToast("Mot de passe incorrect.", "error");
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    document.getElementById('save-btn').addEventListener('click', async (e) => {
        e.preventDefault();

        const vaultData = {
            name: document.getElementById('v-name').value,
            dob: document.getElementById('v-dob').value,
            address: document.getElementById('v-address').value,
            ssn: document.getElementById('v-ssn').value,
            blood: document.getElementById('v-blood').value,
            allergies: document.getElementById('v-allergies').value,
            treatments: document.getElementById('v-treatments').value,
            doctor: document.getElementById('v-doctor').value,
            notes: document.getElementById('v-notes').value
        };

        const password = sessionStorage.getItem('vaultKey');
        if (!password) return;

        try {
            window.showLoading();
            const jsonStr = JSON.stringify(vaultData);
            const encrypted = await cryptoUtils.encryptData(jsonStr, password);

            await api.postToApi({ vault: encrypted });

            window.hideLoading();
            window.showToast("Fiche sauvegardee avec succes.", "success");
        } catch (error) {
            window.hideLoading();
            window.showToast("Erreur lors de la sauvegarde.", "error");
        }
    });

    async function loadVaultData(password) {
        if (!serverData.vault) {
            contentContainer.classList.remove('hidden');
            return;
        }

        try {
            window.showLoading();
            const decrypted = await cryptoUtils.decryptData(serverData.vault, password);
            const data = JSON.parse(decrypted);

            document.getElementById('v-name').value = data.name || '';
            document.getElementById('v-dob').value = data.dob || '';
            document.getElementById('v-address').value = data.address || '';
            document.getElementById('v-ssn').value = data.ssn || '';
            document.getElementById('v-blood').value = data.blood || '';
            document.getElementById('v-allergies').value = data.allergies || '';
            document.getElementById('v-treatments').value = data.treatments || '';
            document.getElementById('v-doctor').value = data.doctor || '';
            document.getElementById('v-notes').value = data.notes || '';

            window.hideLoading();
            contentContainer.classList.remove('hidden');
        } catch (error) {
            window.hideLoading();
            window.showToast("Echec du dechiffrement. La cle est invalide.", "error");
            sessionStorage.removeItem('vaultKey');
            loginContainer.classList.remove('hidden');
        }
    }
});
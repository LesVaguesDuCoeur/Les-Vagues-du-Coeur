document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check if configured
    if (!api.getApiUrl()) {
        window.location.href = 'setup.html';
        return;
    }

    let serverHashes = null;

    try {
        window.showLoading();
        serverHashes = await api.loadFromApi();
        window.hideLoading();
    } catch (error) {
        window.hideLoading();
        window.showToast("Erreur de connexion a l'API.", "error");
        console.error("Failed to load hashes", error);
        return;
    }

    const form = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = passwordInput.value;
        if (!password) {
            window.showToast("Veuillez entrer un mot de passe.", "warning");
            return;
        }

        window.showLoading();
        const hash = await cryptoUtils.hashPassword(password);
        window.hideLoading();

        if (hash === serverHashes.contactHash) {
            sessionStorage.setItem('contactKey', password);
            window.location.href = 'emergency.html';
        }
        else if (hash === serverHashes.adminHash) {
            sessionStorage.setItem('adminKey', password);
            window.location.href = 'admin.html';
        }
        else if (hash === serverHashes.vaultHash) {
            handleEmergencyAccess('Fiche Personnelle (Vault)', password, 'vaultKey', 'vault.html', serverHashes.contactHash);
        }
        else if (hash === serverHashes.testamentHash) {
            handleEmergencyAccess('Testament Numerique', password, 'testamentKey', 'testament.html', serverHashes.contactHash);
        }
        else {
            window.showToast("Mot de passe incorrect.", "error");
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    async function handleEmergencyAccess(sectionName, sectionPassword, sessionKeyName, redirectUrl, expectedContactHash) {
        const result = await window.showEmergencyAccessModal(sectionName);

        if (!result) {
            // User cancelled
            passwordInput.value = '';
            return;
        }

        window.showLoading();
        const contactHash = await cryptoUtils.hashPassword(result.password);

        if (contactHash !== expectedContactHash) {
            window.hideLoading();
            window.showToast("Le mot de passe contact est incorrect.", "error");
            passwordInput.value = '';
            return;
        }

        // Send alert email
        try {
            await api.postToApi({
                action: 'emergencyAccess',
                name: result.name,
                section: sectionName,
                timestamp: new Date().toISOString()
            });

            // Set session variables and redirect
            sessionStorage.setItem(sessionKeyName, sectionPassword);
            sessionStorage.setItem('emergencyName', result.name);
            window.hideLoading();
            window.location.href = redirectUrl;

        } catch (error) {
            window.hideLoading();
            window.showToast("Erreur lors de l'envoi de l'alerte. Acces refuse.", "error");
            console.error("Emergency access failed", error);
        }
    }
});
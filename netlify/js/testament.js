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
    if (sessionStorage.getItem('testamentKey')) {
        await loadTestamentData(sessionStorage.getItem('testamentKey'));
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

        if (hash === serverData.testamentHash) {
            sessionStorage.setItem('testamentKey', password);
            loginContainer.classList.add('hidden');
            await loadTestamentData(password);
        } else {
            window.showToast("Mot de passe incorrect.", "error");
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    document.getElementById('save-btn').addEventListener('click', async (e) => {
        e.preventDefault();

        const testamentData = {
            content: document.getElementById('t-content').value,
            notary: document.getElementById('t-notary').value,
            location: document.getElementById('t-location').value,
            notes: document.getElementById('t-notes').value
        };

        const password = sessionStorage.getItem('testamentKey');
        if (!password) return;

        try {
            window.showLoading();
            const jsonStr = JSON.stringify(testamentData);
            const encrypted = await cryptoUtils.encryptData(jsonStr, password);

            await api.postToApi({ testament: encrypted });

            window.hideLoading();
            window.showToast("Testament sauvegarde avec succes.", "success");
        } catch (error) {
            window.hideLoading();
            window.showToast("Erreur lors de la sauvegarde.", "error");
        }
    });

    async function loadTestamentData(password) {
        if (!serverData.testament) {
            contentContainer.classList.remove('hidden');
            return;
        }

        try {
            window.showLoading();
            const decrypted = await cryptoUtils.decryptData(serverData.testament, password);
            const data = JSON.parse(decrypted);

            document.getElementById('t-content').value = data.content || '';
            document.getElementById('t-notary').value = data.notary || '';
            document.getElementById('t-location').value = data.location || '';
            document.getElementById('t-notes').value = data.notes || '';

            window.hideLoading();
            contentContainer.classList.remove('hidden');
        } catch (error) {
            window.hideLoading();
            window.showToast("Echec du dechiffrement. La cle est invalide.", "error");
            sessionStorage.removeItem('testamentKey');
            loginContainer.classList.remove('hidden');
        }
    }
});
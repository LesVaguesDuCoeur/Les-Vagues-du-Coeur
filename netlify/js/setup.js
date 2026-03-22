document.addEventListener('DOMContentLoaded', () => {
    const setupBtn = document.getElementById('setup-btn');

    setupBtn.addEventListener('click', async () => {
        // Gathering inputs
        const apiUrl = document.getElementById('api-url').value.trim();
        const email = document.getElementById('email').value.trim();

        const pwdContact = document.getElementById('pwd-contact').value;
        const pwdContactConfirm = document.getElementById('pwd-contact-confirm').value;

        const pwdAdmin = document.getElementById('pwd-admin').value;
        const pwdAdminConfirm = document.getElementById('pwd-admin-confirm').value;

        const pwdVault = document.getElementById('pwd-vault').value;
        const pwdVaultConfirm = document.getElementById('pwd-vault-confirm').value;

        const pwdTestament = document.getElementById('pwd-testament').value;
        const pwdTestamentConfirm = document.getElementById('pwd-testament-confirm').value;

        // Validations
        if (!apiUrl.startsWith('https://script.google.com/')) {
            window.showToast("L'URL de l'API doit commencer par https://script.google.com/", "error");
            return;
        }

        if (!email.includes('@')) {
            window.showToast("L'email n'est pas valide.", "error");
            return;
        }

        const passwords = [
            { name: "Contact", val: pwdContact, confirm: pwdContactConfirm },
            { name: "Admin", val: pwdAdmin, confirm: pwdAdminConfirm },
            { name: "Vault", val: pwdVault, confirm: pwdVaultConfirm },
            { name: "Testament", val: pwdTestament, confirm: pwdTestamentConfirm }
        ];

        for (const pwd of passwords) {
            if (pwd.val.length < 4) {
                window.showToast(`Le mot de passe ${pwd.name} doit faire au moins 4 caracteres.`, "error");
                return;
            }
            if (pwd.val !== pwd.confirm) {
                window.showToast(`Les mots de passe ${pwd.name} ne correspondent pas.`, "error");
                return;
            }
        }

        try {
            window.showLoading();

            // Hash passwords
            const contactHash = await cryptoUtils.hashPassword(pwdContact);
            const adminHash = await cryptoUtils.hashPassword(pwdAdmin);
            const vaultHash = await cryptoUtils.hashPassword(pwdVault);
            const testamentHash = await cryptoUtils.hashPassword(pwdTestament);

            // Temporarily store API URL to allow postToApi to function
            localStorage.setItem('apiUrl', apiUrl);

            // Create payload for backend setup
            const setupPayload = {
                action: 'setup',
                contactHash,
                adminHash,
                vaultHash,
                testamentHash,
                email,
                contacts: '',
                vault: '',
                testament: ''
            };

            // Send to backend
            await api.postToApi(setupPayload);

            window.hideLoading();
            window.showToast("Configuration terminee avec succes !", "success");

            // Redirect to index after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);

        } catch (error) {
            window.hideLoading();
            window.showToast("Erreur lors de la configuration : " + error.message, "error");
            console.error("Setup failed", error);
            // Revert localStorage if setup failed
            localStorage.removeItem('apiUrl');
        }
    });
});
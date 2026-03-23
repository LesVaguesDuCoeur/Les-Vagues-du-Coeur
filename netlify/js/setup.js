document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await api.load();
        if (data.isSetup) {
            window.location.href = 'index.html';
            return;
        }
    } catch (e) {
        document.getElementById('setupError').innerText = "Erreur de connexion au serveur.";
    }

    const form = document.getElementById('setupForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const pwdAdmin = document.getElementById('pwdAdmin').value;
        const pwdEmergency = document.getElementById('pwdEmergency').value;
        const pwdVault = document.getElementById('pwdVault').value;
        const pwdTestament = document.getElementById('pwdTestament').value;

        const pwdAdminConfirm = document.getElementById('pwdAdminConfirm').value;
        const pwdEmergencyConfirm = document.getElementById('pwdEmergencyConfirm').value;
        const pwdVaultConfirm = document.getElementById('pwdVaultConfirm').value;
        const pwdTestamentConfirm = document.getElementById('pwdTestamentConfirm').value;

        const msgEmergency = document.getElementById('msgEmergency').value;
        const errorDiv = document.getElementById('setupError');
        const btnText = document.getElementById('setupBtnText');
        const submitBtn = form.querySelector('button[type="submit"]');

        if (pwdAdmin !== pwdAdminConfirm || pwdEmergency !== pwdEmergencyConfirm ||
            pwdVault !== pwdVaultConfirm || pwdTestament !== pwdTestamentConfirm) {
            errorDiv.innerText = "Les mots de passe ne correspondent pas à leur confirmation.";
            return;
        }

        const passwords = [pwdAdmin, pwdEmergency, pwdVault, pwdTestament];
        const uniquePasswords = new Set(passwords);

        if (uniquePasswords.size !== passwords.length) {
            errorDiv.innerText = "Les 4 mots de passe doivent être tous différents.";
            return;
        }

        if (pwdAdmin.length < 8 || pwdEmergency.length < 6 || pwdVault.length < 6 || pwdTestament.length < 6) {
            errorDiv.innerText = "Respectez la longueur minimale des mots de passe.";
            return;
        }

        submitBtn.disabled = true;
        btnText.innerHTML = '<span class="loader"></span>';
        errorDiv.innerText = "";

        try {
            const initialData = {
                isSetup: true,
                adminHash: hashPassword(pwdAdmin),
                emergencyHash: hashPassword(pwdEmergency),
                vaultHash: hashPassword(pwdVault),
                testamentHash: hashPassword(pwdTestament),

                // Option A: Encrypt vault and testament passwords with admin password
                encryptedVaultPassword: encryptData(pwdVault, pwdAdmin),
                encryptedTestamentPassword: encryptData(pwdTestament, pwdAdmin),

                // Encrypt empty arrays/objects with corresponding keys
                contacts: encryptData([], pwdAdmin),
                emergencyContacts: encryptData([], pwdEmergency),
                vaultData: encryptData([], pwdVault),
                testamentData: encryptData({content:'', lastModified:null}, pwdTestament),

                emergencyMessage: msgEmergency ? encryptData(msgEmergency, pwdAdmin) : encryptData("", pwdAdmin),
                accessLogs: encryptData([], pwdAdmin),
                publicAccessLogs: []
            };

            const response = await api.setup(initialData);

            if (response.success) {
                sessionStorage.setItem('adminKey', pwdAdmin);
                window.location.href = 'admin.html';
            } else {
                errorDiv.innerText = "Erreur lors de la sauvegarde: " + (response.error || "Inconnue");
                submitBtn.disabled = false;
                btnText.innerText = "Finaliser la configuration";
            }
        } catch (error) {
            errorDiv.innerText = "Erreur technique lors de la configuration.";
            submitBtn.disabled = false;
            btnText.innerText = "Finaliser la configuration";
        }
    });
});
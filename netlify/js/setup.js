// netlify/js/setup.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('setup-form');
    const errDiv = document.getElementById('setup-error');
    const btnSubmit = document.getElementById('btn-submit');

    form.onsubmit = async (e) => {
        e.preventDefault();
        errDiv.classList.add('hidden');
        errDiv.textContent = '';

        const admin = document.getElementById('pwd-admin').value;
        const adminConf = document.getElementById('pwd-admin-conf').value;
        const urg = document.getElementById('pwd-emerg').value;
        const urgConf = document.getElementById('pwd-emerg-conf').value;
        const vault = document.getElementById('pwd-vault').value;
        const vaultConf = document.getElementById('pwd-vault-conf').value;
        const test = document.getElementById('pwd-testament').value;
        const testConf = document.getElementById('pwd-testament-conf').value;
        const msg = document.getElementById('setup-emergency-message').value;

        // Validations
        if (admin !== adminConf) return showError("Les mots de passe ADMIN ne correspondent pas.");
        if (urg !== urgConf) return showError("Les mots de passe URGENCE ne correspondent pas.");
        if (vault !== vaultConf) return showError("Les mots de passe VAULT ne correspondent pas.");
        if (test !== testConf) return showError("Les mots de passe TESTAMENT ne correspondent pas.");

        const pwds = [admin, urg, vault, test];
        const uniquePwds = new Set(pwds);
        if (uniquePwds.size !== pwds.length) {
            return showError("Les 4 mots de passe DOIVENT être tous différents.");
        }

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Initialisation...';

        try {
            const defaultTestamentData = {
                identity: { nom: '', prenom: '', dateNaissance: '', lieuNaissance: '', nationalite: '', adresse: '' },
                content: '<p><br></p>',
                lastModified: new Date().toISOString()
            };

            const dataToSave = {
                isSetup: true,
                adminHash: hashPassword(admin),
                emergencyHash: hashPassword(urg),
                vaultHash: hashPassword(vault),
                testamentHash: hashPassword(test),
                encryptedEmergencyPassword: encryptData(urg, admin),
                encryptedVaultPassword: encryptData(vault, admin),
                encryptedTestamentPassword: encryptData(test, admin),
                contacts: encryptData([], admin),
                emergencyContacts: encryptData([], urg),
                vaultData: encryptData([], vault),
                testamentData: encryptData(defaultTestamentData, test),
                emergencyMessage: encryptData(msg || '', admin),
                emergencyMessageForEmergency: encryptData(msg || '', urg),
                accessLogs: encryptData([], admin),
                publicAccessLogs: []
            };

            await postToApi({ action: 'setup', data: dataToSave });
            sessionStorage.setItem('adminKey', admin);
            window.location.href = 'admin.html';

        } catch (error) {
            showError("Erreur lors de la sauvegarde sur le serveur.");
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="fas fa-lock mr-2"></i> Initialiser et chiffrer';
        }
    };

    function showError(msg) {
        errDiv.textContent = msg;
        errDiv.classList.remove('hidden');
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const btnLogout = document.getElementById('btn-logout');
    const btnChangePasswords = document.getElementById('btn-change-passwords');

    // Check if admin is logged in
    const adminKey = sessionStorage.getItem('adminKey');
    if (!adminKey) {
        showToast("Accès refusé. Veuillez vous connecter.", "error");
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }

    btnLogout.addEventListener('click', () => {
        sessionStorage.clear();
    });

    btnChangePasswords.addEventListener('click', async () => {
        const confirm = await showConfirm("Voulez-vous vraiment réinitialiser les mots de passe ?\nATTENTION : Cette action effacera toutes les données actuelles (les données sont chiffrées avec les anciens mots de passe).", "Avertissement Critique");
        if (confirm) {
            // Since we can't easily re-encrypt all existing data without asking for the old passwords,
            // and the simplest "reset" is to just run setup again, we will clear the DB and redirect to setup.
            // But wait, the spec says "Peut modifier les mots de passe".
            // Actually, if we wipe everything we lose the contacts/vault/testament.
            // Let's implement a safe re-encryption using the adminKey since we have the encrypted keys!

            showLoader();
            try {
                let dbData = await loadFromApi();

                if (!dbData.encryptedContactKey || !dbData.encryptedVaultKey || !dbData.encryptedTestamentKey) {
                    hideLoader();
                    return showToast("Données corrompues, impossible de ré-chiffrer. Veuillez réinitialiser complètement.", "error");
                }

                // 1. Get new passwords
                hideLoader();
                const newAdmin = await showPrompt("Nouveau mot de passe ADMIN (laissez vide pour annuler)", "", "Nouveau mot de passe");
                if (!newAdmin) return;

                const newContact = await showPrompt("Nouveau mot de passe CONTACT", "", "Nouveau mot de passe");
                if (!newContact) return;

                const newVault = await showPrompt("Nouveau mot de passe VAULT", "", "Nouveau mot de passe");
                if (!newVault) return;

                const newTestament = await showPrompt("Nouveau mot de passe TESTAMENT", "", "Nouveau mot de passe");
                if (!newTestament) return;

                showLoader();
                // 2. Decrypt current keys using current adminKey
                const oldContactKey = await decryptData(dbData.encryptedContactKey, adminKey, false);
                const oldVaultKey = await decryptData(dbData.encryptedVaultKey, adminKey, false);
                const oldTestamentKey = await decryptData(dbData.encryptedTestamentKey, adminKey, false);

                // 3. Decrypt data
                let contactsData = dbData.contacts ? await decryptData(dbData.contacts, oldContactKey, true) : [];
                let vaultData = dbData.vault ? await decryptData(dbData.vault, oldVaultKey, true) : {};
                let testamentData = dbData.testament ? await decryptData(dbData.testament, oldTestamentKey, true) : {};

                // 4. Encrypt with new keys
                const newContactsEnc = await encryptData(contactsData, newContact);
                const newVaultEnc = await encryptData(vaultData, newVault);
                const newTestamentEnc = await encryptData(testamentData, newTestament);

                // 5. Encrypt new keys with new admin key
                const newEncContactKey = await encryptData(newContact, newAdmin);
                const newEncVaultKey = await encryptData(newVault, newAdmin);
                const newEncTestamentKey = await encryptData(newTestament, newAdmin);

                // 6. Save new setup
                const payload = {
                    action: 'setup',
                    data: {
                        email: dbData.email, // keep same email
                        contactHash: await hashSHA256(newContact),
                        adminHash: await hashSHA256(newAdmin),
                        vaultHash: await hashSHA256(newVault),
                        testamentHash: await hashSHA256(newTestament),
                        encryptedContactKey: newEncContactKey,
                        encryptedVaultKey: newEncVaultKey,
                        encryptedTestamentKey: newEncTestamentKey
                    }
                };

                await postToApi(payload);

                // Save the newly re-encrypted data
                await postToApi({
                    action: 'save',
                    data: {
                        contacts: newContactsEnc,
                        vault: newVaultEnc,
                        testament: newTestamentEnc
                    }
                });

                sessionStorage.clear();
                hideLoader();
                await showAlert("Mots de passe modifiés avec succès. Veuillez vous reconnecter.", "Succès");
                window.location.href = 'index.html';

            } catch (error) {
                hideLoader();
                console.error(error);
                showToast("Erreur lors de la modification des mots de passe", "error");
            }
        }
    });
});

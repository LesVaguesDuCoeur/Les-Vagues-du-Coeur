document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('setup-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;

    const pContact = document.getElementById('pwd-contact').value;
    const pContactConf = document.getElementById('pwd-contact-confirm').value;

    const pAdmin = document.getElementById('pwd-admin').value;
    const pAdminConf = document.getElementById('pwd-admin-confirm').value;

    const pVault = document.getElementById('pwd-vault').value;
    const pVaultConf = document.getElementById('pwd-vault-confirm').value;

    const pTestament = document.getElementById('pwd-testament').value;
    const pTestamentConf = document.getElementById('pwd-testament-confirm').value;

    // Validations
    if (pContact !== pContactConf) { return showToast("Les mots de passe Contact ne correspondent pas.", 'error'); }
    if (pAdmin !== pAdminConf) { return showToast("Les mots de passe Admin ne correspondent pas.", 'error'); }
    if (pVault !== pVaultConf) { return showToast("Les mots de passe Vault ne correspondent pas.", 'error'); }
    if (pTestament !== pTestamentConf) { return showToast("Les mots de passe Testament ne correspondent pas.", 'error'); }

    // Check for uniqueness
    const passwords = [pContact, pAdmin, pVault, pTestament];
    const uniquePasswords = new Set(passwords);
    if (uniquePasswords.size !== passwords.length) {
      return showToast("Les 4 mots de passe doivent être tous différents.", 'error');
    }

    showLoader();
    try {
      // Hash all passwords
      const contactHash = await hashSHA256(pContact);
      const adminHash = await hashSHA256(pAdmin);
      const vaultHash = await hashSHA256(pVault);
      const testamentHash = await hashSHA256(pTestament);

      // Memory instruction: "keys (like Vault or Testament passwords) are themselves encrypted with the master Admin password to allow complete administrative access."
      const encryptedContactKey = await encryptData(pContact, pAdmin);
      const encryptedVaultKey = await encryptData(pVault, pAdmin);
      const encryptedTestamentKey = await encryptData(pTestament, pAdmin);

      const setupData = {
        action: 'setup',
        data: {
          email: email,
          contactHash: contactHash,
          adminHash: adminHash,
          vaultHash: vaultHash,
          testamentHash: testamentHash,
          encryptedContactKey: encryptedContactKey,
          encryptedVaultKey: encryptedVaultKey,
          encryptedTestamentKey: encryptedTestamentKey
        }
      };

      await postToApi(setupData);

      hideLoader();
      showToast("Configuration réussie !", 'success');

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);

    } catch (error) {
      hideLoader();
      showToast(error.message || "Erreur lors de la configuration.", 'error');
    }
  });
});

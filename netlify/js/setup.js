document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('setup-form');
  const adminPwd = document.getElementById('admin-pwd');
  const emergencyPwd = document.getElementById('emergency-pwd');
  const vaultPwd = document.getElementById('vault-pwd');
  const testamentPwd = document.getElementById('testament-pwd');
  const btnSetup = document.getElementById('btn-setup');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const pwds = [adminPwd.value, emergencyPwd.value, vaultPwd.value, testamentPwd.value];
    if (new Set(pwds).size !== pwds.length) {
      alert("Tous les mots de passe doivent être différents.");
      return;
    }

    if (adminPwd.value.length < 8) {
      alert("Le mot de passe admin doit faire au moins 8 caractères.");
      return;
    }

    showLoader();
    btnSetup.disabled = true;

    const adminHash = CryptoJS.SHA256(adminPwd.value).toString();
    const emergencyHash = CryptoJS.SHA256(emergencyPwd.value).toString();
    const vaultHash = CryptoJS.SHA256(vaultPwd.value).toString();
    const testamentHash = CryptoJS.SHA256(testamentPwd.value).toString();

    const emptyContacts = encryptData([], adminPwd.value);
    const emptyEmergencyContacts = encryptData([], emergencyPwd.value);

    // To allow the admin to decrypt the vault and testament without knowing the passwords,
    // we encrypt those passwords with the admin password.
    const vaultKeyEncrypted = encryptData(vaultPwd.value, adminPwd.value);
    const testamentKeyEncrypted = encryptData(testamentPwd.value, adminPwd.value);

    const initialData = {
      isSetup: true,
      adminHash: adminHash,
      emergencyHash: emergencyHash,
      vaultHash: vaultHash,
      testamentHash: testamentHash,
      contacts: emptyContacts,
      emergencyContacts: emptyEmergencyContacts,
      notes: encryptData("", adminPwd.value),
      vaultData: encryptData({ a: [], b: [], c: [], d: "" }, vaultPwd.value),
      vaultKeyEncrypted: vaultKeyEncrypted,
      testament: encryptData("", testamentPwd.value),
      testamentKeyEncrypted: testamentKeyEncrypted,
      lockedItems: {}
    };

    const res = await postToApi(initialData);

    hideLoader();
    if (res && res.success) {
      sessionStorage.setItem('adminKey', adminPwd.value);
      sessionStorage.setItem('adminHash', adminHash);
      window.location.href = 'admin.html';
    } else {
      alert("Erreur lors de l'enregistrement. Veuillez réessayer.");
      btnSetup.disabled = false;
    }
  });
});
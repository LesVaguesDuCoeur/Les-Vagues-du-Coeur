document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('setup-form');
  const adminPwd = document.getElementById('admin-pwd');
  const adminPwd2 = document.getElementById('admin-pwd2');
  const emergencyPwd = document.getElementById('emergency-pwd');
  const emergencyPwd2 = document.getElementById('emergency-pwd2');
  const vaultPwd = document.getElementById('vault-pwd');
  const vaultPwd2 = document.getElementById('vault-pwd2');
  const testamentPwd = document.getElementById('testament-pwd');
  const testamentPwd2 = document.getElementById('testament-pwd2');
  const btnSetup = document.getElementById('btn-setup');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (adminPwd.value !== adminPwd2.value) { showToast("Les mots de passe administrateur ne correspondent pas."); return; }
    if (emergencyPwd.value !== emergencyPwd2.value) { showToast("Les mots de passe urgence ne correspondent pas."); return; }
    if (vaultPwd.value !== vaultPwd2.value) { showToast("Les mots de passe fiche personnelle ne correspondent pas."); return; }
    if (testamentPwd.value !== testamentPwd2.value) { showToast("Les mots de passe testament ne correspondent pas."); return; }

    const pwds = [adminPwd.value, emergencyPwd.value, vaultPwd.value, testamentPwd.value];
    if (new Set(pwds).size !== pwds.length) {
      showToast("Tous les mots de passe principaux doivent être différents.");
      return;
    }

    if (adminPwd.value.length < 8) {
      showToast("Le mot de passe admin doit faire au moins 8 caractères.");
      return;
    }

    showLoader();
    btnSetup.disabled = true;

    const adminHash = CryptoJS.SHA256(adminPwd.value).toString();
    const emergencyHash = CryptoJS.SHA256(emergencyPwd.value).toString();
    const vaultHash = CryptoJS.SHA256(vaultPwd.value).toString();
    const testamentHash = CryptoJS.SHA256(testamentPwd.value).toString();

    const payload = {
      isSetup: true,
      adminHash:     CryptoJS.SHA256(adminPwd.value).toString(),
      emergencyHash: CryptoJS.SHA256(emergencyPwd.value).toString(),
      vaultHash:     CryptoJS.SHA256(vaultPwd.value).toString(),
      testamentHash: CryptoJS.SHA256(testamentPwd.value).toString(),

      // Clés croisées pour le bypass admin
      vaultKeyEnc:     encryptData(vaultPwd.value, adminPwd.value),
      testamentKeyEnc: encryptData(testamentPwd.value, adminPwd.value),

      // Données initiales chiffrées
      contacts:          encryptData([], adminPwd.value),
      emergencyContacts: encryptData([], emergencyPwd.value),
      vault:             encryptData({ apps: [], bank: [], docs: [], notes: '' }, vaultPwd.value),
      testament:         encryptData({ content: '', notaire: '' }, testamentPwd.value)
    };

    const res = await postToApi(payload);

    hideLoader();
    if (res && res.success) {
      sessionStorage.setItem('adminKey', adminPwd.value);
      sessionStorage.setItem('adminHash', payload.adminHash);
      window.location.href = 'admin.html';
    } else {
      showToast("Erreur lors de l'enregistrement. Veuillez réessayer.");
      btnSetup.disabled = false;
    }
  });
});
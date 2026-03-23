document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('setup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const adminPwd = document.getElementById('admin-pwd').value;
    const emergencyPwd = document.getElementById('emergency-pwd').value;
    const vaultPwd = document.getElementById('vault-pwd').value;
    const testamentPwd = document.getElementById('testament-pwd').value;
    const btn = document.getElementById('btn-submit');

    if (!adminPwd || !emergencyPwd || !vaultPwd || !testamentPwd) {
      showToast('Tous les champs sont requis', 'error');
      return;
    }

    btn.disabled = true;
    btn.innerText = 'Initialisation...';

    const setupData = {
      isSetup: true,
      adminHash: hashPassword(adminPwd),
      emergencyHash: hashPassword(emergencyPwd),
      vaultHash: hashPassword(vaultPwd),
      testamentHash: hashPassword(testamentPwd),
      encryptedEmergencyPassword: encryptData(emergencyPwd, adminPwd),
      encryptedVaultPassword: encryptData(vaultPwd, adminPwd),
      encryptedTestamentPassword: encryptData(testamentPwd, adminPwd),
      contacts: encryptData([], adminPwd),
      emergencyContacts: encryptData([], emergencyPwd),
      vaultData: encryptData([], vaultPwd),
      testamentData: encryptData({ identity: {}, content: '', lastModified: null }, testamentPwd),
      emergencyMessage: encryptData('', adminPwd),
      emergencyMessageForEmergency: encryptData('', emergencyPwd),
      accessLogs: encryptData([], adminPwd),
      publicAccessLogs: []
    };

    try {
      const res = await postToApi({ action: 'setup', data: setupData });
      if (res.status === 'success') {
        showToast('Initialisation réussie !', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
      } else {
        throw new Error(res.error || 'Erreur inconnue');
      }
    } catch (err) {
      showToast('Erreur: ' + err.message, 'error');
      btn.disabled = false;
      btn.innerText = 'Initialiser';
    }
  });
});
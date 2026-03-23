document.addEventListener('DOMContentLoaded', async () => {
  const data = await loadData();
  if (data.isSetup) {
    window.location.href = 'index.html';
    return;
  }

  const btn = document.getElementById('setup-btn');
  btn.addEventListener('click', async () => {
    const admin = document.getElementById('s-admin').value;
    const emergency = document.getElementById('s-emergency').value;
    const vault = document.getElementById('s-vault').value;
    const testament = document.getElementById('s-testament').value;

    if (!admin || !emergency || !vault || !testament) {
      showToast('Tous les champs sont requis', 'error');
      return;
    }

    btn.disabled = true;
    btn.innerText = 'Configuration en cours...';

    const payload = {
      isSetup: true,
      adminHash: hashData(admin),
      emergencyHash: hashData(emergency),
      vaultHash: hashData(vault),
      testamentHash: hashData(testament),
      encryptedEmergencyPassword: encryptData(emergency, admin),
      encryptedVaultPassword: encryptData(vault, admin),
      encryptedTestamentPassword: encryptData(testament, admin),
      contacts: encryptData([], admin),
      emergencyContacts: encryptData([], emergency),
      vaultData: encryptData([], vault),
      testamentData: encryptData({ identity: {}, content: '', lastModified: new Date().toISOString() }, testament),
      emergencyMessage: encryptData('', admin),
      emergencyMessageForEmergency: encryptData('', emergency),
      accessLogs: encryptData([], admin),
      publicAccessLogs: []
    };

    try {
      await postToApi({ action: 'setup', data: payload });
      showToast('Configuration terminée', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    } catch (e) {
      showToast('Erreur lors de la configuration', 'error');
      btn.disabled = false;
      btn.innerText = 'Initialiser le Coffre';
    }
  });
});
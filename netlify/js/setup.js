// setup.js - Initialize JSON structure and passwords

document.addEventListener('DOMContentLoaded', async () => {
  const btnSetup = document.getElementById('btn-setup');
  const spinner = document.getElementById('loading-spinner');
  const form = document.getElementById('setup-form');

  try {
    // Check if already setup
    const data = await fetchData();
    if (data && data.isSetup) {
      window.location.href = 'index.html';
      return;
    }
  } catch (e) {
    console.log("Assuming clean state. Initializing setup.");
  }

  btnSetup.addEventListener('click', async () => {
    const admin = document.getElementById('pwd-admin').value;
    const emergency = document.getElementById('pwd-emergency').value;
    const vault = document.getElementById('pwd-vault').value;
    const testament = document.getElementById('pwd-testament').value;

    if (!admin || !emergency || !vault || !testament) {
      showToast('Veuillez remplir tous les champs.', 'error');
      return;
    }

    form.classList.add('hidden');
    spinner.classList.remove('hidden');

    try {
      const initData = {
        action: 'setup',
        data: {
          isSetup: true,
          adminHash: hashData(admin),
          emergencyHash: hashData(emergency),
          vaultHash: hashData(vault),
          testamentHash: hashData(testament),

          // Encrypted secondary passwords for admin recovery
          encryptedEmergencyPassword: encryptData(emergency, admin),
          encryptedVaultPassword: encryptData(vault, admin),
          encryptedTestamentPassword: encryptData(testament, admin),

          // Data stores
          contacts: encryptData([], admin),
          emergencyContacts: encryptData([], emergency),
          vaultData: encryptData([], vault),
          testamentData: encryptData({
            identity: {
              nom: '', prenom: '', dateNaissance: '', lieuNaissance: '', nationalite: '', adresse: ''
            },
            content: '',
            lastModified: new Date().toISOString()
          }, testament),

          // Settings & Logs
          emergencyMessage: encryptData('', admin),
          emergencyMessageForEmergency: encryptData('', emergency),
          accessLogs: encryptData([], admin),
          publicAccessLogs: []
        }
      };

      await postToApi(initData);

      showToast('Configuration terminée !', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);

    } catch (e) {
      console.error(e);
      showToast('Erreur lors de la configuration.', 'error');
      spinner.classList.add('hidden');
      form.classList.remove('hidden');
    }
  });
});

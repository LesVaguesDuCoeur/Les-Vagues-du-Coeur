document.addEventListener('DOMContentLoaded', async () => {
  const data = await loadData();
  if (data && data.isSetup) {
    window.location.href = 'index.html';
    return;
  }

  const form = document.getElementById('setupForm');
  const errorDiv = document.getElementById('setupError');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.classList.add('hidden');

    const adminPwd = document.getElementById('adminPwd').value;
    const adminPwdConfirm = document.getElementById('adminPwdConfirm').value;
    const emergencyPwd = document.getElementById('emergencyPwd').value;
    const emergencyPwdConfirm = document.getElementById('emergencyPwdConfirm').value;
    const vaultPwd = document.getElementById('vaultPwd').value;
    const vaultPwdConfirm = document.getElementById('vaultPwdConfirm').value;
    const testamentPwd = document.getElementById('testamentPwd').value;
    const testamentPwdConfirm = document.getElementById('testamentPwdConfirm').value;
    const emergencyMessage = document.getElementById('emergencyMessage').value;

    if (adminPwd !== adminPwdConfirm || emergencyPwd !== emergencyPwdConfirm || vaultPwd !== vaultPwdConfirm || testamentPwd !== testamentPwdConfirm) {
      errorDiv.textContent = 'Les mots de passe ne correspondent pas';
      errorDiv.classList.remove('hidden');
      return;
    }

    const passwords = [adminPwd, emergencyPwd, vaultPwd, testamentPwd];
    const uniquePasswords = new Set(passwords);
    if (uniquePasswords.size !== 4) {
      errorDiv.textContent = 'Tous les mots de passe doivent être différents';
      errorDiv.classList.remove('hidden');
      return;
    }

    if (adminPwd.length < 8 || emergencyPwd.length < 6 || vaultPwd.length < 6 || testamentPwd.length < 6) {
      errorDiv.textContent = 'La longueur minimale des mots de passe n\'est pas respectée';
      errorDiv.classList.remove('hidden');
      return;
    }

    const btn = document.getElementById('submitSetupBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';

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
      emergencyMessage: encryptData(emergencyMessage, adminPwd),
      emergencyMessageForEmergency: encryptData(emergencyMessage, emergencyPwd),
      accessLogs: encryptData([], adminPwd),
      publicAccessLogs: []
    };

    const success = await postToApi({ action: 'setup', data: setupData });

    if (success) {
      sessionStorage.setItem('adminKey', adminPwd);
      window.location.href = 'admin.html';
    } else {
      errorDiv.textContent = 'Erreur lors de la création du coffre';
      errorDiv.classList.remove('hidden');
      btn.disabled = false;
      btn.innerHTML = 'Initialiser le Coffre';
    }
  });
});

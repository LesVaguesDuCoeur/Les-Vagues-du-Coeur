document.getElementById('setupForm').onsubmit = async (e) => {
  e.preventDefault();

  const pA = document.getElementById('adminPwd').value;
  const pA2 = document.getElementById('adminPwdConfirm').value;
  const pU = document.getElementById('urgPwd').value;
  const pU2 = document.getElementById('urgPwdConfirm').value;
  const pV = document.getElementById('vaultPwd').value;
  const pV2 = document.getElementById('vaultPwdConfirm').value;
  const pT = document.getElementById('testPwd').value;
  const pT2 = document.getElementById('testPwdConfirm').value;
  const msg = document.getElementById('urgMessage').value;

  if (pA !== pA2 || pU !== pU2 || pV !== pV2 || pT !== pT2) {
    showToast('Les mots de passe ne correspondent pas.', 'error');
    return;
  }

  const pwds = [pA, pU, pV, pT];
  if (new Set(pwds).size !== 4) {
    showToast('Tous les mots de passe doivent être différents.', 'error');
    return;
  }

  document.getElementById('submitBtn').disabled = true;
  document.getElementById('submitBtn').textContent = 'Création en cours...';

  const data = {
    isSetup: true,
    adminHash: hashPassword(pA),
    emergencyHash: hashPassword(pU),
    vaultHash: hashPassword(pV),
    testamentHash: hashPassword(pT),
    encryptedEmergencyPassword: encryptData(pU, pA),
    encryptedVaultPassword: encryptData(pV, pA),
    encryptedTestamentPassword: encryptData(pT, pA),
    contacts: encryptData([], pA),
    emergencyContacts: encryptData([], pU),
    vaultData: encryptData([], pV),
    testamentData: encryptData({ identity: {}, content: '', lastModified: null }, pT),
    emergencyMessage: encryptData(msg, pA),
    emergencyMessageForEmergency: encryptData(msg, pU),
    accessLogs: encryptData([], pA),
    publicAccessLogs: []
  };

  try {
    const res = await postToApi({ action: 'setup', data });
    if (res.status === 'success') {
      window.location.href = 'index.html';
    } else {
      throw new Error('Erreur API');
    }
  } catch (err) {
    showToast('Erreur lors de la sauvegarde.', 'error');
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('submitBtn').textContent = 'Terminer l\'installation';
  }
};
document.addEventListener('DOMContentLoaded', async () => {
  const d = await loadData();
  if (d.isSetup) window.location.href = 'index.html';

  document.getElementById('setupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('loader').classList.remove('hidden');
    document.getElementById('btnSetup').disabled = true;

    const pA = document.getElementById('pwdAdmin').value;
    const pU = document.getElementById('pwdUrgence').value;
    const pV = document.getElementById('pwdVault').value;
    const pT = document.getElementById('pwdTestament').value;

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
      testamentData: encryptData({identity:{}, content:'', lastModified:null}, pT),
      emergencyMessage: encryptData('', pA),
      emergencyMessageForEmergency: encryptData('', pU),
      accessLogs: encryptData([], pA),
      publicAccessLogs: []
    };

    const res = await postToApi({ action: 'setup', data: data });
    if (res.status === 'success') {
      window.location.href = 'index.html';
    } else {
      showToast('Erreur', 'error');
      document.getElementById('loader').classList.add('hidden');
      document.getElementById('btnSetup').disabled = false;
    }
  });
});

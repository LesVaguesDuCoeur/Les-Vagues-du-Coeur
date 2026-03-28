document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await loadData();
    if (data.config && data.config.isSetup) {
      window.location.href = 'index.html';
      return;
    }
  } catch (e) {}

  ['admin', 'emergency', 'vault', 'testament'].forEach(type => {
    const inp = document.getElementById(`${type}-pwd`);
    const s = document.getElementById(`${type}-strength`);
    inp.addEventListener('input', () => {
      const val = inp.value;
      let score = 0;
      if (val.length >= 6) score++;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      let level = 's1';
      if (val.length >= (type === 'admin' ? 8 : 6)) {
        if (score >= 4) level = 's4';
        else if (score === 3) level = 's3';
        else if (score === 2) level = 's2';
      } else {
        level = 's1';
      }
      s.className = `pwd-strength ${val.length > 0 ? level : ''}`;
    });
  });
});

document.getElementById('setup-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const a = document.getElementById('admin-pwd').value;
  const ac = document.getElementById('admin-pwd-conf').value;
  const u = document.getElementById('emergency-pwd').value;
  const uc = document.getElementById('emergency-pwd-conf').value;
  const v = document.getElementById('vault-pwd').value;
  const vc = document.getElementById('vault-pwd-conf').value;
  const t = document.getElementById('testament-pwd').value;
  const tc = document.getElementById('testament-pwd-conf').value;
  const m = document.getElementById('emergency-msg').value;

  if (a !== ac || u !== uc || v !== vc || t !== tc) {
    showToast("Les mots de passe ne correspondent pas aux confirmations", "error");
    return;
  }

  const arr = [a, u, v, t];
  const set = new Set(arr);
  if (set.size !== 4) {
    showToast("Les 4 codes doivent être différents", "error");
    return;
  }

  showLoading();

  const configObj = {
    isSetup: true,
    adminHash: hashPassword(a),
    emergencyHash: hashPassword(u),
    vaultHash: hashPassword(v),
    testamentHash: hashPassword(t),
    encryptedEmergencyPassword: encryptData(u, a),
    encryptedVaultPassword: encryptData(v, a),
    encryptedTestamentPassword: encryptData(t, a),
    publicAccessLogs: []
  };

  if (m) {
    configObj.emergencyMessage = encryptData(m, a);
    configObj.emergencyMessageForEmergency = encryptData(m, u);
  } else {
    configObj.emergencyMessage = "";
    configObj.emergencyMessageForEmergency = "";
  }

  try {
    await postToApi({ action: 'setup', data: configObj });
    hideLoading();
    window.location.href = 'index.html';
  } catch (err) {
    hideLoading();
    showToast("Erreur lors de la configuration", "error");
  }
});
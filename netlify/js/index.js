let appData = null;
let attempts = 0;
let lockoutTime = 0;
let pendingTarget = null;
let currentEnteredPwd = null;

window.onload = async () => {
  try {
    appData = await loadData();
    if (!appData.isSetup) {
      window.location.href = 'setup.html';
      return;
    }
    document.getElementById('loadingIndicator').classList.add('hidden');
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('loginSection').classList.add('flex-col');
  } catch (e) {
    document.getElementById('loadingIndicator').textContent = 'Erreur de connexion';
  }
};

document.getElementById('loginForm').onsubmit = async (e) => {
  e.preventDefault();
  if (Date.now() < lockoutTime) {
    showToast(`Bloqué. Attendez la fin du délai.`, 'error');
    return;
  }

  const pwd = document.getElementById('password').value;
  const hash = hashPassword(pwd);

  if (hash === appData.adminHash) {
    sessionStorage.setItem('adminKey', pwd);
    window.location.href = 'admin.html';
    return;
  }

  if (hash === appData.emergencyHash) {
    sessionStorage.setItem('emergencyKey', pwd);
    const info = await getClientInfo();
    await postToApi({ emergencyAccess: true, ...info });
    window.location.href = 'emergency.html';
    return;
  }

  if (hash === appData.vaultHash) {
    pendingTarget = 'vault';
    currentEnteredPwd = pwd;
    showModal('nameModal');
    return;
  }

  if (hash === appData.testamentHash) {
    pendingTarget = 'testament';
    currentEnteredPwd = pwd;
    showModal('nameModal');
    return;
  }

  attempts++;
  if (attempts >= 10) {
    lockoutTime = Date.now() + 600000;
    const info = await getClientInfo();
    await postToApi({ suspiciousActivity: true, ...info });
    showToast('Compte bloqué 10 min. Alerte envoyée.', 'error');
  } else if (attempts >= 5) {
    lockoutTime = Date.now() + 120000;
    showToast('Compte bloqué 2 minutes.', 'error');
  } else if (attempts >= 3) {
    lockoutTime = Date.now() + 30000;
    showToast('Compte bloqué 30 secondes.', 'error');
  } else {
    showToast('Mot de passe incorrect', 'error');
  }
};

document.getElementById('nameForm').onsubmit = async (e) => {
  e.preventDefault();
  const name = document.getElementById('visitorName').value;
  const urgPwd = document.getElementById('visitorEmergencyPwd').value;

  if (hashPassword(urgPwd) !== appData.emergencyHash) {
    showToast('Mot de passe urgence incorrect', 'error');
    return;
  }

  hideModal('nameModal');
  const info = await getClientInfo();
  info.nomComplet = name;

  if (pendingTarget === 'vault') {
    sessionStorage.setItem('vaultKey', currentEnteredPwd);
    sessionStorage.setItem('vaultUrgKey', urgPwd);
    await postToApi({ vaultAccess: true, ...info });
    window.location.href = 'vault.html';
  } else if (pendingTarget === 'testament') {
    sessionStorage.setItem('testamentKey', currentEnteredPwd);
    sessionStorage.setItem('testamentUrgKey', urgPwd);
    await postToApi({ testamentAccess: true, ...info });
    window.location.href = 'testament.html';
  }
};
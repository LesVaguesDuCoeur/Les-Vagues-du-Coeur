let attempts = 0;
let lockoutTime = 0;

document.addEventListener('DOMContentLoaded', async () => {
  // Check lockout
  const savedLockout = localStorage.getItem('lockoutTime');
  if (savedLockout && Date.now() < parseInt(savedLockout)) {
    handleLockout(parseInt(savedLockout));
  }

  showLoader();
  const data = await fetchFromApi();
  hideLoader();

  if (data && data.isSetup === false) {
    window.location.href = 'setup.html';
    return;
  }

  const accessInput = document.getElementById('access-code');
  const btnLogin = document.getElementById('btn-login');
  const errorMsg = document.getElementById('error-message');

  const attemptLogin = async () => {
    if (Date.now() < lockoutTime) {
      showError(`Compte bloqué. Réessayez plus tard.`);
      return;
    }

    const code = accessInput.value.trim();
    if (!code) return;

    const hash = hashPassword(code);

    showLoader();
    if (data && data.adminHash === hash) {
      sessionStorage.setItem('adminKey', code);
      sessionStorage.setItem('adminHash', hash);
      window.location.href = 'admin.html';
    } else if (data && data.emergencyHash === hash) {
      sessionStorage.setItem('emergencyKey', code);
      sessionStorage.setItem('emergencyHash', hash);

      // Trigger emergency alert
      let ip = 'non disponible', userAgent = navigator.userAgent, gps = null;

      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ip = ipData.ip;
      } catch(e) {}

      // Try get GPS (non blocking)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          gps = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          sendAlertAndRedirect();
        }, () => {
          sendAlertAndRedirect();
        }, { timeout: 3000 });
      } else {
        sendAlertAndRedirect();
      }

      async function sendAlertAndRedirect() {
        await postToApi({
          action: 'emergencyAccess',
          emergencyAccess: true,
          ip,
          userAgent,
          gps
        });
        window.location.href = 'emergency.html';
      }

    } else if (data && data.vaultHash === hash) {
      sessionStorage.setItem('vaultKey', code);
      sessionStorage.setItem('vaultHash', hash);
      window.location.href = 'vault.html';
    } else if (data && data.testamentHash === hash) {
      sessionStorage.setItem('testamentKey', code);
      sessionStorage.setItem('testamentHash', hash);
      window.location.href = 'testament.html';
    } else {
      hideLoader();
      attempts++;
      showError('Code incorrect');
      accessInput.value = '';

      if (attempts >= 3) {
        lockoutTime = Date.now() + 30000; // 30 seconds
        localStorage.setItem('lockoutTime', lockoutTime);
        handleLockout(lockoutTime);
      }
    }
  };

  btnLogin.addEventListener('click', attemptLogin);
  accessInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') attemptLogin();
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
    setTimeout(() => { errorMsg.classList.add('hidden'); }, 3000);
  }

  function handleLockout(endTime) {
    accessInput.disabled = true;
    btnLogin.disabled = true;

    const interval = setInterval(() => {
      const remaining = Math.ceil((endTime - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(interval);
        accessInput.disabled = false;
        btnLogin.disabled = false;
        attempts = 0;
        localStorage.removeItem('lockoutTime');
        errorMsg.classList.add('hidden');
      } else {
        errorMsg.textContent = `Bloqué: réessayez dans ${remaining}s`;
        errorMsg.classList.remove('hidden');
      }
    }, 1000);
  }
});
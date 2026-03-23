let globalData = null;
let attempts = 0;
let lockoutTime = 0;

document.addEventListener('DOMContentLoaded', async () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }

  const loading = document.getElementById('loading');
  const loginForm = document.getElementById('login-form');
  const loginPwd = document.getElementById('login-pwd');
  const btnLogin = document.getElementById('btn-login');

  try {
    globalData = await loadData();
    if (!globalData.isSetup) {
      window.location.href = 'setup.html';
      return;
    }
    loading.classList.add('hidden');
    loginForm.classList.remove('hidden');
    loginForm.classList.add('flex');
    loginPwd.focus();
  } catch (err) {
    loading.innerText = 'Erreur de connexion. Veuillez réessayer.';
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (Date.now() < lockoutTime) {
      showToast(`Verrouillé. Réessayez plus tard.`, 'error');
      return;
    }

    const pwd = loginPwd.value;
    const hash = hashPassword(pwd);
    btnLogin.disabled = true;

    if (hash === globalData.adminHash) {
      sessionStorage.setItem('adminKey', pwd);
      window.location.href = 'admin.html';
    } else if (hash === globalData.emergencyHash) {
      sessionStorage.setItem('emergencyKey', pwd);
      const info = await getClientInfo();
      await postToApi({ emergencyAccess: true, ip: info.ip, userAgent: info.userAgent, lat: info.lat, lng: info.lng });
      window.location.href = 'emergency.html';
    } else if (hash === globalData.vaultHash) {
      promptExternalAccess('vault', pwd);
    } else if (hash === globalData.testamentHash) {
      promptExternalAccess('testament', pwd);
    } else {
      attempts++;
      handleFailedAttempt();
      btnLogin.disabled = false;
    }
  });
});

async function promptExternalAccess(type, pwd) {
  const formHtml = `
    <h3 class="font-bold text-xl mb-4 text-center">Accès Restreint</h3>
    <form id="external-form" class="flex flex-col gap-4">
      <div>
        <label class="block mb-2 text-sm text-muted">Nom Complet</label>
        <input type="text" id="ext-name" required class="w-full">
      </div>
      <div>
        <label class="block mb-2 text-sm text-muted">Mot de passe Urgence</label>
        <div class="flex gap-2">
          <input type="password" id="ext-emergency-pwd" required class="w-full">
          <button type="button" class="action-btn" onclick="toggleVisibility(this, 'ext-emergency-pwd')"><i class="fas fa-eye"></i></button>
        </div>
      </div>
      <button type="submit" class="w-full mt-2" id="btn-ext-submit">Valider</button>
    </form>
  `;
  openModal(formHtml);

  document.getElementById('external-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('ext-name').value;
    const emPwd = document.getElementById('ext-emergency-pwd').value;
    const btn = document.getElementById('btn-ext-submit');

    if (hashPassword(emPwd) !== globalData.emergencyHash) {
      showToast('Mot de passe Urgence incorrect', 'error');
      attempts++;
      handleFailedAttempt();
      return;
    }

    btn.disabled = true;
    btn.innerText = 'Connexion...';
    sessionStorage.setItem(`${type}Key`, pwd);

    const info = await getClientInfo();
    const payload = { ip: info.ip, userAgent: info.userAgent, lat: info.lat, lng: info.lng, nomComplet: name };
    if (type === 'vault') payload.vaultAccess = true;
    else payload.testamentAccess = true;

    await postToApi(payload);
    window.location.href = `${type}.html`;
  });
}

function handleFailedAttempt() {
  showToast('Mot de passe incorrect', 'error');
  if (attempts >= 10) {
    lockoutTime = Date.now() + 10 * 60 * 1000;
    sendSuspiciousAlert();
  } else if (attempts >= 5) {
    lockoutTime = Date.now() + 2 * 60 * 1000;
  } else if (attempts >= 3) {
    lockoutTime = Date.now() + 30 * 1000;
  }
}

async function sendSuspiciousAlert() {
  const info = await getClientInfo();
  await postToApi({ suspiciousActivity: true, ip: info.ip, userAgent: info.userAgent, lat: info.lat, lng: info.lng });
}
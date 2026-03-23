// index.js - Login logic and routing

let loginFailures = 0;
let lockoutTimer = null;
let vaultOrTestamentMode = null; // 'vault' or 'testament'

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('login-container');

  // Clean up any lingering session state
  sessionStorage.clear();

  container.innerHTML = `
    <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--accent); margin-bottom: 20px;"></i>
    <p>Connexion au coffre...</p>
  `;

  try {
    const data = await fetchData();

    if (!data.isSetup) {
      window.location.href = 'setup.html';
      return;
    }

    renderMainLogin(data);

  } catch (error) {
    console.error("Erreur de chargement:", error);
    container.innerHTML = `
      <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--danger); margin-bottom: 20px;"></i>
      <p>Erreur de communication avec le serveur.</p>
    `;
  }
});

function renderMainLogin(serverData) {
  const container = document.getElementById('login-container');
  container.innerHTML = `
    <i class="fas fa-lock" style="font-size: 3rem; color: var(--accent); margin-bottom: 20px;"></i>
    <div style="margin-bottom: 20px;">
      <input type="password" id="main-pwd" placeholder="••••••••" style="text-align: center; letter-spacing: 3px; font-size: 1.2rem; width: 100%;">
    </div>
    <button id="btn-login" class="btn btn-primary" style="width: 100%; font-size: 1.1rem; padding: 12px;">Déverrouiller</button>
  `;

  const input = document.getElementById('main-pwd');
  const btn = document.getElementById('btn-login');

  const attemptLogin = async () => {
    if (lockoutTimer) return;

    const pwd = input.value;
    if (!pwd) return;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    const hash = hashData(pwd);

    if (hash === serverData.adminHash) {
      sessionStorage.setItem('adminKey', pwd);
      window.location.href = 'admin.html';
    }
    else if (hash === serverData.emergencyHash) {
      sessionStorage.setItem('emergencyKey', pwd);
      try {
        const clientInfo = await getClientInfo();
        // AWAIT API before redirect
        await postToApi({
          action: 'emergencyAccess',
          data: { type: 'urgence', info: clientInfo }
        });
      } catch (e) {}
      window.location.href = 'emergency.html';
    }
    else if (hash === serverData.vaultHash) {
      vaultOrTestamentMode = 'vault';
      renderSecondaryLogin('Vault', pwd, serverData);
    }
    else if (hash === serverData.testamentHash) {
      vaultOrTestamentMode = 'testament';
      renderSecondaryLogin('Testament', pwd, serverData);
    }
    else {
      handleLoginFailure();
      input.value = '';
      btn.innerHTML = 'Déverrouiller';
      btn.disabled = false;
    }
  };

  btn.addEventListener('click', attemptLogin);
  input.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') attemptLogin();
  });

  input.focus();
}

function renderSecondaryLogin(type, targetPwd, serverData) {
  const container = document.getElementById('login-container');
  container.innerHTML = `
    <i class="fas ${type === 'Vault' ? 'fa-vault' : 'fa-scroll'}" style="font-size: 3rem; color: var(--accent); margin-bottom: 20px;"></i>
    <h3 style="margin-bottom: 20px;">Accès ${type}</h3>
    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px;">
      Veuillez décliner votre identité et saisir le mot de passe d'urgence pour continuer.
    </p>

    <div style="margin-bottom: 15px;">
      <input type="text" id="sec-identity" placeholder="Nom complet ou Société" style="width: 100%;">
    </div>
    <div style="margin-bottom: 20px;">
      <input type="password" id="sec-emergency-pwd" placeholder="Mot de passe Urgence" style="text-align: center; letter-spacing: 3px; font-size: 1.1rem; width: 100%;">
    </div>

    <button id="btn-sec-login" class="btn btn-primary" style="width: 100%; font-size: 1.1rem; padding: 12px;">Accéder</button>
    <button id="btn-cancel" class="btn btn-secondary" style="width: 100%; margin-top: 10px;">Annuler</button>
  `;

  const btnLogin = document.getElementById('btn-sec-login');
  const btnCancel = document.getElementById('btn-cancel');
  const inputId = document.getElementById('sec-identity');
  const inputPwd = document.getElementById('sec-emergency-pwd');

  btnCancel.addEventListener('click', () => {
    vaultOrTestamentMode = null;
    renderMainLogin(serverData);
  });

  const attemptSecondary = async () => {
    const identity = inputId.value.trim();
    const emergencyPwd = inputPwd.value;

    if (!identity || !emergencyPwd) {
      showToast('Veuillez remplir tous les champs', 'error');
      return;
    }

    btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btnLogin.disabled = true;

    if (hashData(emergencyPwd) === serverData.emergencyHash) {
      sessionStorage.setItem(`${vaultOrTestamentMode}Key`, targetPwd);
      sessionStorage.setItem('emergencyKey', emergencyPwd); // For vault locked entries
      sessionStorage.setItem('accessorIdentity', identity);

      try {
        const clientInfo = await getClientInfo();
        // AWAIT API before redirect
        await postToApi({
          action: `${vaultOrTestamentMode}Access`,
          data: { identity, info: clientInfo }
        });
      } catch (e) {}

      window.location.href = `${vaultOrTestamentMode}.html`;
    } else {
      showToast('Mot de passe d\'urgence incorrect.', 'error');
      inputPwd.value = '';
      btnLogin.innerHTML = 'Accéder';
      btnLogin.disabled = false;
      handleLoginFailure();
    }
  };

  btnLogin.addEventListener('click', attemptSecondary);
  inputPwd.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') attemptSecondary();
  });

  inputId.focus();
}

async function handleLoginFailure() {
  loginFailures++;
  showToast('Code incorrect', 'error');

  let delay = 0;
  if (loginFailures >= 10) delay = 600; // 10 min
  else if (loginFailures >= 5) delay = 120; // 2 min
  else if (loginFailures >= 3) delay = 30; // 30 sec

  if (delay > 0) {
    const container = document.getElementById('login-container');
    const originalHTML = container.innerHTML;

    container.innerHTML = `
      <i class="fas fa-ban" style="font-size: 3rem; color: var(--danger); margin-bottom: 20px;"></i>
      <h3 style="color: var(--danger);">Accès bloqué</h3>
      <p id="lockout-timer">Veuillez patienter ${delay} secondes...</p>
    `;

    // Alert server if suspicious
    if (loginFailures === 3 || loginFailures === 5 || loginFailures === 10) {
      try {
        const clientInfo = await getClientInfo();
        await postToApi({
          action: 'suspiciousActivity',
          data: { failures: loginFailures, info: clientInfo }
        });
      } catch (e) {}
    }

    lockoutTimer = setInterval(() => {
      delay--;
      const p = document.getElementById('lockout-timer');
      if (p) p.innerText = `Veuillez patienter ${delay} secondes...`;

      if (delay <= 0) {
        clearInterval(lockoutTimer);
        lockoutTimer = null;
        fetchData().then(data => renderMainLogin(data));
      }
    }, 1000);
  }
}

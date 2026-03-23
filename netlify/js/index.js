let lockCount = 0;
let lockTimeout = null;
let currentData = null;

async function initIndex() {
  const container = document.getElementById('login-container');
  container.innerHTML = `
    <div class="card w-64 text-center border-none" style="background: transparent; padding: 0;">
      <input type="password" id="mainPwd" class="form-control mb-4" placeholder="••••••••" style="text-align: center; letter-spacing: 0.5rem; background: rgba(255,255,255,0.05); border: none; font-size: 1.5rem; border-radius: 50px; padding: 15px;">
      <button id="loginBtn" class="btn btn-outline rounded-full w-full" style="display: none;"><i class="fas fa-arrow-right"></i></button>
      <div id="loginMsg" class="mt-4 text-sm hidden"></div>
    </div>
  `;

  const input = document.getElementById('mainPwd');
  const msg = document.getElementById('loginMsg');

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin(input.value);
  });

  const urlParams = new URLSearchParams(window.location.search);
  const isReset = urlParams.get('reset');
  if (isReset) {
    sessionStorage.clear();
  }

  currentData = await loadData();
  if (!currentData || !currentData.isSetup) {
    window.location.href = 'setup.html';
    return;
  }
}

async function handleLogin(pwd) {
  if (lockCount >= 10) return showMessage('Accès bloqué. Veuillez patienter.', 'error');
  if (lockTimeout) return;

  const msg = document.getElementById('loginMsg');
  const input = document.getElementById('mainPwd');

  const hash = hashPassword(pwd);

  if (hash === currentData.adminHash) {
    sessionStorage.setItem('adminKey', pwd);
    window.location.href = 'admin.html';
    return;
  }

  if (hash === currentData.emergencyHash) {
    sessionStorage.setItem('emergencyKey', pwd);
    const info = await getClientInfo();
    const payload = {
      emergencyAccess: true,
      ip: info.ip,
      userAgent: info.userAgent,
      lat: info.lat,
      lng: info.lng
    };
    await postToApi(payload);
    window.location.href = 'emergency.html';
    return;
  }

  if (hash === currentData.vaultHash || hash === currentData.testamentHash) {
    const type = hash === currentData.vaultHash ? 'vault' : 'testament';
    promptSecondaryLogin(type, pwd);
    return;
  }

  lockCount++;
  input.value = '';
  showMessage('Code incorrect', 'error');

  let lockDuration = 0;
  if (lockCount === 3) lockDuration = 30;
  if (lockCount === 5) lockDuration = 120;
  if (lockCount >= 10) lockDuration = 600;

  if (lockDuration > 0) {
    input.disabled = true;
    let remaining = lockDuration;

    if (lockCount >= 3) {
      const info = await getClientInfo();
      await postToApi({
        suspiciousActivity: true,
        ip: info.ip,
        userAgent: info.userAgent,
        lat: info.lat,
        lng: info.lng
      });
    }

    lockTimeout = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(lockTimeout);
        lockTimeout = null;
        input.disabled = false;
        msg.classList.add('hidden');
        input.focus();
      } else {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        showMessage(`Bloqué. Réessayez dans ${timeStr}`, 'error');
      }
    }, 1000);
  }
}

function showMessage(text, type) {
  const msg = document.getElementById('loginMsg');
  msg.textContent = text;
  msg.className = `mt-4 text-sm ${type === 'error' ? 'text-danger' : 'text-success'}`;
}

function promptSecondaryLogin(type, pwd) {
  const title = type === 'vault' ? 'Accès Vault' : 'Accès Testament';
  const html = `
    <div class="flex-col gap-4">
      <h3 class="m-0 text-center">${title}</h3>
      <p class="text-sm text-center text-muted">Veuillez vous identifier pour continuer.</p>
      <div class="form-group">
        <label>Nom ou Société</label>
        <input type="text" id="secName" class="form-control" placeholder="Votre nom complet" required>
      </div>
      <div class="form-group">
        <label>Mot de passe Urgence</label>
        <input type="password" id="secPwd" class="form-control" required>
      </div>
      <div class="flex justify-between mt-4">
        <button class="btn btn-outline" onclick="closeModal()">Annuler</button>
        <button class="btn btn-primary" id="secSubmitBtn">Accéder</button>
      </div>
    </div>
  `;

  openModal(html);

  document.getElementById('secSubmitBtn').onclick = async () => {
    const name = document.getElementById('secName').value.trim();
    const urgPwd = document.getElementById('secPwd').value;

    if (!name || !urgPwd) {
      showToast('Veuillez remplir tous les champs', 'error');
      return;
    }

    const urgHash = hashPassword(urgPwd);
    if (urgHash !== currentData.emergencyHash) {
      showToast('Mot de passe Urgence incorrect', 'error');
      return;
    }

    const info = await getClientInfo();
    const payload = {
      ip: info.ip,
      userAgent: info.userAgent,
      lat: info.lat,
      lng: info.lng,
      nomComplet: name
    };

    if (type === 'vault') {
      sessionStorage.setItem('vaultKey', pwd);
      sessionStorage.setItem('emergencyKeyForVault', urgPwd);
      payload.vaultAccess = true;
      await postToApi(payload);
      window.location.href = 'vault.html';
    } else {
      sessionStorage.setItem('testamentKey', pwd);
      sessionStorage.setItem('emergencyKeyForTestament', urgPwd);
      payload.testamentAccess = true;
      await postToApi(payload);
      window.location.href = 'testament.html';
    }
  };
}

document.addEventListener('DOMContentLoaded', initIndex);

let config = null;
let attempts = 0;
let lockoutEnd = 0;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await loadData();
    config = data.config;
    hideLoading();
    if (!config || !config.isSetup) {
      window.location.href = 'setup.html';
      return;
    }
    document.getElementById('login-container').style.display = 'block';
  } catch (e) {
    hideLoading();
    showToast('Erreur de chargement', 'error');
  }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (Date.now() < lockoutEnd) {
    return;
  }

  const pwd = document.getElementById('password').value;
  const hash = hashPassword(pwd);
  const err = document.getElementById('error-msg');

  err.style.display = 'none';

  if (hash === config.adminHash) {
    sessionStorage.setItem('_key', pwd);
    sessionStorage.setItem('_page', 'admin');
    window.location.href = 'admin.html';
    return;
  }

  if (hash === config.emergencyHash) {
    sessionStorage.setItem('_key', pwd);
    sessionStorage.setItem('_page', 'emergency');
    await sendAlertThenRedirect("Urgence", "emergency.html");
    return;
  }

  if (hash === config.vaultHash) {
    showDoubleAuthModal('vault', pwd);
    return;
  }

  if (hash === config.testamentHash) {
    showDoubleAuthModal('testament', pwd);
    return;
  }

  attempts++;
  err.style.display = 'block';
  document.getElementById('password').value = '';
  handleLockout();
});

function handleLockout() {
  const msg = document.getElementById('lockout-msg');
  const btn = document.getElementById('btn-submit');

  let lockTime = 0;
  if (attempts === 3) lockTime = 30;
  else if (attempts === 5) lockTime = 120;
  else if (attempts >= 10) {
    lockTime = 600;
    sendAlertThenRedirect("Tentative suspecte", null);
  }

  if (lockTime > 0) {
    lockoutEnd = Date.now() + (lockTime * 1000);
    btn.disabled = true;
    msg.style.display = 'block';

    const int = setInterval(() => {
      const remaining = Math.ceil((lockoutEnd - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(int);
        msg.style.display = 'none';
        btn.disabled = false;
      } else {
        msg.textContent = `Verrouillé. Réessayez dans ${remaining}s`;
      }
    }, 1000);
  }
}

function showDoubleAuthModal(type, pwd) {
  const html = `
    <div class="modal-header">
      <h3 class="m-0"><i class="fas fa-shield-alt text-accent"></i> Vérification d'identité</h3>
      <button class="btn-close" onclick="closeModal()">&times;</button>
    </div>
    <form id="double-auth-form">
      <div class="input-group mb-16">
        <input type="text" id="auth-nom" placeholder="Votre Nom Complet" required>
      </div>
      <div class="input-group mb-16">
        <input type="password" id="auth-urg" placeholder="Code Urgence" required>
        <button type="button" class="toggle-pwd" onclick="toggleVisibility(this, 'auth-urg')"><i class="fas fa-eye"></i></button>
      </div>
      <div id="auth-error" class="error-msg" style="display:none;">Code incorrect</div>
      <button type="submit" class="btn-primary w-100">Accéder</button>
    </form>
  `;
  openModal(html);

  setTimeout(() => {
    document.getElementById('double-auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const nom = document.getElementById('auth-nom').value;
      const urg = document.getElementById('auth-urg').value;

      if (hashPassword(urg) === config.emergencyHash) {
        sessionStorage.setItem('_key', pwd);
        sessionStorage.setItem('_page', type);
        closeModal();
        await sendAlertThenRedirect(type === 'vault' ? 'Vault' : 'Testament', `${type}.html`, { nomComplet: nom });
      } else {
        document.getElementById('auth-error').style.display = 'block';
      }
    });
  }, 100);
}
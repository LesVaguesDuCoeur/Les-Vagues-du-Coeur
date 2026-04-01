let failCount = 0;
let lockoutTime = 0;

document.addEventListener('DOMContentLoaded', async () => {
  const d = await loadData();
  if (!d.isSetup) {
    window.location.href = 'setup.html';
    return;
  }

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const now = Date.now();
    if (now < lockoutTime) {
      showToast('Compte verrouillé', 'error');
      return;
    }

    const pwd = document.getElementById('password').value;
    const pwdHash = hashPassword(pwd);
    document.getElementById('loader').classList.remove('hidden');
    document.getElementById('loginBtn').disabled = true;

    try {
      if (pwdHash === d.adminHash) {
        sessionStorage.setItem('k_admin', pwd);
        window.location.href = 'admin.html';
      } else if (pwdHash === d.emergencyHash) {
        sessionStorage.setItem('k_emergency', pwd);
        const info = await getClientInfo();
        await postToApi({ emergencyAccess: true, ip: info.ip, userAgent: info.userAgent, lat: info.lat, lng: info.lng });
        window.location.href = 'emergency.html';
      } else if (pwdHash === d.vaultHash || pwdHash === d.testamentHash) {
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('loginBtn').disabled = false;

        openModal(`
          <h3 class="text-xl font-bold mb-4">Double authentification requise</h3>
          <p class="mb-4 text-sm text-muted">Veuillez saisir votre nom complet et le mot de passe du contact d'urgence.</p>
          <form id="secondaryLoginForm" class="flex flex-col gap-4">
            <input type="text" id="nomComplet" placeholder="Votre nom complet" required>
            <input type="password" id="secondaryPwd" placeholder="Mot de passe Urgence" required>
            <button type="submit" class="btn btn-primary">Accéder</button>
          </form>
        `);

        document.getElementById('secondaryLoginForm').addEventListener('submit', async (e2) => {
          e2.preventDefault();
          const nom = document.getElementById('nomComplet').value;
          const secPwd = document.getElementById('secondaryPwd').value;
          const secHash = hashPassword(secPwd);

          if (secHash === d.emergencyHash) {
            const info = await getClientInfo();
            if (pwdHash === d.vaultHash) {
              sessionStorage.setItem('k_vault', pwd);
              await postToApi({ vaultAccess: true, ip: info.ip, userAgent: info.userAgent, lat: info.lat, lng: info.lng, nomComplet: nom });
              await fetch("https://script.google.com/macros/s/AKfycbwBNTLcjq2aYNCvkFHRVeciUevwa5ZiO-yDUDrCUTabV_UiqPeGy9k9cTeuNMtE8tvO/exec", { mode: 'no-cors' });
              window.location.href = 'vault.html';
            } else {
              sessionStorage.setItem('k_testament', pwd);
              await postToApi({ testamentAccess: true, ip: info.ip, userAgent: info.userAgent, lat: info.lat, lng: info.lng, nomComplet: nom });
              await fetch("https://script.google.com/macros/s/AKfycbwBNTLcjq2aYNCvkFHRVeciUevwa5ZiO-yDUDrCUTabV_UiqPeGy9k9cTeuNMtE8tvO/exec", { mode: 'no-cors' });
              window.location.href = 'testament.html';
            }
          } else {
            handleFail();
            closeModal();
          }
        });
      } else {
        handleFail();
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('loginBtn').disabled = false;
      }
    } catch(err) {
      document.getElementById('loader').classList.add('hidden');
      document.getElementById('loginBtn').disabled = false;
      showToast('Erreur serveur', 'error');
    }
  });
});

async function handleFail() {
  failCount++;
  showToast('Mot de passe incorrect', 'error');
  if (failCount >= 3) {
    let penalty = 30000;
    if (failCount >= 10) penalty = 600000;
    else if (failCount >= 5) penalty = 120000;

    lockoutTime = Date.now() + penalty;
    document.getElementById('loginBtn').disabled = true;
    const msg = document.getElementById('lockoutMsg');
    msg.classList.remove('hidden');
    msg.textContent = `Verrouillé pour ${penalty/1000}s`;

    if (failCount >= 10) {
      const info = await getClientInfo();
      await postToApi({ suspiciousActivity: true, ip: info.ip, userAgent: info.userAgent, lat: info.lat, lng: info.lng });
    }

    setTimeout(() => {
      document.getElementById('loginBtn').disabled = false;
      msg.classList.add('hidden');
    }, penalty);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  sessionStorage.clear();
  let failCount = 0;

  const btn = document.getElementById('login-btn');
  const inp = document.getElementById('password-input');

  inp.focus();

  inp.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btn.click();
  });

  btn.addEventListener('click', async () => {
    const pwd = inp.value;
    if (!pwd) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
      const data = await loadData();
      if (!data.isSetup) {
        window.location.href = 'setup.html';
        return;
      }

      const hash = hashData(pwd);
      let role = null;

      if (hash === data.adminHash) role = 'admin';
      else if (hash === data.emergencyHash) role = 'emergency';
      else if (hash === data.vaultHash) role = 'vault';
      else if (hash === data.testamentHash) role = 'testament';

      if (!role) {
        failCount++;
        inp.value = '';
        showToast('Mot de passe incorrect', 'error');

        let lockTime = 0;
        if (failCount >= 10) {
          lockTime = 600;
          const info = await getClientInfo();
          await postToApi({ suspiciousActivity: true, ip: info.ip, userAgent: info.userAgent, lat: info.lat, lng: info.lng });
          showToast('Activité suspecte signalée.', 'error');
        } else if (failCount >= 5) {
          lockTime = 120;
        } else if (failCount >= 3) {
          lockTime = 30;
        }

        if (lockTime > 0) {
          btn.disabled = true;
          inp.disabled = true;
          let timeLeft = lockTime;
          btn.innerHTML = `<span style="font-size:1rem;">\${timeLeft}s</span>`;
          const interval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
              clearInterval(interval);
              btn.disabled = false;
              inp.disabled = false;
              btn.innerHTML = '<i class="fas fa-arrow-right"></i>';
              inp.focus();
            } else {
              btn.innerHTML = `<span style="font-size:1rem;">\${timeLeft}s</span>`;
            }
          }, 1000);
        } else {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-arrow-right"></i>';
        }
        return;
      }

      if (role === 'admin') {
        sessionStorage.setItem('adminKey', pwd);
        window.location.href = 'admin.html';
      } else if (role === 'emergency') {
        sessionStorage.setItem('emergencyKey', pwd);
        const info = await getClientInfo();
        await postToApi({ emergencyAccess: true, ip: info.ip, userAgent: info.userAgent, lat: info.lat, lng: info.lng });
        window.location.href = 'emergency.html';
      } else if (role === 'vault' || role === 'testament') {
        const nom = await promptDialog('Votre Nom Complet :');
        if (!nom) {
          resetBtn();
          return;
        }
        const emPwd = await promptDialog('Mot de passe Urgence :', 'password');
        if (!emPwd) {
          resetBtn();
          return;
        }

        if (hashData(emPwd) !== data.emergencyHash) {
          showToast('Accès refusé', 'error');
          resetBtn();
          return;
        }

        const info = await getClientInfo();

        if (role === 'vault') {
          sessionStorage.setItem('vaultKey', pwd);
          await postToApi({ vaultAccess: true, ip: info.ip, userAgent: info.userAgent, lat: info.lat, lng: info.lng, nomComplet: nom });
          window.location.href = 'vault.html';
        } else {
          sessionStorage.setItem('testamentKey', pwd);
          await postToApi({ testamentAccess: true, ip: info.ip, userAgent: info.userAgent, lat: info.lat, lng: info.lng, nomComplet: nom });
          window.location.href = 'testament.html';
        }
      }
    } catch (e) {
      showToast('Erreur connexion', 'error');
      resetBtn();
    }
  });

  function resetBtn() {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-arrow-right"></i>';
    inp.value = '';
  }
});
document.addEventListener('DOMContentLoaded', async () => {
  const adminKey = sessionStorage.getItem('adminKey');
  if (adminKey) {
    // Rediriger directement vers testament.html sans demander de mot de passe
    window.location.href = 'testament.html';
    return;
  }

  const nomInput = document.getElementById('nom-declare');
  const codeInput = document.getElementById('testament-access-code');
  const btnLogin = document.getElementById('btn-login');
  const errorMsg = document.getElementById('error-message');

  showLoader();
  const data = await fetchFromApi();
  hideLoader();

  if (!data || !data.testamentHash) {
     alert("Testament non configuré.");
     return;
  }

  btnLogin.addEventListener('click', async () => {
    const nom = nomInput.value.trim();
    const testamentPwd = codeInput.value.trim();
    const emergencyPwd = document.getElementById('testament-emergency-code').value.trim();

    if (!nom || !testamentPwd || !emergencyPwd) {
       showError("Veuillez remplir tous les champs.");
       return;
    }

    const testamentHash = hashPassword(testamentPwd);
    const emergencyHash = hashPassword(emergencyPwd);

    const isTestamentPassword = (testamentHash === data.testamentHash);
    const isEmergencyPassword = (emergencyHash === data.emergencyHash);
    const isAdminPassword = (testamentHash === data.adminHash); // Si on tape l'admin dans le champ testament

    let isAdminAccess = false;
    if (isAdminPassword) {
       isAdminAccess = true;
       if (!sessionStorage.getItem('adminKey')) sessionStorage.setItem('adminKey', testamentPwd);
    }

    // L'admin bypasse la vérification du mot de passe urgence
    if ((isTestamentPassword && isEmergencyPassword) || isAdminAccess) {
      if (isTestamentPassword) {
          sessionStorage.setItem('testamentKey', testamentPwd);
      }
      sessionStorage.setItem('nomDeclare', nom);

      showLoader();
      let ip = 'non disponible', userAgent = navigator.userAgent, gps = null;
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ip = ipData.ip;
      } catch(e) {}

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          gps = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          sendAndRedirect();
        }, () => sendAndRedirect(), { timeout: 3000 });
      } else {
        sendAndRedirect();
      }

      async function sendAndRedirect() {
        await postToApi({
          action: 'testamentAccess',
          nomDeclare: nom,
          ip,
          userAgent,
          gps
        });
        window.location.href = 'testament.html';
      }

    } else {
      showError("Mot de passe incorrect");
    }
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
    setTimeout(() => { errorMsg.classList.add('hidden'); }, 3000);
  }
});
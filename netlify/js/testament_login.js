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
    const code = codeInput.value.trim();

    if (!nom || !code) {
       showError("Veuillez remplir les deux champs.");
       return;
    }

    const hash = hashPassword(code);

    // Si c'est le mot de passe admin, il peut aussi accéder (Master Key).
    const adminKey = sessionStorage.getItem('adminKey');
    const isTestamentPassword = (hash === data.testamentHash);
    const isAdminPassword = (hash === data.adminHash);

    let isAdminAccess = false;
    if (isAdminPassword) {
       isAdminAccess = true;
       // Store the code as adminKey if it wasn't already in session
       if (!adminKey) sessionStorage.setItem('adminKey', code);
    } else if (adminKey && hashPassword(adminKey) === data.adminHash && code === adminKey) {
       isAdminAccess = true;
    }

    if (isTestamentPassword || isAdminAccess) {
      if (isTestamentPassword) {
          sessionStorage.setItem('testamentKey', code);
      }
      sessionStorage.setItem('nomDeclare', nom);

      // Envoi du mail AVANT d'accéder
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
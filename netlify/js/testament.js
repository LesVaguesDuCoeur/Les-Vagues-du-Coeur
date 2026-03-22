let testamentKey = null;
let serverData = null;
let quill = null;
let isAdmin = false;

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('btn-logout').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  document.getElementById('btn-testament-print').addEventListener('click', () => window.print());

  // BYPASS ADMIN
  const adminKey = sessionStorage.getItem('adminKey');
  if (adminKey) {
    isAdmin = true;
    showLoader('testament-loader');
    serverData = await fetchFromApi();
    const realKey = decryptData(serverData.testamentKeyEnc, adminKey);
    if (!realKey) { alert('Erreur déchiffrement clé testament'); return; }
    testamentKey = realKey;
    hideLoader('testament-loader');
    await openTestament('Admin (accès direct)', true);
    return;
  }

  // DIRECT ACCESS VIA INDEX
  const directTestamentKey = sessionStorage.getItem('testamentKey');
  if (directTestamentKey) {
    showLoader('testament-loader');
    serverData = await fetchFromApi();
    hideLoader('testament-loader');

    // Si on vient de l'index, le hash a déjà été vérifié.
    const loginBox = document.querySelector('.login-box');
    loginBox.innerHTML = `
      <div class="login-icon"><i class="fas fa-scroll fa-2x"></i></div>
      <h3>Validation de Sécurité</h3>
      <p class="text-muted">Testament - Veuillez vous identifier pour continuer</p>
      <input type="text" id="t-nom-direct" placeholder="Votre nom complet ou société" autocomplete="off" required>
      <input type="password" id="t-emg-direct" placeholder="Mot de passe Urgence" autocomplete="off" style="margin-top:10px;">
      <button id="btn-testament-login-direct" class="btn btn-primary" style="margin-top:15px; width:100%;">
        <i class="fas fa-lock-open"></i> Accéder
      </button>
      <div id="testament-error-direct" class="error-msg hidden">Identifiants incorrects</div>
      <div id="testament-loader-direct" class="loader hidden"></div>
    `;

    document.getElementById('btn-testament-login-direct').addEventListener('click', async () => {
      const nom = document.getElementById('t-nom-direct').value.trim();
      const ePwd = document.getElementById('t-emg-direct').value;
      if (!nom || !ePwd) {
        document.getElementById('testament-error-direct').textContent = 'Tous les champs sont obligatoires';
        document.getElementById('testament-error-direct').classList.remove('hidden');
        return;
      }

      document.getElementById('testament-error-direct').classList.add('hidden');
      showLoader('testament-loader-direct');

      const eHash = CryptoJS.SHA256(ePwd).toString();
      if (eHash === serverData.emergencyHash) {
        testamentKey = directTestamentKey;

        try {
          await postToApi({
            action: 'testamentAccess',
            nomDeclare: nom,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          });
        } catch(e) {
          console.warn('Alerte email échouée', e);
        }

        await openTestament(nom, false);
      } else {
        hideLoader('testament-loader-direct');
        document.getElementById('testament-error-direct').textContent = 'Mot de passe Urgence incorrect';
        document.getElementById('testament-error-direct').classList.remove('hidden');
      }
    });

    document.getElementById('t-emg-direct').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-testament-login-direct').click();
    });

    return;
  }

  // LOGIN NORMAL
  document.getElementById('btn-testament-login').addEventListener('click', loginTestament);
  document.getElementById('t-emg').addEventListener('keydown', e => { if (e.key === 'Enter') loginTestament(); });
});

async function loginTestament() {
  const nom = document.getElementById('t-nom').value.trim();
  const tPwd = document.getElementById('t-pwd').value;
  const ePwd = document.getElementById('t-emg').value;

  if (!nom || !tPwd || !ePwd) {
    document.getElementById('testament-error').textContent = 'Tous les champs sont obligatoires';
    document.getElementById('testament-error').classList.remove('hidden');
    return;
  }

  document.getElementById('testament-error').classList.add('hidden');
  showLoader('testament-loader');
  serverData = await fetchFromApi();
  hideLoader('testament-loader');

  const tHash = CryptoJS.SHA256(tPwd).toString();
  const eHash = CryptoJS.SHA256(ePwd).toString();

  if (tHash === serverData.testamentHash && eHash === serverData.emergencyHash) {
    testamentKey = tPwd;

    // Envoyer alerte email
    try {
      await postToApi({
        action: 'testamentAccess',
        nomDeclare: nom,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    } catch(e) {
      console.warn('Alerte email échouée', e);
    }

    await openTestament(nom, false);
  } else {
    document.getElementById('testament-error').textContent = 'Identifiants incorrects';
    document.getElementById('testament-error').classList.remove('hidden');
  }
}

async function openTestament(nom, canEdit) {
  document.getElementById('testament-login').classList.add('hidden');
  document.getElementById('testament-data').classList.remove('hidden');

  // Info viewer
  if (nom) {
    document.getElementById('testament-viewer-info').textContent =
      `Consulté par : ${nom} — ${new Date().toLocaleString('fr-FR')}`;
  }

  // Bouton save seulement pour admin
  if (canEdit) {
    document.getElementById('btn-testament-save').classList.remove('hidden');
    document.getElementById('btn-testament-save').addEventListener('click', saveTestament);
  }

  // Init Quill
  quill = new Quill('#quill-editor', {
    theme: 'snow',
    readOnly: !canEdit,
    modules: {
      toolbar: canEdit ? true : false
    }
  });

  // Charger données
  const data = decryptData(serverData.testament, testamentKey);
  if (data) {
    if (data.content) quill.root.innerHTML = data.content;
    if (data.notaire) document.getElementById('notaire-name').value = data.notaire;
  }

  if (!canEdit) {
    document.getElementById('notaire-name').readOnly = true;
    document.getElementById('notaire-name').style.opacity = '0.7';
  }
}

async function saveTestament() {
  const payload = {
    content: quill.root.innerHTML,
    notaire: document.getElementById('notaire-name').value
  };

  const btn = document.getElementById('btn-testament-save');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sauvegarde...';

  serverData.testament = encryptData(payload, testamentKey);
  await postToApi(serverData);

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-check"></i> Sauvegardé !';
  setTimeout(() => { btn.innerHTML = '<i class="fas fa-save"></i> Enregistrer'; }, 2500);
  document.getElementById('testament-save-status').textContent = 'Sauvegardé le ' + new Date().toLocaleString('fr-FR');
}

function showLoader(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hideLoader(id) { document.getElementById(id)?.classList.add('hidden'); }
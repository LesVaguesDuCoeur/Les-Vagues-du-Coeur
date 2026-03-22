const testamentKey = sessionStorage.getItem('testamentKey');
const adminKey = sessionStorage.getItem('adminKey'); // Check if opened by admin directly
const nomDeclare = sessionStorage.getItem('nomDeclare');

if (!testamentKey && !adminKey) {
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', async () => {
  const btnLogout = document.getElementById('btn-logout');
  const btnSave = document.getElementById('btn-save');
  const btnPrint = document.getElementById('btn-print');
  const notaireInput = document.getElementById('notaire-name');
  const saveStatus = document.getElementById('save-status');

  // Initialize Quill Editor
  var quill = new Quill('#editor-container', {
    theme: 'snow',
    placeholder: 'Commencez à rédiger votre testament...',
    modules: {
      toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['clean']
      ]
    }
  });

  let fullData = null;
  let testamentData = { notaire: "", text: "" };
  let isEditingByAdmin = false;

  showLoader();
  fullData = await fetchFromApi();
  hideLoader();

  // Determine which key is valid
  let activeKey = testamentKey;
  let useAdminDuplicate = false;

  if (fullData) {
      if (adminKey && hashPassword(adminKey) === fullData.adminHash && (!testamentKey || testamentKey === adminKey)) {
          // Admin master access: decrypt the original testamentKey using the adminKey
          if (fullData.testamentKeyEncrypted) {
              const decryptedKey = decryptData(fullData.testamentKeyEncrypted, adminKey);
              if (decryptedKey) {
                  activeKey = decryptedKey;
                  isEditingByAdmin = true;
                  btnSave.classList.remove('hidden');
              }
          }
      } else if (testamentKey && hashPassword(testamentKey) === fullData.testamentHash) {
          activeKey = testamentKey;
          btnSave.classList.remove('hidden');
      } else {
          alert("Accès non autorisé.");
          window.location.href = 'index.html';
      }

      // Decrypt using the single source of truth and the real activeKey
      try {
          if (fullData.testament) {
              const decrypted = decryptData(fullData.testament, activeKey);
              if (decrypted) {
                  testamentData = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
              }
          }
      } catch (e) {
          console.error("Déchiffrement échoué");
      }

      // Populate UI
      notaireInput.value = testamentData.notaire || '';
      if (testamentData.text) {
          quill.root.innerHTML = testamentData.text;
      }
  }

  btnLogout.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  btnPrint.addEventListener('click', () => {
     window.print();
  });

  // Auto-save logic (debounce 2s)
  let saveTimeout;
  quill.on('text-change', () => {
      clearTimeout(saveTimeout);
      saveStatus.textContent = "Modifications non enregistrées...";
      saveTimeout = setTimeout(saveTestament, 2000);
  });

  notaireInput.addEventListener('input', () => {
      clearTimeout(saveTimeout);
      saveStatus.textContent = "Modifications non enregistrées...";
      saveTimeout = setTimeout(saveTestament, 2000);
  });

  btnSave.addEventListener('click', saveTestament);

  async function saveTestament() {
      if (!fullData) return;
      saveStatus.textContent = "Enregistrement en cours...";

      const payloadObj = {
          notaire: notaireInput.value,
          text: quill.root.innerHTML
      };

      const payloadStr = JSON.stringify(payloadObj);

      // Thanks to storing the keys in `testamentKeyEncrypted`,
      // the single source of truth for testament data is `fullData.testament`.
      fullData.testament = encryptData(payloadStr, activeKey);

      // Send the updated fullData
      await postToApi(fullData);

      const now = new Date();
      saveStatus.textContent = `Dernière sauvegarde automatique : ${now.toLocaleTimeString()}`;
  }
});
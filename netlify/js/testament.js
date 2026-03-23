let testamentKey = null;
let isTestamentAdmin = false;
let quillInstance = null;
let quillInitialized = false;

async function initTestamentAdmin() {
  isTestamentAdmin = true;
  testamentKey = testamentPwd;
  appData = await loadData();
  testamentData = decryptData(appData.testamentData, testamentKey) || { identity: {}, content: '', lastModified: null };

  syncTestamentCivilState();

  const saveBtn = document.getElementById('saveTestamentBtn');
  if (saveBtn) saveBtn.onclick = saveTestament;

  const pdfBtn = document.getElementById('exportPdfBtn');
  if (pdfBtn) pdfBtn.onclick = exportPdf;

  let autoSaveTimer;
  const editor = document.getElementById('quillEditor');
  if (editor) {
    editor.addEventListener('input', () => {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(saveTestament, 30000);
    });
  }
}

async function initTestamentExternal() {
  testamentKey = checkSession('testamentKey');
  if (!testamentKey) return;
  setupAutoLock(15);
  isTestamentAdmin = false;

  appData = await loadData();
  if (!appData || !appData.isSetup) {
    window.location.href = 'index.html';
    return;
  }

  const hash = hashPassword(testamentKey);
  if (hash !== appData.testamentHash) {
    sessionStorage.clear();
    window.location.href = 'index.html';
    return;
  }

  testamentData = decryptData(appData.testamentData, testamentKey) || { identity: {}, content: '', lastModified: null };

  const civilDiv = document.getElementById('testamentCivilState');
  if (civilDiv && testamentData.identity) {
    const i = testamentData.identity;
    civilDiv.innerHTML = `
      Je soussigné(e), <strong>${escapeHtml(i.prenom||'')} ${escapeHtml(i.nom||'').toUpperCase()}</strong>,<br>
      Né(e) le ${escapeHtml(i.dateN||'')} à ${escapeHtml(i.lieuN||'')},<br>
      De nationalité ${escapeHtml(i.nat||'')},<br>
      Demeurant à : ${escapeHtml(i.adr||'')}
    `;
  }

  const dateDiv = document.getElementById('testamentDate');
  if (dateDiv && testamentData.lastModified) {
    dateDiv.textContent = `Fait le ${formatDateFR(testamentData.lastModified)}`;
  }

  const contentDiv = document.getElementById('testamentBody');
  if (contentDiv) {
    contentDiv.innerHTML = testamentData.content || '<p>Aucun testament rédigé.</p>';
  }

  const pdfBtn = document.getElementById('exportPdfBtn');
  if (pdfBtn) pdfBtn.onclick = exportPdf;
}

function initQuill() {
  if (quillInitialized) return;
  const editorEl = document.getElementById('quillEditor');
  if (!editorEl) return;

  quillInstance = new Quill('#quillEditor', {
    theme: 'snow',
    placeholder: 'Rédigez vos dernières volontés ici...',
    modules: {
      toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'clean']
      ]
    }
  });

  if (testamentData && testamentData.content) {
    quillInstance.root.innerHTML = testamentData.content;
  }

  quillInitialized = true;
}

function syncTestamentCivilState() {
  const vItems = decryptData(appData.vaultData, vaultPwd) || [];
  const civil = vItems.find(i => i.categoryId === 0);

  const targetDiv = document.getElementById('testamentCivilState');
  if (!targetDiv) return;

  if (civil) {
    testamentData.identity = civil;
    targetDiv.innerHTML = `
      Je soussigné(e), <strong>${escapeHtml(civil.prenom||'')} ${escapeHtml(civil.nom||'').toUpperCase()}</strong>,<br>
      Né(e) le ${escapeHtml(civil.dateN||'')} à ${escapeHtml(civil.lieuN||'')},<br>
      De nationalité ${escapeHtml(civil.nat||'')},<br>
      Demeurant à : ${escapeHtml(civil.adr||'')}
    `;
  } else {
    targetDiv.innerHTML = 'État civil non trouvé dans le Vault.';
  }
}

async function saveTestament() {
  if (!isTestamentAdmin || !quillInstance) return;

  const content = quillInstance.root.innerHTML;
  if (!content.trim()) return;

  testamentData.content = content;
  testamentData.lastModified = new Date().toISOString();

  appData.testamentData = encryptData(testamentData, testamentKey);

  const btn = document.getElementById('saveTestamentBtn');
  const ogText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

  if (await saveData(appData)) {
    showToast('Testament sauvegardé');
  } else {
    showToast('Erreur lors de la sauvegarde', 'error');
  }

  btn.disabled = false;
  btn.innerHTML = ogText;
}

function exportPdf() {
  let element;
  let opt = {
    margin: 10,
    filename: 'Testament.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  if (isTestamentAdmin) {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="text-align: center;">TESTAMENT — DERNIÈRES VOLONTÉS</h2>
        <div style="margin-bottom: 20px; font-size: 14px;">
          ${document.getElementById('testamentCivilState').innerHTML}
        </div>
        <div style="margin-bottom: 20px; font-size: 14px;">
          Fait le ${formatDateFR(testamentData.lastModified || new Date().toISOString())}
        </div>
        <div>${quillInstance ? quillInstance.root.innerHTML : testamentData.content}</div>
      </div>
    `;
    element = div;
  } else {
    element = document.getElementById('testamentContent');
  }

  html2pdf().set(opt).from(element).save();
}

if (!window.location.pathname.includes('admin.html')) {
  document.addEventListener('DOMContentLoaded', initTestamentExternal);
}

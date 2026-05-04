import { loadPDF, renderPage, getThumbnail, rotatePages, removePages, duplicatePages, insertBlankPage, savePDF, getPdfDoc, getCurrentFilename, reorderPages, mergePDFs } from './pdf-engine.js';
import { showToast, confirmDialog, showLoader, hideLoader, updateProgress, promptDialog, openModal } from './ui.js';
import { detectFileType, formatBytes, downloadBlob, readFileAsArrayBuffer, getDeviceInfo } from './utils.js';
import { setActiveTool, addTextToPdf, addRectToPdf, initEditor } from './editor.js';
import { applyWatermark } from './watermark.js';
import { initSignaturePad, clearSignature, getSignatureDataUrl, applySignatureToPdf, saveSignature, getSavedSignatures, generateTextSignature } from './signature.js';
import { compressPdf } from './compressor.js';
import { convertToPdf } from './converter.js';

let tesseractWorker = null;

const MAX_FILE_SIZE = 200 * 1024 * 1024;

const state = {
  currentPage: 1,
  totalPages: 1,
  zoomLevel: 1.0,
  activeTool: 'select',
  selectedPages: new Set()
};

const dom = {
  welcome: document.getElementById('welcome-screen'),
  editor: document.getElementById('editor-layout'),
  fileInput: document.getElementById('file-input'),
  dropZone: document.getElementById('main-drop-zone'),
  canvasContainer: document.getElementById('canvas-container'),
  canvas: document.getElementById('pdf-canvas'),
  overlayLayer: document.getElementById('overlay-layer'),
  thumbnailsContainer: document.getElementById('thumbnails-container'),
  currentPageInput: document.getElementById('current-page-input'),
  totalPagesDisplay: document.getElementById('total-pages-display'),
  zoomDisplay: document.getElementById('zoom-level'),
  themeToggle: document.getElementById('btn-theme-toggle'),
  sidebarRight: document.getElementById('sidebar-right'),
  toolContent: document.getElementById('context-tool-content'),
  toolTitle: document.getElementById('context-tool-title')
};

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  setupTheme();
  setupEventListeners();
  initEditor('overlay-layer');
  window.addEventListener('error', handleGlobalError);
  window.addEventListener('unhandledrejection', handleGlobalPromiseError);
}

function handleGlobalError(e) {
  if (e.message && e.message.includes('ResizeObserver')) return;
  showToast('Une erreur inattendue est survenue.', 'error');
}

function handleGlobalPromiseError() {
  showToast('Une erreur inattendue est survenue.', 'error');
}

function setupTheme() {
  const savedTheme = localStorage.getItem('pdfstudio-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  dom.themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('pdfstudio-theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const i = dom.themeToggle.querySelector('i');
  if (theme === 'light') {
    i.className = 'fa-solid fa-sun';
  } else {
    i.className = 'fa-solid fa-moon';
  }
}

function setupEventListeners() {
  dom.dropZone.addEventListener('dragover', e => { e.preventDefault(); dom.dropZone.classList.add('drag-active'); });
  dom.dropZone.addEventListener('dragleave', e => { e.preventDefault(); dom.dropZone.classList.remove('drag-active'); });
  dom.dropZone.addEventListener('drop', handleFileDrop);

  document.getElementById('btn-browse').addEventListener('click', () => dom.fileInput.click());
  dom.fileInput.addEventListener('change', e => handleFiles(e.target.files));

  document.getElementById('btn-open').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = dom.fileInput.accept;
    input.onchange = e => handleFiles(e.target.files);
    input.click();
  });

  document.getElementById('btn-prev-page').addEventListener('click', () => goToPage(state.currentPage - 1));
  document.getElementById('btn-next-page').addEventListener('click', () => goToPage(state.currentPage + 1));
  dom.currentPageInput.addEventListener('change', e => goToPage(parseInt(e.target.value)));

  document.getElementById('btn-zoom-in').addEventListener('click', () => changeZoom(0.1));
  document.getElementById('btn-zoom-out').addEventListener('click', () => changeZoom(-0.1));
  document.getElementById('btn-fit-width').addEventListener('click', fitWidth);
  document.getElementById('btn-fit-page').addEventListener('click', fitPage);

  document.getElementById('btn-download').addEventListener('click', downloadCurrentPdf);
  document.getElementById('btn-download-zip').addEventListener('click', openCompressModal);
  document.getElementById('btn-print').addEventListener('click', printPdf);

  document.getElementById('btn-select-all').addEventListener('click', toggleSelectAllPages);

  document.getElementById('btn-rotate').addEventListener('click', () => rotateSelected(90));
  document.getElementById('btn-delete').addEventListener('click', deleteSelectedPages);
  document.getElementById('btn-duplicate').addEventListener('click', duplicateSelectedPages);
  document.getElementById('btn-insert').addEventListener('click', () => insertBlankPageAt(state.currentPage - 1));

  document.getElementById('btn-split').addEventListener('click', splitPdf);
  document.getElementById('btn-ocr').addEventListener('click', performOCR);

  document.getElementById('btn-merge').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf';
    input.onchange = async e => {
      if (!e.target.files.length) return;
      const buffers = [];
      const currentDocBytes = await getPdfDoc().save();
      buffers.push(currentDocBytes);
      for (const f of e.target.files) {
        buffers.push(await readFileAsArrayBuffer(f));
      }
      await mergePDFs(buffers);
      await refreshUI();
    };
    input.click();
  });

  setupTools();
  setupMobileTabs();

  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'o') { e.preventDefault(); dom.fileInput.click(); }
    if (e.ctrlKey && e.key === 's' && !e.shiftKey) { e.preventDefault(); downloadCurrentPdf(); }
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') { e.preventDefault(); openCompressModal(); }
    if (e.key === 'Delete' && state.selectedPages.size > 0 && !dom.sidebarRight.classList.contains('active')) {
      deleteSelectedPages();
    }
  });
}

function setupMobileTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const id = tab.id;
      const sidebarL = document.getElementById('sidebar-left');
      const toolbar = document.getElementById('main-toolbar');

      sidebarL.classList.remove('active');
      toolbar.classList.remove('active');
      dom.sidebarRight.classList.remove('active');

      if (id === 'tab-pages') sidebarL.classList.add('active');
      else if (id === 'tab-tools' || id === 'tab-more') toolbar.classList.add('active');
      else if (id === 'tab-watermark') { setTool('watermark'); openSidebarRight('Filigrane'); }
      else if (id === 'tab-signature') { setTool('signature'); openSidebarRight('Signature'); }
    });
  });
}

function setupTools() {
  const toolBtns = [
    { id: 'btn-select', name: 'select' },
    { id: 'btn-text', name: 'text' },
    { id: 'btn-erase', name: 'erase' },
    { id: 'btn-rect', name: 'rect' },
    { id: 'btn-highlight', name: 'highlight' },
    { id: 'btn-annotate', name: 'annotate' },
    { id: 'btn-watermark', name: 'watermark' },
    { id: 'btn-signature', name: 'signature' }
  ];

  toolBtns.forEach(t => {
    const btn = document.getElementById(t.id);
    if (!btn) return;
    btn.addEventListener('click', () => {
      toolBtns.forEach(b => {
        const el = document.getElementById(b.id);
        if (el) el.classList.remove('active');
      });
      btn.classList.add('active');
      setTool(t.name);
    });
  });

  document.getElementById('btn-close-sidebar-right').addEventListener('click', () => {
    dom.sidebarRight.classList.add('hidden');
    dom.sidebarRight.classList.remove('active');
    setTool('select');
  });

  dom.overlayLayer.addEventListener('click', handleCanvasClick);
  dom.overlayLayer.addEventListener('dblclick', handleCanvasDoubleClick);
}

function setTool(toolName) {
  state.activeTool = toolName;
  setActiveTool(toolName);

  if (['text', 'erase', 'rect', 'watermark', 'signature'].includes(toolName)) {
    dom.sidebarRight.classList.remove('hidden');
    dom.sidebarRight.classList.add('active');
    renderToolSidebar(toolName);
  } else {
    dom.sidebarRight.classList.add('hidden');
    dom.sidebarRight.classList.remove('active');
  }
}

function renderToolSidebar(toolName) {
  if (toolName === 'watermark') {
    dom.toolTitle.textContent = 'Filigrane';
    dom.toolContent.innerHTML = `
      <div class="form-group">
        <label>Type</label>
        <select id="wm-type" class="form-control">
          <option value="text">Texte</option>
          <option value="image">Image</option>
        </select>
      </div>
      <div id="wm-text-opts">
        <div class="form-group">
          <label>Texte</label>
          <input type="text" id="wm-text" class="form-control" value="CONFIDENTIEL">
        </div>
        <div class="form-group">
          <label>Police</label>
          <select id="wm-font" class="form-control">
            <option value="Helvetica">Helvetica</option>
            <option value="Inter">Inter</option>
            <option value="Courier">Courier</option>
          </select>
        </div>
        <div class="form-group">
          <label>Taille</label>
          <input type="number" id="wm-size" class="form-control" value="48" min="8" max="200">
        </div>
        <div class="form-group">
          <label>Couleur</label>
          <div class="color-picker-wrapper">
            <input type="color" id="wm-color" value="#000000">
            <span id="wm-color-val">#000000</span>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label>Opacité (%)</label>
        <div class="slider-container">
          <input type="range" id="wm-opacity" min="10" max="100" value="50">
          <span id="wm-opacity-val">50%</span>
        </div>
      </div>
      <div class="form-group">
        <label>Rotation (°)</label>
        <div class="slider-container">
          <input type="range" id="wm-rotate" min="-180" max="180" value="45">
          <span id="wm-rotate-val">45°</span>
        </div>
      </div>
      <div class="form-group">
        <label>Position</label>
        <div class="grid-3x3">
          <div class="grid-cell" data-pos="tl"></div>
          <div class="grid-cell" data-pos="tc"></div>
          <div class="grid-cell" data-pos="tr"></div>
          <div class="grid-cell" data-pos="ml"></div>
          <div class="grid-cell active" data-pos="cc"></div>
          <div class="grid-cell" data-pos="mr"></div>
          <div class="grid-cell" data-pos="bl"></div>
          <div class="grid-cell" data-pos="bc"></div>
          <div class="grid-cell" data-pos="br"></div>
        </div>
      </div>
      <div class="form-group" style="margin-top:12px;">
        <label>Cible</label>
        <select id="wm-pages" class="form-control">
          <option value="all">Toutes les pages</option>
          <option value="${state.currentPage}">Page courante</option>
          <option value="selected">Pages sélectionnées</option>
        </select>
      </div>
      <button id="btn-apply-wm" class="btn primary" style="width:100%; margin-top:20px;">Appliquer</button>
    `;

    document.getElementById('btn-apply-wm').addEventListener('click', async () => {
      const target = document.getElementById('wm-pages').value;
      const targetPages = target === 'selected' ?
        (state.selectedPages.size > 0 ? Array.from(state.selectedPages).map(p => p+1).join(',') : state.currentPage.toString()) : target;

      let position = 'cc';
      const activeCell = document.querySelector('.grid-cell.active');
      if (activeCell) position = activeCell.dataset.pos;

      const config = {
        type: document.getElementById('wm-type').value,
        text: document.getElementById('wm-text').value,
        font: document.getElementById('wm-font').value,
        size: document.getElementById('wm-size').value,
        color: document.getElementById('wm-color').value,
        opacity: document.getElementById('wm-opacity').value,
        rotation: document.getElementById('wm-rotate').value,
        pages: targetPages,
        position: position
      };
      const res = await applyWatermark(config);
      if (res) {
        showToast('Filigrane appliqué', 'success');
        refreshCurrentPage();
      }
    });
  } else if (toolName === 'signature') {
    dom.toolTitle.textContent = 'Signature';
    dom.toolContent.innerHTML = `
      <div class="form-group">
        <label>Dessiner</label>
        <div class="signature-pad-container">
          <canvas id="sig-canvas" class="signature-canvas" width="400" height="200"></canvas>
        </div>
        <div style="display:flex; justify-content:flex-end; margin-top:8px;">
          <button id="btn-clear-sig" class="btn small ghost">Effacer</button>
        </div>
      </div>
      <div class="form-group">
        <label>Ou importer une image</label>
        <input type="file" id="sig-image-upload" class="form-control" accept="image/png, image/jpeg">
      </div>
      <div class="form-group">
        <label>Ou saisir au clavier</label>
        <input type="text" id="sig-text" class="form-control" placeholder="Votre nom">
      </div>
      <button id="btn-insert-sig" class="btn primary" style="width:100%; margin-top:20px;">Prêt à insérer</button>
      <p style="font-size:12px; color:var(--text-secondary); margin-top:10px;">Cliquez sur la page pour placer.</p>
    `;

    setTimeout(() => {
      initSignaturePad('sig-canvas');
      document.getElementById('btn-clear-sig').addEventListener('click', clearSignature);

      const upload = document.getElementById('sig-image-upload');
      if (upload) {
        upload.addEventListener('change', async (e) => {
          if (e.target.files && e.target.files.length) {
            importSignatureImage = await import('./signature.js').then(m => m.processSignatureImage);
            window._tempSigImage = await importSignatureImage(e.target.files[0], 200);
            showToast('Image chargée, cliquez sur la page pour placer', 'success');
          }
        });
      }

      document.getElementById('btn-insert-sig').addEventListener('click', () => {
        showToast('Cliquez n\'importe où sur la page pour placer la signature.', 'info');
      });
    }, 100);
  } else {
    dom.toolTitle.textContent = 'Propriétés';
    dom.toolContent.innerHTML = '<p style="color:var(--text-secondary);font-size:13px;">Cliquez sur la page pour utiliser l\'outil.</p>';
  }
}

async function handleCanvasClick(e) {
  if (state.activeTool === 'select' || state.activeTool === 'watermark') return;

  const rect = dom.overlayLayer.getBoundingClientRect();
  const x = (e.clientX - rect.left) / state.zoomLevel;
  const y = (e.clientY - rect.top) / state.zoomLevel;

  if (state.activeTool === 'text') {
    const text = await promptDialog('Ajouter du texte', 'Texte à ajouter :');
    if (text) {
      const res = await addTextToPdf(state.currentPage, text, x, y, { size: 14, color: '#000000' });
      if (res) refreshCurrentPage();
    }
  } else if (state.activeTool === 'erase') {
    const res = await addRectToPdf(state.currentPage, x, y, 100, 20, { color: '#ffffff' });
    if (res) refreshCurrentPage();
  } else if (state.activeTool === 'rect') {
    const res = await addRectToPdf(state.currentPage, x, y, 100, 50, { color: '#ffffff', opacity: 1 });
    if (res) refreshCurrentPage();
  } else if (state.activeTool === 'signature') {
    const sigText = document.getElementById('sig-text');
    let dataUrl = null;

    if (window._tempSigImage) {
      dataUrl = window._tempSigImage;
      window._tempSigImage = null;
      const upload = document.getElementById('sig-image-upload');
      if (upload) upload.value = '';
    } else if (sigText && sigText.value.trim() !== '') {
      dataUrl = await generateTextSignature(sigText.value.trim(), 'font-caveat', '#000000');
    } else {
      dataUrl = getSignatureDataUrl();
    }

    if (!dataUrl) {
      showToast('Veuillez dessiner ou taper une signature.', 'warning');
      return;
    }

    const res = await applySignatureToPdf(state.currentPage, dataUrl, x, y, 150, 50);
    if (res) refreshCurrentPage();
  }
}

async function handleCanvasDoubleClick(e) {
  if (state.activeTool !== 'select') return;

  const rect = dom.overlayLayer.getBoundingClientRect();
  const x = (e.clientX - rect.left) / state.zoomLevel;
  const y = (e.clientY - rect.top) / state.zoomLevel;

  const text = await promptDialog('Modifier le texte', 'Attention: cela ajoutera un texte par dessus.');
  if (text) {
    const res = await addTextToPdf(state.currentPage, text, x, y, { size: 14, color: '#000000' });
    if (res) refreshCurrentPage();
  }
}

function handleFileDrop(e) {
  e.preventDefault();
  dom.dropZone.classList.remove('drag-active');
  const files = e.dataTransfer.files;
  if (files.length) handleFiles(files);
}

async function handleFiles(files) {
  if (!files || !files.length) return;
  const file = files[0];

  if (file.size > MAX_FILE_SIZE) {
    showToast(`Fichier trop volumineux (Max: ${formatBytes(MAX_FILE_SIZE)})`, 'error');
    return;
  }

  const fType = await detectFileType(file);

  try {
    let arrayBuffer;
    let filename = file.name;

    if (fType === 'pdf') {
      arrayBuffer = await readFileAsArrayBuffer(file);
    } else {
      showToast(`Conversion de ${filename} en PDF...`, 'info');
      arrayBuffer = await convertToPdf(file);
      filename = filename.substring(0, filename.lastIndexOf('.')) + '.pdf';
    }

    const result = await loadPDF(arrayBuffer, filename);
    state.totalPages = result.numPages;
    state.currentPage = 1;

    dom.welcome.classList.add('hidden');
    dom.editor.classList.remove('hidden');

    await refreshUI();

    if (files.length > 1) {
      const confirmed = await confirmDialog('Plusieurs fichiers', 'Voulez-vous fusionner les autres fichiers déposés ?');
      if (confirmed) {
        const buffers = [await getPdfDoc().save()];
        for (let i = 1; i < files.length; i++) {
          if (files[i].size > MAX_FILE_SIZE) continue;
          const t = await detectFileType(files[i]);
          if (t === 'pdf') buffers.push(await readFileAsArrayBuffer(files[i]));
          else buffers.push(await convertToPdf(files[i]));
        }
        await mergePDFs(buffers);
        await refreshUI();
      }
    }

  } catch (e) {
    console.error(e);
  }
}

async function refreshUI() {
  if (!getPdfDoc()) return;
  state.totalPages = getPdfDoc().getPageCount();
  dom.totalPagesDisplay.textContent = state.totalPages;

  if (state.currentPage > state.totalPages) state.currentPage = state.totalPages;
  dom.currentPageInput.value = state.currentPage;

  state.selectedPages.clear();

  await refreshThumbnails();
  await goToPage(state.currentPage);
}

async function refreshThumbnails() {
  dom.thumbnailsContainer.innerHTML = '';
  for (let i = 1; i <= state.totalPages; i++) {
    const div = document.createElement('div');
    div.className = 'thumbnail-item';
    if (i === state.currentPage) div.classList.add('active');

    const img = document.createElement('img');
    img.className = 'thumbnail-img';
    img.alt = `Page ${i}`;

    const num = document.createElement('div');
    num.className = 'thumbnail-number';
    num.textContent = i;

    div.appendChild(img);
    div.appendChild(num);

    div.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey) {
        togglePageSelection(i - 1, div);
      } else {
        goToPage(i);
      }
    });

    dom.thumbnailsContainer.appendChild(div);

    getThumbnail(i).then(dataUrl => {
      if (dataUrl) img.src = dataUrl;
    });
  }
}

async function refreshCurrentPage() {
  await goToPage(state.currentPage);
  await refreshThumbnails();
}

async function goToPage(pageNum) {
  if (pageNum < 1 || pageNum > state.totalPages) return;
  state.currentPage = pageNum;
  dom.currentPageInput.value = pageNum;

  Array.from(dom.thumbnailsContainer.children).forEach((el, idx) => {
    if (idx === pageNum - 1) el.classList.add('active');
    else el.classList.remove('active');
  });

  const result = await renderPage(pageNum, 'pdf-canvas', state.zoomLevel);
  if (result) {
    dom.overlayLayer.style.width = `${result.width}px`;
    dom.overlayLayer.style.height = `${result.height}px`;
  }
}

function changeZoom(delta) {
  state.zoomLevel = Math.max(0.2, Math.min(5.0, state.zoomLevel + delta));
  dom.zoomDisplay.textContent = `${Math.round(state.zoomLevel * 100)}%`;
  goToPage(state.currentPage);
}

function fitWidth() {
  const containerWidth = dom.canvasContainer.clientWidth - 48;
  const canvasWidth = dom.canvas.width / getDeviceInfo().devicePixelRatio;
  state.zoomLevel = containerWidth / (canvasWidth / state.zoomLevel);
  dom.zoomDisplay.textContent = `${Math.round(state.zoomLevel * 100)}%`;
  goToPage(state.currentPage);
}

function fitPage() {
  const containerHeight = dom.canvasContainer.clientHeight - 48;
  const canvasHeight = dom.canvas.height / getDeviceInfo().devicePixelRatio;
  state.zoomLevel = containerHeight / (canvasHeight / state.zoomLevel);
  dom.zoomDisplay.textContent = `${Math.round(state.zoomLevel * 100)}%`;
  goToPage(state.currentPage);
}

function togglePageSelection(index, element) {
  if (state.selectedPages.has(index)) {
    state.selectedPages.delete(index);
    element.classList.remove('selected');
  } else {
    state.selectedPages.add(index);
    element.classList.add('selected');
  }
}

function toggleSelectAllPages() {
  if (state.selectedPages.size === state.totalPages) {
    state.selectedPages.clear();
    Array.from(dom.thumbnailsContainer.children).forEach(el => el.classList.remove('selected'));
  } else {
    for (let i = 0; i < state.totalPages; i++) state.selectedPages.add(i);
    Array.from(dom.thumbnailsContainer.children).forEach(el => el.classList.add('selected'));
  }
}

function getTargetPages() {
  return state.selectedPages.size > 0 ? Array.from(state.selectedPages) : [state.currentPage - 1];
}

async function rotateSelected(degrees) {
  const targets = getTargetPages();
  await rotatePages(targets, degrees);
  await refreshUI();
}

async function deleteSelectedPages() {
  const targets = getTargetPages();
  if (targets.length === state.totalPages) {
    showToast('Impossible de supprimer toutes les pages.', 'error');
    return;
  }
  const confirmed = await confirmDialog('Supprimer', `Supprimer ${targets.length} page(s) ?`, 'Supprimer', 'Annuler', true);
  if (confirmed) {
    await removePages(targets);
    await refreshUI();
  }
}

async function duplicateSelectedPages() {
  const targets = getTargetPages();
  await duplicatePages(targets);
  await refreshUI();
}

async function insertBlankPageAt(index) {
  await insertBlankPage(index);
  await refreshUI();
}

async function performOCR() {
  if (state.activeTool !== 'select') return;
  const doc = getPdfDoc();
  if (!doc) return;

  showLoader('Initialisation de l\'OCR...');
  try {
    if (!window.Tesseract) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    }

    updateProgress(30, 'Analyse de la page...');
    const dataUrl = await getThumbnail(state.currentPage, 1500);

    updateProgress(50, 'Reconnaissance du texte...');
    if (!tesseractWorker) {
      tesseractWorker = await window.Tesseract.createWorker('fra+eng');
    }

    const { data: { text } } = await tesseractWorker.recognize(dataUrl);

    updateProgress(90, 'Application...');
    if (text && text.trim()) {
      showToast('Texte extrait (copié dans le presse-papier) : ' + text.substring(0, 50) + '...', 'success');
      navigator.clipboard.writeText(text).catch(()=> {});
    } else {
      showToast('Aucun texte trouvé.', 'warning');
    }
  } catch (e) {
    showToast('Erreur OCR', 'error');
  }
  hideLoader();
}

async function splitPdf() {
  const targets = getTargetPages();
  if (!targets || targets.length === 0) {
    showToast('Veuillez sélectionner au moins une page.', 'warning');
    return;
  }
  const confirmed = await confirmDialog('Diviser PDF', `Extraire les ${targets.length} page(s) sélectionnée(s) en un nouveau document ?`);
  if (confirmed) {
    showLoader('Création du nouveau PDF...');
    try {
      const doc = getPdfDoc();
      const newDoc = await PDFLib.PDFDocument.create();
      const copiedPages = await newDoc.copyPages(doc, targets);
      copiedPages.forEach(p => newDoc.addPage(p));
      const bytes = await newDoc.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      downloadBlob(blob, 'split_' + getCurrentFilename());
      showToast('Document extrait', 'success');
    } catch(e) {
      showToast('Erreur lors de la division', 'error');
    }
    hideLoader();
  }
}

async function openCompressModal() {
  const html = `
    <div class="form-group">
      <label>Qualité</label>
      <select id="compress-preset" class="form-control">
        <option value="standard">Standard recommandé</option>
        <option value="high">Qualité Élevée</option>
        <option value="max">Qualité Maximale</option>
        <option value="mobile">Mobile / Email</option>
      </select>
    </div>
  `;
  const footer = `
    <button class="btn ghost" id="btn-cancel-compress">Annuler</button>
    <button class="btn primary" id="btn-do-compress">Compresser et télécharger</button>
  `;

  const close = openModal('Compresser le PDF', html, footer, () => {
    document.getElementById('btn-cancel-compress').addEventListener('click', close);
    document.getElementById('btn-do-compress').addEventListener('click', async () => {
      const preset = document.getElementById('compress-preset').value;
      close();
      const blob = await compressPdf(preset);
      if (blob) {
        let name = getCurrentFilename();
        name = name.replace('.pdf', '') + '_compress.pdf';
        downloadBlob(blob, name);
      }
    });
  });
}

async function downloadCurrentPdf() {
  const blob = await savePDF();
  if (blob) downloadBlob(blob, getCurrentFilename());
}

async function printPdf() {
  const blob = await savePDF();
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const iframe = document.getElementById('print-iframe');
  iframe.src = url;
  iframe.onload = () => {
    iframe.contentWindow.print();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
}

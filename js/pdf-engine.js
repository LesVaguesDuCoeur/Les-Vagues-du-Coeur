import { showToast, showLoader, hideLoader, updateProgress } from './ui.js';
import { getDeviceInfo } from './utils.js';

let pdfDoc = null;
let pdfJsDoc = null;
let currentFileName = 'document.pdf';
let renderCache = new Map();

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.worker.min.mjs';

export async function loadPDF(arrayBuffer, filename) {
  try {
    showLoader('Ouverture du PDF...');
    currentFileName = filename || 'document.pdf';

    updateProgress(30, 'Lecture du fichier...');
    pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    updateProgress(60, 'Préparation du rendu...');
    const uint8Array = new Uint8Array(arrayBuffer);
    pdfJsDoc = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    renderCache.clear();
    updateProgress(100, 'Terminé');
    hideLoader();

    return {
      numPages: pdfDoc.getPageCount(),
      filename: currentFileName
    };
  } catch (error) {
    hideLoader();
    showToast('Erreur lors de l\'ouverture du PDF: fichier corrompu ou format invalide.', 'error');
    throw error;
  }
}

export async function renderPage(pageNum, canvasId, scale = 1.0) {
  if (!pdfJsDoc) return null;
  try {
    const page = await pdfJsDoc.getPage(pageNum);
    const { devicePixelRatio } = getDeviceInfo();
    const viewport = page.getViewport({ scale: scale * devicePixelRatio });

    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    canvas.style.width = `${viewport.width / devicePixelRatio}px`;
    canvas.style.height = `${viewport.height / devicePixelRatio}px`;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      enableWebGL: true
    };

    await page.render(renderContext).promise;
    return {
      width: viewport.width / devicePixelRatio,
      height: viewport.height / devicePixelRatio,
      scale: scale
    };
  } catch (e) {
    showToast('Erreur de rendu de la page', 'error');
    return null;
  }
}

export async function getThumbnail(pageNum, width = 120) {
  const cacheKey = `thumb_${pageNum}_${width}`;
  if (renderCache.has(cacheKey)) {
    return renderCache.get(cacheKey);
  }

  if (!pdfJsDoc) return null;
  try {
    const page = await pdfJsDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = width / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    const context = canvas.getContext('2d');
    await page.render({ canvasContext: context, viewport: scaledViewport }).promise;

    const dataUrl = canvas.toDataURL('image/webp', 0.8);
    renderCache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch (e) {
    return null;
  }
}

export async function savePDF() {
  if (!pdfDoc) return null;
  try {
    showLoader('Sauvegarde du PDF...');
    const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
    hideLoader();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (e) {
    hideLoader();
    showToast('Erreur lors de la sauvegarde', 'error');
    return null;
  }
}

export async function rotatePages(pageIndices, degrees) {
  if (!pdfDoc) return;
  const pages = pdfDoc.getPages();
  pageIndices.forEach(idx => {
    if (pages[idx]) {
      const current = pages[idx].getRotation().angle;
      pages[idx].setRotation(PDFLib.degrees(current + degrees));
      invalidateCache(idx + 1);
    }
  });
  await syncPdfJs();
}

export async function removePages(pageIndices) {
  if (!pdfDoc) return;
  const sorted = [...pageIndices].sort((a, b) => b - a);
  sorted.forEach(idx => {
    try {
      pdfDoc.removePage(idx);
    } catch (e) { }
  });
  renderCache.clear();
  await syncPdfJs();
}

export async function duplicatePages(pageIndices) {
  if (!pdfDoc) return;
  const sorted = [...pageIndices].sort((a, b) => a - b);
  const copiedPages = await pdfDoc.copyPages(pdfDoc, sorted);

  sorted.forEach((idx, i) => {
    try {
      pdfDoc.insertPage(idx + 1 + i, copiedPages[i]);
    } catch (e) { }
  });
  renderCache.clear();
  await syncPdfJs();
}

export async function insertBlankPage(afterIndex, size = 'A4') {
  if (!pdfDoc) return;
  try {
    let dims = PDFLib.PageSizes.A4;
    if (size === 'Letter') dims = PDFLib.PageSizes.Letter;
    if (size === 'Legal') dims = PDFLib.PageSizes.Legal;

    pdfDoc.insertPage(afterIndex + 1, dims);
    renderCache.clear();
    await syncPdfJs();
  } catch (e) {
    showToast('Erreur d\'insertion', 'error');
  }
}

export async function reorderPages(newOrderArray) {
  if (!pdfDoc) return;
  try {
    const newDoc = await PDFLib.PDFDocument.create();
    const copiedPages = await newDoc.copyPages(pdfDoc, newOrderArray);
    copiedPages.forEach(p => newDoc.addPage(p));
    pdfDoc = newDoc;
    renderCache.clear();
    await syncPdfJs();
  } catch (e) {
    showToast('Erreur de réorganisation', 'error');
  }
}

export async function mergePDFs(arrayBuffersArray) {
  try {
    showLoader('Fusion des PDF...');
    const mergedPdf = await PDFLib.PDFDocument.create();

    for (const buffer of arrayBuffersArray) {
      const doc = await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    pdfDoc = mergedPdf;
    renderCache.clear();
    await syncPdfJs();
    hideLoader();
    showToast('PDFs fusionnés avec succès', 'success');
  } catch (e) {
    hideLoader();
    showToast('Erreur lors de la fusion', 'error');
  }
}

export function getPdfDoc() {
  return pdfDoc;
}

export function getCurrentFilename() {
  return currentFileName;
}

function invalidateCache(pageNum) {
  const keys = Array.from(renderCache.keys());
  keys.forEach(k => {
    if (k.startsWith(`thumb_${pageNum}_`)) {
      renderCache.delete(k);
    }
  });
}

async function syncPdfJs() {
  const bytes = await pdfDoc.save({ useObjectStreams: false });
  const uint8Array = new Uint8Array(bytes);
  pdfJsDoc = await pdfjsLib.getDocument({ data: uint8Array }).promise;
}

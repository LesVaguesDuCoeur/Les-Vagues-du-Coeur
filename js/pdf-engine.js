import { showLoader, hideLoader, showToast } from './ui.js';
import { history } from './utils.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.worker.min.mjs';

let currentPdfLibDoc = null;
let currentPdfJsDoc = null;
let pageCache = new Map();
let originalFileName = 'document.pdf';

export async function loadPdf(arrayBuffer, fileName) {
    try {
        showLoader('Ouverture du document...');

        currentPdfLibDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        currentPdfLibDoc.registerFontkit(window.fontkit);

        currentPdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        originalFileName = fileName;
        pageCache.clear();
        history.states = [];
        history.index = -1;

        await saveToHistory();

        hideLoader();
        return {
            pageCount: currentPdfLibDoc.getPageCount(),
            fileName: originalFileName
        };
    } catch (e) {
        hideLoader();
        showToast('Erreur lors de l\'ouverture du PDF', 'error');
        throw e;
    }
}

export async function saveToHistory() {
    if (!currentPdfLibDoc) return;
    const bytes = await currentPdfLibDoc.save();
    history.push(bytes);
}

export async function restoreHistoryState(bytes) {
    if (!bytes) return false;
    try {
        showLoader('Restauration...');
        currentPdfLibDoc = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
        currentPdfLibDoc.registerFontkit(window.fontkit);

        const newBytes = await currentPdfLibDoc.save();
        currentPdfJsDoc = await pdfjsLib.getDocument({ data: newBytes }).promise;

        pageCache.clear();
        hideLoader();
        return true;
    } catch (e) {
        hideLoader();
        showToast('Erreur de restauration', 'error');
        return false;
    }
}

export async function renderPageToCanvas(pageNum, canvas, scale = 1.0) {
    if (!currentPdfJsDoc) return;

    try {
        const page = await currentPdfJsDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d');
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };

        await page.render(renderContext).promise;
        return { viewport, page };
    } catch (e) {
        console.warn(`Error rendering page ${pageNum}:`, e);
        throw e;
    }
}

export async function generateThumbnail(pageNum, width = 150) {
    if (pageCache.has(pageNum)) {
        return pageCache.get(pageNum);
    }

    try {
        const page = await currentPdfJsDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        const scale = width / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        pageCache.set(pageNum, dataUrl);
        return dataUrl;
    } catch (e) {
        return null;
    }
}

export function getPdfLibDoc() {
    return currentPdfLibDoc;
}

export function getFileName() {
    return originalFileName;
}

export async function syncPdfJs() {
    if (!currentPdfLibDoc) return;
    const bytes = await currentPdfLibDoc.save();
    currentPdfJsDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
    pageCache.clear();
}
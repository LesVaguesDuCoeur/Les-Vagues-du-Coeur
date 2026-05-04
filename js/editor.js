import { getPdfLibDoc, syncPdfJs, saveToHistory, renderPageToCanvas, getFileName } from './pdf-engine.js';
import { showLoader, hideLoader, showToast, confirmDialog } from './ui.js';
import { downloadBlob, history } from './utils.js';
import { getPdfFont } from './fonts.js';
import { applySignature } from './signature.js';

let currentTool = 'select';
let activePage = 0;
let pdfScale = 1.0;
let isDrawing = false;
let startX = 0, startY = 0;
let currentAnnotation = null;
let dragSignatureData = null;

export function setTool(toolName) {
    currentTool = toolName;
    const container = document.getElementById('mainCanvasContainer');
    container.style.cursor = toolName === 'select' ? 'default' :
                             toolName === 'text' ? 'text' :
                             toolName === 'erase' ? 'crosshair' :
                             toolName === 'highlight' ? 'crosshair' :
                             toolName === 'signature-place' ? 'crosshair' : 'default';

    document.querySelectorAll('.toolbar-group .btn-icon').forEach(btn => {
        btn.classList.remove('active');
        if (btn.id === 'btn' + toolName.charAt(0).toUpperCase() + toolName.slice(1)) {
            btn.classList.add('active');
        }
    });
}

export function setActivePage(pageNum) {
    activePage = pageNum;
    document.getElementById('pageInput').value = pageNum + 1;
    updateCanvas();
}

export function setScale(scale) {
    pdfScale = scale;
    document.getElementById('zoomLevel').textContent = Math.round(scale * 100) + '%';
    updateCanvas();
}

export function setDragSignature(dataUrl) {
    dragSignatureData = dataUrl;
    setTool('signature-place');
    showToast('Cliquez sur la page pour placer la signature', 'info');
}

export async function updateCanvas() {
    const canvas = document.getElementById('pdfCanvas');
    const layer = document.getElementById('annotationLayer');
    if (!canvas || !layer) return;

    layer.innerHTML = '';

    try {
        const { viewport } = await renderPageToCanvas(activePage, canvas, pdfScale);
        layer.style.width = viewport.width + 'px';
        layer.style.height = viewport.height + 'px';
    } catch (e) {
        console.error("Erreur de rendu canvas", e);
    }
}

export async function handleCanvasClick(e) {
    const canvas = document.getElementById('pdfCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pdfX = x / pdfScale;
    const pdfY = y / pdfScale;

    if (currentTool === 'text') {
        createTextInput(x, y, pdfX, pdfY);
    } else if (currentTool === 'signature-place' && dragSignatureData) {
        const sigWidth = 150;
        const sigHeight = 50;
        await applySignature(dragSignatureData, activePage, pdfX, pdfY - sigHeight/pdfScale, sigWidth/pdfScale, sigHeight/pdfScale);
        dragSignatureData = null;
        setTool('select');
    }
}

export function handleCanvasMouseDown(e) {
    if (currentTool !== 'erase' && currentTool !== 'highlight') return;

    const canvas = document.getElementById('pdfCanvas');
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isDrawing = true;

    currentAnnotation = document.createElement('div');
    currentAnnotation.style.position = 'absolute';
    currentAnnotation.style.left = startX + 'px';
    currentAnnotation.style.top = startY + 'px';

    if (currentTool === 'erase') {
        currentAnnotation.style.backgroundColor = '#ffffff';
    } else if (currentTool === 'highlight') {
        currentAnnotation.style.backgroundColor = 'rgba(255, 255, 0, 0.4)';
    }

    document.getElementById('annotationLayer').appendChild(currentAnnotation);
}

export function handleCanvasMouseMove(e) {
    if (!isDrawing || !currentAnnotation) return;

    const canvas = document.getElementById('pdfCanvas');
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = currentX - startX;
    const height = currentY - startY;

    currentAnnotation.style.width = Math.abs(width) + 'px';
    currentAnnotation.style.height = Math.abs(height) + 'px';
    currentAnnotation.style.left = (width < 0 ? currentX : startX) + 'px';
    currentAnnotation.style.top = (height < 0 ? currentY : startY) + 'px';
}

export async function handleCanvasMouseUp(e) {
    if (!isDrawing || !currentAnnotation) return;
    isDrawing = false;

    const left = parseFloat(currentAnnotation.style.left) / pdfScale;
    const top = parseFloat(currentAnnotation.style.top) / pdfScale;
    const width = parseFloat(currentAnnotation.style.width) / pdfScale;
    const height = parseFloat(currentAnnotation.style.height) / pdfScale;

    currentAnnotation.remove();
    currentAnnotation = null;

    if (width < 5 || height < 5) return;

    const doc = getPdfLibDoc();
    const page = doc.getPages()[activePage];
    const { height: pageHeight } = page.getSize();

    const pdfY = pageHeight - top - height;

    if (currentTool === 'erase') {
        page.drawRectangle({
            x: left, y: pdfY, width, height,
            color: PDFLib.rgb(1, 1, 1),
        });
    } else if (currentTool === 'highlight') {
        page.drawRectangle({
            x: left, y: pdfY, width, height,
            color: PDFLib.rgb(1, 1, 0),
            opacity: 0.4
        });
    }

    await saveToHistory();
    await syncPdfJs();
    updateCanvas();
}

function createTextInput(x, y, pdfX, pdfY) {
    const layer = document.getElementById('annotationLayer');
    const input = document.createElement('div');
    input.contentEditable = true;
    input.style.position = 'absolute';
    input.style.left = x + 'px';
    input.style.top = y + 'px';
    input.style.minWidth = '50px';
    input.style.minHeight = '20px';
    input.style.border = '1px dashed #d4af37';
    input.style.padding = '2px';
    input.style.fontFamily = 'Helvetica, sans-serif';
    input.style.fontSize = (16 * pdfScale) + 'px';
    input.style.color = '#000000';
    input.style.background = 'transparent';
    input.style.outline = 'none';
    input.style.whiteSpace = 'nowrap';

    layer.appendChild(input);
    input.focus();

    input.addEventListener('blur', async () => {
        const text = input.innerText.trim();
        if (text) {
            const doc = getPdfLibDoc();
            const page = doc.getPages()[activePage];
            const { height: pageHeight } = page.getSize();
            const font = await getPdfFont(doc, 'Helvetica');

            page.drawText(text, {
                x: pdfX,
                y: pageHeight - pdfY - 16,
                size: 16,
                font: font,
                color: PDFLib.rgb(0, 0, 0)
            });

            await saveToHistory();
            await syncPdfJs();
            updateCanvas();
        }
        input.remove();
        setTool('select');
    });
}

export async function deleteCurrentPage() {
    const doc = getPdfLibDoc();
    if (!doc) return;
    if (doc.getPageCount() <= 1) {
        showToast('Impossible de supprimer la dernière page', 'error');
        return;
    }

    const confirmed = await confirmDialog('Supprimer', 'Voulez-vous vraiment supprimer cette page ?', 'Supprimer', 'Annuler', true);
    if (!confirmed) return;

    doc.removePage(activePage);
    await saveToHistory();
    await syncPdfJs();

    if (activePage >= doc.getPageCount()) {
        activePage = doc.getPageCount() - 1;
    }
    document.dispatchEvent(new CustomEvent('pdfUpdated'));
}

export async function rotateCurrentPage() {
    const doc = getPdfLibDoc();
    if (!doc) return;
    const page = doc.getPages()[activePage];
    const currentRot = page.getRotation().angle;
    page.setRotation(PDFLib.degrees(currentRot + 90));

    await saveToHistory();
    await syncPdfJs();
    updateCanvas();
    document.dispatchEvent(new CustomEvent('pdfUpdated'));
}

export async function duplicateCurrentPage() {
    const doc = getPdfLibDoc();
    if (!doc) return;
    const [copiedPage] = await doc.copyPages(doc, [activePage]);
    doc.insertPage(activePage + 1, copiedPage);

    await saveToHistory();
    await syncPdfJs();
    setActivePage(activePage + 1);
    document.dispatchEvent(new CustomEvent('pdfUpdated'));
}

export async function addBlankPage() {
    const doc = getPdfLibDoc();
    if (!doc) return;
    doc.insertPage(activePage + 1, [595.28, 841.89]);

    await saveToHistory();
    await syncPdfJs();
    setActivePage(activePage + 1);
    document.dispatchEvent(new CustomEvent('pdfUpdated'));
}

export async function downloadPdf() {
    const doc = getPdfLibDoc();
    if (!doc) return;
    showLoader('Préparation du téléchargement...');
    try {
        const bytes = await doc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        downloadBlob(blob, `edite_${getFileName()}`);
        showToast('Téléchargement terminé', 'success');
    } catch (e) {
        showToast('Erreur de téléchargement', 'error');
    } finally {
        hideLoader();
    }
}

export async function printPdf() {
    const doc = getPdfLibDoc();
    if (!doc) return;
    showLoader('Préparation de l\'impression...');
    try {
        const bytes = await doc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);

        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(url);
                }, 1000);
            }, 100);
        };
    } catch (e) {
        showToast('Erreur d\'impression', 'error');
    } finally {
        hideLoader();
    }
}
export async function mergePdf() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.multiple = true;

    input.onchange = async (e) => {
        if (!e.target.files.length) return;
        const files = Array.from(e.target.files);

        showLoader('Fusion des PDFs...');
        try {
            const mainDoc = getPdfLibDoc();
            if (!mainDoc) throw new Error("Aucun document ouvert");

            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer();
                const docToMerge = await PDFLib.PDFDocument.load(arrayBuffer);
                const copiedPages = await mainDoc.copyPages(docToMerge, docToMerge.getPageIndices());
                copiedPages.forEach((page) => {
                    mainDoc.addPage(page);
                });
            }

            await saveToHistory();
            await syncPdfJs();
            document.dispatchEvent(new CustomEvent('pdfUpdated'));
            showToast('PDFs fusionnés', 'success');
        } catch (err) {
            console.error(err);
            showToast('Erreur lors de la fusion', 'error');
        } finally {
            hideLoader();
        }
    };
    input.click();
}

export async function splitPdf() {
    const doc = getPdfLibDoc();
    if (!doc) return;

    const range = prompt("Entrez la plage de pages à extraire (ex: 1-3, 5) :", "");
    if (!range) return;

    showLoader('Extraction des pages...');
    try {
        const total = doc.getPageCount();
        const targets = [];
        const parts = range.split(',');
        parts.forEach(p => {
            if (p.includes('-')) {
                const [start, end] = p.split('-').map(n => parseInt(n.trim()) - 1);
                if (!isNaN(start) && !isNaN(end)) {
                    for(let i=start; i<=end; i++) if (i>=0 && i<total) targets.push(i);
                }
            } else {
                const n = parseInt(p.trim()) - 1;
                if (!isNaN(n) && n>=0 && n<total) targets.push(n);
            }
        });

        const uniqueTargets = [...new Set(targets)];
        if (!uniqueTargets.length) throw new Error("Plage invalide");

        const newDoc = await PDFLib.PDFDocument.create();
        const copiedPages = await newDoc.copyPages(doc, uniqueTargets);
        copiedPages.forEach(page => newDoc.addPage(page));

        const bytes = await newDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        downloadBlob(blob, `extrait_${Date.now()}.pdf`);

        showToast('Pages extraites avec succès', 'success');
    } catch(err) {
        console.error(err);
        showToast('Erreur lors de la division', 'error');
    } finally {
        hideLoader();
    }
}

import { showToast, showModal, hideLoader, confirmDialog, showLoader } from './ui.js';
import { loadPdf, getPdfLibDoc, generateThumbnail, getFileName, restoreHistoryState } from './pdf-engine.js';
import { convertToPdf } from './converter.js';
import {
    setTool, setActivePage, setScale, updateCanvas,
    handleCanvasClick, handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp,
    deleteCurrentPage, rotateCurrentPage, duplicateCurrentPage, addBlankPage,
    downloadPdf, printPdf, setDragSignature, mergePdf, splitPdf
} from './editor.js';
import { applyWatermark } from './watermark.js';
import { ensureSignaturePad, removeWhiteBackground } from './signature.js';
import { compressPdf } from './compressor.js';
import { idb, registerShortcut, history, readFileAsDataURL } from './utils.js';
import { loadSignatureFonts, builtInFonts } from './fonts.js';

let appState = 'empty';

async function init() {
    initTheme();
    bindEvents();
    setupDropZone();
    registerShortcuts();

    document.addEventListener('pdfUpdated', () => {
        renderThumbnails();
        updatePageIndicator();
    });
}

function bindEvents() {
    document.getElementById('btnThemeToggle').onclick = toggleTheme;

    document.getElementById('btnBrowseEmpty').onclick = () => document.getElementById('fileInputEmpty').click();
    document.getElementById('fileInputEmpty').onchange = handleFileSelect;

    document.getElementById('btnSelect').onclick = () => setTool('select');
    document.getElementById('btnText').onclick = () => setTool('text');
    document.getElementById('btnErase').onclick = () => setTool('erase');
    document.getElementById('btnHighlight').onclick = () => setTool('highlight');

    document.getElementById('btnDeletePage').onclick = deleteCurrentPage;
    document.getElementById('btnRotate').onclick = rotateCurrentPage;
    document.getElementById('btnDuplicatePage').onclick = duplicateCurrentPage;
    document.getElementById('btnAddPage').onclick = addBlankPage;

    document.getElementById('btnDownload').onclick = downloadPdf;
    document.getElementById('btnPrint').onclick = printPdf;
    document.getElementById('btnMerge').onclick = mergePdf;
    document.getElementById('btnSplit').onclick = splitPdf;

    document.getElementById('btnWatermark').onclick = openWatermarkModal;
    document.getElementById('btnOCR').onclick = runOCR;
    document.getElementById('btnSignature').onclick = openSignatureModal;
    document.getElementById('btnDownloadCompress').onclick = openCompressModal;

    document.getElementById('btnZoomIn').onclick = () => setScale(Math.min(3.0, parseFloat(document.getElementById('zoomLevel').textContent) / 100 + 0.25));
    document.getElementById('btnZoomOut').onclick = () => setScale(Math.max(0.25, parseFloat(document.getElementById('zoomLevel').textContent) / 100 - 0.25));
    document.getElementById('btnFitWidth').onclick = () => {
        const canvas = document.getElementById('pdfCanvas');
        const container = document.getElementById('mainCanvasContainer');
        if (canvas && container) setScale(container.clientWidth / (canvas.width / parseFloat(document.getElementById('zoomLevel').textContent) * 100) * 0.95);
    };
    document.getElementById('btnFitPage').onclick = () => setScale(1.0);

    document.getElementById('btnPrevPage').onclick = () => {
        const current = parseInt(document.getElementById('pageInput').value) - 1;
        if (current > 0) setActivePage(current - 1);
    };
    document.getElementById('btnNextPage').onclick = () => {
        const doc = getPdfLibDoc();
        const current = parseInt(document.getElementById('pageInput').value) - 1;
        if (doc && current < doc.getPageCount() - 1) setActivePage(current + 1);
    };
    document.getElementById('pageInput').onchange = (e) => {
        const doc = getPdfLibDoc();
        let val = parseInt(e.target.value) - 1;
        if (doc) {
            if (val < 0) val = 0;
            if (val >= doc.getPageCount()) val = doc.getPageCount() - 1;
            setActivePage(val);
        }
    };

    const canvasContainer = document.getElementById('mainCanvasContainer');
    canvasContainer.addEventListener('click', handleCanvasClick);
    canvasContainer.addEventListener('mousedown', handleCanvasMouseDown);
    canvasContainer.addEventListener('mousemove', handleCanvasMouseMove);
    window.addEventListener('mouseup', handleCanvasMouseUp);

    document.getElementById('btnReset').onclick = async () => {
        const confirmed = await confirmDialog('Réinitialiser', 'Annuler toutes les modifications ?', 'Oui', 'Non', true);
        if (confirmed) {
            const initialBytes = history.states[0];
            if (await restoreHistoryState(initialBytes)) {
                document.dispatchEvent(new CustomEvent('pdfUpdated'));
                updateCanvas();
            }
        }
    };
}

function registerShortcuts() {
    registerShortcut('ctrl+o', () => document.getElementById('fileInputEmpty').click());
    registerShortcut('ctrl+s', downloadPdf);
    registerShortcut('ctrl+p', printPdf);
    registerShortcut('ctrl+z', async () => {
        const state = history.undo();
        if (state) {
            await restoreHistoryState(state);
            document.dispatchEvent(new CustomEvent('pdfUpdated'));
            updateCanvas();
        }
    });
    registerShortcut('ctrl+y', async () => {
        const state = history.redo();
        if (state) {
            await restoreHistoryState(state);
            document.dispatchEvent(new CustomEvent('pdfUpdated'));
            updateCanvas();
        }
    });
}

function setupDropZone() {
    const dropZone = document.getElementById('mainDropZone');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) handleFiles(files);
    });
}

async function handleFileSelect(e) {
    if (e.target.files.length) {
        await handleFiles(e.target.files);
    }
}

async function handleFiles(files) {
    if (!files.length) return;

    if (files.length > 1 && appState === 'empty') {
        const confirmed = await confirmDialog('Fusion', 'Voulez-vous fusionner ces fichiers en un seul PDF ?', 'Oui', 'Non');
        if (confirmed) {
            await mergeMultipleFiles(Array.from(files));
            return;
        }
    }

    const file = files[0];
    if (file.size > 200 * 1024 * 1024) {
        showToast('Le fichier dépasse la limite de 200 Mo', 'error');
        return;
    }

    try {
        const pdfBytes = await convertToPdf(file);
        const result = await loadPdf(pdfBytes, file.name.replace(/\.[^/.]+$/, "") + ".pdf");

        switchToEditorMode();
        renderThumbnails();
        updatePageIndicator();
        setActivePage(0);
        showToast('Document chargé avec succès', 'success');
    } catch (e) {
        console.error(e);
    }
}

function switchToEditorMode() {
    appState = 'editor';
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('editorState').style.display = 'flex';
    document.getElementById('mainToolbar').style.display = 'flex';
    document.getElementById('bottomTabBar').style.display = 'flex';
}

async function renderThumbnails() {
    const doc = getPdfLibDoc();
    if (!doc) return;
    const container = document.getElementById('thumbnailsContainer');
    container.innerHTML = '';

    for (let i = 0; i < doc.getPageCount(); i++) {
        const div = document.createElement('div');
        div.className = `thumbnail-item ${i === activePage ? 'active' : ''}`;
        div.onclick = () => {
            document.querySelectorAll('.thumbnail-item').forEach(el => el.classList.remove('active'));
            div.classList.add('active');
            setActivePage(i);
        };

        const wrapper = document.createElement('div');
        wrapper.className = 'thumbnail-canvas-wrapper';

        const img = document.createElement('img');
        generateThumbnail(i, 150).then(dataUrl => {
            if (dataUrl) img.src = dataUrl;
        });

        const label = document.createElement('div');
        label.className = 'thumbnail-label';
        label.textContent = `Page ${i + 1}`;

        wrapper.appendChild(img);
        div.appendChild(wrapper);
        div.appendChild(label);
        container.appendChild(div);
    }
}

function updatePageIndicator() {
    const doc = getPdfLibDoc();
    if (doc) {
        document.getElementById('pageCount').textContent = doc.getPageCount();
        document.getElementById('pageInput').max = doc.getPageCount();
    }
}

function openWatermarkModal() {
    const template = document.getElementById('watermarkModalTemplate').innerHTML;
    const footer = `
        <button class="btn-ghost" id="btnWmCancel">Annuler</button>
        <button class="btn-primary" id="btnWmApply">Appliquer</button>
    `;

    showModal('Ajouter un filigrane', template, footer, (body, footer) => {
        const fontSelect = body.querySelector('#wmFont');
        builtInFonts.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.name;
            opt.textContent = f.name;
            fontSelect.appendChild(opt);
        });

        body.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => {
                body.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                body.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                body.querySelector(`#${btn.dataset.tab}`).style.display = 'block';
            };
        });

        body.querySelectorAll('.grid-cell').forEach(btn => {
            btn.onclick = () => {
                body.querySelectorAll('.grid-cell').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        body.querySelector('#wmPages').onchange = (e) => {
            body.querySelector('#wmPagesCustom').style.display = e.target.value === 'custom' ? 'block' : 'none';
        };

        let imageData = null;
        body.querySelector('#wmImageInput').onchange = async (e) => {
            if (e.target.files[0]) {
                imageData = await readFileAsDataURL(e.target.files[0]);
            }
        };

        footer.querySelector('#btnWmCancel').onclick = () => document.querySelector('.btn-close-modal').click();
        footer.querySelector('#btnWmApply').onclick = async () => {
            const type = body.querySelector('.tab-btn.active').dataset.tab === 'wm-text' ? 'text' : 'image';
            const settings = {
                type,
                text: body.querySelector('#wmTextContent').value,
                font: fontSelect.value,
                size: body.querySelector('#wmSize').value,
                color: body.querySelector('#wmColor').value,
                opacity: body.querySelector('#wmOpacity').value,
                rotation: body.querySelector('#wmRotation').value,
                position: body.querySelector('.grid-cell.active').dataset.pos,
                tiling: body.querySelector('#wmTiling').checked,
                pages: body.querySelector('#wmPages').value,
                customPagesStr: body.querySelector('#wmPagesCustom').value,
                imageData: imageData
            };

            document.querySelector('.btn-close-modal').click();
            await applyWatermark(settings);
            updateCanvas();
        };
    });
}

async function openSignatureModal() {
    await ensureSignaturePad();
    await loadSignatureFonts();

    const template = document.getElementById('signatureModalTemplate').innerHTML;
    const footer = `
        <button class="btn-ghost" id="btnSigCancel">Annuler</button>
        <button class="btn-primary" id="btnSigApply">Créer & Placer</button>
    `;

    showModal('Créer une signature', template, footer, (body, footer) => {
        const canvas = body.querySelector('#sigDrawCanvas');
        const signaturePad = new window.SignaturePad(canvas, { backgroundColor: 'rgba(255, 255, 255, 0)' });

        body.querySelector('#btnSigClear').onclick = () => signaturePad.clear();
        body.querySelectorAll('.btn-color').forEach(btn => {
            btn.onclick = () => {
                body.querySelectorAll('.btn-color').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                signaturePad.penColor = btn.dataset.color;
            };
        });

        body.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => {
                body.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                body.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                body.querySelector(`#${btn.dataset.tab}`).style.display = 'block';
            };
        });

        let customImageData = null;
        body.querySelector('#sigImageInput').onchange = async (e) => {
            if (e.target.files[0]) {
                const dataUrl = await readFileAsDataURL(e.target.files[0]);
                const img = new Image();
                img.onload = () => {
                    const prevCanvas = body.querySelector('#sigImagePreview');
                    prevCanvas.width = img.width;
                    prevCanvas.height = img.height;
                    const ctx = prevCanvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    if (body.querySelector('#sigRemoveBg').checked) {
                        removeWhiteBackground(prevCanvas, parseInt(body.querySelector('#sigThreshold').value));
                    }
                    customImageData = prevCanvas.toDataURL('image/png');
                };
                img.src = dataUrl;
            }
        };

        body.querySelector('#sigThreshold').oninput = (e) => {
             body.querySelector('#sigThresholdVal').textContent = e.target.value;
             body.querySelector('#sigImageInput').dispatchEvent(new Event('change'));
        };
        body.querySelector('#sigRemoveBg').onchange = () => body.querySelector('#sigImageInput').dispatchEvent(new Event('change'));

        footer.querySelector('#btnSigCancel').onclick = () => document.querySelector('.btn-close-modal').click();
        footer.querySelector('#btnSigApply').onclick = () => {
            const activeTab = body.querySelector('.tab-btn.active').dataset.tab;
            let finalDataUrl = null;

            if (activeTab === 'sig-draw') {
                if (signaturePad.isEmpty()) { showToast('Veuillez dessiner une signature', 'error'); return; }
                finalDataUrl = signaturePad.toDataURL('image/png');
            } else if (activeTab === 'sig-image') {
                if (!customImageData) { showToast('Veuillez importer une image', 'error'); return; }
                finalDataUrl = customImageData;
            } else if (activeTab === 'sig-type') {
                const text = body.querySelector('#sigTextInput').value;
                if (!text) { showToast('Veuillez taper un nom', 'error'); return; }
                const tmpCanvas = document.createElement('canvas');
                tmpCanvas.width = 400; tmpCanvas.height = 150;
                const ctx = tmpCanvas.getContext('2d');
                ctx.font = '48px Caveat';
                ctx.fillStyle = '#000';
                ctx.fillText(text, 20, 80);
                finalDataUrl = tmpCanvas.toDataURL('image/png');
            }

            if (finalDataUrl) {
                document.querySelector('.btn-close-modal').click();
                setDragSignature(finalDataUrl);
            }
        };
    });
}

function openCompressModal() {
    const template = document.getElementById('compressModalTemplate').innerHTML;
    const footer = `
        <button class="btn-ghost" id="btnCompCancel">Annuler</button>
        <button class="btn-primary" id="btnCompApply">Compresser & Télécharger</button>
    `;

    showModal('Compresser le PDF', template, footer, (body, footer) => {
        const customSettings = body.querySelector('#compCustomSettings');
        body.querySelectorAll('input[name="compPreset"]').forEach(radio => {
            radio.onchange = (e) => {
                customSettings.style.display = e.target.value === 'custom' ? 'block' : 'none';
            };
        });

        body.querySelector('#compDpi').oninput = (e) => body.querySelector('#compDpiVal').textContent = e.target.value;
        body.querySelector('#compQuality').oninput = (e) => body.querySelector('#compQualityVal').textContent = e.target.value;

        footer.querySelector('#btnCompCancel').onclick = () => document.querySelector('.btn-close-modal').click();
        footer.querySelector('#btnCompApply').onclick = () => {
            const preset = body.querySelector('input[name="compPreset"]:checked').value;
            document.querySelector('.btn-close-modal').click();
            compressPdf({ preset });
        };
    });
}

async function initTheme() {
    const savedTheme = await idb.get('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    idb.set('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#btnThemeToggle i');
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

window.addEventListener('DOMContentLoaded', init);
async function mergeMultipleFiles(files) {
    showLoader('Conversion et fusion des fichiers...');
    try {
        const mergedDoc = await PDFLib.PDFDocument.create();

        for (const file of files) {
            const pdfBytes = await convertToPdf(file);
            const tempDoc = await PDFLib.PDFDocument.load(pdfBytes);
            const copiedPages = await mergedDoc.copyPages(tempDoc, tempDoc.getPageIndices());
            copiedPages.forEach(page => mergedDoc.addPage(page));
        }

        const finalBytes = await mergedDoc.save();
        await loadPdf(finalBytes, 'fusion.pdf');

        switchToEditorMode();
        renderThumbnails();
        updatePageIndicator();
        setActivePage(0);
        showToast('Fichiers fusionnés avec succès', 'success');
    } catch (e) {
        console.error(e);
        showToast('Erreur lors de la fusion', 'error');
    } finally {
        hideLoader();
    }
}


let tesseractLoaded = false;
async function runOCR() {
    if (!tesseractLoaded) {
        showLoader('Chargement de Tesseract OCR...');
        await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js';
            script.onload = () => { tesseractLoaded = true; resolve(); };
            document.head.appendChild(script);
        });
    }

    showLoader('Analyse OCR de la page courante...');
    try {
        const doc = getPdfLibDoc();
        if (!doc) throw new Error("Aucun document ouvert");

        const activePageNum = parseInt(document.getElementById('pageInput').value) - 1;
        const dataUrl = await generateThumbnail(activePageNum, 2000);

        const worker = await Tesseract.createWorker('fra+eng');
        const ret = await worker.recognize(dataUrl);
        await worker.terminate();

        const text = ret.data.text;

        showModal('Résultat OCR', `<textarea style="width:100%; height:300px; resize:none;">${text}</textarea>`,
            '<button class="btn-primary btn-close-modal">Fermer</button>');
        showToast('OCR terminé', 'success');
    } catch(err) {
        console.error(err);
        showToast('Erreur OCR', 'error');
    } finally {
        hideLoader();
    }
}

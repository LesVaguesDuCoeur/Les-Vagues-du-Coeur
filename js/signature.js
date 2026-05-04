import { getPdfLibDoc, syncPdfJs, saveToHistory } from './pdf-engine.js';
import { showLoader, hideLoader, showToast } from './ui.js';

let signaturePadLibLoaded = false;

export async function ensureSignaturePad() {
    if (signaturePadLibLoaded) return;
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/signature_pad/5.0.4/signature_pad.umd.min.js';
        script.onload = () => { signaturePadLibLoaded = true; resolve(); };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export function removeWhiteBackground(canvas, threshold = 240) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const avg = (r + g + b) / 3;

        if (avg > threshold) {
            data[i+3] = 0;
        } else {
            const alphaFactor = Math.max(0, (threshold - avg) / 50);
            data[i+3] = Math.min(255, Math.floor(255 * alphaFactor));
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

export async function applySignature(dataUrl, pageIndex, x, y, width, height) {
    const doc = getPdfLibDoc();
    if (!doc) return;

    showLoader('Application de la signature...');

    try {
        const pages = doc.getPages();
        const page = pages[pageIndex];
        const { height: pageHeight } = page.getSize();

        const imageEmbed = dataUrl.startsWith('data:image/png') ?
            await doc.embedPng(dataUrl) : await doc.embedJpg(dataUrl);

        const pdfY = pageHeight - y - height;

        page.drawImage(imageEmbed, {
            x: x,
            y: pdfY,
            width: width,
            height: height
        });

        await saveToHistory();
        await syncPdfJs();
        hideLoader();
        showToast('Signature appliquée', 'success');

    } catch (e) {
        hideLoader();
        showToast('Erreur lors de l\'application de la signature', 'error');
        console.error(e);
    }
}
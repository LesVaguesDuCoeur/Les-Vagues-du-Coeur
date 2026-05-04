import { getPdfLibDoc, syncPdfJs, saveToHistory } from './pdf-engine.js';
import { showLoader, hideLoader, showToast } from './ui.js';
import { getPdfFont } from './fonts.js';

export async function applyWatermark(settings) {
    const doc = getPdfLibDoc();
    if (!doc) return;

    showLoader('Application du filigrane...');

    try {
        const pages = doc.getPages();
        const targetPages = getTargetPages(settings.pages, pages.length, settings.customPagesStr);

        let imageEmbed = null;
        if (settings.type === 'image' && settings.imageData) {
            if (settings.imageData.startsWith('data:image/png')) {
                imageEmbed = await doc.embedPng(settings.imageData);
            } else {
                imageEmbed = await doc.embedJpg(settings.imageData);
            }
        }

        let fontEmbed = null;
        if (settings.type === 'text') {
             fontEmbed = await getPdfFont(doc, settings.font);
        }

        for (let i = 0; i < pages.length; i++) {
            if (!targetPages.includes(i)) continue;

            const page = pages[i];
            const { width, height } = page.getSize();

            const opacity = settings.opacity / 100;
            const degrees = parseInt(settings.rotation) || 0;
            const rotation = PDFLib.degrees(degrees);

            if (settings.tiling) {
                applyTiling(page, settings, width, height, imageEmbed, fontEmbed, opacity, rotation);
            } else {
                applySingle(page, settings, width, height, imageEmbed, fontEmbed, opacity, rotation);
            }
        }

        await saveToHistory();
        await syncPdfJs();
        hideLoader();
        showToast('Filigrane appliqué avec succès', 'success');

    } catch (e) {
        hideLoader();
        showToast('Erreur lors de l\'application du filigrane', 'error');
        console.error(e);
    }
}

function getTargetPages(mode, total, customStr) {
    const targets = [];
    if (mode === 'all') {
        for(let i=0; i<total; i++) targets.push(i);
    } else if (mode === 'current') {
        const current = parseInt(document.getElementById('pageInput').value) - 1;
        if (current >= 0 && current < total) targets.push(current);
    } else if (mode === 'even') {
        for(let i=1; i<total; i+=2) targets.push(i);
    } else if (mode === 'odd') {
        for(let i=0; i<total; i+=2) targets.push(i);
    } else if (mode === 'custom' && customStr) {
        const parts = customStr.split(',');
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
    }
    return [...new Set(targets)];
}

function getPosition(posStr, pWidth, pHeight, oWidth, oHeight) {
    let x = 0, y = 0;
    if (posStr.includes('l')) x = 50;
    else if (posStr.includes('r')) x = pWidth - oWidth - 50;
    else x = pWidth / 2 - oWidth / 2;

    if (posStr.includes('b')) y = 50;
    else if (posStr.includes('t')) y = pHeight - oHeight - 50;
    else y = pHeight / 2 - oHeight / 2;

    return {x, y};
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
}

function applySingle(page, settings, pWidth, pHeight, imageEmbed, fontEmbed, opacity, rotation) {
    if (settings.type === 'text') {
        const size = parseInt(settings.size) || 48;
        const color = hexToRgb(settings.color || '#000000');
        const textWidth = fontEmbed.widthOfTextAtSize(settings.text, size);
        const textHeight = fontEmbed.heightAtSize(size);
        const {x, y} = getPosition(settings.position, pWidth, pHeight, textWidth, textHeight);

        page.drawText(settings.text, {
            x, y, size, font: fontEmbed,
            color: PDFLib.rgb(color.r, color.g, color.b),
            opacity, rotate: rotation
        });
    } else if (settings.type === 'image' && imageEmbed) {
        const imgDims = imageEmbed.scaleToFit(pWidth * 0.8, pHeight * 0.8);
        const {x, y} = getPosition(settings.position, pWidth, pHeight, imgDims.width, imgDims.height);

        page.drawImage(imageEmbed, {
            x, y, width: imgDims.width, height: imgDims.height,
            opacity, rotate: rotation
        });
    }
}

function applyTiling(page, settings, pWidth, pHeight, imageEmbed, fontEmbed, opacity, rotation) {
    const stepX = pWidth / 3;
    const stepY = pHeight / 3;

    for (let x = 0; x < pWidth; x += stepX) {
        for (let y = 0; y < pHeight; y += stepY) {
            if (settings.type === 'text') {
                const size = parseInt(settings.size) || 48;
                const color = hexToRgb(settings.color || '#000000');
                page.drawText(settings.text, {
                    x, y, size, font: fontEmbed,
                    color: PDFLib.rgb(color.r, color.g, color.b),
                    opacity, rotate: rotation
                });
            } else if (settings.type === 'image' && imageEmbed) {
                const imgDims = imageEmbed.scaleToFit(stepX * 0.8, stepY * 0.8);
                page.drawImage(imageEmbed, {
                    x, y, width: imgDims.width, height: imgDims.height,
                    opacity, rotate: rotation
                });
            }
        }
    }
}
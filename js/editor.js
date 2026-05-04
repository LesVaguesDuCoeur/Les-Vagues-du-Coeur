import { getPdfDoc } from './pdf-engine.js';
import { embedFont } from './fonts.js';
import { showToast } from './ui.js';

let activeTool = 'select';
let overlayLayer = null;

export function initEditor(containerId) {
  overlayLayer = document.getElementById(containerId);
}

export function setActiveTool(tool) {
  activeTool = tool;
  if (overlayLayer) {
    overlayLayer.style.cursor = getCursorForTool(tool);
  }
}

function getCursorForTool(tool) {
  switch(tool) {
    case 'text': return 'text';
    case 'erase': return 'crosshair';
    case 'rect': return 'crosshair';
    case 'highlight': return 'text';
    case 'annotate': return 'url(data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>) 0 16, auto';
    default: return 'default';
  }
}

export async function addTextToPdf(pageNum, text, x, y, options = {}) {
  const doc = getPdfDoc();
  if (!doc) return false;

  try {
    const pages = doc.getPages();
    const page = pages[pageNum - 1];

    const fontName = options.font || 'Helvetica';
    const embeddedFont = await embedFont(doc, fontName);

    const size = options.size || 14;
    const colorHex = options.color || '#000000';
    const r = parseInt(colorHex.slice(1, 3), 16) / 255;
    const g = parseInt(colorHex.slice(3, 5), 16) / 255;
    const b = parseInt(colorHex.slice(5, 7), 16) / 255;

    const { height } = page.getSize();
    const pdfY = height - y - size;

    page.drawText(text, {
      x,
      y: pdfY,
      size,
      font: embeddedFont,
      color: PDFLib.rgb(r, g, b),
      lineHeight: size * 1.2
    });

    return true;
  } catch (e) {
    showToast('Erreur lors de l\'ajout du texte', 'error');
    return false;
  }
}

export async function addRectToPdf(pageNum, x, y, width, height, options = {}) {
  const doc = getPdfDoc();
  if (!doc) return false;

  try {
    const pages = doc.getPages();
    const page = pages[pageNum - 1];
    const { height: pageHeight } = page.getSize();

    const colorHex = options.color || '#ffffff';
    const r = parseInt(colorHex.slice(1, 3), 16) / 255;
    const g = parseInt(colorHex.slice(3, 5), 16) / 255;
    const b = parseInt(colorHex.slice(5, 7), 16) / 255;

    const opacity = options.opacity !== undefined ? options.opacity : 1;

    page.drawRectangle({
      x,
      y: pageHeight - y - height,
      width,
      height,
      color: PDFLib.rgb(r, g, b),
      opacity: opacity
    });

    return true;
  } catch (e) {
    return false;
  }
}

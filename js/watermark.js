import { getPdfDoc } from './pdf-engine.js';
import { embedFont } from './fonts.js';
import { showToast, confirmDialog } from './ui.js';

export async function applyWatermark(config) {
  const doc = getPdfDoc();
  if (!doc) return false;

  try {
    const pages = doc.getPages();
    const targetIndices = getTargetIndices(config.pages, pages.length);

    if (targetIndices.length > 50) {
      const confirmed = await confirmDialog(
        'Attention',
        `Vous allez appliquer un filigrane sur ${targetIndices.length} pages. Le processus peut prendre un peu de temps. Continuer ?`,
        'Continuer',
        'Annuler'
      );
      if (!confirmed) return false;
    }

    if (config.type === 'text') {
      await applyTextWatermark(doc, pages, targetIndices, config);
    } else if (config.type === 'image' && config.imageData) {
      await applyImageWatermark(doc, pages, targetIndices, config);
    }

    return true;
  } catch (e) {
    showToast('Erreur lors de l\'application du filigrane', 'error');
    return false;
  }
}

async function applyTextWatermark(doc, pages, indices, config) {
  const font = await embedFont(doc, config.font || 'Helvetica');
  const size = parseInt(config.size) || 48;
  const opacity = (parseInt(config.opacity) || 50) / 100;
  const rotationAngle = parseInt(config.rotation) || 0;

  const hex = config.color || '#000000';
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const text = config.text || 'CONFIDENTIEL';
  const textWidth = font.widthOfTextAtSize(text, size);
  const textHeight = font.heightAtSize(size);

  for (const idx of indices) {
    const page = pages[idx];
    const { width, height } = page.getSize();

    if (config.tiling) {
      const stepX = textWidth + (parseInt(config.spacing) || 100);
      const stepY = textHeight + (parseInt(config.spacing) || 100);

      for (let x = -width; x < width * 2; x += stepX) {
        for (let y = -height; y < height * 2; y += stepY) {
          drawWatermarkText(page, text, x, y, font, size, r, g, b, opacity, rotationAngle, config.style);
        }
      }
    } else {
      const pos = calculatePosition(config.position, width, height, textWidth, textHeight, config.offsetX || 0, config.offsetY || 0);
      drawWatermarkText(page, text, pos.x, pos.y, font, size, r, g, b, opacity, rotationAngle, config.style);
    }
  }
}

function drawWatermarkText(page, text, x, y, font, size, r, g, b, opacity, rotationAngle, style) {
  const color = PDFLib.rgb(r, g, b);
  const options = {
    x,
    y,
    size,
    font,
    rotate: PDFLib.degrees(rotationAngle),
    opacity
  };

  if (style === 'stroke' || style === 'both') {
    page.drawText(text, {
      ...options,
      color: style === 'stroke' ? undefined : color,
      borderColor: color,
      borderWidth: 1,
      borderOpacity: opacity
    });
  } else {
    page.drawText(text, {
      ...options,
      color
    });
  }
}

async function applyImageWatermark(doc, pages, indices, config) {
  let image;
  if (config.imageData.includes('image/png')) {
    image = await doc.embedPng(config.imageData);
  } else {
    image = await doc.embedJpg(config.imageData);
  }

  const scale = (parseInt(config.scale) || 100) / 100;
  const opacity = (parseInt(config.opacity) || 50) / 100;
  const rotationAngle = parseInt(config.rotation) || 0;

  const imgWidth = image.width * scale;
  const imgHeight = image.height * scale;

  for (const idx of indices) {
    const page = pages[idx];
    const { width, height } = page.getSize();

    if (config.tiling) {
      const stepX = imgWidth + (parseInt(config.spacing) || 50);
      const stepY = imgHeight + (parseInt(config.spacing) || 50);

      for (let x = -width; x < width * 2; x += stepX) {
        for (let y = -height; y < height * 2; y += stepY) {
          page.drawImage(image, {
            x, y,
            width: imgWidth,
            height: imgHeight,
            rotate: PDFLib.degrees(rotationAngle),
            opacity
          });
        }
      }
    } else {
      const pos = calculatePosition(config.position, width, height, imgWidth, imgHeight, config.offsetX || 0, config.offsetY || 0);
      page.drawImage(image, {
        x: pos.x,
        y: pos.y,
        width: imgWidth,
        height: imgHeight,
        rotate: PDFLib.degrees(rotationAngle),
        opacity
      });
    }
  }
}

function calculatePosition(gridPos, pageW, pageH, itemW, itemH, offX, offY) {
  let x = 0, y = 0;
  const centerX = (pageW - itemW) / 2;
  const centerY = (pageH - itemH) / 2;
  const rightX = pageW - itemW;
  const topY = pageH - itemH;

  switch(gridPos) {
    case 'tl': x = 0; y = topY; break;
    case 'tc': x = centerX; y = topY; break;
    case 'tr': x = rightX; y = topY; break;
    case 'ml': x = 0; y = centerY; break;
    case 'cc': x = centerX; y = centerY; break;
    case 'mr': x = rightX; y = centerY; break;
    case 'bl': x = 0; y = 0; break;
    case 'bc': x = centerX; y = 0; break;
    case 'br': x = rightX; y = 0; break;
    default: x = centerX; y = centerY;
  }

  return { x: x + offX, y: y - offY };
}

function getTargetIndices(mode, totalPages) {
  const indices = [];
  if (mode === 'all') {
    for (let i = 0; i < totalPages; i++) indices.push(i);
  } else if (mode === 'even') {
    for (let i = 1; i < totalPages; i += 2) indices.push(i);
  } else if (mode === 'odd') {
    for (let i = 0; i < totalPages; i += 2) indices.push(i);
  } else if (mode.startsWith('custom:')) {
    const rangeStr = mode.replace('custom:', '');
    const parts = rangeStr.split(',');
    parts.forEach(p => {
      const bounds = p.split('-').map(n => parseInt(n.trim()));
      if (bounds.length === 1 && !isNaN(bounds[0])) {
        if (bounds[0] > 0 && bounds[0] <= totalPages) indices.push(bounds[0] - 1);
      } else if (bounds.length === 2 && !isNaN(bounds[0]) && !isNaN(bounds[1])) {
        const start = Math.max(1, Math.min(bounds[0], bounds[1]));
        const end = Math.min(totalPages, Math.max(bounds[0], bounds[1]));
        for (let i = start; i <= end; i++) indices.push(i - 1);
      }
    });
  } else {
    const pageNum = parseInt(mode);
    if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
      indices.push(pageNum - 1);
    }
  }
  return [...new Set(indices)];
}

import { getPdfDoc } from './pdf-engine.js';
import { showToast } from './ui.js';
import { idbSet, idbGet } from './utils.js';

let signaturePadInstance = null;

export function initSignaturePad(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(255, 255, 255, 0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (typeof SignaturePad !== 'undefined') {
    signaturePadInstance = new SignaturePad(canvas, {
      minWidth: 1,
      maxWidth: 3,
      penColor: '#000000',
      backgroundColor: 'rgba(0,0,0,0)'
    });
    return signaturePadInstance;
  }
  return null;
}

export function clearSignature() {
  if (signaturePadInstance) {
    signaturePadInstance.clear();
  }
}

export function getSignatureDataUrl() {
  if (signaturePadInstance && !signaturePadInstance.isEmpty()) {
    return signaturePadInstance.toDataURL('image/png');
  }
  return null;
}

export async function processSignatureImage(file, threshold = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness > threshold) {
            data[i + 3] = 0;
          } else {
            const alpha = 255 - Math.max(0, brightness - threshold + 50) * 5;
            data[i + 3] = Math.min(255, Math.max(0, alpha));
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function generateTextSignature(text, fontClass, color) {
  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const fontFamily = getFontFamilyFromClass(fontClass);
  ctx.font = `64px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const alpha = data[(y * canvas.width + x) * 4 + 3];
      if (alpha > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX > maxX) return canvas.toDataURL('image/png');

  const padding = 20;
  const cropped = document.createElement('canvas');
  cropped.width = maxX - minX + padding * 2;
  cropped.height = maxY - minY + padding * 2;
  const croppedCtx = cropped.getContext('2d');

  croppedCtx.drawImage(
    canvas,
    minX - padding, minY - padding,
    cropped.width, cropped.height,
    0, 0,
    cropped.width, cropped.height
  );

  return cropped.toDataURL('image/png');
}

function getFontFamilyFromClass(className) {
  const map = {
    'font-caveat': "'Caveat', cursive",
    'font-dancing': "'Dancing Script', cursive",
    'font-pacifico': "'Pacifico', cursive",
    'font-greatvibes': "'Great Vibes', cursive",
    'font-sacramento': "'Sacramento', cursive",
    'font-allura': "'Allura', cursive",
    'font-mrdafoe': "'Mr Dafoe', cursive",
    'font-homemade': "'Homemade Apple', cursive"
  };
  return map[className] || 'sans-serif';
}

export async function saveSignature(dataUrl, name) {
  try {
    let signatures = await idbGet('signatures') || [];
    signatures.push({ id: Date.now().toString(), name, data: dataUrl });
    if (signatures.length > 5) signatures = signatures.slice(-5);
    await idbSet('signatures', signatures);
    return true;
  } catch (e) {
    return false;
  }
}

export async function getSavedSignatures() {
  try {
    return await idbGet('signatures') || [];
  } catch (e) {
    return [];
  }
}

export async function deleteSignature(id) {
  try {
    let signatures = await idbGet('signatures') || [];
    signatures = signatures.filter(s => s.id !== id);
    await idbSet('signatures', signatures);
    return true;
  } catch (e) {
    return false;
  }
}

export async function applySignatureToPdf(pageNum, dataUrl, x, y, width, height) {
  const doc = getPdfDoc();
  if (!doc) return false;

  try {
    const pages = doc.getPages();
    const page = pages[pageNum - 1];

    const image = await doc.embedPng(dataUrl);
    const { height: pageHeight } = page.getSize();

    page.drawImage(image, {
      x,
      y: pageHeight - y - height,
      width,
      height
    });

    return true;
  } catch (e) {
    showToast('Erreur lors de l\'application de la signature', 'error');
    return false;
  }
}

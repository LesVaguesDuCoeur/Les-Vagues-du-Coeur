import { showToast } from './ui.js';

const INTERNAL_FONTS = {
  'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
  'Roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap',
  'Open Sans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap',
  'Lato': 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
  'Montserrat': 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap'
};

const STANDARD_FONTS = ['Helvetica', 'TimesRoman', 'Courier'];

export async function loadGoogleFont(fontName) {
  if (!INTERNAL_FONTS[fontName]) return null;
  const url = INTERNAL_FONTS[fontName];
  if (!document.querySelector(`link[href="${url}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
    try {
      await document.fonts.ready;
    } catch (e) {
      return null;
    }
  }
  return fontName;
}

export function getAvailableFonts() {
  return [...STANDARD_FONTS, ...Object.keys(INTERNAL_FONTS)];
}

export async function embedFont(pdfDoc, fontName) {
  if (STANDARD_FONTS.includes(fontName)) {
    let standardFont;
    if (fontName === 'Helvetica') standardFont = PDFLib.StandardFonts.Helvetica;
    if (fontName === 'TimesRoman') standardFont = PDFLib.StandardFonts.TimesRoman;
    if (fontName === 'Courier') standardFont = PDFLib.StandardFonts.Courier;
    return await pdfDoc.embedFont(standardFont);
  }

  if (INTERNAL_FONTS[fontName]) {
    try {
      pdfDoc.registerFontkit(window.fontkit);
      const url = `https://fonts.gstatic.com/s/${fontName.toLowerCase().replace(' ', '')}/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf`;
      const fontBytes = await fetch(url).then(res => res.arrayBuffer());
      return await pdfDoc.embedFont(fontBytes);
    } catch (e) {
      showToast(`Impossible de charger la police ${fontName}, utilisation d'Helvetica`, 'warning');
      return await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    }
  }

  return await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
}

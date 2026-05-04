export const builtInFonts = [
    { name: 'Helvetica', type: 'standard' },
    { name: 'Times-Roman', type: 'standard' },
    { name: 'Courier', type: 'standard' }
];

export const signatureFonts = [
    'Caveat',
    'Dancing Script',
    'Pacifico',
    'Great Vibes',
    'Sacramento',
    'Allura',
    'Mr Dafoe',
    'Homemade Apple'
];

let fontsLoaded = false;

export async function loadSignatureFonts() {
    if (fontsLoaded) return;

    try {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        const familyParams = signatureFonts.map(f => `family=${f.replace(/ /g, '+')}`).join('&');
        link.href = `https://fonts.googleapis.com/css2?${familyParams}&display=swap`;
        document.head.appendChild(link);
        fontsLoaded = true;
    } catch (e) {
        console.warn('Failed to load signature fonts from Google Fonts', e);
    }
}

export async function getPdfFont(pdfDoc, fontName) {
    if (!fontName) {
         return await pdfDoc.embedStandardFont('Helvetica');
    }

    const standardFonts = {
        'Helvetica': 'Helvetica',
        'Times-Roman': 'TimesRoman',
        'Courier': 'Courier',
        'Helvetica-Bold': 'HelveticaBold',
        'Times-Bold': 'TimesRomanBold'
    };

    if (standardFonts[fontName]) {
        return await pdfDoc.embedStandardFont(standardFonts[fontName]);
    }

    return await pdfDoc.embedStandardFont('Helvetica');
}
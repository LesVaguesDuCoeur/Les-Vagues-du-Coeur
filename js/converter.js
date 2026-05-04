import { showLoader, hideLoader, showToast } from './ui.js';
import { detectFileType, readFileAsArrayBuffer, readFileAsDataURL } from './utils.js';

let jspdfLoaded = false;
let mammothLoaded = false;
let sheetjsLoaded = false;
let jszipLoaded = false;

async function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function ensureJsPdf() {
    if (jspdfLoaded) return;
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js');
    window.jsPDF = window.jspdf.jsPDF;
    jspdfLoaded = true;
}

export async function convertToPdf(file) {
    const fileType = await detectFileType(file);

    if (fileType === 'pdf') {
        return await readFileAsArrayBuffer(file);
    }

    showLoader(`Conversion de ${file.name} en PDF...`);

    try {
        let pdfBytes = null;


        if (fileType === 'image') {
            await ensureJsPdf();
            pdfBytes = await convertImageToPdf(file);
        } else if (fileType === 'text') {
            await ensureJsPdf();
            pdfBytes = await convertTextToPdf(file);
        } else if (fileType === 'word') {
             pdfBytes = await convertWordToPdf(file);
        } else if (fileType === 'excel') {
             pdfBytes = await convertExcelToPdf(file);
        } else if (fileType === 'powerpoint') {
             pdfBytes = await convertPptxToPdf(file);
        } else {
            throw new Error(`Format non supporté pour conversion auto : ${fileType}`);
        }

        hideLoader();
        return pdfBytes;
    } catch (e) {
        hideLoader();
        showToast(`Erreur de conversion : ${e.message}`, 'error');
        throw e;
    }
}

async function convertImageToPdf(file) {
    const dataUrl = await readFileAsDataURL(file);
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const pdf = new window.jsPDF({
                orientation: img.width > img.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [img.width, img.height]
            });
            pdf.addImage(img, 'JPEG', 0, 0, img.width, img.height);
            resolve(pdf.output('arraybuffer'));
        };
        img.src = dataUrl;
    });
}

async function convertTextToPdf(file) {
    const text = await file.text();
    const pdf = new window.jsPDF();
    const margin = 10;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const maxLineWidth = pageWidth - margin * 2;

    const lines = pdf.splitTextToSize(text, maxLineWidth);
    let y = 10;

    for (let i = 0; i < lines.length; i++) {
        if (y > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            y = 10;
        }
        pdf.text(lines[i], margin, y);
        y += 7;
    }

    return pdf.output('arraybuffer');
}

async function convertWordToPdf(file) {
    if (!mammothLoaded) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        await ensureJsPdf();
        mammothLoaded = true;
    }

    const arrayBuffer = await readFileAsArrayBuffer(file);
    const result = await mammoth.convertToHtml({arrayBuffer: arrayBuffer});
    const html = result.value;

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.width = '210mm';
    container.style.padding = '20mm';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.background = 'white';
    container.style.color = 'black';
    container.style.fontFamily = 'Arial, sans-serif';
    document.body.appendChild(container);

    const canvas = await html2canvas(container, { scale: 2 });
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new window.jsPDF('p', 'mm', 'a4');

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
    }

    return pdf.output('arraybuffer');
}
async function ensureSheetJs() {
    if (sheetjsLoaded) return;
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.20.3/xlsx.full.min.js');
    sheetjsLoaded = true;
}

async function ensureJsZip() {
    if (jszipLoaded) return;
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    jszipLoaded = true;
}

async function convertExcelToPdf(file) {
    await ensureSheetJs();
    await ensureJsPdf();
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const html = XLSX.utils.sheet_to_html(worksheet);

    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.width = '297mm';
    container.style.padding = '20mm';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.background = 'white';
    container.style.color = 'black';
    container.style.fontFamily = 'Arial, sans-serif';

    const table = container.querySelector('table');
    if (table) {
        table.style.borderCollapse = 'collapse';
        table.style.width = '100%';
        const tds = table.querySelectorAll('td, th');
        tds.forEach(td => {
            td.style.border = '1px solid #ccc';
            td.style.padding = '5px';
        });
    }

    document.body.appendChild(container);

    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    const canvas = await html2canvas(container, { scale: 2 });
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new window.jsPDF('l', 'mm', 'a4');

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
    }

    return pdf.output('arraybuffer');
}

async function convertPptxToPdf(file) {
    await ensureJsZip();
    await ensureJsPdf();
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const zip = await JSZip.loadAsync(arrayBuffer);

    const pdf = new window.jsPDF('l', 'mm', 'a4');

    let slideIndex = 1;
    let firstSlide = true;

    while (true) {
        const slideFile = zip.file(`ppt/slides/slide${slideIndex}.xml`);
        if (!slideFile) break;

        const slideText = await slideFile.async('text');

        const textMatches = [...slideText.matchAll(/<a:t>([^<]+)<\/a:t>/g)];
        let textContent = textMatches.map(m => m[1]).join('\n\n');

        if (!firstSlide) {
            pdf.addPage();
        }
        firstSlide = false;

        pdf.setFontSize(16);
        const lines = pdf.splitTextToSize(`Slide ${slideIndex}\n\n${textContent}`, 270);
        pdf.text(lines, 10, 20);

        slideIndex++;
    }

    if (firstSlide) {
         pdf.text("Presentation vide ou format non supporté", 10, 20);
    }

    return pdf.output('arraybuffer');
}

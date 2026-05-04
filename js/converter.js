import { showToast, showLoader, updateProgress, hideLoader } from './ui.js';

export async function convertToPdf(file) {
  const type = file.type;
  const name = file.name.toLowerCase();

  showLoader(`Conversion de ${file.name}...`);
  updateProgress(10, 'Analyse du fichier...');

  try {
    if (name.endsWith('.docx') || name.endsWith('.doc')) {
      return await convertWord(file);
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
      return await convertExcel(file);
    } else if (type.startsWith('image/')) {
      return await convertImage(file);
    } else if (name.endsWith('.txt') || name.endsWith('.md')) {
      return await convertText(file);
    } else {
      throw new Error('Format non supporté pour la conversion automatique');
    }
  } catch (e) {
    hideLoader();
    showToast(`Échec de la conversion : ${e.message}`, 'error');
    throw e;
  }
}

async function convertWord(file) {
  if (typeof mammoth === 'undefined') throw new Error('Mammoth.js non chargé');

  updateProgress(40, 'Extraction du contenu Word...');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });

  return await htmlToPdf(result.value);
}

async function convertExcel(file) {
  if (typeof XLSX === 'undefined') throw new Error('SheetJS non chargé');

  updateProgress(40, 'Lecture du tableur...');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  let html = '<html><head><style>table {border-collapse: collapse; width: 100%;} th, td {border: 1px solid #ddd; padding: 8px; text-align: left;} th {background-color: #f2f2f2;}</style></head><body>';

  workbook.SheetNames.forEach(sheetName => {
    html += `<h2>${sheetName}</h2>`;
    const worksheet = workbook.Sheets[sheetName];
    html += XLSX.utils.sheet_to_html(worksheet);
  });

  html += '</body></html>';
  return await htmlToPdf(html, 'landscape');
}

async function convertImage(file) {
  updateProgress(50, 'Traitement de l\'image...');

  const img = new Image();
  const url = URL.createObjectURL(file);

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });

  updateProgress(80, 'Génération du PDF...');

  const pdfDoc = await PDFLib.PDFDocument.create();

  let pdfImage;
  const arrayBuffer = await file.arrayBuffer();

  if (file.type === 'image/png') {
    pdfImage = await pdfDoc.embedPng(arrayBuffer);
  } else {
    pdfImage = await pdfDoc.embedJpg(arrayBuffer);
  }

  const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
  page.drawImage(pdfImage, {
    x: 0,
    y: 0,
    width: pdfImage.width,
    height: pdfImage.height,
  });

  URL.revokeObjectURL(url);
  updateProgress(100, 'Terminé');

  return await pdfDoc.save();
}

async function convertText(file) {
  updateProgress(40, 'Lecture du texte...');
  const text = await file.text();

  const doc = new jspdf.jsPDF();
  const margin = 15;
  const pageHeight = doc.internal.pageSize.height;

  doc.setFont('helvetica');
  doc.setFontSize(12);

  const lines = doc.splitTextToSize(text, doc.internal.pageSize.width - margin * 2);

  let cursorY = margin;

  updateProgress(70, 'Génération des pages...');

  lines.forEach(line => {
    if (cursorY > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
    doc.text(line, margin, cursorY);
    cursorY += 6;
  });

  updateProgress(100, 'Terminé');
  return doc.output('arraybuffer');
}

async function htmlToPdf(htmlString, orientation = 'portrait') {
  updateProgress(60, 'Rendu HTML...');

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = orientation === 'portrait' ? '794px' : '1123px';
  container.style.backgroundColor = 'white';
  container.style.color = 'black';
  container.style.padding = '40px';
  container.style.fontFamily = 'Helvetica, Arial, sans-serif';
  container.innerHTML = htmlString;

  document.body.appendChild(container);

  updateProgress(80, 'Conversion en document PDF...');

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    const pdf = new jspdf.jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

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

    updateProgress(100, 'Terminé');
    return pdf.output('arraybuffer');
  } catch (e) {
    if (document.body.contains(container)) document.body.removeChild(container);
    throw e;
  }
}

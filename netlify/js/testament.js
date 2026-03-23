// netlify/js/testament.js

let testamentKey = sessionStorage.getItem('testamentKey');
let testamentUrgKey = sessionStorage.getItem('testamentUrgKey');
let appData = null;
let testamentData = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!testamentKey || !testamentUrgKey) {
        window.location.href = 'index.html';
        return;
    }

    setupAutoLock(15);

    document.getElementById('btn-logout').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

    try {
        appData = await loadData();
        testamentData = decryptData(appData.testamentData, testamentKey);

        if (!testamentData) {
            throw new Error("Impossible de déchiffrer le testament");
        }

        document.getElementById('loader').classList.add('hidden');
        document.getElementById('testament-content').classList.remove('hidden');

        renderTestament();

    } catch (e) {
        showToast("Erreur d'accès aux données", "error");
        console.error(e);
        setTimeout(() => {
            sessionStorage.clear();
            window.location.href = 'index.html';
        }, 2000);
    }
});

function renderTestament() {
    const iden = testamentData.identity || {};

    // Formatting date
    let dateStr = "___";
    if(iden.dateNaissance) {
        const [y,m,d] = iden.dateNaissance.split('-');
        dateStr = `${d}/${m}/${y}`;
    }

    document.getElementById('testament-identity').innerHTML = `
        <p class="m-0 mb-2">Je soussigné(e) <strong style="color:white;">${escapeHtml(iden.prenom || '___')} ${escapeHtml(iden.nom || '___')}</strong>,</p>
        <p class="m-0 mb-2">né(e) le <strong style="color:white;">${dateStr}</strong> à <strong style="color:white;">${escapeHtml(iden.lieuNaissance || '___')}</strong>,</p>
        <p class="m-0 mb-2">de nationalité <strong style="color:white;">${escapeHtml(iden.nationalite || '___')}</strong>,</p>
        <p class="m-0">demeurant <strong style="color:white;">${escapeHtml(iden.adresse || '___')}</strong>,</p>
    `;

    document.getElementById('testament-body').innerHTML = DOMPurify.sanitize(testamentData.content || '<p class="italic text-muted">Testament vide.</p>');

    const modifDate = testamentData.lastModified ? formatDateFR(testamentData.lastModified) : "Inconnue";
    document.getElementById('testament-date').textContent = `Rédigé et mis à jour le ${modifDate}`;

    document.getElementById('btn-export').addEventListener('click', exportTestamentPDF);
}

function exportTestamentPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margins = { top: 20, bottom: 20, left: 20, right: 20 };
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = margins.top;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("TESTAMENT — DERNIÈRES VOLONTÉS", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Identity
    const iden = testamentData.identity || {};
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    let dateStr = "___";
    if(iden.dateNaissance) {
        const [y,m,d] = iden.dateNaissance.split('-');
        dateStr = `${d}/${m}/${y}`;
    }

    const identityText = `Je soussigné(e) ${iden.prenom || '___'} ${iden.nom || '___'},\nné(e) le ${dateStr} à ${iden.lieuNaissance || '___'},\nde nationalité ${iden.nationalite || '___'},\ndemeurant ${iden.adresse || '___'},`;

    const splitIdentity = doc.splitTextToSize(identityText, pageWidth - margins.left - margins.right);
    doc.text(splitIdentity, margins.left, yPos);
    yPos += (splitIdentity.length * 7) + 10;

    // Date modif
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    const modifDate = testamentData.lastModified ? formatDateFR(testamentData.lastModified) : "Inconnue";
    doc.text(`Rédigé et mis à jour le ${modifDate}`, margins.left, yPos);
    yPos += 15;

    // Content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    // Extract text from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = testamentData.content;
    const textContent = tempDiv.innerText || tempDiv.textContent;

    const splitContent = doc.splitTextToSize(textContent, pageWidth - margins.left - margins.right);

    for (let i = 0; i < splitContent.length; i++) {
        if (yPos > doc.internal.pageSize.getHeight() - margins.bottom - 10) {
            doc.addPage();
            yPos = margins.top;
        }
        doc.text(splitContent[i], margins.left, yPos);
        yPos += 7;
    }

    // Footer
    const today = new Date();
    const printDate = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text(`Document généré le ${printDate}`, margins.left, doc.internal.pageSize.getHeight() - 10);

    doc.save(`Testament_${iden.nom || 'Document'}.pdf`);
}

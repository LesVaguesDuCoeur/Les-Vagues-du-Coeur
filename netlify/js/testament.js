document.addEventListener('DOMContentLoaded', async () => {
    const testamentKey = sessionStorage.getItem('testamentKey');

    if (!testamentKey) {
        window.location.href = 'index.html';
        return;
    }

    setupAutoLock(15); // 15 minutes auto lock

    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

    try {
        const data = await api.load();

        let testamentData = { content: '', lastModified: null };
        if (data.testamentData) {
            testamentData = decryptData(data.testamentData, testamentKey) || testamentData;
        }

        const contentContainer = document.getElementById('testamentContent');

        if (testamentData.identity && Object.keys(testamentData.identity).length > 0) {
            const etatCivilContainer = document.getElementById('etatCivilContainer');
            const etatCivilContent = document.getElementById('etatCivilContent');
            etatCivilContainer.classList.remove('hidden');

            const id = testamentData.identity;
            etatCivilContent.innerHTML = `
                <div><strong>Nom :</strong> ${escapeHTML(id.nom || 'Non renseigné')}</div>
                <div><strong>Prénom :</strong> ${escapeHTML(id.prenom || 'Non renseigné')}</div>
                <div><strong>Date de naissance :</strong> ${escapeHTML(id.date_naissance || 'Non renseignée')}</div>
                <div><strong>Lieu de naissance :</strong> ${escapeHTML(id.lieu_naissance || 'Non renseigné')}</div>
                <div><strong>Nationalité :</strong> ${escapeHTML(id.nationalite || 'Non renseignée')}</div>
                <div><strong>Adresse :</strong> ${escapeHTML(id.adresse || 'Non renseignée')}</div>
            `;
        }

        if (testamentData.content) {
            contentContainer.innerHTML = testamentData.content;
            if (testamentData.lastModified) {
                const dateEl = document.createElement('div');
                dateEl.className = 'text-sm text-muted mt-6 text-right';
                dateEl.innerText = `Dernière mise à jour : ${formatDateFR(testamentData.lastModified)}`;
                contentContainer.appendChild(dateEl);
            }
        } else {
            contentContainer.innerHTML = `<div class="text-center text-muted italic p-8">Aucun testament rédigé.</div>`;
        }

        document.getElementById('exportExternalTestamentBtn').addEventListener('click', () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.text("TESTAMENT — DERNIÈRES VOLONTÉS", 105, 20, null, null, "center");

            let y = 35;
            doc.setFontSize(12);

            if (testamentData.identity && Object.keys(testamentData.identity).length > 0) {
                const id = testamentData.identity;
                doc.setFont("helvetica", "bold");
                doc.text("État civil :", 20, y);
                doc.setFont("helvetica", "normal");
                y += 6;
                doc.text(`Nom : ${id.nom || 'Non renseigné'}`, 25, y); y += 6;
                doc.text(`Prénom : ${id.prenom || 'Non renseigné'}`, 25, y); y += 6;
                doc.text(`Date de naissance : ${id.date_naissance || 'Non renseignée'}`, 25, y); y += 6;
                doc.text(`Lieu de naissance : ${id.lieu_naissance || 'Non renseigné'}`, 25, y); y += 6;
                doc.text(`Nationalité : ${id.nationalite || 'Non renseignée'}`, 25, y); y += 6;
                doc.text(`Adresse : ${id.adresse || 'Non renseignée'}`, 25, y); y += 10;
            }

            if (testamentData.lastModified) {
                doc.setFont("helvetica", "italic");
                doc.text(`Rédigé et mis à jour le ${formatDateFR(testamentData.lastModified)}`, 20, y);
                y += 10;
            }

            doc.setFont("helvetica", "normal");
            // Basic HTML to plain text conversion for PDF
            let plainText = "";
            if (testamentData.content) {
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = testamentData.content;
                plainText = tempDiv.innerText || tempDiv.textContent || "";
            }

            const splitText = doc.splitTextToSize(plainText, 170);
            doc.text(splitText, 20, y);

            y += splitText.length * 6 + 10;

            const pageHeight = doc.internal.pageSize.getHeight();
            if (y > pageHeight - 20) {
                doc.addPage();
                y = 20;
            }

            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            doc.text(`Document généré le ${formatDateFR(new Date())}`, 105, pageHeight - 10, null, null, "center");

            doc.save("Testament_Personnel.pdf");
        });

    } catch (e) {
        showToast("Erreur de déchiffrement.", "error");
        setTimeout(() => {
            sessionStorage.clear();
            window.location.href = 'index.html';
        }, 2000);
    }
});
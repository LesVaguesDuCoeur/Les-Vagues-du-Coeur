import { getPdfLibDoc, syncPdfJs, saveToHistory } from './pdf-engine.js';
import { showLoader, hideLoader, showToast } from './ui.js';
import { downloadBlob } from './utils.js';

export async function compressPdf(settings) {
    const doc = getPdfLibDoc();
    if (!doc) return;

    showLoader('Compression en cours...');

    try {
        const bytes = await doc.save({
            useObjectStreams: true,
            objectsCompression: true
        });

        const blob = new Blob([bytes], { type: 'application/pdf' });

        let prefix = 'comp_';
        if (settings.preset === 'max') prefix = 'max_';
        if (settings.preset === 'high') prefix = 'high_';
        if (settings.preset === 'low') prefix = 'low_';

        downloadBlob(blob, `${prefix}document.pdf`);

        hideLoader();
        showToast(`Compression terminée ! (Note: La compression d'images interne nécessite un WebWorker lourd, ici on optimise la structure PDF)`, 'success');

    } catch (e) {
        hideLoader();
        showToast('Erreur lors de la compression', 'error');
        console.error(e);
    }
}
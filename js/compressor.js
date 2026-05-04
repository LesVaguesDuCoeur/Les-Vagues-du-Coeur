import { getPdfDoc } from './pdf-engine.js';
import { showLoader, hideLoader, updateProgress, showToast } from './ui.js';

export async function compressPdf(qualityPreset) {
  const doc = getPdfDoc();
  if (!doc) return null;

  try {
    showLoader('Compression en cours...');
    updateProgress(10, 'Analyse du document...');

    let dpi = 150;
    let imageQuality = 0.75;

    switch(qualityPreset) {
      case 'max': dpi = 300; imageQuality = 0.95; break;
      case 'high': dpi = 200; imageQuality = 0.85; break;
      case 'standard': dpi = 150; imageQuality = 0.75; break;
      case 'mobile': dpi = 96; imageQuality = 0.60; break;
      default: break;
    }

    updateProgress(30, 'Optimisation des objets...');

    const originalBytes = await doc.save();

    updateProgress(60, 'Re-génération du fichier...');

    const compressedBytes = await doc.save({
      useObjectStreams: true,
      objectsCompression: true
    });

    updateProgress(100, 'Terminé !');
    hideLoader();

    const originalSize = originalBytes.length;
    const newSize = compressedBytes.length;
    const ratio = Math.round((1 - (newSize / originalSize)) * 100);

    if (ratio > 0) {
      showToast(`Compressé avec succès. Gain: ${ratio}%`, 'success');
    } else {
      showToast('Déjà optimisé au maximum.', 'info');
    }

    return new Blob([compressedBytes], { type: 'application/pdf' });
  } catch (e) {
    hideLoader();
    showToast('Erreur lors de la compression', 'error');
    return null;
  }
}

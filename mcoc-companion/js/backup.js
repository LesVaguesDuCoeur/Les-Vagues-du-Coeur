// Backup System Module

const BackupSystem = {
    // Keys used in LocalStorage
    STORAGE_KEYS: [
        'mcoc_roster',
        'mcoc_resources',
        'mcoc_teams',
        'mcoc_mastery',
        'mcoc_quests',
        'mcoc_settings'
    ],

    // Export Data to JSON file
    exportData: function() {
        const data = {};

        // Gather data from LocalStorage
        this.STORAGE_KEYS.forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                try {
                    data[key] = JSON.parse(item);
                } catch (e) {
                    console.error(`Error parsing ${key}`, e);
                    data[key] = null;
                }
            }
        });

        // Add metadata
        data.meta = {
            version: '1.0',
            date: new Date().toISOString(),
            app: 'MCOC Companion'
        };

        // Create Blob and Download
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `mcoc-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        app.showToast('Sauvegarde exportée avec succès !', 'success');
    },

    // Import Data from JSON file
    importData: function(inputElement) {
        const file = inputElement.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);

                // Basic Validation
                if (!data.meta || data.meta.app !== 'MCOC Companion') {
                    throw new Error("Fichier de sauvegarde invalide.");
                }

                if (!confirm("Attention : L'importation va écraser toutes vos données actuelles. Continuer ?")) {
                    inputElement.value = ''; // Reset input
                    return;
                }

                // Restore Data
                BackupSystem.STORAGE_KEYS.forEach(key => {
                    if (data[key]) {
                        localStorage.setItem(key, JSON.stringify(data[key]));
                    } else {
                        localStorage.removeItem(key); // Remove if not in backup
                    }
                });

                app.showToast('Données restaurées avec succès ! Rechargement...', 'success');
                setTimeout(() => location.reload(), 1500);

            } catch (err) {
                console.error(err);
                app.showToast('Erreur lors de l\'importation : ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
    },

    // Reset All Data
    resetData: function() {
        if (confirm("Êtes-vous sûr de vouloir tout effacer ? Cette action est irréversible.")) {
            if (confirm("Vraiment sûr ?")) {
                localStorage.clear();
                location.reload();
            }
        }
    }
};

// Global access
window.app = window.app || {};
window.app.backup = BackupSystem;

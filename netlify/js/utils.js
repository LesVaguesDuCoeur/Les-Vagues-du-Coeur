const escapeHTML = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Récupérer IP + GPS + user agent pour les alertes
async function getClientInfo() {
    const info = {
        ip: 'Inconnue',
        userAgent: navigator.userAgent,
        lat: null,
        lng: null
    };

    try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        info.ip = ipData.ip;
    } catch (e) {
        console.error('Erreur récupération IP:', e);
    }

    return new Promise(resolve => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    info.lat = pos.coords.latitude;
                    info.lng = pos.coords.longitude;
                    resolve(info);
                },
                err => {
                    resolve(info);
                },
                { timeout: 3000 }
            );
        } else {
            resolve(info);
        }
    });
}

// Timer d'inactivité avec warning
function setupAutoLock(minutes, warningCallback) {
    let timeoutId;
    let warningTimeoutId;

    function resetTimer() {
        clearTimeout(timeoutId);
        clearTimeout(warningTimeoutId);

        const msTotal = minutes * 60 * 1000;
        const msWarning = msTotal - 60000;

        if (msWarning > 0) {
            warningTimeoutId = setTimeout(() => {
                if (warningCallback) {
                    warningCallback();
                } else {
                    showToast("Session expire dans 60s...", "warning");
                }
            }, msWarning);
        }

        timeoutId = setTimeout(() => {
            sessionStorage.clear();
            window.location.href = 'index.html';
        }, msTotal);
    }

    ['mousemove', 'keydown', 'scroll', 'click'].forEach(evt => {
        document.addEventListener(evt, resetTimer);
    });

    resetTimer();
}

// Modale dynamique
function openModal(htmlContent) {
    let container = document.getElementById('modalContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'modalContainer';
        document.body.appendChild(container);
    }
    container.innerHTML = `
        <div class="custom-modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div class="custom-modal-dialog" style="background: var(--bg-element-solid, #12121a); padding: 2rem; border-radius: var(--border-radius, 8px); max-width: 600px; width: 100%; position: relative;">
                <button class="modal-close" onclick="closeModal()" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: white; cursor: pointer; font-size: 1.5rem;">&times;</button>
                ${htmlContent}
            </div>
        </div>
    `;

    // Close on overlay click
    const overlay = container.querySelector('.custom-modal-overlay');
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    });
}

function closeModal() {
    const container = document.getElementById('modalContainer');
    if (container) {
        container.innerHTML = '';
    }
}

// Dialogue de confirmation stylé
function confirmDialog(message) {
    return new Promise((resolve) => {
        let container = document.getElementById('modalContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'modalContainer';
            document.body.appendChild(container);
        }

        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';
        overlay.style = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000;';

        const dialog = document.createElement('div');
        dialog.className = 'custom-modal-dialog';
        dialog.style = 'background: var(--bg-element-solid, #12121a); padding: 2rem; border-radius: var(--border-radius, 8px); max-width: 400px; width: 100%; text-align: center;';

        const content = document.createElement('div');
        content.className = 'custom-modal-content mb-4';
        content.innerText = message;

        const btnContainer = document.createElement('div');
        btnContainer.className = 'custom-modal-actions flex justify-center gap-4 mt-4';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.innerText = 'Annuler';
        cancelBtn.onclick = () => {
            container.removeChild(overlay);
            resolve(false);
        };

        const okBtn = document.createElement('button');
        okBtn.className = 'btn btn-danger';
        okBtn.innerText = 'Confirmer';
        okBtn.onclick = () => {
            container.removeChild(overlay);
            resolve(true);
        };

        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(okBtn);
        dialog.appendChild(content);
        dialog.appendChild(btnContainer);
        overlay.appendChild(dialog);
        container.appendChild(overlay);
    });
}

// Format date FR
function formatDateFR(dateInput) {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} à ${hours}h${minutes}`;
}

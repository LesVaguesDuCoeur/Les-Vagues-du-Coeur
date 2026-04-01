// netlify/js/utils.js

function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const colors = {
        'info': '#457b9d',
        'success': '#06d6a0',
        'error': '#e63946',
        'warning': '#fca311'
    };

    toast.style.cssText = `
        background: ${colors[type] || colors.info};
        color: #fff;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        font-family: 'Inter', sans-serif;
        font-size: 0.9rem;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
    `;
    toast.textContent = message;

    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    // Remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function getClientInfo() {
    let info = { ip: 'Inconnue', userAgent: navigator.userAgent, lat: null, lng: null };
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        info.ip = data.ip;
    } catch(e) {}

    return new Promise(resolve => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    info.lat = pos.coords.latitude;
                    info.lng = pos.coords.longitude;
                    resolve(info);
                },
                () => resolve(info),
                { timeout: 5000 }
            );
        } else {
            resolve(info);
        }
    });
}

function setupAutoLock(minutes) {
    let timeout;
    let warningTimeout;

    const resetTimer = () => {
        clearTimeout(timeout);
        clearTimeout(warningTimeout);

        const ms = minutes * 60 * 1000;
        warningTimeout = setTimeout(() => {
            showToast("Déconnexion automatique dans 1 minute", "warning");
        }, ms - 60000);

        timeout = setTimeout(() => {
            sessionStorage.clear();
            window.location.href = 'index.html';
        }, ms);
    };

    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetTimer);
    });

    resetTimer();
}

function openModal(htmlContent) {
    let overlay = document.getElementById('modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);

        // Close on clicking overlay bg
        overlay.addEventListener('click', (e) => {
            if(e.target === overlay) closeModal();
        });
    }

    overlay.innerHTML = `<div class="modal-dialog">${htmlContent}</div>`;
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent body scroll
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.innerHTML = '';
        document.body.style.overflow = '';
    }
}

function confirmDialog(message) {
    return new Promise(resolve => {
        const html = `
            <div style="text-align: center;">
                <h3 class="font-bold mb-4" style="color: var(--text);">${message}</h3>
                <div class="flex gap-4 justify-center mt-6">
                    <button id="btn-cancel" class="action-btn" style="width:100px; padding:10px;">Annuler</button>
                    <button id="btn-confirm" class="action-btn" style="width:100px; padding:10px; background:var(--danger); color:#fff;">Confirmer</button>
                </div>
            </div>
        `;
        openModal(html);

        document.getElementById('btn-cancel').onclick = () => {
            closeModal();
            resolve(false);
        };
        document.getElementById('btn-confirm').onclick = () => {
            closeModal();
            resolve(true);
        };
    });
}

function formatDateFR(dateString) {
    if(!dateString) return "";
    const date = new Date(dateString);
    if(isNaN(date.getTime())) return "";
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const HH = String(date.getHours()).padStart(2, '0');
    const MM = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} à ${HH}h${MM}`;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast("Copié !", "success");
    }).catch(() => {
        showToast("Erreur de copie", "error");
    });
}

function toggleVisibility(btn, fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    const icon = btn.querySelector('i');
    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Pour échapper le HTML
function escapeHtml(unsafe) {
    if(!unsafe) return "";
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

const API_URL = 'https://script.google.com/macros/s/AKfycbxYb9MYC8yySuT64ecUtBczMWATJTGk5eIXreKhM09MK4ZzMJOhxy1YQ1n-eQ7FN580/exec';

const api = {
    // Basic request wrapping fetch POST (since GAS needs POST as plain text)
    async _request(payload) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!data.success && data.error) {
                console.error("API Error:", data.error);
            }
            return data;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    },

    async load() {
        try {
            const response = await fetch(API_URL);
            return await response.json();
        } catch (error) {
            console.error('Load error:', error);
            throw error;
        }
    },

    async save(data) {
        return this._request({ action: 'save', data: data });
    },

    async setup(data) {
        return this._request({ action: 'setup', data: data });
    },

    async emergencyAccess(details) {
        return this._request({ action: 'emergencyAccess', ...details });
    },

    async suspiciousActivity(details) {
        return this._request({ action: 'suspiciousActivity', ...details });
    },

    async accessSpace(details) {
        return this._request(details); // Needs vaultAccess: true or testamentAccess: true inside details
    },

    async panicAlert(details) {
        return this._request({ action: 'panicAlert', ...details });
    }
};

// UI Helpers (replaces native window.alert/confirm/prompt)
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

function showAlert(message) {
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'custom-modal-dialog';

    const content = document.createElement('div');
    content.className = 'custom-modal-content';
    content.innerText = message;

    const btnContainer = document.createElement('div');
    btnContainer.className = 'custom-modal-actions';

    const okBtn = document.createElement('button');
    okBtn.className = 'btn btn-primary';
    okBtn.innerText = 'OK';
    okBtn.onclick = () => {
        overlay.remove();
    };

    btnContainer.appendChild(okBtn);
    dialog.appendChild(content);
    dialog.appendChild(btnContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
}

function showConfirm(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'custom-modal-dialog';

    const content = document.createElement('div');
    content.className = 'custom-modal-content';
    content.innerText = message;

    const btnContainer = document.createElement('div');
    btnContainer.className = 'custom-modal-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.innerText = 'Annuler';
    cancelBtn.onclick = () => {
        overlay.remove();
    };

    const okBtn = document.createElement('button');
    okBtn.className = 'btn btn-danger';
    okBtn.innerText = 'Confirmer';
    okBtn.onclick = () => {
        overlay.remove();
        if (onConfirm) onConfirm();
    };

    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(okBtn);
    dialog.appendChild(content);
    dialog.appendChild(btnContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
}

function showPrompt(message, type, onConfirm) {
     const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'custom-modal-dialog';

    const content = document.createElement('div');
    content.className = 'custom-modal-content';
    content.innerText = message;

    const input = document.createElement('input');
    input.type = type;
    input.className = 'custom-modal-input';

    const btnContainer = document.createElement('div');
    btnContainer.className = 'custom-modal-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.innerText = 'Annuler';
    cancelBtn.onclick = () => {
        overlay.remove();
    };

    const okBtn = document.createElement('button');
    okBtn.className = 'btn btn-primary';
    okBtn.innerText = 'Valider';
    okBtn.onclick = () => {
        overlay.remove();
        if (onConfirm) onConfirm(input.value);
    };

    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(okBtn);
    dialog.appendChild(content);
    dialog.appendChild(input);
    dialog.appendChild(btnContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
}

// Session & Auto-lock helper
function setupAutoLock(minutes) {
    let timeoutId;

    function resetTimer() {
        clearTimeout(timeoutId);
        // Start warning 1 minute before
        const msUntilWarning = (minutes * 60 * 1000) - 60000;
        if(msUntilWarning > 0) {
            timeoutId = setTimeout(() => {
                showToast("Session expire dans 60s...", "warning");
                timeoutId = setTimeout(logout, 60000);
            }, msUntilWarning);
        } else {
             timeoutId = setTimeout(logout, minutes * 60 * 1000);
        }
    }

    function logout() {
        sessionStorage.clear();
        window.location.href = 'index.html';
    }

    document.addEventListener('mousemove', resetTimer);
    document.addEventListener('keypress', resetTimer);
    document.addEventListener('click', resetTimer);
    document.addEventListener('scroll', resetTimer);

    resetTimer();
}

// Collect geo tracking details silently
async function getTrackingDetails() {
    const details = {
        userAgent: navigator.userAgent,
        ip: "Inconnue",
        lat: null,
        lng: null
    };

    try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        details.ip = ipData.ip;
    } catch(e) {}

    // Attempt to get GPS silently
    return new Promise(resolve => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    details.lat = pos.coords.latitude;
                    details.lng = pos.coords.longitude;
                    resolve(details);
                },
                err => {
                    resolve(details);
                },
                { timeout: 3000 }
            );
        } else {
            resolve(details);
        }
    });
}

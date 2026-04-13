function showToast(message, type = 'info') {
let container = document.getElementById('toast-container');
if (!container) {
container = document.createElement('div');
container.id = 'toast-container';
document.body.appendChild(container);
}
const toast = document.createElement('div');
toast.className = `toast ${type}`;
toast.innerText = message;
container.appendChild(toast);
setTimeout(() => {
toast.remove();
if (container.childNodes.length === 0) container.remove();
}, 3000);
}

async function getClientInfo() {
let ip = "?";
let lat = null;
let lng = null;
const userAgent = navigator.userAgent;
try {
const res = await fetch("https://api.ipify.org?format=json");
if (res.ok) {
const data = await res.json();
ip = data.ip || "?";
}
} catch (e) {}
try {
const pos = await new Promise((resolve, reject) => {
navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
});
lat = pos.coords.latitude;
lng = pos.coords.longitude;
} catch (e) {}
return { ip, userAgent, lat, lng };
}

async function sendAlertThenRedirect(logType, url, extra = {}) {
try {
const info = await getClientInfo();
const payload = { logType, ip: info.ip, userAgent: info.userAgent, lat: info.lat, lng: info.lng, ...extra };
if (logType === "Tentative suspecte") {
payload.suspiciousActivity = true;
} else if (logType === "Panique") {
payload.panicAlert = true;
} else {
payload.logAccess = true;
}
await postToApi(payload);
if (url) {
window.location.href = url;
}
} catch (e) {
showToast("Erreur lors de l'envoi de l'alerte", "error");
if (url) {
window.location.href = url;
}
}
}

function setupAutoLock(minutes) {
let timeout;
function resetTimer() {
clearTimeout(timeout);
timeout = setTimeout(() => {
sessionStorage.clear();
window.location.href = "index.html";
}, minutes * 60 * 1000);
}
document.addEventListener("mousemove", resetTimer);
document.addEventListener("keydown", resetTimer);
document.addEventListener("click", resetTimer);
document.addEventListener("touchstart", resetTimer);
resetTimer();
}

let currentModal = null;

function openModal(htmlContent) {
closeModal();
currentModal = document.createElement("div");
currentModal.className = "modal-overlay";
const dialog = document.createElement("div");
dialog.className = "modal-dialog";
dialog.innerHTML = htmlContent;
currentModal.appendChild(dialog);
document.body.appendChild(currentModal);
}

function closeModal() {
if (currentModal) {
currentModal.remove();
currentModal = null;
}
}

function confirmDialog(message) {
return new Promise((resolve) => {
openModal(`
<h3>Confirmation</h3>
<p>${escapeHtml(message)}</p>
<div class="modal-actions">
<button type="button" class="btn-secondary" id="confirm-no">Annuler</button>
<button type="button" class="btn-primary" id="confirm-yes">Confirmer</button>
</div>
`);
document.getElementById("confirm-yes").addEventListener("click", () => { closeModal(); resolve(true); });
document.getElementById("confirm-no").addEventListener("click", () => { closeModal(); resolve(false); });
});
}

function formatDateFR(dateStr) {
if (!dateStr) return "-";
const d = new Date(dateStr);
if (isNaN(d.getTime())) return dateStr;
return ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear() + " à " + ("0" + d.getHours()).slice(-2) + "h" + ("0" + d.getMinutes()).slice(-2);
}

function copyToClipboard(text) {
if (!text) return;
navigator.clipboard.writeText(text).then(() => {
showToast("Copié !", "success");
}).catch(() => {
showToast("Erreur de copie", "error");
});
}

function toggleVisibility(button, fieldId) {
const field = document.getElementById(fieldId);
if (!field) return;
const icon = button.querySelector("i");
if (field.type === "password") {
field.type = "text";
icon.classList.remove("fa-eye");
icon.classList.add("fa-eye-slash");
} else {
field.type = "password";
icon.classList.remove("fa-eye-slash");
icon.classList.add("fa-eye");
}
}

function escapeHtml(str) {
if (!str) return "";
return String(str).replace(/[&<>"']/g, function(m) {
return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
});
}

function generateId() {
return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
return v.toString(16);
});
}
let emergencyContacts = [];

document.addEventListener("DOMContentLoaded", async () => {
const key = sessionStorage.getItem("_key");
const page = sessionStorage.getItem("_page");

if (!key || page !== "emergency") {
window.location.href = "index.html";
return;
}

setupAutoLock(10);

document.getElementById("btn-logout").addEventListener("click", () => {
sessionStorage.clear();
window.location.href = "index.html";
});

document.getElementById("btn-panic").addEventListener("click", async () => {
if (await confirmDialog("Déclencher l'alerte panique ?")) {
await sendAlertThenRedirect("Panique", null);
showToast("Alerte panique envoyée", "success");
}
});

try {
const data = await loadData();
if (!data || !data.config) throw new Error("Données introuvables");

const config = data.config;
if (hashPassword(key) !== config.emergencyHash) throw new Error("Accès refusé");

if (config.emergencyMessageForEmergency) {
const msg = decryptData(config.emergencyMessageForEmergency, key);
if (msg) {
document.getElementById("emergency-message-text").innerText = msg;
document.getElementById("emergency-message-container").classList.remove("hidden");
}
}

let contactsData = data.contacts?.emergencyContacts;

if (contactsData) {
let obj = decryptData(contactsData, key);
if (obj) {
emergencyContacts = obj;
}
}

renderContacts();
document.getElementById("loading-overlay").classList.add("hidden");

} catch (e) {
showToast("Erreur de chargement", "error");
setTimeout(() => { window.location.href = "index.html"; }, 1500);
}
});

function renderContacts() {
const list = document.getElementById("contacts-list");
list.innerHTML = "";
const query = document.getElementById("search-contacts").value.toLowerCase();
let filtered = emergencyContacts.filter(c => c.nom.toLowerCase().includes(query));

filtered.sort((a, b) => {
const impA = parseInt(a.importance) || 3;
const impB = parseInt(b.importance) || 3;
if (impA !== impB) return impA - impB;
const aHasCode = (a.accessCodes && a.accessCodes.length > 0) ? 1 : 0;
const bHasCode = (b.accessCodes && b.accessCodes.length > 0) ? 1 : 0;
if (aHasCode !== bHasCode) return bHasCode - aHasCode;
return (a.nom || "").localeCompare(b.nom || "");
});

filtered.forEach(c => {
const card = document.createElement("div");
card.className = "card card-contact";
card.setAttribute("data-importance", c.importance || "3");

let badges = "";
if (c.accessCodes && c.accessCodes.includes("vault")) badges += `<span class="badge-vault">MDP Vault</span>`;
if (c.accessCodes && c.accessCodes.includes("testament")) badges += `<span class="badge-testament">MDP Testament</span>`;

let links = "";
if (c.tel) links += `<a href="tel:${c.tel}" class="link-icon link-phone"><i class="fas fa-phone"></i></a>`;
if (c.email) links += `<a href="mailto:${c.email}" class="link-icon link-email"><i class="fas fa-envelope"></i></a>`;
if (c.whatsapp) links += `<a href="https://wa.me/${c.whatsapp}" class="link-icon link-whatsapp" target="_blank"><i class="fab fa-whatsapp"></i></a>`;
if (c.telegram) links += `<a href="https://t.me/${c.telegram}" class="link-icon link-telegram" target="_blank"><i class="fab fa-telegram"></i></a>`;
if (c.snapchat) links += `<a href="https://www.snapchat.com/add/${c.snapchat}" class="link-icon link-snap" target="_blank"><i class="fab fa-snapchat-ghost"></i></a>`;
if (c.instagram) links += `<a href="https://www.instagram.com/${c.instagram}" class="link-icon link-insta" target="_blank"><i class="fab fa-instagram"></i></a>`;
if (c.messenger) links += `<a href="https://m.me/${c.messenger}" class="link-icon link-messenger" target="_blank"><i class="fab fa-facebook-messenger"></i></a>`;

card.innerHTML = `
<div class="contact-header">
<div class="contact-name">${escapeHtml(c.nom)} <span class="contact-relation">${escapeHtml(c.relation)}</span> ${badges}</div>
</div>
${c.notes ? `<div class="contact-notes">${escapeHtml(c.notes)}</div>` : ''}
<div class="contact-links">${links}</div>
`;
list.appendChild(card);
});
}

document.getElementById("search-contacts").addEventListener("input", renderContacts);
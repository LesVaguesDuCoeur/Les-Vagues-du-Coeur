let vaultItems = [];
let protectedVaultItems = [];
let currentVaultCat = "etat-civil";

const VAULT_CATEGORIES = [
{ id: "etat-civil", icon: "fa-user", name: "État civil / Mon identité" },
{ id: "identifiants", icon: "fa-key", name: "Identifiants & MDP" },
{ id: "cb", icon: "fa-credit-card", name: "Cartes bancaires" },
{ id: "documents", icon: "fa-id-card", name: "Documents" },
{ id: "comptes", icon: "fa-university", name: "Comptes bancaires" },
{ id: "codes", icon: "fa-lock", name: "Codes & PIN" },
{ id: "medical", icon: "fa-heartbeat", name: "Infos médicales" },
{ id: "assurances", icon: "fa-shield-alt", name: "Assurances" },
{ id: "licences", icon: "fa-barcode", name: "Licences & Clés" },
{ id: "notes", icon: "fa-sticky-note", name: "Notes libres" }
];

document.addEventListener("DOMContentLoaded", async () => {
const key = sessionStorage.getItem("_key");
const page = sessionStorage.getItem("_page");

if (!key || page !== "vault") {
window.location.href = "index.html";
return;
}

setupAutoLock(15);

document.getElementById("btn-logout").addEventListener("click", () => {
sessionStorage.clear();
window.location.href = "index.html";
});

try {
const data = await loadData();
if (!data || !data.config) throw new Error("Données introuvables");

const config = data.config;
if (hashPassword(key) !== config.vaultHash) throw new Error("Accès refusé");

if (data.vault?.vaultData) {
let obj = decryptData(data.vault.vaultData, key);
if (obj) {
vaultItems = obj;
}
}

if (data.protectedVault?.protectedItems) {
protectedVaultItems = decryptData(data.protectedVault.protectedItems, key) || [];
}

renderVaultCategories();
document.getElementById("loading-overlay").classList.add("hidden");

} catch (e) {
showToast("Erreur de chargement", "error");
setTimeout(() => { window.location.href = "index.html"; }, 1500);
}
});

function renderVaultCategories() {
const sb = document.getElementById("vault-categories");
sb.innerHTML = "";
VAULT_CATEGORIES.forEach(cat => {
const itemsCount = vaultItems.filter(i => i.category === cat.id).length + protectedVaultItems.filter(i => i.category === cat.id).length;
const btn = document.createElement("button");
btn.className = `cat-btn ${cat.id === currentVaultCat ? 'active' : ''}`;
btn.innerHTML = `<span><i class="fas ${cat.icon}"></i> ${cat.name}</span> <span style="font-size:0.8rem; color:#888;">${itemsCount}</span>`;
btn.onclick = () => { currentVaultCat = cat.id; renderVaultCategories(); renderVaultItems(); };
sb.appendChild(btn);
});
renderVaultItems();
}

function renderVaultItems() {
const catDef = VAULT_CATEGORIES.find(c => c.id === currentVaultCat);
document.getElementById("current-vault-category-title").innerHTML = `<i class="fas ${catDef.icon}"></i> ${catDef.name}`;
const list = document.getElementById("vault-items-list");
list.innerHTML = "";

let items = vaultItems.filter(i => i.category === currentVaultCat);
let pItems = protectedVaultItems.filter(i => i.category === currentVaultCat);

items.forEach(item => {
const card = document.createElement("div");
card.className = "vault-item-card";
let fieldsHtml = "";
const keysToIgnore = ["id", "category"];
for (let key in item) {
if (keysToIgnore.includes(key)) continue;
let val = item[key];
let isMasked = key.toLowerCase().includes("mdp") || key.toLowerCase().includes("cvv") || key.toLowerCase().includes("pin") || key.toLowerCase().includes("code") || key.toLowerCase().includes("iban") || key.toLowerCase().includes("secu");
if (key === "numero" && currentVaultCat === "cb") {
fieldsHtml += `<div class="vault-field"><span class="vault-field-label">Numéro</span><span class="vault-field-value">**** **** **** ${val.slice(-4)}</span><div class="vault-field-actions"><button class="btn-icon" onclick="copyToClipboard('${escapeHtml(val)}')"><i class="fas fa-copy"></i></button></div></div>`;
continue;
}
let valHtml = isMasked ? `••••••••` : escapeHtml(val);
let actionsHtml = `<button class="btn-icon" onclick="copyToClipboard('${escapeHtml(val)}')"><i class="fas fa-copy"></i></button>`;
if (isMasked) {
actionsHtml = `<button class="btn-icon" onclick="this.parentElement.previousElementSibling.innerText='${escapeHtml(val)}'"><i class="fas fa-eye"></i></button>` + actionsHtml;
}
if (key === "url" && val) actionsHtml += `<a href="${val.startsWith('http') ? val : 'https://'+val}" target="_blank" class="btn-icon"><i class="fas fa-external-link-alt"></i></a>`;
fieldsHtml += `<div class="vault-field"><span class="vault-field-label">${escapeHtml(key)}</span><span class="vault-field-value">${valHtml}</span><div class="vault-field-actions">${actionsHtml}</div></div>`;
}

card.innerHTML = `<div class="vault-item-header"><strong>${escapeHtml(item.nom || item.service || item.banque || item.type || item.titre || catDef.name)}</strong></div>${fieldsHtml}`;
list.appendChild(card);
});

pItems.forEach(item => {
const card = document.createElement("div");
card.className = "vault-item-card";
card.innerHTML = `<div class="vault-item-header"><strong><i class="fas fa-lock" style="color:#fca311;"></i> ${escapeHtml(item.label)}</strong><div><button class="btn-icon" onclick="unlockProtectedItem('${item.id}', this)"><i class="fas fa-unlock"></i> Déverrouiller</button></div></div>`;
list.appendChild(card);
});
}

window.unlockProtectedItem = (id, btnElement) => {
openModal(`
<h3>Déverrouiller l'élément</h3>
<div class="input-group"><input type="password" id="p-unlock-code" placeholder="Mot de passe de l'élément"></div>
<div class="modal-actions">
<button class="btn-secondary" onclick="closeModal()">Annuler</button>
<button class="btn-primary" id="btn-unlock-p">Déverrouiller</button>
</div>
`);
document.getElementById("btn-unlock-p").addEventListener("click", () => {
const code = document.getElementById("p-unlock-code").value;
const item = protectedVaultItems.find(i => i.id === id);
if (!item) return;
const hash = hashPassword(code);
if (hash === item.protectedPasswordHash) {
const decrypted = decryptData(item.encryptedContent, code);
if (decrypted) {
closeModal();
showDecryptedItem(decrypted, btnElement.closest(".vault-item-card"), item.label);
} else {
showToast("Erreur de déchiffrement", "error");
}
} else {
showToast("Mot de passe incorrect", "error");
}
});
};

function showDecryptedItem(item, cardElement, label) {
let fieldsHtml = "";
const keysToIgnore = ["id", "category"];
for (let key in item) {
if (keysToIgnore.includes(key)) continue;
let val = item[key];
let isMasked = key.toLowerCase().includes("mdp") || key.toLowerCase().includes("cvv") || key.toLowerCase().includes("pin") || key.toLowerCase().includes("code") || key.toLowerCase().includes("iban") || key.toLowerCase().includes("secu");
if (key === "numero" && item.category === "cb") {
fieldsHtml += `<div class="vault-field"><span class="vault-field-label">Numéro</span><span class="vault-field-value">**** **** **** ${val.slice(-4)}</span><div class="vault-field-actions"><button class="btn-icon" onclick="copyToClipboard('${escapeHtml(val)}')"><i class="fas fa-copy"></i></button></div></div>`;
continue;
}
let valHtml = isMasked ? `••••••••` : escapeHtml(val);
let actionsHtml = `<button class="btn-icon" onclick="copyToClipboard('${escapeHtml(val)}')"><i class="fas fa-copy"></i></button>`;
if (isMasked) {
actionsHtml = `<button class="btn-icon" onclick="this.parentElement.previousElementSibling.innerText='${escapeHtml(val)}'"><i class="fas fa-eye"></i></button>` + actionsHtml;
}
if (key === "url" && val) actionsHtml += `<a href="${val.startsWith('http') ? val : 'https://'+val}" target="_blank" class="btn-icon"><i class="fas fa-external-link-alt"></i></a>`;
fieldsHtml += `<div class="vault-field"><span class="vault-field-label">${escapeHtml(key)}</span><span class="vault-field-value">${valHtml}</span><div class="vault-field-actions">${actionsHtml}</div></div>`;
}

cardElement.innerHTML = `<div class="vault-item-header"><strong><i class="fas fa-unlock" style="color:#06d6a0;"></i> ${escapeHtml(label)}</strong></div>${fieldsHtml}`;
}
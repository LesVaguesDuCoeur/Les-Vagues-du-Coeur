let globalData = null;
let adminCode = null;
let plainEmergency = null;
let plainVault = null;
let plainTestament = null;
let quill = null;
let quillInitialized = false;

document.addEventListener("DOMContentLoaded", async () => {
const key = sessionStorage.getItem("_key");
const page = sessionStorage.getItem("_page");
if (!key || page !== "admin") {
window.location.href = "index.html";
return;
}
setupAutoLock(30);

document.getElementById("btn-logout").addEventListener("click", () => {
sessionStorage.clear();
window.location.href = "index.html";
});

const navBtns = document.querySelectorAll(".nav-btn[data-tab]");
navBtns.forEach(btn => {
btn.addEventListener("click", () => {
navBtns.forEach(b => b.classList.remove("active"));
btn.classList.add("active");
document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
const tabId = btn.getAttribute("data-tab");
document.getElementById("tab-" + tabId).classList.add("active");
if (tabId === "testament" && !quillInitialized) {
initQuill();
quillInitialized = true;
}
});
});

try {
const data = await loadData();
if (!data || !data.config) throw new Error("Données introuvables");
const config = data.config;
if (hashPassword(key) !== config.adminHash) throw new Error("Accès refusé");
adminCode = key;

plainEmergency = decryptData(config.encryptedEmergencyPassword, adminCode);
plainVault = decryptData(config.encryptedVaultPassword, adminCode);
plainTestament = decryptData(config.encryptedTestamentPassword, adminCode);

globalData = {
config: config,
contacts: data.contacts?.contacts ? decryptData(data.contacts.contacts, adminCode) || [] : [],
vault: data.vault?.vaultData ? decryptData(data.vault.vaultData, plainVault) || [] : [],
protectedVault: data.protectedVault?.protectedItems ? decryptData(data.protectedVault.protectedItems, plainVault) || [] : [],
testament: data.testament?.testamentData ? decryptData(data.testament.testamentData, plainTestament) || {} : {}
};
renderAll();
document.getElementById("loading-overlay").classList.add("hidden");
} catch (e) {
showToast("Erreur de chargement", "error");
setTimeout(() => { window.location.href = "index.html"; }, 1500);
}
});

function renderAll() {
renderContacts();
renderVaultCategories();
renderTestament();
renderSettings();
renderActivity();
}

function sortContacts(contacts) {
return contacts.sort((a, b) => {
const impA = parseInt(a.importance) || 3;
const impB = parseInt(b.importance) || 3;
if (impA !== impB) return impA - impB;
const aHasCode = (a.accessCodes && a.accessCodes.length > 0) ? 1 : 0;
const bHasCode = (b.accessCodes && b.accessCodes.length > 0) ? 1 : 0;
if (aHasCode !== bHasCode) return bHasCode - aHasCode;
return (a.nom || "").localeCompare(b.nom || "");
});
}

function renderContacts() {
const list = document.getElementById("contacts-list");
list.innerHTML = "";
const query = document.getElementById("search-contacts")?.value.toLowerCase() || "";
let filtered = globalData.contacts.filter(c => c.nom.toLowerCase().includes(query));
filtered = sortContacts(filtered);
document.getElementById("contacts-count").innerText = `${filtered.length} contact(s)`;
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
<div class="contact-actions">
<button class="btn-icon" onclick="editContact('${c.id}')"><i class="fas fa-edit"></i></button>
<button class="btn-icon" style="color:#e63946;" onclick="deleteContact('${c.id}')"><i class="fas fa-trash"></i></button>
</div>
`;
list.appendChild(card);
});
}

document.getElementById("search-contacts").addEventListener("input", renderContacts);

const relationsList = ["Mère", "Père", "Frère", "Sœur", "Demi-frère", "Demi-sœur", "Grand-père", "Grand-mère", "Oncle", "Tante", "Cousin(e)", "Fils", "Fille", "Conjoint(e)", "Ex-conjoint(e)", "Ami(e) proche", "Meilleur(e) ami(e)", "Connaissance", "Collègue", "Patron/Manager", "Associé(e)", "Client", "Médecin", "Avocat", "Notaire", "Comptable", "Banquier", "Assureur", "Voisin(e)", "Propriétaire/Bailleur", "Professeur", "Famille éloignée", "Autre"];

document.getElementById("btn-add-contact").addEventListener("click", () => { openContactModal(); });

function openContactModal(id = null) {
let c = { id: generateId(), nom: "", relation: "Ami(e) proche", importance: "3", accessCodes: [] };
if (id) {
const found = globalData.contacts.find(x => x.id === id);
if (found) c = { ...found };
}
let relOptions = relationsList.map(r => `<option value="${r}" ${c.relation === r ? 'selected' : ''}>${r}</option>`).join('');
const isOther = !relationsList.includes(c.relation) && c.relation !== "";
if (isOther) {
relOptions += `<option value="${escapeHtml(c.relation)}" selected>${escapeHtml(c.relation)}</option>`;
}

openModal(`
<h3>${id ? 'Modifier' : 'Ajouter'} un contact</h3>
<form id="contact-form">
<input type="hidden" id="c-id" value="${c.id}">
<div class="input-group"><input type="text" id="c-nom" placeholder="Nom complet" value="${escapeHtml(c.nom)}" required></div>
<div class="input-group">
<select id="c-relation" required>
${relOptions}
${!isOther && !relationsList.includes("Autre") ? '<option value="Autre">Autre</option>' : ''}
</select>
</div>
<div class="input-group ${!isOther ? 'hidden' : ''}" id="c-relation-other-group">
<input type="text" id="c-relation-other" placeholder="Précisez la relation" value="${isOther ? escapeHtml(c.relation) : ''}">
</div>
<label>Importance :</label>
<div class="importance-selector">
${[1,2,3,4,5].map(i => `
<label class="imp-btn" data-value="${i}">
<input type="radio" name="c-imp" value="${i}" ${parseInt(c.importance) === i ? 'checked' : ''}>
<span>${i}</span>
</label>
`).join('')}
</div>
<div class="input-group"><input type="tel" id="c-tel" placeholder="Téléphone" value="${escapeHtml(c.tel || '')}"></div>
<div class="input-group"><input type="email" id="c-email" placeholder="Email" value="${escapeHtml(c.email || '')}"></div>
<div class="input-group"><input type="text" id="c-whatsapp" placeholder="WhatsApp (numéro)" value="${escapeHtml(c.whatsapp || '')}"></div>
<div class="input-group"><input type="text" id="c-telegram" placeholder="Telegram (username)" value="${escapeHtml(c.telegram || '')}"></div>
<div class="input-group"><input type="text" id="c-snapchat" placeholder="Snapchat (username)" value="${escapeHtml(c.snapchat || '')}"></div>
<div class="input-group"><input type="text" id="c-instagram" placeholder="Instagram (username)" value="${escapeHtml(c.instagram || '')}"></div>
<div class="input-group"><input type="text" id="c-messenger" placeholder="Messenger (id)" value="${escapeHtml(c.messenger || '')}"></div>
<textarea id="c-notes" placeholder="Notes visibles par tous..." rows="3">${escapeHtml(c.notes || '')}</textarea>
<div class="access-code-checkboxes">
<h4>Détenteurs de codes d'accès</h4>
<label class="custom-checkbox vault-check">
<input type="checkbox" id="c-has-vault" ${c.accessCodes && c.accessCodes.includes('vault') ? 'checked' : ''}>
<div class="checkmark"><i class="fas fa-check"></i></div>
Ce contact possède le code Vault
</label>
<label class="custom-checkbox testament-check">
<input type="checkbox" id="c-has-testament" ${c.accessCodes && c.accessCodes.includes('testament') ? 'checked' : ''}>
<div class="checkmark"><i class="fas fa-check"></i></div>
Ce contact possède le code Testament
</label>
</div>
<div class="modal-actions">
<button type="button" class="btn-secondary" onclick="closeModal()">Annuler</button>
<button type="submit" class="btn-primary">Sauvegarder</button>
</div>
</form>
`);
document.getElementById("c-relation").addEventListener("change", (e) => {
const og = document.getElementById("c-relation-other-group");
if (e.target.value === "Autre") og.classList.remove("hidden");
else og.classList.add("hidden");
});
document.getElementById("contact-form").addEventListener("submit", async (e) => {
e.preventDefault();
let rel = document.getElementById("c-relation").value;
if (rel === "Autre") rel = document.getElementById("c-relation-other").value;
let imp = document.querySelector('input[name="c-imp"]:checked').value;
let ac = [];
if (document.getElementById("c-has-vault").checked) ac.push("vault");
if (document.getElementById("c-has-testament").checked) ac.push("testament");
const newData = {
id: document.getElementById("c-id").value,
nom: document.getElementById("c-nom").value.trim(),
relation: rel,
importance: imp,
tel: document.getElementById("c-tel").value.trim(),
email: document.getElementById("c-email").value.trim(),
whatsapp: document.getElementById("c-whatsapp").value.trim(),
telegram: document.getElementById("c-telegram").value.trim(),
snapchat: document.getElementById("c-snapchat").value.trim(),
instagram: document.getElementById("c-instagram").value.trim(),
messenger: document.getElementById("c-messenger").value.trim(),
notes: document.getElementById("c-notes").value.trim(),
accessCodes: ac
};
let arr = globalData.contacts;
const idx = arr.findIndex(x => x.id === newData.id);
if (idx >= 0) arr[idx] = newData; else arr.push(newData);
closeModal();
await saveContacts();
renderContacts();
});
}

window.editContact = openContactModal;

window.deleteContact = async (id) => {
if (await confirmDialog("Supprimer ce contact ?")) {
globalData.contacts = globalData.contacts.filter(c => c.id !== id);
await saveContacts();
renderContacts();
}
};

async function saveContacts() {
try {
const encAdmin = encryptData(globalData.contacts, adminCode);
const encEmerg = encryptData(globalData.contacts, plainEmergency);
await postToApi({ action: 'saveContacts', data: { contacts: encAdmin, emergencyContacts: encEmerg } });
showToast("Contacts sauvegardés", "success");
} catch (e) {
showToast("Erreur sauvegarde contacts", "error");
}
}

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
let currentVaultCat = "etat-civil";

function renderVaultCategories() {
const sb = document.getElementById("vault-categories");
sb.innerHTML = "";
VAULT_CATEGORIES.forEach(cat => {
const itemsCount = globalData.vault.filter(i => i.category === cat.id).length + globalData.protectedVault.filter(i => i.category === cat.id).length;
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
let items = globalData.vault.filter(i => i.category === currentVaultCat);
let pItems = globalData.protectedVault.filter(i => i.category === currentVaultCat);

if (currentVaultCat === "etat-civil" && items.length === 0) {
items.push({ id: generateId(), category: "etat-civil", nom: "", prenom: "", dateNaissance: "", lieuNaissance: "", nationalite: "", adresse: "", notes: "" });
}

items.forEach(item => {
const card = document.createElement("div");
card.className = "vault-item-card";
let fieldsHtml = "";
const keysToIgnore = ["id", "category", "label", "protectedPasswordHash", "encryptedContent"];
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

let actions = `<button class="btn-icon" onclick="editVaultItem('${item.id}', false)"><i class="fas fa-edit"></i></button>`;
if (currentVaultCat !== "etat-civil") {
actions += `<button class="btn-icon" style="color:#e63946;" onclick="deleteVaultItem('${item.id}', false)"><i class="fas fa-trash"></i></button>`;
}

card.innerHTML = `<div class="vault-item-header"><strong>${escapeHtml(item.nom || item.service || item.banque || item.type || item.titre || catDef.name)}</strong><div>${actions}</div></div>${fieldsHtml}`;
list.appendChild(card);
});

pItems.forEach(item => {
const card = document.createElement("div");
card.className = "vault-item-card";
card.innerHTML = `<div class="vault-item-header"><strong><i class="fas fa-lock" style="color:#fca311;"></i> ${escapeHtml(item.label)}</strong><div><button class="btn-icon" onclick="unlockAndEditProtectedItem('${item.id}')"><i class="fas fa-unlock"></i> Déverrouiller</button></div></div>`;
list.appendChild(card);
});
}

document.getElementById("btn-add-vault-item").addEventListener("click", () => {
if (currentVaultCat === "etat-civil") {
showToast("Un seul item possible pour l'état civil", "warning");
return;
}
openVaultModal();
});

window.editVaultItem = (id, isProtected) => { openVaultModal(id, isProtected); };

window.unlockAndEditProtectedItem = (id) => {
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
const item = globalData.protectedVault.find(i => i.id === id);
if (!item) return;
const hash = hashPassword(code);
if (hash === item.protectedPasswordHash) {
const decrypted = decryptData(item.encryptedContent, code);
if (decrypted) {
closeModal();
openVaultModal(id, true, decrypted, code);
} else {
showToast("Erreur de déchiffrement", "error");
}
} else {
showToast("Mot de passe incorrect", "error");
}
});
};

function getFieldsForCategory(cat) {
switch(cat) {
case "etat-civil": return [{k:"nom",l:"Nom"},{k:"prenom",l:"Prénom"},{k:"dateNaissance",l:"Date de naissance"},{k:"lieuNaissance",l:"Lieu de naissance"},{k:"nationalite",l:"Nationalité"},{k:"adresse",l:"Adresse"},{k:"notes",l:"Notes",t:"textarea"}];
case "identifiants": return [{k:"service",l:"Service"},{k:"url",l:"URL"},{k:"identifiant",l:"Identifiant"},{k:"mdp",l:"Mot de passe",t:"password"},{k:"notes",l:"Notes",t:"textarea"}];
case "cb": return [{k:"banque",l:"Banque"},{k:"nomSurCarte",l:"Nom sur la carte"},{k:"numero",l:"Numéro"},{k:"expiration",l:"Expiration (MM/AA)"},{k:"cvv",l:"CVV",t:"password"},{k:"pin",l:"PIN",t:"password"},{k:"plafond",l:"Plafond"},{k:"notes",l:"Notes",t:"textarea"}];
case "documents": return [{k:"type",l:"Type",t:"select",opts:["CNI","Passeport","Permis","Titre de séjour","Autre"]},{k:"numero",l:"Numéro"},{k:"dateEmission",l:"Date d'émission"},{k:"dateExpiration",l:"Date d'expiration"},{k:"lieuEmission",l:"Lieu d'émission"},{k:"notes",l:"Notes",t:"textarea"}];
case "comptes": return [{k:"banque",l:"Banque"},{k:"titulaire",l:"Titulaire"},{k:"iban",l:"IBAN",t:"password"},{k:"bic",l:"BIC"},{k:"numeroCompte",l:"Numéro de compte"},{k:"agence",l:"Agence"},{k:"notes",l:"Notes",t:"textarea"}];
case "codes": return [{k:"nom",l:"Nom/Description"},{k:"code",l:"Code",t:"password"},{k:"notes",l:"Notes",t:"textarea"}];
case "medical": return [{k:"groupeSanguin",l:"Groupe Sanguin",t:"select",opts:["A+","A-","B+","B-","AB+","AB-","O+","O-"]},{k:"allergies",l:"Allergies"},{k:"traitements",l:"Traitements en cours"},{k:"medecin",l:"Médecin traitant"},{k:"secu",l:"N° Sécurité Sociale",t:"password"},{k:"mutuelle",l:"Mutuelle"},{k:"adherent",l:"N° adhérent"},{k:"notes",l:"Notes",t:"textarea"}];
case "assurances": return [{k:"type",l:"Type",t:"select",opts:["Auto","Habitation","Santé","Vie","Responsabilité civile","Autre"]},{k:"compagnie",l:"Compagnie"},{k:"contrat",l:"N° de contrat"},{k:"tel",l:"Téléphone"},{k:"echeance",l:"Date d'échéance"},{k:"notes",l:"Notes",t:"textarea"}];
case "licences": return [{k:"service",l:"Service/Logiciel"},{k:"cle",l:"Clé de licence",t:"password"},{k:"email",l:"Email associé"},{k:"renouvellement",l:"Date de renouvellement"},{k:"notes",l:"Notes",t:"textarea"}];
case "notes": return [{k:"titre",l:"Titre"},{k:"contenu",l:"Contenu",t:"textarea"}];
default: return [];
}
}

function openVaultModal(id = null, isProtected = false, decryptedData = null, oldPCode = null) {
const fields = getFieldsForCategory(currentVaultCat);
let item = {};
if (id) {
if (isProtected) {
item = decryptedData;
} else {
item = globalData.vault.find(x => x.id === id) || {};
}
}

let formHtml = `<form id="vault-form"><input type="hidden" id="v-id" value="${id || generateId()}"><input type="hidden" id="v-is-protected-orig" value="${isProtected}">`;
fields.forEach(f => {
let val = item[f.k] || "";
if (f.t === "textarea") {
formHtml += `<textarea id="v-f-${f.k}" placeholder="${f.l}" rows="3">${escapeHtml(val)}</textarea>`;
} else if (f.t === "select") {
let opts = f.opts.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('');
formHtml += `<div class="input-group"><select id="v-f-${f.k}">${opts}</select></div>`;
} else if (f.t === "password") {
formHtml += `<div class="input-group"><input type="password" id="v-f-${f.k}" placeholder="${f.l}" value="${escapeHtml(val)}"><button type="button" class="toggle-password" onclick="toggleVisibility(this, 'v-f-${f.k}')"><i class="fas fa-eye"></i></button></div>`;
} else {
formHtml += `<div class="input-group"><input type="text" id="v-f-${f.k}" placeholder="${f.l}" value="${escapeHtml(val)}"></div>`;
}
});

let origLabel = "";
if (isProtected && id) {
const pItem = globalData.protectedVault.find(x => x.id === id);
if (pItem) origLabel = pItem.label;
}

if (currentVaultCat !== "etat-civil" && currentVaultCat !== "notes") {
formHtml += `
<div class="protected-item-section">
<label class="custom-checkbox vault-check" style="margin-bottom:12px;">
<input type="checkbox" id="v-protect" ${isProtected ? 'checked' : ''}>
<div class="checkmark"><i class="fas fa-check"></i></div>
Protéger cet élément avec un mot de passe supplémentaire
</label>
<div id="v-protect-fields" class="${isProtected ? '' : 'hidden'}">
<div class="input-group"><input type="text" id="v-p-label" placeholder="Label visible (ex: Site secret)" value="${escapeHtml(origLabel)}"></div>
<div class="input-group"><input type="password" id="v-p-code" placeholder="${isProtected ? 'Nouveau mot de passe (laisser vide pour garder l\'actuel)' : 'Mot de passe de protection'}"></div>
<div class="input-group"><input type="password" id="v-p-code-confirm" placeholder="Confirmer le mot de passe"></div>
</div>
</div>`;
}

formHtml += `<div class="modal-actions">
${isProtected && id ? `<button type="button" class="btn-danger" style="margin-right:auto;" onclick="deleteVaultItem('${id}', true)">Supprimer</button>` : ''}
<button type="button" class="btn-secondary" onclick="closeModal()">Annuler</button>
<button type="submit" class="btn-primary">Sauvegarder</button>
</div></form>`;

openModal(`<h3>${id ? 'Modifier' : 'Ajouter'} un élément</h3>${formHtml}`);

const pCheck = document.getElementById("v-protect");
if (pCheck) {
pCheck.addEventListener("change", (e) => {
const pf = document.getElementById("v-protect-fields");
if (e.target.checked) pf.classList.remove("hidden");
else pf.classList.add("hidden");
});
}

document.getElementById("vault-form").addEventListener("submit", async (e) => {
e.preventDefault();
let dataToSave = { id: document.getElementById("v-id").value, category: currentVaultCat };
fields.forEach(f => { dataToSave[f.k] = document.getElementById(`v-f-${f.k}`).value; });

const protectChecked = pCheck ? pCheck.checked : false;
const wasProtected = document.getElementById("v-is-protected-orig").value === "true";

if (protectChecked) {
const label = document.getElementById("v-p-label").value.trim();
if (!label) return showToast("Le label visible est requis", "error");
const code = document.getElementById("v-p-code").value;
const confirm = document.getElementById("v-p-code-confirm").value;
let finalCode = oldPCode;
if (code) {
if (code !== confirm) return showToast("Les mots de passe de protection ne correspondent pas", "error");
finalCode = code;
}
if (!finalCode) return showToast("Mot de passe de protection requis", "error");

const pItem = {
id: dataToSave.id,
category: currentVaultCat,
label: label,
protectedPasswordHash: hashPassword(finalCode),
encryptedContent: encryptData(dataToSave, finalCode)
};

if (wasProtected) {
const idx = globalData.protectedVault.findIndex(x => x.id === dataToSave.id);
if (idx >= 0) globalData.protectedVault[idx] = pItem;
} else {
globalData.protectedVault.push(pItem);
if (id) globalData.vault = globalData.vault.filter(x => x.id !== id);
}
} else {
if (wasProtected) {
globalData.protectedVault = globalData.protectedVault.filter(x => x.id !== dataToSave.id);
}
const idx = globalData.vault.findIndex(x => x.id === dataToSave.id);
if (idx >= 0) globalData.vault[idx] = dataToSave; else globalData.vault.push(dataToSave);
}

closeModal();
await saveVaultData();
renderVaultCategories();
});
}

window.deleteVaultItem = async (id, isProtected) => {
if (await confirmDialog("Supprimer cet élément ?")) {
if (isProtected) {
globalData.protectedVault = globalData.protectedVault.filter(x => x.id !== id);
} else {
globalData.vault = globalData.vault.filter(x => x.id !== id);
}
closeModal();
await saveVaultData();
renderVaultCategories();
}
};

async function saveVaultData() {
try {
const encV = encryptData(globalData.vault, plainVault);
const encPV = encryptData(globalData.protectedVault, plainVault);
await postToApi({ action: 'saveVault', data: { vaultData: encV } });
await postToApi({ action: 'saveProtectedVault', data: { protectedItems: encPV } });
showToast("Vault sauvegardé", "success");
} catch (e) {
showToast("Erreur sauvegarde Vault", "error");
}
}

function initQuill() {
quill = new Quill('#quill-editor', {
theme: 'snow',
modules: { toolbar: [ ['bold', 'italic', 'underline'], [{'list':'ordered'},{'list':'bullet'}], [{'header':[1,2,3,false]}], [{'color':[]}] ] }
});
if (globalData.testament.content) {
quill.root.innerHTML = globalData.testament.content;
}
quill.on('text-change', () => { testamentChanged = true; });
setInterval(() => {
if (testamentChanged) {
doSaveTestament(true);
testamentChanged = false;
}
}, 30000);
}

let testamentChanged = false;

function renderTestament() {
const t = globalData.testament;
if (t.nom) document.getElementById("testament-nom").value = t.nom;
if (t.prenom) document.getElementById("testament-prenom").value = t.prenom;
if (t.dateNaissance) document.getElementById("testament-date-naissance").value = t.dateNaissance;
if (t.lieuNaissance) document.getElementById("testament-lieu-naissance").value = t.lieuNaissance;
if (t.nationalite) document.getElementById("testament-nationalite").value = t.nationalite;
if (t.adresse) document.getElementById("testament-adresse").value = t.adresse;
if (t.lastModified) document.getElementById("testament-last-saved").innerText = `Dernière sauvegarde : ${formatDateFR(t.lastModified)}`;
document.getElementById("testament-nom").addEventListener("input", () => { testamentChanged = true; });
}

document.getElementById("btn-save-testament").addEventListener("click", () => { doSaveTestament(false); });

async function doSaveTestament(isAuto) {
const tData = {
nom: document.getElementById("testament-nom").value,
prenom: document.getElementById("testament-prenom").value,
dateNaissance: document.getElementById("testament-date-naissance").value,
lieuNaissance: document.getElementById("testament-lieu-naissance").value,
nationalite: document.getElementById("testament-nationalite").value,
adresse: document.getElementById("testament-adresse").value,
content: quill ? quill.root.innerHTML : (globalData.testament.content || ""),
lastModified: new Date().toISOString()
};
globalData.testament = tData;
document.getElementById("testament-last-saved").innerText = `Dernière sauvegarde : ${formatDateFR(tData.lastModified)}`;
try {
const enc = encryptData(tData, plainTestament);
await postToApi({ action: 'saveTestament', data: { testamentData: enc } });
if (!isAuto) showToast("Testament sauvegardé", "success");
} catch (e) {
if (!isAuto) showToast("Erreur sauvegarde Testament", "error");
}
}

document.getElementById("btn-export-pdf").addEventListener("click", () => {
const t = globalData.testament;
const element = document.createElement("div");
element.style.padding = "40px";
element.style.fontFamily = "Helvetica, Arial, sans-serif";
element.innerHTML = `
<h1 style="text-align:center; color:#333; margin-bottom:40px;">TESTAMENT - DERNIÈRES VOLONTÉS</h1>
<div style="margin-bottom:30px; line-height:1.6;">
<strong>Nom :</strong> ${escapeHtml(t.nom)}<br>
<strong>Prénom :</strong> ${escapeHtml(t.prenom)}<br>
<strong>Date de naissance :</strong> ${escapeHtml(t.dateNaissance)}<br>
<strong>Lieu de naissance :</strong> ${escapeHtml(t.lieuNaissance)}<br>
<strong>Nationalité :</strong> ${escapeHtml(t.nationalite)}<br>
<strong>Adresse :</strong> ${escapeHtml(t.adresse)}
</div>
<div style="margin-bottom:20px; font-style:italic; color:#666;">Dernière modification : ${formatDateFR(t.lastModified)}</div>
<hr style="margin-bottom:30px;">
<div style="line-height:1.6;">${t.content || ""}</div>
<div style="margin-top:50px; font-size:0.8rem; text-align:center; color:#999;">Document généré le ${new Date().toLocaleDateString('fr-FR')} - Utilitaire</div>
`;
html2pdf().set({ margin: 10, filename: 'Testament.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(element).save();
});

function renderSettings() {
if (globalData.config.emergencyMessage) {
document.getElementById("settings-emergency-message").value = decryptData(globalData.config.emergencyMessage, adminCode) || "";
}
renderSettingsLogs();
}

document.getElementById("btn-save-emergency-message").addEventListener("click", async () => {
const msg = document.getElementById("settings-emergency-message").value;
globalData.config.emergencyMessage = encryptData(msg, adminCode);
globalData.config.emergencyMessageForEmergency = encryptData(msg, plainEmergency);
try {
await postToApi({ action: 'saveConfig', data: globalData.config });
showToast("Message sauvegardé", "success");
} catch(e) {
showToast("Erreur sauvegarde", "error");
}
});

document.getElementById("change-codes-form").addEventListener("submit", async (e) => {
e.preventDefault();
let changed = false;
let configObj = { ...globalData.config };

const aOld = document.getElementById("change-admin-old").value;
const aNew = document.getElementById("change-admin-new").value;
const aConf = document.getElementById("change-admin-confirm").value;
if (aNew && aOld && aConf) {
if (hashPassword(aOld) !== configObj.adminHash) return showToast("Ancien code admin incorrect", "error");
if (aNew !== aConf) return showToast("Les nouveaux codes admin ne correspondent pas", "error");
if (aNew.length < 8) return showToast("Nouveau code admin trop court", "error");
adminCode = aNew;
configObj.adminHash = hashPassword(aNew);
changed = true;
}

const eOld = document.getElementById("change-emergency-old").value;
const eNew = document.getElementById("change-emergency-new").value;
const eConf = document.getElementById("change-emergency-confirm").value;
if (eNew && eOld && eConf) {
if (hashPassword(eOld) !== configObj.emergencyHash) return showToast("Ancien code urgence incorrect", "error");
if (eNew !== eConf) return showToast("Les nouveaux codes urgence ne correspondent pas", "error");
if (eNew.length < 6) return showToast("Nouveau code urgence trop court", "error");
plainEmergency = eNew;
configObj.emergencyHash = hashPassword(eNew);
changed = true;
}

const vOld = document.getElementById("change-vault-old").value;
const vNew = document.getElementById("change-vault-new").value;
const vConf = document.getElementById("change-vault-confirm").value;
if (vNew && vOld && vConf) {
if (hashPassword(vOld) !== configObj.vaultHash) return showToast("Ancien code vault incorrect", "error");
if (vNew !== vConf) return showToast("Les nouveaux codes vault ne correspondent pas", "error");
if (vNew.length < 6) return showToast("Nouveau code vault trop court", "error");
plainVault = vNew;
configObj.vaultHash = hashPassword(vNew);
changed = true;
}

const tOld = document.getElementById("change-testament-old").value;
const tNew = document.getElementById("change-testament-new").value;
const tConf = document.getElementById("change-testament-confirm").value;
if (tNew && tOld && tConf) {
if (hashPassword(tOld) !== configObj.testamentHash) return showToast("Ancien code testament incorrect", "error");
if (tNew !== tConf) return showToast("Les nouveaux codes testament ne correspondent pas", "error");
if (tNew.length < 6) return showToast("Nouveau code testament trop court", "error");
plainTestament = tNew;
configObj.testamentHash = hashPassword(tNew);
changed = true;
}

if (!changed) return;

const allPlains = [adminCode, plainEmergency, plainVault, plainTestament];
const uniquePlains = new Set(allPlains);
if (uniquePlains.size !== 4) return showToast("Les 4 codes doivent être différents", "error");

document.getElementById("loading-overlay").classList.remove("hidden");
try {
configObj.encryptedEmergencyPassword = encryptData(plainEmergency, adminCode);
configObj.encryptedVaultPassword = encryptData(plainVault, adminCode);
configObj.encryptedTestamentPassword = encryptData(plainTestament, adminCode);
const msg = document.getElementById("settings-emergency-message").value;
configObj.emergencyMessage = encryptData(msg, adminCode);
configObj.emergencyMessageForEmergency = encryptData(msg, plainEmergency);
await postToApi({ action: 'saveConfig', data: configObj });
globalData.config = configObj;
sessionStorage.setItem("_key", configObj.adminHash);

await saveContacts();
await saveVaultData();
const encT = encryptData(globalData.testament, plainTestament);
await postToApi({ action: 'saveTestament', data: { testamentData: encT } });

showToast("Codes mis à jour et données rechiffrées", "success");
document.getElementById("change-codes-form").reset();
} catch(e) {
showToast("Erreur lors de la mise à jour des codes", "error");
} finally {
document.getElementById("loading-overlay").classList.add("hidden");
}
});

document.getElementById("btn-erase-data").addEventListener("click", async () => {
if (await confirmDialog("ATTENTION ! Cela effacera TOUTES les données. Continuer ?")) {
if (await confirmDialog("Êtes-vous VRAIMENT sûr ? Cette action est irréversible.")) {
try {
await postToApi({ action: 'saveConfig', data: {} });
await postToApi({ action: 'saveContacts', data: {} });
await postToApi({ action: 'saveVault', data: {} });
await postToApi({ action: 'saveTestament', data: {} });
await postToApi({ action: 'saveProtectedVault', data: {} });
sessionStorage.clear();
window.location.href = "setup.html";
} catch(e) {
showToast("Erreur", "error");
}
}
}
});

document.getElementById("btn-test-log").addEventListener("click", async () => {
await sendAlertThenRedirect("Test", null);
showToast("Test log envoyé", "info");
});

function renderSettingsLogs() {
const tbody = document.querySelector("#settings-logs-table tbody");
tbody.innerHTML = "";
const logs = globalData.config.publicAccessLogs || [];
logs.forEach((log, index) => {
const tr = document.createElement("tr");
tr.innerHTML = `
<td>${escapeHtml(log.type)}</td>
<td>${escapeHtml(log.date)}</td>
<td>${escapeHtml(log.ip)}</td>
<td>${escapeHtml(log.nom || '-')}</td>
<td><button class="btn-icon" style="color:#e63946;" onclick="deleteLog(${index})"><i class="fas fa-trash"></i></button></td>
`;
tbody.appendChild(tr);
});
}

window.deleteLog = async (index) => {
if (await confirmDialog("Supprimer cette entrée de log ?")) {
try {
await postToApi({ action: 'deleteLogLines', indices: [index] });
globalData.config.publicAccessLogs.splice(index, 1);
renderSettingsLogs();
renderActivity();
showToast("Log supprimé", "success");
} catch(e) {
showToast("Erreur", "error");
}
}
};

document.getElementById("btn-clear-all-logs").addEventListener("click", async () => {
if (await confirmDialog("Effacer TOUS les logs ?")) {
if (await confirmDialog("Confirmation définitive ?")) {
try {
const indices = (globalData.config.publicAccessLogs || []).map((_, i) => i);
await postToApi({ action: 'deleteLogLines', indices });
globalData.config.publicAccessLogs = [];
renderSettingsLogs();
renderActivity();
showToast("Logs effacés", "success");
} catch(e) {}
}
}
});

function renderActivity() {
const logs = globalData.config.publicAccessLogs || [];
document.getElementById("stat-total").innerText = logs.length;
document.getElementById("stat-vault").innerText = logs.filter(l => l.type==="Vault").length;
document.getElementById("stat-testament").innerText = logs.filter(l => l.type==="Testament").length;
document.getElementById("stat-urgence").innerText = logs.filter(l => l.type==="Urgence").length;
document.getElementById("stat-panique").innerText = logs.filter(l => l.type==="Panique").length;
document.getElementById("stat-suspect").innerText = logs.filter(l => l.type==="Tentative suspecte").length;

const filterType = document.getElementById("activity-filter-type").value;
const tbody = document.querySelector("#activity-logs-table tbody");
tbody.innerHTML = "";

let filtered = logs;
if (filterType !== "all") {
filtered = logs.filter(l => l.type === filterType);
}

filtered.forEach(log => {
const tr = document.createElement("tr");
tr.innerHTML = `
<td>${escapeHtml(log.date)}</td>
<td><span class="badge ${getBadgeClassForLog(log.type)}">${escapeHtml(log.type)}</span></td>
<td>IP: ${escapeHtml(log.ip)} ${log.nom ? '<br>Nom: ' + escapeHtml(log.nom) : ''}</td>
`;
tbody.appendChild(tr);
});
}

function getBadgeClassForLog(type) {
if (type === "Vault") return "badge-vault";
if (type === "Testament") return "badge-testament";
if (type === "Urgence") return "badge-warning";
if (type === "Panique" || type === "Tentative suspecte") return "badge-danger";
return "";
}

document.getElementById("activity-filter-type").addEventListener("change", renderActivity);
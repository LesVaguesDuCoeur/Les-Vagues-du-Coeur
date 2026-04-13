let testamentData = null;

document.addEventListener("DOMContentLoaded", async () => {
const key = sessionStorage.getItem("_key");
const page = sessionStorage.getItem("_page");

if (!key || page !== "testament") {
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
if (hashPassword(key) !== config.testamentHash) throw new Error("Accès refusé");

if (data.testament?.testamentData) {
let obj = decryptData(data.testament.testamentData, key);
if (obj) {
testamentData = obj;
}
}

renderTestament();
document.getElementById("loading-overlay").classList.add("hidden");

} catch (e) {
showToast("Erreur de chargement", "error");
setTimeout(() => { window.location.href = "index.html"; }, 1500);
}
});

function renderTestament() {
const t = testamentData || {};
const idHtml = `
<div><strong>Nom :</strong> ${escapeHtml(t.nom || "-")}</div>
<div><strong>Prénom :</strong> ${escapeHtml(t.prenom || "-")}</div>
<div><strong>Date de naissance :</strong> ${escapeHtml(t.dateNaissance || "-")}</div>
<div><strong>Lieu de naissance :</strong> ${escapeHtml(t.lieuNaissance || "-")}</div>
<div><strong>Nationalité :</strong> ${escapeHtml(t.nationalite || "-")}</div>
<div><strong>Adresse :</strong> ${escapeHtml(t.adresse || "-")}</div>
`;
document.getElementById("identity-display").innerHTML = idHtml;
document.getElementById("testament-content").innerHTML = t.content || "<p><i>Aucun testament enregistré.</i></p>";
}

document.getElementById("btn-export-pdf").addEventListener("click", () => {
const t = testamentData || {};
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

html2pdf().set({
margin: 10,
filename: 'Testament.pdf',
image: { type: 'jpeg', quality: 0.98 },
html2canvas: { scale: 2 },
jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
}).from(element).save();
});
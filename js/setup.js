document.addEventListener("DOMContentLoaded", async () => {
const data = await loadData();
if (data && data.config && data.config.isSetup) {
window.location.href = "index.html";
return;
}

const inputs = ["admin-code", "emergency-code", "vault-code", "testament-code"];
inputs.forEach(id => {
const el = document.getElementById(id);
el.addEventListener("input", () => {
updateStrength(id);
});
});

document.getElementById("setup-form").addEventListener("submit", async (e) => {
e.preventDefault();
const admin = document.getElementById("admin-code").value;
const adminConfirm = document.getElementById("admin-code-confirm").value;
const emergency = document.getElementById("emergency-code").value;
const emergencyConfirm = document.getElementById("emergency-code-confirm").value;
const vault = document.getElementById("vault-code").value;
const vaultConfirm = document.getElementById("vault-code-confirm").value;
const testament = document.getElementById("testament-code").value;
const testamentConfirm = document.getElementById("testament-code-confirm").value;
const msg = document.getElementById("emergency-message").value.trim();

if (admin !== adminConfirm) return showToast("Les codes Admin ne correspondent pas", "error");
if (emergency !== emergencyConfirm) return showToast("Les codes Urgence ne correspondent pas", "error");
if (vault !== vaultConfirm) return showToast("Les codes Vault ne correspondent pas", "error");
if (testament !== testamentConfirm) return showToast("Les codes Testament ne correspondent pas", "error");

if (admin.length < 8) return showToast("Code Admin trop court", "error");
if (emergency.length < 6) return showToast("Code Urgence trop court", "error");
if (vault.length < 6) return showToast("Code Vault trop court", "error");
if (testament.length < 6) return showToast("Code Testament trop court", "error");

const codes = [admin, emergency, vault, testament];
const uniqueCodes = new Set(codes);
if (uniqueCodes.size !== 4) {
return showToast("Les 4 codes doivent être différents", "error");
}

document.getElementById("loading-spinner").classList.remove("hidden");
document.getElementById("btn-setup").disabled = true;

try {
const configObj = {
isSetup: true,
adminHash: hashPassword(admin),
emergencyHash: hashPassword(emergency),
vaultHash: hashPassword(vault),
testamentHash: hashPassword(testament),
encryptedEmergencyPassword: encryptData(emergency, admin),
encryptedVaultPassword: encryptData(vault, admin),
encryptedTestamentPassword: encryptData(testament, admin),
emergencyMessage: encryptData(msg, admin),
emergencyMessageForEmergency: encryptData(msg, emergency),
publicAccessLogs: []
};

const res = await postToApi({ action: 'setup', data: configObj });
if (res && res.status === "success") {
showToast("Configuration terminée !", "success");
setTimeout(() => {
window.location.href = "index.html";
}, 1500);
} else {
throw new Error("Erreur serveur");
}
} catch (e) {
showToast("Erreur lors de la configuration", "error");
document.getElementById("loading-spinner").classList.add("hidden");
document.getElementById("btn-setup").disabled = false;
}
});
});

function updateStrength(id) {
const val = document.getElementById(id).value;
const strengthBar = document.getElementById("strength-" + id.split("-")[0]);
strengthBar.className = "password-strength";
if (val.length === 0) return;
let s = 1;
if (val.length >= 6) s = 2;
if (val.length >= 8) s = 3;
if (val.length >= 10) s = 4;
strengthBar.classList.add("strength-" + s);
}
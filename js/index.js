let globalConfig = null;
let currentTargetPage = null;

document.addEventListener("DOMContentLoaded", async () => {
const btnLogin = document.getElementById("btn-login");
const loginForm = document.getElementById("login-form");
const passwordInput = document.getElementById("password");
const errorBox = document.getElementById("error-message");
const lockoutBox = document.getElementById("lockout-message");
const loadingSpinner = document.getElementById("loading-spinner");

checkLockout();

try {
loadingSpinner.classList.remove("hidden");
btnLogin.disabled = true;
const data = await loadData();
if (!data || !data.config) {
throw new Error("Données introuvables");
}
globalConfig = data.config;
if (globalConfig.isSetup === false) {
window.location.href = "setup.html";
return;
}
} catch (e) {
showError("Impossible de charger la configuration.");
} finally {
loadingSpinner.classList.add("hidden");
btnLogin.disabled = false;
}

loginForm.addEventListener("submit", async (e) => {
e.preventDefault();
if (checkLockout()) return;
const pwd = passwordInput.value;
if (!pwd) return;
const hash = hashPassword(pwd);

let targetPage = null;
if (hash === globalConfig.adminHash) targetPage = "admin";
else if (hash === globalConfig.emergencyHash) targetPage = "emergency";
else if (hash === globalConfig.vaultHash) targetPage = "vault";
else if (hash === globalConfig.testamentHash) targetPage = "testament";

if (targetPage) {
handleSuccessfulLogin(targetPage, pwd);
} else {
handleFailedLogin();
}
});
});

function showError(msg) {
const errorBox = document.getElementById("error-message");
errorBox.innerText = msg;
errorBox.classList.remove("hidden");
}

function checkLockout() {
const lockoutUntil = localStorage.getItem("_lockUntil");
const lockoutBox = document.getElementById("lockout-message");
const btnLogin = document.getElementById("btn-login");
if (lockoutUntil && Date.now() < parseInt(lockoutUntil)) {
const remaining = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 1000);
lockoutBox.innerText = `Compte bloqué. Réessayez dans ${remaining} secondes.`;
lockoutBox.classList.remove("hidden");
btnLogin.disabled = true;
setTimeout(checkLockout, 1000);
return true;
} else if (lockoutUntil) {
localStorage.removeItem("_lockAttempts");
localStorage.removeItem("_lockUntil");
lockoutBox.classList.add("hidden");
btnLogin.disabled = false;
}
return false;
}

function handleFailedLogin() {
showError("Mot de passe incorrect.");
document.getElementById("password").value = "";
let attempts = parseInt(localStorage.getItem("_lockAttempts") || "0") + 1;
localStorage.setItem("_lockAttempts", attempts);
let lockoutSeconds = 0;
if (attempts >= 10) {
lockoutSeconds = 600;
sendAlertThenRedirect("Tentative suspecte", null).catch(()=>{});
} else if (attempts >= 5) {
lockoutSeconds = 120;
} else if (attempts >= 3) {
lockoutSeconds = 30;
}
if (lockoutSeconds > 0) {
localStorage.setItem("_lockUntil", Date.now() + (lockoutSeconds * 1000));
checkLockout();
}
}

async function handleSuccessfulLogin(targetPage, pwd) {
localStorage.removeItem("_lockAttempts");
localStorage.removeItem("_lockUntil");
const errorBox = document.getElementById("error-message");
errorBox.classList.add("hidden");
sessionStorage.setItem("_key", pwd);
sessionStorage.setItem("_page", targetPage);
currentTargetPage = targetPage;

if (targetPage === "admin") {
window.location.href = "admin.html";
} else if (targetPage === "emergency") {
await sendAlertThenRedirect("Urgence", "emergency.html");
} else if (targetPage === "vault" || targetPage === "testament") {
document.getElementById("double-auth-modal").classList.remove("hidden");
document.getElementById("auth-name").value = "";
document.getElementById("auth-code").value = "";
}
}

document.getElementById("double-auth-form")?.addEventListener("submit", async (e) => {
e.preventDefault();
const name = document.getElementById("auth-name").value.trim();
const code = document.getElementById("auth-code").value;
if (!name || !code) return;
const hash = hashPassword(code);
if (hash === globalConfig.emergencyHash) {
const type = currentTargetPage === "vault" ? "Vault" : "Testament";
const url = currentTargetPage === "vault" ? "vault.html" : "testament.html";
const btn = document.getElementById("btn-double-auth");
btn.disabled = true;
btn.innerText = "Vérification...";
await sendAlertThenRedirect(type, url, { nomComplet: name });
} else {
showToast("Code Urgence incorrect.", "error");
document.getElementById("auth-code").value = "";
}
});

function closeDoubleAuth() {
document.getElementById("double-auth-modal").classList.add("hidden");
sessionStorage.removeItem("_key");
sessionStorage.removeItem("_page");
currentTargetPage = null;
}
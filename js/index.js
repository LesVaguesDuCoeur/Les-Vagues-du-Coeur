if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(e => {});
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const err = document.getElementById("error-msg");
  let attempts = parseInt(localStorage.getItem("loginAttempts") || "0");
  let lockUntil = parseInt(localStorage.getItem("lockUntil") || "0");
  const f = document.getElementById("login-form");
  const p = document.getElementById("pwd");

  const d = await loadData();
  if (!d.adminHash) {
    window.location.href = "setup.html";
    return;
  }

  document.getElementById("toggle-pwd").addEventListener("click", function() {
    toggleVisibility("pwd", this);
  });

  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const now = Date.now();

    if (now < lockUntil) {
      err.textContent = `Verrouillé. Réessayez dans ${Math.ceil((lockUntil - now) / 1000)}s`;
      err.style.display = "block";
      return;
    }

    const v = p.value;
    const h = hashPassword(v);

    if (h === d.adminHash) {
      sessionStorage.setItem("ak", v);
      sessionStorage.setItem("role", "admin");
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("lockUntil");
      await sendAlertThenRedirect("adminAccess", "admin.html");
      return;
    }

    if (h === d.emergencyHash) {
      sessionStorage.setItem("ek", v);
      sessionStorage.setItem("role", "emergency");
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("lockUntil");
      await sendAlertThenRedirect("emergencyAccess", "emergency.html");
      return;
    }

    if (h === d.vaultHash) {
      sessionStorage.setItem("vk", v);
      sessionStorage.setItem("role", "vault");
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("lockUntil");
      window.location.href = "vault.html";
      return;
    }

    if (h === d.testamentHash) {
      sessionStorage.setItem("tk", v);
      sessionStorage.setItem("role", "testament");
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("lockUntil");
      window.location.href = "testament.html";
      return;
    }

    attempts++;
    localStorage.setItem("loginAttempts", attempts);
    let m = 0;

    if (attempts >= 10) {
      m = 10;
      await sendAlertThenRedirect("suspiciousActivity", null);
    } else if (attempts >= 5) {
      m = 2;
    } else if (attempts >= 3) {
      m = 0.5;
    }

    if (m > 0) {
      lockUntil = now + m * 60000;
      localStorage.setItem("lockUntil", lockUntil);
      err.textContent = `Erreur. Verrouillé pour ${m * 60}s`;
    } else {
      err.textContent = "Code incorrect";
    }

    err.style.display = "block";
    p.value = "";
  });
});
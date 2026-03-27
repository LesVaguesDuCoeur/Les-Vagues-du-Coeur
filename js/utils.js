function showToast(msg, type = "info") {
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.classList.add("show");
  }, 10);
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

async function getClientInfo() {
  const info = { ip: "Inconnue", lat: null, lng: null, userAgent: navigator.userAgent };
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    if (r.ok) {
      const d = await r.json();
      info.ip = d.ip;
    }
  } catch (e) {}
  try {
    const geo = await fetch("https://ipapi.co/json/");
    if (geo.ok) {
      const d = await geo.json();
      info.lat = d.latitude;
      info.lng = d.longitude;
    }
  } catch (e) {}
  return info;
}

async function sendAlertThenRedirect(type, targetUrl, nomComplet = null) {
  const info = await getClientInfo();
  const payload = {
    type: type,
    ip: info.ip,
    userAgent: info.userAgent,
    lat: info.lat,
    lng: info.lng,
    nomComplet: nomComplet,
    date: formatDateFR(new Date())
  };
  if (type === "emergencyAccess") payload.emergencyAccess = true;
  await postToApi(payload);
  if (targetUrl) {
    window.location.href = targetUrl;
  }
}

function setupAutoLock(minutes) {
  let t;
  const reset = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      sessionStorage.clear();
      window.location.href = "index.html";
    }, minutes * 60000);
  };
  ["mousemove", "keydown", "scroll", "click"].forEach(e => document.addEventListener(e, reset));
  reset();
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add("show");
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove("show");
}

function confirmDialog(msg, onConfirm) {
  const ov = document.createElement("div");
  ov.className = "modal-overlay show";
  ov.innerHTML = `
    <div class="modal-dialog">
      <h3>Confirmation</h3>
      <p>${escapeHtml(msg)}</p>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="cd-cancel">Annuler</button>
        <button class="btn btn-danger" id="cd-confirm">Confirmer</button>
      </div>
    </div>
  `;
  document.body.appendChild(ov);
  document.getElementById("cd-cancel").onclick = () => {
    ov.remove();
  };
  document.getElementById("cd-confirm").onclick = () => {
    ov.remove();
    onConfirm();
  };
}

function formatDateFR(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

async function copyToClipboard(text) {
  if (!navigator.clipboard) {
    const a = document.createElement("textarea");
    a.value = text;
    document.body.appendChild(a);
    a.select();
    try {
      document.execCommand("copy");
      showToast("Copié !", "success");
    } catch (e) {
      showToast("Erreur copie", "error");
    }
    document.body.removeChild(a);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copié !", "success");
  } catch (e) {
    showToast("Erreur copie", "error");
  }
}

function toggleVisibility(id, btn) {
  const e = document.getElementById(id);
  if (!e) return;
  if (e.type === "password") {
    e.type = "text";
    btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
  } else {
    e.type = "password";
    btn.innerHTML = '<i class="fas fa-eye"></i>';
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}
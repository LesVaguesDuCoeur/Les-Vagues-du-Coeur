document.addEventListener("DOMContentLoaded", async () => {
  const ek = sessionStorage.getItem("ek");
  if (!ek || sessionStorage.getItem("role") !== "emergency") {
    window.location.href = "index.html";
    return;
  }

  setupAutoLock(10);
  let serverData;
  try {
    serverData = await loadData();
  } catch (e) {
    showToast("Erreur réseau", "error");
    return;
  }

  const msg = decryptData(serverData.emergencyMessageForEmergency, ek);
  if (msg) {
    document.getElementById("em-msg-container").style.display = "block";
    document.getElementById("em-msg-content").innerText = msg;
  }

  let contacts = [];
  try {
    contacts = decryptData(serverData.emergencyContacts, ek) || [];
    contacts.sort((a, b) => (a.imp || 5) - (b.imp || 5));
  } catch (e) {
    showToast("Erreur de déchiffrement", "error");
  }

  document.getElementById("btn-logout").addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "index.html";
  });

  document.getElementById("btn-panic").addEventListener("click", async () => {
    confirmDialog("Activer la Panique Niveau 1 ? Une alerte sera envoyée.", async () => {
      try {
        document.getElementById("btn-panic").disabled = true;
        await sendAlertThenRedirect("panicLevel1", null);
        showToast("Alerte envoyée", "success");
        document.getElementById("btn-panic").disabled = false;
      } catch (e) {
        showToast("Erreur", "error");
        document.getElementById("btn-panic").disabled = false;
      }
    });
  });

  const sInput = document.getElementById("search-input");
  sInput.addEventListener("input", () => {
    const q = sInput.value.toLowerCase();
    const f = contacts.filter(c => (c.name || "").toLowerCase().includes(q) || (c.rel || "").toLowerCase().includes(q));
    renderContacts(f);
  });

  function renderContacts(arr) {
    const g = document.getElementById("contacts-grid");
    g.innerHTML = "";
    if (arr.length === 0) {
      g.innerHTML = "<p style='color:var(--text-sec);'>Aucun contact trouvé.</p>";
      return;
    }

    arr.forEach(cn => {
      const d = document.createElement("div");
      d.className = "card contact-card";
      d.setAttribute("data-imp", cn.imp || 5);
      d.innerHTML = `
        <div class="contact-header">
          <div>
            <h3>${escapeHtml(cn.name)}</h3>
            <div style="font-size:12px;color:var(--text-sec);">${escapeHtml(cn.rel)}</div>
          </div>
        </div>
        <div class="contact-links" style="margin-top:8px;">${renderLinks(cn)}</div>
      `;
      g.appendChild(d);
    });
  }

  function renderLinks(c) {
    let h = "";
    if (c.tel) h += `<a href="tel:${escapeHtml(c.tel)}" class="link-icon tel"><i class="fas fa-phone"></i></a>`;
    if (c.mail) h += `<a href="mailto:${escapeHtml(c.mail)}" class="link-icon mail"><i class="fas fa-envelope"></i></a>`;
    if (c.wa) h += `<a href="https://wa.me/${escapeHtml(c.wa.replace(/[^0-9]/g, ''))}" class="link-icon wa" target="_blank"><i class="fab fa-whatsapp"></i></a>`;
    if (c.tg) h += `<a href="https://t.me/${escapeHtml(c.tg)}" class="link-icon tg" target="_blank"><i class="fab fa-telegram-plane"></i></a>`;
    if (c.snap) h += `<a href="https://snapchat.com/add/${escapeHtml(c.snap)}" class="link-icon snap" target="_blank"><i class="fab fa-snapchat-ghost"></i></a>`;
    if (c.ig) h += `<a href="https://instagram.com/${escapeHtml(c.ig)}" class="link-icon ig" target="_blank"><i class="fab fa-instagram"></i></a>`;
    if (c.msg) h += `<a href="https://m.me/${escapeHtml(c.msg)}" class="link-icon msg" target="_blank"><i class="fab fa-facebook-messenger"></i></a>`;
    return h;
  }

  renderContacts(contacts);
});
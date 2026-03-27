document.addEventListener("DOMContentLoaded", async () => {
  const vk = sessionStorage.getItem("vk");
  if (!vk || sessionStorage.getItem("role") !== "vault") {
    window.location.href = "index.html";
    return;
  }

  setupAutoLock(15);
  let serverData;
  try {
    serverData = await loadData();
  } catch (e) {
    showToast("Erreur réseau", "error");
    return;
  }

  const mId = document.getElementById("modal-identity");
  const vCont = document.getElementById("vault-content");
  mId.classList.add("show");

  document.getElementById("form-identity").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nm = document.getElementById("id-nom").value.trim();
    const c = document.getElementById("id-code").value;
    const err = document.getElementById("id-error");
    const h = hashPassword(c);

    if (h !== serverData.emergencyHash) {
      err.textContent = "Code incorrect";
      err.style.display = "block";
      return;
    }

    try {
      document.querySelector("#form-identity button").disabled = true;
      await sendAlertThenRedirect("vaultAccess", null, nm);
      mId.classList.remove("show");
      vCont.style.display = "flex";
      loadVault();
    } catch (er) {
      err.textContent = "Erreur de connexion";
      err.style.display = "block";
      document.querySelector("#form-identity button").disabled = false;
    }
  });

  document.getElementById("btn-logout").addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "index.html";
  });

  let vaultData = [];
  function loadVault() {
    try {
      const ak = sessionStorage.getItem("ak") || null;
      let parsedWrapper = null;
      try {
         parsedWrapper = JSON.parse(serverData.vaultData);
      } catch(e) {}

      if (parsedWrapper && parsedWrapper.adminEncrypted) {
         if (ak) {
            vaultData = decryptData(parsedWrapper.adminEncrypted, ak) || [];
         } else {
            vaultData = decryptData(parsedWrapper.userEncrypted, vk) || [];
         }
      } else {
         try { vaultData = decryptData(serverData.vaultData, ak || vk) || []; } catch(e){}
      }

      renderSidebar();
      renderItems("all");
    } catch (e) {
      showToast("Erreur déchiffrement", "error");
    }
  }

  function renderSidebar() {
    const sb = document.getElementById("cat-sidebar");
    sb.innerHTML = '<div class="vault-cat active" data-cat="all"><i class="fas fa-th-large"></i> Tout</div>';

    const cats = new Set(vaultData.map(v => v.cat));
    cats.forEach(c => {
      const d = document.createElement("div");
      d.className = "vault-cat";
      d.setAttribute("data-cat", c);
      d.innerHTML = `<i class="fas fa-folder"></i> ${escapeHtml(c)}`;
      sb.appendChild(d);
    });

    sb.querySelectorAll(".vault-cat").forEach(btn => {
      btn.addEventListener("click", () => {
        sb.querySelectorAll(".vault-cat").forEach(x => x.classList.remove("active"));
        btn.classList.add("active");
        renderItems(btn.dataset.cat);
      });
    });
  }

  function renderItems(filterCat) {
    const g = document.getElementById("items-grid");
    g.className = "grid-cards";
    g.innerHTML = "";
    const items = filterCat === "all" ? vaultData : vaultData.filter(v => v.cat === filterCat);

    if (items.length === 0) {
      g.innerHTML = "<p style='color:var(--text-sec);'>Aucun élément.</p>";
      return;
    }

    items.forEach((it, idx) => {
      const d = document.createElement("div");
      d.className = "card vault-item-card";
      let h = `<div class="contact-header"><div><h3>${escapeHtml(it.title)}</h3><div style="font-size:12px;color:var(--text-sec);">${escapeHtml(it.cat)}</div></div></div>`;

      if (it.isLocked) {
        h += `<div class="input-group">
                <input type="text" id="lock-n-${idx}" placeholder="Prénom de sécurité">
                <input type="password" id="lock-p-${idx}" placeholder="Mot de passe spécifique" style="margin-top:8px;">
                <button class="btn btn-secondary btn-block" style="margin-top:8px;" onclick="unlockItem(${idx})"><i class="fas fa-unlock"></i> Déverrouiller</button>
              </div>
              <div id="fields-${idx}" style="display:none;margin-top:16px;">${renderFields(it)}</div>`;
      } else {
        h += `<div style="margin-top:16px;">${renderFields(it)}</div>`;
      }
      d.innerHTML = h;
      g.appendChild(d);
    });
  }

  function renderFields(it) {
    if(!it.fields) return "";
    return Object.entries(it.fields).map(([k, v], fid) => {
      const isMasked = k.toLowerCase().includes('mdp') || k.toLowerCase().includes('pin') || k.toLowerCase().includes('cvv') || k.toLowerCase().includes('iban') || k.toLowerCase().includes('clé') || k.toLowerCase().includes('sécu');
      return `
        <div class="vault-field">
          <div class="vault-field-header">${escapeHtml(k)}</div>
          <div class="vault-field-value">
            <span id="val-${it.id || fid}-${fid}" style="${isMasked ? 'filter:blur(5px);user-select:none;' : ''}transition:filter 0.3s;">${escapeHtml(v)}</span>
            <div class="vault-field-actions">
              ${isMasked ? `<button onclick="toggleBlur('val-${it.id || fid}-${fid}')"><i class="fas fa-eye"></i></button>` : ''}
              <button onclick="copyToClipboard('${escapeHtml(v)}')"><i class="fas fa-copy"></i></button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.toggleBlur = function(id) {
    const e = document.getElementById(id);
    if (e.style.filter) {
      e.style.filter = "";
      e.style.userSelect = "auto";
    } else {
      e.style.filter = "blur(5px)";
      e.style.userSelect = "none";
    }
  };

  window.unlockItem = function(idx) {
    const it = vaultData[idx];
    const n = document.getElementById(`lock-n-${idx}`).value.trim().toLowerCase();
    const p = document.getElementById(`lock-p-${idx}`).value;

    if (!n || !p) {
      return showToast("Champs requis", "error");
    }

    if (hashPassword(n + p) === it.lockHash) {
      document.getElementById(`fields-${idx}`).style.display = "block";
      document.getElementById(`lock-n-${idx}`).parentElement.style.display = "none";
    } else {
      showToast("Identifiants incorrects", "error");
    }
  };
});
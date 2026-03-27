document.addEventListener("DOMContentLoaded", async () => {
  const ak = sessionStorage.getItem("ak");
  if (!ak || sessionStorage.getItem("role") !== "admin") {
    window.location.href = "index.html";
    return;
  }

  setupAutoLock(30);
  let serverData;
  try {
    serverData = await loadData();
  } catch (e) {
    showToast("Erreur de connexion", "error");
    return;
  }

  const navItems = document.querySelectorAll(".nav-item");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const btnAdd = document.getElementById("btn-add-item");
  const title = document.getElementById("view-title");
  let currentTab = "tab-contacts";
  let quill = null;

  navItems.forEach(i => {
    i.addEventListener("click", () => {
      navItems.forEach(n => n.classList.remove("active"));
      i.classList.add("active");
      const t = i.dataset.target;
      tabPanes.forEach(p => p.classList.remove("active"));
      document.getElementById(t).classList.add("active");
      currentTab = t;
      title.innerText = i.innerText;
      btnAdd.style.display = (t === "tab-contacts" || t === "tab-vault") ? "inline-flex" : "none";
      if (t === "tab-testament" && !quill) {
        initQuill();
      }
      renderCurrentTab();
    });
  });

  document.getElementById("btn-logout").addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "index.html";
  });

  function initQuill() {
    quill = new Quill('#editor', {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['link', 'image', 'video'],
          ['clean']
        ]
      }
    });
    try {
      const parsedWrapper = JSON.parse(serverData.testamentData);
      let td = parsedWrapper;
      if (parsedWrapper && parsedWrapper.adminEncrypted) {
         td = decryptData(parsedWrapper.adminEncrypted, ak);
      }
      if (td && td.content) quill.root.innerHTML = td.content;
    } catch (e) {
      try {
         const oldWrapper = decryptData(serverData.testamentData, ak);
         if(oldWrapper && oldWrapper.content) quill.root.innerHTML = oldWrapper.content;
      } catch(er){}
    }
    setInterval(saveTestament, 30000);
  }

  async function saveTestament() {
    if (!quill) return;
    const html = quill.root.innerHTML;
    const td = { content: html, lastModified: new Date().toISOString() };

    let currentTk = null;
    try {
       const keys = decryptData(serverData.secondaryKeys, ak);
       if(keys) currentTk = keys.tk;
    } catch(e){}

    const wrapperSave = {
       adminEncrypted: encryptData(JSON.stringify(td), ak),
       userEncrypted: currentTk ? encryptData(JSON.stringify(td), currentTk) : ""
    };

    const p = { action: "save", data: { testamentData: JSON.stringify(wrapperSave) } };
    try {
      await postToApi(p);
      showToast("Testament sauvegardé", "success");
      const gl = document.getElementById("global-lock");
      gl.className = "fas fa-lock";
      gl.style.color = "var(--success)";
    } catch (e) {
      showToast("Erreur sauvegarde", "error");
    }
  }

  document.getElementById("btn-pdf").addEventListener("click", () => {
    if (!quill) return;
    const opt = {
      margin: 1,
      filename: 'TESTAMENT_DERNIERES_VOLONTES.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    const d = document.createElement('div');
    d.innerHTML = `<h1 style="text-align:center;margin-bottom:20px;font-family:sans-serif;">TESTAMENT — DERNIÈRES VOLONTÉS</h1><div style="font-family:sans-serif;">${quill.root.innerHTML}</div>`;
    html2pdf().set(opt).from(d).save();
  });

  function renderCurrentTab() {
    if (currentTab === "tab-contacts") renderContacts();
    else if (currentTab === "tab-vault") renderVault();
    else if (currentTab === "tab-settings") renderSettings();
  }


  let editContactIdx = -1;
  const relSelect = document.getElementById("contact-rel");
  const relOther = document.getElementById("contact-rel-other");

  relSelect.addEventListener("change", (e) => {
    relOther.style.display = e.target.value === "Autre" ? "block" : "none";
    if(e.target.value === "Autre") relOther.required = true;
    else { relOther.required = false; relOther.value = ""; }
  });

  document.querySelectorAll(".imp-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".imp-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("contact-imp").value = btn.dataset.val;
    });
  });

  function renderContacts() {
    const c = decryptData(serverData.contacts, ak) || [];
    const g = document.getElementById("contacts-grid");
    g.innerHTML = "";
    c.forEach((cn, i) => {
      const d = document.createElement("div");
      d.className = "card contact-card";
      d.setAttribute("data-imp", cn.imp || 5);
      d.innerHTML = `
        <div class="contact-header">
          <div>
            <h3>${escapeHtml(cn.name)}</h3>
            <div style="font-size:12px;color:var(--text-sec);">${escapeHtml(cn.rel)}</div>
          </div>
          <div>
            <button class="btn btn-secondary" onclick="editContact(${i})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-danger" onclick="delContact(${i})"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <div class="contact-links">${renderLinks(cn)}</div>
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

  window.editContact = function(idx) {
    const c = decryptData(serverData.contacts, ak) || [];
    const cn = c[idx];
    if (!cn) return;
    editContactIdx = idx;
    document.getElementById("contact-modal-title").innerText = "Modifier Contact";
    document.getElementById("contact-name").value = cn.name || "";
    if (Array.from(relSelect.options).some(o => o.value === cn.rel)) {
      relSelect.value = cn.rel;
      relOther.style.display = "none";
    } else {
      relSelect.value = "Autre";
      relOther.style.display = "block";
      relOther.value = cn.rel || "";
    }

    document.querySelectorAll(".imp-btn").forEach(b => b.classList.remove("active"));
    const impVal = cn.imp || "5";
    document.querySelector(`.imp-btn[data-val="${impVal}"]`).classList.add("active");
    document.getElementById("contact-imp").value = impVal;

    document.getElementById("contact-tel").value = cn.tel || "";
    document.getElementById("contact-mail").value = cn.mail || "";
    document.getElementById("contact-wa").value = cn.wa || "";
    document.getElementById("contact-tg").value = cn.tg || "";
    document.getElementById("contact-snap").value = cn.snap || "";
    document.getElementById("contact-ig").value = cn.ig || "";
    document.getElementById("contact-msg").value = cn.msg || "";

    openModal("modal-contact");
  };

  window.delContact = async function(idx) {
    confirmDialog("Supprimer ce contact ?", async () => {
      let c = decryptData(serverData.contacts, ak) || [];
      c.splice(idx, 1);
      await saveContacts(c);
    });
  };

  async function saveContacts(c) {
    const ed = encryptData(JSON.stringify(c), ak);
    let currentEk = null;
    try {
       const keys = decryptData(serverData.secondaryKeys, ak);
       if(keys) currentEk = keys.ek;
    } catch(e){}

    const p = { action: "save", data: { contacts: ed, emergencyContacts: currentEk ? encryptData(JSON.stringify(c), currentEk) : encryptData("[]", ak) } };
    try {
      await postToApi(p);
      serverData.contacts = ed;
      renderContacts();
      showToast("Contacts mis à jour", "success");
    } catch (e) {
      showToast("Erreur", "error");
    }
  }

  document.getElementById("form-contact").addEventListener("submit", async (e) => {
    e.preventDefault();
    const relVal = relSelect.value === "Autre" ? relOther.value.trim() : relSelect.value;
    const nc = {
      name: document.getElementById("contact-name").value.trim(),
      rel: relVal,
      imp: document.getElementById("contact-imp").value,
      tel: document.getElementById("contact-tel").value.trim(),
      mail: document.getElementById("contact-mail").value.trim(),
      wa: document.getElementById("contact-wa").value.trim(),
      tg: document.getElementById("contact-tg").value.trim(),
      snap: document.getElementById("contact-snap").value.trim(),
      ig: document.getElementById("contact-ig").value.trim(),
      msg: document.getElementById("contact-msg").value.trim()
    };
    let c = decryptData(serverData.contacts, ak) || [];
    if (editContactIdx >= 0) c[editContactIdx] = nc;
    else c.push(nc);
    await saveContacts(c);
    closeModal("modal-contact");
  });



  let editVaultIdx = -1;
  const vaultCat = document.getElementById("vault-cat");
  const vaultDynamic = document.getElementById("vault-dynamic-fields");
  const vaultHasLock = document.getElementById("vault-has-lock");
  const vaultLockConfig = document.getElementById("vault-lock-config");

  const vaultTemplates = {
    "État civil / Mon identité": ["Nom", "Prénom", "Date naissance", "Lieu", "Nationalité", "Adresse", "Notes"],
    "Identifiants & MDP": ["Service", "URL", "Identifiant", "MDP", "Notes"],
    "Cartes bancaires": ["Banque", "Nom carte", "Numéro", "Expiration", "CVV", "PIN", "Notes"],
    "Documents": ["Type", "Numéro", "Dates", "Lieu", "Notes"],
    "Comptes bancaires": ["Banque", "Titulaire", "IBAN", "BIC", "N°", "Agence", "Notes"],
    "Codes & PIN": ["Nom", "Code", "Notes"],
    "Infos médicales": ["Groupe sanguin", "Allergies", "Traitements", "Médecin", "N° Sécu", "Mutuelle", "N° adhérent", "Notes"],
    "Assurances": ["Type", "Compagnie", "N° contrat", "Tél", "Échéance", "Notes"],
    "Licences": ["Service", "Clé", "Email", "Renouvellement", "Notes"],
    "Notes libres": ["Titre", "Contenu"]
  };

  function buildVaultFormFields(catName, existingData = {}) {
    vaultDynamic.innerHTML = "";
    const fields = vaultTemplates[catName] || ["Notes"];
    fields.forEach(f => {
      const div = document.createElement("div");
      div.className = "input-group";
      div.innerHTML = `<label>${escapeHtml(f)}</label>`;

      const isMasked = f.toLowerCase().includes('mdp') || f.toLowerCase().includes('pin') || f.toLowerCase().includes('cvv') || f.toLowerCase().includes('iban') || f.toLowerCase().includes('clé') || f.toLowerCase().includes('sécu');
      const val = existingData[f] || "";

      if (f.toLowerCase() === "notes" || f.toLowerCase() === "contenu" || f.toLowerCase() === "adresse") {
        div.innerHTML += `<textarea class="vault-field-input" data-key="${escapeHtml(f)}" rows="3">${escapeHtml(val)}</textarea>`;
      } else {
        div.innerHTML += `<input type="${isMasked ? 'password' : 'text'}" class="vault-field-input" data-key="${escapeHtml(f)}" value="${escapeHtml(val)}">`;
      }
      vaultDynamic.appendChild(div);
    });
  }

  vaultCat.addEventListener("change", (e) => {
    buildVaultFormFields(e.target.value);
  });

  vaultHasLock.addEventListener("change", (e) => {
    vaultLockConfig.style.display = e.target.checked ? "block" : "none";
    if (e.target.checked) {
      document.getElementById("vault-lock-name").required = true;
      document.getElementById("vault-lock-pwd").required = true;
    } else {
      document.getElementById("vault-lock-name").required = false;
      document.getElementById("vault-lock-pwd").required = false;
    }
  });

  function renderVault() {
    let vd = [];
    try {
       const parsedWrapper = JSON.parse(serverData.vaultData);
       if (parsedWrapper && parsedWrapper.adminEncrypted) {
          vd = decryptData(parsedWrapper.adminEncrypted, ak) || [];
       } else {
          vd = parsedWrapper || [];
       }
    } catch(e){
       try { vd = decryptData(serverData.vaultData, ak) || []; } catch(er){}
    }
    const sb = document.getElementById("vault-cat-sidebar");
    sb.innerHTML = '<div class="vault-cat active" data-cat="all"><i class="fas fa-th-large"></i> Tout</div>';

    const m = new Set(vd.map(x => x.cat));
    m.forEach(cat => {
      const d = document.createElement("div");
      d.className = "vault-cat";
      d.setAttribute("data-cat", cat);
      d.innerHTML = `<i class="fas fa-folder"></i> ${escapeHtml(cat)}`;
      sb.appendChild(d);
    });

    const g = document.getElementById("vault-items-grid");
    g.className = "grid-cards";
    g.innerHTML = "";

    vd.forEach((it, i) => {
      const d = document.createElement("div");
      d.className = "card vault-item-card";
      let contentHtml = `<div class="contact-header"><div><h3>${escapeHtml(it.title)}</h3><div style="font-size:12px;color:var(--text-sec);">${escapeHtml(it.cat)}</div></div><div><button class="btn btn-secondary" onclick="editVault(${i})"><i class="fas fa-edit"></i></button><button class="btn btn-danger" onclick="delVault(${i})"><i class="fas fa-trash"></i></button></div></div>`;

      if(it.isLocked) {
         contentHtml += `<div style="padding:12px;background:var(--bg-input);border-radius:var(--radius-sm);text-align:center;"><i class="fas fa-lock" style="color:var(--warning);font-size:24px;margin-bottom:8px;"></i><p style="font-size:12px;color:var(--text-sec);">Élément verrouillé</p></div>`;
      } else {
         contentHtml += Object.entries(it.fields).map(([k, v]) => `<div class="vault-field"><div class="vault-field-header">${escapeHtml(k)}</div><div class="vault-field-value"><span>${escapeHtml(v)}</span><div class="vault-field-actions"><button onclick="copyToClipboard('${escapeHtml(v)}')"><i class="fas fa-copy"></i></button></div></div></div>`).join('');
      }
      d.innerHTML = contentHtml;
      g.appendChild(d);
    });

    sb.querySelectorAll(".vault-cat").forEach(c => {
      c.addEventListener("click", () => {
        sb.querySelectorAll(".vault-cat").forEach(x => x.classList.remove("active"));
        c.classList.add("active");
        const filterCat = c.dataset.cat;
        Array.from(g.children).forEach(card => {
           if(filterCat === "all" || card.querySelector(".contact-header div div").innerText === filterCat) {
             card.style.display = "flex";
           } else {
             card.style.display = "none";
           }
        });
      });
    });
  }

  window.editVault = function(idx) {
    let vd = [];
    try {
       const parsedWrapper = JSON.parse(serverData.vaultData);
       if (parsedWrapper && parsedWrapper.adminEncrypted) {
          vd = decryptData(parsedWrapper.adminEncrypted, ak) || [];
       } else {
          vd = parsedWrapper || [];
       }
    } catch(e){
       try { vd = decryptData(serverData.vaultData, ak) || []; } catch(er){}
    }
    const it = vd[idx];
    if (!it) return;
    editVaultIdx = idx;
    document.getElementById("vault-modal-title").innerText = "Modifier Élément";
    vaultCat.value = it.cat;
    document.getElementById("vault-title").value = it.title;
    buildVaultFormFields(it.cat, it.fields);

    if (it.isLocked && it.cat !== "État civil / Mon identité") {
      vaultHasLock.checked = true;
      vaultLockConfig.style.display = "block";
    } else {
      vaultHasLock.checked = false;
      vaultLockConfig.style.display = "none";
    }

    if (it.cat === "État civil / Mon identité") {
      vaultCat.disabled = true;
      vaultHasLock.disabled = true;
    } else {
      vaultCat.disabled = false;
      vaultHasLock.disabled = false;
    }

    openModal("modal-vault");
  };

  window.delVault = async function(idx) {
    let vd = [];
    try {
       const parsedWrapper = JSON.parse(serverData.vaultData);
       if (parsedWrapper && parsedWrapper.adminEncrypted) {
          vd = decryptData(parsedWrapper.adminEncrypted, ak) || [];
       } else {
          vd = parsedWrapper || [];
       }
    } catch(e){
       try { vd = decryptData(serverData.vaultData, ak) || []; } catch(er){}
    }
    if(vd[idx] && vd[idx].cat === "État civil / Mon identité") {
       showToast("Impossible de supprimer la catégorie obligatoire", "error");
       return;
    }
    confirmDialog("Supprimer cet élément ?", async () => {
      vd.splice(idx, 1);
      await saveVault(vd);
    });
  };

  async function saveVault(v) {
    let currentVk = null;
    try {
       const keys = decryptData(serverData.secondaryKeys, ak);
       if(keys) currentVk = keys.vk;
    } catch(e){}

    const wrapperSave = {
       adminEncrypted: encryptData(JSON.stringify(v), ak),
       userEncrypted: currentVk ? encryptData(JSON.stringify(v), currentVk) : ""
    };

    const ed = JSON.stringify(wrapperSave);
    const p = { action: "save", data: { vaultData: ed } };
    try {
      await postToApi(p);
      serverData.vaultData = ed;
      renderVault();
      showToast("Vault mis à jour", "success");
    } catch (e) {
      showToast("Erreur", "error");
    }
  }

  document.getElementById("form-vault").addEventListener("submit", async (e) => {
    e.preventDefault();
    const cat = vaultCat.value;
    const isLocked = vaultHasLock.checked;
    const lockName = document.getElementById("vault-lock-name").value.trim().toLowerCase();
    const lockPwd = document.getElementById("vault-lock-pwd").value;

    const fieldsData = {};
    document.querySelectorAll(".vault-field-input").forEach(inp => {
       fieldsData[inp.dataset.key] = inp.value;
    });

    const ni = {
      id: Date.now().toString(),
      cat: cat,
      title: document.getElementById("vault-title").value.trim(),
      fields: fieldsData,
      isLocked: isLocked,
      lockHash: isLocked ? hashPassword(lockName + lockPwd) : null
    };

    let vd = [];
    try {
       const parsedWrapper = JSON.parse(serverData.vaultData);
       if (parsedWrapper && parsedWrapper.adminEncrypted) {
          vd = decryptData(parsedWrapper.adminEncrypted, ak) || [];
       } else {
          vd = parsedWrapper || [];
       }
    } catch(e){
       try { vd = decryptData(serverData.vaultData, ak) || []; } catch(er){}
    }
    if (editVaultIdx >= 0) vd[editVaultIdx] = ni;
    else vd.push(ni);

    await saveVault(vd);
    closeModal("modal-vault");
  });


  btnAdd.addEventListener("click", () => {
    if (currentTab === "tab-contacts") {
      editContactIdx = -1;
      document.getElementById("contact-modal-title").innerText = "Nouveau Contact";
      document.getElementById("form-contact").reset();
      relSelect.value = "Mère";
      relOther.style.display = "none";
      document.querySelectorAll(".imp-btn").forEach(b => b.classList.remove("active"));
      document.querySelector(`.imp-btn[data-val="5"]`).classList.add("active");
      document.getElementById("contact-imp").value = "5";
      openModal("modal-contact");
    } else if (currentTab === "tab-vault") {
      editVaultIdx = -1;
      document.getElementById("vault-modal-title").innerText = "Nouvel Élément Vault";
      document.getElementById("form-vault").reset();
      vaultCat.disabled = false;
      vaultHasLock.disabled = false;

      let vd = [];
      try {
         const parsedWrapper = JSON.parse(serverData.vaultData);
         if (parsedWrapper && parsedWrapper.adminEncrypted) {
            vd = decryptData(parsedWrapper.adminEncrypted, ak) || [];
         } else {
            vd = parsedWrapper || [];
         }
      } catch(e){
         try { vd = decryptData(serverData.vaultData, ak) || []; } catch(er){}
      }
      const hasEtatCivil = vd.some(x => x.cat === "État civil / Mon identité");

      if(!hasEtatCivil) {
         vaultCat.value = "État civil / Mon identité";
         vaultCat.disabled = true;
      } else {
         vaultCat.value = "Identifiants & MDP";
      }
      buildVaultFormFields(vaultCat.value);
      vaultLockConfig.style.display = "none";
      openModal("modal-vault");
    }
  });



  function renderSettings() {
    const lc = document.getElementById("logs-container");
    lc.innerHTML = "";
    if (serverData.publicAccessLogs) {
      const logs = JSON.parse(serverData.publicAccessLogs).reverse();
      logs.forEach(l => {
        const d = document.createElement("div");
        d.style.marginBottom = "8px";
        d.style.fontSize = "12px";
        d.innerHTML = `<strong style="color:var(--accent);">${escapeHtml(l.date)}</strong> - [${escapeHtml(l.type)}] IP: ${escapeHtml(l.ip)} | Nom: ${escapeHtml(l.nomComplet || 'N/A')} <br><span style="color:var(--text-muted);">${escapeHtml(l.userAgent)}</span>`;
        lc.appendChild(d);
      });
    }
    const msg = decryptData(serverData.emergencyMessage, ak) || "";
    document.getElementById("settings-em-msg").value = msg;
  }

  document.getElementById("btn-test-mail").addEventListener("click", async () => {
    try {
      await postToApi({ action: "testEmail" });
      showToast("Email test envoyé !", "success");
    } catch (e) {
      showToast("Erreur d'envoi", "error");
    }
  });

  document.getElementById("btn-erase-all").addEventListener("click", () => {
    confirmDialog("ATTENTION ! Vous allez tout effacer. Confirmer ?", async () => {
      try {
        const p = {
          action: "save",
          data: {
            adminHash: "", emergencyHash: "", vaultHash: "", testamentHash: "",
            contacts: "", emergencyContacts: "", vaultData: "", testamentData: "",
            emergencyMessage: "", emergencyMessageForEmergency: "", publicAccessLogs: "[]"
          }
        };
        await postToApi(p);
        sessionStorage.clear();
        window.location.href = "setup.html";
      } catch (e) {
        showToast("Erreur", "error");
      }
    });
  });

  document.getElementById("form-change-codes").addEventListener("submit", async (e) => {
    e.preventDefault();
    const na = document.getElementById("new-admin").value;
    const nu = document.getElementById("new-em").value;
    const nv = document.getElementById("new-vault").value;
    const nt = document.getElementById("new-test").value;
    const nmsg = document.getElementById("settings-em-msg").value;
    const update = {};
    let newAk = ak;
    let newEk = ak;

    if (na) {
      if (na.length < 8) return showToast("Admin >= 8", "error");
      update.adminHash = hashPassword(na);
      newAk = na;
    }
    if (nu) {
      if (nu.length < 6) return showToast("Urgence >= 6", "error");
      update.emergencyHash = hashPassword(nu);
      newEk = nu;
    }
    if (nv) {
      if (nv.length < 6) return showToast("Vault >= 6", "error");
      update.vaultHash = hashPassword(nv);
    }
    if (nt) {
      if (nt.length < 6) return showToast("Testament >= 6", "error");
      update.testamentHash = hashPassword(nt);
    }

    try {
      let keys = null;
      try {
         keys = decryptData(serverData.secondaryKeys, ak);
      } catch(e){}
      if(!keys) keys = {ek:"", vk:"", tk:""};

      if(nu) keys.ek = nu;
      if(nv) keys.vk = nv;
      if(nt) keys.tk = nt;

      update.secondaryKeys = encryptData(JSON.stringify(keys), newAk);

      if (nmsg || na || nu) {
        const msgEd = encryptData(nmsg || decryptData(serverData.emergencyMessage, ak) || "", newAk);
        const msgEdEm = encryptData(nmsg || decryptData(serverData.emergencyMessage, ak) || "", keys.ek);
        update.emergencyMessage = msgEd;
        update.emergencyMessageForEmergency = msgEdEm;
      }
      if (na || nu) {
        const c = decryptData(serverData.contacts, ak) || [];
        const cEd = encryptData(JSON.stringify(c), newAk);
        const cEdEm = encryptData(JSON.stringify(c), keys.ek);
        update.contacts = cEd;
        update.emergencyContacts = cEdEm;
      }
      if (na || nv || nt) {
        let vd = [];
        try {
           const parsedWrapper = JSON.parse(serverData.vaultData);
           if (parsedWrapper && parsedWrapper.adminEncrypted) {
              vd = decryptData(parsedWrapper.adminEncrypted, ak) || [];
           } else {
              vd = parsedWrapper || [];
           }
        } catch(e){
           try { vd = decryptData(serverData.vaultData, ak) || []; } catch(er){}
        }
        const vdSave = {
           adminEncrypted: encryptData(JSON.stringify(vd), newAk),
           userEncrypted: encryptData(JSON.stringify(vd), keys.vk)
        };
        update.vaultData = JSON.stringify(vdSave);

        let td = null;
        try {
           const parsedWrapper = JSON.parse(serverData.testamentData);
           if (parsedWrapper && parsedWrapper.adminEncrypted) {
              td = decryptData(parsedWrapper.adminEncrypted, ak);
           } else {
              td = parsedWrapper;
           }
        } catch(e){
           try { td = decryptData(serverData.testamentData, ak); } catch(er){}
        }
        if(!td) td = { content: "", lastModified: null };

        const tdSave = {
           adminEncrypted: encryptData(JSON.stringify(td), newAk),
           userEncrypted: encryptData(JSON.stringify(td), keys.tk)
        };
        update.testamentData = JSON.stringify(tdSave);
        if(na) sessionStorage.setItem("ak", newAk);
      }
      if (Object.keys(update).length > 0) {
        await postToApi({ action: "save", data: update });
        showToast("Codes et données re-chiffrés !", "success");
        serverData = await loadData();
        renderSettings();
      }
    } catch (er) {
      showToast("Erreur rechiffrement", "error");
    }
  });

  renderCurrentTab();
});
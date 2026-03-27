document.addEventListener("DOMContentLoaded", async () => {
  const d = await loadData();
  if (d.adminHash) {
    window.location.href = "index.html";
    return;
  }

  const adminInput = document.getElementById("admin-code");
  const strengthBar = document.getElementById("admin-strength");

  adminInput.addEventListener("input", e => {
    const v = e.target.value;
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;

    strengthBar.className = "pwd-strength-bar";
    if (s <= 1) {
      strengthBar.classList.add("weak");
    } else if (s <= 2) {
      strengthBar.classList.add("medium");
    } else {
      strengthBar.classList.add("strong");
    }
  });

  document.getElementById("btn-save").addEventListener("click", async (e) => {
    e.preventDefault();
    const a = adminInput.value;
    const ac = document.getElementById("admin-confirm").value;
    const u = document.getElementById("em-code").value;
    const uc = document.getElementById("em-confirm").value;
    const v = document.getElementById("vault-code").value;
    const vc = document.getElementById("vault-confirm").value;
    const t = document.getElementById("test-code").value;
    const tc = document.getElementById("test-confirm").value;
    const msg = document.getElementById("em-msg").value;

    if (a.length < 8 || u.length < 6 || v.length < 6 || t.length < 6) {
      showToast("Vérifiez la longueur des codes.", "error");
      return;
    }

    if (a !== ac || u !== uc || v !== vc || t !== tc) {
      showToast("Les confirmations ne correspondent pas.", "error");
      return;
    }

    const codes = [a, u, v, t];
    const unique = new Set(codes);
    if (unique.size !== 4) {
      showToast("Les 4 codes doivent être totalement différents.", "error");
      return;
    }

    const p = {
      action: "save",
      data: {
        adminHash: hashPassword(a),
        emergencyHash: hashPassword(u),
        vaultHash: hashPassword(v),
        testamentHash: hashPassword(t),
        contacts: encryptData("[]", a),
        emergencyContacts: encryptData("[]", u),
        vaultData: JSON.stringify({adminEncrypted: encryptData("[]", a), userEncrypted: encryptData("[]", v)}),
        testamentData: JSON.stringify({adminEncrypted: encryptData(JSON.stringify({ content: "", lastModified: null }), a), userEncrypted: encryptData(JSON.stringify({ content: "", lastModified: null }), t)}),
        emergencyMessage: encryptData(msg, a),
        emergencyMessageForEmergency: encryptData(msg, u),
        secondaryKeys: encryptData(JSON.stringify({ek: u, vk: v, tk: t}), a)
      }
    };

    try {
      document.getElementById("btn-save").disabled = true;
      await postToApi(p);
      showToast("Configuration terminée !", "success");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
    } catch (er) {
      showToast("Erreur lors de la sauvegarde.", "error");
      document.getElementById("btn-save").disabled = false;
    }
  });
});
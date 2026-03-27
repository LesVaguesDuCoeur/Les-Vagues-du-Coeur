document.addEventListener("DOMContentLoaded", async () => {
  const tk = sessionStorage.getItem("tk");
  if (!tk || sessionStorage.getItem("role") !== "testament") {
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
  const tCont = document.getElementById("testament-content");
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
      await sendAlertThenRedirect("testamentAccess", null, nm);
      mId.classList.remove("show");
      tCont.style.display = "flex";
      loadTestament();
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

  function loadTestament() {
    try {
      const ak = sessionStorage.getItem("ak") || null;
      let parsedWrapper = null;
      try {
         parsedWrapper = JSON.parse(serverData.testamentData);
      } catch(e) {}

      let td = null;

      if (parsedWrapper && parsedWrapper.adminEncrypted) {
         if (ak) {
            td = decryptData(parsedWrapper.adminEncrypted, ak);
         } else {
            td = decryptData(parsedWrapper.userEncrypted, tk);
         }
      } else {
         try {
            td = decryptData(serverData.testamentData, ak || tk);
         } catch(e){}
      }

      if (td && td.content) {
        document.getElementById("content-display").innerHTML = td.content;
      } else {
        document.getElementById("content-display").innerHTML = "<p style='color:#666;font-style:italic;'>Aucun testament enregistré.</p>";
      }
    } catch (e) {
      showToast("Erreur déchiffrement", "error");
    }
  }

  document.getElementById("btn-pdf").addEventListener("click", () => {
    const c = document.getElementById("content-display").innerHTML;
    const opt = {
      margin: 1,
      filename: 'TESTAMENT_DERNIERES_VOLONTES.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    const d = document.createElement('div');
    d.innerHTML = `
      <h1 style="text-align:center;margin-bottom:20px;font-family:sans-serif;color:#000;">TESTAMENT — DERNIÈRES VOLONTÉS</h1>
      <div style="font-family:sans-serif;color:#000;">${c}</div>
    `;
    html2pdf().set(opt).from(d).save();
  });
});
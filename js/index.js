document.addEventListener('DOMContentLoaded', async function() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function(e){});
  }
  var state = { failCount: 0, lockUntil: 0 };
  var d = null;
  try {
    d = await loadData();
    if (!d.isSetup) {
      window.location.href = 'setup.html';
      return;
    }
  } catch (e) {
    showToast("Erreur de connexion", "error");
  }

  var b = document.getElementById('btn-login');
  var p = document.getElementById('login-pwd');

  p.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') b.click();
  });

  b.addEventListener('click', async function() {
    var n = Date.now();
    if (n < state.lockUntil) {
      var sec = Math.ceil((state.lockUntil - n) / 1000);
      showToast("Bloqué. Attendez " + sec + "s", "error");
      return;
    }
    var v = p.value;
    if (!v) return;
    b.disabled = true;
    b.textContent = "Vérification...";
    var h = await hashPassword(v);

    if (h === d.adminHash) {
      sessionStorage.setItem('ak', v);
      window.location.href = 'admin.html';
      return;
    }

    if (h === d.emergencyHash) {
      sessionStorage.setItem('ek', v);
      await sendAlertThenRedirect('emergencyAccess', 'emergency.html');
      return;
    }

    if (h === d.vaultHash) {
      p.value = "";
      b.disabled = false;
      b.textContent = "Valider";
      var ht = '<h3>Accès Vault</h3><p class="mb-4">Entrez votre Prénom et le mot de passe Urgence.</p><input type="text" id="m-nom" class="input-field mb-2" placeholder="Prénom"><input type="password" id="m-urg" class="input-field" placeholder="Mot de passe Urgence"><div class="flex gap-4 mt-6"><button id="m-cancel" class="btn btn-secondary flex-1">Annuler</button><button id="m-ok" class="btn btn-primary flex-1">Accéder</button></div>';
      openModal(ht);
      document.getElementById('m-cancel').onclick = function() { closeModal(); };
      document.getElementById('m-ok').onclick = async function() {
        var mNom = document.getElementById('m-nom').value;
        var mUrg = document.getElementById('m-urg').value;
        if (!mNom || !mUrg) { showToast("Remplissez tout", "error"); return; }
        var hu = await hashPassword(mUrg);
        if (hu !== d.emergencyHash) {
          showToast("MDP Urgence invalide", "error");
          return;
        }
        sessionStorage.setItem('vk', v);
        sessionStorage.setItem('ek', mUrg);
        closeModal();
        b.disabled = true;
        b.textContent = "Ouverture...";
        await sendAlertThenRedirect('vaultAccess', 'vault.html', { nomComplet: mNom });
      };
      return;
    }

    if (h === d.testamentHash) {
      p.value = "";
      b.disabled = false;
      b.textContent = "Valider";
      var ht2 = '<h3>Accès Testament</h3><p class="mb-4">Entrez votre Prénom et le mot de passe Urgence.</p><input type="text" id="m-nom" class="input-field mb-2" placeholder="Prénom"><input type="password" id="m-urg" class="input-field" placeholder="Mot de passe Urgence"><div class="flex gap-4 mt-6"><button id="m-cancel" class="btn btn-secondary flex-1">Annuler</button><button id="m-ok" class="btn btn-primary flex-1">Accéder</button></div>';
      openModal(ht2);
      document.getElementById('m-cancel').onclick = function() { closeModal(); };
      document.getElementById('m-ok').onclick = async function() {
        var mNom = document.getElementById('m-nom').value;
        var mUrg = document.getElementById('m-urg').value;
        if (!mNom || !mUrg) { showToast("Remplissez tout", "error"); return; }
        var hu = await hashPassword(mUrg);
        if (hu !== d.emergencyHash) {
          showToast("MDP Urgence invalide", "error");
          return;
        }
        sessionStorage.setItem('tk', v);
        sessionStorage.setItem('ek', mUrg);
        closeModal();
        b.disabled = true;
        b.textContent = "Ouverture...";
        await sendAlertThenRedirect('testamentAccess', 'testament.html', { nomComplet: mNom });
      };
      return;
    }

    state.failCount++;
    p.value = "";
    b.disabled = false;
    b.textContent = "Valider";
    if (state.failCount >= 10) {
      state.lockUntil = Date.now() + 600000;
      await sendAlertThenRedirect('suspiciousActivity', null);
      showToast("Bloqué 10 min. Alerte envoyée.", "error");
    } else if (state.failCount >= 5) {
      state.lockUntil = Date.now() + 120000;
      showToast("Bloqué 2 min.", "error");
    } else if (state.failCount >= 3) {
      state.lockUntil = Date.now() + 30000;
      showToast("Bloqué 30 sec.", "error");
    } else {
      showToast("Mot de passe incorrect", "error");
    }
  });
});

document.addEventListener('DOMContentLoaded', async function() {
  if (getLockout() > 0) {
    showToast('Compte bloqué. Veuillez patienter.', 'error');
    document.getElementById('login-password').disabled = true;
    document.getElementById('btn-login').disabled = true;
    return;
  }

  var lb = document.getElementById('login-box');
  var ldb = document.getElementById('loading-box');

  document.getElementById('btn-login').addEventListener('click', async function() {
    var p = document.getElementById('login-password').value;
    if (!p) return;

    lb.classList.add('hidden');
    ldb.classList.remove('hidden');

    try {
      var d = await loadData();
      if (!d.isSetup) {
        window.location.href = 'setup.html';
        return;
      }

      var h = hashPassword(p);
      if (h === d.adminHash) {
        sessionStorage.setItem('ak', p);
        window.location.href = 'admin.html';
      } else if (h === d.emergencyHash) {
        sessionStorage.setItem('ek', p);
        await sendAlertThenRedirect('emergencyAccess', 'emergency.html');
      } else if (h === d.vaultHash) {
        sessionStorage.setItem('vk', p);
        openModal('<div class="text-center"><h3 class="mb-4">Identité</h3><input type="text" id="nom-complet" placeholder="Votre nom complet" class="mb-4"><div class="d-flex justify-between gap-3"><button id="btn-cancel" style="background:#555;">Annuler</button><button id="btn-confirm" class="success">Valider</button></div></div>');
        document.getElementById('btn-cancel').onclick = function() {
          closeModal();
          sessionStorage.removeItem('vk');
          lb.classList.remove('hidden');
          ldb.classList.add('hidden');
          document.getElementById('login-password').value = '';
        };
        document.getElementById('btn-confirm').onclick = async function() {
          var n = document.getElementById('nom-complet').value;
          if (!n) return showToast('Nom requis', 'error');
          this.disabled = true;
          this.textContent = 'En cours...';
          await sendAlertThenRedirect('vaultAccess', 'vault.html', { nomComplet: n });
        };
      } else if (h === d.testamentHash) {
        sessionStorage.setItem('tk', p);
        openModal('<div class="text-center"><h3 class="mb-4">Identité</h3><input type="text" id="nom-complet" placeholder="Votre nom complet" class="mb-4"><div class="d-flex justify-between gap-3"><button id="btn-cancel" style="background:#555;">Annuler</button><button id="btn-confirm" class="success">Valider</button></div></div>');
        document.getElementById('btn-cancel').onclick = function() {
          closeModal();
          sessionStorage.removeItem('tk');
          lb.classList.remove('hidden');
          ldb.classList.add('hidden');
          document.getElementById('login-password').value = '';
        };
        document.getElementById('btn-confirm').onclick = async function() {
          var n = document.getElementById('nom-complet').value;
          if (!n) return showToast('Nom requis', 'error');
          this.disabled = true;
          this.textContent = 'En cours...';
          await sendAlertThenRedirect('testamentAccess', 'testament.html', { nomComplet: n });
        };
      } else {
        var l = await addLockout();
        if (l > 0) {
          showToast('Mot de passe incorrect. Bloqué pour ' + l + ' secondes.', 'error');
          document.getElementById('login-password').disabled = true;
          document.getElementById('btn-login').disabled = true;
        } else {
          showToast('Mot de passe incorrect.', 'error');
        }
        lb.classList.remove('hidden');
        ldb.classList.add('hidden');
        document.getElementById('login-password').value = '';
      }
    } catch (e) {
      showToast('Erreur de connexion', 'error');
      lb.classList.remove('hidden');
      ldb.classList.add('hidden');
    }
  });

  document.getElementById('login-password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') document.getElementById('btn-login').click();
  });
});
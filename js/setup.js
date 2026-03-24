document.addEventListener('DOMContentLoaded', async function() {
  try {
    var d = await loadData();
    if (d.isSetup) {
      window.location.href = 'index.html';
      return;
    }
  } catch (e) {
    showToast("Erreur de connexion", "error");
  }

  var b = document.getElementById('btn-setup');
  b.addEventListener('click', async function() {
    var sa = document.getElementById('s-admin').value;
    var sac = document.getElementById('s-admin-c').value;
    var su = document.getElementById('s-urg').value;
    var suc = document.getElementById('s-urg-c').value;
    var sv = document.getElementById('s-vault').value;
    var svc = document.getElementById('s-vault-c').value;
    var st = document.getElementById('s-test').value;
    var stc = document.getElementById('s-test-c').value;
    var sm = document.getElementById('s-msg').value;

    if (!sa || !su || !sv || !st) {
      showToast("Tous les mots de passe sont requis", "error");
      return;
    }
    if (sa.length < 8) { showToast("Admin min 8 caractères", "error"); return; }
    if (su.length < 6 || sv.length < 6 || st.length < 6) { showToast("Autres min 6 caractères", "error"); return; }
    if (sa !== sac || su !== suc || sv !== svc || st !== stc) {
      showToast("Les confirmations ne correspondent pas", "error");
      return;
    }
    var p = [sa, su, sv, st];
    var u = new Set(p);
    if (u.size !== 4) {
      showToast("Les 4 mots de passe doivent être DIFFÉRENTS", "error");
      return;
    }

    b.disabled = true;
    b.textContent = "Création du coffre-fort...";

    var ha = await hashPassword(sa);
    var hu = await hashPassword(su);
    var hv = await hashPassword(sv);
    var ht = await hashPassword(st);

    var eu = encryptData(su, sa);
    var ev = encryptData(sv, sa);
    var et = encryptData(st, sa);

    var nd = {
      isSetup: true,
      adminHash: ha,
      emergencyHash: hu,
      vaultHash: hv,
      testamentHash: ht,
      encryptedEmergencyPassword: eu,
      encryptedVaultPassword: ev,
      encryptedTestamentPassword: et,
      contacts: encryptData([], sa),
      emergencyContacts: encryptData([], su),
      vaultData: encryptData([], sv),
      testamentData: encryptData({ identity: {}, content: '', lastModified: null }, st),
      emergencyMessage: encryptData(sm, sa),
      emergencyMessageForEmergency: encryptData(sm, su),
      accessLogs: encryptData([], sa),
      publicAccessLogs: []
    };

    try {
      var r = await postToApi({ action: 'setup', data: nd });
      if (r.status === 'success') {
        showToast("Installation terminée", "success");
        setTimeout(function() {
          window.location.href = 'index.html';
        }, 1500);
      } else {
        b.disabled = false;
        b.textContent = "Terminer l'installation";
        showToast("Erreur serveur", "error");
      }
    } catch (e) {
      b.disabled = false;
      b.textContent = "Terminer l'installation";
      showToast("Erreur réseau", "error");
    }
  });
});

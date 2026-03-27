document.addEventListener('DOMContentLoaded', async function() {
  document.getElementById('btn-setup').addEventListener('click', async function() {
    var a = document.getElementById('admin-pwd').value;
    var ac = document.getElementById('admin-pwd-confirm').value;
    var u = document.getElementById('urg-pwd').value;
    var uc = document.getElementById('urg-pwd-confirm').value;
    var v = document.getElementById('vault-pwd').value;
    var vc = document.getElementById('vault-pwd-confirm').value;
    var t = document.getElementById('test-pwd').value;
    var tc = document.getElementById('test-pwd-confirm').value;
    var m = document.getElementById('urg-msg').value;

    if (a.length < 8) return showToast('Admin: min 8 car.', 'error');
    if (a !== ac) return showToast('Admin: mdp !=', 'error');
    if (u.length < 6 || v.length < 6 || t.length < 6) return showToast('Autres: min 6 car.', 'error');
    if (u !== uc || v !== vc || t !== tc) return showToast('Confirmer mdp', 'error');

    var s = new Set([a, u, v, t]);
    if (s.size !== 4) return showToast('Mots de passe doivent être uniques', 'error');

    var b = this;
    b.disabled = true;
    b.textContent = 'En cours...';

    var d = {
      isSetup: true,
      adminHash: hashPassword(a),
      emergencyHash: hashPassword(u),
      vaultHash: hashPassword(v),
      testamentHash: hashPassword(t),
      encryptedEmergencyPassword: encryptData(u, a),
      encryptedVaultPassword: encryptData(v, a),
      encryptedTestamentPassword: encryptData(t, a),
      contacts: encryptData([], a),
      emergencyContacts: encryptData([], u),
      vaultData: encryptData([], v),
      testamentData: encryptData({ identity: { nom: "", prenom: "", dateNaissance: "", lieuNaissance: "", nationalite: "", adresse: "" }, content: "", lastModified: null }, t),
      emergencyMessage: encryptData(m, a),
      emergencyMessageForEmergency: encryptData(m, u),
      accessLogs: encryptData([], a),
      publicAccessLogs: []
    };

    try {
      await postToApi({ action: 'setup', data: d });
      sessionStorage.setItem('ak', a);
      window.location.href = 'admin.html';
    } catch (e) {
      b.disabled = false;
      b.textContent = 'Finaliser l\'installation';
      showToast('Erreur', 'error');
    }
  });
});
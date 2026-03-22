document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('setup-form');
  const adminPwd = document.getElementById('admin-pwd');
  const emergencyPwd = document.getElementById('emergency-pwd');
  const btnSetup = document.getElementById('btn-setup');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (adminPwd.value === emergencyPwd.value) {
      alert("Les mots de passe doivent être différents.");
      return;
    }

    if (adminPwd.value.length < 8) {
      alert("Le mot de passe admin doit faire au moins 8 caractères.");
      return;
    }

    showLoader();
    btnSetup.disabled = true;

    const adminHash = CryptoJS.SHA256(adminPwd.value).toString();
    const emergencyHash = CryptoJS.SHA256(emergencyPwd.value).toString();

    const emptyContacts = encryptData([], adminPwd.value);
    const emptyEmergencyContacts = encryptData([], emergencyPwd.value);

    const initialData = {
      isSetup: true,
      adminHash: adminHash,
      emergencyHash: emergencyHash,
      contacts: emptyContacts,
      emergencyContacts: emptyEmergencyContacts,
      notes: encryptData("", adminPwd.value)
    };

    const res = await postToApi(initialData);

    hideLoader();
    if (res && res.success) {
      sessionStorage.setItem('adminKey', adminPwd.value);
      sessionStorage.setItem('adminHash', adminHash);
      window.location.href = 'admin.html';
    } else {
      alert("Erreur lors de l'enregistrement. Veuillez réessayer.");
      btnSetup.disabled = false;
    }
  });
});
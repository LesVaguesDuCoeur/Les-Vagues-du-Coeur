document.addEventListener('DOMContentLoaded', async () => {
    // Clear session storage on load
    sessionStorage.clear();

    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const setupLink = document.getElementById('setup-link');

    const emergencyModal = document.getElementById('emergency-modal');
    const emergencyForm = document.getElementById('emergency-form');
    const btnCancelEmergency = document.getElementById('btn-cancel-emergency');

    let dbData = {};
    let targetSection = null; // 'vault' or 'testament'
    let enteredPassword = null; // Store the vault/testament password to pass to next page

    // Load initial data to check if setup is needed
    try {
        showLoader();
        dbData = await loadFromApi();
        hideLoader();

        if (!dbData.contactHash) {
            setupLink.classList.remove('hidden');
        }
    } catch (e) {
        hideLoader();
        console.error("Erreur de chargement", e);
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!dbData.contactHash) {
            return showToast("L'application n'est pas configurée. Cliquez sur le lien d'initialisation.", 'warning');
        }

        const pwd = passwordInput.value;
        const hash = await hashSHA256(pwd);

        if (hash === dbData.contactHash) {
            sessionStorage.setItem('contactKey', pwd);
            window.location.href = 'emergency.html';
        } else if (hash === dbData.adminHash) {
            sessionStorage.setItem('adminKey', pwd);
            window.location.href = 'admin.html';
        } else if (hash === dbData.vaultHash) {
            targetSection = 'vault';
            enteredPassword = pwd;
            openEmergencyModal();
        } else if (hash === dbData.testamentHash) {
            targetSection = 'testament';
            enteredPassword = pwd;
            openEmergencyModal();
        } else {
            showToast("Mot de passe incorrect", "error");
            passwordInput.value = '';
        }
    });

    function openEmergencyModal() {
        emergencyModal.classList.remove('hidden');
        document.getElementById('emergency-name').focus();
    }

    function closeEmergencyModal() {
        emergencyModal.classList.add('hidden');
        emergencyForm.reset();
        passwordInput.value = '';
        targetSection = null;
        enteredPassword = null;
    }

    btnCancelEmergency.addEventListener('click', closeEmergencyModal);

    emergencyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('emergency-name').value;
        const contactPwd = document.getElementById('emergency-contact-pwd').value;

        const contactHash = await hashSHA256(contactPwd);

        if (contactHash !== dbData.contactHash) {
            return showToast("Mot de passe CONTACT incorrect", "error");
        }

        showLoader();
        try {
            // Log the access via email
            const sectionName = targetSection === 'vault' ? 'Fiche Personnelle' : 'Testament';
            const logName = targetSection === 'vault' ? `Fiche Personnelle: ${name}` : name;

            await postToApi({
                action: 'emergencyAccess',
                name: logName,
                section: sectionName,
                timestamp: new Date().toLocaleString('fr-FR')
            });

            // Set session keys
            sessionStorage.setItem('contactKey', contactPwd);
            sessionStorage.setItem(`${targetSection}Key`, enteredPassword);

            // Redirect
            window.location.href = `${targetSection}.html`;

        } catch (error) {
            hideLoader();
            showToast("Erreur lors de la validation d'accès", "error");
            console.error(error);
        }
    });
});

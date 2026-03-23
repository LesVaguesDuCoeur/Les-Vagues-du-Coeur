document.addEventListener('DOMContentLoaded', async () => {
    const loginContainer = document.getElementById('login-container');

    // Render initial login box
    function renderLoginBox() {
        loginContainer.innerHTML = `
            <div class="login-box fade-in">
                <div class="login-input-group">
                    <input type="password" id="passwordInput" class="login-input" placeholder="••••••••" autofocus>
                    <div id="errorMsg" class="error-message"></div>
                </div>
                <button id="submitBtn" class="btn btn-icon">
                    <i class="fas fa-lock text-xl"></i>
                </button>
            </div>
        `;

        document.getElementById('submitBtn').addEventListener('click', handleLogin);
        document.getElementById('passwordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }

    renderLoginBox();

    let attemptCount = 0;
    let blockUntil = 0;

    async function handleLogin() {
        const now = Date.now();
        if (now < blockUntil) {
            const remaining = Math.ceil((blockUntil - now) / 1000);
            document.getElementById('errorMsg').innerText = `Bloqué. Réessayez dans ${remaining}s`;
            return;
        }

        const pwdInput = document.getElementById('passwordInput');
        const password = pwdInput.value;
        const errorMsg = document.getElementById('errorMsg');
        const btn = document.getElementById('submitBtn');

        if (!password) {
            errorMsg.innerText = "Saisissez un code";
            return;
        }

        btn.innerHTML = '<span class="loader"></span>';
        pwdInput.disabled = true;

        try {
            const data = await api.load();

            if (!data.isSetup) {
                window.location.href = 'setup.html';
                return;
            }

            const inputHash = hashPassword(password);

            if (inputHash === data.adminHash) {
                sessionStorage.setItem('adminKey', password);
                window.location.href = 'admin.html';
            }
            else if (inputHash === data.emergencyHash) {
                sessionStorage.setItem('emergencyKey', password);
                const details = await getTrackingDetails();
                await api.emergencyAccess(details);
                window.location.href = 'emergency.html';
            }
            else if (inputHash === data.vaultHash || inputHash === data.testamentHash) {
                handleSecondaryAccess(data, inputHash, password);
            }
            else {
                handleFailedAttempt();
            }

        } catch (error) {
            errorMsg.innerText = "Erreur de connexion";
            resetUI();
        }
    }

    function handleFailedAttempt() {
        attemptCount++;
        const errorMsg = document.getElementById('errorMsg');

        if (attemptCount >= 10) {
            blockUntil = Date.now() + 10 * 60 * 1000;
            errorMsg.innerText = "Bloqué 10 min. Alerte envoyée.";
            getTrackingDetails().then(details => {
                api.suspiciousActivity({ attempts: attemptCount, ...details });
            });
        } else if (attemptCount >= 5) {
            blockUntil = Date.now() + 2 * 60 * 1000;
            errorMsg.innerText = "Code incorrect. Bloqué 2 min.";
        } else if (attemptCount >= 3) {
            blockUntil = Date.now() + 30 * 1000;
            errorMsg.innerText = "Code incorrect. Bloqué 30 sec.";
        } else {
            errorMsg.innerText = "Code incorrect";
        }
        resetUI();
    }

    function resetUI() {
        const pwdInput = document.getElementById('passwordInput');
        const btn = document.getElementById('submitBtn');
        if(pwdInput) {
            pwdInput.value = '';
            pwdInput.disabled = false;
            pwdInput.focus();
        }
        if(btn) btn.innerHTML = '<i class="fas fa-lock text-xl"></i>';
    }

    function handleSecondaryAccess(data, inputHash, vaultOrTestamentPassword) {
        // Complete innerHTML replacement for security (prevent CSS display: none bypass)
        loginContainer.innerHTML = `
            <div class="login-box fade-in" style="max-width: 500px;">
                <h3 style="margin-bottom: 1.5rem;">Vérification d'identité</h3>
                <div class="form-group">
                    <input type="text" id="nameInput" placeholder="Votre Nom / Société" autofocus>
                </div>
                <div class="form-group">
                    <input type="password" id="emergencyInput" placeholder="Code Contacts / Urgence">
                </div>
                <div id="secErrorMsg" class="error-message" style="margin-bottom: 1rem;"></div>
                <div class="flex gap-4 justify-center">
                    <button id="cancelSecBtn" class="btn btn-secondary">Annuler</button>
                    <button id="verifySecBtn" class="btn btn-primary">Valider l'accès</button>
                </div>
            </div>
        `;

        document.getElementById('cancelSecBtn').addEventListener('click', renderLoginBox);

        const verifyBtn = document.getElementById('verifySecBtn');
        verifyBtn.addEventListener('click', async () => {
            const name = document.getElementById('nameInput').value.trim();
            const emergencyPwd = document.getElementById('emergencyInput').value;
            const secErrorMsg = document.getElementById('secErrorMsg');

            if (!name || !emergencyPwd) {
                secErrorMsg.innerText = "Veuillez remplir tous les champs";
                return;
            }

            if (hashPassword(emergencyPwd) !== data.emergencyHash) {
                secErrorMsg.innerText = "Accès refusé. Code incorrect.";
                return;
            }

            verifyBtn.innerHTML = '<span class="loader"></span>';
            verifyBtn.disabled = true;

            const isVault = inputHash === data.vaultHash;

            sessionStorage.setItem('emergencyKey', emergencyPwd);
            sessionStorage.setItem(isVault ? 'vaultKey' : 'testamentKey', vaultOrTestamentPassword);

            const details = await getTrackingDetails();
            details.name = name;
            details.vaultAccess = isVault;
            details.testamentAccess = !isVault;

            await api.accessSpace(details);

            window.location.href = isVault ? 'vault.html' : 'testament.html';
        });
    }
});
// netlify/js/index.js

document.addEventListener('DOMContentLoaded', async () => {
    let appData = null;
    let failedAttempts = 0;

    const container = document.getElementById('login-container');
    container.innerHTML = `
        <div class="text-center mb-6">
            <i class="fas fa-lock text-4xl" style="color: #457b9d;"></i>
        </div>
        <form id="login-form" class="flex-col gap-4">
            <div class="input-group">
                <input type="password" id="master-password" placeholder="Mot de passe" required autocomplete="off" style="padding: 12px; font-size: 16px;">
                <button type="button" id="toggle-pwd"><i class="fas fa-eye"></i></button>
            </div>
            <button type="submit" class="btn-primary" style="padding: 12px; font-size: 16px; margin-top: 10px;" id="btn-login">Déverrouiller</button>
        </form>
        <div id="loader" class="loader-container hidden"><div class="spinner"></div></div>
    `;

    document.getElementById('toggle-pwd').onclick = function() {
        toggleVisibility(this, 'master-password');
    };

    try {
        appData = await loadData();
        if (!appData || !appData.isSetup) {
            window.location.href = 'setup.html';
            return;
        }
    } catch (e) {
        showToast("Erreur de connexion au serveur", "error");
    }

    document.getElementById('login-form').onsubmit = async (e) => {
        e.preventDefault();
        if (!appData) return;

        const pwd = document.getElementById('master-password').value;
        const hash = hashPassword(pwd);

        const btn = document.getElementById('btn-login');
        const loader = document.getElementById('loader');

        btn.classList.add('hidden');
        loader.classList.remove('hidden');

        try {
            if (hash === appData.adminHash) {
                sessionStorage.setItem('adminKey', pwd);
                window.location.href = 'admin.html';
                return;
            }

            if (hash === appData.emergencyHash) {
                sessionStorage.setItem('emergencyKey', pwd);
                const info = await getClientInfo();
                await postToApi({ emergencyAccess: true, ...info });
                window.location.href = 'emergency.html';
                return;
            }

            if (hash === appData.vaultHash || hash === appData.testamentHash) {
                const isVault = hash === appData.vaultHash;

                // Prompt for name & emergency pwd
                const html = `
                    <div style="text-align: center;">
                        <h3 class="font-bold mb-4" style="color: var(--accent);">Vérification de sécurité</h3>
                        <p class="text-sm text-muted mb-4">L'accès à cette section requiert une double vérification.</p>
                        <form id="verify-form" class="flex-col gap-4 text-left">
                            <input type="text" id="verify-name" placeholder="Nom complet ou Société" required>
                            <input type="password" id="verify-urg-pwd" placeholder="Mot de passe d'urgence" required>
                            <button type="submit" class="btn-primary mt-2">Valider l'accès</button>
                        </form>
                    </div>
                `;
                openModal(html);

                document.getElementById('verify-form').onsubmit = async (ev) => {
                    ev.preventDefault();
                    const name = document.getElementById('verify-name').value;
                    const urgPwd = document.getElementById('verify-urg-pwd').value;

                    if (hashPassword(urgPwd) === appData.emergencyHash) {
                        const info = await getClientInfo();
                        info.nomComplet = name;

                        if (isVault) {
                            sessionStorage.setItem('vaultKey', pwd);
                            sessionStorage.setItem('vaultUrgKey', urgPwd);
                            await postToApi({ vaultAccess: true, ...info });
                            window.location.href = 'vault.html';
                        } else {
                            sessionStorage.setItem('testamentKey', pwd);
                            sessionStorage.setItem('testamentUrgKey', urgPwd);
                            await postToApi({ testamentAccess: true, ...info });
                            window.location.href = 'testament.html';
                        }
                    } else {
                        showToast("Mot de passe d'urgence incorrect", "error");
                        failedAttempts++;
                        checkLockout();
                    }
                };

                btn.classList.remove('hidden');
                loader.classList.add('hidden');
                return;
            }

            // Incorrect
            failedAttempts++;
            showToast("Code incorrect", "error");
            document.getElementById('master-password').value = '';
            btn.classList.remove('hidden');
            loader.classList.add('hidden');
            checkLockout();

        } catch(err) {
            btn.classList.remove('hidden');
            loader.classList.add('hidden');
            showToast("Erreur lors de la vérification", "error");
        }
    };

    async function checkLockout() {
        const btn = document.getElementById('btn-login');
        const input = document.getElementById('master-password');
        let blockTime = 0;

        if (failedAttempts >= 10) {
            blockTime = 10 * 60; // 10 min
            const info = await getClientInfo();
            await postToApi({ suspiciousActivity: true, ...info });
        } else if (failedAttempts >= 5) {
            blockTime = 2 * 60; // 2 min
        } else if (failedAttempts >= 3) {
            blockTime = 30; // 30 sec
        }

        if (blockTime > 0) {
            btn.disabled = true;
            input.disabled = true;
            btn.style.background = 'var(--danger)';
            btn.textContent = `Bloqué (${blockTime}s)`;

            let remaining = blockTime;
            const interval = setInterval(() => {
                remaining--;
                if (remaining <= 0) {
                    clearInterval(interval);
                    btn.disabled = false;
                    input.disabled = false;
                    btn.style.background = 'var(--accent)';
                    btn.textContent = 'Déverrouiller';
                } else {
                    btn.textContent = `Bloqué (${remaining}s)`;
                }
            }, 1000);
        }
    }
});

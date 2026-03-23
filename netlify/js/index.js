document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('login-container');

    // Inject HTML
    container.innerHTML = `
        <div class="custom-modal-dialog" style="max-width: 400px; text-align: center;">
            <div id="loading-indicator" class="mb-4 text-muted">Chargement...</div>
            <form id="login-form" class="flex-col gap-4 hidden">
                <div class="flex gap-2">
                    <input type="password" id="access-code" placeholder="Code d'accès" autocomplete="off" autofocus class="flex-1">
                    <button type="submit" id="btn-login" class="btn btn-primary btn-icon">
                        <i class="fas fa-lock"></i>
                    </button>
                </div>
                <div id="error-message" class="error-message"></div>
            </form>
        </div>
    `;

    const form = document.getElementById('login-form');
    const input = document.getElementById('access-code');
    const btn = document.getElementById('btn-login');
    const errorMsg = document.getElementById('error-message');
    const loading = document.getElementById('loading-indicator');

    let serverData = null;
    let failedAttempts = 0;
    let lockoutUntil = 0;

    try {
        serverData = await api.load();
        loading.classList.add('hidden');

        if (!serverData || !serverData.isSetup) {
            window.location.href = 'setup.html';
            return;
        }

        form.classList.remove('hidden');
    } catch (e) {
        loading.innerText = "Erreur de connexion au serveur.";
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (Date.now() < lockoutUntil) {
            const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
            errorMsg.innerText = `Trop de tentatives. Réessayez dans ${remaining}s.`;
            return;
        }

        const mdp = input.value;
        if (!mdp) return;

        const hashed = hashPassword(mdp);

        // 1. Admin
        if (hashed === serverData.adminHash) {
            sessionStorage.setItem('adminKey', mdp);
            window.location.href = 'admin.html';
            return;
        }

        // 2. Emergency
        if (hashed === serverData.emergencyHash) {
            btn.disabled = true;
            input.disabled = true;
            errorMsg.innerText = "Authentification en cours...";
            errorMsg.style.color = "var(--text-main)";

            const info = await getClientInfo();
            try {
                await api.emergencyAccess({
                    emergencyAccess: true,
                    ip: info.ip,
                    userAgent: info.userAgent,
                    lat: info.lat,
                    lng: info.lng
                });
            } catch (err) {
                console.error("Alert email sending failed", err);
            }

            sessionStorage.setItem('emergencyKey', mdp);
            window.location.href = 'emergency.html';
            return;
        }

        // 3. Vault or Testament
        if (hashed === serverData.vaultHash || hashed === serverData.testamentHash) {
            const target = (hashed === serverData.vaultHash) ? 'vault' : 'testament';

            openModal(`
                <h3 class="mb-4 text-center">Double Authentification Requise</h3>
                <p class="text-sm text-muted mb-4 text-center">Veuillez confirmer votre identité et entrer le code d'urgence.</p>
                <form id="dual-auth-form" class="flex-col gap-4">
                    <input type="text" id="auth-name" placeholder="Nom complet / Société" required autofocus>
                    <input type="password" id="auth-contact-pwd" placeholder="Mot de passe contacts/urgence" required>
                    <div id="dual-error" class="error-message text-center"></div>
                    <div class="flex justify-between mt-4">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Annuler</button>
                        <button type="submit" class="btn btn-primary" id="dual-submit-btn">Valider</button>
                    </div>
                </form>
            `);

            const dualForm = document.getElementById('dual-auth-form');
            dualForm.addEventListener('submit', async (ev) => {
                ev.preventDefault();
                const name = document.getElementById('auth-name').value;
                const contactPwd = document.getElementById('auth-contact-pwd').value;
                const dualError = document.getElementById('dual-error');
                const dualSubmitBtn = document.getElementById('dual-submit-btn');

                if (hashPassword(contactPwd) !== serverData.emergencyHash) {
                    dualError.innerText = "Mot de passe contacts incorrect.";
                    return;
                }

                dualSubmitBtn.disabled = true;
                dualError.innerText = "Validation en cours...";
                dualError.style.color = "var(--text-main)";

                const info = await getClientInfo();
                const accessDetails = {
                    action: 'accessSpace',
                    name: name,
                    ip: info.ip,
                    userAgent: info.userAgent,
                    lat: info.lat,
                    lng: info.lng,
                    space: target
                };

                if (target === 'vault') accessDetails.vaultAccess = true;
                if (target === 'testament') accessDetails.testamentAccess = true;

                try {
                    await api.accessSpace(accessDetails);
                } catch (err) {
                    console.error("Alert email sending failed", err);
                }

                sessionStorage.setItem(target + 'Key', mdp);
                sessionStorage.setItem('emergencyKey', contactPwd);
                window.location.href = target + '.html';
            });
            return;
        }

        // 4. Invalid
        failedAttempts++;
        errorMsg.style.color = "var(--accent-danger)";

        if (failedAttempts >= 10) {
            lockoutUntil = Date.now() + 10 * 60 * 1000;
            errorMsg.innerText = "Trop de tentatives. Bloqué 10 min.";
            const info = await getClientInfo();
            api.suspiciousActivity({
                suspiciousActivity: true,
                ip: info.ip,
                userAgent: info.userAgent,
                lat: info.lat,
                lng: info.lng
            });
        } else if (failedAttempts >= 5) {
            lockoutUntil = Date.now() + 2 * 60 * 1000;
            errorMsg.innerText = "Trop de tentatives. Bloqué 2 min.";
        } else if (failedAttempts >= 3) {
            lockoutUntil = Date.now() + 30 * 1000;
            errorMsg.innerText = "Trop de tentatives. Bloqué 30s.";
        } else {
            errorMsg.innerText = "Code incorrect.";
        }

        input.value = '';
    });
});
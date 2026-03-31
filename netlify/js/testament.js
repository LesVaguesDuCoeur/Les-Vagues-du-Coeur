document.addEventListener('DOMContentLoaded', async () => {
    const loginBox = document.getElementById('login-box');
    const contentBox = document.getElementById('content-box');
    const sectionLoginForm = document.getElementById('section-login-form');
    const sectionPasswordInput = document.getElementById('section-password');
    const testamentForm = document.getElementById('testament-form');
    const testamentContent = document.getElementById('testament-content');

    const btnLogout = document.getElementById('btn-logout');
    const linkAdmin = document.getElementById('link-admin');

    let testamentData = { content: '' };
    let encryptionKey = null;
    let isBypassed = false;
    let globalDbData = null;

    const adminKey = sessionStorage.getItem('adminKey');
    const testamentKey = sessionStorage.getItem('testamentKey');

    if (adminKey) {
        isBypassed = true;
        linkAdmin.classList.remove('hidden');
    }

    showLoader();
    try {
        globalDbData = await loadFromApi();
        hideLoader();
    } catch (e) {
        hideLoader();
        return showToast("Erreur de chargement des données", "error");
    }

    async function unlockSection(pwd) {
        try {
            showLoader();
            const hash = await hashSHA256(pwd);
            if (hash !== globalDbData.testamentHash && !isBypassed) {
                hideLoader();
                return showToast("Mot de passe incorrect", "error");
            }

            encryptionKey = pwd;

            if (globalDbData.testament) {
                try {
                    testamentData = await decryptData(globalDbData.testament, encryptionKey, true);
                } catch (e) {
                    hideLoader();
                    return showToast("Erreur de déchiffrement (données corrompues ou clé invalide)", "error");
                }
            }

            testamentContent.value = testamentData.content || '';

            // "vault.js cachait le .login-box entier avec parentElement.style.display
            // Corrigé : re-render complet du innerHTML de .login-box"
            // - apply the same pattern here.
            loginBox.innerHTML = '';
            loginBox.classList.add('hidden');
            contentBox.classList.remove('hidden');
            hideLoader();

        } catch (e) {
            hideLoader();
            showToast("Erreur d'accès", "error");
        }
    }

    if (testamentKey) {
        unlockSection(testamentKey);
    } else if (adminKey) {
        if (globalDbData.encryptedTestamentKey) {
            try {
                const decKey = await decryptData(globalDbData.encryptedTestamentKey, adminKey, false);
                unlockSection(decKey);
            } catch (e) {
                console.error("Failed to decrypt testament key with admin key", e);
            }
        }
    }

    if (sectionLoginForm) {
        sectionLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const pwd = sectionPasswordInput.value;
            sessionStorage.setItem('testamentKey', pwd);
            unlockSection(pwd);
        });
    }

    testamentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        testamentData = {
            content: testamentContent.value
        };

        showLoader();
        try {
            const encryptedStr = await encryptData(testamentData, encryptionKey);
            await postToApi({
                action: 'save',
                data: { testament: encryptedStr }
            });
            showToast("Testament sauvegardé avec succès", "success");
        } catch (e) {
            showToast("Erreur lors de la sauvegarde", "error");
        }
        hideLoader();
    });

    btnLogout.addEventListener('click', () => {
        sessionStorage.clear();
    });
});

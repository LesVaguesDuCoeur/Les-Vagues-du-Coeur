document.addEventListener('DOMContentLoaded', async () => {
    if (!api.getApiUrl()) {
        window.location.href = 'setup.html';
        return;
    }

    const loginContainer = document.getElementById('login-container');
    const contentContainer = document.getElementById('content-container');
    const loginForm = document.getElementById('login-form');

    let serverData = null;
    let contactsList = [];

    // Load API data
    try {
        window.showLoading();
        serverData = await api.loadFromApi();
        window.hideLoading();
    } catch (error) {
        window.hideLoading();
        window.showToast("Erreur de connexion a l'API.", "error");
        return;
    }

    // Optional status text (e.g. if emergency access used)
    const emName = sessionStorage.getItem('emergencyName');
    if (emName) {
        document.getElementById('header-status').textContent = `Accedé par : ${emName}`;
        document.getElementById('header-status').style.color = 'var(--warning)';
    }

    // Check if we have the specific section key
    if (sessionStorage.getItem('contactKey')) {
        await loadContacts(sessionStorage.getItem('contactKey'));
    } else {
        // Even if admin, we need the specific key to decrypt
        loginContainer.classList.remove('hidden');
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const passwordInput = document.getElementById('password');
        const password = passwordInput.value;
        if (!password) {
            window.showToast("Mot de passe requis.", "warning");
            return;
        }

        window.showLoading();
        const hash = await cryptoUtils.hashPassword(password);
        window.hideLoading();

        if (hash === serverData.contactHash) {
            sessionStorage.setItem('contactKey', password);
            loginContainer.classList.add('hidden');
            await loadContacts(password);
        } else {
            window.showToast("Mot de passe incorrect.", "error");
            passwordInput.value = '';
            passwordInput.focus();
        }
    });

    // Handle adding a contact
    document.getElementById('add-contact-form').parentElement.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('contact-name').value.trim();
        const phone = document.getElementById('contact-phone').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const relation = document.getElementById('contact-relation').value.trim();

        if (!name || !phone || !relation) {
            window.showToast("Remplissez les champs obligatoires.", "warning");
            return;
        }

        const newContact = {
            id: Date.now().toString(),
            name,
            phone,
            email,
            relation
        };

        contactsList.push(newContact);
        await saveContacts();

        // Reset form
        document.getElementById('add-contact-form').reset();
        document.getElementById('contact-name').focus();
    });

    async function loadContacts(password) {
        if (!serverData.contacts) {
            contactsList = [];
            renderContacts();
            contentContainer.classList.remove('hidden');
            return;
        }

        try {
            window.showLoading();
            const decrypted = await cryptoUtils.decryptData(serverData.contacts, password);
            contactsList = JSON.parse(decrypted);

            // Defensive array check
            if (!Array.isArray(contactsList)) contactsList = [];

            window.hideLoading();
            renderContacts();
            contentContainer.classList.remove('hidden');
        } catch (error) {
            window.hideLoading();
            window.showToast("Echec du dechiffrement. La cle est invalide.", "error");
            sessionStorage.removeItem('contactKey');
            loginContainer.classList.remove('hidden');
        }
    }

    async function saveContacts() {
        const password = sessionStorage.getItem('contactKey');
        if (!password) {
            window.showToast("Erreur de session.", "error");
            return;
        }

        try {
            window.showLoading();
            const jsonStr = JSON.stringify(contactsList);
            const encrypted = await cryptoUtils.encryptData(jsonStr, password);

            await api.postToApi({ contacts: encrypted });

            window.hideLoading();
            window.showToast("Contacts sauvegardes.", "success");
            renderContacts();
        } catch (error) {
            window.hideLoading();
            window.showToast("Erreur lors de la sauvegarde.", "error");
            console.error("Save failed", error);
        }
    }

    function renderContacts() {
        const listEl = document.getElementById('contact-list');
        const noContactsEl = document.getElementById('no-contacts');

        listEl.innerHTML = '';

        if (contactsList.length === 0) {
            noContactsEl.classList.remove('hidden');
            return;
        }

        noContactsEl.classList.add('hidden');

        contactsList.forEach(contact => {
            const item = document.createElement('div');
            item.className = 'contact-item';

            const emailHtml = contact.email ? `<span>Email: ${window.escapeHtml(contact.email)}</span>` : '';

            item.innerHTML = `
                <div class="contact-info">
                    <strong>${window.escapeHtml(contact.name)} (${window.escapeHtml(contact.relation)})</strong>
                    <span>Tel: ${window.escapeHtml(contact.phone)}</span>
                    ${emailHtml}
                </div>
                <div class="contact-actions">
                    <button class="secondary edit-btn" data-id="${window.escapeHtml(contact.id)}">Modifier</button>
                    <button class="danger del-btn" data-id="${window.escapeHtml(contact.id)}">Supprimer</button>
                </div>
            `;

            listEl.appendChild(item);
        });

        // Add event listeners for edit and delete
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const contact = contactsList.find(c => c.id === id);
                if (contact) {
                    const newPhone = await window.showPrompt(`Modifier le telephone pour ${contact.name}`, contact.phone);
                    if (newPhone !== null) {
                        contact.phone = newPhone.trim();
                        await saveContacts();
                    }
                }
            });
        });

        document.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const confirm = await window.showConfirm("Voulez-vous supprimer ce contact ?", "Suppression");
                if (confirm) {
                    contactsList = contactsList.filter(c => c.id !== id);
                    await saveContacts();
                }
            });
        });
    }
});
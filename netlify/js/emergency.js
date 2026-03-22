document.addEventListener('DOMContentLoaded', async () => {
    const loginBox = document.getElementById('login-box');
    const contentBox = document.getElementById('content-box');
    const sectionLoginForm = document.getElementById('section-login-form');
    const sectionPasswordInput = document.getElementById('section-password');
    const addContactForm = document.getElementById('add-contact-form');
    const contactsListContainer = document.getElementById('contacts-list');
    const btnLogout = document.getElementById('btn-logout');
    const linkAdmin = document.getElementById('link-admin');

    let contactsData = [];
    let encryptionKey = null; // Either the contact password or admin bypass
    let isBypassed = false;
    let globalDbData = null;

    // Check session logic
    const adminKey = sessionStorage.getItem('adminKey');
    const contactKey = sessionStorage.getItem('contactKey');

    if (adminKey) {
        // Bypass logic for admin
        isBypassed = true;
        linkAdmin.classList.remove('hidden');
        encryptionKey = null; // Will need to derive contactKey using adminHash if needed, but per specs:
        // "Chaque section est chiffrée avec son propre mot de passe comme clé".
        // Admin must be able to view/modify. To do this, Admin needs the contact password, or we must encrypt the keys with the admin key.
        // The specs say: "sessionStorage.adminKey est défini pour bypass les mdp des sous-pages"
        // And memory says: "keys (like Vault or Testament passwords) are themselves encrypted with the master Admin password to allow complete administrative access."
        // Let's check memory: "keys (like Vault or Testament passwords) are themselves encrypted with the master Admin password to allow complete administrative access."
        // Wait, the specification document does not mention storing encrypted keys in the db.
        // It says: "L'admin peut ensuite naviguer vers toutes les pages SANS re-saisir de mdp".
        // Let's fetch db data first to handle this properly.
    }

    showLoader();
    try {
        globalDbData = await loadFromApi();
        hideLoader();
    } catch (e) {
        hideLoader();
        return showToast("Erreur de chargement des données", "error");
    }

    // Function to render contacts
    function renderContacts() {
        contactsListContainer.innerHTML = '';
        if (contactsData.length === 0) {
            contactsListContainer.innerHTML = '<p>Aucun contact enregistré.</p>';
            return;
        }

        contactsData.forEach((contact, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h4>${contact.name} (${contact.relation})</h4>
                <p>📞 ${contact.phone}</p>
                ${contact.email ? `<p>✉️ ${contact.email}</p>` : ''}
                <div class="btn-group mt-1">
                    <button class="btn btn-secondary btn-small" onclick="editContact(${index})">Modifier</button>
                    <button class="btn btn-danger btn-small" onclick="deleteContact(${index})">Supprimer</button>
                </div>
            `;
            contactsListContainer.appendChild(card);
        });
    }

    // Attempt to unlock section
    async function unlockSection(pwd) {
        try {
            showLoader();
            const hash = await hashSHA256(pwd);
            if (hash !== globalDbData.contactHash && !isBypassed) {
                hideLoader();
                return showToast("Mot de passe incorrect", "error");
            }

            encryptionKey = pwd; // Use this key for AES

            if (globalDbData.contacts) {
                try {
                    contactsData = await decryptData(globalDbData.contacts, encryptionKey, true);
                    if (!Array.isArray(contactsData)) contactsData = [];
                } catch (e) {
                    hideLoader();
                    return showToast("Erreur de déchiffrement (données corrompues ou clé invalide)", "error");
                }
            }

            loginBox.classList.add('hidden');
            contentBox.classList.remove('hidden');
            renderContacts();
            hideLoader();

        } catch (e) {
            hideLoader();
            showToast("Erreur d'accès", "error");
        }
    }

    // Auto-unlock if session key exists
    if (contactKey) {
        unlockSection(contactKey);
    } else if (adminKey) {
        if (globalDbData.encryptedContactKey) {
            try {
                const decKey = await decryptData(globalDbData.encryptedContactKey, adminKey, false);
                unlockSection(decKey);
            } catch (e) {
                console.error("Failed to decrypt contact key with admin key", e);
            }
        }
    }

    sectionLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwd = sectionPasswordInput.value;
        sessionStorage.setItem('contactKey', pwd); // save for session
        unlockSection(pwd);
    });

    addContactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newContact = {
            name: document.getElementById('contact-name').value,
            relation: document.getElementById('contact-relation').value,
            phone: document.getElementById('contact-phone').value,
            email: document.getElementById('contact-email').value
        };

        contactsData.push(newContact);
        await saveContacts();
        addContactForm.reset();
    });

    // Make functions global for inline onclick
    window.deleteContact = async (index) => {
        const confirm = await showConfirm("Voulez-vous vraiment supprimer ce contact ?");
        if (confirm) {
            contactsData.splice(index, 1);
            await saveContacts();
        }
    };

    window.editContact = async (index) => {
        const contact = contactsData[index];
        const newName = await showPrompt("Nom complet", contact.name);
        if (!newName) return;
        const newPhone = await showPrompt("Téléphone", contact.phone, "Modification", "tel");
        if (!newPhone) return;

        contactsData[index] = { ...contact, name: newName, phone: newPhone };
        await saveContacts();
    };

    async function saveContacts() {
        showLoader();
        try {
            const encryptedStr = await encryptData(contactsData, encryptionKey);
            await postToApi({
                action: 'save',
                data: { contacts: encryptedStr }
            });
            renderContacts();
            showToast("Contacts sauvegardés", "success");
        } catch (e) {
            showToast("Erreur lors de la sauvegarde", "error");
        }
        hideLoader();
    }

    btnLogout.addEventListener('click', (e) => {
        sessionStorage.clear();
    });
});

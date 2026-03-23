// netlify/js/emergency.js

let appData = null;
let emergencyKey = sessionStorage.getItem('emergencyKey');
let contactsList = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!emergencyKey) {
        window.location.href = 'index.html';
        return;
    }

    setupAutoLock(10); // Auto-lock in 10 minutes

    document.getElementById('btn-logout').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

    try {
        appData = await loadData();

        contactsList = decryptData(appData.emergencyContacts, emergencyKey) || [];
        const msg = decryptData(appData.emergencyMessageForEmergency, emergencyKey);

        if (msg) {
            const msgBox = document.getElementById('emergency-message-box');
            msgBox.classList.remove('hidden');
            document.getElementById('emergency-message').textContent = escapeHtml(msg);
        }

        document.getElementById('loader').classList.add('hidden');

        renderContacts(contactsList);

        document.getElementById('search-contact').addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = contactsList.filter(c =>
                c.name.toLowerCase().includes(query) ||
                c.relation.toLowerCase().includes(query) ||
                (c.relationCustom && c.relationCustom.toLowerCase().includes(query))
            );
            renderContacts(filtered);
        });

        document.getElementById('btn-panic').onclick = async () => {
            if (await confirmDialog("Voulez-vous vraiment déclencher l'alerte de niveau 1 ? Un email sera envoyé immédiatement.")) {
                try {
                    const info = await getClientInfo();
                    await postToApi({ panicAlert: true, ...info });
                    showToast("Alerte de niveau 1 envoyée !", "success");
                } catch(e) {
                    showToast("Erreur lors de l'envoi de l'alerte", "error");
                }
            }
        };

    } catch (e) {
        showToast("Erreur d'accès aux données", "error");
        console.error(e);
        setTimeout(() => {
            sessionStorage.clear();
            window.location.href = 'index.html';
        }, 2000);
    }
});

function renderContacts(list) {
    const container = document.getElementById('contacts-list');
    container.innerHTML = '';

    // Sort by importance
    list.sort((a, b) => a.importance - b.importance);

    if (list.length === 0) {
        container.innerHTML = '<p class="text-center text-muted italic">Aucun contact trouvé.</p>';
        return;
    }

    list.forEach(contact => {
        const row = document.createElement('div');
        row.className = `contact-row imp-${contact.importance}`;

        let linksHTML = '';
        if (contact.phone) linksHTML += `<a href="tel:${contact.phone}" class="link-icon link-phone" title="Appeler"><i class="fas fa-phone"></i></a>`;
        if (contact.email) linksHTML += `<a href="mailto:${contact.email}" class="link-icon link-email" title="Email"><i class="fas fa-envelope"></i></a>`;
        if (contact.whatsapp) linksHTML += `<a href="https://wa.me/${contact.whatsapp.replace(/\D/g,'')}" target="_blank" class="link-icon link-whatsapp" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>`;
        if (contact.telegram) linksHTML += `<a href="https://t.me/${contact.telegram}" target="_blank" class="link-icon link-telegram" title="Telegram"><i class="fab fa-telegram"></i></a>`;
        if (contact.snapchat) linksHTML += `<a href="https://www.snapchat.com/add/${contact.snapchat}" target="_blank" class="link-icon link-snap" title="Snapchat"><i class="fab fa-snapchat-ghost"></i></a>`;
        if (contact.instagram) linksHTML += `<a href="https://www.instagram.com/${contact.instagram}" target="_blank" class="link-icon link-insta" title="Instagram"><i class="fab fa-instagram"></i></a>`;
        if (contact.messenger) linksHTML += `<a href="https://m.me/${contact.messenger}" target="_blank" class="link-icon link-messenger" title="Messenger"><i class="fab fa-facebook-messenger"></i></a>`;

        let notesHtml = contact.notes ? `<div class="text-sm text-muted mt-2" style="grid-column: 1/-1; background:rgba(0,0,0,0.2); padding:8px; border-radius:4px;"><i class="fas fa-info-circle mr-1"></i>${escapeHtml(contact.notes)}</div>` : '';

        row.innerHTML = `
            <div style="flex:1;">
                <div class="contact-info flex items-center mb-2">
                    <span class="contact-name text-lg">${escapeHtml(contact.name)}</span>
                    <span class="contact-relation">${escapeHtml(contact.relation === 'Autre' ? contact.relationCustom : contact.relation)}</span>
                </div>
                <div class="contact-links">${linksHTML}</div>
                ${notesHtml}
            </div>
        `;
        container.appendChild(row);
    });
}

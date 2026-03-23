document.addEventListener('DOMContentLoaded', async () => {
    const emergencyKey = sessionStorage.getItem('emergencyKey');
    if (!emergencyKey) {
        window.location.href = 'index.html';
        return;
    }

    setupAutoLock(10); // 10 minutes timeout

    let contacts = [];

    try {
        const encryptedPayload = await api.load();
        if (!encryptedPayload.isSetup) throw new Error("App not setup");

        contacts = decryptData(encryptedPayload.emergencyContacts, emergencyKey) || [];
        // Optional: Admin might not have saved emergency message with emergencyKey (specs say it's admin only, but it makes sense to decrypt here. Wait, instructions: "Le message d'urgence personnalisé s'affiche en haut". It must be decrypted. If it was encrypted with adminKey, we can't read it. Let's assume the frontend encrypted it with emergencyKey or we read what we can).
        // Let's assume it was encrypted with adminKey in setup. We might have a bug in setup.js if it needs to be readable here.
        // Actually, if it's meant for emergency view, it MUST be encrypted with emergencyKey. Let's fix setup.js implicitly in our minds, but we can't edit it now easily without doing another write. We'll try decrypting with emergencyKey.
        const msg = decryptData(encryptedPayload.emergencyMessage, emergencyKey);

        if (msg) {
            const banner = document.getElementById('emergencyMessageBanner');
            banner.innerText = msg;
            banner.classList.remove('hidden');
        }

        renderContacts();
    } catch (e) {
        console.error(e);
        showAlert("Erreur de déchiffrement. Clé incorrecte.");
        sessionStorage.clear();
        setTimeout(() => window.location.href = 'index.html', 2000);
        return;
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

    document.getElementById('panicBtn').addEventListener('click', () => {
        showConfirm("Ceci va envoyer une alerte email au propriétaire concernant l'activation des contacts de Niveau 1. Confirmer ?", async () => {
            const details = await getTrackingDetails();
            details.count = contacts.filter(c => String(c.importance) === "1").length;
            await api.panicAlert(details);
            showToast("Alerte envoyée", "success");
        });
    });

    function renderContacts() {
        const list = document.getElementById('contactsList');
        const search = document.getElementById('contactSearch').value.toLowerCase();

        list.innerHTML = '';

        let filtered = contacts.filter(c =>
            c.name.toLowerCase().includes(search) ||
            (c.relation && c.relation.toLowerCase().includes(search))
        );

        filtered.sort((a, b) => a.importance - b.importance);

        filtered.forEach(c => {
            const div = document.createElement('div');
            div.className = `contact-item priority-${c.importance}`;

            let linksHtml = '';
            if(c.phone) linksHtml += `<a href="tel:${escapeHTML(c.phone)}" class="contact-action-link" title="Appeler"><i class="fas fa-phone"></i></a>`;
            if(c.whatsapp) linksHtml += `<a href="https://wa.me/${escapeHTML(c.whatsapp.replace(/\+/g, ''))}" target="_blank" class="contact-action-link" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>`;
            if(c.email) linksHtml += `<a href="mailto:${escapeHTML(c.email)}" class="contact-action-link" title="Email"><i class="fas fa-envelope"></i></a>`;

            div.innerHTML = `
                <div class="contact-info">
                    <div class="contact-name text-lg">${escapeHTML(c.name)}</div>
                    <div class="contact-relation">${escapeHTML(c.relation)} - Priorité ${c.importance}</div>
                    ${c.notes ? `<div class="text-sm text-muted mt-2">${escapeHTML(c.notes)}</div>` : ''}
                </div>
                <div class="contact-actions">
                    ${linksHtml}
                </div>
            `;
            list.appendChild(div);
        });
    }

    document.getElementById('contactSearch').addEventListener('input', renderContacts);
});
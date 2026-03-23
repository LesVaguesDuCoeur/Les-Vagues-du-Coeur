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

        // Note: as per strict JSON structure requirement, the emergencyMessage is stored encrypted with adminKey.
        // Therefore, it cannot be read by the emergency user directly unless we implement a separate cleartext or emergencyKey payload.
        // We attempt to decrypt with emergencyKey as a fallback, but per spec, it's adminKey.
        let msg = null;
        try {
             msg = decryptData(encryptedPayload.emergencyMessage, emergencyKey);
        } catch(err) {}

        if (msg && typeof msg === 'string') {
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
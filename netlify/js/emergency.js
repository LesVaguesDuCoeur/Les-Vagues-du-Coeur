document.addEventListener('DOMContentLoaded', async () => {
    const emergencyKey = sessionStorage.getItem('emergencyKey');

    if (!emergencyKey) {
        window.location.href = 'index.html';
        return;
    }

    setupAutoLock(10); // 10 minutes auto lock

    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

    try {
        const data = await api.load();

        // 1. Decrypt contacts
        const contacts = decryptData(data.emergencyContacts, emergencyKey) || [];

        // 2. Decrypt emergency message
        let emergencyMessage = '';
        if (data.emergencyMessageForEmergency) {
             emergencyMessage = decryptData(data.emergencyMessageForEmergency, emergencyKey) || '';
        }

        const banner = document.getElementById('emergencyMessageBanner');
        if (emergencyMessage.trim() !== '') {
            banner.innerHTML = `<strong>Message d'Urgence :</strong><br>${escapeHTML(emergencyMessage).replace(/\n/g, '<br>')}`;
            banner.classList.remove('hidden');
        }

        const listContainer = document.getElementById('contactsList');
        const searchInput = document.getElementById('contactSearch');

        function renderContacts(query = '') {
            listContainer.innerHTML = '';

            const filtered = contacts.filter(c =>
                c.name.toLowerCase().includes(query.toLowerCase()) ||
                c.relation.toLowerCase().includes(query.toLowerCase())
            ).sort((a, b) => a.importance - b.importance);

            const colors = {1: '#e63946', 2: '#fca311', 3: '#ffbe0b', 4: '#06d6a0', 5: '#8d99ae'};

            if (filtered.length === 0) {
                listContainer.innerHTML = `<div class="p-4 text-center text-muted">Aucun contact trouvé.</div>`;
                return;
            }

            filtered.forEach(contact => {
                const borderCol = colors[contact.importance] || colors[5];

                let linksHtml = '';
                if(contact.phone) linksHtml += `<a href="tel:${contact.phone}" class="mr-4" style="color:var(--accent-main)"><i class="fas fa-phone"></i> Appeler</a>`;
                if(contact.email) linksHtml += `<a href="mailto:${contact.email}" class="mr-4" style="color:var(--accent-main)"><i class="fas fa-envelope"></i> Email</a>`;
                if(contact.whatsapp) linksHtml += `<a href="https://wa.me/${contact.whatsapp}" target="_blank" class="mr-4" style="color:var(--accent-success)"><i class="fab fa-whatsapp"></i> WhatsApp</a>`;

                const row = document.createElement('div');
                row.className = 'vault-item';
                row.style.borderLeft = `4px solid ${borderCol}`;
                row.style.marginBottom = '0.5rem';

                row.innerHTML = `
                    <div class="font-bold text-xl">${escapeHTML(contact.name)}</div>
                    <div class="text-sm text-muted mb-2">${escapeHTML(contact.relation)}</div>
                    <div class="flex flex-wrap mt-3 font-bold">${linksHtml}</div>
                    ${contact.notes ? `<div class="mt-4 text-sm text-muted border-t pt-2 border-gray-700">Notes: ${escapeHTML(contact.notes)}</div>` : ''}
                `;

                listContainer.appendChild(row);
            });
        }

        renderContacts();

        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                renderContacts(e.target.value);
            });
        }

        // Panic Button
        document.getElementById('panicBtn').addEventListener('click', async () => {
            const confirm = await confirmDialog("Alerte Panique : Confirmez-vous l'envoi d'une alerte silencieuse avec votre localisation ?");
            if (!confirm) return;

            const btn = document.getElementById('panicBtn');
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
            btn.disabled = true;

            try {
                const info = await getClientInfo();
                await api.panicAlert({
                    panicAlert: true,
                    ip: info.ip,
                    userAgent: info.userAgent,
                    lat: info.lat,
                    lng: info.lng
                });
                showToast("Alerte silencieuse envoyée avec succès.", "success");
            } catch (err) {
                showToast("Erreur lors de l'envoi de l'alerte.", "error");
            } finally {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }
        });

    } catch (e) {
        showToast("Erreur de déchiffrement.", "error");
        setTimeout(() => {
            sessionStorage.clear();
            window.location.href = 'index.html';
        }, 2000);
    }
});
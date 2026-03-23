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
                if(contact.phone) linksHtml += `<a href="tel:${contact.phone}" class="contact-icon-btn" style="--hover-color:#25D366" title="Appeler"><i class="fas fa-phone"></i></a>`;
                if(contact.email) linksHtml += `<a href="mailto:${contact.email}" class="contact-icon-btn" style="--hover-color:#457b9d" title="Email"><i class="fas fa-envelope"></i></a>`;
                if(contact.whatsapp) {
                    let waNum = contact.whatsapp.replace(/\s+/g, '').replace('+', '');
                    linksHtml += `<a href="https://wa.me/${waNum}" target="_blank" class="contact-icon-btn" style="--hover-color:#25D366" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>`;
                }
                if(contact.telegram) {
                    let tgUser = contact.telegram.replace('@', '');
                    linksHtml += `<a href="https://t.me/${tgUser}" target="_blank" class="contact-icon-btn" style="--hover-color:#0088cc" title="Telegram"><i class="fab fa-telegram"></i></a>`;
                }
                if(contact.snap) {
                    let snapUser = contact.snap.replace('@', '');
                    linksHtml += `<a href="https://www.snapchat.com/add/${snapUser}" target="_blank" class="contact-icon-btn" style="--hover-color:#FFFC00; --hover-text-color:#000" title="Snapchat"><i class="fab fa-snapchat-ghost"></i></a>`;
                }
                if(contact.insta) {
                    let instaUser = contact.insta.replace('@', '');
                    linksHtml += `<a href="https://www.instagram.com/${instaUser}" target="_blank" class="contact-icon-btn" style="--hover-color:#E1306C" title="Instagram"><i class="fab fa-instagram"></i></a>`;
                }
                if(contact.messenger) {
                    linksHtml += `<a href="https://m.me/${contact.messenger}" target="_blank" class="contact-icon-btn" style="--hover-color:#0084ff" title="Messenger"><i class="fab fa-facebook-messenger"></i></a>`;
                }

                const row = document.createElement('div');
                row.className = 'contact-row';
                row.style.borderLeft = `4px solid ${borderCol}`;

                row.innerHTML = `
                    <div class="contact-info flex-col items-start gap-1" style="flex:2">
                        <div class="contact-name">${escapeHTML(contact.name)}</div>
                        <div class="contact-relation">${escapeHTML(contact.relation)}</div>
                    </div>
                    <div class="contact-icons flex-wrap justify-end" style="flex:3">
                        ${linksHtml}
                    </div>
                `;

                if (contact.notes) {
                    const notesRow = document.createElement('div');
                    notesRow.className = 'w-full mt-2 text-sm text-muted border-t pt-2 border-gray-700';
                    notesRow.innerHTML = `Notes: ${escapeHTML(contact.notes)}`;
                    row.appendChild(notesRow);
                    row.style.flexWrap = 'wrap';
                }

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
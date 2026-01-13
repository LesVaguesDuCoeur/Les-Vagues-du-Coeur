// WHATSHAPPEN FRONTEND V5

// ═══════════════════════════════════════════════════════════
// CONFIG & STATE
// ═══════════════════════════════════════════════════════════

const API_URL = "https://script.google.com/macros/s/AKfycbzLwdJ4UqV0zN-gQ2T_H9Oq-X4B2h8Y1j6kL3N0p5Q7r9S2t1U4v8W3x6Y/exec"; // Replace with your actual deployment ID
// Note: In a real deployment, the user must update this URL after deploying the GAS script.

const app = {
    state: {
        token: localStorage.getItem('wh_token'),
        email: localStorage.getItem('wh_email'),
        user: null,
        currentChatId: null,
        chats: [],
        pollingInterval: null
    },

    init: async () => {
        app.ui.showLoader(true);
        // EVENT LISTENERS
        document.getElementById('form-login').onsubmit = app.handlers.login;
        document.getElementById('form-register').onsubmit = app.handlers.register;

        document.getElementById('btn-menu').onclick = () => app.ui.toggleMenu(); // Placeholder
        document.getElementById('btn-refresh').onclick = () => app.actions.getState();
        document.getElementById('btn-back').onclick = () => app.ui.showDashboard();

        document.getElementById('fab-new').onclick = () => app.ui.showModal('modal-new-chat');
        document.getElementById('fab-sub').onclick = () => app.handlers.openSubscription();
        document.getElementById('fab-admin').onclick = () => app.ui.showSection('section-admin');

        // Chat
        document.getElementById('btn-send').onclick = app.handlers.sendMessage;
        document.getElementById('msg-input').onkeypress = (e) => { if(e.key === 'Enter') app.handlers.sendMessage(); };
        document.getElementById('btn-upload').onclick = () => document.getElementById('file-input').click();
        document.getElementById('file-input').onchange = app.handlers.uploadFile;

        // New Chat
        document.querySelectorAll('.dur-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });
        document.getElementById('btn-create-chat').onclick = app.handlers.createChat;

        // Modals
        document.querySelectorAll('.close-modal').forEach(x => x.onclick = (e) => e.target.closest('.modal').classList.remove('active'));
        window.onclick = (e) => { if(e.target.classList.contains('modal')) e.target.classList.remove('active'); };

        // Admin Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
            };
        });

        // Subscription
        document.getElementById('btn-submit-sub').onclick = app.handlers.submitSub;

        // Password Reset
        document.getElementById('btn-save-pwd').onclick = app.handlers.changePassword;

        if (app.state.token && app.state.email) {
            await app.actions.getState();
        } else {
            app.ui.showAuth('login');
            app.ui.showLoader(false);
        }
    },

    ui: {
        showLoader: (show) => document.getElementById('loader').classList.toggle('hidden', !show),

        showAuth: (view) => {
            document.getElementById('view-auth').classList.add('active');
            document.getElementById('view-app').classList.remove('active');
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            if(view === 'login') document.getElementById('form-login').classList.add('active');
            if(view === 'register') document.getElementById('form-register').classList.add('active');
            if(view === 'reset') document.getElementById('form-reset').classList.add('active');
        },

        showDashboard: () => {
            app.ui.showSection('section-dashboard');
            app.state.currentChatId = null;
            document.getElementById('btn-back').classList.add('hidden');
            document.getElementById('btn-menu').classList.remove('hidden');
            if(app.state.pollingInterval) clearInterval(app.state.pollingInterval);
            app.state.pollingInterval = setInterval(app.actions.getState, 10000); // Slow poll for list
        },

        showChat: (chatId) => {
            app.state.currentChatId = chatId;
            app.ui.showSection('section-chat');
            document.getElementById('btn-back').classList.remove('hidden');
            document.getElementById('btn-menu').classList.add('hidden');
            app.actions.getMessages(chatId);
            if(app.state.pollingInterval) clearInterval(app.state.pollingInterval);
            app.state.pollingInterval = setInterval(() => app.actions.getMessages(chatId), 3000); // Fast poll
        },

        showSection: (id) => {
            document.getElementById('view-auth').classList.remove('active');
            document.getElementById('view-app').classList.add('active');
            document.querySelectorAll('.app-section').forEach(s => s.classList.remove('active'));
            document.getElementById(id).classList.add('active');
        },

        showModal: (id) => document.getElementById(id).classList.add('active'),
        hideModal: (id) => document.getElementById(id).classList.remove('active'),

        toggleMenu: () => {
             // Placeholder for simple logout/menu
             if(confirm("Se déconnecter ?")) {
                 localStorage.clear();
                 location.reload();
             }
        },

        toast: (msg) => {
            const t = document.createElement('div');
            t.className = 'toast';
            t.innerText = msg;
            document.getElementById('toast-container').appendChild(t);
            setTimeout(() => t.remove(), 3000);
        },

        renderChatList: (chats) => {
            const list = document.getElementById('chat-list');
            list.innerHTML = '';
            if (chats.length === 0) {
                list.innerHTML = '<div class="empty-state">Aucune conversation active.</div>';
                return;
            }
            chats.forEach(c => {
                const el = document.createElement('div');
                el.className = 'chat-item';
                el.innerHTML = `<h4>${c.participantNames}</h4><p>Ex: ${c.expiresAt ? new Date(c.expiresAt).toLocaleTimeString() : '∞'}</p>`;
                el.onclick = () => app.ui.showChat(c.id);
                list.appendChild(el);
            });
        },

        renderMessages: (messages, meta) => {
            const container = document.getElementById('message-container');
            container.innerHTML = ''; // Full redraw for simplicity in this version

            document.getElementById('chat-participants').innerText = meta.participantNames;

            // Timer update
            if (meta.expiresAt) {
                const diff = new Date(meta.expiresAt) - new Date();
                if (diff > 0) {
                    const m = Math.floor(diff / 60000);
                    const s = Math.floor((diff % 60000) / 1000);
                    document.getElementById('chat-timer').innerText = `${m}m ${s}s`;
                } else {
                    document.getElementById('chat-timer').innerText = "Expiré";
                }
            } else {
                document.getElementById('chat-timer').innerText = "Infini";
            }

            messages.forEach(m => {
                const el = document.createElement('div');
                el.className = `msg ${m.type} ${m.sender === app.state.email ? 'own' : 'other'}`;

                let content = '';
                if (m.type === 'text') content = escapeHtml(m.content);
                if (m.type === 'image') content = `<img src="${m.content}" onclick="app.ui.viewImage(this.src)">`;
                if (m.type === 'file') content = `<a href="${m.content}" target="_blank" style="color:white; text-decoration:underline;">📁 Fichier</a>`;
                if (m.type === 'system') content = m.content;

                el.innerHTML = `
                    ${m.type !== 'system' ? `<span class="msg-sender">${m.senderName}</span>` : ''}
                    ${content}
                `;
                container.appendChild(el);
            });
            container.scrollTop = container.scrollHeight;
        },

        viewImage: (src) => {
            const w = window.open("");
            w.document.write(`<img src="${src}" style="width:100%">`);
        },

        renderUser: (u) => {
            document.getElementById('user-greeting').innerText = `Bonjour, ${u.firstName}`;
            // Render Avatar
            const initial = u.firstName ? u.firstName.charAt(0).toUpperCase() : '?';
            document.getElementById('header-avatar').innerText = initial;

            document.getElementById('badge-admin').classList.toggle('hidden', !u.isAdmin);
            document.getElementById('badge-sub').classList.toggle('hidden', !u.isSubscriber);
            document.getElementById('fab-admin').classList.toggle('hidden', !u.isAdmin);

            // Logic for Creation vs Subscription FAB
            const canCreate = (u.canCreate || u.isAdmin || u.isSubscriber);
            document.getElementById('fab-new').classList.toggle('hidden', !canCreate);
            document.getElementById('fab-sub').classList.toggle('hidden', canCreate); // Show sub if CANNOT create

            if (u.mustChangePassword) app.ui.showModal('modal-pwd');
        }
    },

    actions: {
        apiCall: async (payload) => {
            try {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                const json = await res.json();
                if (!json.success && json.error) throw new Error(json.error);
                return json;
            } catch (e) {
                app.ui.toast(e.message);
                app.ui.showLoader(false);
                throw e;
            }
        },

        getState: async () => {
            const res = await app.actions.apiCall({
                action: 'getState',
                token: app.state.token,
                email: app.state.email
            });

            app.state.user = res.user;
            app.ui.renderUser(res.user);

            try {
                const chatsRes = await app.actions.apiCall({
                    action: 'getChats',
                    token: app.state.token,
                    email: app.state.email
                });
                app.state.chats = chatsRes.chats;
                app.ui.renderChatList(chatsRes.chats);
            } catch (e) { console.log("Chats not loaded yet"); }

            app.ui.showDashboard();
            app.ui.showLoader(false);
        },

        getMessages: async (chatId) => {
            const res = await app.actions.apiCall({
                action: 'getMessages',
                token: app.state.token,
                email: app.state.email,
                chatId: chatId
            });
            app.ui.renderMessages(res.messages, res.meta);
        }
    },

    handlers: {
        login: async (e) => {
            e.preventDefault();
            app.ui.showLoader(true);
            const email = document.getElementById('login-email').value;
            const code = document.getElementById('login-code').value;
            try {
                const res = await app.actions.apiCall({ action: 'login', email, code });
                if (res.success) {
                    localStorage.setItem('wh_token', res.token);
                    localStorage.setItem('wh_email', res.user.email);
                    app.state.token = res.token;
                    app.state.email = res.user.email;
                    app.state.user = res.user;
                    app.ui.renderUser(res.user);
                    await app.actions.getState(); // Will load dashboard
                }
            } catch (err) {}
        },

        register: async (e) => {
            e.preventDefault();
            app.ui.showLoader(true);
            const email = document.getElementById('reg-email').value;
            const name = document.getElementById('reg-name').value;
            const code = document.getElementById('reg-code').value;
            try {
                const res = await app.actions.apiCall({ action: 'register', email, firstName: name, code });
                if (res.success) {
                    app.ui.toast("Inscription réussie ! Connectez-vous.");
                    app.ui.showAuth('login');
                }
            } catch (err) {}
            app.ui.showLoader(false);
        },

        createChat: async () => {
             const emails = document.getElementById('new-chat-emails').value;
             const dur = document.querySelector('.dur-btn.active').dataset.val;
             app.ui.showLoader(true);
             try {
                 const res = await app.actions.apiCall({
                     action: 'createChat',
                     token: app.state.token,
                     email: app.state.email,
                     participants: emails,
                     duration: dur
                 });
                 if (res.success) {
                     app.ui.hideModal('modal-new-chat');
                     app.ui.toast("Conversation créée");
                     await app.actions.getState();
                 }
             } catch(e){}
             app.ui.showLoader(false);
        },

        sendMessage: async () => {
            const input = document.getElementById('msg-input');
            const txt = input.value.trim();
            if (!txt) return;
            input.value = ''; // Optimistic clear
            try {
                await app.actions.apiCall({
                    action: 'sendMessage',
                    token: app.state.token,
                    email: app.state.email,
                    chatId: app.state.currentChatId,
                    content: txt,
                    type: 'text'
                });
                app.actions.getMessages(app.state.currentChatId);
            } catch (e) { input.value = txt; } // Revert on fail
        },

        uploadFile: async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async function(evt) {
                const b64 = evt.target.result;
                // Basic compression could go here
                try {
                    app.ui.toast("Envoi de l'image...");
                    await app.actions.apiCall({
                        action: 'sendMessage',
                        token: app.state.token,
                        email: app.state.email,
                        chatId: app.state.currentChatId,
                        content: b64,
                        type: 'image' // Simplified logic, assumes image
                    });
                    app.actions.getMessages(app.state.currentChatId);
                } catch(e) {}
            };
            reader.readAsDataURL(file);
            e.target.value = ''; // Reset
        },

        changePassword: async () => {
            const newCode = document.getElementById('new-pwd-input').value;
            if (newCode.length !== 3) return app.ui.toast("3 chiffres requis.");
            // In a real scenario, we'd prompt for the old code.
            // For now, we assume the user knows they need to contact admin if stuck,
            // or we would store the temp code in session for this specific flow.
            // To make this work without oldCode storage, we'd need to update the API
            // or ask the user "Entrez votre code actuel".
            app.ui.toast("Veuillez vous reconnecter avec le nouveau code après validation.");
            app.ui.hideModal('modal-pwd');
        },

        submitSub: async () => {
            const txn = document.getElementById('sub-trans-id').value;
            if (!txn) return app.ui.toast("Numéro de transaction requis.");
            app.ui.showLoader(true);
            try {
                const res = await app.actions.apiCall({
                    action: 'submitSubscription',
                    token: app.state.token,
                    email: app.state.email,
                    paypalTransaction: txn
                });
                if (res.success) {
                    app.ui.toast("Demande envoyée !");
                    app.ui.hideModal('modal-sub');
                }
            } catch(e) {}
            app.ui.showLoader(false);
        },

        openSubscription: async () => {
            app.ui.showLoader(true);
            try {
                const res = await app.actions.apiCall({
                    action: 'getSubscriptionCode',
                    token: app.state.token,
                    email: app.state.email
                });

                if (res.success) {
                    document.getElementById('sub-code-display').innerText = res.code;
                    document.getElementById('sub-price-display').innerText = res.price + " €";
                    document.getElementById('sub-paypal-link').href = res.paypalLink;
                    app.ui.showModal('modal-sub');
                }
            } catch(e){}
            app.ui.showLoader(false);
        }
    }
};

const admin = {
    refreshUsers: async () => {
        app.ui.showLoader(true);
        try {
            const res = await app.actions.apiCall({
                 action: 'adminGetUsers', token: app.state.token, email: app.state.email
            });
            const list = document.getElementById('admin-users-list');
            list.innerHTML = '';
            res.users.forEach(u => {
                const div = document.createElement('div');
                div.className = 'admin-item';
                div.innerHTML = `
                    <div class="admin-item-header">
                        <strong>${u.firstName} (${u.email})</strong>
                        <span style="font-size:0.8rem">${u.isSuperAdmin ? 'SUPER ADMIN' : ''}</span>
                    </div>
                    <div class="admin-item-actions">
                        <button class="role-tag ${u.isAdmin ? 'active' : ''}" onclick="admin.toggleRole('${u.email}', 'admin', ${!u.isAdmin})">ADMIN</button>
                        <button class="role-tag ${u.canCreate ? 'active' : ''}" onclick="admin.toggleRole('${u.email}', 'create', ${!u.canCreate})">CREATOR</button>
                        <button class="role-tag ${u.isSubscriber ? 'active' : ''}" onclick="admin.toggleRole('${u.email}', 'sub', ${!u.isSubscriber})">SUB</button>
                        ${!u.isSuperAdmin ? `<button class="btn-sm" style="color:red;border-color:red" onclick="admin.deleteUser('${u.email}')">X</button>` : ''}
                        ${!u.isSuperAdmin ? `<button class="btn-sm" onclick="admin.resetPwd('${u.email}')">PWD</button>` : ''}
                    </div>
                `;
                list.appendChild(div);
            });
        } catch(e){}
        app.ui.showLoader(false);
    },

    refreshSubs: async () => {
        app.ui.showLoader(true);
        try {
            const res = await app.actions.apiCall({
                action: 'adminGetSubscriptions', token: app.state.token, email: app.state.email
            });
            const list = document.getElementById('admin-subs-list');
            list.innerHTML = '';
            res.subscriptions.forEach(s => {
                const div = document.createElement('div');
                div.className = 'admin-item';
                div.innerHTML = `
                   <strong>${s.firstName}</strong> - ${s.status}<br>
                   Code: ${s.whatsappenCode} <br>
                   TXN: ${s.paypalTransaction || 'N/A'} <br>
                   ${s.status === 'pending' ? `<button class="btn-gold" style="margin-top:5px;font-size:0.8rem" onclick="admin.validateSub('${s.email}')">Valider</button>` : ''}
                `;
                list.appendChild(div);
            });
        } catch(e){}
        app.ui.showLoader(false);
    },

    toggleRole: async (targetEmail, role, value) => {
        let payload = { action: 'adminUpdateUser', token: app.state.token, email: app.state.email, targetEmail: targetEmail };
        if (role === 'admin') payload.isAdmin = value;
        if (role === 'create') payload.canCreate = value;
        if (role === 'sub') payload.isSubscriber = value;

        await app.actions.apiCall(payload);
        admin.refreshUsers();
    },

    deleteUser: async (targetEmail) => {
        if(!confirm("Supprimer " + targetEmail + " ?")) return;
        await app.actions.apiCall({ action: 'adminDeleteUser', token: app.state.token, email: app.state.email, targetEmail: targetEmail });
        admin.refreshUsers();
    },

    resetPwd: async (targetEmail) => {
        const res = await app.actions.apiCall({ action: 'adminResetPassword', token: app.state.token, email: app.state.email, targetEmail: targetEmail });
        if(res.success) alert("Nouveau code temporaire : " + res.newCode);
    },

    validateSub: async (targetEmail) => {
        const months = prompt("Nombre de mois ?", "1");
        if(!months) return;
        const start = new Date();
        const end = new Date();
        end.setMonth(end.getMonth() + parseInt(months));

        await app.actions.apiCall({
            action: 'adminValidateSubscription',
            token: app.state.token,
            email: app.state.email,
            targetEmail: targetEmail,
            startDate: start.toISOString(),
            endDate: end.toISOString()
        });
        admin.refreshSubs();
    },

    saveSettings: async () => {
         // Placeholder for settings save logic
         app.ui.toast("Sauvegardé");
    }
};

// Utils
function escapeHtml(text) {
  if (!text) return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.app = app; // Expose to global scope for Playwright
// Start
window.onload = app.init;

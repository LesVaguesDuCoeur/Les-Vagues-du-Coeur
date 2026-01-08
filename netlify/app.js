// ==========================================
// CONFIGURATION
// ==========================================
// Encoded URL to prevent plain-text scraping
// INSTRUCTIONS: Remplacer par la nouvelle URL encodée en Base64
// Utilisez btoa('https://script.google.com/macros/s/XXXXX/exec') dans la console pour l'obtenir.
const _ENC_URL = "aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9OT1RfQ09ORklHVVJFRF9ZRVQvZXhlYw==";

const app = {
    user: null,
    currentChatId: null,
    pollingInterval: null,
    timerInterval: null,
    chatExpiresAt: null,

    init: function() {
        this.setupListeners();

        // Chargement du Logo
        if (typeof LOGO_BASE64 !== 'undefined' && LOGO_BASE64.length > 20) {
            document.getElementById('app-logo').src = LOGO_BASE64;
        }

        // Vérification session locale
        const savedUser = localStorage.getItem('wh_user');
        if (savedUser) {
            try {
                this.user = JSON.parse(savedUser);
                this.showDashboard();
            } catch (e) {
                localStorage.removeItem('wh_user');
                this.showLogin();
            }
        } else {
            this.showLogin();
        }
        document.getElementById('loader').classList.add('hidden');
    },

    getApiUrl: function() {
        return atob(_ENC_URL);
    },

    setupListeners: function() {
        document.getElementById('form-login').onsubmit = (e) => { e.preventDefault(); this.doLogin(); };
        document.getElementById('form-register').onsubmit = (e) => { e.preventDefault(); this.doRegister(); };

        document.getElementById('btn-logout').onclick = () => this.logout();
        document.getElementById('btn-refresh').onclick = () => this.loadConversations();
        document.getElementById('btn-create-chat').onclick = () => this.createChat();

        document.getElementById('btn-send').onclick = () => this.sendMessage();
        document.getElementById('message-input').onkeypress = (e) => { if(e.key === 'Enter') this.sendMessage(); };
        document.getElementById('btn-refresh-chat').onclick = () => this.loadMessages(this.currentChatId);

        // Ajout membre
        document.getElementById('btn-add-member').onclick = () => this.addMember();

        // Admin Access - Dashboard Logo
        const adminBtn = document.getElementById('btn-admin-access');
        if (adminBtn) {
            adminBtn.onclick = () => {
                if (this.user && (this.user.isAdmin || this.user.email === 'chaouiengage@gmail.com')) {
                    this.showAdmin();
                }
            };
        }

        // Sécurité Visuelle
        window.addEventListener('blur', () => document.body.classList.add('blurred'));
        window.addEventListener('focus', () => document.body.classList.remove('blurred'));
        document.addEventListener('contextmenu', event => event.preventDefault());

        // Sélection durée
        document.querySelectorAll('.chip').forEach(c => {
            c.onclick = () => {
                document.querySelectorAll('.chip').forEach(x => x.classList.remove('selected'));
                c.classList.add('selected');
            };
        });
    },

    // ==========================================
    // API CALLER
    // ==========================================
    api: async function(action, payload = {}) {
        const body = { action, ...payload };
        if (this.user && this.user.token) {
            body.token = this.user.token;
            body.email = this.user.email;
        }

        try {
            const res = await fetch(this.getApiUrl(), {
                method: 'POST',
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (data.error) {
                if (data.error.includes("Session") || data.error.includes("invalide")) {
                    // Do not logout immediately on transient errors, but yes on session invalid
                    this.logout();
                }
                throw new Error(data.error);
            }
            return data;
        } catch (e) {
            console.error("Erreur API:", e);
            throw e;
        }
    },

    // ==========================================
    // ACTIONS
    // ==========================================
    doLogin: async function() {
        const email = document.getElementById('login-email').value;
        const code = document.getElementById('login-code').value;

        try {
            this.toggleLoader(true);
            const res = await this.api('login', { email, code });
            this.user = res.user;
            localStorage.setItem('wh_user', JSON.stringify(this.user));
            this.showDashboard();
        } catch (e) {
            alert(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    doRegister: async function() {
        const email = document.getElementById('reg-email').value;
        const firstName = document.getElementById('reg-firstname').value;
        const code = document.getElementById('reg-code').value;

        try {
            this.toggleLoader(true);
            const res = await this.api('register', { email, firstName, code });
            this.user = res.user;
            localStorage.setItem('wh_user', JSON.stringify(this.user));
            this.showDashboard();
        } catch (e) {
            alert(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    logout: function() {
        this.user = null;
        this.stopPolling();
        localStorage.removeItem('wh_user');
        this.showLogin();
    },

    loadConversations: async function() {
        if (!this.user) return;
        try {
            const res = await this.api('getConversations');
            const list = document.getElementById('chat-list');
            list.innerHTML = '';

            if (!res.chats || res.chats.length === 0) {
                list.innerHTML = '<div style="text-align:center;color:#666;margin-top:20px;font-size:0.8rem">Aucune conversation active.<br>Demandez à un Admin de vous écrire.</div>';
                return;
            }

            res.chats.forEach(chat => {
                const el = document.createElement('div');
                el.className = 'chat-card';

                let lastMsg = "Nouvelle conversation";
                if (chat.lastMessage) {
                    const sender = chat.lastMessage.sender === this.user.email ? "Vous" : chat.lastMessage.senderName || "...";
                    const content = chat.lastMessage.type === 'image' ? '📷 Photo' : chat.lastMessage.content;
                    lastMsg = `${sender}: ${content}`;
                }

                let timeLeft = "∞";
                if (chat.expiresAt) {
                    const diff = new Date(chat.expiresAt) - new Date();
                    if (diff > 0) {
                        const mins = Math.floor(diff / 60000);
                        const hours = Math.floor(mins / 60);
                        timeLeft = hours > 0 ? `${hours}h${mins%60}` : `${mins}m`;
                    } else {
                        timeLeft = "Expiré";
                    }
                }

                el.innerHTML = `
                    <div class="card-content">
                        <h4>Conversation</h4>
                        <p>${lastMsg}</p>
                    </div>
                    <div class="card-meta">
                        <div style="margin-bottom:5px">⏳ ${timeLeft}</div>
                        <div>➔</div>
                    </div>
                `;
                el.onclick = () => this.enterChat(chat.id, chat.expiresAt);
                list.appendChild(el);
            });
        } catch (e) {
            console.log("Polling silencieux...");
        }
    },

    createChat: async function() {
        const emails = document.getElementById('new-chat-emails').value.split(',').map(e => e.trim());
        const durationChip = document.querySelector('.chip.selected');
        const duration = durationChip ? durationChip.dataset.val : '24h';

        if (!emails[0]) return alert("Veuillez mettre un email.");

        try {
            this.toggleLoader(true);
            const res = await this.api('createConversation', {
                participants: emails,
                duration: duration
            });
            this.enterChat(res.chatId, null); // ExpiresAt unknown until fetch, but okay
        } catch (e) {
            alert(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    enterChat: function(chatId, expiresAt) {
        this.currentChatId = chatId;
        this.chatExpiresAt = expiresAt ? new Date(expiresAt) : null;

        this.showView('view-chat');
        this.loadMessages(chatId);
        this.startTimer();

        this.stopPolling();
        // Reduced polling freq to be nice to quotas, but user wants "Real Time"
        this.pollingInterval = setInterval(() => this.loadMessages(chatId), 3000);
    },

    startTimer: function() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        const display = document.getElementById('chat-timer-display');

        const update = () => {
            if (!this.chatExpiresAt) {
                display.textContent = "";
                return;
            }
            const now = new Date();
            const diff = this.chatExpiresAt - now;

            if (diff <= 0) {
                display.textContent = "Expiré";
                return;
            }

            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            display.textContent = `⏳ ${hours}h ${minutes}m ${seconds}s`;
        };

        update();
        this.timerInterval = setInterval(update, 1000);
    },

    loadMessages: async function(chatId) {
        if (!chatId) return;
        try {
            const res = await this.api('getMessages', { chatId });
            const area = document.getElementById('messages-area');

            document.getElementById('chat-title').textContent = res.participantNames;

            // Render logic optimized to prevent flicker if no change?
            // For now, simpler to clear and render, but we can do a quick check
            // if we are sending, maybe don't wipe?
            // The issue reported was DOUBLE messages.

            area.innerHTML = '';

            res.messages.forEach(msg => {
                const div = document.createElement('div');
                div.className = `msg ${msg.isMe ? 'me' : 'other'} ${msg.type === 'system' ? 'system' : ''}`;

                if (msg.type === 'system') {
                    div.innerHTML = `<small><i>${msg.senderName} ${msg.content}</i></small>`;
                    div.style.background = 'transparent';
                    div.style.textAlign = 'center';
                    div.style.width = '100%';
                } else {
                    let content = '';
                    if (msg.type === 'image') content = `<img src="${msg.content}">`;
                    else content = `<div>${msg.content}</div>`;

                    div.innerHTML = `
                        <div class="msg-name">${msg.senderName}</div>
                        ${content}
                        <div style="font-size:0.6rem; opacity:0.5; text-align:right; margin-top:2px">
                           ${new Date(msg.timestamp).toLocaleTimeString().slice(0,5)}
                        </div>
                    `;
                }
                area.appendChild(div);
            });

            // Set Timer if we didn't have it (e.g. from refresh)
            // But we don't get expiresAt here. Only list gets it.
            // Minor issue, but usually okay as user comes from list.

            // Auto scroll bas
            // if (area.scrollHeight - area.scrollTop - area.clientHeight < 200) {
            area.scrollTop = area.scrollHeight;
            // }
        } catch (e) {
            // ignorer erreurs polling
        }
    },

    sendMessage: async function() {
        const input = document.getElementById('message-input');
        const fileInput = document.getElementById('file-input');
        const btn = document.getElementById('btn-send');

        const text = input.value;
        const hasFile = fileInput.files.length > 0;

        if (!text.trim() && !hasFile) return;

        // Prevent Double Click
        btn.disabled = true;
        btn.innerHTML = "...";

        try {
            if (hasFile) {
                const file = fileInput.files[0];
                const reader = new FileReader();
                reader.onload = async (e) => {
                    await this.sendPayload(e.target.result, 'image');
                    fileInput.value = '';
                };
                reader.readAsDataURL(file);
            } else {
                await this.sendPayload(text, 'text');
                input.value = '';
            }
        } catch (e) {
            alert("Erreur: " + e.message);
        } finally {
            // Re-enable
            btn.disabled = false;
            btn.innerHTML = "➤";
            // Focus back
            input.focus();
        }
    },

    sendPayload: async function(content, type) {
        await this.api('sendMessage', {
            chatId: this.currentChatId,
            content,
            type
        });
        // Immediate refresh
        await this.loadMessages(this.currentChatId);
    },

    addMember: async function() {
        const email = prompt("Email de la personne à ajouter :");
        if (!email) return;

        try {
            this.toggleLoader(true);
            await this.api('addParticipant', {
               chatId: this.currentChatId,
               targetEmail: email
            });
            alert("Ajouté avec succès !");
            this.loadMessages(this.currentChatId);
        } catch (e) {
            alert(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    // ==========================================
    // ADMIN
    // ==========================================
    showAdmin: async function() {
        this.showView('view-admin');
        try {
            const res = await this.api('adminGetUsers');
            const list = document.getElementById('admin-list');
            list.innerHTML = res.users.map(u => `
                <div class="chat-card" style="cursor:default;">
                    <div class="card-content">
                        <h4>${u.firstName} ${u.isAdmin ? '👑' : ''}</h4>
                        <p>${u.email}</p>
                    </div>
                    <div class="card-meta">
                        <label class="switch-label">
                           <input type="checkbox" ${u.permissions?.canCreateChat ? 'checked' : ''}
                            onchange="app.toggleRights('${u.email}', this.checked)">
                           Création
                        </label>
                    </div>
                </div>
            `).join('');
        } catch(e) {
            alert("Accès refusé");
            this.showDashboard();
        }
    },

    toggleRights: async function(email, canCreate) {
        try {
            await this.api('adminUpdateUserRights', { targetEmail: email, canCreate: canCreate });
        } catch(e) {
            alert("Erreur mise à jour");
        }
    },

    // ==========================================
    // UI UTILS
    // ==========================================
    showView: function(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active', 'hidden'));
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));

        const target = document.getElementById(viewId);
        target.classList.remove('hidden');
        target.classList.add('active');

        if (viewId === 'view-dashboard') {
            document.getElementById('user-initial').textContent = this.user.firstName.charAt(0).toUpperCase();
            document.getElementById('user-greeting').textContent = this.user.firstName;

            // Gestion Bouton Créer (+)
            const fab = document.getElementById('btn-create-fab');
            if (this.user.permissions?.canCreateChat || this.user.isAdmin) {
                fab.classList.remove('hidden');
            } else {
                fab.classList.add('hidden');
            }

            this.stopPolling();
            if (this.timerInterval) clearInterval(this.timerInterval);
            this.loadConversations();
            this.pollingInterval = setInterval(() => this.loadConversations(), 10000);
        } else if (viewId !== 'view-chat') {
            this.stopPolling();
        }
    },

    showLogin: function() {
        this.showView('view-auth');
        document.getElementById('form-login').classList.remove('hidden');
        document.getElementById('form-register').classList.add('hidden');
    },

    showRegister: function() {
        document.getElementById('form-login').classList.add('hidden');
        document.getElementById('form-register').classList.remove('hidden');
    },

    showDashboard: function() { this.showView('view-dashboard'); },
    showNewChat: function() { this.showView('view-new-chat'); },

    toggleLoader: function(show) {
        const l = document.getElementById('loader');
        if (show) l.classList.remove('hidden'); else l.classList.add('hidden');
    },

    stopPolling: function() { if (this.pollingInterval) clearInterval(this.pollingInterval); }
};

window.onload = () => app.init();

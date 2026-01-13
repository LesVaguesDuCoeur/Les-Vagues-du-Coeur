// ==========================================
// CONFIGURATION
// ==========================================
const _ENC_URL = "aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4ekZldmJRSnplcndEMkwtdU5jVlRSSkU5WFZKNEhHZEM5S1VmdE95SUtUOXBxRXJzdk5mUHNmU0MxMk1qQkVVRFF2QS9leGVj";

const app = {
    user: null,
    currentChatId: null,
    pollingInterval: null,
    timerInterval: null,
    chatExpiresAt: null,

    init: function() {
        this.setupListeners();

        // Logo Handling
        if (typeof LOGO_BASE64 !== 'undefined' && LOGO_BASE64.length > 20) {
            const logoEl = document.getElementById('app-logo');
            if (logoEl) logoEl.src = LOGO_BASE64;
        }

        // Session Check
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

    // ==========================================
    // CUSTOM MODALS (No Alerts)
    // ==========================================
    showModal: function(type, title, message, showCancel = false, inputPlaceholder = null) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('modal-overlay');
            const box = document.getElementById('modal-box');
            const titleEl = box.querySelector('.modal-title');
            const messageEl = box.querySelector('.modal-message');
            const inputContainer = box.querySelector('.modal-input-container');
            const input = document.getElementById('modal-input');
            const cancelBtn = document.getElementById('modal-cancel');
            const confirmBtn = document.getElementById('modal-confirm');

            // Reset classes
            box.className = 'modal-box ' + type;
            titleEl.textContent = title;
            messageEl.textContent = message;

            // Input Mode
            if (inputPlaceholder) {
                inputContainer.classList.remove('hidden');
                input.placeholder = inputPlaceholder;
                input.value = '';
                input.focus();
            } else {
                inputContainer.classList.add('hidden');
            }

            // Buttons
            if (showCancel) {
                cancelBtn.classList.remove('hidden');
            } else {
                cancelBtn.classList.add('hidden');
            }

            overlay.classList.remove('hidden');

            const cleanup = () => {
                overlay.classList.add('hidden');
                // Remove listeners to prevent accumulation
                confirmBtn.onclick = null;
                cancelBtn.onclick = null;
            };

            confirmBtn.onclick = () => {
                cleanup();
                resolve(inputPlaceholder ? input.value : true);
            };

            cancelBtn.onclick = () => {
                cleanup();
                resolve(null);
            };
        });
    },

    showError: function(msg) { return this.showModal('error', 'Erreur', msg); },
    showSuccess: function(msg) { return this.showModal('success', 'Succès', msg); },
    showInfo: function(msg) { return this.showModal('info', 'Info', msg); },
    showConfirm: function(msg) { return this.showModal('confirm', 'Confirmation', msg, true); },
    showPrompt: function(title, placeholder) { return this.showModal('info', title, '', true, placeholder); },

    // ==========================================
    // LISTENERS
    // ==========================================
    setupListeners: function() {
        document.getElementById('form-login').onsubmit = (e) => { e.preventDefault(); this.doLogin(); };
        document.getElementById('form-register').onsubmit = (e) => { e.preventDefault(); this.doRegister(); };

        document.getElementById('btn-logout').onclick = () => this.logout();
        document.getElementById('btn-refresh').onclick = () => this.loadConversations();
        document.getElementById('btn-create-chat').onclick = () => this.createChat();

        document.getElementById('btn-send').onclick = () => this.sendMessage();
        document.getElementById('message-input').onkeypress = (e) => { if(e.key === 'Enter') this.sendMessage(); };
        document.getElementById('btn-refresh-chat').onclick = () => this.loadMessages(this.currentChatId);
        document.getElementById('btn-add-member').onclick = () => this.addMember();

        // Admin Access - Click on Avatar
        const adminBtn = document.getElementById('btn-admin-access');
        if (adminBtn) {
            adminBtn.onclick = () => {
                const adminEmail = atob("Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ==");
                if (this.user && (this.user.isAdmin === true || this.user.email === adminEmail)) {
                    this.showAdmin();
                } else {
                    // Non-admin profile view could go here, for now show info
                    this.showInfo(`Connecté en tant que ${this.user.firstName}`);
                }
            };
            adminBtn.style.cursor = "pointer";
        }

        // Anti-Screenshot Focus
        window.addEventListener('blur', () => document.body.classList.add('blurred'));
        window.addEventListener('focus', () => document.body.classList.remove('blurred'));
        document.addEventListener('contextmenu', event => event.preventDefault());

        // Chips
        document.querySelectorAll('.chip').forEach(c => {
            c.onclick = () => {
                document.querySelectorAll('.chip').forEach(x => x.classList.remove('selected'));
                c.classList.add('selected');
            };
        });
    },

    // ==========================================
    // API
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
                    this.logout();
                }
                throw new Error(data.error);
            }
            return data;
        } catch (e) {
            console.error("API Error:", e);
            throw e;
        }
    },

    // ==========================================
    // AUTH
    // ==========================================
    doLogin: async function() {
        const email = document.getElementById('login-email').value;
        const code = document.getElementById('login-code').value;

        try {
            this.toggleLoader(true);
            const res = await this.api('login', { email, code });

            if (res.requireNewPassword) {
                await this.handleChangePassword(email, code);
                return;
            }

            // Ensure token is stored
            this.user = {
                ...res.user,
                token: res.token
            };
            localStorage.setItem('wh_user', JSON.stringify(this.user));
            this.showDashboard();
        } catch (e) {
            this.showError(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    handleChangePassword: async function(email, oldCode) {
        this.toggleLoader(false);
        const newCode = await this.showPrompt("Nouveau Code Secret", "Entrez votre nouveau code");
        if (!newCode) return;

        try {
            this.toggleLoader(true);
            const res = await this.api('changePassword', { email, oldCode, newCode });
            this.user = res.user;
            localStorage.setItem('wh_user', JSON.stringify(this.user));
            this.showSuccess("Mot de passe mis à jour !");
            this.showDashboard();
        } catch(e) {
            this.showError(e.message);
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
            this.showError(e.message);
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

    // ==========================================
    // CHATS
    // ==========================================
    loadConversations: async function() {
        if (!this.user) return;
        try {
            const res = await this.api('getConversations');
            const list = document.getElementById('chat-list');
            list.innerHTML = '';

            if (!res.chats || res.chats.length === 0) {
                list.innerHTML = '<div style="text-align:center;color:#666;margin-top:20px;font-size:0.8rem">Aucune conversation active.</div>';
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
                    if (diff <= 0) {
                        timeLeft = "Expiré";
                    } else {
                        const mins = Math.floor(diff / 60000);
                        const hours = Math.floor(mins / 60);
                        timeLeft = hours > 0 ? `${hours}h${mins%60}` : `${mins}m`;
                    }
                }

                el.innerHTML = `
                    <div class="card-content">
                        <h4>${chat.participantNames}</h4>
                        <p>${lastMsg}</p>
                    </div>
                    <div class="card-meta">
                        <div style="margin-bottom:5px">⏳ ${timeLeft}</div>
                        <div>➔</div>
                    </div>
                `;
                // If expired locally, don't open? Or open and let backend handle?
                // Better to let backend handle delete.
                el.onclick = () => this.enterChat(chat.id, chat.expiresAt);
                list.appendChild(el);
            });
        } catch (e) {
            console.log("Polling silent error");
        }
    },

    createChat: async function() {
        const emails = document.getElementById('new-chat-emails').value.split(',').map(e => e.trim());
        const durationChip = document.querySelector('.chip.selected');
        const duration = durationChip ? durationChip.dataset.val : '24h';

        if (!emails[0]) return this.showError("Veuillez mettre au moins un email.");

        try {
            this.toggleLoader(true);
            const res = await this.api('createConversation', {
                participants: emails,
                duration: duration
            });
            this.enterChat(res.chatId, null);
        } catch (e) {
            this.showError(e.message);
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
        // Poll messages
        this.pollingInterval = setInterval(() => this.loadMessages(chatId), 3000);
    },

    startTimer: function() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        const display = document.getElementById('chat-timer-display');

        const update = async () => {
            if (!this.chatExpiresAt) {
                display.textContent = "";
                return;
            }
            const now = new Date();
            const diff = this.chatExpiresAt - now;

            if (diff <= 0) {
                display.textContent = "Expiré";
                clearInterval(this.timerInterval);
                await this.handleExpiration();
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

    handleExpiration: async function() {
        await this.showInfo("Cette conversation a expiré.");
        try {
            await this.api('expireChat', { chatId: this.currentChatId });
        } catch(e) {} // best effort
        this.showDashboard();
    },

    loadMessages: async function(chatId) {
        if (!chatId) return;
        try {
            const res = await this.api('getMessages', { chatId });
            if (res.expired) {
                await this.handleExpiration();
                return;
            }

            const area = document.getElementById('messages-area');
            document.getElementById('chat-title').textContent = res.participantNames;

            // Simple render
            area.innerHTML = '';
            res.messages.forEach(msg => {
                const div = document.createElement('div');
                div.className = `msg ${msg.isMe ? 'me' : 'other'} ${msg.type === 'system' ? 'system' : ''}`;

                if (msg.type === 'system') {
                    div.innerHTML = `<small><i>${msg.senderName} ${msg.content}</i></small>`;
                    div.style.background = 'transparent'; div.style.textAlign = 'center'; div.style.width = '100%';
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
            area.scrollTop = area.scrollHeight;
        } catch (e) {
            // silent fail on poll
        }
    },

    sendMessage: async function() {
        const input = document.getElementById('message-input');
        const fileInput = document.getElementById('file-input');
        const btn = document.getElementById('btn-send');

        const text = input.value;
        const hasFile = fileInput.files.length > 0;

        if (!text.trim() && !hasFile) return;

        btn.disabled = true;
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
            this.showError("Erreur envoi: " + e.message);
        } finally {
            btn.disabled = false;
            input.focus();
        }
    },

    sendPayload: async function(content, type) {
        await this.api('sendMessage', { chatId: this.currentChatId, content, type });
        await this.loadMessages(this.currentChatId);
    },

    addMember: async function() {
        const email = await this.showPrompt("Ajouter un membre", "Email du participant");
        if (!email) return;

        try {
            this.toggleLoader(true);
            await this.api('addParticipant', { chatId: this.currentChatId, targetEmail: email });
            this.showSuccess("Participant ajouté !");
            this.loadMessages(this.currentChatId);
        } catch (e) {
            this.showError(e.message);
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
                        <button onclick="app.deleteUser('${u.email}')" style="background:none;border:none;color:#d00;cursor:pointer;font-size:0.8rem;margin-top:5px;">Supprimer</button>
                    </div>
                </div>
            `).join('');
        } catch(e) {
            this.showError("Accès refusé");
            this.showDashboard();
        }
    },

    toggleRights: async function(email, canCreate) {
        try {
            await this.api('adminUpdateUserRights', { targetEmail: email, canCreate: canCreate });
        } catch(e) {
            this.showError("Erreur mise à jour");
        }
    },

    deleteUser: async function(email) {
        if (!await this.showConfirm("Supprimer cet utilisateur ?")) return;
        try {
            await this.api('adminDeleteUser', { targetEmail: email });
            this.showAdmin(); // Refresh
        } catch(e) {
            this.showError(e.message);
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
            document.getElementById('user-greeting').textContent = this.user.firstName;

            // Set Avatar Letter
            const avatarLet = document.getElementById('user-avatar-letter');
            if(avatarLet && this.user.firstName) {
                avatarLet.textContent = this.user.firstName.charAt(0).toUpperCase();
            }

            // FAB Visibility
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

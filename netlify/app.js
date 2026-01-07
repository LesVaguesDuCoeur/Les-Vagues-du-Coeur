// ==========================================
// CONFIGURATION
// ==========================================
// REPLACE THIS URL with your deployed Google Apps Script Web App URL
const API_URL = "REMPLACER_PAR_VOTRE_URL_APPS_SCRIPT";

const app = {
    user: null,
    currentChatId: null,
    pollingInterval: null,

    init: function() {
        this.setupListeners();
        // Load Logo from external file
        if (typeof LOGO_BASE64 !== 'undefined') {
            document.getElementById('app-logo').src = LOGO_BASE64;
        }

        // Check session
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

    setupListeners: function() {
        document.getElementById('form-login').onsubmit = (e) => { e.preventDefault(); this.doLogin(); };
        document.getElementById('form-register').onsubmit = (e) => { e.preventDefault(); this.doRegister(); };

        document.getElementById('btn-logout').onclick = () => this.logout();
        document.getElementById('btn-refresh').onclick = () => this.loadConversations();
        document.getElementById('btn-create-chat').onclick = () => this.createChat();

        document.getElementById('btn-send').onclick = () => this.sendMessage();
        document.getElementById('message-input').onkeypress = (e) => { if(e.key === 'Enter') this.sendMessage(); };
        document.getElementById('btn-refresh-chat').onclick = () => this.loadMessages(this.currentChatId);

        // Anti-Screenshot
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
    // API CALLER
    // ==========================================
    api: async function(action, payload = {}) {
        if (!API_URL || API_URL.includes("REMPLACER")) {
            alert("Veuillez configurer l'URL de l'API dans app.js");
            return;
        }

        const body = { action, ...payload };
        if (this.user && this.user.token) {
            body.token = this.user.token;
            body.email = this.user.email;
        }

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (data.error) {
                // If session expired
                if (data.error.includes("Session")) {
                    this.logout();
                }
                throw new Error(data.error);
            }
            return data;
        } catch (e) {
            console.error("API Error", e);
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

            if (res.chats.length === 0) {
                list.innerHTML = '<div style="text-align:center;color:#666;margin-top:20px">Aucune conversation</div>';
                return;
            }

            res.chats.forEach(chat => {
                const el = document.createElement('div');
                el.className = 'chat-card';
                // Add unread logic if needed

                let lastMsg = "Nouvelle conversation";
                if (chat.lastMessage) {
                    const sender = chat.lastMessage.sender === this.user.email ? "Vous" : "...";
                    const content = chat.lastMessage.type === 'image' ? '📷 Photo' : chat.lastMessage.content;
                    lastMsg = `${sender}: ${content}`;
                }

                // Timer logic
                let timeLeft = "";
                if (chat.expiresAt) {
                    const diff = new Date(chat.expiresAt) - new Date();
                    if (diff > 0) {
                        const mins = Math.floor(diff / 60000);
                        timeLeft = `${mins}m`;
                    } else {
                        timeLeft = "Expiré";
                    }
                } else {
                    timeLeft = "∞";
                }

                el.innerHTML = `
                    <div class="card-content">
                        <h4>Conversation</h4>
                        <p>${lastMsg}</p>
                    </div>
                    <div class="card-meta">
                        <div>${timeLeft}</div>
                        <div>➔</div>
                    </div>
                `;
                el.onclick = () => this.enterChat(chat.id);
                list.appendChild(el);
            });
        } catch (e) {
            console.log("Polling error (silent)");
        }
    },

    createChat: async function() {
        const emails = document.getElementById('new-chat-emails').value.split(',').map(e => e.trim());
        const durationChip = document.querySelector('.chip.selected');
        const duration = durationChip ? durationChip.dataset.val : '24h';

        if (!emails[0]) return alert("Email requis");

        try {
            this.toggleLoader(true);
            const res = await this.api('createConversation', {
                participants: emails,
                duration: duration
            });
            this.enterChat(res.chatId);
        } catch (e) {
            alert(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    enterChat: function(chatId) {
        this.currentChatId = chatId;
        this.showView('view-chat');
        this.loadMessages(chatId);
        // Poll faster inside chat
        this.stopPolling();
        this.pollingInterval = setInterval(() => this.loadMessages(chatId), 4000);
    },

    loadMessages: async function(chatId) {
        if (!chatId) return;
        try {
            const res = await this.api('getMessages', { chatId });
            const area = document.getElementById('messages-area');

            document.getElementById('chat-title').textContent = res.participantNames;

            // Rebuild simplistic (optimized: usually one would append)
            area.innerHTML = '';

            res.messages.forEach(msg => {
                const div = document.createElement('div');
                div.className = `msg ${msg.isMe ? 'me' : 'other'}`;

                let content = '';
                if (msg.type === 'image') content = `<img src="${msg.content}">`;
                else content = `<div>${msg.content}</div>`;

                div.innerHTML = `
                    <div class="msg-name">${msg.senderName}</div>
                    ${content}
                `;
                area.appendChild(div);
            });

            // Auto scroll if needed
            if (area.scrollHeight - area.scrollTop - area.clientHeight < 100) {
               area.scrollTop = area.scrollHeight;
            }
        } catch (e) {
            console.log("Chat poll error");
        }
    },

    sendMessage: async function() {
        const input = document.getElementById('message-input');
        const fileInput = document.getElementById('file-input');
        const text = input.value;

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64 = e.target.result;
                const type = file.type.startsWith('image/') ? 'image' : 'file'; // Basic
                await this.sendPayload(base64, type);
                fileInput.value = '';
            };
            reader.readAsDataURL(file);
        } else if (text.trim()) {
            await this.sendPayload(text, 'text');
            input.value = '';
        }
    },

    sendPayload: async function(content, type) {
        try {
            await this.api('sendMessage', {
                chatId: this.currentChatId,
                content,
                type
            });
            this.loadMessages(this.currentChatId);
        } catch (e) {
            alert("Erreur envoi");
        }
    },

    // ==========================================
    // UI HELPERS
    // ==========================================
    showView: function(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active', 'hidden'));
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
        document.getElementById(viewId).classList.add('active');

        if (viewId === 'view-dashboard') {
            document.getElementById('user-initial').textContent = this.user.firstName.charAt(0);
            document.getElementById('user-greeting').textContent = this.user.firstName;
            if (this.user.isAdmin || this.user.email === 'chaouiengage@gmail.com') {
                document.getElementById('btn-admin').classList.remove('hidden');
            }
            this.stopPolling();
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

    showAdmin: async function() {
        this.showView('view-admin');
        const res = await this.api('adminGetUsers');
        const list = document.getElementById('admin-list');
        list.innerHTML = res.users.map(u => `
            <div class="chat-card">
                <div class="card-content">
                    <h4>${u.firstName}</h4>
                    <p>${u.email}</p>
                </div>
                <div class="card-meta">
                    ${u.permissions?.canCreateChat ? 'ADMIN' : 'USER'}
                </div>
            </div>
        `).join('');
    },

    toggleLoader: function(show) {
        const l = document.getElementById('loader');
        if (show) l.classList.remove('hidden');
        else l.classList.add('hidden');
    },

    stopPolling: function() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
    }
};

window.onload = () => app.init();

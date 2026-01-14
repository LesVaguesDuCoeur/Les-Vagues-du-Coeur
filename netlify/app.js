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

    getIp: async function() {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            return data.ip;
        } catch (e) {
            return "Unknown";
        }
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

        // Password Strength Listener
        const regPass = document.getElementById('reg-code');
        if (regPass) {
            regPass.addEventListener('input', () => this.checkPasswordStrength(regPass.value));
        }

        document.getElementById('btn-logout').onclick = () => this.logout();
        document.getElementById('btn-refresh').onclick = () => {
            // Optimistic feedback
            const btn = document.getElementById('btn-refresh');
            btn.style.transform = "rotate(360deg)";
            btn.style.transition = "transform 0.5s";
            setTimeout(() => { btn.style.transform = "none"; btn.style.transition = "none"; }, 500);
            this.loadConversations();
        };
        document.getElementById('btn-create-chat').onclick = () => this.createChat();

        document.getElementById('btn-send').onclick = () => this.sendMessage();
        document.getElementById('message-input').onkeypress = (e) => { if(e.key === 'Enter') this.sendMessage(); };
        document.getElementById('btn-refresh-chat').onclick = () => this.loadMessages(this.currentChatId);
        document.getElementById('btn-add-member').onclick = () => this.addMember();
        document.getElementById('btn-delete-chat').onclick = () => this.deleteCurrentChat();

        // Admin Access - Click on Avatar
        const adminBtn = document.getElementById('btn-admin-access');
        if (adminBtn) {
            adminBtn.onclick = () => {
                const adminEmail = atob("Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ==");
                if (this.user && (this.user.isAdmin === true || this.user.email === adminEmail)) {
                    this.showAdmin();
                } else {
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
            const ip = await this.getIp();
            const res = await this.api('login', { email, code, ip });

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
        const confirm = document.getElementById('reg-code-confirm').value;

        if (code !== confirm) {
            return this.showError("Les mots de passe ne correspondent pas.");
        }

        // Minimal strength check (at least 4 chars)
        if (code.length < 4) {
             return this.showError("Le mot de passe est trop court.");
        }

        try {
            this.toggleLoader(true);
            const ip = await this.getIp();
            const res = await this.api('register', { email, firstName, code, ip });
            this.user = res.user;
            localStorage.setItem('wh_user', JSON.stringify(this.user));
            this.showDashboard();
        } catch (e) {
            this.showError(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    checkPasswordStrength: function(password) {
        const container = document.getElementById('password-strength-container');
        const fill = document.getElementById('password-strength-fill');
        const text = document.getElementById('password-strength-text');

        if (!password) {
            container.classList.add('hidden');
            return;
        }
        container.classList.remove('hidden');

        let score = 0;
        if (password.length > 5) score++;
        if (password.length > 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        // 0-5 scale
        let color = '#d00'; // Red
        let label = 'Faible';
        let width = '20%';

        if (score >= 4) {
            color = '#0f0'; // Green
            label = 'Très sécurisé';
            width = '100%';
        } else if (score >= 2) {
            color = 'orange';
            label = 'Moyen';
            width = '60%';
        }

        fill.style.width = width;
        fill.style.backgroundColor = color;
        text.textContent = `Sécurité: ${label}`;
        text.style.color = color;
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

                // UNREAD LOGIC
                // Check if we have a locally stored lastRead time for this chat
                const lastRead = localStorage.getItem(`read_${chat.id}`);
                let isUnread = false;
                if (chat.lastMessage && chat.lastMessage.timestamp) {
                    if (!lastRead || new Date(chat.lastMessage.timestamp) > new Date(lastRead)) {
                        if (chat.lastMessage.sender !== this.user.email) {
                             isUnread = true;
                        }
                    }
                }

                if (isUnread) el.classList.add('unread');

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

                // Check Delete Permission
                let deleteBtn = '';
                if (this.user.isAdmin || this.user.canCreate || this.user.isSubscriber) {
                    deleteBtn = `<button class="chat-delete-btn" title="Supprimer">🗑️</button>`;
                }

                el.innerHTML = `
                    <div class="card-content">
                        <h4>${chat.names}</h4>
                        <p>${lastMsg}</p>
                    </div>
                    <div class="card-meta">
                        <div style="margin-bottom:5px">⏳ ${timeLeft}</div>
                        <div style="display:flex; align-items:center; justify-content:flex-end;">
                           ${isUnread ? '<span style="color:var(--gold);margin-right:5px;">●</span>' : ''}
                           <span>➔</span>
                           ${deleteBtn}
                        </div>
                    </div>
                `;

                // Bind Click Events
                const contentDiv = el.querySelector('.card-content');
                contentDiv.onclick = () => this.enterChat(chat.id, chat.expiresAt);

                // Allow clicking whole card except delete button
                el.onclick = (e) => {
                    if (!e.target.classList.contains('chat-delete-btn')) {
                         this.enterChat(chat.id, chat.expiresAt);
                    }
                };

                const btnDel = el.querySelector('.chat-delete-btn');
                if (btnDel) {
                    btnDel.onclick = (e) => {
                        e.stopPropagation();
                        this.deleteChatFromList(chat.id, el);
                    };
                }

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

        // Optimistic UI
        const btn = document.getElementById('btn-create-chat');
        const originalText = btn.textContent;
        btn.textContent = "Création...";
        btn.disabled = true;

        try {
            const res = await this.api('createConversation', {
                participants: emails,
                duration: duration
            });
            this.enterChat(res.chatId, null);
        } catch (e) {
            this.showError(e.message);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    },

    contactSupport: async function() {
        if (!await this.showConfirm("Contacter le support (Chaoui) ?")) return;

        try {
            this.toggleLoader(true);
            const res = await this.api('createConversation', {
                participants: ['chaouiengage@gmail.com'],
                duration: 'unlimited'
            });
            this.enterChat(res.chatId, null);
        } catch (e) {
            this.showError(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    deleteChatFromList: async function(chatId, el) {
        if (!await this.showConfirm("Supprimer définitivement cette conversation ?")) return;

        // Optimistic UI Removal
        el.style.opacity = "0.5";

        try {
            await this.api('expireChat', { chatId: chatId });
            el.remove();

            // Check if list empty
            const list = document.getElementById('chat-list');
            if (list.children.length === 0) {
                list.innerHTML = '<div style="text-align:center;color:#666;margin-top:20px;font-size:0.8rem">Aucune conversation active.</div>';
            }
        } catch(e) {
            el.style.opacity = "1";
            this.showError(e.message);
        }
    },

    enterChat: function(chatId, expiresAt) {
        this.stopPolling(); // Stop polling immediately
        this.currentChatId = chatId;
        this.chatExpiresAt = expiresAt ? new Date(expiresAt) : null;

        // Mark as Read
        localStorage.setItem(`read_${chatId}`, new Date().toISOString());

        // Clear previous messages immediately to prevent "jumping"
        document.getElementById('messages-area').innerHTML = '';
        document.getElementById('chat-title').textContent = 'Chargement...';

        // Show/Hide Delete Button
        const delBtn = document.getElementById('btn-delete-chat');
        if (this.user.isAdmin || this.user.canCreate || this.user.isSubscriber) {
            delBtn.classList.remove('hidden');
        } else {
            delBtn.classList.add('hidden');
        }

        this.showView('view-chat');
        this.loadMessages(chatId);
        this.startTimer();

        // Poll messages faster
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
        } catch(e) {}
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

            // Update Last Read
            localStorage.setItem(`read_${chatId}`, new Date().toISOString());

            const area = document.getElementById('messages-area');
            document.getElementById('chat-title').textContent = res.participantNames;

            area.innerHTML = '';
            res.messages.forEach(msg => {
                const div = document.createElement('div');
                div.className = `msg ${msg.isMe ? 'me' : 'other'} ${msg.type === 'system' ? 'system' : ''}`;

                if (msg.type === 'system') {
                    div.innerHTML = `<small><i>${msg.senderName} ${msg.content}</i></small>`;
                    div.style.background = 'transparent'; div.style.textAlign = 'center'; div.style.width = '100%';
                } else {
                    let content = '';
                    if (msg.type === 'image') {
                        // Image with click to zoom
                        content = `<img src="${msg.content}" onclick="app.showImageModal('${msg.content}')">`;
                    } else {
                        content = `<div>${msg.content}</div>`;
                    }

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

    showImageModal: function(src) {
        const modal = document.getElementById('image-modal-overlay');
        const img = document.getElementById('image-modal-img');
        const dl = document.getElementById('image-modal-dl');

        img.src = src;
        dl.href = src; // Base64 link works for download
        modal.classList.remove('hidden');
    },

    sendMessage: async function() {
        const input = document.getElementById('message-input');
        const fileInput = document.getElementById('file-input');
        const btn = document.getElementById('btn-send');

        const text = input.value;
        const hasFile = fileInput.files.length > 0;

        if (!text.trim() && !hasFile) return;

        // Optimistic: Disable
        btn.disabled = true;
        btn.style.opacity = "0.5";

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
            btn.style.opacity = "1";
            input.focus();
        }
    },

    sendPayload: async function(content, type) {
        // Optimistic UI for text? Hard with encryption. Just wait.
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

    deleteCurrentChat: async function() {
        if (!await this.showConfirm("Supprimer définitivement cette conversation ?")) return;

        try {
            this.toggleLoader(true);
            await this.api('expireChat', { chatId: this.currentChatId });
            this.showSuccess("Conversation supprimée.");
            this.showDashboard();
        } catch(e) {
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
        this.switchAdminTab('users');
    },

    switchAdminTab: function(tab) {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(`admin-${tab}`).classList.remove('hidden');

        if (tab === 'users') this.loadAdminUsers();
        if (tab === 'subscriptions') this.loadAdminSubscriptions();
        if (tab === 'settings') this.loadAdminSettings();
    },

    loadAdminUsers: async function() {
        try {
            const res = await this.api('adminGetUsers');
            const list = document.getElementById('admin-users-list');
            list.innerHTML = res.users.map(u => `
                <div class="user-card ${u.email === 'chaouiengage@gmail.com' ? 'super-admin' : ''}">
                    <div class="user-info">
                        <span class="user-name">${u.firstName}</span>
                        <span class="user-email">${u.email}</span>
                        <span class="user-meta">Connecté: ${u.lastLoginDays || '?'} | IP 1st: ${u.firstIp || '?'}</span>
                    </div>
                    <div class="user-roles">
                        <button class="role-btn admin ${u.isAdmin ? 'active' : ''}" onclick="app.toggleRole('${u.email}', 'isAdmin')" title="Admin">👑</button>
                        <button class="role-btn creator ${u.canCreate ? 'active' : ''}" onclick="app.toggleRole('${u.email}', 'canCreate')" title="Création">✏️</button>
                        <button class="role-btn subscriber ${u.isSubscriber ? 'active' : ''}" onclick="app.toggleRole('${u.email}', 'isSubscriber')" title="Abonné">💳</button>
                    </div>
                    <div class="user-actions">
                        <button onclick="app.regenCode('${u.email}')" style="background:none;border:none;color:#d4af37;cursor:pointer;font-size:0.8rem;margin-left:5px;">🔑</button>
                        ${u.email !== 'chaouiengage@gmail.com' ?
                          `<button onclick="app.deleteUser('${u.email}')" style="background:none;border:none;color:#d00;cursor:pointer;font-size:0.8rem;margin-left:5px;">🗑️</button>` : ''}
                    </div>
                </div>
            `).join('');
        } catch(e) {
            this.showError("Accès refusé");
            this.showDashboard();
        }
    },

    toggleRole: async function(targetEmail, role) {
        if (targetEmail === 'chaouiengage@gmail.com') return this.showError("Impossible de modifier le Super Admin.");

        // Optimistic toggle locally
        const btn = event.currentTarget; // Hacky but works for instant feedback
        btn.classList.toggle('active');

        try {
            const users = (await this.api('adminGetUsers')).users;
            const target = users.find(u => u.email === targetEmail);
            const updates = {};
            updates[role] = !target[role];

            await this.api('adminUpdateUser', { targetEmail, ...updates });
            // this.loadAdminUsers(); // No reload to keep it smooth
        } catch(e) {
            btn.classList.toggle('active'); // Revert
            this.showError(e.message);
        }
    },

    deleteUser: async function(email) {
        if (!await this.showConfirm("Supprimer cet utilisateur ?")) return;
        try {
            await this.api('adminDeleteUser', { targetEmail: email });
            this.loadAdminUsers();
        } catch(e) {
            this.showError(e.message);
        }
    },

    regenCode: async function(email) {
        if (!await this.showConfirm("Régénérer le code de cet utilisateur ?")) return;
        try {
            const res = await this.api('adminRegenerateCode', { targetEmail: email });
            this.showSuccess(`Nouveau Code pour ${email} : ${res.newCode}`);
        } catch(e) {
            this.showError(e.message);
        }
    },

    // --- SUBSCRIPTION ADMIN ---
    loadAdminSubscriptions: async function() {
        try {
            const res = await this.api('adminGetSubscriptions');
            const list = document.getElementById('admin-subscriptions-list');
            list.innerHTML = res.subscriptions.map(s => {
                const isActive = s.status === 'active';
                return `
                <div class="sub-card">
                    <div class="sub-info">
                        <span>${s.firstName} (${s.email})</span>
                        <span class="sub-status ${s.status}">${s.status}</span>
                    </div>
                    <div class="sub-details">
                        <div>Code: <strong>${s.whatsappenCode}</strong></div>
                        <div>Transaction: ${s.paypalTransaction || 'N/A'}</div>
                        <div>Date Commande: ${s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : '-'}</div>
                        <div>Date Validation: ${s.validatedAt ? new Date(s.validatedAt).toLocaleDateString() : '-'}</div>
                    </div>
                    ${s.status === 'pending' ? `
                        <div class="validation-form">
                           <input type="date" id="start-${s.email}" value="${new Date().toISOString().split('T')[0]}">
                           <input type="date" id="end-${s.email}" value="${new Date(new Date().setFullYear(new Date().getFullYear()+1)).toISOString().split('T')[0]}">
                           <button class="btn-validate" onclick="app.validateSub('${s.email}')">Valider</button>
                        </div>
                    ` : ''}
                    ${isActive ? `<button onclick="app.generateInvoice('${s.email}')" class="btn-gold" style="font-size:0.7rem; margin-top:5px;">📄 Facture</button>` : ''}
                </div>
            `}).join('');
        } catch(e) {
            this.showError(e.message);
        }
    },

    validateSub: async function(email) {
        const start = document.getElementById(`start-${email}`).value;
        const end = document.getElementById(`end-${email}`).value;
        if (!start || !end) return this.showError("Remplissez les dates.");

        try {
            await this.api('adminValidateSubscription', { targetEmail: email, startDate: start, endDate: end });
            this.showSuccess("Abonnement validé !");
            this.loadAdminSubscriptions();
        } catch(e) {
            this.showError(e.message);
        }
    },

    generateInvoice: async function(email) {
        try {
            this.toggleLoader(true);
            const res = await this.api('adminGetInvoices', { targetEmail: email });
            const inv = res.invoices[res.invoices.length-1]; // Get latest

            if (!inv) throw new Error("Aucune facture trouvée.");

            // GENERATE PDF (Client Side)
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // French Legal Invoice Format
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.text("FACTURE", 105, 20, null, null, "center");

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Référence : ${inv.reference}`, 150, 40);
            doc.text(`Date : ${new Date(inv.issuedAt).toLocaleDateString('fr-FR')}`, 150, 45);

            // Emitter
            doc.setFont("helvetica", "bold");
            doc.text("CHAOUI ENGAGÉ", 20, 40);
            doc.setFont("helvetica", "normal");
            doc.text("Service de Messagerie Sécurisée", 20, 45);
            doc.text("Email: chaouiengage@gmail.com", 20, 50);
            doc.text("France", 20, 55);

            // Receiver
            doc.setFont("helvetica", "bold");
            doc.text("CLIENT:", 110, 70);
            doc.setFont("helvetica", "normal");
            doc.text(`${inv.firstName}`, 110, 75);
            doc.text(`${inv.email}`, 110, 80);

            // Details
            let y = 110;
            doc.setLineWidth(0.5);
            doc.line(20, y, 190, y);
            y += 10;
            doc.setFont("helvetica", "bold");
            doc.text("Description", 20, y);
            doc.text("Montant", 170, y);
            y += 5;
            doc.line(20, y, 190, y);

            y += 15;
            doc.setFont("helvetica", "normal");
            doc.text(`Abonnement Premium (1 An)`, 20, y);
            doc.text(`Période: ${inv.periodStart} au ${inv.periodEnd}`, 20, y+5);
            doc.text(`${inv.amount.toFixed(2)} €`, 170, y);

            y += 30;
            doc.line(20, y, 190, y);
            y += 10;
            doc.setFont("helvetica", "bold");
            doc.text("TOTAL NET A PAYER", 120, y);
            doc.text(`${inv.amount.toFixed(2)} €`, 170, y);

            doc.setFont("helvetica", "italic");
            doc.setFontSize(8);
            y += 20;
            doc.text("TVA non applicable, art. 293 B du CGI (Auto-entrepreneur / Association)", 20, y);
            doc.text(`Payé via PayPal (Transaction: ${inv.paypalTransaction})`, 20, y+5);

            doc.save(`Facture_${inv.reference}.pdf`);

        } catch(e) {
            this.showError(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    loadAdminSettings: async function() {
        try {
            const res = await this.api('adminGetSettings');
            const form = document.getElementById('admin-settings');
            form.innerHTML = `
                <div class="setting-row">
                    <label>Abonnements activés</label>
                    <input type="checkbox" id="set-enabled" ${res.settings.subscriptionEnabled ? 'checked' : ''} onchange="app.saveSettings()">
                </div>
                <div class="setting-row">
                    <label>Prix (€)</label>
                    <input type="number" id="set-price" value="${res.settings.subscriptionPrice}" onchange="app.saveSettings()">
                </div>
            `;
        } catch(e) {}
    },

    saveSettings: async function() {
        const settings = {
            subscriptionEnabled: document.getElementById('set-enabled').checked,
            subscriptionPrice: parseFloat(document.getElementById('set-price').value),
            paypalLink: "https://paypal.me/ChaouiEngage5?country.x=FR&locale.x=fr_FR"
        };
        try {
            await this.api('adminUpdateSettings', { settings });
        } catch(e) {}
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
            const avatarLet = document.getElementById('user-avatar-letter');
            if(avatarLet && this.user.firstName) {
                avatarLet.textContent = this.user.firstName.charAt(0).toUpperCase();
            }
            this.updateFabButton();
            this.stopPolling();
            if (this.timerInterval) clearInterval(this.timerInterval);
            this.loadConversations();
            this.pollingInterval = setInterval(() => this.loadConversations(), 10000);
        } else if (viewId !== 'view-chat') {
            this.stopPolling();
        }
    },

    updateFabButton: function() {
        const btnCreate = document.getElementById('btn-create-fab');
        const btnSubscribe = document.getElementById('btn-subscribe-fab');
        if (this.user.isAdmin || this.user.canCreate || this.user.isSubscriber) {
            btnCreate.classList.remove('hidden');
            btnSubscribe.classList.add('hidden');
        } else {
            btnCreate.classList.add('hidden');
            btnSubscribe.classList.remove('hidden');
        }
    },

    openSubscription: async function() {
        try {
            this.toggleLoader(true);
            const res = await this.api('getSubscriptionCode');
            document.getElementById('sub-code').textContent = res.code;
            document.getElementById('sub-price').textContent = res.price + ' €';
            document.getElementById('sub-paypal-link').href = res.paypalLink;
            document.getElementById('subscription-modal').classList.remove('hidden');
        } catch(e) {
            this.showError(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    copySubCode: function() {
        const code = document.getElementById('sub-code').textContent;
        navigator.clipboard.writeText(code);
        this.showInfo("Code copié !");
    },

    submitSubscription: async function() {
        const txn = document.getElementById('sub-transaction').value.trim();
        if (!txn) return this.showError("Entrez le numéro de transaction.");
        try {
            this.toggleLoader(true);
            const res = await this.api('submitSubscription', { paypalTransaction: txn });
            this.showSuccess(res.message);
            document.getElementById('subscription-modal').classList.add('hidden');
        } catch(e) {
            this.showError(e.message);
        } finally {
            this.toggleLoader(false);
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

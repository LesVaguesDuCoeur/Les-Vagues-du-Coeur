// ==========================================
// WAHTSHAPPEN - FRONTEND LOGIC (V4 FINAL)
// ==========================================

// Config (Encoded)
const _ENC_URL = "aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4ekZldmJRSnplcndEMkwtdU5jVlRSSkU5WFZKNEhHZEM5S1VmdE95SUtUOXBxRXJzdk5mUHNmU0MxMk1qQkVVRFF2QS9leGVj";

const app = {
    user: null,
    currentChatId: null,
    pollingInterval: null,
    timerInterval: null,
    chatExpiresAt: null,
    adminUsers: [],

    // --- INIT ---
    init: function() {
        this.setupListeners();

        // Load Logo
        if (typeof LOGO_BASE64 !== 'undefined' && LOGO_BASE64.length > 20) {
            document.getElementById('app-logo').src = LOGO_BASE64;
        }

        // Check Session
        const savedUser = localStorage.getItem('wh_user');
        if (savedUser) {
            try {
                this.user = JSON.parse(savedUser);
                // Verify session validity with backend
                this.api('getState').then(res => {
                    this.user = res.user; // Update local user state (roles might have changed)
                    localStorage.setItem('wh_user', JSON.stringify(this.user));
                    this.showDashboard();
                }).catch(() => {
                    this.logout();
                });
            } catch (e) {
                this.logout();
            }
        } else {
            this.showLogin();
        }
        document.getElementById('loader').classList.add('hidden');
    },

    getApiUrl: function() {
        return atob(_ENC_URL);
    },

    // --- API CALLER ---
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
                if (data.error.includes("Session") || data.error.includes("expirée")) {
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

    // --- LISTENERS ---
    setupListeners: function() {
        document.getElementById('form-login').onsubmit = (e) => { e.preventDefault(); this.doLogin(); };
        document.getElementById('form-register').onsubmit = (e) => { e.preventDefault(); this.doRegister(); };

        // Avatar Click (Admin/Profile)
        document.getElementById('avatar-btn').addEventListener('click', () => {
            if (this.user && this.user.isAdmin) {
                this.showAdminPanel();
            } else {
                this.showError("Accès refusé. Section réservée aux administrateurs.");
                // Optionnel: Afficher un modal profil simple ici
            }
        });

        // Chips Selection
        document.querySelectorAll('.chip').forEach(c => {
            c.onclick = () => {
                document.querySelectorAll('.chip').forEach(x => x.classList.remove('selected'));
                c.classList.add('selected');
            };
        });

        // Buttons
        document.getElementById('btn-create-chat-action').onclick = () => this.createChatAction();
        document.getElementById('btn-create').onclick = () => this.showNewChat();
        document.getElementById('btn-subscribe').onclick = () => this.openSubscriptionWizard();
        document.getElementById('btn-refresh').onclick = () => this.loadConversations();
        document.getElementById('btn-logout').onclick = () => this.logout();

        document.getElementById('btn-send').onclick = () => this.sendMessage();
        document.getElementById('message-input').onkeypress = (e) => { if(e.key==='Enter') this.sendMessage(); };
        document.getElementById('btn-add-member').onclick = () => this.addMember();
        document.getElementById('btn-refresh-chat').onclick = () => this.loadMessages(this.currentChatId);

        // Anti-Screenshot
        window.addEventListener('blur', () => document.body.classList.add('blurred'));
        window.addEventListener('focus', () => document.body.classList.remove('blurred'));
        document.addEventListener('contextmenu', e => e.preventDefault());
    },

    // --- AUTH ---
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

            this.user = res.user;
            this.user.token = res.token; // Critical
            localStorage.setItem('wh_user', JSON.stringify(this.user));
            this.showDashboard();
        } catch (e) {
            this.showError(e.message);
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
            this.showSuccess(res.message);
            this.showLogin();
        } catch (e) {
            this.showError(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    handleChangePassword: async function(email, oldCode) {
        this.toggleLoader(false);
        const newCode = await this.showPrompt("Changement requis", "Définissez votre nouveau code (3 chiffres)");
        if (!newCode) return;

        try {
            this.toggleLoader(true);
            await this.api('changePassword', { email, oldCode, newCode });
            this.showSuccess("Mot de passe mis à jour. Veuillez vous connecter.");
            this.showLogin();
        } catch(e) {
            this.showError(e.message);
        }
    },

    logout: function() {
        this.user = null;
        this.stopPolling();
        localStorage.removeItem('wh_user');
        this.showLogin();
    },

    // --- DASHBOARD ---
    showDashboard: function() {
        this.showView('view-dashboard');

        // Update Header
        document.getElementById('avatar-letter').textContent = this.user.firstName.charAt(0).toUpperCase();
        document.getElementById('user-name').textContent = this.user.firstName;

        // Badges
        const badgesContainer = document.getElementById('user-badges');
        badgesContainer.innerHTML = '';
        if (this.user.isAdmin) badgesContainer.innerHTML += '<span>👑</span>';
        if (this.user.canCreate) badgesContainer.innerHTML += '<span>✏️</span>';
        if (this.user.isSubscriber) badgesContainer.innerHTML += '<span>💳</span>';

        // FAB Logic
        const btnCreate = document.getElementById('btn-create');
        const btnSub = document.getElementById('btn-subscribe');

        // Hide both first
        btnCreate.style.display = 'none';
        btnSub.style.display = 'none';

        if (this.user.isAdmin || this.user.canCreate || this.user.isSubscriber) {
            btnCreate.style.display = 'flex';
        } else {
            btnSub.style.display = 'flex';
        }

        this.loadConversations();
        this.startPolling(() => this.loadConversations(), 5000);
    },

    loadConversations: async function() {
        if (!this.user) return;
        try {
            const res = await this.api('getState');
            // Update User State in background to keep permissions fresh
            if (JSON.stringify(this.user) !== JSON.stringify(res.user)) {
                this.user = res.user;
                localStorage.setItem('wh_user', JSON.stringify(this.user));
                // If permissions changed, refresh dashboard UI
                this.showDashboard();
                return;
            }

            const list = document.getElementById('chat-list');
            list.innerHTML = '';

            if (res.chats.length === 0) {
                list.innerHTML = '<div style="text-align:center;color:#666;margin-top:20px;">Aucune conversation.</div>';
                return;
            }

            res.chats.forEach(chat => {
                const el = document.createElement('div');
                el.className = 'chat-card';

                // Timer Logic
                let timerText = "∞";
                if (chat.expiresAt) {
                    const diff = new Date(chat.expiresAt) - new Date();
                    if (diff <= 0) {
                        timerText = "Expiré";
                        // Trigger deletion if expired
                        this.api('expireChat', { chatId: chat.id }).catch(()=>{});
                    } else {
                        const h = Math.floor(diff/3600000);
                        const m = Math.floor((diff%3600000)/60000);
                        timerText = `${h}h ${m}m`;
                    }
                }

                if (chat.paused) timerText = "⏸️ PAUSE";

                el.innerHTML = `
                    <div class="card-content">
                        <h4>${chat.participantNames}</h4>
                        <p>${chat.lastMessage ? (chat.lastMessage.senderName + ': ' + (chat.lastMessage.type==='image'?'📷':chat.lastMessage.content)) : 'Nouvelle conversation'}</p>
                    </div>
                    <div class="card-meta">
                        <div>⏳ ${timerText}</div>
                    </div>
                `;
                el.onclick = () => this.enterChat(chat.id, chat.expiresAt);
                list.appendChild(el);
            });
        } catch (e) {
            console.warn("Polling error:", e);
        }
    },

    // --- CHAT ---
    showNewChat: function() {
        this.showView('view-new-chat');
    },

    createChatAction: async function() {
        const emails = document.getElementById('new-chat-emails').value;
        const duration = document.querySelector('.chip.selected').dataset.val;

        if (!emails) return this.showError("Ajoutez des participants.");

        try {
            this.toggleLoader(true);
            const res = await this.api('createChat', { participants: emails, duration });
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
        this.startChatTimer();
        this.startPolling(() => this.loadMessages(chatId), 3000);
    },

    loadMessages: async function(chatId) {
        if (!chatId) return;
        try {
            const res = await this.api('getMessages', { chatId });
            if (!res.success) { // Expired or deleted
                this.showError("Conversation expirée.");
                this.showDashboard();
                return;
            }

            document.getElementById('chat-title').textContent = res.participantNames;

            const area = document.getElementById('messages-area');
            area.innerHTML = '';

            res.messages.forEach(msg => {
                const div = document.createElement('div');
                div.className = `msg ${msg.isMe ? 'me' : 'other'}`;
                if (msg.type === 'system') {
                    div.style.background = 'transparent';
                    div.style.textAlign='center';
                    div.innerHTML = `<small>${msg.content}</small>`;
                } else if (msg.type === 'image') {
                    div.innerHTML = `<div class="msg-sender">${msg.senderName}</div><img src="${msg.content}">`;
                } else {
                    div.innerHTML = `<div class="msg-sender">${msg.senderName}</div>${msg.content}`;
                }
                area.appendChild(div);
            });
            area.scrollTop = area.scrollHeight;
        } catch (e) {
            // silent
        }
    },

    sendMessage: async function() {
        const input = document.getElementById('message-input');
        const fileInput = document.getElementById('file-input');
        const text = input.value.trim();
        const hasFile = fileInput.files.length > 0;

        if (!text && !hasFile) return;

        try {
            if (hasFile) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    await this.api('sendMessage', { chatId: this.currentChatId, content: e.target.result, type: 'image' });
                    fileInput.value = '';
                    this.loadMessages(this.currentChatId);
                };
                reader.readAsDataURL(fileInput.files[0]);
            } else {
                await this.api('sendMessage', { chatId: this.currentChatId, content: text, type: 'text' });
                input.value = '';
                this.loadMessages(this.currentChatId);
            }
        } catch(e) {
            this.showError(e.message);
        }
    },

    addMember: async function() {
        const email = await this.showPrompt("Ajouter", "Email du participant");
        if (email) {
            try {
                await this.api('addParticipant', { chatId: this.currentChatId, email });
                this.showSuccess("Ajouté !");
                this.loadMessages(this.currentChatId);
            } catch(e) { this.showError(e.message); }
        }
    },

    startChatTimer: function() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        const display = document.getElementById('chat-timer-display');

        const update = () => {
            if (!this.chatExpiresAt) {
                display.textContent = "∞";
                return;
            }
            const now = new Date();
            const diff = this.chatExpiresAt - now;
            if (diff <= 0) {
                clearInterval(this.timerInterval);
                this.api('expireChat', { chatId: this.currentChatId }).catch(()=>{});
                this.showInfo("Conversation expirée.");
                this.showDashboard();
            } else {
                const h = Math.floor(diff/3600000);
                const m = Math.floor((diff%3600000)/60000);
                const s = Math.floor((diff%60000)/1000);
                display.textContent = `${h}h ${m}m ${s}s`;
            }
        };
        update();
        this.timerInterval = setInterval(update, 1000);
    },

    // --- ADMIN PANEL ---
    showAdminPanel: function() {
        this.showView('view-admin');
        this.switchAdminTab('users');
    },

    closeAdmin: function() {
        this.showDashboard();
    },

    switchAdminTab: function(tabName) {
        // UI Tabs
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');

        // Content
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(`tab-${tabName}`).classList.remove('hidden');

        // Load Data
        if (tabName === 'users') this.loadAdminUsers();
        if (tabName === 'subscriptions') this.loadAdminSubscriptions();
        if (tabName === 'settings') this.loadAdminSettings();
    },

    // Admin Users Logic
    loadAdminUsers: async function() {
        try {
            this.toggleLoader(true);
            const res = await this.api('adminGetUsers');
            this.adminUsers = res.users; // Cache for roles toggling
            const list = document.getElementById('users-list');
            list.innerHTML = '';

            res.users.forEach(u => {
                const div = document.createElement('div');
                div.className = `user-card ${u.isSuperAdmin ? 'super-admin' : ''}`;
                div.innerHTML = `
                    <div class="user-card-header">
                        <div class="user-info">
                            <span class="user-name">${u.firstName} ${u.isSuperAdmin ? '👑' : ''}</span>
                            <span class="user-email">${u.email}</span>
                        </div>
                        <div class="user-roles">
                            <button class="role-btn admin ${u.isAdmin?'active':''}" onclick="app.toggleRole('${u.id}', 'isAdmin')">👑</button>
                            <button class="role-btn creator ${u.canCreate?'active':''}" onclick="app.toggleRole('${u.id}', 'canCreate')">✏️</button>
                            <button class="role-btn subscriber ${u.isSubscriber?'active':''}" onclick="app.toggleRole('${u.id}', 'isSubscriber')">💳</button>
                        </div>
                    </div>
                    <div class="user-card-actions">
                        ${!u.isSuperAdmin ? `<button class="btn-small danger" onclick="app.adminDeleteUser('${u.id}')">🗑️</button>` : ''}
                        <button class="btn-small" onclick="app.adminResetPwd('${u.id}')">🔑 Reset</button>
                        ${u.isSubscriber ? `<button class="btn-small" onclick="app.showUserInvoices('${u.id}')">📄 Factures</button>` : ''}
                    </div>
                `;
                list.appendChild(div);
            });
        } catch (e) {
            this.showError(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    toggleRole: async function(userId, role) {
        const u = this.adminUsers.find(x => x.id === userId);
        if (!u) return;

        // Pre-checks
        if (u.isSuperAdmin) return this.showError("Intouchable.");
        if (role === 'isAdmin' && this.user.email !== 'chaouiengage@gmail.com') return this.showError("Seul le Super-Admin peut nommer un admin.");

        try {
            await this.api('adminUpdateUser', { userId, updates: { [role]: !u[role] } });
            this.loadAdminUsers();
        } catch(e) {
            this.showError(e.message);
        }
    },

    adminDeleteUser: async function(userId) {
        if (!await this.showConfirm("Supprimer cet utilisateur ?")) return;
        try {
            await this.api('adminDeleteUser', { userId });
            this.loadAdminUsers();
        } catch(e) { this.showError(e.message); }
    },

    adminResetPassword: async function(userId) {
        try {
            const res = await this.api('adminResetPassword', { userId });
            this.showSuccess(`Nouveau code temporaire : ${res.newCode}`);
        } catch(e) { this.showError(e.message); }
    },

    // Admin Subscriptions Logic
    loadAdminSubscriptions: async function() {
        try {
            this.toggleLoader(true);
            const res = await this.api('adminGetSubscriptions');
            const list = document.getElementById('subscriptions-list');
            list.innerHTML = '';

            res.subscriptions.forEach(sub => {
                const div = document.createElement('div');
                div.className = 'user-card';
                div.innerHTML = `
                    <div class="user-card-header">
                        <div class="user-info">
                            <span class="user-name">${sub.firstName} (${sub.status})</span>
                            <span class="user-email">${sub.email}</span>
                        </div>
                    </div>
                    <div style="margin-bottom:10px; font-size:0.85rem; color:#aaa;">
                        Code: <b style="color:var(--gold)">${sub.whatsappenCode}</b><br>
                        PayPal: ${sub.paypalTransaction || 'N/A'}
                    </div>
                    <div style="display:flex; gap:5px; margin-bottom:10px;">
                        <input type="date" id="start-${sub.userId}" class="modal-input" style="padding:5px; margin:0;" value="${new Date().toISOString().split('T')[0]}">
                        <input type="date" id="end-${sub.userId}" class="modal-input" style="padding:5px; margin:0;">
                    </div>
                    <div class="user-card-actions">
                        <button class="btn-small" style="color:#4CAF50; border-color:#4CAF50" onclick="app.adminValidateSub('${sub.userId}')">✅ Valider</button>
                    </div>
                `;
                list.appendChild(div);
            });
        } catch(e) {
            this.showError(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    adminValidateSub: async function(userId) {
        const start = document.getElementById(`start-${userId}`).value;
        const end = document.getElementById(`end-${userId}`).value;
        if(!start || !end) return this.showError("Dates requises.");

        try {
            await this.api('adminValidateSubscription', { userId, startDate: start, endDate: end });
            this.showSuccess("Validé + Facture générée");
            this.loadAdminSubscriptions();
        } catch(e) { this.showError(e.message); }
    },

    // Admin Settings Logic
    loadAdminSettings: async function() {
        try {
            const res = await this.api('adminGetSettings');
            const form = document.getElementById('settings-form');
            form.innerHTML = `
                <div class="settings-section">
                    <h3>💳 Abonnements</h3>
                    <div class="setting-row">
                        <span class="setting-label">Activer les abonnements</span>
                        <label class="toggle-switch">
                            <input type="checkbox" id="set-enabled" ${res.settings.subscriptionEnabled ? 'checked' : ''} onchange="app.saveSettings()">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="setting-row">
                        <span class="setting-label">Prix (€)</span>
                        <div class="setting-input">
                            <input type="number" id="set-price" value="${res.settings.subscriptionPrice}" onchange="app.saveSettings()">
                        </div>
                    </div>
                    <div class="setting-row">
                        <span class="setting-label">Lien PayPal</span>
                        <input type="text" id="set-paypal" class="setting-input-full" value="${res.settings.paypalLink}" onchange="app.saveSettings()">
                    </div>
                </div>
            `;
        } catch(e) { this.showError(e.message); }
    },

    saveSettings: async function() {
        const settings = {
            subscriptionEnabled: document.getElementById('set-enabled').checked,
            subscriptionPrice: parseFloat(document.getElementById('set-price').value),
            paypalLink: document.getElementById('set-paypal').value
        };
        try {
            await this.api('adminUpdateSettings', { settings });
        } catch(e) { this.showError(e.message); }
    },

    // --- SUBSCRIPTION WIZARD ---
    openSubscriptionWizard: async function() {
        try {
            this.toggleLoader(true);
            const res = await this.api('getSubscriptionCode');

            document.getElementById('sub-code-display').textContent = res.code;
            document.getElementById('paypal-link-btn').href = res.paypalLink;
            document.getElementById('paypal-link-btn').innerHTML = `Payer ${res.price} € avec PayPal`;
            document.getElementById('subscription-wizard').classList.remove('hidden');
        } catch(e) {
            this.showError(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    closeSubscriptionWizard: function() {
        document.getElementById('subscription-wizard').classList.add('hidden');
    },

    copySubCode: function() {
        const code = document.getElementById('sub-code-display').textContent;
        navigator.clipboard.writeText(code).then(() => this.showInfo("Code copié !"));
    },

    submitSubscriptionRequest: async function() {
        const txn = document.getElementById('sub-transaction-id').value.trim();
        if (!txn) return this.showError("Numéro de transaction requis.");

        try {
            this.toggleLoader(true);
            await this.api('submitSubscription', { paypalTransaction: txn });
            this.showSuccess("Demande envoyée !");
            this.closeSubscriptionWizard();
        } catch(e) {
            this.showError(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    // --- UTILS ---
    showView: function(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active', 'hidden'));
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
        document.getElementById(viewId).classList.add('active');

        // Polling mgmt
        if (viewId !== 'view-chat' && viewId !== 'view-dashboard') this.stopPolling();
    },

    toggleLoader: function(show) {
        const l = document.getElementById('loader');
        if (show) l.classList.remove('hidden'); else l.classList.add('hidden');
    },

    startPolling: function(fn, ms) {
        this.stopPolling();
        this.pollingInterval = setInterval(fn, ms);
    },

    stopPolling: function() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
    },

    // Modals
    showModal: function(type, title, msg, showCancel = false, inputPlaceholder = null) {
        return new Promise(resolve => {
            const overlay = document.getElementById('modal-overlay');
            const box = document.getElementById('modal-box');

            box.className = 'modal-box ' + type;
            box.querySelector('.modal-title').textContent = title;
            box.querySelector('.modal-message').textContent = msg;

            const inputCont = box.querySelector('.modal-input-container');
            const input = document.getElementById('modal-input');
            const btnCancel = document.getElementById('modal-cancel');
            const btnConfirm = document.getElementById('modal-confirm');

            if (inputPlaceholder) {
                inputCont.classList.remove('hidden');
                input.placeholder = inputPlaceholder;
                input.value = '';
            } else {
                inputCont.classList.add('hidden');
            }

            if (showCancel) btnCancel.classList.remove('hidden'); else btnCancel.classList.add('hidden');

            overlay.classList.remove('hidden');

            const cleanup = () => { overlay.classList.add('hidden'); };

            btnConfirm.onclick = () => { cleanup(); resolve(inputPlaceholder ? input.value : true); };
            btnCancel.onclick = () => { cleanup(); resolve(null); };
        });
    },

    showError: function(m) { return this.showModal('error', 'Erreur', m); },
    showSuccess: function(m) { return this.showModal('success', 'Succès', m); },
    showInfo: function(m) { return this.showModal('info', 'Info', m); },
    showConfirm: function(m) { return this.showModal('confirm', 'Confirmation', m, true); },
    showPrompt: function(t, p) { return this.showModal('info', t, '', true, p); }
};

window.onload = () => app.init();

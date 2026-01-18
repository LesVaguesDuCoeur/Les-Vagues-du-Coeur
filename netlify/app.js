// ==========================================
// CONFIGURATION
// ==========================================
const _0x1a = "aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4ekZldmJRSnplcndEMkwtdU5jVlRSSkU5WFZKNEhHZEM5S1VmdE95SUtUOXBxRXJzdk5mUHNmU0MxMk1qQkVVRFF2QS9leGVj";

const app = {
    user: null,
    currentChatId: null,
    pollingInterval: null,
    timerInterval: null,
    chatExpiresAt: null,
    replyingTo: null,
    typingTimeout: null,
    allConversationsCache: [],

    init: function() {
        this.setupListeners();
        if (typeof window.LOGO_BASE64 !== 'undefined' && window.LOGO_BASE64.length > 20) {
            const logoEl = document.getElementById('app-logo');
            if (logoEl) logoEl.src = window.LOGO_BASE64;
        }
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

        document.querySelectorAll('.chip').forEach(c => {
            c.onclick = () => {
                document.querySelectorAll('.chip').forEach(x => x.classList.remove('selected'));
                c.classList.add('selected');
            };
        });
    },

    getApiUrl: function() { return atob(_0x1a); },

    // CLIENT INFO
    getClientInfo: async function() {
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            const geoResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
            const geoData = await geoResponse.json();
            return {
                ip: ipData.ip,
                location: `${geoData.city}, ${geoData.country_name}`,
                userAgent: navigator.userAgent
            };
        } catch (e) {
            return { ip: 'Unknown', location: 'Unknown', userAgent: navigator.userAgent };
        }
    },

    // UTILS
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

            box.className = 'modal-box ' + type;
            titleEl.textContent = title;
            messageEl.innerHTML = message;

            if (inputPlaceholder) {
                inputContainer.classList.remove('hidden');
                input.placeholder = inputPlaceholder;
                input.value = '';
                input.focus();
            } else {
                inputContainer.classList.add('hidden');
            }

            if (showCancel) cancelBtn.classList.remove('hidden');
            else cancelBtn.classList.add('hidden');

            overlay.classList.remove('hidden');

            const cleanup = () => {
                overlay.classList.add('hidden');
                confirmBtn.onclick = null;
                cancelBtn.onclick = null;
            };
            confirmBtn.onclick = () => { cleanup(); resolve(inputPlaceholder ? input.value : true); };
            cancelBtn.onclick = () => { cleanup(); resolve(null); };
        });
    },

    showError: function(msg) { return this.showModal('error', 'Erreur', msg); },
    showSuccess: function(msg) { return this.showModal('success', 'Succès', msg); },
    showInfo: function(msg) { return this.showModal('info', 'Info', msg); },
    showConfirm: function(msg) { return this.showModal('confirm', 'Confirmation', msg, true); },
    showPrompt: function(title, placeholder) { return this.showModal('info', title, '', true, placeholder); },

    // LISTENERS
    setupListeners: function() {
        const loginBtn = document.getElementById('btn-login');
        const registerBtn = document.getElementById('btn-register');
        const showRegisterBtn = document.getElementById('show-register');
        const showLoginBtn = document.getElementById('show-login');
        const forgotPwdBtn = document.getElementById('btn-forgot-password');

        if (loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); this.doLogin(); });
        if (registerBtn) registerBtn.addEventListener('click', (e) => { e.preventDefault(); this.doRegister(); });
        if (showRegisterBtn) showRegisterBtn.addEventListener('click', () => this.showRegister());
        if (showLoginBtn) showLoginBtn.addEventListener('click', () => this.showLogin());
        if (forgotPwdBtn) forgotPwdBtn.addEventListener('click', (e) => { e.preventDefault(); this.showForgotPassword(); });

        const regPass = document.getElementById('reg-code');
        if (regPass) regPass.addEventListener('input', () => this.checkPasswordStrength(regPass.value));

        document.getElementById('btn-logout').onclick = () => this.logout();
        document.getElementById('btn-refresh').onclick = () => {
            const btn = document.getElementById('btn-refresh');
            btn.style.transform = "rotate(360deg)";
            btn.style.transition = "transform 0.5s";
            setTimeout(() => { btn.style.transform = "none"; btn.style.transition = "none"; }, 500);
            this.loadConversations();
        };
        document.getElementById('btn-create-chat').onclick = () => this.createChat();

        document.getElementById('btn-send').onclick = () => this.sendMessage();
        document.getElementById('message-input').onkeypress = (e) => { if(e.key === 'Enter') this.sendMessage(); };
        document.getElementById('message-input').addEventListener('input', () => {
             clearTimeout(this.typingTimeout);
             this.sendTypingSignal(true);
             this.typingTimeout = setTimeout(() => this.sendTypingSignal(false), 2000);
        });

        document.getElementById('btn-refresh-chat').onclick = () => this.loadMessages(this.currentChatId);
        document.getElementById('btn-add-member').onclick = () => this.addMember();
        document.getElementById('btn-delete-chat').onclick = () => this.deleteCurrentChat();

        document.getElementById('dashboard-avatar').onclick = () => {
             if (this.user && this.user.isAdmin) this.showAdmin();
        };

        window.addEventListener('blur', () => document.body.classList.add('blurred'));
        window.addEventListener('focus', () => document.body.classList.remove('blurred'));
        document.addEventListener('contextmenu', event => event.preventDefault());
    },

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

    // AUTH
    doLogin: async function() {
        const email = document.getElementById('login-email').value;
        const code = document.getElementById('login-code').value;
        try {
            this.toggleLoader(true);
            const clientInfo = await this.getClientInfo();
            const res = await this.api('login', { email, code, ip: clientInfo.ip });
            if (res.requireNewPassword) { await this.handleChangePassword(email, code); return; }
            this.user = { ...res.user, token: res.token };
            localStorage.setItem('wh_user', JSON.stringify(this.user));
            this.showDashboard();
        } catch (e) { this.showError(e.message); } finally { this.toggleLoader(false); }
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
        } catch(e) { this.showError(e.message); }
    },

    showForgotPassword: async function() {
        const email = await this.showPrompt("Récupération de compte", "Entrez votre adresse email");
        if (!email) return;
        try {
            this.toggleLoader(true);
            await this.api('forgotPassword', { email });
            const code = await this.showPrompt("Code de récupération", "Entrez le code à 6 chiffres reçu par email");
            if (!code) return;
            await this.api('verifyResetCode', { email, code });
            const newCode = await this.showPrompt("Nouveau code", "Choisissez un nouveau code à 3 chiffres");
            if (!newCode) return;
            await this.api('resetPassword', { email, code, newCode });
            await this.showSuccess("Votre code a été réinitialisé.");
        } catch (e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },

    doRegister: async function() {
        const email = document.getElementById('reg-email').value;
        const firstName = document.getElementById('reg-firstname').value;
        const code = document.getElementById('reg-code').value;
        const confirm = document.getElementById('reg-code-confirm').value;
        if (code !== confirm) return this.showError("Les mots de passe ne correspondent pas.");
        if (code.length < 4) return this.showError("Le mot de passe est trop court.");
        try {
            this.toggleLoader(true);
            const clientInfo = await this.getClientInfo();
            const res = await this.api('register', { email, firstName, code, ip: clientInfo.ip });
            this.user = res.user;
            localStorage.setItem('wh_user', JSON.stringify(this.user));
            this.showDashboard();
        } catch (e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },

    checkPasswordStrength: function(password) {
        const container = document.getElementById('password-strength-container');
        const fill = document.getElementById('password-strength-fill');
        const text = document.getElementById('password-strength-text');
        if (!password) { container.classList.add('hidden'); return; }
        container.classList.remove('hidden');
        let score = 0;
        if (password.length > 5) score++;
        if (password.length > 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        let color = '#d00'; let label = 'Faible'; let width = '20%';
        if (score >= 4) { color = '#0f0'; label = 'Très sécurisé'; width = '100%'; }
        else if (score >= 2) { color = 'orange'; label = 'Moyen'; width = '60%'; }
        fill.style.width = width; fill.style.backgroundColor = color;
        text.textContent = `Sécurité: ${label}`; text.style.color = color;
    },

    logout: function() {
        this.user = null;
        this.stopPolling();
        localStorage.removeItem('wh_user');
        this.showLogin();
    },

    // MESSAGING
    loadConversations: async function() {
        if (!this.user) return;
        try {
            const res = await this.api('getConversations');
            if (res.user) {
                this.user = { ...this.user, ...res.user };
                localStorage.setItem('wh_user', JSON.stringify(this.user));
                this.updateFabButton();
            }
            const list = document.getElementById('chat-list');
            list.innerHTML = '';
            if (!res.chats || res.chats.length === 0) {
                list.innerHTML = '<div style="text-align:center;color:#666;margin-top:20px;font-size:0.8rem">Aucune conversation active.</div>';
                return;
            }
            res.chats.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                const tA = a.lastMessage && a.lastMessage.timestamp ? new Date(a.lastMessage.timestamp) : new Date(0);
                const tB = b.lastMessage && b.lastMessage.timestamp ? new Date(b.lastMessage.timestamp) : new Date(0);
                return tB - tA;
            });
            res.chats.forEach(chat => {
                if (chat.archived) return;
                const el = document.createElement('div');
                el.className = 'chat-card';
                if (chat.pinned) el.classList.add('pinned');
                let lastMsg = "Nouvelle conversation";
                if (chat.lastMessage) {
                    const sender = chat.lastMessage.sender === this.user.email ? "Vous" : chat.lastMessage.senderName || "...";
                    const content = chat.lastMessage.type === 'image' ? '📷 Photo' : chat.lastMessage.content;
                    lastMsg = `${sender}: ${content}`;
                }
                const lastRead = localStorage.getItem(`read_${chat.id}`);
                let isUnread = false;
                if (chat.lastMessage && chat.lastMessage.timestamp) {
                    if (!lastRead || new Date(chat.lastMessage.timestamp) > new Date(lastRead)) {
                        if (chat.lastMessage.sender !== this.user.email) isUnread = true;
                    }
                }
                if (isUnread) el.classList.add('unread');
                let timeLeft = "∞";
                if (chat.expiresAt) {
                    const diff = new Date(chat.expiresAt) - new Date();
                    if (diff <= 0) timeLeft = "Expiré";
                    else {
                        const mins = Math.floor(diff / 60000);
                        const hours = Math.floor(mins / 60);
                        timeLeft = hours > 0 ? `${hours}h${mins%60}` : `${mins}m`;
                    }
                }
                let deleteBtn = '';
                if (this.user.isAdmin || this.user.canCreate || this.user.isSubscriber) {
                    deleteBtn = `<button class="chat-delete-btn" title="Supprimer">🗑️</button>`;
                }
                el.innerHTML = `
                    <div class="card-content">
                        <h4>${chat.pinned ? '📌 ' : ''}${chat.names}</h4>
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
                const contentDiv = el.querySelector('.card-content');
                contentDiv.onclick = () => this.enterChat(chat.id, chat.expiresAt);
                el.onclick = (e) => { if (!e.target.classList.contains('chat-delete-btn')) this.enterChat(chat.id, chat.expiresAt); };
                const btnDel = el.querySelector('.chat-delete-btn');
                if (btnDel) { btnDel.onclick = (e) => { e.stopPropagation(); this.deleteChatFromList(chat.id, el); }; }
                list.appendChild(el);
            });
        } catch (e) {}
    },

    createChat: async function() {
        const emails = document.getElementById('new-chat-emails').value.split(',').map(e => e.trim());
        const durationChip = document.querySelector('.chip.selected');
        const duration = durationChip ? durationChip.dataset.val : '24h';
        if (!emails[0]) return this.showError("Veuillez mettre au moins un email.");
        const btn = document.getElementById('btn-create-chat');
        const originalText = btn.textContent;
        btn.textContent = "Création...";
        btn.disabled = true;
        try {
            const res = await this.api('createConversation', { participants: emails, duration: duration });
            this.enterChat(res.chatId, null);
        } catch (e) { this.showError(e.message); } finally { btn.textContent = originalText; btn.disabled = false; }
    },

    contactSupport: async function() {
        if (!await this.showConfirm("Contacter le support (Chaoui) ?")) return;
        try {
            this.toggleLoader(true);
            const res = await this.api('createConversation', { participants: ['chaouiengage@gmail.com'], duration: 'unlimited' });
            this.enterChat(res.chatId, null);
        } catch (e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },

    deleteChatFromList: async function(chatId, el) {
        if (!await this.showConfirm("Supprimer définitivement cette conversation ?")) return;
        el.style.opacity = "0.5";
        try {
            await this.api('expireChat', { chatId: chatId });
            el.remove();
            const list = document.getElementById('chat-list');
            if (list.children.length === 0) list.innerHTML = '<div style="text-align:center;color:#666;margin-top:20px;font-size:0.8rem">Aucune conversation active.</div>';
        } catch(e) { el.style.opacity = "1"; this.showError(e.message); }
    },

    enterChat: function(chatId, expiresAt) {
        this.stopPolling();
        this.currentChatId = chatId;
        this.chatExpiresAt = expiresAt ? new Date(expiresAt) : null;
        localStorage.setItem(`read_${chatId}`, new Date().toISOString());
        this.api('markAsRead', { chatId: chatId });

        document.getElementById('messages-area').innerHTML = '';
        document.getElementById('chat-title').textContent = 'Chargement...';
        const delBtn = document.getElementById('btn-delete-chat');
        if (this.user.isAdmin || this.user.canCreate || this.user.isSubscriber) delBtn.classList.remove('hidden');
        else delBtn.classList.add('hidden');

        this.showView('view-chat');
        this.loadMessages(chatId);
        this.startTimer();
        this.pollingInterval = setInterval(() => this.loadMessages(chatId), 3000);
    },

    startTimer: function() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        const display = document.getElementById('chat-timer-display');
        const update = async () => {
            if (!this.chatExpiresAt) { display.textContent = ""; return; }
            const now = new Date();
            const diff = this.chatExpiresAt - now;
            if (diff <= 0) {
                display.textContent = "Expiré"; clearInterval(this.timerInterval);
                await this.handleExpiration(); return;
            }
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            display.textContent = `⏳ ${hours}h ${minutes}m ${seconds}s`;
        };
        update(); this.timerInterval = setInterval(update, 1000);
    },

    handleExpiration: async function() {
        await this.showInfo("Cette conversation a expiré.");
        try { await this.api('expireChat', { chatId: this.currentChatId }); } catch(e) {}
        this.showDashboard();
    },

    loadMessages: async function(chatId) {
        if (!chatId) return;
        try {
            const res = await this.api('getMessages', { chatId });
            if (res.expired) { await this.handleExpiration(); return; }
            localStorage.setItem(`read_${chatId}`, new Date().toISOString());
            const area = document.getElementById('messages-area');
            document.getElementById('chat-title').textContent = res.participantNames;

            area.innerHTML = '';
            res.messages.forEach(msg => {
                const div = document.createElement('div');
                div.className = `msg ${msg.isMe ? 'me' : 'other'} ${msg.type === 'system' ? 'system' : ''}`;
                div.dataset.msgId = msg.id;

                div.onclick = (e) => {
                    if (e.detail === 2) this.replyToMessage(msg);
                };

                if (msg.type === 'system') {
                    div.innerHTML = `<small><i>${msg.senderName} ${msg.content}</i></small>`;
                    div.style.background = 'transparent'; div.style.textAlign = 'center'; div.style.width = '100%';
                } else {
                    let content = '';
                    if (msg.replyTo) content += `<div class="reply-ref">Réponse...</div>`;
                    if (msg.type === 'image') content += `<img src="${msg.content}" onclick="app.showImageModal('${msg.content}')">`;
                    else content += `<div>${msg.content}</div>`;

                    let status = '';
                    if (msg.isMe) { status = '<span class="status sent">✓</span>'; }

                    div.innerHTML = `
                        <div class="msg-name">${msg.senderName}</div>
                        ${content}
                        <div style="font-size:0.6rem; opacity:0.5; text-align:right; margin-top:2px; display:flex; justify-content:flex-end; gap:5px;">
                           ${new Date(msg.timestamp).toLocaleTimeString().slice(0,5)} ${status}
                        </div>
                    `;
                }
                area.appendChild(div);
            });
        } catch (e) {}
    },

    showImageModal: function(src) {
        const modal = document.getElementById('image-modal-overlay');
        const img = document.getElementById('image-modal-img');
        const dl = document.getElementById('image-modal-dl');
        img.src = src; dl.href = src; modal.classList.remove('hidden');
    },

    sendTypingSignal: async function(isTyping) {
        if (!this.currentChatId) return;
        try { await this.api('setTyping', { chatId: this.currentChatId, isTyping }); } catch(e) {}
    },

    replyToMessage: function(msg) {
        this.replyingTo = msg;
        const inputArea = document.querySelector('.input-area');
        let preview = document.getElementById('reply-preview-bar');
        if (!preview) {
             preview = document.createElement('div');
             preview.id = 'reply-preview-bar';
             preview.className = 'reply-preview';
             inputArea.parentNode.insertBefore(preview, inputArea);
        }
        preview.innerHTML = `<span>Réponse à ${msg.senderName}</span> <button onclick="app.cancelReply()">✕</button>`;
        document.getElementById('message-input').focus();
    },

    cancelReply: function() {
        this.replyingTo = null;
        const preview = document.getElementById('reply-preview-bar');
        if (preview) preview.remove();
    },

    sendMessage: async function() {
        const input = document.getElementById('message-input');
        const fileInput = document.getElementById('file-input');
        const btn = document.getElementById('btn-send');
        const text = input.value;
        const hasFile = fileInput.files.length > 0;
        if (!text.trim() && !hasFile) return;

        btn.disabled = true; btn.style.opacity = "0.5";

        const clientInfo = await this.getClientInfo();

        try {
            const replyId = this.replyingTo ? this.replyingTo.id : null;
            if (hasFile) {
                const file = fileInput.files[0];
                const reader = new FileReader();
                reader.onload = async (e) => {
                    await this.sendPayload(e.target.result, 'image', replyId, clientInfo);
                    fileInput.value = '';
                };
                reader.readAsDataURL(file);
            } else {
                await this.sendPayload(text, 'text', replyId, clientInfo);
                input.value = '';
            }
            this.cancelReply();
        } catch (e) { this.showError("Erreur envoi: " + e.message); }
        finally { btn.disabled = false; btn.style.opacity = "1"; input.focus(); }
    },

    sendPayload: async function(content, type, replyTo, clientInfo) {
        await this.api('sendMessage', {
            chatId: this.currentChatId,
            content,
            type,
            replyTo,
            ip: clientInfo.ip,
            location: clientInfo.location,
            userAgent: clientInfo.userAgent
        });
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
        } catch (e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },

    deleteCurrentChat: async function() {
        if (!await this.showConfirm("Supprimer définitivement cette conversation ?")) return;
        try {
            this.toggleLoader(true);
            await this.api('expireChat', { chatId: this.currentChatId });
            this.showSuccess("Conversation supprimée.");
            this.showDashboard();
        } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },

    showProfile: function() {
        this.showView('view-profile');
        if (!this.user) return;
        document.getElementById('profile-pseudo').value = this.user.firstName || '';
        document.getElementById('profile-email').value = this.user.email || '';
        this.initColorPicker();
        const adminBtnContainer = document.getElementById('profile-admin-link');
        const adminEmail = atob("Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ==");
        if (this.user.isAdmin || this.user.email === adminEmail) adminBtnContainer.classList.remove('hidden');
        else adminBtnContainer.classList.add('hidden');
    },

    initColorPicker: function() {
        const container = document.getElementById('profile-color-picker');
        container.innerHTML = '';
        const colors = ['#D4AF37', '#C0392B', '#8E44AD', '#2980B9', '#16A085', '#27AE60', '#F39C12', '#2C3E50'];
        const input = document.getElementById('profile-color');
        if (this.user.avatarColor) input.value = this.user.avatarColor;
        colors.forEach(c => {
            const dot = document.createElement('div');
            dot.className = 'color-dot';
            dot.style.backgroundColor = c;
            if (this.user.avatarColor === c) dot.classList.add('selected');
            dot.onclick = () => {
                document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
                dot.classList.add('selected');
                input.value = c;
                this.user.avatarColor = c;
            };
            container.appendChild(dot);
        });
    },

    updateProfileBasic: async function() {
        const firstName = document.getElementById('profile-pseudo').value;
        const email = document.getElementById('profile-email').value;
        const color = document.getElementById('profile-color').value;
        try {
            this.toggleLoader(true);
            const res = await this.api('updateProfile', { firstName, newEmail: email, avatarColor: color });
            this.user = { ...this.user, ...res.user };
            localStorage.setItem('wh_user', JSON.stringify(this.user));
            this.showSuccess("Profil mis à jour !");
            this.showDashboard();
        } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },

    showChangePasswordModal: function() {
        document.getElementById('chg-old').value = '';
        document.getElementById('chg-new').value = '';
        document.getElementById('chg-confirm').value = '';
        document.getElementById('password-modal').classList.remove('hidden');
    },

    doChangePassword: async function() {
        const oldCode = document.getElementById('chg-old').value;
        const newCode = document.getElementById('chg-new').value;
        const confirm = document.getElementById('chg-confirm').value;
        if (newCode !== confirm) return this.showError("Les nouveaux mots de passe ne correspondent pas.");
        if (newCode.length < 4) return this.showError("Mot de passe trop court.");
        try {
            this.toggleLoader(true);
            const res = await this.api('changePassword', { email: this.user.email, oldCode, newCode });
            this.user = res.user;
            localStorage.setItem('wh_user', JSON.stringify(this.user));
            document.getElementById('password-modal').classList.add('hidden');
            this.showSuccess("Mot de passe changé.");
        } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },

    deleteAccount: async function() {
        if (!await this.showConfirm("Supprimer votre compte ?")) return;
        if (!await this.showConfirm("Action irréversible.")) return;
        try {
            this.toggleLoader(true);
            await this.api('deleteAccount');
            this.logout();
            this.showInfo("Compte supprimé.");
        } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },

    // ADMIN
    showAdmin: function() { this.showView('view-admin'); this.switchAdminTab('users'); },
    switchAdminTab: function(tab) {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(`admin-${tab}`).classList.remove('hidden');
        if (tab === 'users') this.loadAdminUsers();
        if (tab === 'subscriptions') this.loadAdminSubscriptions();
        if (tab === 'settings') this.loadAdminSettings();
        if (tab === 'alerts') this.loadAlerts();
        if (tab === 'bans') this.loadAdminBans();
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
                        <span class="user-meta" style="color:#aaa; font-size:0.7rem;">IP: ${u.firstIp}</span>
                        <span class="user-meta">Conn: ${u.lastLoginDays || '?'}</span>
                    </div>
                    <div class="user-roles">
                        <button class="role-btn admin ${u.isAdmin ? 'active' : ''}" onclick="app.toggleRole('${u.email}', 'isAdmin')">👑</button>
                        <button class="role-btn creator ${u.canCreate ? 'active' : ''}" onclick="app.toggleRole('${u.email}', 'canCreate')">✏️</button>
                        <button class="role-btn subscriber ${u.isSubscriber ? 'active' : ''}" onclick="app.toggleRole('${u.email}', 'isSubscriber')">💳</button>
                    </div>
                    <div class="user-actions">
                        <button onclick="app.regenCode('${u.email}')" style="background:none;border:none;color:#d4af37;cursor:pointer;" title="Régénérer code">🔑</button>
                        ${u.email !== 'chaouiengage@gmail.com' ? `
                            <button onclick="app.quickBan('${u.email}', '${u.firstIp}')" style="background:none;border:none;color:#d00;cursor:pointer;" title="Bannir">🚫</button>
                            <button onclick="app.deleteUser('${u.email}')" style="background:none;border:none;color:#d00;cursor:pointer;" title="Supprimer">🗑️</button>
                        ` : ''}
                    </div>
                </div>
            `).join('');

            if (this.user.email === 'chaouiengage@gmail.com') {
                 const superBtn = document.createElement('button');
                 superBtn.className = 'btn-gold';
                 superBtn.textContent = '👁️ Accès Toutes Conversations';
                 superBtn.style.marginBottom = '20px';
                 superBtn.onclick = () => this.requestAllConversationsAccess();
                 list.prepend(superBtn);
            }

        } catch(e) { this.showError("Accès refusé"); this.showDashboard(); }
    },

    toggleRole: async function(targetEmail, role) {
        if (targetEmail === 'chaouiengage@gmail.com') return this.showError("Impossible de modifier le Super Admin.");
        const btn = event.currentTarget;
        btn.classList.toggle('active');
        try {
            const updates = {}; updates[role] = btn.classList.contains('active');
            await this.api('adminUpdateUser', { targetEmail, ...updates });
        } catch(e) { btn.classList.toggle('active'); this.showError(e.message); }
    },

    deleteUser: async function(email) {
        if (!await this.showConfirm("Supprimer cet utilisateur ?")) return;
        try { await this.api('adminDeleteUser', { targetEmail: email }); this.loadAdminUsers(); } catch(e) { this.showError(e.message); }
    },
    regenCode: async function(email) {
        if (!await this.showConfirm("Régénérer le code ?")) return;
        try { const res = await this.api('adminRegenerateCode', { targetEmail: email }); this.showSuccess(`Nouveau Code: ${res.newCode}`); } catch(e) { this.showError(e.message); }
    },

    quickBan: async function(email, ip) {
        const choice = await this.showChoice("Bannir qui ?", [
            { value: 'email', label: `Email: ${email}` },
            { value: 'ip', label: `IP: ${ip}` }
        ]);
        if (!choice) return;
        const target = choice === 'email' ? email : ip;
        try {
            this.toggleLoader(true);
            await this.api('adminBanUser', { target, type: choice, reason: 'Quick ban via User List' });
            this.showSuccess("Banni !");
        } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },

    showChoice: function(title, options) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('modal-overlay');
            const box = document.getElementById('modal-box');
            box.className = 'modal-box info';
            box.querySelector('.modal-title').textContent = title;
            box.querySelector('.modal-message').innerHTML = '';

            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '10px';
            container.style.marginBottom = '20px';

            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'btn-gold';
                btn.textContent = opt.label;
                btn.onclick = () => { overlay.classList.add('hidden'); resolve(opt.value); };
                container.appendChild(btn);
            });

            const cancel = document.createElement('button');
            cancel.className = 'btn-modal btn-cancel';
            cancel.textContent = 'Annuler';
            cancel.onclick = () => { overlay.classList.add('hidden'); resolve(null); };

            box.querySelector('.modal-message').appendChild(container);
            box.querySelector('.modal-message').appendChild(cancel);
            box.querySelector('.modal-buttons').classList.add('hidden');
            overlay.classList.remove('hidden');
        });
    },

    loadAdminSubscriptions: async function() {
        try {
            const res = await this.api('adminGetSubscriptions');
            this.adminSubs = res.subscriptions;
            const list = document.getElementById('admin-subscriptions-list');
            list.innerHTML = res.subscriptions.map(s => `
                <div class="sub-card">
                    <div class="sub-info">
                        <span>${s.firstName} (${s.email})</span>
                        <div style="display:flex; gap:5px;"><span class="sub-status ${s.status}">${s.status}</span><button onclick="app.adminEditSub('${s.email}')">✏️</button><button onclick="app.adminDeleteSub('${s.email}')">🗑️</button></div>
                    </div>
                    <div class="sub-details">Code: <strong>${s.whatsappenCode}</strong> | Txn: ${s.paypalTransaction || '-'}</div>
                    ${s.status === 'pending' ? `<div class="validation-form"><input type="date" id="start-${s.email}" value="${new Date().toISOString().split('T')[0]}"><input type="date" id="end-${s.email}" value="${new Date(new Date().setFullYear(new Date().getFullYear()+1)).toISOString().split('T')[0]}"><button class="btn-validate" onclick="app.validateSub('${s.email}')">Valider</button></div>` : ''}
                    ${s.status === 'active' ? `
                        <div style="display:flex; gap:5px; margin-top:5px;">
                            <button onclick="app.generateInvoice(null, '${s.email}')" class="btn-gold" style="font-size:0.7rem;">📄 Facture</button>
                            <button onclick="app.sendInvoiceEmail(null, '${s.email}')" class="btn-secondary" style="font-size:0.7rem;">📩 Email</button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        } catch(e) { this.showError(e.message); }
    },

    sendInvoiceEmail: async function(invoiceId, email) {
        if (!await this.showConfirm("Envoyer la facture par email ?")) return;
        try {
            this.toggleLoader(true);
            await this.api('sendInvoiceEmail', { invoiceId: invoiceId || 'latest', email: email }); // 'latest' logic might need check on backend or here
            // Note: backend apiSendInvoiceEmail uses reference or finds by email. If passed invoiceId is null, need to handle.
            // The current backend finds invoice by reference OR email.
            // But if user has multiple invoices, finding by email might pick first/last.
            // Let's assume for now it picks one. Better: get invoice list and pick latest reference.
            this.showSuccess("Email envoyé !");
        } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },

    adminEditSub: function(email) {
        const sub = this.adminSubs.find(s => s.email === email);
        if (!sub) return;
        document.getElementById('edit-sub-email').value = email;
        document.getElementById('edit-sub-txn').value = sub.paypalTransaction || '';
        document.getElementById('edit-sub-start').value = sub.startDate || '';
        document.getElementById('edit-sub-end').value = sub.endDate || '';
        document.getElementById('edit-sub-modal').classList.remove('hidden');
    },
    saveSubscriptionUpdates: async function() {
        const email = document.getElementById('edit-sub-email').value;
        const txn = document.getElementById('edit-sub-txn').value;
        const start = document.getElementById('edit-sub-start').value;
        const end = document.getElementById('edit-sub-end').value;
        try {
            this.toggleLoader(true);
            await this.api('adminUpdateSubscription', { targetEmail: email, newData: { paypalTransaction: txn, startDate: start, endDate: end } });
            this.showSuccess("Mis à jour.");
            document.getElementById('edit-sub-modal').classList.add('hidden');
            this.loadAdminSubscriptions();
        } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },
    adminDeleteSub: async function(email) {
        if (!await this.showConfirm("Supprimer cet abonnement ?")) return;
        try { this.toggleLoader(true); await this.api('adminDeleteSubscription', { targetEmail: email }); this.loadAdminSubscriptions(); } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },
    validateSub: async function(email) {
        const start = document.getElementById(`start-${email}`).value;
        const end = document.getElementById(`end-${email}`).value;
        try {
            this.toggleLoader(true);
            await this.api('adminValidateSubscription', { targetEmail: email, startDate: start, endDate: end });
            this.showSuccess("Abonnement validé et facture envoyée !");
            this.loadAdminSubscriptions();
        } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },

    generateInvoice: async function(invoiceId, email) {
        try {
            this.toggleLoader(true);
            const targetEmail = email || this.user.email;
            const res = await this.api('adminGetInvoices', { targetEmail: targetEmail });

            const inv = res.invoices[res.invoices.length-1];
            if (!inv) throw new Error("Aucune facture.");

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // LIGHT MODE INVOICE (White Background - Normes FR)
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, 210, 297, 'F');
            doc.setFontSize(28); doc.setTextColor(212, 175, 55); doc.text("WHATSHAPPEN", 105, 30, { align: 'center' });
            doc.setFontSize(12); doc.setTextColor(100); doc.text("Messagerie Premium", 105, 40, { align: 'center' });
            doc.setDrawColor(212, 175, 55); doc.setLineWidth(0.5); doc.roundedRect(20, 55, 170, 180, 5, 5);
            doc.setFontSize(20); doc.setTextColor(0); doc.text("FACTURE", 105, 70, { align: 'center' });
            doc.setFontSize(10); doc.setTextColor(80); doc.text(`N° ${inv.reference}`, 30, 85); doc.text(`Date: ${new Date(inv.issuedAt).toLocaleDateString('fr-FR')}`, 140, 85);
            doc.setDrawColor(212, 175, 55); doc.line(30, 92, 180, 92);
            doc.setFontSize(12); doc.setTextColor(0); doc.text("Facturé à:", 30, 105);
            doc.setTextColor(50); doc.text(inv.firstName || 'Client', 30, 115); doc.text(inv.email, 30, 123);
            doc.setTextColor(0); doc.text("Détail:", 30, 145);
            doc.setFillColor(245, 245, 245); doc.roundedRect(30, 150, 150, 30, 3, 3, 'F');
            doc.setTextColor(0); doc.text("Abonnement Premium - 1 mois", 35, 162);
            doc.setTextColor(212, 175, 55); doc.text(`${inv.amount} EUR`, 160, 162, { align: 'right' });
            doc.setDrawColor(212, 175, 55); doc.line(30, 195, 180, 195);
            doc.setFontSize(16); doc.setTextColor(0); doc.text("TOTAL:", 30, 210); doc.setTextColor(212, 175, 55); doc.text(`${inv.amount} EUR`, 160, 210, { align: 'right' });
            doc.setFontSize(14); doc.setTextColor(0, 150, 0); doc.text("PAYEE", 105, 230, { align: 'center' });
            doc.setFontSize(8); doc.setTextColor(100); doc.text("WhatsHappen - Messagerie Premium Securisee", 105, 270, { align: 'center' });

            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile) {
                const pdfData = doc.output('datauristring');
                const win = window.open();
                win.document.write('<iframe width="100%" height="100%" src="' + pdfData + '"></iframe>');
            } else {
                doc.save(`Facture_${inv.reference}.pdf`);
            }
        } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },

    loadAdminSettings: async function() {
        try {
            const res = await this.api('adminGetSettings');
            const form = document.getElementById('admin-settings-form');
            form.innerHTML = `
                <div class="setting-row"><label>Abonnements</label><input type="checkbox" id="set-enabled" ${res.settings.subscriptionEnabled ? 'checked' : ''} onchange="app.saveSettings()"></div>
                <div class="setting-row"><label>Prix (€)</label><input type="number" id="set-price" value="${res.settings.subscriptionPrice}" onchange="app.saveSettings()"></div>
            `;
        } catch(e) {}
    },
    saveSettings: async function() {
        const settings = {
            subscriptionEnabled: document.getElementById('set-enabled').checked,
            subscriptionPrice: parseFloat(document.getElementById('set-price').value),
            paypalLink: "https://paypal.me/ChaouiEngage5?country.x=FR&locale.x=fr_FR"
        };
        try { await this.api('adminUpdateSettings', { settings }); } catch(e) {}
    },

    // ALERTS
    loadAlerts: async function() {
        try {
            const res = await this.api('adminGetAlerts');
            const list = document.getElementById('admin-alerts-list');
            if (res.alerts.length === 0) { list.innerHTML = '<p style="text-align:center;color:#666;">Aucune alerte</p>'; return; }
            list.innerHTML = res.alerts.map(a => `
                <div class="alert-card ${a.status}">
                   <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                      <span class="alert-severity">${a.detection.keywords[0].category}</span>
                      <small>${new Date(a.timestamp).toLocaleString()}</small>
                   </div>
                   <div style="font-size:0.9rem;"><strong>${a.sender.firstName}</strong> (${a.sender.email})</div>
                   <div style="font-size:0.8rem;color:#888;">IP: ${a.sender.ip} | ${a.sender.location || 'Unknown'}</div>
                   <div style="background:#000;padding:5px;border-radius:4px;margin:5px 0;font-size:0.8rem;">"${a.detection.keywords.map(k=>k.keyword).join(', ')}"</div>
                   <div style="display:flex;gap:5px;margin-top:5px;">
                      <button onclick="app.viewFlaggedConversation('${a.id}')" class="btn-gold" style="font-size:0.7rem;">Voir Chat</button>
                      <button onclick="app.downloadAlertReport('${a.id}')" class="btn-secondary" style="font-size:0.7rem;">Rapport PDF</button>
                      <button onclick="app.dismissAlert('${a.id}')" class="btn-red" style="font-size:0.7rem;padding:5px;">Supprimer</button>
                   </div>
                </div>
            `).join('');
        } catch(e) { this.showError(e.message); }
    },

    viewFlaggedConversation: async function(alertId) {
        try {
            this.toggleLoader(true);
            await this.api('requestConversationAccess', { alertId });
            const code = await this.showPrompt("Code de vérification", "Code reçu par email");
            if (!code) return;
            const res = await this.api('verifyConversationAccess', { alertId, code });

            if (res.success && res.conversation) {
                this.displayFlaggedConversationModal(res.conversation, alertId);
            }
        } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },

    displayFlaggedConversationModal: function(conversation, alertId) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'flagged-conv-modal';

        let messagesHTML = '';
        if (conversation.messages && conversation.messages.length > 0) {
            conversation.messages.forEach(msg => {
                const time = new Date(msg.timestamp).toLocaleString('fr-FR');
                const senderName = msg.senderName || 'Utilisateur';
                messagesHTML += `
                    <div class="flagged-message">
                        <div class="msg-header"><strong>${senderName}</strong><span class="msg-time">${time}</span></div>
                        <div class="msg-content">${msg.content}</div>
                    </div>`;
            });
        } else { messagesHTML = '<p style="color:#888;">Aucun message.</p>'; }

        const participantStr = conversation.participants?.map(p => p.firstName + ' (' + p.email + ')').join(', ') || 'N/A';
        const dateStr = new Date(conversation.chat?.createdAt || Date.now()).toLocaleString('fr-FR');

        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header"><h2>🔐 Conversation Signalée</h2><button class="close-btn" onclick="document.getElementById('flagged-conv-modal').remove()">✕</button></div>
                <div class="flagged-conv-info">
                    <p><strong>Participants:</strong> ${participantStr}</p>
                    <p><strong>Date:</strong> ${dateStr}</p>
                </div>
                <div class="flagged-messages-container">${messagesHTML}</div>
                <div class="modal-footer">
                    ${alertId ? `<button class="btn-gold" onclick="app.downloadAlertReport('${alertId}')">📥 Rapport</button>` : ''}
                    <button class="btn-secondary" onclick="document.getElementById('flagged-conv-modal').remove()">Fermer</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
    },

    downloadAlertReport: async function(alertId) {
        try {
            this.toggleLoader(true);
            await this.api('requestConversationAccess', { alertId });
            const code = await this.showPrompt("Code pour rapport", "Confirmer avec le code email");
            if (!code) return;

            const res = await this.api('getAlertFullReport', { alertId, accessCode: code });
            if (!res.success) { this.showError(res.error); return; }

            const alert = res.alert; const conv = res.conversation;

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.setFontSize(20); doc.setTextColor(255, 0, 0); doc.text("RAPPORT D'ALERTE - CONFIDENTIEL", 20, 20);
            doc.setFontSize(10); doc.setTextColor(100); doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 20, 30);
            doc.setFontSize(14); doc.setTextColor(0); doc.text("INFORMATIONS", 20, 45);
            doc.setFontSize(10); doc.text(`ID: ${alert.id}`, 20, 55);
            doc.text(`Date: ${new Date(alert.timestamp).toLocaleString('fr-FR')}`, 20, 62);
            doc.text(`Sender: ${alert.sender?.email} (${alert.sender?.ip})`, 20, 70);
            doc.text(`Location: ${alert.sender?.location}`, 20, 77);
            doc.text(`UA: ${alert.sender?.userAgent}`, 20, 84, { maxWidth: 170 });
            doc.setFontSize(14); doc.text("CONTENU", 20, 100);
            doc.setFontSize(10); doc.text(doc.splitTextToSize(alert.detection?.messagePreview || 'N/A', 170), 20, 110);

            doc.addPage();
            doc.setFontSize(14); doc.text("CONVERSATION", 20, 20);
            let y = 35;
            if (conv && conv.messages) {
                conv.messages.forEach(msg => {
                    if (y > 270) { doc.addPage(); y = 20; }
                    const time = new Date(msg.timestamp).toLocaleString('fr-FR');
                    const sender = msg.senderName || 'Utilisateur';
                    doc.setFontSize(9); doc.setTextColor(100); doc.text(`[${time}] ${sender}:`, 20, y);
                    y += 5;
                    doc.setTextColor(0);
                    const lines = doc.splitTextToSize(msg.content, 170);
                    doc.text(lines, 25, y);
                    y += (lines.length * 5) + 8;
                });
            }
            doc.save(`RAPPORT_${alertId}.pdf`);
        } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },

    dismissAlert: async function(alertId) {
        if (!await this.showConfirm("Supprimer cette alerte ?")) return;
        try { await this.api('deleteAlert', { alertId }); this.loadAlerts(); } catch(e) { this.showError(e.message); }
    },

    requestAllConversationsAccess: async function() {
        try {
            this.toggleLoader(true);
            await this.api('requestSuperAdminAccess');
            const code = await this.showPrompt("Code Super Admin", "Code reçu par email");
            if (!code) return;
            const res = await this.api('superAdminGetAllConversations', { accessCode: code });

            if (res.success && res.conversations) {
                this.displayAllConversationsModal(res.conversations);
            }
        } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },

    displayAllConversationsModal: function(conversations) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'all-conv-modal';
        let html = '';
        if (conversations.length > 0) {
            conversations.forEach((conv, index) => {
                // Determine display name from participants
                let parts = 'N/A';
                if (conv.participants) {
                    parts = conv.participants.map(p => p.firstName).join(', ');
                } else if (conv.names) {
                    parts = conv.names;
                }

                const lastMsg = conv.messages?.length > 0 ? conv.messages[conv.messages.length - 1] : null;
                const lastMsgPreview = lastMsg ? (lastMsg.content.substring(0, 50) + '...') : 'Aucun message';
                const msgCount = conv.messages?.length || 0;
                const dateStr = conv.chat?.createdAt ? new Date(conv.chat.createdAt).toLocaleString('fr-FR') : '';

                html += `
                    <div class="conv-card" onclick="app.viewConversationDetail(${index})">
                        <div class="conv-header">
                            <strong>${parts}</strong>
                            <span class="msg-count">${msgCount} messages</span>
                        </div>
                        <div class="conv-preview">${lastMsgPreview}</div>
                        <div class="conv-date">${dateStr}</div>
                    </div>`;
            });
        } else { html = '<p class="no-data">Aucune conversation trouvée.</p>'; }

        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>🔐 Toutes les Conversations</h2>
                    <button class="close-btn" onclick="document.getElementById('all-conv-modal').remove()">✕</button>
                </div>
                <div class="all-convs-container">${html}</div>
            </div>`;
        document.body.appendChild(modal);
        this.allConversationsCache = conversations;
    },

    viewConversationDetail: function(index) {
        const conv = this.allConversationsCache[index];
        if (!conv) return;
        document.getElementById('all-conv-modal')?.remove();
        this.displayFlaggedConversationModal(conv, null);
    },

    // BANS
    loadAdminBans: async function() {
        try {
            const res = await this.api('adminGetBans');
            const list = document.getElementById('admin-bans-list');
            if (res.bans.length === 0) { list.innerHTML = '<p style="color:#666;text-align:center;">Aucun bannissement.</p>'; return; }
            list.innerHTML = res.bans.map(b => `
                <div class="user-card" style="border-color:#d00;">
                    <div class="user-info">
                        <span class="user-name" style="color:#d00;">${b.target}</span>
                        <span class="user-meta">${b.type.toUpperCase()} | ${b.reason}</span>
                        <span class="user-meta">${new Date(b.bannedAt).toLocaleDateString()} by ${b.bannedBy}</span>
                    </div>
                    <button onclick="app.adminUnban('${b.target}')" style="background:none;border:none;color:#aaa;cursor:pointer;">✕</button>
                </div>
            `).join('');
        } catch(e) { this.showError(e.message); }
    },

    addBan: async function() {
        const type = document.getElementById('ban-type').value;
        const target = document.getElementById('ban-target').value;
        const reason = document.getElementById('ban-reason').value;
        if (!target) return this.showError("Cible requise");

        try {
            this.toggleLoader(true);
            await this.api('adminBanUser', { target, type, reason });
            this.showSuccess("Utilisateur banni.");
            document.getElementById('ban-target').value = '';
            this.loadAdminBans();
        } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },

    adminUnban: async function(target) {
        if (!await this.showConfirm("Débannir ?")) return;
        try {
            await this.api('adminUnbanUser', { target });
            this.loadAdminBans();
        } catch(e) { this.showError(e.message); }
    },

    // UI UTILS
    showView: function(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active', 'hidden'));
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        const target = document.getElementById(viewId);
        target.classList.remove('hidden'); target.classList.add('active');
        if (viewId === 'view-dashboard') {
            document.getElementById('user-greeting').textContent = this.user.firstName;
            const avatar = document.getElementById('dashboard-avatar');
            const avatarLet = document.getElementById('user-avatar-letter');
            if(avatarLet && this.user.firstName) avatarLet.textContent = this.user.firstName.charAt(0).toUpperCase();
            if (this.user.avatarColor) { avatar.style.background = this.user.avatarColor; avatar.style.border = '2px solid var(--gold)'; }
            else avatar.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)';
            this.updateFabButton(); this.stopPolling();
            if (this.timerInterval) clearInterval(this.timerInterval);
            this.loadConversations();
            this.pollingInterval = setInterval(() => this.loadConversations(), 10000);
        } else if (viewId !== 'view-chat') this.stopPolling();
    },

    updateFabButton: function() {
        const btnCreate = document.getElementById('btn-create-fab');
        const btnSubscribe = document.getElementById('btn-subscribe-fab');
        if (this.user.isAdmin || this.user.canCreate || this.user.isSubscriber) { btnCreate.classList.remove('hidden'); btnSubscribe.classList.add('hidden'); }
        else { btnCreate.classList.add('hidden'); btnSubscribe.classList.remove('hidden'); }
    },

    openSubscription: async function() {
        try {
            this.toggleLoader(true);
            const res = await this.api('getSubscriptionCode');
            document.getElementById('sub-code').textContent = res.code;
            document.getElementById('sub-price').textContent = res.price + ' €';
            document.getElementById('sub-paypal-link').href = res.paypalLink;
            document.getElementById('subscription-modal').classList.remove('hidden');
        } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },
    copySubCode: function() {
        const code = document.getElementById('sub-code').textContent;
        navigator.clipboard.writeText(code); this.showInfo("Code copié !");
    },
    submitSubscription: async function() {
        const txn = document.getElementById('sub-transaction').value.trim();
        if (!txn) return this.showError("Entrez le numéro de transaction.");
        try {
            this.toggleLoader(true);
            const res = await this.api('submitSubscription', { paypalTransaction: txn });
            this.showSuccess(res.message);
            document.getElementById('subscription-modal').classList.add('hidden');
        } catch(e) { this.showError(e.message); } finally { this.toggleLoader(false); }
    },
    showLogin: function() { this.showView('view-auth'); document.getElementById('form-login').classList.remove('hidden'); document.getElementById('form-register').classList.add('hidden'); },
    showRegister: function() { document.getElementById('form-login').classList.add('hidden'); document.getElementById('form-register').classList.remove('hidden'); },
    showDashboard: function() { this.showView('view-dashboard'); },
    showNewChat: function() { this.showView('view-new-chat'); },
    toggleLoader: function(show) { const l = document.getElementById('loader'); if (show) l.classList.remove('hidden'); else l.classList.add('hidden'); },
    stopPolling: function() { if (this.pollingInterval) clearInterval(this.pollingInterval); }
};

window.onload = () => app.init();

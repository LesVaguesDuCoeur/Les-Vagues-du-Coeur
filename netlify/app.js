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
    selectedDuration: '10min',
    typingTimeout: null,
    replyingTo: null,

    init: function() {
        this.setupListeners();

        // Logo Handling
        if (typeof window.LOGO_BASE64 !== 'undefined' && window.LOGO_BASE64.length > 20) {
            const logoEl = document.getElementById('app-logo');
            if (logoEl) logoEl.src = window.LOGO_BASE64;
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
    showModal: function(type, title, message, showCancel = false, inputPlaceholder = null, choices = null) {
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

            // Choices Mode (New)
            if (choices) {
                messageEl.innerHTML = ''; // Clear text
                choices.forEach(choice => {
                    const btn = document.createElement('button');
                    btn.className = 'btn-gold';
                    btn.style.marginTop = '10px';
                    btn.textContent = choice.label;
                    btn.onclick = () => {
                        cleanup();
                        resolve(choice.value);
                    };
                    messageEl.appendChild(btn);
                });
                confirmBtn.classList.add('hidden'); // Hide default OK
            } else {
                confirmBtn.classList.remove('hidden');
            }

            overlay.classList.remove('hidden');

            const cleanup = () => {
                overlay.classList.add('hidden');
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
    showChoice: function(title, choices) { return this.showModal('info', title, '', true, null, choices); },

    // ==========================================
    // LISTENERS
    // ==========================================
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
        if (regPass) {
            regPass.addEventListener('input', () => this.checkPasswordStrength(regPass.value));
        }

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
        const msgInput = document.getElementById('message-input');
        msgInput.onkeypress = (e) => { if(e.key === 'Enter') this.sendMessage(); };
        msgInput.addEventListener('input', () => {
            if (this.typingTimeout) clearTimeout(this.typingTimeout);
            this.sendTypingSignal(true);
            this.typingTimeout = setTimeout(() => this.sendTypingSignal(false), 2000);
        });

        document.getElementById('btn-refresh-chat').onclick = () => this.loadMessages(this.currentChatId);
        document.getElementById('btn-chat-options').onclick = () => {
            const menu = document.getElementById('chat-options-menu');
            menu.classList.toggle('hidden');
        };

        // document.getElementById('btn-add-member').onclick = () => this.addMember(); // Moved to menu
        // document.getElementById('btn-delete-chat').onclick = () => this.deleteCurrentChat(); // Moved to menu

        document.getElementById('dashboard-avatar').onclick = () => {
             if (this.user && this.user.isAdmin) this.showAdmin();
        };

        window.addEventListener('blur', () => document.body.classList.add('blurred'));
        window.addEventListener('focus', () => document.body.classList.remove('blurred'));
        document.addEventListener('contextmenu', event => event.preventDefault());

        // Duration Chips
        document.querySelectorAll('.duration-chips .chip').forEach(c => {
            c.onclick = () => {
                document.querySelectorAll('.duration-chips .chip').forEach(x => x.classList.remove('selected'));
                c.classList.add('selected');
                this.selectedDuration = c.dataset.val;
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
            await this.showSuccess("Votre code a été réinitialisé. Vous pouvez maintenant vous connecter.");
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
        const confirm = document.getElementById('reg-code-confirm').value;

        if (code !== confirm) return this.showError("Les mots de passe ne correspondent pas.");
        if (code.length < 4) return this.showError("Le mot de passe est trop court.");

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

        let color = '#d00';
        let label = 'Faible';
        let width = '20%';

        if (score >= 4) {
            color = '#0f0';
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

            // Sort: Pinned first, then Newest
            res.chats.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                const tA = a.lastMessage && a.lastMessage.timestamp ? new Date(a.lastMessage.timestamp) : new Date(0);
                const tB = b.lastMessage && b.lastMessage.timestamp ? new Date(b.lastMessage.timestamp) : new Date(0);
                return tB - tA;
            });

            res.chats.forEach(chat => {
                if (chat.archived) return; // Hide archived

                const el = document.createElement('div');
                el.className = 'chat-card';

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

                let pinnedIcon = chat.pinned ? '<span class="pinned-indicator">📌</span>' : '';

                el.innerHTML = `
                    <div class="card-content">
                        <h4>${pinnedIcon}${chat.names}</h4>
                        <p>${lastMsg}</p>
                    </div>
                    <div class="card-meta">
                        <div style="margin-bottom:5px">⏳ ${timeLeft}</div>
                        <div style="display:flex; align-items:center; justify-content:flex-end;">
                           ${isUnread ? '<span style="color:var(--gold);margin-right:5px;">●</span>' : ''}
                           <span>➔</span>
                        </div>
                    </div>
                `;

                el.onclick = () => this.enterChat(chat.id, chat.expiresAt);
                list.appendChild(el);
            });
        } catch (e) {}
    },

    createChat: async function() {
        const emails = document.getElementById('new-chat-emails').value.split(',').map(e => e.trim());
        const duration = this.selectedDuration;

        if (!emails[0]) return this.showError("Veuillez mettre au moins un email.");

        const btn = document.getElementById('btn-create-chat');
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
            btn.textContent = "Lancer";
            btn.disabled = false;
        }
    },

    contactSupport: async function() {
        if (!await this.showConfirm("Contacter le support (Chaoui) ?")) return;

        try {
            this.toggleLoader(true);
            const res = await this.api('createConversation', {
                participants: ['chaouiengage@gmail.com'], // Or new one? Stick to known support email or prompt user? Support usually handles redirects.
                duration: 'unlimited'
            });
            this.enterChat(res.chatId, null);
        } catch (e) {
            this.showError(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    enterChat: function(chatId, expiresAt) {
        this.stopPolling();
        this.currentChatId = chatId;
        this.chatExpiresAt = expiresAt ? new Date(expiresAt) : null;

        localStorage.setItem(`read_${chatId}`, new Date().toISOString());
        this.api('markAsRead', { chatId: chatId });

        document.getElementById('messages-area').innerHTML = '';
        document.getElementById('chat-title').textContent = 'Chargement...';
        document.getElementById('chat-options-menu').classList.add('hidden');

        this.showView('view-chat');
        this.loadMessages(chatId);
        this.startTimer();

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
                        content = `<img src="${msg.content}" onclick="app.showImageModal('${msg.content}')">`;
                    } else if (msg.type === 'deleted') {
                        content = `<i class="deleted-msg">🚫 Message supprimé</i>`;
                    } else {
                        content = `<div>${msg.content}</div>`;
                    }

                    // Reply Preview
                    let replyHtml = '';
                    if (msg.replyTo) {
                        const parent = res.messages.find(m => m.id === msg.replyTo);
                        if (parent) {
                            replyHtml = `<div class="reply-bubble-preview" style="border-left:2px solid var(--gold); padding-left:5px; margin-bottom:5px; font-size:0.7rem; color:#888;">
                                <strong>${parent.senderName}</strong>: ${parent.content.substring(0, 20)}...
                            </div>`;
                        }
                    }

                    div.innerHTML = `
                        ${replyHtml}
                        <div class="msg-name">${msg.senderName}</div>
                        ${content}
                        <div style="font-size:0.6rem; opacity:0.5; text-align:right; margin-top:2px">
                           ${new Date(msg.timestamp).toLocaleTimeString().slice(0,5)}
                           ${msg.isMe ? '<span class="status read">✓✓</span>' : ''}
                        </div>
                    `;

                    // Context Menu on click
                    div.onclick = (e) => {
                        // Implement message options (reply, delete)
                        if (!msg.isMe && msg.type !== 'deleted') {
                            this.replyToMessage(msg);
                        } else if (msg.isMe && msg.type !== 'deleted') {
                            this.showMyMessageOptions(msg.id);
                        }
                    };
                }
                area.appendChild(div);
            });
            area.scrollTop = area.scrollHeight;
        } catch (e) {}
    },

    showImageModal: function(src) {
        const modal = document.getElementById('image-modal-overlay');
        const img = document.getElementById('image-modal-img');
        const dl = document.getElementById('image-modal-dl');

        img.src = src;
        dl.href = src;
        modal.classList.remove('hidden');
    },

    replyToMessage: function(msg) {
        this.replyingTo = msg;
        const container = document.getElementById('reply-preview-container');
        container.innerHTML = `
            <div class="reply-preview">
              <span class="reply-to">Répondre à ${msg.senderName}</span>
              <span class="reply-text">${msg.content.substring(0, 30)}...</span>
              <button onclick="app.cancelReply()" style="background:none;border:none;color:#d00;">✕</button>
            </div>
        `;
        document.getElementById('message-input').focus();
    },

    cancelReply: function() {
        this.replyingTo = null;
        document.getElementById('reply-preview-container').innerHTML = '';
    },

    showMyMessageOptions: async function(msgId) {
        const choice = await this.showChoice("Options Message", [
            { value: 'delete', label: 'Supprimer pour tous' }
        ]);
        if (choice === 'delete') {
            await this.api('deleteMessage', { chatId: this.currentChatId, messageId: msgId, deleteFor: 'all' });
            this.loadMessages(this.currentChatId);
        }
    },

    sendTypingSignal: async function(isTyping) {
        // Optimistic, no blocking
        this.api('setTyping', { chatId: this.currentChatId, isTyping });
    },

    sendMessage: async function() {
        const input = document.getElementById('message-input');
        const fileInput = document.getElementById('file-input');
        const btn = document.getElementById('btn-send');

        const text = input.value;
        const hasFile = fileInput.files.length > 0;

        if (!text.trim() && !hasFile) return;

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
                this.cancelReply();
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
        const replyToId = this.replyingTo ? this.replyingTo.id : null;
        await this.api('sendMessage', {
            chatId: this.currentChatId,
            content,
            type,
            replyTo: replyToId
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
        } catch (e) {
            this.showError(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    pinCurrentChat: async function() {
        await this.api('pinChat', { chatId: this.currentChatId });
        this.showSuccess("Épinglé/Désépinglé");
        document.getElementById('chat-options-menu').classList.add('hidden');
    },

    archiveCurrentChat: async function() {
        await this.api('archiveChat', { chatId: this.currentChatId });
        this.showSuccess("Archivé/Désarchivé");
        this.showDashboard();
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
    // USER PROFILE
    // ==========================================
    showProfile: function() {
        this.showView('view-profile');
        if (!this.user) return;

        document.getElementById('profile-pseudo').value = this.user.firstName || '';
        document.getElementById('profile-email').value = this.user.email || '';
        this.initColorPicker();

        const adminBtnContainer = document.getElementById('profile-admin-link');
        const adminEmail = atob("Y2hhb3VpZW5nYWdlQGdtYWlsLmNvbQ=="); // Keeping old hardcoded for UI visibility check if needed, or check isAdmin flag
        if (this.user.isAdmin) {
            adminBtnContainer.classList.remove('hidden');
        } else {
            adminBtnContainer.classList.add('hidden');
        }
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
        } catch(e) {
            this.showError(e.message);
        } finally {
            this.toggleLoader(false);
        }
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
        } catch(e) {
            this.showError(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    deleteAccount: async function() {
        const confirm1 = await this.showConfirm("Êtes-vous sûr de vouloir supprimer votre compte ?");
        if (!confirm1) return;
        const confirm2 = await this.showConfirm("Cette action est irréversible. Toutes vos données seront perdues.");
        if (!confirm2) return;

        try {
            this.toggleLoader(true);
            await this.api('deleteAccount');
            this.logout();
            this.showInfo("Compte supprimé. Au revoir.");
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
        if (tab === 'alerts') this.loadAdminAlerts();
    },

    loadAdminUsers: async function() {
        try {
            const res = await this.api('adminGetUsers');
            const list = document.getElementById('admin-users-list');
            list.innerHTML = res.users.map(u => `
                <div class="user-card ${u.email.includes('chaouiengage') ? 'super-admin' : ''}">
                    <div class="user-info">
                        <span class="user-name">${u.firstName}</span>
                        <span class="user-email">${u.email}</span>
                        <span class="user-meta">Connecté: ${u.lastLoginDays || '?'}</span>
                    </div>
                    <div class="user-roles">
                        <button class="role-btn admin ${u.isAdmin ? 'active' : ''}" onclick="app.toggleRole('${u.email}', 'isAdmin')">👑</button>
                        <button class="role-btn creator ${u.canCreate ? 'active' : ''}" onclick="app.toggleRole('${u.email}', 'canCreate')">✏️</button>
                        <button class="role-btn subscriber ${u.isSubscriber ? 'active' : ''}" onclick="app.toggleRole('${u.email}', 'isSubscriber')">💳</button>
                    </div>
                    <div class="user-actions">
                        <button onclick="app.regenCode('${u.email}')">🔑</button>
                        ${!u.email.includes('chaouiengage') ?
                          `<button onclick="app.deleteUser('${u.email}')" style="color:#d00;">🗑️</button>` : ''}
                    </div>
                </div>
            `).join('');
        } catch(e) {
            this.showError("Accès refusé");
            this.showDashboard();
        }
    },

    // ... (Existing toggleRole, deleteUser, regenCode methods)

    toggleRole: async function(targetEmail, role) {
        if (targetEmail.includes('chaouiengage')) return this.showError("Impossible de modifier le Super Admin.");
        const btn = event.currentTarget;
        btn.classList.toggle('active');
        try {
            const users = (await this.api('adminGetUsers')).users;
            const target = users.find(u => u.email === targetEmail);
            const updates = {};
            updates[role] = !target[role];
            await this.api('adminUpdateUser', { targetEmail, ...updates });
        } catch(e) {
            btn.classList.toggle('active');
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

    // --- ALERTS ADMIN ---
    loadAdminAlerts: async function() {
        try {
            const res = await this.api('adminGetAlerts');
            const list = document.getElementById('admin-alerts-list');

            if (res.alerts.length === 0) {
                list.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Aucune alerte.</div>';
                return;
            }

            list.innerHTML = res.alerts.map(a => `
                <div class="alert-card ${a.status}">
                    <div class="alert-header">
                        <span class="alert-severity">${a.detection.keywords[0].category}</span>
                        <span class="alert-date">${new Date(a.timestamp).toLocaleString()}</span>
                    </div>
                    <div class="alert-sender">
                        <strong>${a.sender.firstName}</strong> (${a.sender.email})<br>
                        IP: ${a.sender.ip}
                    </div>
                    <div class="alert-preview">
                        "${a.detection.messagePreview}"
                    </div>
                    <div class="alert-actions">
                        <button onclick="app.viewAlertConversation('${a.id}')" class="btn-gold" style="font-size:0.7rem;">🔍 Voir</button>
                        <button onclick="app.downloadAlertReport('${a.id}')" class="btn-secondary" style="font-size:0.7rem;">📥 Rapport</button>
                        <button onclick="app.deleteAlert('${a.id}')" class="btn-danger" style="font-size:0.7rem;">🗑️</button>
                    </div>
                </div>
            `).join('');
        } catch(e) {
            this.showError(e.message);
        }
    },

    viewAlertConversation: async function(alertId) {
        if (!await this.showConfirm("Un code d'accès va être envoyé à votre email. Continuer ?")) return;
        try {
            await this.api('requestConversationAccess', { alertId });
            const code = await this.showPrompt("Code de vérification", "Code reçu par email");
            if (!code) return;

            const res = await this.api('verifyConversationAccess', { alertId, code });

            // Display in overlay
            const msgs = res.conversation.messages;
            const content = document.getElementById('super-admin-content');
            content.innerHTML = `
                <h4 style="color:#d00; text-align:center;">CONTENU SIGNALÉ - ${res.alert.detection.keywords[0].category}</h4>
                <div style="background:#111; padding:15px; border-radius:10px; margin-bottom:15px;">
                    <div style="color:var(--gold); font-size:0.9rem;">Expéditeur: ${res.alert.sender.firstName} (${res.alert.sender.email})</div>
                    <div style="color:#888; font-size:0.8rem;">IP: ${res.alert.sender.ip}</div>
                </div>
                <div class="messages-container" style="max-height:60vh; overflow-y:auto; border:1px solid #333; padding:10px;">
                    ${msgs.map(m => `
                        <div class="msg ${m.sender === res.alert.sender.email ? 'other' : 'me'}" style="margin-bottom:10px; padding:10px; background:${m.sender === res.alert.sender.email ? '#2a1a1a' : '#222'}; border:${m.sender === res.alert.sender.email ? '1px solid #d00' : 'none'}; border-radius:10px;">
                            <div style="font-size:0.7rem; color:#888;">${m.senderName} - ${new Date(m.timestamp).toLocaleString()}</div>
                            <div style="margin-top:5px;">${m.content}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            document.getElementById('super-admin-view').classList.remove('hidden');

        } catch(e) {
            this.showError(e.message);
        }
    },

    downloadAlertReport: async function(alertId) {
        if (!await this.showConfirm("Un code d'accès va être envoyé à votre email. Continuer ?")) return;
        try {
            await this.api('requestConversationAccess', { alertId });
            const code = await this.showPrompt("Code de vérification", "Code reçu par email");
            if (!code) return;

            const res = await this.api('verifyConversationAccess', { alertId, code });

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const alert = res.alert;
            const msgs = res.conversation.messages;

            doc.setFontSize(20);
            doc.text("RAPPORT D'ALERTE - CONFIDENTIEL", 20, 20);

            doc.setFontSize(12);
            doc.text(`Date: ${new Date(alert.timestamp).toLocaleString('fr-FR')}`, 20, 40);
            doc.text(`ID Alerte: ${alert.id}`, 20, 50);

            doc.setFontSize(14);
            doc.text("INFORMATIONS EXPÉDITEUR", 20, 70);
            doc.setFontSize(10);
            doc.text(`Nom: ${alert.sender.firstName}`, 20, 80);
            doc.text(`Email: ${alert.sender.email}`, 20, 88);
            doc.text(`Adresse IP: ${alert.sender.ip}`, 20, 96);
            doc.text(`Appareil: ${alert.sender.userAgent}`, 20, 104);

            doc.setFontSize(14);
            doc.text("CONTENU DÉTECTÉ", 20, 130);
            doc.setFontSize(10);
            alert.detection.keywords.forEach((kw, i) => {
                doc.text(`- ${kw.category}: "${kw.keyword}"`, 25, 140 + (i * 8));
            });

            doc.addPage();
            doc.setFontSize(14);
            doc.text("CONVERSATION COMPLÈTE", 20, 20);

            let y = 35;
            msgs.forEach(msg => {
                if (y > 270) { doc.addPage(); y = 20; }
                doc.setFontSize(8);
                doc.text(`[${new Date(msg.timestamp).toLocaleString('fr-FR')}] ${msg.senderName} (${msg.sender}):`, 20, y);
                y += 5;
                const lines = doc.splitTextToSize(msg.content, 170);
                doc.text(lines, 25, y);
                y += (lines.length * 5) + 5;
            });

            doc.save(`ALERTE_${alertId}_${Date.now()}.pdf`);

        } catch(e) {
            this.showError(e.message);
        }
    },

    deleteAlert: async function(alertId) {
        if (!await this.showConfirm("Supprimer cette alerte ?")) return;
        try {
            await this.api('deleteAlert', { alertId });
            this.loadAdminAlerts();
        } catch(e) { this.showError(e.message); }
    },

    // --- SUBSCRIPTIONS & INVOICES ---
    // ... (Existing loadAdminSubscriptions, adminEditSub, etc.)
    adminSubs: [],
    loadAdminSubscriptions: async function() {
        try {
            const res = await this.api('adminGetSubscriptions');
            this.adminSubs = res.subscriptions;
            const list = document.getElementById('admin-subscriptions-list');
            list.innerHTML = res.subscriptions.map(s => {
                const isActive = s.status === 'active';
                return `
                <div class="sub-card">
                    <div class="sub-info">
                        <span>${s.firstName} (${s.email})</span>
                        <div style="display:flex; gap:5px; align-items:center;">
                            <span class="sub-status ${s.status}">${s.status}</span>
                            <button onclick="app.adminEditSub('${s.email}')">✏️</button>
                            <button onclick="app.adminDeleteSub('${s.email}')">🗑️</button>
                        </div>
                    </div>
                    <div class="sub-details">
                        Code: ${s.whatsappenCode} <br>
                        Txn: ${s.paypalTransaction || 'N/A'} <br>
                        ${s.startDate} - ${s.endDate}
                    </div>
                    ${s.status === 'pending' ? `
                        <div class="validation-form">
                           <input type="date" id="start-${s.email}" value="${new Date().toISOString().split('T')[0]}">
                           <input type="date" id="end-${s.email}" value="${new Date(new Date().setFullYear(new Date().getFullYear()+1)).toISOString().split('T')[0]}">
                           <button class="btn-validate" onclick="app.validateSub('${s.email}')">Valider</button>
                        </div>
                    ` : ''}
                    ${isActive ? `
                        <div style="display:flex;gap:5px;margin-top:5px;">
                            <button onclick="app.downloadInvoice('${s.email}')" class="btn-gold" style="font-size:0.6rem;">📄 PDF</button>
                            <button onclick="app.sendInvoiceEmail('${s.email}')" class="btn-secondary" style="font-size:0.6rem;">✉️ Email</button>
                        </div>
                    ` : ''}
                </div>
            `}).join('');
        } catch(e) {
            this.showError(e.message);
        }
    },

    // Mobile Invoice Fix
    downloadInvoice: async function(email) {
        try {
            this.toggleLoader(true);
            const res = await this.api('adminGetInvoices', { targetEmail: email });
            const inv = res.invoices[res.invoices.length-1];
            if (!inv) throw new Error("Aucune facture.");

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(22); doc.text("FACTURE", 105, 20, null, null, "center");
            doc.setFontSize(12); doc.text("CHAOUI ENGAGÉ", 20, 40);
            doc.setFontSize(10);
            doc.text(`Ref: ${inv.reference}`, 150, 40);
            doc.text(`Client: ${inv.firstName}`, 20, 60);
            doc.text(`Montant: ${inv.amount} EUR`, 20, 70);
            doc.text(`Payé par PayPal: ${inv.paypalTransaction}`, 20, 80);

            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            if (isMobile) {
                const pdfData = doc.output('datauristring');
                const link = document.createElement('a');
                link.href = pdfData;
                link.download = `Facture_${inv.reference}.pdf`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                doc.save(`Facture_${inv.reference}.pdf`);
            }
        } catch(e) {
            this.showError(e.message);
        } finally {
            this.toggleLoader(false);
        }
    },

    sendInvoiceEmail: async function(email) {
        if (!await this.showConfirm("Envoyer la facture par email ?")) return;
        try {
            // Need invoice ID, fetch first
            const res = await this.api('adminGetInvoices', { targetEmail: email });
            const inv = res.invoices[res.invoices.length-1];
            if (!inv) throw new Error("Aucune facture.");

            await this.api('sendInvoiceEmail', { invoiceId: inv.reference });
            this.showSuccess("Envoyé !");
        } catch(e) { this.showError(e.message); }
    },

    loadAdminSettings: async function() {
        try {
            const res = await this.api('adminGetSettings');
            const form = document.getElementById('admin-settings');

            // Check if Super Admin
            const superAdminSection = this.user.email === 'chaouiengage@icloud.com' ?
                document.getElementById('super-admin-section').outerHTML.replace('hidden', '') : '';

            form.innerHTML = `
                <div class="setting-row">
                    <label>Abonnements activés</label>
                    <input type="checkbox" id="set-enabled" ${res.settings.subscriptionEnabled ? 'checked' : ''} onchange="app.saveSettings()">
                </div>
                <div class="setting-row">
                    <label>Prix (€)</label>
                    <input type="number" id="set-price" value="${res.settings.subscriptionPrice}" onchange="app.saveSettings()">
                </div>
                ${superAdminSection}
            `;
        } catch(e) {}
    },

    requestAllConversationsAccess: async function() {
        if (!await this.showConfirm("ACCÈS SUPER ADMIN : Un code va être envoyé.")) return;
        try {
            await this.api('requestSuperAdminAccess');
            const code = await this.showPrompt("Code Super Admin", "Code reçu par email");
            if (!code) return;

            const res = await this.api('superAdminGetAllConversations', { accessCode: code });

            // Display in overlay
            const content = document.getElementById('super-admin-content');
            content.innerHTML = res.conversations.map(c => `
                <div style="background:#222; padding:10px; margin-bottom:10px; border:1px solid #444;">
                    <div>ID: ${c.id}</div>
                    <div>Expires: ${c.expiresAt}</div>
                    <div>Participants: ${JSON.stringify(c.participants)}</div>
                </div>
            `).join('');
            document.getElementById('super-admin-view').classList.remove('hidden');

        } catch(e) { this.showError(e.message); }
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

    // ... (Other standard methods: adminDeleteSub, validateSub, etc. - ensure they are present)
    adminDeleteSub: async function(email) {
        if (!await this.showConfirm("Supprimer cet abonnement ?")) return;
        try {
            this.toggleLoader(true);
            await this.api('adminDeleteSubscription', { targetEmail: email });
            this.showSuccess("Abonnement supprimé.");
            this.loadAdminSubscriptions();
        } catch(e) {
            this.showError(e.message);
        } finally {
            this.toggleLoader(false);
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

            const avatar = document.getElementById('dashboard-avatar');
            const avatarLet = document.getElementById('user-avatar-letter');
            if(avatarLet && this.user.firstName) {
                avatarLet.textContent = this.user.firstName.charAt(0).toUpperCase();
            }
            if (this.user.avatarColor) {
                avatar.style.background = this.user.avatarColor;
                avatar.style.border = '2px solid var(--gold)';
            } else {
                 avatar.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)';
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

// ==========================================
// WAHTSHAPPEN - FRONTEND LOGIC (NETLIFY)
// ==========================================

const CONFIG = {
  // Configured URL as requested
  API_URL: "https://script.google.com/macros/s/AKfycbxzFevbQJzerwD2L-uNcVTRJE9XVJ4HGdC9KUftOyIKT9pqErsvNfPsfSC12MjBEUDQvA/exec"
};

const app = {
  state: {
    token: localStorage.getItem('wh_token'),
    email: localStorage.getItem('wh_email'),
    user: null,
    currentChatId: null,
    pollingInterval: null
  },

  init: function() {
    // Anti-screenshot
    window.addEventListener('blur', () => document.body.classList.add('blurred'));
    window.addEventListener('focus', () => document.body.classList.remove('blurred'));
    document.addEventListener('contextmenu', event => event.preventDefault());

    if (this.state.token && this.state.email) {
      this.loadDashboard();
    } else {
      this.nav('login');
    }
  },

  // NAVIGATION
  nav: function(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');

    if (viewId !== 'conversation' && this.state.pollingInterval) {
      clearInterval(this.state.pollingInterval);
      this.state.pollingInterval = null;
    }

    if (viewId === 'admin') {
      this.loadAdminUsers();
    }
  },

  loading: function(show, msg) {
    const el = document.getElementById('loading');
    if (show) {
      el.classList.remove('hidden');
      if (msg) document.getElementById('loading-text').innerText = msg;
    } else {
      el.classList.add('hidden');
    }
  },

  // API CALL HELPER
  callApi: function(action, payload, onSuccess) {
    const data = { action: action, ...payload };

    fetch(CONFIG.API_URL, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        // Special case: Temporary Password
        if (res.requireNewPassword) {
          this.showChangePasswordModal(payload.email, payload.code);
          return;
        }
        onSuccess(res);
      } else {
        this.loading(false);
        if (res.error && res.error.includes("Session")) {
          this.logout();
        } else {
          alert("Erreur: " + res.error);
        }
      }
    })
    .catch(e => {
      this.loading(false);
      console.error(e);
      alert("Erreur de connexion serveur.");
    });
  },

  // AUTH
  login: function() {
    const email = document.getElementById('login-email').value;
    const code = document.getElementById('login-code').value;
    if (!email || !code) return alert("Remplissez tout.");

    this.loading(true, "Connexion...");
    this.callApi('login', { email: email, code: code }, (res) => {
      this.loading(false);
      this.saveSession(res.token, email, res.user);
      this.loadDashboard();
    });
  },

  showChangePasswordModal: function(email, oldCode) {
    this.loading(false);
    const newCode = prompt("Ceci est votre première connexion avec ce code temporaire.\nVeuillez définir votre nouveau Code Secret :");
    if (!newCode) return;

    this.loading(true, "Mise à jour...");
    this.callApi('changePassword', { email: email, oldCode: oldCode, newCode: newCode }, (res) => {
       this.loading(false);
       alert("Mot de passe modifié avec succès !");
       this.saveSession(res.token, email, res.user);
       this.loadDashboard();
    });
  },

  register: function() {
    const fn = document.getElementById('reg-firstname').value;
    const em = document.getElementById('reg-email').value;
    const co = document.getElementById('reg-code').value;
    if (!fn || !em || !co) return alert("Tout remplir SVP.");

    this.loading(true, "Inscription...");
    this.callApi('register', { email: em, firstName: fn, code: co }, (res) => {
      this.loading(false);
      this.saveSession(res.token, em, res.user);
      this.loadDashboard();
    });
  },

  saveSession: function(token, email, user) {
    this.state.token = token;
    this.state.email = email;
    this.state.user = user;
    localStorage.setItem('wh_token', token);
    localStorage.setItem('wh_email', email);
  },

  logout: function() {
    localStorage.clear();
    location.reload();
  },

  // DASHBOARD
  loadDashboard: function() {
    this.nav('dashboard');
    this.refreshChats();
  },

  refreshChats: function() {
    this.loading(true);
    this.callApi('getState', { token: this.state.token, email: this.state.email }, (res) => {
      this.loading(false);
      this.state.user = res.user;

      // Admin Access via Logo
      const logoBtn = document.getElementById('main-logo-btn');
      if (res.user.isAdmin) {
         logoBtn.classList.remove('hidden');
         logoBtn.style.cursor = "pointer";
         logoBtn.onclick = () => this.nav('admin');
      } else {
         logoBtn.classList.add('hidden');
      }

      // Create Rights
      if (res.user.isAdmin || res.user.canCreate) {
         document.getElementById('btn-create-chat').classList.remove('hidden');
      } else {
         document.getElementById('btn-create-chat').classList.add('hidden');
      }

      this.renderChatList(res.chats);
    });
  },

  renderChatList: function(chats) {
    const list = document.getElementById('chat-list');
    list.innerHTML = "";
    if (chats.length === 0) {
      list.innerHTML = "<div style='text-align:center;color:#888'>Aucune conversation.</div>";
      return;
    }

    chats.forEach(chat => {
      const div = document.createElement('div');
      div.className = 'item';

      let timeStr = "Actif";
      if (chat.expiresAt) {
        const diff = new Date(chat.expiresAt) - new Date();
        if (diff > 0) {
           const mins = Math.floor(diff / 60000);
           const hrs = Math.floor(mins / 60);
           timeStr = hrs > 0 ? `${hrs}h restants` : `${mins} min restants`;
        } else {
           timeStr = "Expiré";
        }
      } else {
        timeStr = "Illimité";
      }

      div.innerHTML = `
        <div class="name">${chat.names.join(', ')}</div>
        <div class="meta">${timeStr}</div>
      `;
      div.onclick = () => this.openChat(chat.id, chat.names, chat.expiresAt);
      list.appendChild(div);
    });
  },

  // CREATE CHAT
  showNewChatModal: function() {
    if (!this.state.user.canCreate && !this.state.user.isAdmin) return;
    document.getElementById('modal-new-chat').classList.remove('hidden');
  },

  hideModal: function(id) {
    document.getElementById(id).classList.add('hidden');
  },

  createChat: function() {
    const emailsStr = document.getElementById('new-chat-emails').value;
    const duration = document.getElementById('new-chat-duration').value;

    if (!emailsStr) return alert("Emails requis.");
    const emails = emailsStr.split(',').map(s => s.trim()).filter(s => s);

    this.loading(true);
    this.callApi('createChat', {
      token: this.state.token,
      email: this.state.email,
      participants: emails,
      duration: duration
    }, (res) => {
      this.loading(false);
      this.hideModal('modal-new-chat');
      this.refreshChats();
    });
  },

  // CONVERSATION
  openChat: function(chatId, names, expiresAt) {
    this.state.currentChatId = chatId;
    this.nav('conversation');

    const cleanNames = names.filter(n => n !== this.state.user.firstName);
    document.getElementById('chat-names').innerText = names.join(', ');

    this.refreshMessages();

    if (this.state.pollingInterval) clearInterval(this.state.pollingInterval);
    this.state.pollingInterval = setInterval(() => this.refreshMessages(true), 5000);
  },

  refreshMessages: function(silent) {
    if (!silent) this.loading(true);
    this.callApi('getMessages', {
      token: this.state.token,
      email: this.state.email,
      chatId: this.state.currentChatId
    }, (res) => {
      if (!silent) this.loading(false);
      this.renderMessages(res.messages);
    });
  },

  renderMessages: function(msgs) {
    const container = document.getElementById('message-container');
    container.innerHTML = "";

    msgs.forEach(m => {
      const div = document.createElement('div');
      const isMe = (m.sender === this.state.email);
      div.className = `msg ${isMe ? 'me' : 'them'}`;

      let content = "";
      if (m.type === 'image' || m.type === 'file') {
        content = `<img src="${m.content}" onclick="alert('Image cryptée')">`;
      } else {
        content = m.content;
      }

      div.innerHTML = `
        <span class="sender">${isMe ? 'Moi' : m.senderName}</span>
        ${content}
      `;
      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
  },

  sendMessage: function() {
    const input = document.getElementById('msg-input');
    const txt = input.value.trim();
    if (!txt) return;

    input.value = "";
    this.callApi('sendMessage', {
      token: this.state.token,
      email: this.state.email,
      chatId: this.state.currentChatId,
      content: txt,
      type: 'text'
    }, (res) => {
      this.refreshMessages(true);
    });
  },

  handleFileUpload: function(elem) {
    const file = elem.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("Fichier trop lourd (Max 2Mo)");

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      this.loading(true, "Envoi image...");
      this.callApi('sendMessage', {
        token: this.state.token,
        email: this.state.email,
        chatId: this.state.currentChatId,
        content: base64,
        type: 'image'
      }, (res) => {
        this.loading(false);
        elem.value = "";
        this.refreshMessages(true);
      });
    };
    reader.readAsDataURL(file);
  },

  // NEW: Add Participant Logic
  addParticipant: function() {
     const email = prompt("Email du participant à ajouter :");
     if (!email) return;

     this.loading(true);
     this.callApi('addParticipant', {
        token: this.state.token,
        email: this.state.email,
        chatId: this.state.currentChatId,
        targetEmail: email
     }, (res) => {
        this.loading(false);
        alert("Ajouté !");
        this.refreshMessages(true);
     });
  },

  // --- ADMIN FUNCTIONS ---
  loadAdminUsers: function() {
    this.loading(true, "Chargement Users...");
    this.callApi('adminGetUsers', { token: this.state.token, email: this.state.email }, (res) => {
      this.loading(false);
      this.renderAdminList(res.users);
    });
  },

  renderAdminList: function(users) {
    const list = document.getElementById('admin-user-list');
    list.innerHTML = "";

    users.forEach(u => {
      const div = document.createElement('div');
      div.className = 'item';
      div.style.borderLeft = u.isAdmin ? "3px solid #f00" : (u.canCreate ? "3px solid var(--gold)" : "3px solid transparent");

      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div class="name">${u.firstName} (${u.email})</div>
            <div class="meta">
               ${u.isAdmin ? "<strong style='color:red'>ADMIN</strong>" : ""}
               ${u.canCreate ? "CRÉATEUR" : ""}
            </div>
            <div class="meta">Inscrit: ${new Date(u.registeredAt).toLocaleDateString()}</div>
          </div>
          <div style="display:flex;gap:5px;flex-direction:column">
            <!-- Toggle Creator -->
            <button style="font-size:10px;padding:5px" onclick="app.adminToggleRight('${u.email}', ${!u.canCreate})">
              ${u.canCreate ? "Retirer Création" : "Donner Création"}
            </button>

            <!-- Toggle Admin -->
            <button style="font-size:10px;padding:5px;border:1px solid red;color:red" onclick="app.adminToggleAdmin('${u.email}', ${!u.isAdmin})">
              ${u.isAdmin ? "Retirer Admin" : "Nommer Admin"}
            </button>

            <!-- Reset -->
            <button style="font-size:10px;padding:5px;background:#555" onclick="app.adminResetPwd('${u.email}')">Reset MDP</button>

            <!-- Delete -->
            <button style="font-size:10px;padding:5px;background:#800" onclick="app.adminDelete('${u.email}')">Supprimer</button>
          </div>
        </div>
      `;
      list.appendChild(div);
    });
  },

  adminToggleRight: function(targetEmail, newState) {
    this.loading(true);
    this.callApi('adminUpdateUser', {
      token: this.state.token,
      email: this.state.email,
      targetEmail: targetEmail,
      canCreate: newState
    }, (res) => {
      this.loading(false);
      this.loadAdminUsers();
    });
  },

  adminToggleAdmin: function(targetEmail, newState) {
    if (newState && !confirm("ATTENTION: Vous allez donner les PLEINS POUVOIRS à " + targetEmail)) return;
    this.loading(true);
    this.callApi('adminUpdateUser', {
      token: this.state.token,
      email: this.state.email,
      targetEmail: targetEmail,
      isAdmin: newState
    }, (res) => {
      this.loading(false);
      this.loadAdminUsers();
    });
  },

  adminDelete: function(targetEmail) {
    if(!confirm("Supprimer DÉFINITIVEMENT " + targetEmail + " ?")) return;
    this.loading(true);
    this.callApi('adminDeleteUser', {
      token: this.state.token,
      email: this.state.email,
      targetEmail: targetEmail
    }, (res) => {
      this.loading(false);
      this.loadAdminUsers();
    });
  },

  adminResetPwd: function(targetEmail) {
    if(!confirm("Reset code pour " + targetEmail + " ?\nIl devra le changer à la connexion.")) return;
    this.loading(true);
    this.callApi('adminResetPassword', {
      token: this.state.token,
      email: this.state.email,
      targetEmail: targetEmail
    }, (res) => {
      this.loading(false);
      alert("Nouveau Code Temporaire pour " + targetEmail + " : " + res.newCode);
    });
  }

};

window.onload = () => app.init();

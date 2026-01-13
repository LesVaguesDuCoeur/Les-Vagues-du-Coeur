import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

// Configuration
const ADMIN_EMAIL = 'chaouiengage@gmail.com';
const ADMIN_CODE = '2580'; // Code admin
const CONVERSATION_EXPIRY_HOURS = 24; // Expiration en heures

// Composant Modal stylise
function Modal({ isOpen, onClose, type = 'info', title, message, confirmText = 'OK', cancelText, onConfirm }) {
  if (!isOpen) return null;

  const icons = {
    error: '!',
    success: '✓',
    warning: '⚠',
    info: 'i'
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className={`modal-icon ${type}`}>
            {icons[type]}
          </div>
          <h3 className="modal-title">{title}</h3>
        </div>
        <div className="modal-body">
          {message}
        </div>
        <div className="modal-footer">
          {cancelText && (
            <button className="btn btn-secondary" onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Composant de chargement
function Loading({ text = 'Chargement...' }) {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p className="loading-text">{text}</p>
    </div>
  );
}

// Gestionnaire de stockage local
const Storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.error('Erreur de stockage');
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      console.error('Erreur de suppression');
    }
  }
};

// Fonction pour verifier si une conversation est expiree
function isConversationExpired(conversation) {
  if (!conversation.createdAt) return false;
  const created = new Date(conversation.createdAt);
  const now = new Date();
  const hoursDiff = (now - created) / (1000 * 60 * 60);
  return hoursDiff >= CONVERSATION_EXPIRY_HOURS;
}

// Fonction pour supprimer immediatement les conversations expirees
function cleanExpiredConversations() {
  const conversations = Storage.get('conversations') || [];
  const activeConversations = conversations.filter(conv => !isConversationExpired(conv));

  if (activeConversations.length !== conversations.length) {
    Storage.set('conversations', activeConversations);
    return conversations.length - activeConversations.length;
  }
  return 0;
}

// Page de connexion
function LoginPage({ onLogin, showModal }) {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'admin'
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    code: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const users = Storage.get('users') || [];
    const user = users.find(u => u.email.toLowerCase() === formData.email.toLowerCase());

    setTimeout(() => {
      setLoading(false);
      if (user) {
        onLogin(user);
      } else {
        showModal({
          type: 'error',
          title: 'Utilisateur introuvable',
          message: 'Aucun compte associe a cet email. Veuillez vous inscrire.'
        });
      }
    }, 800);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const users = Storage.get('users') || [];
    const emailLower = formData.email.toLowerCase();

    // Verifier si l'email existe deja
    const existingUser = users.find(u => u.email.toLowerCase() === emailLower);

    setTimeout(() => {
      setLoading(false);

      if (existingUser) {
        showModal({
          type: 'warning',
          title: 'Email deja utilise',
          message: 'Un compte existe deja avec cet email. Connectez-vous.'
        });
        return;
      }

      // Creer le nouvel utilisateur
      // chaouiengage@gmail.com peut s'inscrire comme utilisateur normal
      const newUser = {
        id: Date.now().toString(),
        email: formData.email,
        name: formData.name,
        isAdmin: false, // Meme l'admin email n'a pas acces admin en mode utilisateur
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      Storage.set('users', users);

      showModal({
        type: 'success',
        title: 'Inscription reussie',
        message: `Bienvenue ${formData.name} ! Vous pouvez maintenant vous connecter.`
      });

      setMode('login');
      setFormData({ ...formData, name: '' });
    }, 800);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      if (formData.code === ADMIN_CODE) {
        const adminUser = {
          id: 'admin',
          email: ADMIN_EMAIL,
          name: 'Administrateur',
          isAdmin: true
        };
        onLogin(adminUser);
      } else {
        showModal({
          type: 'error',
          title: 'Code incorrect',
          message: 'Le code administrateur est invalide. Veuillez reessayer.'
        });
      }
    }, 800);
  };

  if (loading) {
    return <Loading text="Verification en cours..." />;
  }

  return (
    <div className="card">
      <div className="nav-tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`nav-tab ${mode === 'login' ? 'active' : ''}`}
          onClick={() => setMode('login')}
        >
          Connexion
        </button>
        <button
          className={`nav-tab ${mode === 'register' ? 'active' : ''}`}
          onClick={() => setMode('register')}
        >
          Inscription
        </button>
        <button
          className={`nav-tab ${mode === 'admin' ? 'active' : ''}`}
          onClick={() => setMode('admin')}
        >
          Admin
        </button>
      </div>

      {mode === 'login' && (
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Adresse email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="votre@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Se connecter
          </button>
        </form>
      )}

      {mode === 'register' && (
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Nom complet</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="Jean Dupont"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Adresse email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="votre@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            S'inscrire
          </button>
          <p className="text-center text-muted mt-2" style={{ fontSize: '0.85rem' }}>
            En vous inscrivant, vous acceptez nos conditions d'utilisation.
          </p>
        </form>
      )}

      {mode === 'admin' && (
        <form onSubmit={handleAdminLogin}>
          <div className="form-group">
            <label>Code administrateur</label>
            <input
              type="password"
              name="code"
              className="form-input"
              placeholder="Entrez le code"
              value={formData.code}
              onChange={handleChange}
              required
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Acceder
          </button>
        </form>
      )}
    </div>
  );
}

// Page utilisateur - Envoyer une demande
function UserPage({ user, onLogout, showModal }) {
  const [formData, setFormData] = useState({
    type: '',
    message: ''
  });
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('new'); // 'new', 'history'

  // Charger et nettoyer les conversations au montage
  useEffect(() => {
    // Suppression immediate des conversations expirees
    const deletedCount = cleanExpiredConversations();
    if (deletedCount > 0) {
      showModal({
        type: 'info',
        title: 'Nettoyage automatique',
        message: `${deletedCount} conversation(s) expiree(s) ont ete supprimee(s).`
      });
    }

    // Charger les conversations de l'utilisateur
    const allConversations = Storage.get('conversations') || [];
    const userConversations = allConversations.filter(
      c => c.userEmail.toLowerCase() === user.email.toLowerCase()
    );
    setConversations(userConversations);
  }, [user.email, showModal]);

  // Verifier les expirations toutes les minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const deletedCount = cleanExpiredConversations();
      if (deletedCount > 0) {
        const allConversations = Storage.get('conversations') || [];
        const userConversations = allConversations.filter(
          c => c.userEmail.toLowerCase() === user.email.toLowerCase()
        );
        setConversations(userConversations);
      }
    }, 60000); // Toutes les minutes

    return () => clearInterval(interval);
  }, [user.email]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const newConversation = {
        id: Date.now().toString(),
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        type: formData.type,
        messages: [{
          id: '1',
          content: formData.message,
          sender: 'user',
          timestamp: new Date().toISOString()
        }],
        createdAt: new Date().toISOString(),
        status: 'open'
      };

      const allConversations = Storage.get('conversations') || [];
      allConversations.push(newConversation);
      Storage.set('conversations', allConversations);

      setConversations([...conversations, newConversation]);
      setFormData({ type: '', message: '' });
      setLoading(false);

      showModal({
        type: 'success',
        title: 'Demande envoyee',
        message: 'Votre message a ete transmis. Nous vous repondrons dans les plus brefs delais.'
      });

      setView('history');
    }, 1000);
  };

  const typeLabels = {
    emploi: 'Recherche d\'emploi',
    cv: 'Aide pour CV',
    motivation: 'Lettre de motivation',
    admin: 'Demarches administratives',
    autre: 'Autre'
  };

  if (loading) {
    return <Loading text="Envoi en cours..." />;
  }

  return (
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <div className="user-info">
        <div className="user-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="user-details">
          <div className="user-name">{user.name}</div>
          <div className="user-role">{user.email}</div>
        </div>
        <button className="btn btn-secondary btn-small" onClick={onLogout}>
          Deconnexion
        </button>
      </div>

      <div className="nav-tabs">
        <button
          className={`nav-tab ${view === 'new' ? 'active' : ''}`}
          onClick={() => setView('new')}
        >
          Nouvelle demande
        </button>
        <button
          className={`nav-tab ${view === 'history' ? 'active' : ''}`}
          onClick={() => setView('history')}
        >
          Mes demandes ({conversations.length})
        </button>
      </div>

      {view === 'new' && (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Type de demande</label>
              <select
                name="type"
                className="form-input"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="">-- Selectionnez --</option>
                <option value="emploi">Recherche d'emploi</option>
                <option value="cv">Aide pour CV</option>
                <option value="motivation">Lettre de motivation</option>
                <option value="admin">Demarches administratives</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="form-group">
              <label>Votre message</label>
              <textarea
                name="message"
                className="form-input"
                placeholder="Decrivez votre demande en detail..."
                value={formData.message}
                onChange={handleChange}
                required
                rows="5"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Envoyer ma demande
            </button>
          </form>
        </div>
      )}

      {view === 'history' && (
        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p>Vous n'avez pas encore de demande.</p>
              <button
                className="btn btn-primary mt-2"
                style={{ width: 'auto' }}
                onClick={() => setView('new')}
              >
                Faire une demande
              </button>
            </div>
          ) : (
            conversations.map(conv => (
              <div key={conv.id} className="conversation-item">
                <div className="conversation-header">
                  <div>
                    <div className="conversation-user">{typeLabels[conv.type] || conv.type}</div>
                    <span className="conversation-badge badge-active">
                      {conv.messages.length} message(s)
                    </span>
                  </div>
                  <div className="conversation-time">
                    {new Date(conv.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="conversation-preview">
                  {conv.messages[0]?.content}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Page Admin
function AdminPage({ user, onLogout, showModal }) {
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [view, setView] = useState('conversations'); // 'conversations', 'users', 'stats'

  // Charger et nettoyer les donnees
  const loadData = useCallback(() => {
    // Suppression immediate des conversations expirees
    cleanExpiredConversations();

    setConversations(Storage.get('conversations') || []);
    setUsers(Storage.get('users') || []);
  }, []);

  useEffect(() => {
    loadData();

    // Verifier les expirations toutes les 30 secondes pour l'admin
    const interval = setInterval(() => {
      const deletedCount = cleanExpiredConversations();
      if (deletedCount > 0) {
        loadData();
        showModal({
          type: 'info',
          title: 'Nettoyage automatique',
          message: `${deletedCount} conversation(s) expiree(s) ont ete supprimee(s) automatiquement.`
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loadData, showModal]);

  const handleReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv) return;

    const updatedConversations = conversations.map(conv => {
      if (conv.id === selectedConv.id) {
        return {
          ...conv,
          messages: [
            ...conv.messages,
            {
              id: Date.now().toString(),
              content: replyText,
              sender: 'admin',
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      return conv;
    });

    Storage.set('conversations', updatedConversations);
    setConversations(updatedConversations);
    setSelectedConv(updatedConversations.find(c => c.id === selectedConv.id));
    setReplyText('');

    showModal({
      type: 'success',
      title: 'Reponse envoyee',
      message: 'Votre reponse a ete envoyee a l\'utilisateur.'
    });
  };

  const handleDeleteConversation = (convId) => {
    showModal({
      type: 'warning',
      title: 'Confirmer la suppression',
      message: 'Voulez-vous vraiment supprimer cette conversation ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      onConfirm: () => {
        const updatedConversations = conversations.filter(c => c.id !== convId);
        Storage.set('conversations', updatedConversations);
        setConversations(updatedConversations);
        setSelectedConv(null);
      }
    });
  };

  const handleDeleteUser = (userId) => {
    showModal({
      type: 'warning',
      title: 'Confirmer la suppression',
      message: 'Voulez-vous vraiment supprimer cet utilisateur et toutes ses conversations ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      onConfirm: () => {
        const userToDelete = users.find(u => u.id === userId);
        if (userToDelete) {
          // Supprimer l'utilisateur
          const updatedUsers = users.filter(u => u.id !== userId);
          Storage.set('users', updatedUsers);
          setUsers(updatedUsers);

          // Supprimer ses conversations
          const updatedConversations = conversations.filter(
            c => c.userEmail.toLowerCase() !== userToDelete.email.toLowerCase()
          );
          Storage.set('conversations', updatedConversations);
          setConversations(updatedConversations);
        }
      }
    });
  };

  const typeLabels = {
    emploi: 'Recherche d\'emploi',
    cv: 'Aide pour CV',
    motivation: 'Lettre de motivation',
    admin: 'Demarches administratives',
    autre: 'Autre'
  };

  const getTimeRemaining = (conv) => {
    const created = new Date(conv.createdAt);
    const expiry = new Date(created.getTime() + CONVERSATION_EXPIRY_HOURS * 60 * 60 * 1000);
    const now = new Date();
    const remaining = expiry - now;

    if (remaining <= 0) return 'Expiree';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };

  return (
    <div className="admin-panel">
      <div className="user-info">
        <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
          A
        </div>
        <div className="user-details">
          <div className="user-name">Administrateur</div>
          <div className="user-role">{ADMIN_EMAIL}</div>
        </div>
        <button className="btn btn-secondary btn-small" onClick={onLogout}>
          Deconnexion
        </button>
      </div>

      <div className="nav-tabs">
        <button
          className={`nav-tab ${view === 'stats' ? 'active' : ''}`}
          onClick={() => { setView('stats'); setSelectedConv(null); }}
        >
          Statistiques
        </button>
        <button
          className={`nav-tab ${view === 'conversations' ? 'active' : ''}`}
          onClick={() => { setView('conversations'); setSelectedConv(null); }}
        >
          Conversations ({conversations.length})
        </button>
        <button
          className={`nav-tab ${view === 'users' ? 'active' : ''}`}
          onClick={() => { setView('users'); setSelectedConv(null); }}
        >
          Utilisateurs ({users.length})
        </button>
      </div>

      {view === 'stats' && (
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Utilisateurs inscrits</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{conversations.length}</div>
            <div className="stat-label">Conversations actives</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {conversations.reduce((acc, c) => acc + c.messages.length, 0)}
            </div>
            <div className="stat-label">Messages totaux</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{CONVERSATION_EXPIRY_HOURS}h</div>
            <div className="stat-label">Delai d'expiration</div>
          </div>
        </div>
      )}

      {view === 'conversations' && !selectedConv && (
        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p>Aucune conversation pour le moment.</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className="conversation-item"
                onClick={() => setSelectedConv(conv)}
              >
                <div className="conversation-header">
                  <div>
                    <div className="conversation-user">{conv.userName}</div>
                    <div className="conversation-email">{conv.userEmail}</div>
                  </div>
                  <div className="conversation-time">
                    <div>{typeLabels[conv.type] || conv.type}</div>
                    <div style={{ marginTop: '0.25rem', color: 'var(--warning-color)' }}>
                      Expire dans: {getTimeRemaining(conv)}
                    </div>
                  </div>
                </div>
                <div className="conversation-preview">
                  {conv.messages[conv.messages.length - 1]?.content}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {view === 'conversations' && selectedConv && (
        <div className="messages-container">
          <div className="messages-header">
            <div>
              <h3>{selectedConv.userName}</h3>
              <p className="text-muted">{selectedConv.userEmail} - {typeLabels[selectedConv.type]}</p>
              <p className="text-muted" style={{ color: 'var(--warning-color)', fontSize: '0.85rem' }}>
                Expire dans: {getTimeRemaining(selectedConv)}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                className="btn btn-secondary btn-small"
                onClick={() => setSelectedConv(null)}
              >
                Retour
              </button>
              <button
                className="btn btn-danger btn-small"
                onClick={() => handleDeleteConversation(selectedConv.id)}
              >
                Supprimer
              </button>
            </div>
          </div>

          <div className="messages-list">
            {selectedConv.messages.map(msg => (
              <div
                key={msg.id}
                className={`message ${msg.sender === 'admin' ? 'message-sent' : 'message-received'}`}
              >
                <div className="message-content">{msg.content}</div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleString('fr-FR')}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleReply}>
            <div className="form-group">
              <textarea
                className="form-input"
                placeholder="Votre reponse..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows="3"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Envoyer la reponse
            </button>
          </form>
        </div>
      )}

      {view === 'users' && (
        <div className="conversations-list">
          {users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <p>Aucun utilisateur inscrit.</p>
            </div>
          ) : (
            users.map(u => (
              <div key={u.id} className="conversation-item">
                <div className="conversation-header">
                  <div>
                    <div className="conversation-user">{u.name}</div>
                    <div className="conversation-email">{u.email}</div>
                  </div>
                  <div>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUser(u.id);
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                <div className="conversation-preview">
                  Inscrit le {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Application principale
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false });

  // Verifier la session au demarrage
  useEffect(() => {
    const savedUser = Storage.get('currentUser');
    if (savedUser) {
      setUser(savedUser);
    }

    // Nettoyer les conversations expirees au demarrage
    cleanExpiredConversations();

    setLoading(false);
  }, []);

  const showModal = useCallback((config) => {
    setModal({ isOpen: true, ...config });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ isOpen: false });
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    Storage.set('currentUser', userData);
  };

  const handleLogout = () => {
    setUser(null);
    Storage.remove('currentUser');
  };

  if (loading) {
    return (
      <main className="App">
        <Loading />
      </main>
    );
  }

  return (
    <main className="App">
      <header className="header">
        <h1>Les Vagues du Coeur</h1>
        <p>Accompagnement social et professionnel</p>
      </header>

      {!user ? (
        <LoginPage onLogin={handleLogin} showModal={showModal} />
      ) : user.isAdmin ? (
        <AdminPage user={user} onLogout={handleLogout} showModal={showModal} />
      ) : (
        <UserPage user={user} onLogout={handleLogout} showModal={showModal} />
      )}

      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        onConfirm={modal.onConfirm}
      />
    </main>
  );
}

export default App;

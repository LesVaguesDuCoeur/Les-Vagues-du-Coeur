// SECTION: App Utilities
const app = {
  generateId: () => 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36),
  showToast: (message, type = 'info', duration = 3000) => {
    let container = document.querySelector('.toast-container');
    if (!container) { container = document.createElement('div'); container.className = 'toast-container'; container.setAttribute('role', 'alert'); container.setAttribute('aria-live', 'polite'); document.body.appendChild(container); }
    const toast = document.createElement('div'); toast.className = `toast toast-${type}`;
    let iconClass = 'fa-info-circle'; if (type === 'success') iconClass = 'fa-check-circle'; if (type === 'error') iconClass = 'fa-exclamation-circle'; if (type === 'warning') iconClass = 'fa-exclamation-triangle';
    toast.innerHTML = `<i class="fas ${iconClass}"></i><span>${app.sanitizeHTML(message)}</span>`; container.appendChild(toast);
    setTimeout(() => { toast.classList.add('hiding'); toast.addEventListener('animationend', () => { toast.remove(); if (container.children.length === 0) container.remove(); }); }, duration);
  },
  confirmDialog: (title, message, onConfirm, onCancel = null) => {
    const backdrop = document.createElement('div'); backdrop.className = 'modal-backdrop active';
    const modal = document.createElement('div'); modal.className = 'modal';
    modal.innerHTML = `<div class="modal-header"><h3 class="modal-title">${app.sanitizeHTML(title)}</h3></div><div class="modal-body"><p>${app.sanitizeHTML(message)}</p></div><div class="modal-actions"><button class="btn btn-secondary" id="btn-cancel">Annuler</button><button class="btn btn-destructive" id="btn-confirm">Confirmer</button></div>`;
    backdrop.appendChild(modal); document.body.appendChild(backdrop);
    const close = () => { backdrop.classList.remove('active'); setTimeout(() => backdrop.remove(), 300); };
    backdrop.querySelector('#btn-cancel').addEventListener('click', () => { close(); if (onCancel) onCancel(); });
    backdrop.querySelector('#btn-confirm').addEventListener('click', () => { close(); if (onConfirm) onConfirm(); });
  },
  sanitizeHTML: (str) => { const div = document.createElement('div'); div.textContent = str; return div.innerHTML; },
  formatDate: (ts) => { if (!ts) return ''; const d = new Date(ts); return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); },
  formatTime: (seconds) => { const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60); return `${m}:${s.toString().padStart(2, '0')}`; },
  debounce: (fn, delay) => { let timeoutId; return (...args) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => fn(...args), delay); }; },
  throttle: (fn, delay) => { let lastCall = 0; return (...args) => { const now = Date.now(); if (now - lastCall >= delay) { lastCall = now; fn(...args); } }; },
  playSound: (type) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext; if (!AudioContext) return; const ctx = new AudioContext(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination);
      if (type === 'success') { osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1); gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); osc.start(); osc.stop(ctx.currentTime + 0.3); }
      else if (type === 'error') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2); gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); osc.start(); osc.stop(ctx.currentTime + 0.3); }
      else if (type === 'levelup') { osc.type = 'square'; osc.frequency.setValueAtTime(440, ctx.currentTime); osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1); osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3); gain.gain.setValueAtTime(0.2, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6); osc.start(); osc.stop(ctx.currentTime + 0.6); }
    } catch (e) { }
  },
  triggerConfetti: () => { if (window.confetti) { window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#4f8ef7', '#22d3a0', '#fbbf24', '#7c3aed'] }); } },
  getLevel: (xp) => { const levels = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2', 'C1.1', 'C1.2', 'C2.1', 'C2.2']; const index = Math.min(Math.floor(xp / 500), levels.length - 1); return levels[index]; },
  getLevelDetails: (levelId) => {
    const mapping = { 'A1.1': { name: 'Débutant', color: 'var(--level-a1)' }, 'A1.2': { name: 'Débutant+', color: 'var(--level-a1)' }, 'A2.1': { name: 'Élémentaire', color: 'var(--level-a2)' }, 'A2.2': { name: 'Élémentaire+', color: 'var(--level-a2)' }, 'B1.1': { name: 'Intermédiaire', color: 'var(--level-b1)' }, 'B1.2': { name: 'Intermédiaire+', color: 'var(--level-b1)' }, 'B2.1': { name: 'Avancé', color: 'var(--level-b2)' }, 'B2.2': { name: 'Avancé+', color: 'var(--level-b2)' }, 'C1.1': { name: 'Autonome', color: 'var(--level-c1)' }, 'C1.2': { name: 'Autonome+', color: 'var(--level-c1)' }, 'C2.1': { name: 'Bilingue', color: 'var(--level-c2)' }, 'C2.2': { name: 'Bilingue+', color: 'var(--level-c2)' } };
    return mapping[levelId] || mapping['A1.1'];
  },
  initBottomNav: () => {
    const nav = document.querySelector('.bottom-bar');
    if (nav) { const currentPath = window.location.pathname.split('/').pop(); nav.querySelectorAll('.tab-item').forEach(item => { if (item.getAttribute('href') === currentPath) { item.classList.add('active'); } }); }
  }
};
document.addEventListener('DOMContentLoaded', () => { app.initBottomNav(); });
window.app = app;

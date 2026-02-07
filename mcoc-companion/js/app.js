// Main Application Logic

const App = {
    state: {
        currentView: 'dashboard',
        isMobile: window.innerWidth <= 768
    },

    init: function() {
        console.log('MCOC Companion Initializing...');

        // Setup Navigation
        this.setupNavigation();

        // Setup Mobile Menu
        this.setupMobileMenu();

        // Initialize Modules if they exist
        if (window.Roster) window.Roster.init();
        if (window.Resources) window.Resources.init();
        if (window.Teams) window.Teams.init();
        if (window.Quests) window.Quests.init();
        if (window.Mastery) window.Mastery.init();

        // Initial Render
        this.renderDashboard();

        // Global Event Listeners
        window.addEventListener('resize', () => {
            this.state.isMobile = window.innerWidth <= 768;
        });
    },

    setupNavigation: function() {
        const navItems = document.querySelectorAll('.nav-item[data-target]');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const targetId = item.getAttribute('data-target');
                this.navigateTo(targetId);
            });
        });
    },

    navigateTo: function(viewId) {
        // Update State
        this.state.currentView = viewId;

        // Update UI (Sidebar/BottomNav)
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll(`.nav-item[data-target="${viewId}"]`).forEach(el => el.classList.add('active'));

        // Update Views
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active-view'));
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active-view');
        }

        // Refresh Data if needed
        if (viewId === 'dashboard') this.renderDashboard();
        if (viewId === 'roster' && window.Roster) window.Roster.render();
        if (viewId === 'resources' && window.Resources) window.Resources.render();
    },

    setupMobileMenu: function() {
        const moreBtn = document.getElementById('mobile-menu-more');
        if (moreBtn) {
            moreBtn.addEventListener('click', () => {
                // Ideally toggle a full menu overlay
                this.showToast('Menu complet disponible sur Desktop pour le moment', 'info');
            });
        }
    },

    renderDashboard: function() {
        // Mock data or real data if modules loaded
        const totalChamps = window.Roster ? window.Roster.data.length : 0;
        const topPi = window.Roster ? window.Roster.getTopPrestige() : 0;

        document.getElementById('dash-total-champs').textContent = totalChamps;
        document.getElementById('dash-top-pi').textContent = topPi.toLocaleString();

        // Add more dashboard logic here
    },

    showToast: function(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        // Add minimal toast styles dynamically if not in CSS
        toast.style.padding = '15px 20px';
        toast.style.marginBottom = '10px';
        toast.style.borderRadius = '4px';
        toast.style.color = '#fff';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';

        if (type === 'success') toast.style.backgroundColor = '#2ecc71';
        else if (type === 'error') toast.style.backgroundColor = '#e74c3c';
        else toast.style.backgroundColor = '#3498db';

        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });

        // Remove after 3s
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Start App when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Attach to window for global access
    window.app = Object.assign(window.app || {}, App);
    window.app.init();
});

// Roster Management Module

const Roster = {
    data: [], // Array of user's champions

    init: function() {
        console.log('Roster Module Initialized');
        this.load();
        this.setupListeners();
        this.render();
    },

    load: function() {
        const stored = localStorage.getItem('mcoc_roster');
        if (stored) {
            try {
                this.data = JSON.parse(stored);
            } catch (e) {
                console.error('Failed to load roster', e);
                this.data = [];
            }
        }
    },

    save: function() {
        localStorage.setItem('mcoc_roster', JSON.stringify(this.data));
        window.app.renderDashboard(); // Update dashboard stats
    },

    setupListeners: function() {
        // Add Champion Button
        const addBtn = document.getElementById('add-champ-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openAddModal());
        }

        // Search Filter
        const searchInput = document.getElementById('roster-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterRoster(e.target.value));
        }
    },

    render: function(filter = '') {
        const container = document.getElementById('roster-list');
        if (!container) return;

        container.innerHTML = '';

        const filtered = this.data.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));

        if (filtered.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 20px;">Aucun champion trouvé. Ajoutez-en un !</p>';
            return;
        }

        filtered.forEach(champ => {
            const card = this.createCard(champ);
            container.appendChild(card);
        });
    },

    createCard: function(champ) {
        const div = document.createElement('div');
        div.className = `champion-card`;
        div.setAttribute('data-class', champ.class);
        div.setAttribute('data-id', champ.id);

        // Calculate dynamic PI if needed
        const pi = this.calculatePI(champ);

        div.innerHTML = `
            <div class="champion-img-placeholder" style="border-bottom: 2px solid var(--class-${champ.class})">
                ${this.getInitials(champ.name)}
            </div>
            <div class="champion-info">
                <span class="champion-name">${champ.name}</span>
                <div class="champion-stars">${'★'.repeat(champ.stars)}</div>
                <div style="display:flex; justify-content:space-between; margin-top:5px; font-size: 0.9rem;">
                    <span>R${champ.rank}</span>
                    <span>Sig: ${champ.sig}</span>
                </div>
                <div style="margin-top: 5px; font-weight: bold; color: var(--color-accent)">PI: ${pi}</div>
            </div>
        `;

        // Add click listener for editing
        div.addEventListener('click', () => this.openEditModal(champ));

        return div;
    },

    getInitials: function(name) {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    },

    calculatePI: function(champ) {
        // Simple mock formula
        let base = 1000;
        if (champ.stars === 6) base = 3000;
        if (champ.stars === 5) base = 2000;
        if (champ.stars === 4) base = 1000;

        return Math.floor(base * (1 + (champ.rank * 0.5)) + (champ.sig * 10));
    },

    getTopPrestige: function() {
        if (this.data.length === 0) return 0;
        // Sort by PI descending
        const sorted = [...this.data].sort((a, b) => this.calculatePI(b) - this.calculatePI(a));
        // Return average of top 5 or just top 1 for dashboard summary
        return this.calculatePI(sorted[0]);
    },

    openAddModal: function() {
        const modal = document.getElementById('champion-modal');
        const body = document.getElementById('modal-body');

        // Populate select with all DB champions
        const options = window.CHAMPIONS_DB.map(c => `<option value="${c.id}">${c.name} (${c.class})</option>`).join('');

        body.innerHTML = `
            <h2>Ajouter un Champion</h2>
            <form id="add-champ-form">
                <div class="form-group">
                    <label>Champion</label>
                    <select id="select-champ-id" required style="width: 100%; margin-bottom: 10px;">
                        ${options}
                    </select>
                </div>
                <div class="form-group" style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label>Étoiles</label>
                        <select id="select-stars">
                            <option value="6" selected>6 ★</option>
                            <option value="5">5 ★</option>
                            <option value="4">4 ★</option>
                        </select>
                    </div>
                    <div>
                        <label>Rang</label>
                        <select id="select-rank">
                            <option value="1">Rank 1</option>
                            <option value="2">Rank 2</option>
                            <option value="3" selected>Rank 3</option>
                            <option value="4">Rank 4</option>
                            <option value="5">Rank 5</option>
                        </select>
                    </div>
                </div>
                <div class="form-group" style="margin-top: 10px;">
                    <label>Niveau Éveil (Sig)</label>
                    <input type="number" id="input-sig" value="20" min="0" max="200" style="width: 100%;">
                </div>
                <div style="margin-top: 20px; text-align: right;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('champion-modal').style.display='none'">Annuler</button>
                    <button type="submit" class="btn btn-primary">Ajouter</button>
                </div>
            </form>
        `;

        modal.style.display = 'flex';

        // Handle Form Submit
        document.getElementById('add-champ-form').onsubmit = (e) => {
            e.preventDefault();
            const champId = document.getElementById('select-champ-id').value;
            const dbChamp = window.CHAMPIONS_DB.find(c => c.id === champId);

            const newChamp = {
                id: champId,
                name: dbChamp.name,
                class: dbChamp.class,
                stars: parseInt(document.getElementById('select-stars').value),
                rank: parseInt(document.getElementById('select-rank').value),
                sig: parseInt(document.getElementById('input-sig').value),
                added: new Date().toISOString()
            };

            this.data.push(newChamp);
            this.save();
            this.render();
            modal.style.display = 'none';
            window.app.showToast(`${newChamp.name} ajouté !`, 'success');
        };

        // Close modal listeners
        document.querySelector('.close-modal').onclick = () => modal.style.display = 'none';
        window.onclick = (event) => {
            if (event.target == modal) modal.style.display = 'none';
        };
    },

    openEditModal: function(champ) {
         // Logic to edit/delete existing champion
         // Simplified for this step: just a delete confirmation or basic update
         if(confirm(`Supprimer ${champ.name} du roster ?`)) {
             this.data = this.data.filter(c => c !== champ);
             this.save();
             this.render();
             window.app.showToast('Champion supprimé', 'error');
         }
    }
};

// Make global
window.Roster = Roster;

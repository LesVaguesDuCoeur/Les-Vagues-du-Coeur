// Quest Helper Module

const Quests = {
    currentQuest: {
        act: 6,
        chapter: 1,
        quest: 1,
        path: 1
    },

    // Mock Database of Nodes
    NODES_DB: {
        '6.1.1': [
            { path: 1, name: "Biohazard", tags: ["#bleed_immune", "#poison_immune"], desc: "Prendre un coup = 50% chance saignement. Bloquer = 50% chance poison." },
            { path: 2, name: "Mesmerize", tags: ["#stun_immune", "#true_strike"], desc: "7% chance d'étourdir l'attaquant quand touché." },
            { path: 3, name: "Power Shield", tags: ["#dot", "#special_damage"], desc: "Les attaques de base ne font aucun dégât. Les SP font +400% dégâts." }
        ],
        '6.1.2': [
            { path: 1, name: "Icarus", tags: ["#fire_immune", "#purify"], desc: "Gagne des furies mais dégénère si trop de furies." }
        ]
        // ... extendable
    },

    init: function() {
        console.log('Quests Module Initialized');
        this.render();

        const actSelect = document.getElementById('quest-act');
        if (actSelect) {
            actSelect.addEventListener('change', (e) => {
                // Update currentQuest mock logic
                this.render();
            });
        }
    },

    render: function() {
        const container = document.getElementById('quest-suggestions');
        if (!container) return;

        container.innerHTML = '';

        // Mock getting nodes for current selection
        const key = `6.1.${Math.floor(Math.random() * 2) + 1}`; // Randomly pick 6.1.1 or 6.1.2 for demo
        const paths = this.NODES_DB[key] || this.NODES_DB['6.1.1'];

        const h3 = document.createElement('h3');
        h3.textContent = `Chemins disponibles (Acte ${this.currentQuest.act})`;
        container.appendChild(h3);

        paths.forEach(node => {
            const div = document.createElement('div');
            div.className = 'card';
            div.style.marginBottom = '10px';
            div.style.borderLeft = '4px solid var(--color-primary)';

            // Find counters in Roster
            const suggestions = this.findCounters(node.tags);
            const suggestionHtml = suggestions.length > 0
                ? suggestions.map(c => `<span class="tag-pill">${c.name}</span>`).join(' ')
                : '<span style="color:#aaa">Aucun champion idéal trouvé</span>';

            div.innerHTML = `
                <h4>Chemin ${node.path}: ${node.name}</h4>
                <p style="font-size:0.9rem; margin-bottom:10px;">${node.desc}</p>
                <div style="font-size:0.85rem; color:#aaa; margin-bottom:5px;">Tags recommandés: ${node.tags.join(', ')}</div>
                <div style="margin-top:10px; padding-top:10px; border-top:1px solid #333;">
                    <strong>Vos meilleurs contres :</strong><br>
                    <div style="margin-top:5px; display:flex; flex-wrap:wrap; gap:5px;">
                        ${suggestionHtml}
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    },

    findCounters: function(requiredTags) {
        if (!window.Roster) return [];

        // Filter roster for champs that have at least one of the required tags (mapped to DB tags)
        // Note: Real logic would need mapping between Node tags and Champion tags
        // For now, simple tag matching if names align, or specific hardcoded logic

        return window.Roster.data.filter(userChamp => {
            const dbChamp = window.CHAMPIONS_DB.find(c => c.id === userChamp.id);
            if (!dbChamp) return false;

            // Check if dbChamp has any tag that matches requiredTags
            // Example: Node needs #bleed_immune. Champ has #bleed_immune.
            // Simplified check:
            return requiredTags.some(reqTag => dbChamp.tags.includes(reqTag));
        }).slice(0, 5); // Return top 5
    }
};

// Add CSS for pills
const style = document.createElement('style');
style.innerHTML += `
.tag-pill {
    background: var(--color-primary);
    color: white;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.8rem;
}
`;
document.head.appendChild(style);

window.Quests = Quests;

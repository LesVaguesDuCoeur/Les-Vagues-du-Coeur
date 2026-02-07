// Mastery System Module

const Mastery = {
    points: {
        offense: 0,
        defense: 0,
        utility: 0
    },

    // Simplified Mastery Tree Data
    TREES: {
        offense: [
            { id: 'precision', name: 'Precision', max: 5, req: 0 },
            { id: 'cruelty', name: 'Cruelty', max: 5, req: 0 },
            { id: 'glass_cannon', name: 'Glass Cannon', max: 3, req: 0 },
            { id: 'recoil', name: 'Recoil', max: 3, req: 0 },
            { id: 'liquid_courage', name: 'Liquid Courage', max: 3, req: 0 },
            { id: 'double_edge', name: 'Double Edge', max: 3, req: 0 },
            { id: 'deep_wounds', name: 'Deep Wounds', max: 5, req: 0 },
            { id: 'assassin', name: 'Assassin', max: 5, req: 0 }
        ],
        defense: [
            { id: 'vitality', name: 'Vitality', max: 9, req: 0 },
            { id: 'block_prof', name: 'Block Proficiency', max: 4, req: 0 },
            { id: 'recovery', name: 'Recovery', max: 3, req: 0 },
            { id: 'willpower', name: 'Willpower', max: 3, req: 0 },
            { id: 'coagulate', name: 'Coagulate', max: 3, req: 0 }
        ],
        utility: [
            { id: 'limber', name: 'Limber', max: 5, req: 0 },
            { id: 'parry', name: 'Parry', max: 3, req: 0, recommended: true },
            { id: 'dexterity', name: 'Dexterity', max: 3, req: 0, recommended: true },
            { id: 'stupefy', name: 'Stupefy', max: 3, req: 0 },
            { id: 'petrify', name: 'Petrify', max: 3, req: 0 },
            { id: 'mystic_disp', name: 'Mystic Dispersion', max: 5, req: 0 }
        ]
    },

    userBuild: {}, // { 'parry': 3, 'dexterity': 1 }

    init: function() {
        console.log('Mastery Module Initialized');
        this.load();
        this.render();
    },

    load: function() {
        const stored = localStorage.getItem('mcoc_mastery');
        if (stored) {
            try {
                this.userBuild = JSON.parse(stored);
            } catch (e) {
                this.userBuild = {};
            }
        }
    },

    save: function() {
        localStorage.setItem('mcoc_mastery', JSON.stringify(this.userBuild));
        this.render(); // Update UI
    },

    render: function() {
        this.renderTree('offense', 'offense-tree');
        this.renderTree('defense', 'defense-tree');
        this.renderTree('utility', 'utility-tree');
    },

    renderTree: function(type, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `<h3>${type.charAt(0).toUpperCase() + type.slice(1)}</h3>`;

        const treeData = this.TREES[type];

        treeData.forEach(mastery => {
            const currentLevel = this.userBuild[mastery.id] || 0;
            const isRec = mastery.recommended ? '<i class="fa-solid fa-star" style="color:gold; font-size:0.8rem;"></i>' : '';

            const div = document.createElement('div');
            div.className = 'mastery-node';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="${mastery.recommended ? 'color:var(--color-accent); font-weight:bold;' : ''}">${mastery.name} ${isRec}</span>
                    <span style="font-size:0.9rem; color:#aaa;">${currentLevel}/${mastery.max}</span>
                </div>
                <div class="progress-bar-bg" style="background:#333; height:5px; width:100%; margin:5px 0; border-radius:2px;">
                    <div class="progress-bar-fill" style="background:${currentLevel > 0 ? 'var(--color-primary)' : 'transparent'}; height:100%; width:${(currentLevel/mastery.max)*100}%;"></div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:5px;">
                    <button class="btn-mini" onclick="window.Mastery.setLevel('${mastery.id}', -1)">-</button>
                    <button class="btn-mini" onclick="window.Mastery.setLevel('${mastery.id}', 1)">+</button>
                </div>
            `;
            // Minimal styling for node
            div.style.background = '#1a1a24';
            div.style.padding = '10px';
            div.style.marginBottom = '10px';
            div.style.borderRadius = '4px';
            div.style.border = mastery.recommended ? '1px solid var(--color-accent)' : '1px solid #333';

            container.appendChild(div);
        });
    },

    setLevel: function(id, delta) {
        const current = this.userBuild[id] || 0;

        // Find max
        let max = 3;
        Object.values(this.TREES).forEach(tree => {
            const found = tree.find(m => m.id === id);
            if (found) max = found.max;
        });

        const newVal = Math.max(0, Math.min(max, current + delta));

        if (newVal === 0) delete this.userBuild[id];
        else this.userBuild[id] = newVal;

        this.save();
    }
};

window.Mastery = Mastery;

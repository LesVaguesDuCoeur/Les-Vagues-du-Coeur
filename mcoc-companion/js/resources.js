// Resources Management Module

const Resources = {
    inventory: {
        currencies: { gold: 0, units: 0, glory: 0 },
        catalysts: {
            t5_basic: 0,
            t6_basic: 0,
            t2_alpha: 0,
            t3_alpha: 0,
            t5_class: { science: 0, skill: 0, mutant: 0, cosmic: 0, tech: 0, mystic: 0 },
            t6_class: { science: 0, skill: 0, mutant: 0, cosmic: 0, tech: 0, mystic: 0 }
        },
        iso: {
            generic_t5: 0,
            class_t5: 0
        }
    },

    init: function() {
        console.log('Resources Module Initialized');
        this.load();
        this.render();
    },

    load: function() {
        const stored = localStorage.getItem('mcoc_resources');
        if (stored) {
            try {
                // Merge stored data with default structure to avoid missing keys on update
                const loaded = JSON.parse(stored);
                this.inventory = { ...this.inventory, ...loaded };
            } catch (e) {
                console.error('Failed to load resources', e);
            }
        }
    },

    save: function() {
        localStorage.setItem('mcoc_resources', JSON.stringify(this.inventory));
        window.app.showToast('Inventaire sauvegardé', 'success');
    },

    render: function() {
        const container = document.getElementById('resources-container');
        if (!container) return;

        container.innerHTML = '';

        // Render Currencies
        this.renderSection(container, 'Monnaies', [
            { key: 'currencies.gold', label: 'Or', val: this.inventory.currencies.gold, color: '#f1c40f' },
            { key: 'currencies.units', label: 'Unités', val: this.inventory.currencies.units, color: '#00d4ff' },
            { key: 'currencies.glory', label: 'Gloire', val: this.inventory.currencies.glory, color: '#e74c3c' }
        ]);

        // Render Catalysts Basic
        this.renderSection(container, 'Catalyseurs Basiques', [
             { key: 'catalysts.t5_basic', label: 'T5 Basic', val: this.inventory.catalysts.t5_basic },
             { key: 'catalysts.t6_basic', label: 'T6 Basic', val: this.inventory.catalysts.t6_basic },
             { key: 'catalysts.t2_alpha', label: 'T2 Alpha', val: this.inventory.catalysts.t2_alpha },
             { key: 'catalysts.t3_alpha', label: 'T3 Alpha', val: this.inventory.catalysts.t3_alpha },
        ]);

        // Render Class Catalysts (Simplified for display)
        // I'll just show T5 Class for now as example
        const t5ClassItems = Object.keys(this.inventory.catalysts.t5_class).map(cls => ({
            key: `catalysts.t5_class.${cls}`,
            label: `T5 ${cls.charAt(0).toUpperCase() + cls.slice(1)}`,
            val: this.inventory.catalysts.t5_class[cls],
            classColor: `var(--class-${cls})`
        }));
        this.renderSection(container, 'T5 Catalyseurs de Classe', t5ClassItems);
    },

    renderSection: function(container, title, items) {
        const section = document.createElement('div');
        section.className = 'resources-category';

        const h3 = document.createElement('h3');
        h3.textContent = title;
        h3.style.marginBottom = '15px';
        h3.style.borderBottom = '1px solid #333';
        section.appendChild(h3);

        const grid = document.createElement('div');
        grid.className = 'resource-items';

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'resource-item';
            if (item.classColor) div.style.borderColor = item.classColor;

            div.innerHTML = `
                <div style="font-size:0.9rem; margin-bottom:5px; color:#aaa;">${item.label}</div>
                <div class="res-val" style="color:${item.color || 'var(--color-info)'}">${item.val.toLocaleString()}</div>
                <div style="margin-top:5px; display:flex; justify-content:center; gap:5px;">
                    <button class="btn-mini" onclick="window.Resources.update('${item.key}', -1)">-</button>
                    <button class="btn-mini" onclick="window.Resources.update('${item.key}', 1)">+</button>
                </div>
            `;
            grid.appendChild(div);
        });

        section.appendChild(grid);
        container.appendChild(section);
    },

    update: function(path, delta) {
        // Helper to update nested object by string path
        const keys = path.split('.');
        let obj = this.inventory;
        for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
        }
        const lastKey = keys[keys.length - 1];

        obj[lastKey] = Math.max(0, obj[lastKey] + delta);

        this.save();
        this.render(); // Re-render to show new value
    }
};

// CSS for mini buttons
const style = document.createElement('style');
style.innerHTML = `
.btn-mini {
    padding: 2px 8px;
    background: #333;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 3px;
}
.btn-mini:hover { background: #555; }
`;
document.head.appendChild(style);

window.Resources = Resources;

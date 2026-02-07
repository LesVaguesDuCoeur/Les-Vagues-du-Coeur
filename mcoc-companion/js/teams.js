// Team Builder Module

const Teams = {
    teams: [], // Array of team objects { id, name, members: [id1, id2...] }

    init: function() {
        console.log('Teams Module Initialized');
        this.load();
        this.setupListeners();
        this.render();
    },

    load: function() {
        const stored = localStorage.getItem('mcoc_teams');
        if (stored) {
            try {
                this.teams = JSON.parse(stored);
            } catch (e) {
                this.teams = [];
            }
        }
    },

    save: function() {
        localStorage.setItem('mcoc_teams', JSON.stringify(this.teams));
    },

    setupListeners: function() {
        const createBtn = document.getElementById('create-team-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.createNewTeam());
        }
    },

    createNewTeam: function() {
        const name = prompt("Nom de l'équipe (ex: AQ, AW):", `Team ${this.teams.length + 1}`);
        if (!name) return;

        const newTeam = {
            id: Date.now().toString(),
            name: name,
            members: [null, null, null, null, null] // 5 slots
        };

        this.teams.push(newTeam);
        this.save();
        this.render();
    },

    deleteTeam: function(teamId) {
        if (confirm("Supprimer cette équipe ?")) {
            this.teams = this.teams.filter(t => t.id !== teamId);
            this.save();
            this.render();
        }
    },

    setMember: function(teamId, slotIndex) {
        // Simple prompt or modal to select from Roster
        // For MVP: Prompt for Champion Name match or ID match
        // Ideally: Re-use the champion selector modal from Roster

        const roster = window.Roster ? window.Roster.data : [];
        if (roster.length === 0) {
            window.app.showToast("Roster vide !", "error");
            return;
        }

        const champNames = roster.map((c, idx) => `${idx}: ${c.name} (${c.stars}*)`).join('\n');
        const selection = prompt(`Entrez le numéro du champion pour le slot ${slotIndex + 1}:\n${champNames}`);

        if (selection !== null) {
            const index = parseInt(selection);
            if (!isNaN(index) && roster[index]) {
                const team = this.teams.find(t => t.id === teamId);
                if (team) {
                    team.members[slotIndex] = roster[index].id; // Store ID
                    this.save();
                    this.render();
                }
            }
        }
    },

    render: function() {
        const container = document.getElementById('teams-list');
        if (!container) return;

        container.innerHTML = '';

        if (this.teams.length === 0) {
            container.innerHTML = '<p>Aucune équipe. Créez-en une !</p>';
            return;
        }

        this.teams.forEach(team => {
            const teamEl = document.createElement('div');
            teamEl.className = 'card';
            teamEl.style.marginBottom = '20px';

            let membersHtml = '';
            let teamPi = 0;

            team.members.forEach((memberId, idx) => {
                let content = '<span style="color:#555; font-size:2rem;">+</span>';
                let border = '2px dashed #444';

                if (memberId && window.Roster) {
                    const champ = window.Roster.data.find(c => c.id === memberId);
                    if (champ) {
                        content = `
                            <div style="font-size:0.8rem; font-weight:bold;">${champ.name}</div>
                            <div style="font-size:0.7rem;">${champ.stars}★</div>
                        `;
                        border = `2px solid var(--class-${champ.class})`;
                        teamPi += window.Roster.calculatePI(champ);
                    }
                }

                membersHtml += `
                    <div class="team-slot" onclick="window.Teams.setMember('${team.id}', ${idx})" style="
                        width: 80px; height: 80px;
                        border: ${border};
                        border-radius: 50%;
                        display: flex; flex-direction: column;
                        align-items: center; justify-content: center;
                        cursor: pointer; background: #222;
                        text-align: center; overflow: hidden;
                    ">
                        ${content}
                    </div>
                `;
            });

            teamEl.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3>${team.name} <span style="font-size:0.8rem; color:#aaa;">(PI: ${teamPi})</span></h3>
                    <button class="btn btn-danger btn-mini" onclick="window.Teams.deleteTeam('${team.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div style="display:flex; justify-content:space-around; flex-wrap:wrap; gap:10px;">
                    ${membersHtml}
                </div>
                <div style="margin-top:15px; padding:10px; background:rgba(0,0,0,0.3); border-radius:4px; font-size:0.9rem;">
                    <strong>Synergies:</strong> <span style="color:var(--color-success)">Calcul des synergies (WIP)</span>
                </div>
            `;
            container.appendChild(teamEl);
        });
    }
};

window.Teams = Teams;

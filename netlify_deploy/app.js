const app = {
    state: {
        menu: null,
        recipes: [],
        forbidden: {},
        currentView: 'home',
        selectedRecipe: null,
        selectedDay: null, // For modifying menu
        selectedMealType: null // For modifying menu
    },

    // Constants
    API_URL: 'https://script.google.com/macros/s/AKfycbyErNnaIpoo_fdnxZpz7ol3NHgutd9DmvsNddiddqGkF7-pV-XjkiDMvRyUsXhiWQ1_/exec',
    DAYS: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
    MEAL_TYPES: ['petit_dejeuner', 'collation_matin', 'dejeuner', 'collation_apres_midi', 'diner'],
    MEAL_LABELS: {
        'petit_dejeuner': 'Petit Déjeuner',
        'collation_matin': 'Collation (10h)',
        'dejeuner': 'Déjeuner',
        'collation_apres_midi': 'Collation (16h)',
        'diner': 'Dîner'
    },

    init: function() {
        console.log('Initializing GastroPlan...');
        this.loadData();
        this.setupEventListeners();

        // Initial Render
        this.navigateTo('home');
    },

    loadData: function() {
        // Load Recipes and Forbidden from static data
        if (window.GastroData) {
            this.state.recipes = window.GastroData.recipes;
            this.state.forbidden = window.GastroData.forbidden;
        } else {
            console.error('GastroData not found!');
        }

        // Load Menu from LocalStorage or Default
        const storedMenu = localStorage.getItem('gastro-plan-menu');
        if (storedMenu) {
            try {
                this.state.menu = JSON.parse(storedMenu);
                console.log('Menu loaded from LocalStorage');
            } catch (e) {
                console.error('Error parsing stored menu', e);
                this.state.menu = window.GastroData.menu;
            }
        } else {
            this.state.menu = window.GastroData.menu; // Copy reference
            console.log('Menu loaded from Default');
        }
    },

    setupEventListeners: function() {
        // Sync Button
        const syncBtn = document.getElementById('sync-btn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => this.syncWithGoogle());
        }

        // Search Input
        const searchInput = document.getElementById('recipe-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.renderRecipeCatalog(e.target.value);
            });
        }

        // Filter Chips
        const filters = document.querySelectorAll('.filter-chip');
        filters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all
                filters.forEach(b => b.classList.remove('active', 'bg-primary', 'text-white'));
                filters.forEach(b => b.classList.add('bg-white', 'text-gray-600'));

                // Add to clicked
                e.target.classList.remove('bg-white', 'text-gray-600');
                e.target.classList.add('active', 'bg-primary', 'text-white');

                // Filter
                this.renderRecipeCatalog(document.getElementById('recipe-search').value, e.target.dataset.filter);
            });
        });
    },

    // Placeholder functions to be implemented in next steps
    navigateTo: function(viewId) {
        this.state.currentView = viewId;

        // Hide all views
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        document.getElementById(`view-${viewId}`).classList.remove('hidden');

        // Update Nav Active State
        document.querySelectorAll('.nav-item').forEach(el => {
             // Reset visual state if needed, mostly handled by CSS classes adding/removing 'active'
             el.classList.remove('active');
             const span = el.querySelector('span');
             if (span && span.textContent.toLowerCase().includes(this.getViewLabel(viewId))) {
                 el.classList.add('active');
             }
        });

        // Special case for Recipes center button
        if (viewId === 'recipes') {
             // Maybe highlight the center button?
        }

        // Render specific view
        if (viewId === 'home') this.renderHome();
        if (viewId === 'menu') this.renderWeeklyMenu();
        if (viewId === 'recipes') this.renderRecipeCatalog();
        if (viewId === 'forbidden') this.renderForbidden();

        window.scrollTo(0, 0);
    },

    getViewLabel: function(viewId) {
        if (viewId === 'home') return 'accueil';
        if (viewId === 'menu') return 'menu';
        if (viewId === 'recipes') return 'recettes';
        if (viewId === 'forbidden') return 'interdits';
        return '';
    },

    renderHome: function() {
        const container = document.getElementById('view-home');
        const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();

        const dayMap = {
            'lundi': 'lundi', 'mardi': 'mardi', 'mercredi': 'mercredi',
            'jeudi': 'jeudi', 'vendredi': 'vendredi', 'samedi': 'samedi', 'dimanche': 'dimanche'
        };
        const currentDayKey = dayMap[today] || 'lundi';

        const dailyMenu = this.state.menu[currentDayKey];

        // determine next meal
        const hour = new Date().getHours();
        let nextMeal = dailyMenu.petit_dejeuner;
        let nextMealLabel = "Petit Déjeuner";
        let nextMealType = 'petit_dejeuner';

        if (hour >= 10 && hour < 12) {
            nextMeal = dailyMenu.collation_matin;
            nextMealLabel = "Collation (10h)";
            nextMealType = 'collation_matin';
        }
        else if (hour >= 12 && hour < 16) {
            nextMeal = dailyMenu.dejeuner;
            nextMealLabel = "Déjeuner";
            nextMealType = 'dejeuner';
        }
        else if (hour >= 16 && hour < 19) {
            nextMeal = dailyMenu.collation_apres_midi;
            nextMealLabel = "Collation (16h)";
            nextMealType = 'collation_apres_midi';
        }
        else if (hour >= 19) {
            nextMeal = dailyMenu.diner;
            nextMealLabel = "Dîner";
            nextMealType = 'diner';
        }

        // Find recipe ID if possible
        const recipeId = this.findRecipeId(nextMeal.nom);
        const clickAction = recipeId ? `app.openRecipeDetail('${recipeId}')` : '';

        container.innerHTML = `
            <div class="mb-6">
                <h2 class="text-xl font-bold capitalize text-gray-800">Bonjour, nous sommes ${today}</h2>
                <p class="text-sm text-gray-500">Prêt pour une journée saine ?</p>
            </div>

            <!-- Next Meal Card -->
            <div class="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6 relative overflow-hidden card-hover cursor-pointer"
                 onclick="${clickAction}">
                <div class="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                    Repas Suivant
                </div>
                <h3 class="text-sm uppercase tracking-wide text-primary font-bold mb-1">${nextMealLabel}</h3>
                <h4 class="text-xl font-bold text-gray-800 mb-2">${nextMeal.nom}</h4>
                <div class="flex items-center text-sm text-gray-600 gap-4">
                    <span class="flex items-center gap-1"><i data-lucide="flame" class="w-4 h-4"></i> ~400 kcal</span>
                    <span class="flex items-center gap-1"><i data-lucide="clock" class="w-4 h-4"></i> 15 min</span>
                </div>
            </div>

            <!-- Daily Summary -->
            <h3 class="font-bold text-lg mb-4">Au menu aujourd'hui</h3>
            <div class="space-y-3">
                ${this.MEAL_TYPES.map(type => {
                    const meal = dailyMenu[type];
                    if (!meal) return '';
                    const rId = this.findRecipeId(meal.nom);
                    const action = rId ? `app.openRecipeDetail('${rId}')` : '';

                    return `
                    <div class="bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between shadow-sm card-hover cursor-pointer"
                         onclick="${action}">
                        <div class="flex items-center gap-3">
                            <div class="bg-gray-100 p-2 rounded-lg text-gray-500">
                                ${this.getMealIcon(type)}
                            </div>
                            <div>
                                <div class="text-xs text-gray-400 font-medium">${this.MEAL_LABELS[type]}</div>
                                <div class="font-semibold text-gray-800">${meal.nom}</div>
                            </div>
                        </div>
                        <i data-lucide="chevron-right" class="text-gray-300 w-5 h-5"></i>
                    </div>
                    `;
                }).join('')}
            </div>

            <div class="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <h4 class="font-bold text-indigo-900 mb-2 text-sm">Conseil du jour</h4>
                <p class="text-sm text-indigo-700">N'oublie pas de boire 1 grand verre d'eau 30min avant chaque repas, mais pas pendant !</p>
            </div>
        `;
        lucide.createIcons();
    },

    getMealIcon: function(type) {
        if (type.includes('petit')) return '<i data-lucide="sun" class="w-5 h-5"></i>';
        if (type.includes('collation')) return '<i data-lucide="coffee" class="w-5 h-5"></i>';
        if (type.includes('diner')) return '<i data-lucide="moon" class="w-5 h-5"></i>';
        return '<i data-lucide="utensils" class="w-5 h-5"></i>';
    },

    findRecipeId: function(name) {
        if (!name) return null;
        const nameLower = name.toLowerCase();

        // Recherche exacte d'abord
        let r = this.state.recipes.find(r => r.nom.toLowerCase() === nameLower);
        if (r) return r.id;

        // Recherche partielle ensuite
        r = this.state.recipes.find(r =>
            r.nom.toLowerCase().includes(nameLower) ||
            nameLower.includes(r.nom.toLowerCase())
        );
        if (r) return r.id;

        // Recherche par mots-clés
        const keywords = nameLower.split(' ');
        r = this.state.recipes.find(recipe => {
            const recipeLower = recipe.nom.toLowerCase();
            return keywords.every(kw => recipeLower.includes(kw));
        });

        return r ? r.id : null;
    },

    renderWeeklyMenu: function() {
        const tbody = document.getElementById('menu-grid-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        this.DAYS.forEach(day => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-50 last:border-0 hover:bg-gray-50/50';

            // Day Header
            const dayCell = document.createElement('td');
            dayCell.className = 'px-4 py-3 font-medium text-gray-900 capitalize bg-gray-50/30';
            dayCell.textContent = day;
            row.appendChild(dayCell);

            // Meals
            this.MEAL_TYPES.forEach(type => {
                const meal = this.state.menu[day][type];
                const cell = document.createElement('td');
                cell.className = 'px-4 py-3 text-sm text-gray-600 meal-slot relative group';

                if (meal) {
                    const rId = this.findRecipeId(meal.nom);
                    cell.innerHTML = `
                        <div class="font-medium text-gray-800 line-clamp-2">${meal.nom}</div>
                        ${meal.ingredients ? `<div class="text-xs text-gray-400 mt-1">${meal.ingredients.length} ingr.</div>` : ''}
                        <button class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-white shadow rounded-full text-primary hover:scale-110 transition-all z-10"
                                onclick="event.stopPropagation(); app.openReplaceModal('${day}', '${type}')" title="Remplacer">
                            <i data-lucide="edit-2" class="w-3 h-3"></i>
                        </button>
                    `;
                    cell.onclick = () => {
                         if(rId) this.openRecipeDetail(rId);
                    };
                } else {
                    cell.innerHTML = `<button class="w-full h-full text-center text-gray-300 hover:text-primary" onclick="event.stopPropagation(); app.openReplaceModal('${day}', '${type}')"><i data-lucide="plus" class="w-4 h-4 mx-auto"></i></button>`;
                }

                row.appendChild(cell);
            });
            tbody.appendChild(row);
        });
        lucide.createIcons();
    },

    openReplaceModal: function(day, type) {
        this.state.selectedDay = day;
        this.state.selectedMealType = type;

        // Determine logical filter
        let filter = 'all';
        if (type === 'petit_dejeuner') filter = 'petit_dejeuner';
        else if (type === 'dejeuner' || type === 'diner') filter = 'plat_complet';

        // Navigate to recipes
        this.navigateTo('recipes');

        // Auto-apply filter if function exists (will be implemented in next step)
        const filterBtn = document.querySelector(`.filter-chip[data-filter="${filter}"]`);
        if(filterBtn) filterBtn.click();

        this.showToast(`Sélectionnez une recette pour : ${day} - ${this.MEAL_LABELS[type]}`);
    },

    addToMenuFromModal: function() {
        if (!this.state.selectedRecipe) return;

        if (this.state.selectedDay && this.state.selectedMealType) {
            // Check Logic
            if (!this.isValidMealPlacement(this.state.selectedRecipe, this.state.selectedMealType)) {
                this.showToast("⚠️ Ce type de recette ne convient pas pour ce moment.", true);
                return;
            }

            // Update
            this.state.menu[this.state.selectedDay][this.state.selectedMealType] = {
                nom: this.state.selectedRecipe.nom,
                ingredients: this.state.selectedRecipe.ingredients
            };

            this.saveMenu();
            this.closeModal();
            this.showToast('Menu mis à jour !');

            // Go back to menu
            this.state.selectedDay = null;
            this.state.selectedMealType = null;
            this.navigateTo('menu');
        } else {
            alert("Pour ajouter au menu, allez dans l'onglet Menu et cliquez sur l'icône de modification d'une case.");
        }
    },

    isValidMealPlacement: function(recipe, slotType) {
        const cat = recipe.categorie;
        if (slotType === 'petit_dejeuner') return cat === 'petit_dejeuner';
        if (slotType.includes('collation')) return cat === 'petit_dejeuner' || cat === 'proteine' || recipe.nom.toLowerCase().includes('fruit') || recipe.nom.toLowerCase().includes('compote') || recipe.nom.toLowerCase().includes('yaourt');
        if (slotType === 'dejeuner' || slotType === 'diner') return cat === 'plat_complet' || cat === 'proteine' || cat === 'legume' || cat === 'feculent';
        return true;
    },

    saveMenu: function() {
        localStorage.setItem('gastro-plan-menu', JSON.stringify(this.state.menu));
        // Also trigger cloud sync if needed
        this.syncWithGoogle();
    },

    resetMenu: function() {
        if(confirm('Êtes-vous sûr de vouloir réinitialiser le menu par défaut ?')) {
            this.state.menu = JSON.parse(JSON.stringify(window.GastroData.menu)); // Deep copy
            this.saveMenu();
            this.renderWeeklyMenu();
            this.showToast('Menu réinitialisé');
        }
    },

    showToast: function(message, isError = false) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'bg-red-600' : ''}`;
        toast.textContent = message;
        container.appendChild(toast);

        // Trigger reflow
        void toast.offsetWidth;

        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    renderRecipeCatalog: function(searchQuery = '', filterCategory = 'all') {
        const grid = document.getElementById('recipes-grid');
        if (!grid) return;
        grid.innerHTML = '';

        let filtered = this.state.recipes;

        // Filter by Category
        if (filterCategory !== 'all') {
            filtered = filtered.filter(r => r.categorie === filterCategory);
        }

        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                r.nom.toLowerCase().includes(q) ||
                r.ingredients.some(i => i.nom.toLowerCase().includes(q))
            );
        }

        // Limit for performance if too many generated recipes (e.g. show max 50 initially)
        // const displayLimit = 50;
        // filtered = filtered.slice(0, displayLimit);

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center py-10 text-gray-400">Aucune recette trouvée</div>`;
            return;
        }

        filtered.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 card-hover cursor-pointer group';

            // Image Placeholder (Gradient based on category)
            let bgClass = 'bg-gradient-to-br from-green-400 to-emerald-600';
            let icon = 'utensils';

            if (recipe.categorie === 'proteine') { bgClass = 'bg-gradient-to-br from-orange-400 to-red-500'; icon = 'beef'; }
            if (recipe.categorie === 'feculent') { bgClass = 'bg-gradient-to-br from-yellow-400 to-orange-500'; icon = 'wheat'; }
            if (recipe.categorie === 'legume') { bgClass = 'bg-gradient-to-br from-green-500 to-teal-600'; icon = 'carrot'; }
            if (recipe.categorie === 'petit_dejeuner') { bgClass = 'bg-gradient-to-br from-blue-400 to-indigo-500'; icon = 'coffee'; }

            card.innerHTML = `
                <div class="h-32 ${bgClass} flex items-center justify-center relative">
                    <i data-lucide="${icon}" class="text-white/30 w-16 h-16 absolute transform group-hover:scale-110 transition-transform duration-500"></i>
                    <div class="absolute bottom-2 right-2 bg-black/40 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                        <i data-lucide="clock" class="w-3 h-3"></i> ${recipe.temps_cuisson || '15 min'}
                    </div>
                </div>
                <div class="p-4">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-xs font-bold text-primary uppercase tracking-wider">${recipe.categorie.replace('_', ' ')}</span>
                    </div>
                    <h3 class="font-bold text-gray-800 mb-2 leading-tight group-hover:text-primary transition-colors">${recipe.nom}</h3>
                    <div class="flex flex-wrap gap-1 mt-2">
                        ${recipe.ingredients.slice(0, 3).map(i =>
                            `<span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full">${i.nom}</span>`
                        ).join('')}
                        ${recipe.ingredients.length > 3 ? `<span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full">+${recipe.ingredients.length - 3}</span>` : ''}
                    </div>
                </div>
            `;

            card.onclick = () => this.openRecipeDetail(recipe.id);
            grid.appendChild(card);
        });

        lucide.createIcons();
    },
    openRecipeDetail: function(recipeId) {
        const recipe = this.state.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        this.state.selectedRecipe = recipe;

        const modal = document.getElementById('modal-recipe');
        const body = document.getElementById('modal-body');

        // Image Header (Gradient again)
        let bgClass = 'bg-gradient-to-br from-green-400 to-emerald-600';
        if (recipe.categorie === 'proteine') bgClass = 'bg-gradient-to-br from-orange-400 to-red-500';
        if (recipe.categorie === 'feculent') bgClass = 'bg-gradient-to-br from-yellow-400 to-orange-500';
        if (recipe.categorie === 'petit_dejeuner') bgClass = 'bg-gradient-to-br from-blue-400 to-indigo-500';

        body.innerHTML = `
            <div class="h-48 ${bgClass} relative flex items-center justify-center">
                <i data-lucide="utensils" class="text-white/30 w-24 h-24"></i>
                <div class="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <span class="text-xs font-bold text-white uppercase tracking-wider bg-primary px-2 py-0.5 rounded">${recipe.categorie.replace('_', ' ')}</span>
                    <h2 class="text-2xl font-bold text-white mt-1 leading-tight">${recipe.nom}</h2>
                </div>
            </div>

            <div class="p-6">
                <!-- Info Grid -->
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                        <div class="bg-white p-2 rounded-full shadow-sm text-primary">
                            <i data-lucide="clock" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <div class="text-xs text-gray-500">Cuisson</div>
                            <div class="font-bold text-gray-800">${recipe.temps_cuisson || '-'}</div>
                        </div>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                        <div class="bg-white p-2 rounded-full shadow-sm text-orange-500">
                            <i data-lucide="flame" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <div class="text-xs text-gray-500">Calories</div>
                            <div class="font-bold text-gray-800">~${Math.floor(Math.random() * 300 + 200)} kcal</div>
                        </div>
                    </div>
                </div>

                <!-- Air Fryer Settings -->
                ${recipe.reglages_airfryer ? `
                <div class="mb-6 border border-gray-200 rounded-xl overflow-hidden">
                    <div class="bg-gray-50 px-4 py-2 border-b border-gray-200 font-bold text-gray-700 flex items-center gap-2">
                        <i data-lucide="wind" class="w-4 h-4 text-blue-500"></i>
                        Réglages Ninja Foodi FLEX
                    </div>
                    <div class="p-4 flex justify-between items-center bg-blue-50/30">
                        <div class="text-center">
                            <div class="text-xs text-gray-500 uppercase">Mode</div>
                            <div class="font-bold text-gray-800">${recipe.reglages_airfryer.mode}</div>
                        </div>
                        <div class="h-8 w-px bg-gray-200"></div>
                        <div class="text-center">
                            <div class="text-xs text-gray-500 uppercase">Temp.</div>
                            <div class="font-bold text-gray-800">${recipe.reglages_airfryer.temperature}</div>
                        </div>
                        <div class="h-8 w-px bg-gray-200"></div>
                        <div class="text-center">
                            <div class="text-xs text-gray-500 uppercase">Temps</div>
                            <div class="font-bold text-gray-800">${recipe.reglages_airfryer.temps}</div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Ingredients -->
                <h3 class="font-bold text-lg mb-3 flex items-center gap-2">
                    <i data-lucide="shopping-basket" class="w-5 h-5 text-primary"></i>
                    Ingrédients
                </h3>
                <ul class="space-y-2 mb-6">
                    ${recipe.ingredients.map(ing => `
                        <li class="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                            <span class="text-gray-700">${ing.nom}</span>
                            <span class="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-sm">${ing.quantite}</span>
                        </li>
                    `).join('')}
                </ul>

                <!-- Instructions -->
                <h3 class="font-bold text-lg mb-3 flex items-center gap-2">
                    <i data-lucide="list-checks" class="w-5 h-5 text-primary"></i>
                    Préparation
                </h3>
                <div class="space-y-4 relative pl-4 border-l-2 border-gray-100">
                    ${recipe.instructions.map((inst, idx) => `
                        <div class="relative">
                            <div class="absolute -left-[21px] top-0 bg-white border-2 border-primary text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                ${idx + 1}
                            </div>
                            <p class="text-gray-600 leading-relaxed">${inst}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        lucide.createIcons();

        // Open Modal
        modal.classList.remove('modal-hidden');
    },

    closeModal: function() {
        document.getElementById('modal-recipe').classList.add('modal-hidden');
        this.state.selectedRecipe = null;
    },

    renderForbidden: function() {
        const container = document.getElementById('forbidden-list');
        if (!container) return;
        container.innerHTML = '';

        Object.entries(this.state.forbidden).forEach(([key, category]) => {
            const item = document.createElement('div');
            item.className = 'bg-white rounded-xl shadow-sm p-5 border border-gray-100';

            item.innerHTML = `
                <div class="flex items-center gap-3 mb-3">
                    <div class="bg-red-100 text-red-500 p-2 rounded-lg">
                         <i data-lucide="ban" class="w-5 h-5"></i>
                    </div>
                    <h3 class="font-bold text-gray-800 text-lg">${category.titre}</h3>
                </div>

                <div class="mb-3">
                    <div class="text-xs font-bold text-red-500 uppercase mb-1">À Éviter</div>
                    <p class="text-sm text-gray-600 leading-relaxed">
                        ${category.aliments.join(', ')}
                    </p>
                </div>

                <div class="bg-red-50 p-3 rounded-lg mb-3 text-xs text-red-700 border border-red-100">
                    <strong>Pourquoi ?</strong> ${category.raison}
                </div>

                <div class="bg-green-50 p-3 rounded-lg border border-green-100">
                    <div class="text-xs font-bold text-green-600 uppercase mb-1 flex items-center gap-1">
                        <i data-lucide="check-circle-2" class="w-3 h-3"></i> Alternatives
                    </div>
                    <p class="text-sm text-gray-700">
                        ${category.alternatives.join(', ')}
                    </p>
                </div>
            `;

            container.appendChild(item);
        });

        lucide.createIcons();
    },
    syncWithGoogle: function() {
        const btn = document.getElementById('sync-btn');
        if (!btn) return;

        const originalIcon = btn.innerHTML;

        // Loading State
        btn.innerHTML = `<div class="loader" style="width: 16px; height: 16px; border-width: 2px;"></div>`;
        btn.disabled = true;

        const payload = {
            timestamp: new Date().toISOString(),
            menu: this.state.menu
        };

        // Google Apps Script usually requires no-cors for simple POST from client-side without auth
        // and content-type text/plain to avoid preflight
        fetch(this.API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload)
        })
        .then(() => {
            // With no-cors, we get an opaque response, so we assume success if no network error
            this.showToast('Sauvegarde Cloud OK ☁️', false);
        })
        .catch(err => {
            console.error('Sync failed', err);
            this.showToast('Erreur connexion Cloud', true);
        })
        .finally(() => {
            btn.innerHTML = originalIcon;
            btn.disabled = false;
            lucide.createIcons();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

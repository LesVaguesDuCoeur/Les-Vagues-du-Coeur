const app = {
    state: {
        menu: null,
        recipes: [],
        forbidden: {},
        currentView: 'home',
        selectedRecipe: null,
        selectedDay: null,
        selectedMealType: null,
        currentWeekOffset: 0,
        favorites: []
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
    REGLES_PLACEMENT: {
        petit_dejeuner: ['petit_dejeuner'],
        collation_matin: ['collation'],
        dejeuner: ['plat_complet'],
        collation_apres_midi: ['collation'],
        diner: ['plat_complet']
    },

    init: function() {
        console.log('Initializing GastroPlan V3...');
        this.loadData();
        this.setupEventListeners();
        this.navigateTo('home');
    },

    loadData: function() {
        if (window.GastroData) {
            this.state.recipes = window.GastroData.recipes;
            this.state.forbidden = window.GastroData.forbidden;
        }

        // Load Favorites
        const storedFavs = localStorage.getItem('gastro-favorites');
        if (storedFavs) {
            this.state.favorites = JSON.parse(storedFavs);
        }

        // Load Menu (Current Week Logic) - Try Cloud if local is empty/stale logic could be added here
        // For now, load local or default
        this.loadWeekMenu();

        // Initial sync check (optional, background)
        // this.syncWithGoogle('load');
    },

    getWeekKey: function() {
        const d = new Date();
        d.setDate(d.getDate() + (this.state.currentWeekOffset * 7));
        const onejan = new Date(d.getFullYear(), 0, 1);
        const millisecsInDay = 86400000;
        const weekNum = Math.ceil((((d - onejan) / millisecsInDay) + onejan.getDay() + 1) / 7);
        return `gastro-menu-${d.getFullYear()}-W${weekNum}`;
    },

    loadWeekMenu: function() {
        const key = this.getWeekKey();
        const storedMenu = localStorage.getItem(key);

        if (storedMenu) {
            this.state.menu = JSON.parse(storedMenu);
        } else {
            // Default Menu is a template, deep copy it
            this.state.menu = JSON.parse(JSON.stringify(window.GastroData.menu));
        }
    },

    setupEventListeners: function() {
        // Sync Button
        const syncBtn = document.getElementById('sync-btn');
        if (syncBtn) syncBtn.addEventListener('click', () => this.syncWithGoogle('save'));

        // Recipe Search
        const searchInput = document.getElementById('recipe-search');
        if (searchInput) searchInput.addEventListener('input', (e) => this.renderRecipeCatalog(e.target.value));

        // Forbidden Search
        const forbiddenSearch = document.getElementById('forbidden-search');
        if (forbiddenSearch) forbiddenSearch.addEventListener('input', (e) => this.renderForbidden(e.target.value));

        // Filter Chips
        const filters = document.querySelectorAll('.filter-chip');
        filters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filters.forEach(b => b.classList.remove('active', 'bg-primary', 'text-white'));
                filters.forEach(b => b.classList.add('bg-white', 'text-gray-600'));
                e.target.classList.remove('bg-white', 'text-gray-600');
                e.target.classList.add('active', 'bg-primary', 'text-white');

                // Get current search value if any
                const q = document.getElementById('recipe-search') ? document.getElementById('recipe-search').value : '';
                this.renderRecipeCatalog(q, e.target.dataset.filter);
            });
        });
    },

    navigateTo: function(viewId) {
        this.state.currentView = viewId;
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        const target = document.getElementById(`view-${viewId}`);
        if(target) target.classList.remove('hidden');

        // Update Nav
        document.querySelectorAll('.nav-item').forEach(el => {
             el.classList.remove('active', 'text-primary');
             el.classList.add('text-gray-400');
             const span = el.querySelector('span');
             if (span && span.textContent.toLowerCase().includes(this.getViewLabel(viewId))) {
                 el.classList.add('active', 'text-primary');
                 el.classList.remove('text-gray-400');
             }
        });

        // Render specific view
        if (viewId === 'home') this.renderHome();
        if (viewId === 'menu') this.renderWeeklyMenu();
        if (viewId === 'recipes') this.renderRecipeCatalog();
        if (viewId === 'shopping') this.renderShoppingList();
        if (viewId === 'forbidden') this.renderForbidden();

        window.scrollTo(0, 0);
    },

    getViewLabel: function(viewId) {
        if (viewId === 'home') return 'accueil';
        if (viewId === 'menu') return 'menu';
        if (viewId === 'recipes') return 'recettes';
        if (viewId === 'shopping') return 'courses';
        if (viewId === 'forbidden') return 'interdits';
        return '';
    },

    renderHome: function() {
        const container = document.getElementById('view-home');
        if(!container) return;

        const now = new Date();
        now.setDate(now.getDate() + (this.state.currentWeekOffset * 7));
        const dayName = now.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();

        // Normalize day key
        const dayMap = { 'lundi': 'lundi', 'mardi': 'mardi', 'mercredi': 'mercredi', 'jeudi': 'jeudi', 'vendredi': 'vendredi', 'samedi': 'samedi', 'dimanche': 'dimanche' };
        const currentDayKey = dayMap[dayName] || 'lundi';

        const dailyMenu = this.state.menu[currentDayKey];

        // determine next meal
        const hour = new Date().getHours();
        let nextMeal = dailyMenu.petit_dejeuner;
        let nextMealLabel = "Petit Déjeuner";
        let labelColor = "bg-orange-100 text-orange-700";

        if (hour >= 10 && hour < 12) { nextMeal = dailyMenu.collation_matin; nextMealLabel = "Collation (10h)"; labelColor = "bg-blue-100 text-blue-700"; }
        else if (hour >= 12 && hour < 16) { nextMeal = dailyMenu.dejeuner; nextMealLabel = "Déjeuner"; labelColor = "bg-green-100 text-green-700"; }
        else if (hour >= 16 && hour < 19) { nextMeal = dailyMenu.collation_apres_midi; nextMealLabel = "Collation (16h)"; labelColor = "bg-purple-100 text-purple-700"; }
        else if (hour >= 19) { nextMeal = dailyMenu.diner; nextMealLabel = "Dîner"; labelColor = "bg-indigo-100 text-indigo-700"; }

        const recipeId = this.findRecipeId(nextMeal.nom);
        const clickAction = recipeId ? `app.openRecipeDetail('${recipeId}')` : '';

        container.innerHTML = `
            <div class="mb-6">
                <h2 class="text-xl font-bold capitalize text-gray-800">Bonjour, nous sommes ${dayName}</h2>
                <p class="text-sm text-gray-500">Prêt pour une journée saine ?</p>
            </div>

            <div class="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6 relative overflow-hidden card-hover cursor-pointer"
                 onclick="${clickAction}">
                <div class="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-xl">Repas Suivant</div>
                <h3 class="text-sm uppercase tracking-wide text-primary font-bold mb-1">${nextMealLabel}</h3>
                <h4 class="text-xl font-bold text-gray-800 mb-2">${nextMeal.nom}</h4>
                <div class="flex items-center text-sm text-gray-600 gap-4">
                    <span class="flex items-center gap-1"><i data-lucide="flame" class="w-4 h-4"></i> ~400 kcal</span>
                    <span class="flex items-center gap-1"><i data-lucide="clock" class="w-4 h-4"></i> 15 min</span>
                </div>
            </div>

            <h3 class="font-bold text-lg mb-4">Au menu aujourd'hui</h3>
            <div class="space-y-3 pb-24">
                ${this.MEAL_TYPES.map(type => {
                    const meal = dailyMenu[type];
                    if (!meal) return '';
                    const rId = this.findRecipeId(meal.nom);
                    const action = rId ? `app.openRecipeDetail('${rId}')` : '';
                    let icon = 'utensils';
                    if (type.includes('petit')) icon = 'sun';
                    if (type.includes('collation')) icon = 'coffee';
                    if (type.includes('diner')) icon = 'moon';

                    return `
                    <div class="bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between shadow-sm card-hover cursor-pointer" onclick="${action}">
                        <div class="flex items-center gap-3">
                            <div class="bg-gray-100 p-2 rounded-lg text-gray-500"><i data-lucide="${icon}" class="w-5 h-5"></i></div>
                            <div>
                                <div class="text-xs text-gray-400 font-medium">${this.MEAL_LABELS[type]}</div>
                                <div class="font-semibold text-gray-800">${meal.nom}</div>
                            </div>
                        </div>
                        <i data-lucide="chevron-right" class="text-gray-300 w-5 h-5"></i>
                    </div>`;
                }).join('')}
            </div>
        `;
        lucide.createIcons();
    },

    renderWeeklyMenu: function() {
        const tbody = document.getElementById('menu-grid-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        // Header Date Logic
        const header = document.querySelector('#view-menu h2');
        if(header) {
            const d = new Date();
            d.setDate(d.getDate() + (this.state.currentWeekOffset * 7));
            const weekNum = this.getWeekKey().split('-W')[1];
            header.innerHTML = `Menu Semaine ${weekNum} <span class="text-sm font-normal text-gray-500 ml-2">(${d.getFullYear()})</span>`;
        }

        // Navigation controls
        const navContainer = document.querySelector('.menu-nav') || document.createElement('div');
        if (!navContainer.className.includes('menu-nav')) {
            navContainer.className = 'flex justify-between mb-4 menu-nav';
            document.querySelector('#view-menu .flex').after(navContainer);
        }
        navContainer.innerHTML = `
            <button onclick="app.changeWeek(-1)" class="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><i data-lucide="chevron-left" class="w-5 h-5"></i></button>
            <span class="font-medium text-gray-600 self-center">Semaine ${this.state.currentWeekOffset === 0 ? 'Actuelle' : (this.state.currentWeekOffset > 0 ? '+'+this.state.currentWeekOffset : this.state.currentWeekOffset)}</span>
            <button onclick="app.changeWeek(1)" class="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><i data-lucide="chevron-right" class="w-5 h-5"></i></button>
        `;

        this.DAYS.forEach((day, index) => {
            // Calculate real date
            const current = new Date();
            const dayDiff = index - (current.getDay() === 0 ? 6 : current.getDay() - 1); // Adjust for Monday start
            current.setDate(current.getDate() + (this.state.currentWeekOffset * 7) + dayDiff);
            const dateStr = current.toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'});

            const row = document.createElement('tr');
            row.className = 'border-b border-gray-50 last:border-0 hover:bg-gray-50/50';

            row.innerHTML = `
                <td class="px-4 py-3 bg-gray-50/30">
                    <div class="font-medium text-gray-900 capitalize">${day}</div>
                    <div class="text-xs text-gray-400">${dateStr}</div>
                </td>
            `;

            this.MEAL_TYPES.forEach(type => {
                const meal = this.state.menu[day][type];
                const cell = document.createElement('td');
                cell.className = 'px-4 py-3 text-sm text-gray-600 meal-slot relative group min-w-[140px]';

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
                    cell.onclick = () => { if(rId) this.openRecipeDetail(rId); };
                } else {
                    cell.innerHTML = `<button class="w-full h-full text-center text-gray-300 hover:text-primary py-2" onclick="event.stopPropagation(); app.openReplaceModal('${day}', '${type}')"><i data-lucide="plus" class="w-4 h-4 mx-auto"></i></button>`;
                }
                row.appendChild(cell);
            });
            tbody.appendChild(row);
        });

        // Add export button if not present
        if(!document.getElementById('ical-btn')) {
            const headerActions = document.querySelector('#view-menu .flex button');
            const exportBtn = document.createElement('button');
            exportBtn.id = 'ical-btn';
            exportBtn.className = 'text-xs text-blue-500 hover:underline mr-4';
            exportBtn.textContent = 'Exporter iCal';
            exportBtn.onclick = () => this.exportToICal();
            headerActions.before(exportBtn);
        }

        lucide.createIcons();
    },

    changeWeek: function(offset) {
        this.state.currentWeekOffset += offset;
        this.loadWeekMenu();
        this.renderWeeklyMenu();
    },

    renderRecipeCatalog: function(searchQuery = '', filterCategory = 'all') {
        const grid = document.getElementById('recipes-grid');
        if (!grid) return;
        grid.innerHTML = '';

        let filtered = this.state.recipes;

        if (filterCategory === 'favoris') {
            filtered = filtered.filter(r => this.state.favorites.includes(r.id));
        } else if (filterCategory !== 'all') {
            filtered = filtered.filter(r => r.categorie === filterCategory);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                r.nom.toLowerCase().includes(q) ||
                r.ingredients.some(i => i.nom.toLowerCase().includes(q))
            );
        }

        // Pagination limit for performance (rendering 500+ items is slow)
        const displayLimit = 50;
        if (filtered.length > displayLimit) filtered = filtered.slice(0, displayLimit);

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center py-10 text-gray-400">Aucune recette trouvée</div>`;
            return;
        }

        filtered.forEach(recipe => {
            const isFav = this.state.favorites.includes(recipe.id);
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 card-hover cursor-pointer group relative';

            let bgClass = 'bg-gradient-to-br from-green-400 to-emerald-600';
            let icon = 'utensils';
            if (recipe.categorie === 'proteine') { bgClass = 'bg-gradient-to-br from-orange-400 to-red-500'; icon = 'beef'; }
            if (recipe.categorie === 'feculent') { bgClass = 'bg-gradient-to-br from-yellow-400 to-orange-500'; icon = 'wheat'; }
            if (recipe.categorie === 'petit_dejeuner') { bgClass = 'bg-gradient-to-br from-blue-400 to-indigo-500'; icon = 'coffee'; }
            if (recipe.categorie === 'collation') { bgClass = 'bg-gradient-to-br from-purple-400 to-pink-500'; icon = 'apple'; }

            card.innerHTML = `
                <div class="absolute top-2 right-2 z-10">
                    <button class="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors ${isFav ? 'text-red-500' : 'text-white'}"
                            onclick="event.stopPropagation(); app.toggleFavorite('${recipe.id}')">
                        <i data-lucide="heart" class="w-5 h-5 ${isFav ? 'fill-current' : ''}"></i>
                    </button>
                </div>
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
                        ${recipe.ingredients.slice(0, 3).map(i => `<span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full">${i.nom}</span>`).join('')}
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

        let bgClass = 'bg-gradient-to-br from-green-400 to-emerald-600';
        if (recipe.categorie === 'petit_dejeuner') bgClass = 'bg-gradient-to-br from-blue-400 to-indigo-500';
        if (recipe.categorie === 'collation') bgClass = 'bg-gradient-to-br from-purple-400 to-pink-500';

        // Air Fryer Display Logic
        let afHtml = '';
        if (recipe.reglages_airfryer) {
            const af = recipe.reglages_airfryer;
            afHtml = `
            <div class="mb-6 border border-gray-200 rounded-xl overflow-hidden">
                <div class="bg-gray-50 px-4 py-2 border-b border-gray-200 font-bold text-gray-700 flex items-center gap-2">
                    <i data-lucide="wind" class="w-4 h-4 text-blue-500"></i>
                    Réglages Ninja Foodi FLEX
                </div>
                <div class="p-4 bg-blue-50/30 text-sm">
                    ${af.details ? `<div class="font-medium text-center mb-2">${af.details}</div>` : ''}
                    <div class="flex justify-around items-center">
                        <div class="text-center">
                            <div class="text-xs text-gray-500 uppercase">Mode</div>
                            <div class="font-bold text-gray-800">${af.mode || 'Air Fry'}</div>
                        </div>
                        <div class="h-8 w-px bg-gray-200"></div>
                        <div class="text-center">
                            <div class="text-xs text-gray-500 uppercase">Temp.</div>
                            <div class="font-bold text-gray-800">${af.temperature || '180°C'}</div>
                        </div>
                        <div class="h-8 w-px bg-gray-200"></div>
                        <div class="text-center">
                            <div class="text-xs text-gray-500 uppercase">Temps</div>
                            <div class="font-bold text-gray-800">${af.temps || '15 min'}</div>
                        </div>
                    </div>
                </div>
            </div>`;
        }

        body.innerHTML = `
            <div class="h-48 ${bgClass} relative flex items-center justify-center">
                <i data-lucide="utensils" class="text-white/30 w-24 h-24"></i>
                <div class="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <span class="text-xs font-bold text-white uppercase tracking-wider bg-primary px-2 py-0.5 rounded">${recipe.categorie.replace('_', ' ')}</span>
                    <h2 class="text-2xl font-bold text-white mt-1 leading-tight">${recipe.nom}</h2>
                </div>
            </div>
            <div class="p-6">
                ${afHtml}
                <h3 class="font-bold text-lg mb-3 flex items-center gap-2"><i data-lucide="shopping-basket" class="w-5 h-5 text-primary"></i> Ingrédients</h3>
                <ul class="space-y-2 mb-6">
                    ${recipe.ingredients.map(ing => `
                        <li class="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                            <span class="text-gray-700">${ing.nom}</span>
                            <span class="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-sm">${ing.quantite || ing.qt || ''}</span>
                        </li>`).join('')}
                </ul>
                <h3 class="font-bold text-lg mb-3 flex items-center gap-2"><i data-lucide="list-checks" class="w-5 h-5 text-primary"></i> Préparation</h3>
                <div class="space-y-4 pl-4 border-l-2 border-gray-100 instruction-step">
                    ${recipe.instructions.map((inst, idx) => `
                        <div class="relative">
                            <div class="absolute -left-[21px] top-0 bg-white border-2 border-primary text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">${idx + 1}</div>
                            <p class="text-gray-600 leading-relaxed">${inst}</p>
                        </div>`).join('')}
                </div>
            </div>
        `;
        lucide.createIcons();
        modal.classList.remove('modal-hidden');
    },

    closeModal: function() {
        document.getElementById('modal-recipe').classList.add('modal-hidden');
        this.state.selectedRecipe = null;
    },

    toggleFavorite: function(id) {
        if(this.state.favorites.includes(id)) {
            this.state.favorites = this.state.favorites.filter(fid => fid !== id);
            this.showToast('Retiré des favoris');
        } else {
            this.state.favorites.push(id);
            this.showToast('Ajouté aux favoris ❤️');
        }
        localStorage.setItem('gastro-favorites', JSON.stringify(this.state.favorites));
        if(this.state.currentView === 'recipes') {
            const activeFilter = document.querySelector('.filter-chip.active');
            const filterVal = activeFilter ? activeFilter.dataset.filter : 'all';
            this.renderRecipeCatalog(document.getElementById('recipe-search').value, filterVal);
        }
    },

    renderShoppingList: function() {
        const container = document.getElementById('shopping-list-container');
        if(!container) return;

        // Aggregate ingredients
        const categories = { 'Protéines': [], 'Féculents': [], 'Légumes': [], 'Produits laitiers': [], 'Fruits': [], 'Epicerie': [] };
        const mapping = {
            'saumon': 'Protéines', 'poulet': 'Protéines', 'dinde': 'Protéines', 'oeufs': 'Protéines', 'cabillaud': 'Protéines',
            'riz': 'Féculents', 'pâtes': 'Féculents', 'quinoa': 'Féculents', 'pommes de terre': 'Féculents', 'patate': 'Féculents', 'lentilles': 'Féculents', 'semoule': 'Féculents', 'pain': 'Féculents', 'flocons': 'Féculents',
            'courgettes': 'Légumes', 'carottes': 'Légumes', 'haricots': 'Légumes', 'brocoli': 'Légumes', 'epinards': 'Légumes', 'mix': 'Légumes', 'aubergine': 'Légumes',
            'yaourt': 'Produits laitiers', 'fromage blanc': 'Produits laitiers', 'lait': 'Produits laitiers', 'mozzarella': 'Produits laitiers',
            'banane': 'Fruits', 'pomme': 'Fruits', 'compote': 'Fruits',
            'amandes': 'Epicerie', 'huile': 'Epicerie', 'sel': 'Epicerie', 'herbes': 'Epicerie', 'cannelle': 'Epicerie', 'paprika': 'Epicerie'
        };

        const rawList = {};

        this.DAYS.forEach(day => {
            this.MEAL_TYPES.forEach(type => {
                const meal = this.state.menu[day][type];
                if(meal && meal.ingredients) {
                    meal.ingredients.forEach(ing => {
                        const name = ing.nom.toLowerCase();
                        let cat = 'Epicerie'; // Default
                        for(const [key, val] of Object.entries(mapping)) {
                            if(name.includes(key)) { cat = val; break; }
                        }

                        const keyName = ing.nom; // Preserve case for display
                        if(!rawList[keyName]) rawList[keyName] = { count: 0, unit: '' };

                        // Basic quantity parsing (very naive)
                        rawList[keyName].count++;
                        rawList[keyName].unit = ing.qt || ing.quantite;
                        rawList[keyName].category = cat;
                    });
                }
            });
        });

        // Group by category
        Object.entries(rawList).forEach(([name, data]) => {
            categories[data.category].push(`${name} (${data.unit} x ${data.count})`);
        });

        container.innerHTML = Object.entries(categories).map(([cat, items]) => {
            if(items.length === 0) return '';
            return `
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h3 class="font-bold text-primary mb-3 uppercase text-xs tracking-wider">${cat}</h3>
                    <ul class="space-y-2">
                        ${items.map(i => `
                            <li class="flex items-start gap-2 text-sm text-gray-700">
                                <input type="checkbox" class="mt-1 rounded text-primary focus:ring-primary">
                                <span>${i}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }).join('');
    },

    copyShoppingList: function() {
        const text = document.getElementById('shopping-list-container').innerText;
        navigator.clipboard.writeText(text).then(() => this.showToast('Liste copiée !'));
    },

    renderForbidden: function(search = '') {
        const container = document.getElementById('forbidden-list');
        if(!container) return;
        container.innerHTML = '';

        const q = search.toLowerCase();

        Object.values(this.state.forbidden).forEach(cat => {
            // Check if matches search
            const match = !q || cat.titre.toLowerCase().includes(q) ||
                          cat.aliments.some(a => a.toLowerCase().includes(q)) ||
                          cat.alternatives.some(a => a.toLowerCase().includes(q));

            if(match) {
                // Highlight logic could be added here
                container.innerHTML += `
                <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="bg-red-100 text-red-500 p-2 rounded-lg"><i data-lucide="ban" class="w-5 h-5"></i></div>
                        <h3 class="font-bold text-gray-800 text-lg">${cat.titre}</h3>
                    </div>
                    <div class="mb-3">
                        <div class="text-xs font-bold text-red-500 uppercase mb-1">À Éviter</div>
                        <div class="flex flex-wrap gap-1">
                            ${cat.aliments.map(a => `<span class="bg-red-50 text-red-700 px-2 py-1 rounded text-sm ${a.toLowerCase().includes(q) && q ? 'ring-2 ring-red-400' : ''}">${a}</span>`).join('')}
                        </div>
                    </div>
                    <div class="bg-green-50 p-3 rounded-lg border border-green-100 mt-3">
                        <div class="text-xs font-bold text-green-600 uppercase mb-1 flex items-center gap-1"><i data-lucide="check-circle-2" class="w-3 h-3"></i> Alternatives</div>
                        <div class="flex flex-wrap gap-1">
                            ${cat.alternatives.map(a => `<span class="text-green-700 text-sm ${a.toLowerCase().includes(q) && q ? 'bg-white px-1 rounded' : ''}">${a}</span>`).join(', ')}
                        </div>
                    </div>
                </div>`;
            }
        });
        lucide.createIcons();
    },

    exportToICal: function() {
        let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//GastroPlan//FR\n";
        const hours = { 'petit_dejeuner': '080000', 'collation_matin': '100000', 'dejeuner': '123000', 'collation_apres_midi': '160000', 'diner': '193000' };

        this.DAYS.forEach((day, index) => {
            const current = new Date();
            const dayDiff = index - (current.getDay() === 0 ? 6 : current.getDay() - 1);
            current.setDate(current.getDate() + (this.state.currentWeekOffset * 7) + dayDiff);

            const dateStr = current.toISOString().replace(/[-:]/g, '').split('T')[0]; // YYYYMMDD

            this.MEAL_TYPES.forEach(type => {
                const meal = this.state.menu[day][type];
                if(meal) {
                    const desc = meal.ingredients ? meal.ingredients.map(i => `${i.nom} (${i.qt || i.quantite})`).join(', ') : '';
                    icsContent += "BEGIN:VEVENT\n";
                    icsContent += `DTSTART:${dateStr}T${hours[type]}\n`;
                    icsContent += `DTEND:${dateStr}T${parseInt(hours[type]) + 3000}\n`; // +30 min
                    icsContent += `SUMMARY:${meal.nom}\n`;
                    icsContent += `DESCRIPTION:${desc}\n`;
                    icsContent += "END:VEVENT\n";
                }
            });
        });
        icsContent += "END:VCALENDAR";

        const blob = new Blob([icsContent], {type: 'text/calendar'});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `menu_gastro_semaine_${this.getWeekKey()}.ics`;
        a.click();
    },

    // Utils
    findRecipeId: function(name) {
        if (!name) return null;
        const nameLower = name.toLowerCase();
        let r = this.state.recipes.find(r => r.nom.toLowerCase() === nameLower);
        if (r) return r.id;
        r = this.state.recipes.find(r => r.nom.toLowerCase().includes(nameLower) || nameLower.includes(r.nom.toLowerCase()));
        if (r) return r.id;
        const keywords = nameLower.split(' ').filter(k => k.length > 2);
        r = this.state.recipes.find(recipe => {
            const rl = recipe.nom.toLowerCase();
            return keywords.every(kw => rl.includes(kw));
        });
        return r ? r.id : null;
    },

    openReplaceModal: function(day, type) {
        this.state.selectedDay = day;
        this.state.selectedMealType = type;
        const rules = this.REGLES_PLACEMENT[type];

        let filter = 'all';
        if(rules.includes('petit_dejeuner')) filter = 'petit_dejeuner';
        else if(rules.includes('collation')) filter = 'collation';
        else if(rules.includes('plat_complet')) filter = 'plat_complet';

        this.navigateTo('recipes');
        const filterBtn = document.querySelector(`.filter-chip[data-filter="${filter}"]`);
        if(filterBtn) filterBtn.click();
        this.showToast(`Sélectionnez une recette pour : ${day}`);
    },

    addToMenuFromModal: function() {
        if (!this.state.selectedRecipe) return;
        if (this.state.selectedDay && this.state.selectedMealType) {
            // Validation
            const allowedCats = this.REGLES_PLACEMENT[this.state.selectedMealType];
            if(!allowedCats.includes(this.state.selectedRecipe.categorie)) {
                this.showToast(`⚠️ Erreur : Ce créneau accepte uniquement : ${allowedCats.join(', ')}`, true);
                return;
            }

            this.state.menu[this.state.selectedDay][this.state.selectedMealType] = {
                nom: this.state.selectedRecipe.nom,
                ingredients: this.state.selectedRecipe.ingredients
            };
            this.saveMenu();
            this.closeModal();
            this.showToast('Menu mis à jour !');
            this.state.selectedDay = null;
            this.state.selectedMealType = null;
            this.navigateTo('menu');
        } else {
            alert("Passez par le menu pour modifier une case.");
        }
    },

    saveMenu: function() {
        const key = this.getWeekKey();
        localStorage.setItem(key, JSON.stringify(this.state.menu));
        this.syncWithGoogle('save');
    },

    resetMenu: function() {
        if(confirm('Réinitialiser cette semaine ?')) {
            this.state.menu = JSON.parse(JSON.stringify(window.GastroData.menu));
            this.saveMenu();
            this.renderWeeklyMenu();
        }
    },

    showToast: function(message, isError = false) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'bg-red-600' : ''}`;
        toast.textContent = message;
        container.appendChild(toast);
        void toast.offsetWidth;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    syncWithGoogle: function(action = 'save') {
        const btn = document.getElementById('sync-btn');
        if (!btn) return;
        const originalIcon = btn.innerHTML;
        btn.innerHTML = `<div class="loader" style="width: 16px; height: 16px; border-width: 2px;"></div>`;
        btn.disabled = true;

        const payload = {
            action: action,
            weekKey: this.getWeekKey(),
            menu: this.state.menu,
            favorites: this.state.favorites
        };

        fetch(this.API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {'Content-Type': 'text/plain;charset=utf-8'},
            body: JSON.stringify(payload)
        })
        .then(() => this.showToast('Sauvegarde Cloud OK ☁️', false))
        .catch(err => {
            console.error('Sync failed', err);
            this.showToast('Erreur Cloud', true);
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

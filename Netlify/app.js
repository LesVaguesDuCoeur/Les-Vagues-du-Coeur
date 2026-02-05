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
favorites: [],
ramadanMode: false
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

// Ramadan Constants
RAMADAN_MEAL_TYPES: ['suhoor', 'iftar', 'iftar_plat', 'collation_nuit'],
RAMADAN_MEAL_LABELS: {
    'suhoor': 'Suhoor (avant aube)',
    'iftar': 'Iftar (rupture)',
    'iftar_plat': 'Plat principal',
    'collation_nuit': 'Collation nuit'
},
RAMADAN_REGLES: {
    suhoor: ['suhoor', 'petit_dejeuner'],
    iftar: ['iftar', 'collation'],
    iftar_plat: ['iftar_plat', 'plat_complet'],
    collation_nuit: ['collation_nuit', 'collation']
},

init: function() {
    console.log('Initializing GastroPlan V4...');
    this.setupEventListeners();
    this.loadData(); // Async load from Drive
},

loadData: function() {
    // Initial static load for Forbidden/Base
    if (window.GastroData) {
        this.state.forbidden = window.GastroData.forbidden || {};
    }

    // Ensure safe default state
    this.ensureState();

    // Fetch from Drive
    fetch(this.API_URL)
    .then(res => res.json())
    .then(data => {
        if (data && data.menu) {
             this.state.menu = data.menu;
             this.state.recipes = Array.isArray(data.recipes) ? data.recipes : [];
             this.state.favorites = Array.isArray(data.favorites) ? data.favorites : [];
             this.state.ramadanMode = !!data.ramadanMode;
             this.showToast('Données chargées depuis le Cloud ☁️');
        } else {
             // New user or empty drive
             this.loadLocalOrDefault();
        }
    })
    .catch(err => {
        console.error("Cloud load failed", err);
        this.showToast('Mode Hors Ligne / Erreur Cloud', true);
        this.loadLocalOrDefault();
    })
    .finally(() => {
        this.ensureState();
        this.updateRamadanState();
        this.navigateTo('home');
    });
},

loadLocalOrDefault: function() {
    // Fallback to LocalStorage
    const storedFavs = localStorage.getItem('gastro-favorites');
    if (storedFavs) {
        try {
            const parsed = JSON.parse(storedFavs);
            this.state.favorites = Array.isArray(parsed) ? parsed : [];
        } catch(e) {
            this.state.favorites = [];
        }
    }

    const ramadanMode = localStorage.getItem('gastro-ramadan-mode');
    if (ramadanMode === 'true') this.state.ramadanMode = true;

    // Menu logic
    this.loadWeekMenu();

    // Recipes logic (if empty, we are truly empty as per requirement, or use provided default if any)
    if (window.GastroData && Array.isArray(window.GastroData.recipes) && window.GastroData.recipes.length > 0) {
        this.state.recipes = window.GastroData.recipes;
    }
},

ensureState: function() {
    if (!Array.isArray(this.state.favorites)) this.state.favorites = [];
    if (!Array.isArray(this.state.recipes)) this.state.recipes = [];
    if (!this.state.menu) this.state.menu = {};
},

toggleRamadanMode: function() {
    this.state.ramadanMode = !this.state.ramadanMode;
    localStorage.setItem('gastro-ramadan-mode', this.state.ramadanMode);
    this.updateRamadanState();
    this.renderWeeklyMenu();
    this.showToast(this.state.ramadanMode ? 'Mode Ramadan activé 🌙' : 'Mode normal activé ☀️');
    this.saveMenu(); // Sync setting
},

updateRamadanState: function() {
    if (this.state.ramadanMode) {
        this.MEAL_TYPES = this.RAMADAN_MEAL_TYPES;
        this.MEAL_LABELS = this.RAMADAN_MEAL_LABELS;
        this.REGLES_PLACEMENT = this.RAMADAN_REGLES;
        document.getElementById('ramadan-toggle')?.classList.add('bg-blue-100', 'text-blue-700', 'border-blue-200');
    } else {
        this.MEAL_TYPES = ['petit_dejeuner', 'collation_matin', 'dejeuner', 'collation_apres_midi', 'diner'];
        this.MEAL_LABELS = {
            'petit_dejeuner': 'Petit Déjeuner',
            'collation_matin': 'Collation (10h)',
            'dejeuner': 'Déjeuner',
            'collation_apres_midi': 'Collation (16h)',
            'diner': 'Dîner'
        };
        this.REGLES_PLACEMENT = {
            petit_dejeuner: ['petit_dejeuner'],
            collation_matin: ['collation'],
            dejeuner: ['plat_complet'],
            collation_apres_midi: ['collation'],
            diner: ['plat_complet']
        };
        document.getElementById('ramadan-toggle')?.classList.remove('bg-blue-100', 'text-blue-700', 'border-blue-200');
    }
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
    // If we loaded from cloud, state.menu is already set for the *stored* state.
    // But we handle weekly navigation locally too.
    // If state.menu is null (first load fallback), check localstorage
    if (this.state.menu) return;

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
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.startsWith('#')) {
                this.renderRecipeCatalog('', 'all', query.toLowerCase());
            } else {
                this.renderRecipeCatalog(query);
            }
        });
    }

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

    // Ensure menu is initialized
    if (!this.state.menu) this.state.menu = JSON.parse(JSON.stringify(window.GastroData.menu));

    const dailyMenu = this.state.menu[currentDayKey];
    if (!dailyMenu) return; // Safety check

    // determine next meal
    const hour = new Date().getHours();
    let nextMeal = dailyMenu[this.MEAL_TYPES[0]];
    let nextMealLabel = this.MEAL_LABELS[this.MEAL_TYPES[0]];

    if (!this.state.ramadanMode) {
         if (hour >= 10 && hour < 12) { nextMeal = dailyMenu.collation_matin; nextMealLabel = "Collation (10h)"; }
         else if (hour >= 12 && hour < 16) { nextMeal = dailyMenu.dejeuner; nextMealLabel = "Déjeuner"; }
         else if (hour >= 16 && hour < 19) { nextMeal = dailyMenu.collation_apres_midi; nextMealLabel = "Collation (16h)"; }
         else if (hour >= 19) { nextMeal = dailyMenu.diner; nextMealLabel = "Dîner"; }
    } else {
         // Ramadan logic (approximate)
         if (hour >= 4 && hour < 19) { nextMeal = dailyMenu.iftar; nextMealLabel = "Iftar (Rupture)"; }
         else if (hour >= 19 && hour < 21) { nextMeal = dailyMenu.iftar_plat; nextMealLabel = "Plat Principal"; }
         else if (hour >= 21) { nextMeal = dailyMenu.collation_nuit; nextMealLabel = "Collation Nuit"; }
         else { nextMeal = dailyMenu.suhoor; nextMealLabel = "Suhoor"; }
    }

    if (!nextMeal) nextMeal = { nom: "Aucun repas prévu" };

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
            <h4 class="text-xl font-bold text-gray-800 mb-2">${nextMeal.nom || 'Aucun repas'}</h4>
            <div class="flex items-center text-sm text-gray-600 gap-4">
                <span class="flex items-center gap-1"><i data-lucide="flame" class="w-4 h-4"></i> ${nextMeal.kcal ? '~'+nextMeal.kcal : '~400'} kcal</span>
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
                if (type.includes('petit') || type.includes('suhoor')) icon = 'sun';
                if (type.includes('collation')) icon = 'coffee';
                if (type.includes('diner') || type.includes('iftar') || type.includes('nuit')) icon = 'moon';

                return `
                <div class="bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between shadow-sm card-hover cursor-pointer" onclick="${action}">
                    <div class="flex items-center gap-3">
                        <div class="bg-gray-100 p-2 rounded-lg text-gray-500"><i data-lucide="${icon}" class="w-5 h-5"></i></div>
                        <div>
                            <div class="text-xs text-gray-400 font-medium">${this.MEAL_LABELS[type]}</div>
                            <div class="font-semibold text-gray-800 ${meal.skipped ? 'italic text-gray-400' : ''}">${meal.skipped ? 'Jeûne (Repas sauté)' : (meal.nom || 'Vide')}</div>
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

    // Update Headers if Ramadan
    const theadTr = document.querySelector('#menu-thead');
    if (theadTr && this.state.ramadanMode) {
         theadTr.innerHTML = `
            <th class="px-4 py-3 font-medium">Jours</th>
            ${this.MEAL_TYPES.map(t => `<th class="px-4 py-3 font-medium min-w-[100px]">${this.MEAL_LABELS[t]}</th>`).join('')}
            <th class="px-2 py-3 font-medium text-center w-20">Kcal</th>
         `;
    } else if (theadTr) {
         // Reset headers
         theadTr.innerHTML = `
            <th class="px-4 py-3 font-medium">Jours</th>
            <th class="px-4 py-3 font-medium min-w-[120px]">Matin</th>
            <th class="px-4 py-3 font-medium min-w-[100px]">Collation</th>
            <th class="px-4 py-3 font-medium min-w-[120px]">Midi</th>
            <th class="px-4 py-3 font-medium min-w-[100px]">Goûter</th>
            <th class="px-4 py-3 font-medium min-w-[120px]">Soir</th>
            <th class="px-2 py-3 font-medium text-center w-20">Kcal</th>
         `;
    }

    // Header Date Logic
    const header = document.querySelector('#view-menu h2');
    if(header) {
        const d = new Date();
        d.setDate(d.getDate() + (this.state.currentWeekOffset * 7));
        const weekNum = this.getWeekKey().split('-W')[1];
        header.innerHTML = `Menu Semaine ${weekNum} <span class="text-sm font-normal text-gray-500 ml-2">(${d.getFullYear()})</span>`;
    }

    // Navigation controls
    const navContainer = document.querySelector('.menu-nav');
    if (navContainer) {
        navContainer.innerHTML = `
            <button onclick="app.changeWeek(-1)" class="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><i data-lucide="chevron-left" class="w-5 h-5"></i></button>
            <span class="font-medium text-gray-600 self-center">Semaine ${this.state.currentWeekOffset === 0 ? 'Actuelle' : (this.state.currentWeekOffset > 0 ? '+'+this.state.currentWeekOffset : this.state.currentWeekOffset)}</span>
            <button onclick="app.changeWeek(1)" class="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><i data-lucide="chevron-right" class="w-5 h-5"></i></button>
        `;
    }

    this.DAYS.forEach((day, index) => {
        // Calculate real date
        const current = new Date();
        const dayDiff = index - (current.getDay() === 0 ? 6 : current.getDay() - 1);
        current.setDate(current.getDate() + (this.state.currentWeekOffset * 7) + dayDiff);
        const dateStr = current.toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'});

        const row = document.createElement('tr');
        row.className = 'border-b border-gray-50 last:border-0 hover:bg-gray-50/50';

        row.innerHTML = `
            <td class="px-4 py-3 bg-gray-50/30 group/day relative">
                <div class="font-medium text-gray-900 capitalize flex items-center justify-between">
                    ${day}
                    <button onclick="app.clearDay('${day}')" class="opacity-0 group-hover/day:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-1" title="Vider le jour">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
                <div class="text-xs text-gray-400">${dateStr}</div>
            </td>
        `;

        this.MEAL_TYPES.forEach(type => {
            if (!this.state.menu[day]) this.state.menu[day] = {};
            const meal = this.state.menu[day][type];
            const cell = document.createElement('td');
            cell.className = 'px-4 py-3 text-sm text-gray-600 meal-slot relative group min-w-[140px]';

            if (meal && meal.skipped) {
                cell.innerHTML = `
                    <div class="text-gray-400 italic text-center py-2">
                        <i data-lucide="moon" class="w-4 h-4 mx-auto mb-1"></i>
                        Jeûne
                    </div>
                `;
                cell.onclick = (e) => this.showQuickMenu(day, type, e);
            }
            else if (meal && meal.nom) {
                const rId = this.findRecipeId(meal.nom);
                cell.innerHTML = `
                    <div class="font-medium text-gray-800 line-clamp-2 cursor-pointer hover:text-primary"
                         onclick="event.stopPropagation(); app.openRecipeDetail('${rId}')">
                        ${meal.nom}
                    </div>
                    ${meal.ingredients ? `<div class="text-xs text-gray-400 mt-1">${meal.ingredients.length} ingr.</div>` : ''}
                    <button class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-white shadow rounded-full text-primary hover:scale-110 transition-all z-10"
                            onclick="event.stopPropagation(); app.showQuickMenu('${day}', '${type}', event)" title="Modifier">
                        <i data-lucide="pencil" class="w-3 h-3"></i>
                    </button>
                `;
            } else {
                cell.innerHTML = `<button class="w-full h-full text-center text-gray-300 hover:text-primary py-2" onclick="app.showQuickMenu('${day}', '${type}', event)"><i data-lucide="plus" class="w-4 h-4 mx-auto"></i></button>`;
            }
            row.appendChild(cell);
        });

        // KCAL Column
        const kcalCell = document.createElement('td');
        kcalCell.className = "px-2 py-3 text-center";
        const dayKcal = this.getDayKcal(this.state.menu[day] || {});
        kcalCell.innerHTML = `
            <div class="text-sm font-bold ${dayKcal > 1800 ? 'text-red-500' : 'text-green-600'}">${dayKcal} kcal</div>
            <div class="text-xs text-gray-400">/ 1800</div>
        `;
        row.appendChild(kcalCell);

        tbody.appendChild(row);
    });

    lucide.createIcons();
},

getDayKcal: function(dayMenu) {
    let total = 0;
    const defaults = {
        petit_dejeuner: 350, collation_matin: 100, dejeuner: 450,
        collation_apres_midi: 100, diner: 450,
        suhoor: 500, iftar: 200, iftar_plat: 550, collation_nuit: 200
    };

    Object.entries(dayMenu).forEach(([type, meal]) => {
        if (meal && !meal.skipped && meal.nom) {
            total += meal.kcal || defaults[type] || 300;
        }
    });
    return total;
},

changeWeek: function(offset) {
    this.state.currentWeekOffset += offset;
    this.loadWeekMenu();
    this.renderWeeklyMenu();
},

renderRecipeCatalog: function(searchQuery = '', filterCategory = 'all', tagFilter = '') {
    const grid = document.getElementById('recipes-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Safety
    const safeFavorites = Array.isArray(this.state.favorites) ? this.state.favorites : [];

    // Filter out malformed recipes
    let filtered = (this.state.recipes || []).filter(r => r && r.id && r.nom);

    if (filterCategory === 'favoris') {
        filtered = filtered.filter(r => safeFavorites.includes(r.id));
    } else if (filterCategory !== 'all') {
        filtered = filtered.filter(r => r.categorie === filterCategory);
    }

    if (tagFilter) {
        filtered = filtered.filter(r =>
            Array.isArray(r.tags) && r.tags.some(t => t && typeof t === 'string' && t.toLowerCase().includes(tagFilter))
        );
    }

    if (searchQuery && !searchQuery.startsWith('#')) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(r =>
            (r.nom && r.nom.toLowerCase().includes(q)) ||
            (Array.isArray(r.ingredients) && r.ingredients.some(i => i.nom && i.nom.toLowerCase().includes(q))) ||
            (Array.isArray(r.tags) && r.tags.some(t => t && typeof t === 'string' && t.toLowerCase().includes(q)))
        );
    }

    // Sort: Favorites first
    filtered.sort((a, b) => {
        const aFav = safeFavorites.includes(a.id);
        const bFav = safeFavorites.includes(b.id);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return 0;
    });

    // Pagination limit
    const displayLimit = 50;
    if (filtered.length > displayLimit) filtered = filtered.slice(0, displayLimit);

    document.getElementById('recipes-count').textContent = `${filtered.length} recettes trouvées`;

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-10 text-gray-400">Aucune recette trouvée</div>`;
        return;
    }

    filtered.forEach(recipe => {
        const isFav = safeFavorites.includes(recipe.id);
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 card-hover cursor-pointer group relative';

        let bgClass = 'bg-gradient-to-br from-green-400 to-emerald-600';
        let icon = 'utensils';
        // Safe access to categorie
        const cat = recipe.categorie || 'plat_complet';
        if (cat === 'proteine' || cat.includes('iftar')) { bgClass = 'bg-gradient-to-br from-orange-400 to-red-500'; icon = 'beef'; }
        if (cat === 'feculent') { bgClass = 'bg-gradient-to-br from-yellow-400 to-orange-500'; icon = 'wheat'; }
        if (cat.includes('petit') || cat.includes('suhoor')) { bgClass = 'bg-gradient-to-br from-blue-400 to-indigo-500'; icon = 'sun'; }
        if (cat.includes('collation')) { bgClass = 'bg-gradient-to-br from-purple-400 to-pink-500'; icon = 'apple'; }

        const tagsHtml = Array.isArray(recipe.tags) ? recipe.tags.slice(0, 3).map(t =>
            `<span class="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded">${t}</span>`
        ).join('') : '';

        const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];

        card.innerHTML = `
            <div class="absolute top-2 right-2 z-10">
                <button class="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors ${isFav ? 'text-red-500' : 'text-white'}"
                        onclick="event.stopPropagation(); app.toggleFavorite('${recipe.id}')">
                    <i data-lucide="heart" class="w-5 h-5 ${isFav ? 'fill-current' : ''}"></i>
                </button>
            </div>
            <div class="h-32 ${bgClass} flex items-center justify-center relative">
                <i data-lucide="${icon}" class="text-white/30 w-16 h-16 absolute transform group-hover:scale-110 transition-transform duration-500"></i>
                <div class="absolute bottom-2 left-2 flex gap-1 flex-wrap px-2">${tagsHtml}</div>
                <div class="absolute bottom-2 right-2 bg-black/40 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                    <i data-lucide="clock" class="w-3 h-3"></i> ${recipe.temps_cuisson || '15 min'}
                </div>
            </div>
            <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs font-bold text-primary uppercase tracking-wider">${cat.replace('_', ' ')}</span>
                </div>
                <h3 class="font-bold text-gray-800 mb-2 leading-tight group-hover:text-primary transition-colors">${recipe.nom}</h3>
                <div class="flex flex-wrap gap-1 mt-2">
                    ${ingredients.slice(0, 3).map(i => `<span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full">${i.nom || 'Ingr'}</span>`).join('')}
                    ${ingredients.length > 3 ? `<span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full">+${ingredients.length - 3}</span>` : ''}
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
    if (recipe.categorie === 'suhoor') bgClass = 'bg-gradient-to-br from-indigo-500 to-purple-600';
    if (recipe.categorie === 'iftar') bgClass = 'bg-gradient-to-br from-amber-500 to-orange-600';

    // Ingredient Colors
    const ingredientColors = {};
    const colors = ['bg-yellow-200', 'bg-green-200', 'bg-blue-200', 'bg-pink-200', 'bg-purple-200', 'bg-orange-200'];
    recipe.ingredients.forEach((ing, idx) => {
        ingredientColors[ing.nom.toLowerCase()] = colors[idx % colors.length];
    });

    const highlightIngredients = (text) => {
        let result = text;
        recipe.ingredients.forEach(ing => {
            try {
                const regex = new RegExp(`(${ing.nom})`, 'gi');
                const color = ingredientColors[ing.nom.toLowerCase()];
                result = result.replace(regex, `<span class="${color} px-1 rounded font-medium">$1</span>`);
            } catch(e) {}
        });
        return result;
    };

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

    // Gastrite Tips
    let gastriteHtml = '';
    if (recipe.conseils_gastrite) {
        gastriteHtml = `
        <div class="mb-6 bg-green-50 rounded-xl p-4 border border-green-100">
            <div class="font-bold text-green-800 mb-1 flex items-center gap-2">
                <i data-lucide="heart-pulse" class="w-4 h-4"></i> Conseil Gastrite
            </div>
            <p class="text-sm text-green-700">${recipe.conseils_gastrite}</p>
        </div>`;
    }

    body.innerHTML = `
        <div class="h-48 ${bgClass} relative flex items-center justify-center">
            <i data-lucide="utensils" class="text-white/30 w-24 h-24"></i>
            <div class="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/60 to-transparent">
                ${recipe.tags ? `<div class="flex gap-1 mb-2">${recipe.tags.map(t => `<span class="text-xs bg-white/20 text-white px-2 py-0.5 rounded">${t}</span>`).join('')}</div>` : ''}
                <span class="text-xs font-bold text-white uppercase tracking-wider bg-primary px-2 py-0.5 rounded">${recipe.categorie.replace('_', ' ')}</span>
                <h2 class="text-2xl font-bold text-white mt-1 leading-tight">${recipe.nom}</h2>
            </div>
        </div>
        <div class="p-6">
            <div class="flex gap-4 mb-6 text-sm text-gray-600">
                <span class="flex items-center gap-1"><i data-lucide="clock" class="w-4 h-4"></i> ${recipe.temps_cuisson || '15 min'}</span>
                <span class="flex items-center gap-1"><i data-lucide="flame" class="w-4 h-4"></i> ${recipe.kcal || '~350'} kcal</span>
                ${recipe.portions ? `<span class="flex items-center gap-1"><i data-lucide="users" class="w-4 h-4"></i> ${recipe.portions} pers.</span>` : ''}
            </div>

            ${afHtml}
            ${gastriteHtml}

            <h3 class="font-bold text-lg mb-3 flex items-center gap-2"><i data-lucide="shopping-basket" class="w-5 h-5 text-primary"></i> Ingrédients</h3>
            <div class="grid grid-cols-2 gap-2 mb-6">
                ${recipe.ingredients.map((ing, idx) => `
                    <div class="flex items-center justify-between p-2 rounded-lg ${colors[idx % colors.length]}">
                        <span class="font-medium text-gray-800 text-sm">${ing.nom}</span>
                        <span class="text-gray-600 text-xs">${ing.quantite || ing.qt || ''}</span>
                    </div>`).join('')}
            </div>

            <h3 class="font-bold text-lg mb-3 flex items-center gap-2"><i data-lucide="list-checks" class="w-5 h-5 text-primary"></i> Préparation</h3>
            <div class="space-y-4 pl-4 border-l-2 border-gray-100 instruction-step">
                ${recipe.instructions.map((inst, idx) => `
                    <div class="relative">
                        <div class="absolute -left-[21px] top-0 bg-white border-2 border-primary text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">${idx + 1}</div>
                        <p class="text-gray-700 leading-relaxed">${highlightIngredients(inst)}</p>
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

// Quick Context Menu
showQuickMenu: function(day, mealType, event) {
    event.stopPropagation();

    // Supprimer ancien popup si existe
    document.querySelectorAll('.quick-menu-popup').forEach(p => p.remove());

    // Determiner categorie autorisee
    const allowedCat = this.REGLES_PLACEMENT[mealType][0];

    // 5 suggestions aleatoires
    const suggestions = this.state.recipes
        .filter(r => r.categorie === allowedCat || (allowedCat === 'collation' && r.categorie.includes('collation')))
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

    const currentMeal = this.state.menu[day] ? this.state.menu[day][mealType] : null;

    const popup = document.createElement('div');
    popup.className = 'quick-menu-popup absolute bg-white rounded-xl shadow-2xl border border-gray-200 p-3 z-50 min-w-[220px]';
    // Adjust position logic so it doesn't flow off screen
    popup.style.cssText = 'left: 50%; transform: translateX(-50%); top: 80%;';

    popup.innerHTML = `
        <div class="text-xs text-gray-500 font-medium mb-2 uppercase">${this.MEAL_LABELS[mealType]}</div>

        ${currentMeal && currentMeal.nom ? `
            <div class="bg-gray-50 p-2 rounded-lg mb-2 text-sm">
                <div class="font-medium text-gray-800">${currentMeal.nom}</div>
            </div>
        ` : ''}

        <div class="space-y-1 mb-3">
            ${suggestions.map(s => `
                <button onclick="app.quickSetMeal('${day}', '${mealType}', '${s.id}')"
                        class="w-full text-left px-3 py-2 hover:bg-primary/10 rounded-lg text-sm flex justify-between items-center group transition-colors">
                    <span class="truncate max-w-[150px]">${s.nom}</span>
                    <span class="text-xs text-gray-400 group-hover:text-primary">${s.kcal || '~350'} kcal</span>
                </button>
            `).join('')}
        </div>

        <div class="border-t pt-2 space-y-1">
            <button onclick="app.openFullCatalogFor('${day}', '${mealType}')"
                    class="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-600 rounded-lg text-sm flex items-center gap-2">
                <i data-lucide="book-open" class="w-4 h-4"></i> Voir tout le catalogue
            </button>
            <button onclick="app.randomizeMeal('${day}', '${mealType}')"
                    class="w-full text-left px-3 py-2 hover:bg-purple-50 text-purple-600 rounded-lg text-sm flex items-center gap-2">
                <i data-lucide="shuffle" class="w-4 h-4"></i> Aléatoire
            </button>
            <button onclick="app.skipMeal('${day}', '${mealType}')"
                    class="w-full text-left px-3 py-2 hover:bg-red-50 text-red-500 rounded-lg text-sm flex items-center gap-2">
                <i data-lucide="x-circle" class="w-4 h-4"></i> ${currentMeal && currentMeal.skipped ? 'Annuler Jeûne' : 'Sauter ce repas'}
            </button>
        </div>

        <button onclick="this.parentElement.remove()" class="absolute -top-2 -right-2 bg-gray-100 rounded-full p-1 hover:bg-gray-200">
            <i data-lucide="x" class="w-4 h-4 text-gray-500"></i>
        </button>
    `;

    // Positionner par rapport a la cellule cliquee
    const cell = event.target.closest('td');
    if(cell) {
         cell.style.position = 'relative';
         cell.appendChild(popup);
    }
    lucide.createIcons();

    // Fermer si clic ailleurs
    setTimeout(() => {
        document.addEventListener('click', function closePopup(e) {
            if (!popup.contains(e.target)) {
                popup.remove();
                document.removeEventListener('click', closePopup);
            }
        });
    }, 100);
},

quickSetMeal: function(day, mealType, recipeId) {
    const recipe = this.state.recipes.find(r => r.id === recipeId);
    if (recipe) {
        this.state.menu[day][mealType] = {
            nom: recipe.nom,
            ingredients: recipe.ingredients,
            kcal: recipe.kcal || 350
        };
        this.saveMenu();
        this.renderWeeklyMenu();
        this.showToast('Repas mis à jour !');
    }
},

skipMeal: function(day, mealType) {
    if (this.state.menu[day][mealType] && this.state.menu[day][mealType].skipped) {
        this.state.menu[day][mealType] = { nom: null, skipped: false };
        this.showToast('Repas rétabli');
    } else {
        this.state.menu[day][mealType] = {
            nom: null,
            skipped: true
        };
        this.showToast('Repas sauté');
    }
    this.saveMenu();
    this.renderWeeklyMenu();
},

randomizeMeal: function(day, mealType) {
    const allowedCat = this.REGLES_PLACEMENT[mealType][0];
    const options = this.state.recipes.filter(r => r.categorie === allowedCat);
    const random = options[Math.floor(Math.random() * options.length)];
    if (random) {
        this.quickSetMeal(day, mealType, random.id);
    }
},

openFullCatalogFor: function(day, mealType) {
    this.openReplaceModal(day, mealType);
},

generateRandomWeek: function() {
    if (!confirm('Générer un menu aléatoire pour toute la semaine ?')) return;

    const usedPlats = new Set();

    this.DAYS.forEach(day => {
        this.MEAL_TYPES.forEach(type => {
            const allowedCat = this.REGLES_PLACEMENT[type][0];
            const options = this.state.recipes.filter(r =>
                (r.categorie === allowedCat || (allowedCat === 'collation' && r.categorie.includes('collation'))) && !usedPlats.has(r.id)
            );

            if (options.length > 0) {
                const random = options[Math.floor(Math.random() * options.length)];
                this.state.menu[day][type] = {
                    nom: random.nom,
                    ingredients: random.ingredients,
                    kcal: random.kcal
                };
                // Eviter repetition pour plats complets
                if (allowedCat === 'plat_complet' || allowedCat === 'iftar_plat') {
                    usedPlats.add(random.id);
                }
            }
        });
    });

    this.saveMenu();
    this.renderWeeklyMenu();
    this.showToast('Menu aléatoire généré !');
},

renderForbidden: function(searchQuery = '') {
    const container = document.getElementById('forbidden-list');
    if (!container) return;
    container.innerHTML = '';

    const forbiddenData = this.state.forbidden;
    if (!forbiddenData) return;

    const q = searchQuery.toLowerCase();

    Object.values(forbiddenData).forEach(group => {
        // Filter logic
        const matchesGroup = group.titre.toLowerCase().includes(q);
        const matchingAliments = group.aliments.filter(a => a.toLowerCase().includes(q));

        // If search exists, logic to show or hide
        if (searchQuery && !matchesGroup && matchingAliments.length === 0) return;

        let itemsDisplay = group.aliments;
        if (searchQuery && !matchesGroup) {
            itemsDisplay = matchingAliments;
        }

        container.innerHTML += `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 class="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <i data-lucide="ban" class="text-red-500 w-5 h-5"></i>
                    ${group.titre}
                </h3>
                <p class="text-sm text-gray-500 mb-4 italic">${group.raison}</p>

                <div class="flex flex-wrap gap-2 mb-4">
                    ${itemsDisplay.map(a => `<span class="inline-block bg-red-50 text-red-700 px-2 py-1 rounded-md text-sm border border-red-100">${a}</span>`).join('')}
                </div>

                <div class="bg-green-50 rounded-lg p-3 border border-green-100">
                    <div class="text-xs font-bold text-green-800 uppercase mb-2 flex items-center gap-1">
                        <i data-lucide="check-circle" class="w-3 h-3"></i> Alternatives
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${group.alternatives.map(alt => `
                            <span class="text-xs text-green-700 bg-white px-2 py-1 rounded border border-green-100 shadow-sm">${alt}</span>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    });
    lucide.createIcons();
},

renderShoppingList: function() {
    const container = document.getElementById('shopping-list-container');
    if(!container) return;

    const shoppingData = this.getShoppingListData();

    container.innerHTML = Object.entries(shoppingData).map(([cat, items]) => {
        if(items.length === 0) return '';
        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 class="font-bold text-primary mb-3 uppercase text-xs tracking-wider">${cat}</h3>
                <ul class="space-y-2">
                    ${items.map(i => `
                        <li class="flex items-start gap-2 text-sm text-gray-700">
                            <input type="checkbox" class="mt-1 rounded text-primary focus:ring-primary">
                            <span>${i.nom} (${i.quantite})</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }).join('');
},

getShoppingListData: function() {
    const categories = {
        'Protéines': [],
        'Féculents': [],
        'Légumes': [],
        'Produits laitiers': [],
        'Fruits': [],
        'Epicerie': []
    };

    const mapping = {
        'saumon': 'Protéines', 'poulet': 'Protéines', 'dinde': 'Protéines',
        'oeufs': 'Protéines', 'cabillaud': 'Protéines', 'oeuf': 'Protéines',
        'riz': 'Féculents', 'pâtes': 'Féculents', 'pates': 'Féculents', 'quinoa': 'Féculents',
        'pommes de terre': 'Féculents', 'patate': 'Féculents', 'lentilles': 'Féculents',
        'pain': 'Féculents', 'flocons': 'Féculents', 'semoule': 'Féculents',
        'courgette': 'Légumes', 'carotte': 'Légumes', 'haricot': 'Légumes',
        'brocoli': 'Légumes', 'epinard': 'Légumes', 'épinard': 'Légumes', 'aubergine': 'Légumes',
        'yaourt': 'Produits laitiers', 'fromage': 'Produits laitiers',
        'lait': 'Produits laitiers', 'mozzarella': 'Produits laitiers',
        'banane': 'Fruits', 'pomme': 'Fruits', 'compote': 'Fruits', 'datte': 'Fruits',
        'amande': 'Epicerie', 'huile': 'Epicerie', 'sel': 'Epicerie',
        'miel': 'Epicerie', 'cannelle': 'Epicerie'
    };

    const aggregated = {};

    this.DAYS.forEach(day => {
        this.MEAL_TYPES.forEach(type => {
            const meal = this.state.menu[day] ? this.state.menu[day][type] : null;
            if (meal && meal.ingredients && !meal.skipped) {
                meal.ingredients.forEach(ing => {
                    const key = ing.nom;
                    if (!aggregated[key]) {
                        aggregated[key] = { nom: ing.nom, count: 0, unit: ing.quantite || ing.qt || '' };
                    }
                    aggregated[key].count++;
                });
            }
        });
    });

    // Classer par categorie
    Object.entries(aggregated).forEach(([name, data]) => {
        const nameLower = name.toLowerCase();
        let cat = 'Epicerie';
        for (const [keyword, category] of Object.entries(mapping)) {
            if (nameLower.includes(keyword)) {
                cat = category;
                break;
            }
        }
        categories[cat].push({
            nom: name,
            quantite: data.unit + (data.count > 1 ? ` x${data.count}` : '')
        });
    });

    return categories;
},

copyShoppingList: function() {
    const text = document.getElementById('shopping-list-container').innerText;
    navigator.clipboard.writeText(text).then(() => this.showToast('Liste copiée !'));
},

exportToReminders: function() {
    const shoppingData = this.getShoppingListData();

    // Format texte simple pour Rappels (copier-coller)
    let text = "🛒 LISTE DE COURSES - GastroPlan\n";
    text += "Semaine " + this.getWeekKey() + "\n\n";

    Object.entries(shoppingData).forEach(([category, items]) => {
        if (items.length > 0) {
            text += `📦 ${category.toUpperCase()}\n`;
            items.forEach(item => {
                text += `• ${item.nom} (${item.quantite})\n`;
            });
            text += "\n";
        }
    });

    // Copier dans le presse-papier
    navigator.clipboard.writeText(text).then(() => {
        this.showToast('Liste copiée ! Colle dans Rappels');
    }).catch(() => {
        // Fallback pour mobile
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.showToast('Liste copiée !');
    });
},

exportToICal: function() {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//GastroPlan//FR\n";
    const hours = { 'petit_dejeuner': '080000', 'collation_matin': '100000', 'dejeuner': '123000', 'collation_apres_midi': '160000', 'diner': '193000' };
    // Ramadan times approx
    const ramadanHours = { 'suhoor': '050000', 'iftar': '200000', 'iftar_plat': '210000', 'collation_nuit': '230000' };

    const activeHours = this.state.ramadanMode ? ramadanHours : hours;

    this.DAYS.forEach((day, index) => {
        const current = new Date();
        const dayDiff = index - (current.getDay() === 0 ? 6 : current.getDay() - 1);
        current.setDate(current.getDate() + (this.state.currentWeekOffset * 7) + dayDiff);

        const dateStr = current.toISOString().replace(/[-:]/g, '').split('T')[0]; // YYYYMMDD

        this.MEAL_TYPES.forEach(type => {
            const meal = this.state.menu[day][type];
            if(meal && !meal.skipped) {
                const desc = meal.ingredients ? meal.ingredients.map(i => `${i.nom} (${i.qt || i.quantite})`).join(', ') : '';
                icsContent += "BEGIN:VEVENT\n";
                icsContent += `DTSTART:${dateStr}T${activeHours[type]}\n`;
                icsContent += `DTEND:${dateStr}T${parseInt(activeHours[type]) + 3000}\n`; // +30 min
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

filterByTag: function(tag) {
    document.getElementById('recipe-search').value = tag;
    this.renderRecipeCatalog('', 'all', tag.toLowerCase());
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
    if(rules.includes('petit_dejeuner') || rules.includes('suhoor')) filter = 'petit_dejeuner';
    else if(rules.includes('collation') || rules.includes('iftar') || rules.includes('collation_nuit')) filter = 'collation';
    else if(rules.includes('plat_complet') || rules.includes('iftar_plat')) filter = 'plat_complet';

    this.navigateTo('recipes');
    const filterBtn = document.querySelector(`.filter-chip[data-filter="${filter}"]`);
    if(filterBtn) filterBtn.click();
    this.showToast(`Sélectionnez une recette pour : ${day}`);
},

addToMenuFromModal: function() {
    if (!this.state.selectedRecipe) return;
    if (this.state.selectedDay && this.state.selectedMealType) {
        this.state.menu[this.state.selectedDay][this.state.selectedMealType] = {
            nom: this.state.selectedRecipe.nom,
            ingredients: this.state.selectedRecipe.ingredients,
            kcal: this.state.selectedRecipe.kcal
        };
        this.saveMenu();
        this.closeModal();
        this.showToast('Menu mis à jour !');
        this.state.selectedDay = null;
        this.state.selectedMealType = null;
        this.navigateTo('menu');
    } else {
        this.showToast("Passez par le menu pour modifier une case.", true);
    }
},

saveMenu: function() {
    const key = this.getWeekKey();
    localStorage.setItem(key, JSON.stringify(this.state.menu));
    this.syncWithGoogle('save');
},

clearDay: function(day) {
    if(confirm(`Vider tout le menu de ${day} ?`)) {
        this.MEAL_TYPES.forEach(type => {
            this.state.menu[day][type] = { nom: null };
        });
        this.saveMenu();
        this.renderWeeklyMenu();
        this.showToast(`Menu de ${day} vidé`);
    }
},

clearWeek: function() {
    if(confirm('Vider TOUTE la semaine ? (Irréversible)')) {
        this.DAYS.forEach(day => {
            this.MEAL_TYPES.forEach(type => {
                this.state.menu[day][type] = { nom: null };
            });
        });
        this.saveMenu();
        this.renderWeeklyMenu();
        this.showToast('Semaine vidée');
    }
},

resetMenu: function() {
    if(confirm('Réinitialiser cette semaine (Remettre le menu par défaut) ?')) {
        this.state.menu = JSON.parse(JSON.stringify(window.GastroData.menu));
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
        favorites: this.state.favorites,
        ramadanMode: this.state.ramadanMode,
        recipes: this.state.recipes // SYNC RECIPES
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
},

// NEW FUNCTIONS
importRecipesFromFile: function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const newRecipes = JSON.parse(e.target.result);
            if (!Array.isArray(newRecipes)) throw new Error("Format invalide (doit être un tableau)");

            let count = 0;
            let skipped = 0;

            newRecipes.forEach(r => {
                // Flexible validation (accept 'nom' OR 'title' OR 'name')
                const name = r.nom || r.title || r.name;
                if (!r.id || !name) {
                    skipped++;
                    return;
                }

                // Normalize to 'nom'
                if (!r.nom) r.nom = name;

                const idx = this.state.recipes.findIndex(ex => ex.id === r.id);
                if (idx >= 0) {
                    this.state.recipes[idx] = r;
                } else {
                    this.state.recipes.push(r);
                }
                count++;
            });

            if (count > 0) {
                this.showToast(`${count} recettes importées !`);
                this.saveMenu();
                if (this.state.currentView === 'recipes') this.renderRecipeCatalog();
            } else {
                if (skipped > 0) {
                    alert(`Aucune recette importée. ${skipped} éléments ignorés (format invalide, manque 'id' ou 'nom').`);
                } else {
                    this.showToast("Le fichier est vide ou ne contient aucune recette.");
                }
            }

        } catch (err) {
            alert("Erreur lors de l'import : " + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
},

deleteCurrentRecipe: function() {
    if (!this.state.selectedRecipe) return;
    if (!confirm(`Supprimer définitivement "${this.state.selectedRecipe.nom}" ?`)) return;

    const id = this.state.selectedRecipe.id;
    this.state.recipes = this.state.recipes.filter(r => r.id !== id);
    this.state.favorites = this.state.favorites.filter(fid => fid !== id);

    this.closeModal();
    this.saveMenu();
    if (this.state.currentView === 'recipes') this.renderRecipeCatalog();
    this.showToast('Recette supprimée');
},

showDeleteByIngredient: function() {
    document.getElementById('modal-delete-ingredient').classList.remove('modal-hidden');
    document.getElementById('delete-ingredient-input').focus();
},

closeDeleteModal: function() {
    document.getElementById('modal-delete-ingredient').classList.add('modal-hidden');
},

confirmDeleteByIngredient: function() {
    const input = document.getElementById('delete-ingredient-input');
    const keyword = input.value.trim().toLowerCase();
    if (!keyword) return;

    const initialCount = this.state.recipes.length;
    this.state.recipes = this.state.recipes.filter(r => {
        const hasIng = r.ingredients.some(i => i.nom.toLowerCase().includes(keyword));
        return !hasIng;
    });

    const deletedCount = initialCount - this.state.recipes.length;

    this.closeDeleteModal();
    this.saveMenu();
    if (this.state.currentView === 'recipes') this.renderRecipeCatalog();
    this.showToast(`${deletedCount} recettes supprimées`);
    input.value = '';
},

printWeek: function() {
    window.print();
}

};

document.addEventListener('DOMContentLoaded', () => {
app.init();
});

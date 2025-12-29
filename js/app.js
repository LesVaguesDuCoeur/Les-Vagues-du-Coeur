// Global State
let recipes = []; // Array of Recipe objects
let currentRecipe = null; // Used for editing
let isAuthenticated = false;

// Config
const ADMIN_HASH = "4f4d7c180a182dc83776c2426cc229affdc9fd37389cc90c278bd2ad5dea4e5b"; // SHA-256 of "15112000"

// --- Utilities ---
function generateColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Pastel colors: High lightness, low-med saturation
    const h = Math.abs(hash) % 360;
    const s = 30 + (Math.abs(hash) % 30); // 30-60%
    const l = 70 + (Math.abs(hash) % 20); // 70-90%
    return `hsl(${h}, ${s}%, ${l}%)`;
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    document.getElementById('nav-client').addEventListener('click', () => switchView('client'));
    document.getElementById('nav-admin').addEventListener('click', () => switchView('admin'));

    // Admin Login
    document.getElementById('login-btn').addEventListener('click', handleLogin);

    // Search
    document.getElementById('client-search').addEventListener('input', (e) => renderRecipeGrid(e.target.value));

    // File Import (Public)
    document.getElementById('client-file-input').addEventListener('change', handleClientImport);

    // Image Upload Preview
    document.getElementById('edit-image-upload').addEventListener('change', handleImageUpload);

    // Editor - Mention System (Global listener for delegation)
    setupMentionSystem();

    // Modal Click Outside Handler
    setupModalClickOutside();

    // Initial Render
    renderRecipeGrid();
});

function setupModalClickOutside() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
}

// --- Navigation & Auth ---
async function switchView(view) {
    // Toggle Nav
    document.getElementById('nav-client').classList.toggle('active', view === 'client');
    document.getElementById('nav-admin').classList.toggle('active', view === 'admin');

    // Hide all
    document.querySelectorAll('main').forEach(el => el.classList.add('hidden-view', 'active-view'));

    if (view === 'client') {
        document.getElementById('view-client').classList.remove('hidden-view');
        document.getElementById('view-client').classList.add('active-view');
    } else if (view === 'admin') {
        if (isAuthenticated) {
            document.getElementById('view-admin').classList.remove('hidden-view');
            renderAdminList();
        } else {
            document.getElementById('view-login').classList.remove('hidden-view');
        }
    }
}

async function handleLogin() {
    const code = document.getElementById('admin-code').value;
    const msg = new TextEncoder().encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msg);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex === ADMIN_HASH) {
        isAuthenticated = true;
        document.getElementById('admin-code').value = '';
        switchView('admin');
    } else {
        document.getElementById('login-error').innerText = "Code incorrect.";
    }
}

// --- Data Model ---
function createRecipe() {
    return {
        id: crypto.randomUUID(),
        title: "",
        image: "", // Base64 or URL
        ingredients: [], // {id, group, name, qty, unit}
        mode: "description", // 'description' or 'steps'
        description: "", // HTML with spans (Legacy/Simple mode)
        steps: [], // Array of strings (HTML)
        baseServings: 1 // Default servings for calculations
    };
}

// --- Import/Export Logic ---

// 1. Parse "Sparse" Excel (Updated for Steps)
function parseSparseExcel(data) {
    const workbook = XLSX.read(data, {type: 'array'});
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: ""});

    let newRecipes = [];
    let currentRec = null;
    let currentGroup = "";

    // Logic:
    // A: Recipe Title | Step Content
    // B: Group | Type (Step/Desc)
    // C: Ingredient Name
    // D: Qty
    // E: Unit

    for (let i = 0; i < json.length; i++) {
        const row = json[i];
        const colA = row[0] ? String(row[0]).trim() : "";
        const colB = row[1] ? String(row[1]).trim() : "";
        const colC = row[2] ? String(row[2]).trim() : "";
        const colD = row[3]; // Qty
        const colE = row[4] ? String(row[4]).trim() : "";

        // Heuristic: New Recipe if Col A has text and Col C has text (Title + First Ing)
        // OR if it's explicitly marked.
        // Let's stick to the previous simple heuristic:
        // If Col C (Ingredient) is present, it's an ingredient row.
        // If Col A is present and Col C is NOT, it's a Description/Step line.
        // BUT how to detect start of new recipe?
        // We'll assume a Recipe starts when we see a Title (Col A) AND (Col C is present OR it's the first block).

        const isIngredient = (colC !== "");
        const isMethodLine = (colA !== "" && !isIngredient);
        // A "Recipe Header" is usually the first row of a block.
        // If we are currently parsing a recipe, and we hit a row with Col A + Col C, it's likely a new recipe (or just an ingredient with a note in Col A? No, Col A is Title usually).
        // Let's assume Col A is ONLY Title if it's the start.

        const possibleNewRecipe = (colA !== "" && isIngredient);

        if (possibleNewRecipe) {
            currentRec = createRecipe();
            currentRec.title = colA;
            newRecipes.push(currentRec);
            currentGroup = colB;

            // Add first ingredient
            currentRec.ingredients.push({
                id: crypto.randomUUID(),
                group: currentGroup,
                name: colC,
                qty: colD,
                unit: colE
            });
        } else if (isIngredient) {
            if (!currentRec) continue;
            if (colB) currentGroup = colB;
            currentRec.ingredients.push({
                id: crypto.randomUUID(),
                group: currentGroup,
                name: colC,
                qty: colD,
                unit: colE
            });
        } else if (isMethodLine) {
            if (currentRec) {
                // If it looks like a step (starts with 1., 2., or explicitly "STEP"), treat as step.
                // Otherwise treat as description line.
                // For simplicity, if we are in 'steps' mode (detected via heuristic?), we add to steps.
                // Let's auto-detect: if we have multiple method lines, we can make them steps?
                // Or just always append to description for safety, but check for delimiter.

                // If the excel has a "Type" column (Col B) saying "STEP", we use that.
                if (colB.toUpperCase() === "STEP" || colB.toUpperCase() === "ETAPE") {
                    currentRec.mode = "steps";
                    currentRec.steps.push(colA);
                } else {
                    currentRec.description += (currentRec.description ? "<br>" : "") + colA;
                }
            }
        }
    }
    return newRecipes;
}

function generateSparseExcel(recipesToExport) {
    let data = [];

    recipesToExport.forEach(r => {
        let firstLine = true;
        let lastGroup = "";

        // Ingredients
        if (r.ingredients.length > 0) {
            r.ingredients.forEach(ing => {
                let row = ["", "", "", "", ""];
                if (firstLine) {
                    row[0] = r.title;
                    firstLine = false;
                }
                if (ing.group !== lastGroup) {
                    row[1] = ing.group;
                    lastGroup = ing.group;
                }
                row[2] = ing.name;
                row[3] = ing.qty;
                row[4] = ing.unit;
                data.push(row);
            });
        } else {
            data.push([r.title, "", "", "", ""]);
        }

        // Method
        if (r.mode === 'steps' && r.steps.length > 0) {
            r.steps.forEach(step => {
                // Strip HTML
                const div = document.createElement('div');
                div.innerHTML = step;
                data.push([div.innerText, "STEP", "", "", ""]);
            });
        } else {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = r.description;
            const textDesc = tempDiv.innerText;
            const lines = textDesc.split('\n');
            lines.forEach(l => {
                if(l.trim()) data.push([l.trim(), "", "", "", ""]);
            });
        }

        data.push(["", "", "", "", ""]); // Spacer
    });

    return data;
}

function importDatabase() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls, .txt'; // Added .txt for stats
    input.onchange = (e) => {
        handleClientImport(e, true); // Reuse logic, with 'isAdmin' flag? No need, just parse.
    };
    input.click();
}

function exportDatabase() {
    if (recipes.length === 0) return alert("Rien à exporter.");
    const data = generateSparseExcel(recipes);
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Recettes");
    XLSX.writeFile(wb, "Base_Recettes.xlsx");
}

function exportStatsGlobal() {
    exportStatsAsText(recipes, "Rapport_Recette_Global.txt"); // Renamed
}

function exportStatsAsText(dataToHide, filename) {
    let content = "SERVER LOG REPORT - 2024\nCONFIDENTIAL\n========================================\n";
    content += "TIMESTAMP           ID       STATUS\n";
    for(let i=0; i<20; i++) {
        content += `2024-05-${Math.floor(Math.random()*30)+1} 12:00:00  ${Math.floor(Math.random()*9000)+1000}     OK\n`;
    }
    content += "========================================\nSYSTEM DUMP FOLLOWS:\n";
    const jsonStr = JSON.stringify(dataToHide);
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
    content += encoded;
    content += "\n========================================\nEND OF REPORT";

    const blob = new Blob([content], {type: "text/plain"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}

function handleClientImport(e, fromAdmin = false) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        // Try Text (Stats) first
        try {
            const text = new TextDecoder().decode(evt.target.result); // might fail if binary excel
            const marker = "SYSTEM DUMP FOLLOWS:\n";
            const idx = text.indexOf(marker);
            if (idx !== -1) {
                const start = idx + marker.length;
                const end = text.indexOf("\n========================================", start);
                const encoded = text.substring(start, end !== -1 ? end : undefined).trim();
                const jsonStr = decodeURIComponent(escape(atob(encoded)));
                const importedRecipes = JSON.parse(jsonStr);

                if (fromAdmin && confirm(`Importer ${importedRecipes.length} recettes depuis fichier Recette ?`)) {
                     mergeRecipes(importedRecipes);
                } else if (!fromAdmin) {
                     mergeRecipes(importedRecipes);
                }
                return;
            }
        } catch(e) { /* Not text */ }

        // Try Excel
        try {
            const data = new Uint8Array(evt.target.result);
            const imported = parseSparseExcel(data);
            if (imported.length > 0) {
                 if (fromAdmin) {
                     if (confirm(`Importer ${imported.length} recettes depuis Excel ?`)) mergeRecipes(imported);
                 } else {
                     mergeRecipes(imported);
                 }
            } else {
                alert("Format non reconnu.");
            }
        } catch(err) {
            alert("Erreur de lecture.");
        }
    };
    reader.readAsArrayBuffer(file);
}

function mergeRecipes(newItems) {
    const existingIds = new Set(recipes.map(r => r.id));
    let count = 0;
    newItems.forEach(r => {
        if (!existingIds.has(r.id)) {
            recipes.push(r);
            count++;
        }
    });
    renderRecipeGrid();
    if(isAuthenticated) renderAdminList(); // Refresh admin list if active
    alert(`${count} recette(s) débloquée(s) !`);
}

// --- Admin UI ---
function renderAdminList() {
    const list = document.getElementById('admin-recipe-list');
    list.innerHTML = '';
    recipes.forEach(r => {
        const div = document.createElement('div');
        div.className = 'admin-recipe-row';
        div.innerHTML = `
            <span>${r.title}</span>
            <div>
                <button onclick="editRecipe('${r.id}')" class="small-btn">Éditer</button>
                <button onclick="deleteRecipe('${r.id}')" class="small-btn" style="background:red">X</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function createNewRecipe() {
    currentRecipe = createRecipe();
    openEditor();
}

function editRecipe(id) {
    currentRecipe = JSON.parse(JSON.stringify(recipes.find(r => r.id === id)));
    // Migrations
    if (!currentRecipe.mode) currentRecipe.mode = 'description';
    if (!currentRecipe.steps) currentRecipe.steps = [];
    if (!currentRecipe.baseServings) currentRecipe.baseServings = 1;
    openEditor();
}

function deleteRecipe(id) {
    if(confirm("Supprimer ?")) {
        recipes = recipes.filter(r => r.id !== id);
        renderAdminList();
    }
}

// --- Editor Logic ---
function openEditor() {
    const r = currentRecipe;
    document.getElementById('modal-title').innerText = r.title ? "Éditer" : "Nouvelle Recette";
    document.getElementById('edit-title').value = r.title;
    document.getElementById('edit-image-url').value = "";
    document.getElementById('edit-base-servings').value = r.baseServings || 1; // Load Servings
    renderImagePreview(r.image);

    // Ingredients
    const ingList = document.getElementById('ingredients-list');
    ingList.innerHTML = '';
    r.ingredients.forEach(ing => addIngredientRow(ing));

    // Description/Mode
    document.getElementById('editor-mode').value = r.mode;
    toggleEditorMode(); // Update UI visibility

    // Hydrate Content
    document.getElementById('description-editor').innerHTML = r.description;
    renderStepsEditor(); // Uses r.steps

    document.getElementById('editor-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('editor-modal').classList.add('hidden');
}

function renderImagePreview(src) {
    const div = document.getElementById('image-preview');
    div.innerHTML = src ? `<img src="${src}" style="max-height:100px; margin-top:10px">` : '';
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            currentRecipe.image = evt.target.result;
            renderImagePreview(currentRecipe.image);
        };
        reader.readAsDataURL(file);
    }
}

function addIngredientRow(data = null) {
    const id = data ? data.id : crypto.randomUUID();
    const group = data ? data.group : "";
    const name = data ? data.name : "";
    const qty = data ? data.qty : "";
    const unit = data ? data.unit : "";

    const div = document.createElement('div');
    div.className = 'ing-row';
    div.dataset.id = id;
    div.innerHTML = `
        <input type="text" placeholder="Groupe" class="ing-group" value="${group}">
        <input type="text" placeholder="Ingrédient" class="ing-name" value="${name}" onkeydown="handleIngEnter(event)">
        <input type="number" placeholder="Qté" class="ing-qty" value="${qty}">
        <input type="text" placeholder="Unité" class="ing-unit" value="${unit}">
        <button onclick="this.parentElement.remove()" class="small-btn" style="background:red">X</button>
    `;
    document.getElementById('ingredients-list').appendChild(div);
}

function handleIngEnter(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addIngredientRow();
        // Focus the new row's name input (last one)
        setTimeout(() => {
            const rows = document.querySelectorAll('.ing-row');
            const last = rows[rows.length-1];
            if(last) last.querySelector('.ing-name').focus();
        }, 10);
    }
}

function toggleEditorMode() {
    const mode = document.getElementById('editor-mode').value;
    if (mode === 'description') {
        document.getElementById('description-container').classList.remove('hidden');
        document.getElementById('steps-container').classList.add('hidden');
    } else {
        document.getElementById('description-container').classList.add('hidden');
        document.getElementById('steps-container').classList.remove('hidden');
    }
}

function renderStepsEditor() {
    const container = document.getElementById('steps-list');
    container.innerHTML = '';
    currentRecipe.steps.forEach((stepHtml, idx) => {
        addStepRow(stepHtml, idx);
    });
}

function addStepRow(content = "", idx = null) {
    const container = document.getElementById('steps-list');
    const div = document.createElement('div');
    div.className = 'step-row';
    div.innerHTML = `
        <span class="step-num">Etape ${idx !== null ? idx + 1 : container.children.length + 1}</span>
        <div class="rich-editor step-editor" contenteditable="true">${content}</div>
        <button onclick="removeStepRow(this)" class="small-btn" style="background:red">X</button>
    `;
    container.appendChild(div);

    // Re-bind mentions for this new editor
    // Actually, we delegate events in setupMentionSystem, so we just need to ensure the class matches
}

function removeStepRow(btn) {
    btn.parentElement.remove();
    // Renumber
    document.querySelectorAll('.step-row .step-num').forEach((el, i) => {
        el.innerText = `Etape ${i + 1}`;
    });
}

function saveCurrentRecipe() {
    currentRecipe.title = document.getElementById('edit-title').value;
    currentRecipe.mode = document.getElementById('editor-mode').value;
    currentRecipe.baseServings = parseInt(document.getElementById('edit-base-servings').value) || 1;

    // Ingredients
    const rows = document.querySelectorAll('.ing-row');
    currentRecipe.ingredients = [];
    rows.forEach(row => {
        currentRecipe.ingredients.push({
            id: row.dataset.id,
            group: row.querySelector('.ing-group').value,
            name: row.querySelector('.ing-name').value,
            qty: row.querySelector('.ing-qty').value,
            unit: row.querySelector('.ing-unit').value
        });
    });

    // Content
    if (currentRecipe.mode === 'description') {
        currentRecipe.description = document.getElementById('description-editor').innerHTML;
    } else {
        const stepEditors = document.querySelectorAll('.step-editor');
        currentRecipe.steps = Array.from(stepEditors).map(el => el.innerHTML);
    }

    // Save
    const idx = recipes.findIndex(r => r.id === currentRecipe.id);
    if (idx >= 0) recipes[idx] = currentRecipe;
    else recipes.push(currentRecipe);

    closeModal();
    renderAdminList();
    renderRecipeGrid();
}

// --- Smart Editor & Mentions ---
function setupMentionSystem() {
    const dropdown = document.getElementById('mention-dropdown');

    // Delegate Input Event
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('rich-editor')) {
            handleEditorInput(e.target);
        }
    });

    // Delegate DblClick
    document.addEventListener('dblclick', (e) => {
        if (e.target.classList.contains('ingredient-tag')) {
            editIngredientUsage(e.target);
        }
    });
}

function handleEditorInput(editor) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    // Ensure we are inside the editor
    if (!editor.contains(range.startContainer)) return;

    const text = range.startContainer.textContent;
    const cursor = range.startOffset;

    const lastAt = text.lastIndexOf('@', cursor - 1);
    if (lastAt !== -1) {
        const query = text.substring(lastAt + 1, cursor);
        if (query.length < 20) {
            showDropdown(query, range, editor);
            return;
        }
    }
    document.getElementById('mention-dropdown').classList.add('hidden');
}

function showDropdown(query, range, editor) {
    const dropdown = document.getElementById('mention-dropdown');
    dropdown.innerHTML = '';

    // Current Ingredients
    const currentIngs = [];
    document.querySelectorAll('.ing-row').forEach(row => {
        const name = row.querySelector('.ing-name').value;
        if (name) currentIngs.push({
            id: row.dataset.id,
            name: name,
            qty: row.querySelector('.ing-qty').value,
            unit: row.querySelector('.ing-unit').value
        });
    });

    const matches = currentIngs.filter(ing => ing.name.toLowerCase().includes(query.toLowerCase()));

    if (matches.length === 0) {
        dropdown.classList.add('hidden');
        return;
    }

    matches.forEach(ing => {
        const div = document.createElement('div');
        div.className = 'mention-item';
        div.innerText = ing.name;
        div.onmousedown = (e) => {
            e.preventDefault();
            insertIngredientTag(ing, range, query.length);
        };
        dropdown.appendChild(div);
    });

    // Position Dropdown at Cursor
    const rect = range.getBoundingClientRect();
    dropdown.style.left = rect.left + 'px';
    dropdown.style.top = (rect.bottom + 5) + 'px';
    dropdown.classList.remove('hidden');
}

function insertIngredientTag(ing, range, queryLen) {
    // Delete @query
    range.setStart(range.startContainer, range.startOffset - queryLen - 1);
    range.deleteContents();

    const span = document.createElement('span');
    span.className = 'ingredient-tag';
    span.dataset.ingId = ing.id;
    span.dataset.modifier = "100%";
    span.dataset.showQty = "true"; // Default true
    span.contentEditable = "false";
    span.innerText = formatIngDisplay(ing.name, ing.qty, ing.unit, "100%", "true");

    range.insertNode(span);
    range.collapse(false);

    document.getElementById('mention-dropdown').classList.add('hidden');
}

function formatIngDisplay(name, totalQty, unit, modifier, showQtyStr) {
    const showQty = (showQtyStr === "true");
    if (!showQty) return name; // Just the name

    let displayQty = totalQty;

    if (modifier.endsWith('%')) {
        const pct = parseFloat(modifier);
        if (!isNaN(pct) && totalQty) {
            displayQty = (parseFloat(totalQty) * pct / 100);
            displayQty = Math.round(displayQty * 100) / 100;
        }
    } else if (modifier === "custom_val") {
        // Fallback? usually modifier stores value if not %
    }

    return `${displayQty}${unit} ${name}`;
}

// --- Modifier Modal ---
let currentTagElement = null;

function editIngredientUsage(spanEl) {
    currentTagElement = spanEl;
    const ingId = spanEl.dataset.ingId;
    const currentMod = spanEl.dataset.modifier || "100%";
    const currentShow = spanEl.dataset.showQty !== "false";

    // Find ing name from inputs
    const row = document.querySelector(`.ing-row[data-id="${ingId}"]`);
    if (!row) return;

    document.getElementById('mod-ing-name').innerText = row.querySelector('.ing-name').value;

    const sel = document.getElementById('mod-type');
    const inp = document.getElementById('mod-value');

    // Set Quantity Mode
    if (currentMod.endsWith('%') && (currentMod === '100%' || currentMod === '50%')) {
        sel.value = currentMod;
        inp.classList.add('hidden');
    } else {
        sel.value = "custom_pct";
        inp.classList.remove('hidden');
        inp.value = parseFloat(currentMod);
    }

    // Set Show Checkbox
    document.getElementById('mod-show-qty').checked = currentShow;

    document.getElementById('modifier-modal').classList.remove('hidden');
}

window.applyModifier = function() {
    const val = document.getElementById('mod-type').value;
    const showQty = document.getElementById('mod-show-qty').checked;

    let finalMod = val;
    if (val === 'custom_pct') {
        finalMod = document.getElementById('mod-value').value + '%';
    }

    if (currentTagElement) {
        currentTagElement.dataset.modifier = finalMod;
        currentTagElement.dataset.showQty = showQty.toString();

        // Refresh Text
        const ingId = currentTagElement.dataset.ingId;
        const row = document.querySelector(`.ing-row[data-id="${ingId}"]`);
        if (row) {
            const name = row.querySelector('.ing-name').value;
            const qty = row.querySelector('.ing-qty').value;
            const unit = row.querySelector('.ing-unit').value;
            currentTagElement.innerText = formatIngDisplay(name, qty, unit, finalMod, showQty.toString());
        }
    }
    document.getElementById('modifier-modal').classList.add('hidden');
};


// --- Client View & Logic ---
let activeServings = 1;
let activeChecklist = new Set(); // Stores indices of checked steps

function renderRecipeGrid(search = "") {
    const grid = document.getElementById('recipe-grid');
    grid.innerHTML = '';
    const filtered = recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));
    filtered.forEach(r => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.onclick = () => showDetail(r);
        const img = r.image || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRTRBRjM3Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjIwIj5SZWNldHRlPC90ZXh0Pjwvc3ZnPg==';
        card.innerHTML = `<img src="${img}" class="recipe-image"><div class="recipe-info"><p class="recipe-title">${r.title}</p></div>`;
        grid.appendChild(card);
    });
}

function showDetail(r) {
    currentRecipe = r;
    activeServings = r.baseServings || 1;
    activeChecklist = new Set(); // Reset checklist

    renderDetailView();
    document.getElementById('detail-modal').classList.remove('hidden');
}

function renderDetailView() {
    const r = currentRecipe;
    const content = document.getElementById('detail-content');
    const scale = activeServings / (r.baseServings || 1);

    // 1. Calculate Cross-offs
    // We need to know which ingredients are "fully used" by checked steps.
    const usageMap = {}; // ingId -> % used

    if (r.mode === 'steps') {
        r.steps.forEach((stepHtml, idx) => {
            if (activeChecklist.has(idx)) {
                // Parse ingredients in this step
                const temp = document.createElement('div');
                temp.innerHTML = stepHtml;
                temp.querySelectorAll('.ingredient-tag').forEach(tag => {
                    const id = tag.dataset.ingId;
                    const mod = tag.dataset.modifier || "100%";
                    const pct = parseFloat(mod) || 100;
                    usageMap[id] = (usageMap[id] || 0) + pct;
                });
            }
        });
    }

    // 2. Build Ingredients List
    const groups = {};
    r.ingredients.forEach(ing => {
        const g = ing.group || "Principal";
        if (!groups[g]) groups[g] = [];
        groups[g].push(ing);
    });

    let ingHtml = `
        <div class="servings-control">
            <label>Pour</label>
            <input type="number" value="${activeServings}" onchange="updateServings(this.value)" min="1">
            <span>personnes</span>
        </div>
    `;

    for (const [gName, ings] of Object.entries(groups)) {
        ingHtml += `<div class="ing-group"><h4>${gName}</h4>`;
        ings.forEach(i => {
            const isCrossed = (usageMap[i.id] >= 99); // Tolerance
            const scaledQty = i.qty ? (parseFloat(i.qty) * scale).toFixed(1).replace(/\.0$/, '') : '';

            ingHtml += `
                <div class="ing-list-item ${isCrossed ? 'crossed' : ''}">
                    <span>${i.name}</span>
                    <span style="font-weight:bold">${scaledQty} ${i.unit}</span>
                </div>
            `;
        });
        ingHtml += `</div>`;
    }

    // 3. Build Method
    let methodHtml = '';
    if (r.mode === 'steps') {
        methodHtml = '<div class="steps-container">';
        r.steps.forEach((stepHtml, idx) => {
            // Hydrate colors and scale quantities in text
            const hydrated = hydrateText(stepHtml, scale);
            const isChecked = activeChecklist.has(idx);

            methodHtml += `
                <div class="step-view-row ${isChecked ? 'step-checked' : ''}">
                    <!-- Inline Checkbox -->
                    <label style="cursor:pointer; display:flex; gap:10px; width:100%">
                        <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleStep(${idx})">
                        <div class="step-content">
                            <strong>[${isChecked ? 'x' : ' '}] Etape ${idx+1}</strong>
                            <div>${hydrated}</div>
                        </div>
                    </label>
                </div>
            `;
        });
        methodHtml += '</div>';
    } else {
        // Description Mode
        methodHtml = `<div style="line-height:1.8; font-size:1.1rem">${hydrateText(r.description, scale)}</div>`;
    }

    content.innerHTML = `
        <div class="detail-header">
            ${r.image ? `<img src="${r.image}" class="detail-img">` : ''}
            <div>
                <h2 style="font-size:2rem; margin-top:0">${r.title}</h2>
            </div>
        </div>
        <div class="recipe-layout">
            <div class="recipe-col-left">
                <h3 class="gold">Ingrédients</h3>
                ${ingHtml}
            </div>
            <div class="recipe-col-right">
                <h3 class="gold">Préparation</h3>
                ${methodHtml}
            </div>
        </div>
    `;
}

function hydrateText(html, scale) {
    const div = document.createElement('div');
    div.innerHTML = html;

    div.querySelectorAll('.ingredient-tag').forEach(tag => {
        const ingId = tag.dataset.ingId;
        const mod = tag.dataset.modifier;
        const showQty = tag.dataset.showQty;
        const ing = currentRecipe.ingredients.find(i => i.id === ingId);

        if (ing) {
            // Apply Color
            const color = generateColor(ing.name);
            tag.style.backgroundColor = color;
            tag.style.color = "#000"; // Ensure readable
            tag.style.padding = "2px 6px";
            tag.style.borderRadius = "4px";
            tag.style.fontWeight = "bold";

            // Scale Quantity
            const baseQty = parseFloat(ing.qty);
            let displayQty = baseQty;
            if (baseQty) {
                // Apply modifier %
                const pct = parseFloat(mod) || 100;
                displayQty = (baseQty * pct / 100) * scale;
                displayQty = Math.round(displayQty * 100) / 100;
            }

            tag.innerText = formatIngDisplay(ing.name, displayQty, ing.unit, "custom_val", showQty);
        }
    });
    return div.innerHTML;
}

window.updateServings = function(val) {
    activeServings = parseFloat(val) || 1;
    renderDetailView();
};

window.toggleStep = function(idx) {
    if (activeChecklist.has(idx)) activeChecklist.delete(idx);
    else activeChecklist.add(idx);
    renderDetailView();
};

window.closeDetailModal = function() {
    document.getElementById('detail-modal').classList.add('hidden');
};

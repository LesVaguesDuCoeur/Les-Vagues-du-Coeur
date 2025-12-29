// Global State
let recipes = []; // Array of Recipe objects
let currentRecipe = null; // Used for editing
let isAuthenticated = false;

// Config
const ADMIN_HASH = "4f4d7c180a182dc83776c2426cc229affdc9fd37389cc90c278bd2ad5dea4e5b";

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

    // Editor - Mention System
    setupMentionSystem();

    // Initial Render
    renderRecipeGrid();
});

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
        description: "" // HTML with spans
    };
}

// --- Import/Export Logic (The Core) ---

// 1. Parse "Sparse" Excel
function parseSparseExcel(data) {
    const workbook = XLSX.read(data, {type: 'array'});
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: ""});

    let newRecipes = [];
    let currentRec = null;
    let currentGroup = "";

    // Skip header if it exists? Image shows no header row on top, just data.
    // Row 1: Tarte... | Genoise | Farine ...
    // Let's assume no standard header row, or detect it.
    // Logic:
    // A: Recipe Title (if C/D not empty) OR Description (if C/D empty)
    // B: Group
    // C: Ingredient
    // D: Qty
    // E: Unit

    for (let i = 0; i < json.length; i++) {
        const row = json[i];
        const colA = row[0] ? String(row[0]).trim() : "";
        const colB = row[1] ? String(row[1]).trim() : "";
        const colC = row[2] ? String(row[2]).trim() : "";
        const colD = row[3]; // Qty
        const colE = row[4] ? String(row[4]).trim() : "";

        // Check for New Recipe Start: Col A has text AND (Col C is not empty OR it's the very first line)
        // Actually, sometimes Col A is empty but it's a new ingredient.

        const isIngredient = (colC !== "");
        const isDescription = (colA !== "" && !isIngredient);
        const isRecipeHeader = (colA !== "" && isIngredient);

        if (isRecipeHeader) {
            // New Recipe
            currentRec = createRecipe();
            currentRec.title = colA;
            newRecipes.push(currentRec);
            currentGroup = colB; // Set initial group

            // Add first ingredient
            currentRec.ingredients.push({
                id: crypto.randomUUID(),
                group: currentGroup,
                name: colC,
                qty: colD,
                unit: colE
            });
        } else if (isIngredient) {
            // Continuation of ingredients
            if (!currentRec) continue; // Orphan row

            if (colB) currentGroup = colB; // Update group if specified

            currentRec.ingredients.push({
                id: crypto.randomUUID(),
                group: currentGroup,
                name: colC,
                qty: colD,
                unit: colE
            });
        } else if (isDescription) {
            // Description line
            if (currentRec) {
                // Append to description.
                // Note: In the excel, it's just text. We append it.
                // We'll separate lines with <br>
                currentRec.description += (currentRec.description ? "<br>" : "") + colA;
            }
        }
    }

    return newRecipes;
}

// 2. Generate "Sparse" Excel
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
            // No ingredients, just print title
            data.push([r.title, "", "", "", ""]);
        }

        // Description
        // Need to strip HTML tags for Excel, or just keep text
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = r.description;
        const textDesc = tempDiv.innerText; // Basic strip
        // Split by lines
        const lines = textDesc.split('\n');
        lines.forEach(l => {
            if(l.trim()) data.push([l.trim(), "", "", "", ""]);
        });

        // Empty line between recipes
        data.push(["", "", "", "", ""]);
    });

    return data;
}

function importDatabase() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = new Uint8Array(evt.target.result);
            const newRecipes = parseSparseExcel(data);

            if (confirm(`Importer ${newRecipes.length} recettes ? Cela remplacera la base actuelle.`)) {
                recipes = newRecipes;
                renderAdminList();
                renderRecipeGrid();
                alert("Import réussi !");
            }
        };
        reader.readAsArrayBuffer(file);
    };
    input.click();
}

function exportDatabase() {
    let list = recipes;
    if (list.length === 0) {
        if (confirm("La base est vide. Voulez-vous télécharger un modèle d'exemple ?")) {
            list = [{
                id: "example",
                title: "Exemple: Tarte aux Pommes",
                ingredients: [
                    {group: "Pâte", name: "Farine", qty: 250, unit: "g"},
                    {group: "Pâte", name: "Beurre", qty: 125, unit: "g"},
                    {group: "Garniture", name: "Pommes", qty: 4, unit: "pcs"}
                ],
                description: "1. Préparez la pâte.<br>2. Coupez les pommes.<br>3. Enfournez."
            }];
        } else {
            return;
        }
    }

    const data = generateSparseExcel(list);
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Recettes");
    XLSX.writeFile(wb, "Base_Recettes.xlsx");
}

// 3. Stats Export (Steganography - Text File)
function exportStatsGlobal() {
    exportStatsAsText(recipes, "Rapport_Systeme_Global.txt");
}

function exportSingleStats() {
    if (currentRecipe) {
        exportStatsAsText([currentRecipe], `Log_Serveur_${currentRecipe.title.replace(/\s+/g, '_')}.txt`);
    }
}

function exportStatsAsText(dataToHide, filename) {
    // 1. Generate Fake "Stats/Log" content
    let content = "SERVER LOG REPORT - 2024\n";
    content += "CONFIDENTIAL - DO NOT SHARE\n";
    content += "========================================\n";
    content += "TIMESTAMP           ID       STATUS   LOAD\n";

    for(let i=0; i<50; i++) {
        const id = Math.floor(Math.random() * 9000) + 1000;
        const load = (Math.random() * 100).toFixed(2);
        content += `2024-05-${Math.floor(Math.random()*30)+1} 12:00:00  ${id}     OK       ${load}ms\n`;
    }

    content += "========================================\n";
    content += "SYSTEM DUMP FOLLOWS:\n";

    // 2. Encode Real Data
    const jsonStr = JSON.stringify(dataToHide);
    // Base64 encode to make it look like charabia
    // Note: btoa supports latin1 only, so we escape unicode first
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));

    content += encoded;
    content += "\n========================================\n";
    content += "END OF REPORT";

    // 3. Download
    const blob = new Blob([content], {type: "text/plain"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleClientImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Check extension
    if (file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target.result;
            // Look for the blob between the markers or just take the big block of base64
            // Simple approach: find the big block.
            // Or look for "SYSTEM DUMP FOLLOWS:\n"
            const marker = "SYSTEM DUMP FOLLOWS:\n";
            const idx = text.indexOf(marker);
            if (idx === -1) {
                alert("Format invalide (Marqueur manquant).");
                return;
            }

            const start = idx + marker.length;
            const end = text.indexOf("\n========================================", start);
            const encoded = text.substring(start, end !== -1 ? end : undefined).trim();

            try {
                const jsonStr = decodeURIComponent(escape(atob(encoded)));
                const importedRecipes = JSON.parse(jsonStr);
                mergeRecipes(importedRecipes);
            } catch(err) {
                console.error(err);
                alert("Erreur de décodage du fichier stats.");
            }
        };
        reader.readAsText(file);
    } else {
        // Assume Excel
        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = new Uint8Array(evt.target.result);
            try {
                const imported = parseSparseExcel(data);
                if (imported.length > 0) {
                     mergeRecipes(imported);
                     return;
                }
            } catch(err) {
                console.log("Not a simple excel");
                alert("Fichier non reconnu.");
            }
        };
        reader.readAsArrayBuffer(file);
    }
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
    document.getElementById('edit-image-url').value = ""; // Clear
    renderImagePreview(r.image);

    // Render Ingredients
    const ingList = document.getElementById('ingredients-list');
    ingList.innerHTML = '';
    r.ingredients.forEach(ing => addIngredientRow(ing));

    // Description
    const editor = document.getElementById('description-editor');
    // We need to render the HTML.
    // The stored description contains <span data-ing-id="...">...</span>
    // We need to make sure these are hydrated correctly for the editor context.
    // Actually, we can just dump the HTML.
    editor.innerHTML = r.description;

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
            currentRecipe.image = evt.target.result; // Base64
            renderImagePreview(currentRecipe.image);
        };
        reader.readAsDataURL(file);
    }
}

// --- Ingredients Table ---
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
        <input type="text" placeholder="Groupe (ex: Mousse)" class="ing-group" value="${group}">
        <input type="text" placeholder="Ingrédient" class="ing-name" value="${name}">
        <input type="number" placeholder="Qté" class="ing-qty" value="${qty}">
        <input type="text" placeholder="Unité" class="ing-unit" value="${unit}">
        <button onclick="this.parentElement.remove()" class="small-btn" style="background:red">X</button>
    `;
    document.getElementById('ingredients-list').appendChild(div);
}

function saveCurrentRecipe() {
    // 1. Update Title
    currentRecipe.title = document.getElementById('edit-title').value;

    // 2. Update Ingredients
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

    // 3. Update Description
    // We save the HTML directly from the editor
    currentRecipe.description = document.getElementById('description-editor').innerHTML;

    // 4. Save to List
    const idx = recipes.findIndex(r => r.id === currentRecipe.id);
    if (idx >= 0) recipes[idx] = currentRecipe;
    else recipes.push(currentRecipe);

    closeModal();
    renderAdminList();
    renderRecipeGrid();
}

// --- Smart Editor (@ Mention) ---
let mentionStartIndex = -1;

function setupMentionSystem() {
    const editor = document.getElementById('description-editor');
    const dropdown = document.getElementById('mention-dropdown');

    editor.addEventListener('input', (e) => {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;

        const range = sel.getRangeAt(0);
        const text = range.startContainer.textContent;
        const cursor = range.startOffset;

        // Check for @
        const lastAt = text.lastIndexOf('@', cursor - 1);
        if (lastAt !== -1) {
            const query = text.substring(lastAt + 1, cursor);
            // If query contains space, maybe cancel? User might just be using @ for email.
            // Let's allow spaces for now but maybe limit length?
            if (query.length < 20) {
                showDropdown(query, lastAt, range.startContainer);
                return;
            }
        }
        dropdown.classList.add('hidden');
    });

    // Double click on span
    editor.addEventListener('dblclick', (e) => {
        if (e.target.classList.contains('ingredient-tag')) {
            editIngredientUsage(e.target);
        }
    });
}

function showDropdown(query, atIndex, textNode) {
    const dropdown = document.getElementById('mention-dropdown');
    dropdown.innerHTML = '';

    // Get current ingredients from the DOM inputs (since user might have just typed them)
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
        // Use mousedown to prevent focus loss from editor
        div.onmousedown = (e) => {
            e.preventDefault();
            insertIngredientTag(ing, atIndex, query.length, textNode);
        };
        dropdown.appendChild(div);
    });

    // Position dropdown (simple approximation)
    const editor = document.getElementById('description-editor');
    const rect = editor.getBoundingClientRect();
    dropdown.style.left = rect.left + 'px';
    dropdown.style.top = (rect.bottom + 5) + 'px'; // Below editor for simplicity
    dropdown.classList.remove('hidden');
}

function insertIngredientTag(ing, atIndex, queryLen, textNode) {
    const editor = document.getElementById('description-editor');

    // Restore range specifically on the text node
    const range = document.createRange();
    range.setStart(textNode, atIndex);
    range.setEnd(textNode, atIndex + 1 + queryLen);

    // Update selection to match
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    // Delete the @query
    range.deleteContents();

    // Create Tag
    const span = document.createElement('span');
    span.className = 'ingredient-tag';
    span.dataset.ingId = ing.id;
    span.dataset.modifier = "100%"; // Default
    span.contentEditable = "false";

    // Calculate display
    span.innerText = formatIngDisplay(ing.name, ing.qty, ing.unit, "100%");

    range.insertNode(span);
    range.collapse(false); // Move cursor after

    document.getElementById('mention-dropdown').classList.add('hidden');
}

function formatIngDisplay(name, totalQty, unit, modifier) {
    let displayQty = totalQty;

    if (modifier.endsWith('%')) {
        const pct = parseFloat(modifier);
        if (!isNaN(pct) && totalQty) {
            displayQty = (parseFloat(totalQty) * pct / 100);
            // Format decimals
            displayQty = Math.round(displayQty * 100) / 100;
        }
    } else if (modifier === "custom_val") {
        // logic for exact value replacement not fully implemented in this helper,
        // usually modifier would hold the value
    }

    return `${displayQty}${unit} ${name}`;
}

// --- Modifier Modal ---
let currentTagElement = null;

function editIngredientUsage(spanEl) {
    currentTagElement = spanEl;
    const ingId = spanEl.dataset.ingId;
    const currentMod = spanEl.dataset.modifier || "100%";

    // Find ing name (look in DOM inputs as source of truth during edit)
    const row = document.querySelector(`.ing-row[data-id="${ingId}"]`);
    if (!row) return; // Deleted?

    document.getElementById('mod-ing-name').innerText = row.querySelector('.ing-name').value;

    const sel = document.getElementById('mod-type');
    const inp = document.getElementById('mod-value');

    if (currentMod.endsWith('%') && (currentMod === '100%' || currentMod === '50%')) {
        sel.value = currentMod;
        inp.classList.add('hidden');
    } else {
        // Custom
        sel.value = "custom_pct";
        inp.classList.remove('hidden');
        inp.value = parseFloat(currentMod);
    }

    document.getElementById('modifier-modal').classList.remove('hidden');
}

function toggleModInput() {
    const val = document.getElementById('mod-type').value;
    if (val === 'custom_pct' || val === 'custom_val') {
        document.getElementById('mod-value').classList.remove('hidden');
    } else {
        document.getElementById('mod-value').classList.add('hidden');
    }
}

window.applyModifier = function() { // Expose to window for onclick
    const val = document.getElementById('mod-type').value;
    let finalMod = val;

    if (val === 'custom_pct') {
        finalMod = document.getElementById('mod-value').value + '%';
    }

    if (currentTagElement) {
        currentTagElement.dataset.modifier = finalMod;

        // Re-render text
        const ingId = currentTagElement.dataset.ingId;
        const row = document.querySelector(`.ing-row[data-id="${ingId}"]`);
        if (row) {
            const name = row.querySelector('.ing-name').value;
            const qty = row.querySelector('.ing-qty').value;
            const unit = row.querySelector('.ing-unit').value;
            currentTagElement.innerText = formatIngDisplay(name, qty, unit, finalMod);
        }
    }

    document.getElementById('modifier-modal').classList.add('hidden');
};


// --- Client View Rendering ---
function renderRecipeGrid(search = "") {
    const grid = document.getElementById('recipe-grid');
    grid.innerHTML = '';

    const filtered = recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

    filtered.forEach(r => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.onclick = () => showDetail(r);

        // Fallback image
        const img = r.image || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRTRBRjM3Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LXNpemU9IjIwIj5SZWNldHRlPC90ZXh0Pjwvc3ZnPg==';

        card.innerHTML = `
            <img src="${img}" class="recipe-image">
            <div class="recipe-info">
                <p class="recipe-title">${r.title}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

function showDetail(r) {
    currentRecipe = r; // Set for export
    const content = document.getElementById('detail-content');

    // Group ingredients
    const groups = {};
    r.ingredients.forEach(ing => {
        const g = ing.group || "Principal";
        if (!groups[g]) groups[g] = [];
        groups[g].push(ing);
    });

    let ingHtml = '';
    for (const [gName, ings] of Object.entries(groups)) {
        ingHtml += `<div class="ing-group"><h4>${gName}</h4>`;
        ings.forEach(i => {
            ingHtml += `
                <div class="ing-list-item">
                    <span>${i.name}</span>
                    <span style="font-weight:bold">${i.qty} ${i.unit}</span>
                </div>
            `;
        });
        ingHtml += `</div>`;
    }

    // Description - We need to hydrate the spans again just in case dynamic calculation is needed,
    // but the innerText of spans was saved.
    // However, if we change ingredients in Admin, the spans in Description text might be stale if we only saved text.
    // Ideally, we re-calculate on render.

    // Create a temp div to parse the saved HTML
    const descDiv = document.createElement('div');
    descDiv.innerHTML = r.description;

    // Find all tags and update them based on current ingredients
    const tags = descDiv.querySelectorAll('.ingredient-tag');
    tags.forEach(tag => {
        const ingId = tag.dataset.ingId;
        const mod = tag.dataset.modifier;
        const ing = r.ingredients.find(i => i.id === ingId);
        if (ing) {
            tag.innerText = formatIngDisplay(ing.name, ing.qty, ing.unit, mod);
        } else {
            tag.innerText = "???"; // Ingredient deleted
            tag.style.background = "red";
        }
    });

    content.innerHTML = `
        <div class="detail-header">
            ${r.image ? `<img src="${r.image}" class="detail-img">` : ''}
            <div>
                <h2 style="font-size:2rem; margin-top:0">${r.title}</h2>
            </div>
        </div>
        <div style="display:flex; gap:3rem; flex-wrap:wrap">
            <div style="flex:1; min-width:300px; background:#f9f9f9; padding:1.5rem">
                <h3 class="gold">Ingrédients</h3>
                ${ingHtml}
            </div>
            <div style="flex:2; min-width:300px">
                <h3 class="gold">Préparation</h3>
                <div style="line-height:1.8; font-size:1.1rem">
                    ${descDiv.innerHTML}
                </div>
            </div>
        </div>
    `;

    document.getElementById('detail-modal').classList.remove('hidden');
}

window.closeDetailModal = function() {
    document.getElementById('detail-modal').classList.add('hidden');
};

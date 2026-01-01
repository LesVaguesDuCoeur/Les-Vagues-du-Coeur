// Global State
let recipes = []; // Array of Recipe objects
let currentRecipe = null; // Used for editing
let isAuthenticated = false;

// Config
const ADMIN_HASH = "4f4d7c180a182dc83776c2426cc229affdc9fd37389cc90c278bd2ad5dea4e5b"; // SHA-256 of "15112000"
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyn9JMOI2KL-qfjQXl32kbGQC379ADb-op_7CKN8XWAQNw2VGyaux88LvOfvTxdS6Xz/exec";
const DOC_EXPORT_URL = "https://docs.google.com/document/d/1hj6uSP1ygTEK7B6Zf9AN4bwzIVgnqslC1csFj-XyRyA/export?format=txt";

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

function normalizeStr(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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
    document.getElementById('edit-image-url').addEventListener('input', handleImageURLInput);

    // Editor - Mention System (Global listener for delegation)
    setupMentionSystem();

    // Modal Click Outside Handler
    setupModalClickOutside();

    // Global Enter Handler for Modals
    setupGlobalEnterHandler();

    // Initial Render
    renderRecipeGrid();

    // Auto-load from Drive
    autoLoadDatabase();
});

function refreshDatabase() {
    autoLoadDatabase(false);
}

async function autoLoadDatabase(silent = true) {
    try {
        if(!silent) console.log("Rafraîchissement...");
        const response = await fetch(DOC_EXPORT_URL);
        if (response.ok) {
            const text = await response.text();
            let importedRecipes = [];

            // 1. Try Simple JSON (New Format)
            try {
                // If the file is pure JSON
                importedRecipes = JSON.parse(text);
            } catch (jsonErr) {
                // 2. Try Legacy "Server Log" Format
                const marker = "SYSTEM DUMP FOLLOWS:";
                const idx = text.indexOf(marker);

                if (idx !== -1) {
                    const start = idx + marker.length;
                    const end = text.indexOf("========================================", start);
                    const encoded = text.substring(start, end !== -1 ? end : undefined).trim();
                    try {
                        const cleanEncoded = encoded.replace(/\s/g, '');
                        const jsonStr = decodeURIComponent(escape(atob(cleanEncoded)));
                        importedRecipes = JSON.parse(jsonStr);
                    } catch (e) { console.error("Legacy parse error", e); }
                }
            }

            if (Array.isArray(importedRecipes) && importedRecipes.length > 0) {
                mergeRecipes(importedRecipes);
                if(!silent) alert(`Synchronisation réussie ! ${importedRecipes.length} recettes chargées.`);
            } else {
                if(!silent) alert("Format vide ou incorrect dans le Google Doc.");
            }
        } else {
            console.error("Erreur Fetch Doc:", response.status);
            if(!silent) alert("Impossible de lire le Google Doc (Erreur " + response.status + ")");
        }
    } catch (e) {
        console.error("Erreur Auto-import:", e);
        if(!silent) alert("Erreur de connexion au Google Doc. Essayez l'import manuel.");
    }
}

async function saveToDrive() {
    if (recipes.length === 0) return alert("Rien à sauvegarder.");

    try {
        // Simple JSON export as requested ("désécurise")
        const content = JSON.stringify(recipes, null, 2);

        // 1. Silent Sync to Google Doc via POST
        // We use 'no-cors' which sends an opaque request.
        // Google Apps Script `doPost` must handle `e.postData.contents`.
        fetch(`${SCRIPT_URL}?action=replace`, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: content
        }).then(() => console.log("Sync request sent"))
          .catch(err => console.error("Silent Sync Error:", err));

        // 2. Local Download (Legacy/Backup)
        // User said: "juste le fichier txt" (simple JSON now)
        downloadTextFile(content, "Rapport_Recette_Global.txt");

    } catch (e) {
        console.error("Erreur Export:", e);
        alert("Erreur lors de l'export : " + e.message);
    }
}

function setupModalClickOutside() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
}

function setupGlobalEnterHandler() {
    // 1. Login
    const loginInput = document.getElementById('admin-code');
    if (loginInput) {
        loginInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }

    // 2. Modifier Modal (Article, Value)
    const modInputs = document.querySelectorAll('#modifier-modal input, #modifier-modal select');
    modInputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') applyModifier();
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

function parseSparseExcel(data) {
    const workbook = XLSX.read(data, {type: 'array'});
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, {header: 1, defval: ""});

    let newRecipes = [];
    let currentRec = null;
    let currentGroup = "";

    for (let i = 0; i < json.length; i++) {
        const row = json[i];
        const colA = row[0] ? String(row[0]).trim() : "";
        const colB = row[1] ? String(row[1]).trim() : "";
        const colC = row[2] ? String(row[2]).trim() : "";
        const colD = row[3]; // Qty
        const colE = row[4] ? String(row[4]).trim() : "";

        const isIngredient = (colC !== "");
        // Heuristic: New Recipe if Col A has text and Col C has text (Title + First Ing)
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
        } else if (colA !== "") {
            // Description or Step
            if (currentRec) {
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
    input.accept = '.xlsx, .xls, .txt, .json';
    input.onchange = (e) => {
        handleClientImport(e, true);
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
    saveToDrive();
}

function downloadTextFile(content, filename) {
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
        // Try Text/JSON first
        try {
            const text = new TextDecoder().decode(evt.target.result);

            // 1. Try Simple JSON
            try {
                const importedRecipes = JSON.parse(text);
                if (Array.isArray(importedRecipes)) {
                     if (!fromAdmin || confirm(`Importer ${importedRecipes.length} recettes depuis fichier ?`)) {
                         mergeRecipes(importedRecipes);
                     }
                     return;
                }
            } catch(e) {}

            // 2. Try Legacy
            const marker = "SYSTEM DUMP FOLLOWS:";
            const idx = text.indexOf(marker);
            if (idx !== -1) {
                const start = idx + marker.length;
                const end = text.indexOf("\n========================================", start);
                const encoded = text.substring(start, end !== -1 ? end : undefined).trim();
                const jsonStr = decodeURIComponent(escape(atob(encoded)));
                const importedRecipes = JSON.parse(jsonStr);

                if (!fromAdmin || confirm(`Importer ${importedRecipes.length} recettes depuis fichier Recette ?`)) {
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
    if(isAuthenticated) renderAdminList();
}

// --- Admin UI ---
function renderAdminList() {
    const list = document.getElementById('admin-recipe-list');
    list.innerHTML = '';
    recipes.forEach((r, index) => {
        const div = document.createElement('div');
        div.className = 'admin-recipe-row';
        div.innerHTML = `
            <span>${r.title}</span>
            <div>
                <button onclick="moveRecipe(${index}, -1)" class="small-btn move-btn">↑</button>
                <button onclick="moveRecipe(${index}, 1)" class="small-btn move-btn">↓</button>
                <button onclick="editRecipe('${r.id}')" class="small-btn">Éditer</button>
                <button onclick="deleteRecipe('${r.id}')" class="small-btn" style="background:red">X</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function moveRecipe(index, direction) {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < recipes.length) {
        // Swap
        const temp = recipes[index];
        recipes[index] = recipes[newIndex];
        recipes[newIndex] = temp;
        renderAdminList();
        renderRecipeGrid();
    }
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

    const isUrl = r.image && !r.image.startsWith('data:image');
    document.getElementById('edit-image-url').value = isUrl ? r.image : "";

    document.getElementById('edit-base-servings').value = r.baseServings || 1;
    renderImagePreview(r.image);

    // Ingredients
    const ingList = document.getElementById('ingredients-list');
    ingList.innerHTML = '';
    r.ingredients.forEach(ing => addIngredientRow(ing));

    // Description/Mode
    document.getElementById('editor-mode').value = r.mode;
    toggleEditorMode();

    // Hydrate Content
    document.getElementById('description-editor').innerHTML = r.description;
    renderStepsEditor();

    document.getElementById('editor-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('editor-modal').classList.add('hidden');
}

function renderImagePreview(src) {
    const div = document.getElementById('image-preview');
    if (!src) {
        div.innerHTML = '';
        return;
    }
    div.innerHTML = `
        <div style="position:relative; display:inline-block; margin-top:10px;">
            <img src="${src}" style="max-height:100px; border-radius: 8px; border: 1px solid #ddd;">
            <button onclick="removeImage()" style="position:absolute; top:-10px; right:-10px; background:red; color:white; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer; font-weight:bold;">X</button>
        </div>
    `;
}

function removeImage() {
    currentRecipe.image = "";
    document.getElementById('edit-image-url').value = "";
    document.getElementById('edit-image-upload').value = "";
    renderImagePreview("");
}

function handleImageURLInput(e) {
    const val = e.target.value;
    if (val) {
        currentRecipe.image = val;
        renderImagePreview(val);
    } else {
        currentRecipe.image = "";
        renderImagePreview("");
    }
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        // Increase Quality/Size since we use POST now
        compressImage(file, 1000, 0.8).then(base64 => {
            currentRecipe.image = base64;
            document.getElementById('edit-image-url').value = "";
            renderImagePreview(base64);
        }).catch(err => {
            console.error("Image compression failed", err);
            alert("Erreur lors du traitement de l'image.");
        });
    }
}

function compressImage(file, maxWidth, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const elem = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                if (height > maxWidth) {
                     width *= maxWidth / height;
                     height = maxWidth;
                }

                elem.width = width;
                elem.height = height;
                const ctx = elem.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(ctx.toDataURL('image/jpeg', quality));
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
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
        <div style="display:flex; flex-direction:column; gap:2px; justify-content:center; margin-right:5px;">
            <button onclick="moveRowUp(this)" class="tiny-btn">↑</button>
            <button onclick="moveRowDown(this)" class="tiny-btn">↓</button>
        </div>
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
        <div style="display:flex; flex-direction:column; gap:2px; justify-content:center; margin-right:5px;">
            <button onclick="moveStepUp(this)" class="tiny-btn">↑</button>
            <button onclick="moveStepDown(this)" class="tiny-btn">↓</button>
        </div>
        <span class="step-num">Etape ${idx !== null ? idx + 1 : container.children.length + 1}</span>
        <div class="rich-editor step-editor" contenteditable="true">${content}</div>
        <button onclick="removeStepRow(this)" class="small-btn" style="background:red">X</button>
    `;
    container.appendChild(div);
}

function removeStepRow(btn) {
    btn.parentElement.remove();
    renumberSteps();
}

function moveStepUp(btn) {
    const row = btn.closest('.step-row');
    if (row.previousElementSibling) {
        row.parentNode.insertBefore(row, row.previousElementSibling);
        renumberSteps();
    }
}

function moveStepDown(btn) {
    const row = btn.closest('.step-row');
    if (row.nextElementSibling) {
        row.parentNode.insertBefore(row.nextElementSibling, row);
        renumberSteps();
    }
}

function renumberSteps() {
    document.querySelectorAll('.step-row .step-num').forEach((el, i) => {
        el.innerText = `Etape ${i + 1}`;
    });
}

function moveRowUp(btn) {
    const row = btn.closest('.ing-row');
    if (row.previousElementSibling) {
        row.parentNode.insertBefore(row, row.previousElementSibling);
    }
}

function moveRowDown(btn) {
    const row = btn.closest('.ing-row');
    if (row.nextElementSibling) {
        row.parentNode.insertBefore(row.nextElementSibling, row);
    }
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

    const matches = currentIngs.filter(ing => normalizeStr(ing.name).includes(normalizeStr(query)));

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
    span.dataset.showQty = "false";
    span.dataset.article = "";
    span.contentEditable = "false";

    const displayName = ing.name.toLowerCase();
    span.innerText = formatIngDisplay(displayName, ing.qty, ing.unit, "100%", "false", "");

    range.insertNode(span);
    range.collapse(false);

    document.getElementById('mention-dropdown').classList.add('hidden');
}

function formatIngDisplay(name, totalQty, unit, modifier, showQtyStr, article) {
    const showQty = (showQtyStr === "true");
    const art = article ? article + " " : "";

    if (!showQty) return `${art}${name}`;

    let displayQty = totalQty;

    if (modifier.endsWith('%')) {
        const pct = parseFloat(modifier);
        if (!isNaN(pct) && totalQty) {
            displayQty = (parseFloat(totalQty) * pct / 100);
            displayQty = Math.round(displayQty * 100) / 100;
        }
    }

    return `${art}${displayQty}${unit} ${name}`;
}

// --- Modifier Modal ---
let currentTagElement = null;

function editIngredientUsage(spanEl) {
    currentTagElement = spanEl;
    const ingId = spanEl.dataset.ingId;
    const currentMod = spanEl.dataset.modifier || "100%";
    const currentShow = spanEl.dataset.showQty !== "false";
    const currentArticle = spanEl.dataset.article || "";

    const row = document.querySelector(`.ing-row[data-id="${ingId}"]`);
    if (!row) return;

    document.getElementById('mod-ing-name').innerText = row.querySelector('.ing-name').value;

    const sel = document.getElementById('mod-type');
    const inp = document.getElementById('mod-value');

    if (currentMod.endsWith('%') && (currentMod === '100%' || currentMod === '50%')) {
        sel.value = currentMod;
        inp.classList.add('hidden');
    } else {
        sel.value = "custom_pct";
        inp.classList.remove('hidden');
        inp.value = parseFloat(currentMod);
    }

    document.getElementById('mod-show-qty').checked = currentShow;
    document.getElementById('mod-article').value = currentArticle;

    document.getElementById('modifier-modal').classList.remove('hidden');
}

window.applyModifier = function() {
    const val = document.getElementById('mod-type').value;
    const showQty = document.getElementById('mod-show-qty').checked;
    const article = document.getElementById('mod-article').value.trim();

    let finalMod = val;
    if (val === 'custom_pct') {
        finalMod = document.getElementById('mod-value').value + '%';
    }

    if (currentTagElement) {
        currentTagElement.dataset.modifier = finalMod;
        currentTagElement.dataset.showQty = showQty.toString();
        currentTagElement.dataset.article = article;

        const ingId = currentTagElement.dataset.ingId;
        const row = document.querySelector(`.ing-row[data-id="${ingId}"]`);
        if (row) {
            const name = row.querySelector('.ing-name').value.toLowerCase();
            const qty = row.querySelector('.ing-qty').value;
            const unit = row.querySelector('.ing-unit').value;
            currentTagElement.innerText = formatIngDisplay(name, qty, unit, finalMod, showQty.toString(), article);
        }
    }
    document.getElementById('modifier-modal').classList.add('hidden');
};


// --- Client View & Logic ---
let activeServings = 1;
let activeChecklist = new Set();

function renderRecipeGrid(search = "") {
    const grid = document.getElementById('recipe-grid');
    grid.innerHTML = '';
    const filtered = recipes.filter(r => normalizeStr(r.title).includes(normalizeStr(search)));
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
    activeChecklist = new Set();

    renderDetailView();
    document.getElementById('detail-modal').classList.remove('hidden');
}

function renderDetailView() {
    const r = currentRecipe;
    const content = document.getElementById('detail-content');
    const scale = activeServings / (r.baseServings || 1);

    // 1. Calculate Cross-offs
    const usageMap = {};

    if (r.mode === 'steps') {
        r.steps.forEach((stepHtml, idx) => {
            if (activeChecklist.has(idx)) {
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
            const isCrossed = (usageMap[i.id] >= 99);
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
            const hydrated = hydrateText(stepHtml, scale);
            const isChecked = activeChecklist.has(idx);

            methodHtml += `
                <div class="step-view-row ${isChecked ? 'step-checked' : ''}">
                    <label style="cursor:pointer; display:flex; gap:10px; width:100%">
                        <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleStep(${idx})">
                        <div class="step-content">
                            <strong>Etape ${idx+1}</strong>
                            <div>${hydrated}</div>
                        </div>
                    </label>
                </div>
            `;
        });
        methodHtml += '</div>';
    } else {
        methodHtml = `<div style="line-height:1.8; font-size:1.1rem">${hydrateText(r.description, scale)}</div>`;
    }

    content.innerHTML = `
        <div class="detail-header-actions" style="display:flex; justify-content:flex-end; margin-bottom:10px;">
             <button onclick="downloadRecipePDF()" class="secondary-btn">📥 Télécharger PDF</button>
        </div>
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
        const article = tag.dataset.article;
        const ing = currentRecipe.ingredients.find(i => i.id === ingId);

        if (ing) {
            const color = generateColor(ing.name);
            tag.style.backgroundColor = color;
            tag.style.color = "#000";
            tag.style.padding = "2px 6px";
            tag.style.borderRadius = "4px";
            tag.style.fontWeight = "bold";

            const baseQty = parseFloat(ing.qty);
            let displayQty = baseQty;
            if (baseQty) {
                const pct = parseFloat(mod) || 100;
                displayQty = (baseQty * pct / 100) * scale;
                displayQty = Math.round(displayQty * 100) / 100;
            }

            tag.innerText = formatIngDisplay(ing.name.toLowerCase(), displayQty, ing.unit, "custom_val", showQty, article);
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

window.downloadRecipePDF = function() {
    const detailContent = document.getElementById('detail-content');

    const tempContainer = document.createElement('div');
    tempContainer.style.padding = "20px";
    tempContainer.style.background = "white";
    tempContainer.style.width = "800px";

    const logoHtml = `<div style="text-align:center; margin-bottom:20px;">
        <img src="logo.jpeg" style="height:80px;">
    </div>`;

    let contentCopy = detailContent.cloneNode(true);

    const actions = contentCopy.querySelector('.detail-header-actions');
    if(actions) actions.remove();

    const servInput = contentCopy.querySelector('.servings-control input');
    if(servInput) {
        const val = servInput.value;
        const parent = servInput.parentElement;
        parent.innerHTML = `Pour <strong>${val}</strong> personnes`;
    }

    const layout = contentCopy.querySelector('.recipe-layout');
    if(layout) {
        layout.style.display = 'block';
        const left = contentCopy.querySelector('.recipe-col-left');
        const right = contentCopy.querySelector('.recipe-col-right');
        if(left) { left.style.width = '100%'; left.style.marginBottom = '20px'; }
        if(right) { right.style.width = '100%'; }
    }

    tempContainer.innerHTML = logoHtml + contentCopy.innerHTML;

    const filename = (currentRecipe.title || "Recette").replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".pdf";

    const opt = {
      margin:       10,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(tempContainer).save();
};

window.downloadAllRecipesPDF = function() {
    if (recipes.length === 0) return alert("Aucune recette à télécharger.");

    const masterContainer = document.createElement('div');
    masterContainer.style.width = "800px";
    masterContainer.style.background = "white";

    const coverHtml = `
        <div style="text-align:center; padding: 50px 0; page-break-after: always;">
            <img src="logo.jpeg" style="height:150px; margin-bottom:20px;">
            <h1 style="font-size:36px; color:#D4AF37;">Livre de Recettes</h1>
            <p style="font-size:18px;">${recipes.length} Recettes</p>
        </div>
    `;
    masterContainer.innerHTML = coverHtml;

    recipes.forEach((r, idx) => {
        const recipeHtml = getRecipeHTML(r);

        const pageDiv = document.createElement('div');
        pageDiv.style.padding = "20px";
        pageDiv.style.pageBreakAfter = "always";
        pageDiv.innerHTML = recipeHtml;

        masterContainer.appendChild(pageDiv);
    });

    const opt = {
      margin:       10,
      filename:     'Livre_ChaouiRecettes.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(masterContainer).save();
};

function getRecipeHTML(r) {
    const scale = 1;
    const ingredients = r.ingredients || [];

    const groups = {};
    ingredients.forEach(ing => {
        const g = ing.group || "Principal";
        if (!groups[g]) groups[g] = [];
        groups[g].push(ing);
    });

    let ingHtml = '';
    for (const [gName, ings] of Object.entries(groups)) {
        ingHtml += `<div class="ing-group"><h4 style="border-bottom: 2px solid #D4AF37; display: inline-block; margin-bottom: 5px;">${gName}</h4>`;
        ings.forEach(i => {
            ingHtml += `
                <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #eee; padding:2px 0;">
                    <span>${i.name}</span>
                    <span style="font-weight:bold">${i.qty} ${i.unit}</span>
                </div>
            `;
        });
        ingHtml += `</div>`;
    }

    let methodHtml = '';
    if (r.mode === 'steps') {
        r.steps.forEach((stepHtml, idx) => {
             const tempDiv = document.createElement('div');
             tempDiv.innerHTML = stepHtml;
             tempDiv.querySelectorAll('.ingredient-tag').forEach(tag => {
                 tag.style.fontWeight = 'bold';
                 tag.style.color = '#000';
             });

             methodHtml += `
                <div style="margin-bottom:10px;">
                    <strong style="color:#D4AF37;">Etape ${idx+1}</strong>
                    <div>${tempDiv.innerHTML}</div>
                </div>
             `;
        });
    } else {
         const tempDiv = document.createElement('div');
         tempDiv.innerHTML = r.description;
         methodHtml = `<div>${tempDiv.innerHTML}</div>`;
    }

    return `
        <div style="display:flex; justify-content:center; margin-bottom:20px;">
             ${r.image ? `<img src="${r.image}" style="max-height:200px; border: 2px solid #D4AF37;">` : ''}
        </div>
        <h2 style="text-align:center; color:#000;">${r.title}</h2>
        <div style="margin-top:20px;">
            <h3 style="color:#D4AF37;">Ingrédients</h3>
            ${ingHtml}
        </div>
        <div style="margin-top:20px;">
            <h3 style="color:#D4AF37;">Préparation</h3>
            ${methodHtml}
        </div>
    `;
}

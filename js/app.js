// Global State
let recipes = []; // Array of Recipe objects
let currentRecipe = null; // Used for editing
let isAuthenticated = false;

// Config
const ADMIN_HASH = "4f4d7c180a182dc83776c2426cc229affdc9fd37389cc90c278bd2ad5dea4e5b"; // SHA-256 of "15112000"
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyfsvNeM37HrfE-Uo4ZEpfGg3nMb5pvChic_wEao3e2s1-MqxfM5Jn2f6Rgltkt17bg/exec";
const DOC_EXPORT_URL = "https://docs.google.com/document/d/1hj6uSP1ygTEK7B6Zf9AN4bwzIVgnqslC1csFj-XyRyA/export?format=txt";

// --- Utilities ---
function generateColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    const s = 30 + (Math.abs(hash) % 30);
    const l = 70 + (Math.abs(hash) % 20);
    return `hsl(${h}, ${s}%, ${l}%)`;
}

function normalizeStr(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('nav-client').addEventListener('click', () => switchView('client'));
    document.getElementById('nav-admin').addEventListener('click', () => switchView('admin'));
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('client-search').addEventListener('input', (e) => renderRecipeGrid(e.target.value));
    document.getElementById('client-file-input').addEventListener('change', handleClientImport);
    document.getElementById('edit-image-upload').addEventListener('change', handleImageUpload);
    document.getElementById('edit-image-url').addEventListener('input', handleImageURLInput);

    setupMentionSystem();
    setupModalClickOutside();
    setupGlobalEnterHandler();
    setupGlobalEscHandler(); // New

    renderRecipeGrid();
    autoLoadDatabase();
    logVisitor();
});

// --- Visitor Logging ---
async function logVisitor() {
    try {
        // Use ipapi.co to get detailed location data (IP, City, Region, Country, Lat, Long)
        const ipRes = await fetch('https://ipapi.co/json/');
        const data = await ipRes.json();

        const timestamp = new Date().toLocaleString('fr-FR');

        let logString = `Adresse IP : ${data.ip || 'Inconnue'}`;
        if (data.city) logString += ` | Ville : ${data.city}`;
        if (data.region) logString += ` (${data.region})`;
        if (data.country_name) logString += ` | Pays : ${data.country_name}`;
        if (data.latitude && data.longitude) logString += ` | Coordonnées GPS : ${data.latitude}, ${data.longitude}`;
        logString += ` | Horodatage précis : ${timestamp}`;

        fetch(`${SCRIPT_URL}?action=log_visit`, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: logString
        }).then(() => console.log("Visite enregistrée silently"))
          .catch(e => console.error("Log error", e));

    } catch (err) {
        console.error("Erreur Logging Visiteur:", err);
        try {
            const fallbackRes = await fetch('https://api.ipify.org?format=json');
            const fbData = await fallbackRes.json();
            const ts = new Date().toLocaleString('fr-FR');
            const simpleLog = `Adresse IP : ${fbData.ip} | (Localisation indisponible) | Horodatage précis : ${ts}`;
            fetch(`${SCRIPT_URL}?action=log_visit`, {
                 method: 'POST', mode: 'no-cors', body: simpleLog
            });
        } catch(e) {}
    }
}

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
            try {
                // Try direct JSON parse first (for raw txt exports)
                importedRecipes = JSON.parse(text);
            } catch (jsonErr) {
                // Fallback: try finding JSON array pattern if wrapped or contains BOM
                const firstBracket = text.indexOf('[');
                const lastBracket = text.lastIndexOf(']');
                if (firstBracket !== -1 && lastBracket !== -1) {
                    try {
                        const sub = text.substring(firstBracket, lastBracket + 1);
                        importedRecipes = JSON.parse(sub);
                    } catch(e) {
                        // Legacy handling
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
                            } catch (e2) { console.error("Legacy parse error", e2); }
                        }
                    }
                }
            }

            if (Array.isArray(importedRecipes) && importedRecipes.length > 0) {
                mergeRecipes(importedRecipes);
                if(!silent) alert(`Synchronisation réussie ! ${importedRecipes.length} recettes chargées.`);
            } else {
                if(!silent) alert("Format vide ou incorrect dans le Google Doc.");
            }
        } else {
            if(!silent) alert("Impossible de lire le Google Doc (Erreur " + response.status + ")");
        }
    } catch (e) {
        if(!silent) alert("Erreur de connexion au Google Doc. Essayez l'import manuel.");
    }
}

async function saveToDrive() {
    if (recipes.length === 0) return alert("Rien à sauvegarder.");

    try {
        const content = JSON.stringify(recipes, null, 2);

        // Sync disabled as per request - Admin must update the Google Doc manually
        /*
        fetch(`${SCRIPT_URL}?action=replace`, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: content
        }).then(() => console.log("Sync request sent"))
          .catch(err => console.error("Silent Sync Error:", err));
        */

        downloadTextFile(content, "Rapport_Recette_Global.txt");

    } catch (e) {
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
    const loginInput = document.getElementById('admin-code');
    if (loginInput) {
        loginInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }
    const modInputs = document.querySelectorAll('#modifier-modal input, #modifier-modal select');
    modInputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') applyModifier();
        });
    });
    const editorInputs = document.querySelectorAll('#edit-title, #edit-base-servings, #edit-image-url');
    editorInputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
             if (e.key === 'Enter') {
                 e.preventDefault();
                 saveCurrentRecipe();
             }
        });
    });
}

// New: Esc Handler
function setupGlobalEscHandler() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        }
    });
}

// --- Navigation & Auth ---
async function switchView(view) {
    document.getElementById('nav-client').classList.toggle('active', view === 'client');
    document.getElementById('nav-admin').classList.toggle('active', view === 'admin');
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
        image: "",
        ingredients: [],
        mode: "description",
        description: "",
        steps: [],
        baseServings: 1
    };
}

// --- Import/Export Logic (Same as before) ---
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
        const colD = row[3];
        const colE = row[4] ? String(row[4]).trim() : "";

        const isIngredient = (colC !== "");
        const possibleNewRecipe = (colA !== "" && isIngredient);

        if (possibleNewRecipe) {
            currentRec = createRecipe();
            currentRec.title = colA;
            newRecipes.push(currentRec);
            currentGroup = colB;
            currentRec.ingredients.push({
                id: crypto.randomUUID(), group: currentGroup, name: colC, qty: colD, unit: colE
            });
        } else if (isIngredient) {
            if (!currentRec) continue;
            if (colB) currentGroup = colB;
            currentRec.ingredients.push({
                id: crypto.randomUUID(), group: currentGroup, name: colC, qty: colD, unit: colE
            });
        } else if (colA !== "") {
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
        if (r.ingredients.length > 0) {
            r.ingredients.forEach(ing => {
                let row = ["", "", "", "", ""];
                if (firstLine) { row[0] = r.title; firstLine = false; }
                if (ing.group !== lastGroup) { row[1] = ing.group; lastGroup = ing.group; }
                row[2] = ing.name; row[3] = ing.qty; row[4] = ing.unit;
                data.push(row);
            });
        } else {
            data.push([r.title, "", "", "", ""]);
        }
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
            lines.forEach(l => { if(l.trim()) data.push([l.trim(), "", "", "", ""]); });
        }
        data.push(["", "", "", "", ""]);
    });
    return data;
}

function importDatabase() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls, .txt, .json';
    input.onchange = (e) => { handleClientImport(e, true); };
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

function exportStatsGlobal() { saveToDrive(); }

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
        try {
            const text = new TextDecoder().decode(evt.target.result);
            try {
                const importedRecipes = JSON.parse(text);
                if (Array.isArray(importedRecipes)) {
                     if (!fromAdmin || confirm(`Importer ${importedRecipes.length} recettes depuis fichier ?`)) {
                         mergeRecipes(importedRecipes);
                     }
                     return;
                }
            } catch(e) {}
            // Legacy handling...
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
        } catch(e) { }
        try {
            const data = new Uint8Array(evt.target.result);
            const imported = parseSparseExcel(data);
            if (imported.length > 0) {
                 if (fromAdmin) { if (confirm(`Importer ${imported.length} recettes depuis Excel ?`)) mergeRecipes(imported); }
                 else { mergeRecipes(imported); }
            } else { alert("Format non reconnu."); }
        } catch(err) { alert("Erreur de lecture."); }
    };
    reader.readAsArrayBuffer(file);
}

function mergeRecipes(newItems) {
    const existingIds = new Set(recipes.map(r => r.id));
    newItems.forEach(r => {
        if (!existingIds.has(r.id)) { recipes.push(r); }
    });
    renderRecipeGrid();
    if(isAuthenticated) renderAdminList();
}

// --- Admin UI & Reordering ---
let dragSrcEl = null;

function renderAdminList() {
    const list = document.getElementById('admin-recipe-list');
    list.innerHTML = '';
    recipes.forEach((r, index) => {
        const div = document.createElement('div');
        div.className = 'admin-recipe-row';
        div.draggable = true;
        div.dataset.index = index;

        div.addEventListener('dragstart', handleDragStart);
        div.addEventListener('dragover', handleDragOver);
        div.addEventListener('drop', handleDrop);
        div.addEventListener('dragenter', handleDragEnter);
        div.addEventListener('dragleave', handleDragLeave);

        div.innerHTML = `
            <div class="drag-handle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </div>
            <span style="flex-grow:1; margin-left:10px;">${r.title}</span>
            <div>
                <button onclick="editRecipe('${r.id}')" class="small-btn">Éditer</button>
                <button onclick="deleteRecipe('${r.id}')" class="delete-btn" style="background:red; color:white; border-radius:50%; width:30px; height:30px; padding:0; display:inline-flex; align-items:center; justify-content:center;">X</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) { this.classList.add('over'); }
function handleDragLeave(e) { this.classList.remove('over'); }

function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (dragSrcEl !== this) {
        const srcIdx = parseInt(dragSrcEl.dataset.index);
        const targetIdx = parseInt(this.dataset.index);
        const item = recipes[srcIdx];
        recipes.splice(srcIdx, 1);
        recipes.splice(targetIdx, 0, item);
        renderAdminList();
        renderRecipeGrid();
    }
    return false;
}

function createNewRecipe() {
    currentRecipe = createRecipe();
    openEditor();
}

function editRecipe(id) {
    currentRecipe = JSON.parse(JSON.stringify(recipes.find(r => r.id === id)));
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

    const ingList = document.getElementById('ingredients-list');
    ingList.innerHTML = '';
    // Re-render ingredients using currentRecipe.ingredients which now supports reordering
    r.ingredients.forEach((ing, idx) => addIngredientRow(ing, idx));

    document.getElementById('editor-mode').value = r.mode;
    toggleEditorMode();
    document.getElementById('description-editor').innerHTML = r.description;
    renderStepsEditor();

    document.getElementById('editor-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('editor-modal').classList.add('hidden');
}

function renderImagePreview(src) {
    const div = document.getElementById('image-preview');
    if (!src) { div.innerHTML = ''; return; }
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
    if (val) { currentRecipe.image = val; renderImagePreview(val); }
    else { currentRecipe.image = ""; renderImagePreview(""); }
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        // Reduced size/quality to ensure upload success
        compressImage(file, 600, 0.6).then(base64 => {
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
                if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
                if (height > maxWidth) { width *= maxWidth / height; height = maxWidth; }
                elem.width = width; elem.height = height;
                const ctx = elem.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(ctx.toDataURL('image/jpeg', quality));
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
}

// Updated with Drag Handle
function addIngredientRow(data = null, idx = null) {
    const id = data ? data.id : crypto.randomUUID();
    const group = data ? data.group : "";
    const name = data ? data.name : "";
    const qty = data ? data.qty : "";
    const unit = data ? data.unit : "";

    const div = document.createElement('div');
    div.className = 'ing-row';
    div.dataset.id = id;
    div.draggable = true; // Enable Drag

    // Listeners for reordering ingredients
    div.addEventListener('dragstart', handleIngDragStart);
    div.addEventListener('dragover', handleDragOver); // Reuse generic over
    div.addEventListener('drop', handleIngDrop);
    div.addEventListener('dragenter', handleDragEnter);
    div.addEventListener('dragleave', handleDragLeave);

    div.innerHTML = `
        <div class="drag-handle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        </div>
        <input type="text" placeholder="Groupe" class="ing-group" value="${group}">
        <input type="text" placeholder="Ingrédient" class="ing-name" value="${name}" onkeydown="handleIngEnter(event)">
        <input type="number" placeholder="Qté" class="ing-qty" value="${qty}">
        <input type="text" placeholder="Unité" class="ing-unit" value="${unit}">
        <button onclick="this.parentElement.remove()" class="delete-btn" style="background:red; color:white; border-radius:50%; width:24px; height:24px; padding:0; display:inline-flex; align-items:center; justify-content:center;">X</button>
    `;
    document.getElementById('ingredients-list').appendChild(div);
}

// Drag Handlers for Ingredients
let dragIngEl = null;
function handleIngDragStart(e) {
    dragIngEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
}
function handleIngDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (dragIngEl !== this) {
        // Swap DOM elements
        this.parentNode.insertBefore(dragIngEl, this);
        // Note: Actual data swap happens on 'Save' because saveCurrentRecipe reads the DOM order
    }
    return false;
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

// Updated with Drag Handle for Steps
function addStepRow(content = "", idx = null) {
    const container = document.getElementById('steps-list');
    const div = document.createElement('div');
    div.className = 'step-row';
    div.draggable = true;

    div.addEventListener('dragstart', handleStepDragStart);
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', handleStepDrop);
    div.addEventListener('dragenter', handleDragEnter);
    div.addEventListener('dragleave', handleDragLeave);

    div.innerHTML = `
        <div class="drag-handle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        </div>
        <span class="step-num">Etape ${idx !== null ? idx + 1 : container.children.length + 1}</span>
        <div class="rich-editor step-editor" contenteditable="true">${content}</div>
        <button onclick="removeStepRow(this)" class="delete-btn" style="background:red; color:white; border-radius:50%; width:24px; height:24px; padding:0; display:inline-flex; align-items:center; justify-content:center;">X</button>
    `;
    container.appendChild(div);
}

// Drag Handlers for Steps
let dragStepEl = null;
function handleStepDragStart(e) {
    dragStepEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
}
function handleStepDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (dragStepEl !== this) {
        this.parentNode.insertBefore(dragStepEl, this);
        // Renumber logic needed here for visual consistency
        document.querySelectorAll('.step-row .step-num').forEach((el, i) => {
            el.innerText = `Etape ${i + 1}`;
        });
    }
    return false;
}

function removeStepRow(btn) {
    btn.parentElement.remove();
    document.querySelectorAll('.step-row .step-num').forEach((el, i) => {
        el.innerText = `Etape ${i + 1}`;
    });
}

function saveCurrentRecipe() {
    currentRecipe.title = document.getElementById('edit-title').value;
    currentRecipe.mode = document.getElementById('editor-mode').value;
    currentRecipe.baseServings = parseInt(document.getElementById('edit-base-servings').value) || 1;

    // Ingredients - Read from DOM (handles reordering)
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

// --- Smart Editor & Mentions (Same as before) ---
function setupMentionSystem() {
    const dropdown = document.getElementById('mention-dropdown');
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('rich-editor')) { handleEditorInput(e.target); }
    });
    document.addEventListener('dblclick', (e) => {
        if (e.target.classList.contains('ingredient-tag')) { editIngredientUsage(e.target); }
    });
}

function handleEditorInput(editor) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (!editor.contains(range.startContainer)) return;
    const text = range.startContainer.textContent;
    const cursor = range.startOffset;
    const lastAt = text.lastIndexOf('@', cursor - 1);
    if (lastAt !== -1) {
        const query = text.substring(lastAt + 1, cursor);
        if (query.length < 20) { showDropdown(query, range, editor); return; }
    }
    document.getElementById('mention-dropdown').classList.add('hidden');
}

function showDropdown(query, range, editor) {
    const dropdown = document.getElementById('mention-dropdown');
    dropdown.innerHTML = '';
    const currentIngs = [];
    document.querySelectorAll('.ing-row').forEach(row => {
        const name = row.querySelector('.ing-name').value;
        if (name) currentIngs.push({
            id: row.dataset.id, name: name, qty: row.querySelector('.ing-qty').value, unit: row.querySelector('.ing-unit').value
        });
    });
    const matches = currentIngs.filter(ing => normalizeStr(ing.name).includes(normalizeStr(query)));
    if (matches.length === 0) { dropdown.classList.add('hidden'); return; }
    matches.forEach(ing => {
        const div = document.createElement('div');
        div.className = 'mention-item';
        div.innerText = ing.name;
        div.onmousedown = (e) => { e.preventDefault(); insertIngredientTag(ing, range, query.length); };
        dropdown.appendChild(div);
    });
    const rect = range.getBoundingClientRect();
    dropdown.style.left = rect.left + 'px';
    dropdown.style.top = (rect.bottom + 5) + 'px';
    dropdown.classList.remove('hidden');
}

function insertIngredientTag(ing, range, queryLen) {
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
        sel.value = currentMod; inp.classList.add('hidden');
    } else {
        sel.value = "custom_pct"; inp.classList.remove('hidden'); inp.value = parseFloat(currentMod);
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
    if (val === 'custom_pct') { finalMod = document.getElementById('mod-value').value + '%'; }
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

function hydrateText(htmlContent, scale) {
    const temp = document.createElement('div');
    temp.innerHTML = htmlContent;
    temp.querySelectorAll('.ingredient-tag').forEach(tag => {
        const ingId = tag.dataset.ingId;
        const ing = currentRecipe.ingredients.find(i => i.id === ingId);
        if (ing) {
            const modifier = tag.dataset.modifier || "100%";
            const showQty = (tag.dataset.showQty !== "false");
            const article = tag.dataset.article || "";
            let baseQty = parseFloat(ing.qty) || 0;
            if (modifier.endsWith('%')) {
                const pct = parseFloat(modifier);
                if (!isNaN(pct)) baseQty = baseQty * (pct / 100);
            }
            const scaledQty = parseFloat((baseQty * scale).toFixed(2));
            const color = generateColor(ing.name);
            const text = showQty && ing.qty
                ? `${article ? article + ' ' : ''}${scaledQty}${ing.unit} ${ing.name}`
                : `${article ? article + ' ' : ''}${ing.name}`;

            const span = document.createElement('span');
            span.style.backgroundColor = color;
            span.style.padding = "2px 5px";
            span.style.borderRadius = "4px";
            span.style.color = "#000";
            span.style.fontWeight = "bold";
            span.textContent = text;
            tag.replaceWith(span);
        }
    });
    return temp.innerHTML;
}

function downloadRecipePDF() {
    const element = document.getElementById('detail-content');
    const opt = {
      margin: 10,
      filename: `${currentRecipe.title}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    if (window.html2pdf) {
        html2pdf().set(opt).from(element).save();
    } else {
        alert("Librairie PDF non chargée.");
    }
}

function downloadAllRecipesPDF() {
    alert("Fonctionnalité d'export global PDF en cours de développement.");
}

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
    currentRecipe = r; activeServings = r.baseServings || 1; activeChecklist = new Set();
    renderDetailView(); document.getElementById('detail-modal').classList.remove('hidden');
}
function renderDetailView() {
    const r = currentRecipe;
    const content = document.getElementById('detail-content');
    const scale = activeServings / (r.baseServings || 1);
    const usageMap = {};
    if (r.mode === 'steps') {
        r.steps.forEach((stepHtml, idx) => {
            if (activeChecklist.has(idx)) {
                const temp = document.createElement('div'); temp.innerHTML = stepHtml;
                temp.querySelectorAll('.ingredient-tag').forEach(tag => {
                    const id = tag.dataset.ingId; const mod = tag.dataset.modifier || "100%";
                    const pct = parseFloat(mod) || 100; usageMap[id] = (usageMap[id] || 0) + pct;
                });
            }
        });
    }
    const groups = {};
    r.ingredients.forEach(ing => {
        const g = ing.group || "Principal"; if (!groups[g]) groups[g] = []; groups[g].push(ing);
    });
    let ingHtml = `<div class="servings-control"><label>Pour</label><input type="number" value="${activeServings}" onchange="updateServings(this.value)" min="1"><span>personnes</span></div>`;
    for (const [gName, ings] of Object.entries(groups)) {
        ingHtml += `<div class="ing-group"><h4>${gName}</h4>`;
        ings.forEach(i => {
            const isCrossed = (usageMap[i.id] >= 99); const scaledQty = i.qty ? (parseFloat(i.qty) * scale).toFixed(1).replace(/\.0$/, '') : '';
            ingHtml += `<div class="ing-list-item ${isCrossed ? 'crossed' : ''}"><span>${i.name}</span><span style="font-weight:bold">${scaledQty} ${i.unit}</span></div>`;
        });
        ingHtml += `</div>`;
    }
    let methodHtml = '';
    if (r.mode === 'steps') {
        methodHtml = '<div class="steps-container">';
        r.steps.forEach((stepHtml, idx) => {
            const hydrated = hydrateText(stepHtml, scale); const isChecked = activeChecklist.has(idx);
            methodHtml += `<div class="step-view-row ${isChecked ? 'step-checked' : ''}"><label style="cursor:pointer; display:flex; gap:10px; width:100%"><input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleStep(${idx})"><div class="step-content"><strong>Etape ${idx+1}</strong><div>${hydrated}</div></div></label></div>`;
        });
        methodHtml += '</div>';
    } else {
        methodHtml = `<div style="line-height:1.8; font-size:1.1rem">${hydrateText(r.description, scale)}</div>`;
    }
    content.innerHTML = `<div class="detail-header-actions" style="display:flex; justify-content:flex-end; margin-bottom:10px;"><button onclick="downloadRecipePDF()" class="secondary-btn">📥 Télécharger PDF</button></div><div class="detail-header">${r.image ? `<img src="${r.image}" class="detail-img">` : ''}<div><h2 style="font-size:2rem; margin-top:0">${r.title}</h2></div></div><div class="recipe-layout"><div class="recipe-col-left"><h3 class="gold">Ingrédients</h3>${ingHtml}</div><div class="recipe-col-right"><h3 class="gold">Préparation</h3>${methodHtml}</div></div>`;
}
window.updateServings = function(val) { activeServings = parseFloat(val) || 1; renderDetailView(); };
window.toggleStep = function(idx) { if (activeChecklist.has(idx)) activeChecklist.delete(idx); else activeChecklist.add(idx); renderDetailView(); };
window.closeDetailModal = function() { document.getElementById('detail-modal').classList.add('hidden'); };

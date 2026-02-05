import os

files = {
    "Code.gs": """const FOLDER_ID = "1_2Skc1s702g70PK9yrAWdBAsCUXAAHg0";
const FILE_NAME = "recipes.json";

function doGet(e) {
  return createJSONOutput(getRecipes());
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const payload = request.payload;
    let result = {};
    let recipes = getRecipes();

    if (action === "import_recipes") {
      const newRecipes = payload.map(r => ({
        ...r,
        id: r.id || Utilities.getUuid(),
        isFavorite: r.isFavorite || false,
        addedAt: new Date().toISOString()
      }));
      recipes = [...recipes, ...newRecipes];
      saveRecipes(recipes);
      result = { success: true, recipes: recipes };
    } else if (action === "delete_recipe") {
      const originalLength = recipes.length;
      recipes = recipes.filter(r => r.id !== payload.id);
      if (recipes.length !== originalLength) saveRecipes(recipes);
      result = { success: true, recipes: recipes };
    } else if (action === "bulk_delete_ingredient") {
      const ingredient = payload.ingredient.toLowerCase().trim();
      if (ingredient) {
        recipes = recipes.filter(r => {
          const hasIngredient = r.ingredients && r.ingredients.some(i => i.toLowerCase().includes(ingredient));
          return !hasIngredient;
        });
        saveRecipes(recipes);
      }
      result = { success: true, recipes: recipes };
    } else if (action === "toggle_favorite") {
       let updated = false;
       recipes = recipes.map(r => {
         if (r.id === payload.id) {
           updated = true;
           return { ...r, isFavorite: !r.isFavorite };
         }
         return r;
       });
       if (updated) saveRecipes(recipes);
       result = { success: true, recipes: recipes };
    } else {
      result = { error: "Unknown action" };
    }
    return createJSONOutput(result);
  } catch (err) {
    return createJSONOutput({ error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getFolder() {
  return DriveApp.getFolderById(FOLDER_ID);
}

function getRecipes() {
  try {
    const folder = getFolder();
    const files = folder.getFilesByName(FILE_NAME);
    if (files.hasNext()) {
      const file = files.next();
      return JSON.parse(file.getBlob().getDataAsString());
    }
  } catch (e) {}
  return [];
}

function saveRecipes(data) {
  const folder = getFolder();
  const files = folder.getFilesByName(FILE_NAME);
  if (files.hasNext()) {
    files.next().setContent(JSON.stringify(data));
  } else {
    folder.createFile(FILE_NAME, JSON.stringify(data));
  }
}

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}""",

    "prompt_gemini.txt": """Tu es un expert culinaire et un développeur. Je veux que tu me génères des recettes de cuisine.
Le format de sortie DOIT être un tableau JSON strict, sans texte autour (ou juste le bloc de code json).

Chaque recette doit avoir la structure suivante :
{
  "titre": "Nom de la recette",
  "ingredients": ["ingrédient 1", "ingrédient 2"],
  "etapes": ["Etape 1", "Etape 2"]
}

Exemple :
[
  {
    "titre": "Omelette au fromage",
    "ingredients": ["3 oeufs", "50g de fromage râpé", "sel", "poivre"],
    "etapes": ["Battre les oeufs", "Ajouter le fromage", "Cuire à la poêle"]
  }
]

Ma demande spécifique est :
[INSÉRER TA DEMANDE ICI, ex: "Je veux 20 recettes indiennes sans ces ingrédients..."]""",

    "recettes.txt": """[
  {
    "titre": "Exemple: Pâtes à la Carbonara",
    "ingredients": ["Pâtes", "Lardons", "Oeufs", "Parmesan", "Poivre"],
    "etapes": [
      "Faire cuire les pâtes al dente.",
      "Faire revenir les lardons.",
      "Mélanger oeufs et parmesan.",
      "Mélanger le tout hors du feu avec un peu d'eau de cuisson."
    ]
  },
  {
    "titre": "Exemple: Salade César",
    "ingredients": ["Laitue romaine", "Poulet grillé", "Croutons", "Parmesan", "Sauce César"],
    "etapes": [
      "Laver la salade.",
      "Couper le poulet et les croutons.",
      "Mélanger le tout avec la sauce."
    ]
  }
]""",

    "readme.txt": """=== GUIDE D'INSTALLATION ET D'UTILISATION ===

1. CONFIGURATION DU BACKEND (Google Apps Script)
   - Allez sur https://script.google.com/
   - Créez un nouveau projet.
   - Copiez le contenu du fichier `Code.gs` (fourni dans ce dossier) et collez-le à la place du code existant.
   - Enregistrez (Ctrl+S).
   - Cliquez sur le bouton "Déployer" (en haut à droite) > "Nouveau déploiement".
   - Type : "Application Web".
   - Description : "API Recettes".
   - Exécuter en tant que : "Moi" (votre compte).
   - Qui peut accéder : "Tout le monde" (nécessaire pour que le site puisse appeler le script).
   - Cliquez sur "Déployer".
   - COPIEZ l'URL de l'application web (elle ressemble à https://script.google.com/macros/s/.../exec).

2. CONFIGURATION DU FRONTEND (Le site)
   - Ouvrez le fichier `netlify/src/api.js`.
   - Remplacez la ligne :
     export const API_URL = "https://script.google.com/macros/s/AKfycbx_PLACEHOLDER_YOUR_ID_HERE/exec";
     par l'URL que vous venez de copier.
   - Sauvegardez le fichier.

3. LANCER LE SITE (En local)
   - Ouvrez un terminal dans le dossier `netlify`.
   - Lancez `npm install` pour installer les dépendances.
   - Lancez `npm run dev`.
   - Ouvrez le lien affiché (ex: http://localhost:5173).

4. UTILISATION
   - Le site est vide au départ.
   - Pour ajouter des recettes :
     a. Ouvrez le fichier `prompt_gemini.txt`.
     b. Copiez le texte et collez-le dans Gemini ou ChatGPT.
     c. Ajoutez votre demande spécifique en bas du prompt (ex: "Je veux 10 recettes végétariennes").
     d. Copiez le code JSON généré par l'IA.
     e. Collez-le dans un fichier texte (Bloc-notes) et enregistrez-le (ex: `mes_recettes.txt`).
     f. Sur le site, dans la zone "Importer", sélectionnez ce fichier.
     (Note : Vous pouvez utiliser le fichier `recettes.txt` fourni pour tester).
   - Les recettes s'ajouteront à votre liste et seront sauvegardées sur votre Google Drive.

5. FONCTIONNALITÉS
   - Supprimer : Cliquez sur la poubelle pour supprimer une recette.
   - Favoris : Cliquez sur le coeur pour mettre en favori.
   - Suppression par ingrédient : Tapez "petit pois" dans la zone de gauche et validez pour supprimer toutes les recettes contenant cet ingrédient.
""",

    "netlify/package.json": """{
  "name": "recettes-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.344.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.64",
    "@types/react-dom": "^18.2.21",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "vite": "^5.1.6"
  }
}""",
    "netlify/vite.config.js": """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})""",
    "netlify/index.html": """<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mes Recettes</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>""",
    "netlify/postcss.config.js": """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}""",
    "netlify/tailwind.config.js": """/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}""",
    "netlify/src/index.css": """@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-slate-50 text-slate-900;
}""",
    "netlify/src/main.jsx": """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)""",
    "netlify/src/api.js": """// Remplacez cette URL par l'URL de votre déploiement Web App Google Apps Script
export const API_URL = "https://script.google.com/macros/s/AKfycbx_PLACEHOLDER_YOUR_ID_HERE/exec";

export const api = {
  async getRecipes() {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Erreur chargement");
    return response.json();
  },

  async importRecipes(newRecipes) {
    return this.sendAction("import_recipes", newRecipes);
  },

  async deleteRecipe(id) {
    return this.sendAction("delete_recipe", { id });
  },

  async bulkDelete(ingredient) {
    return this.sendAction("bulk_delete_ingredient", { ingredient });
  },

  async toggleFavorite(id) {
    return this.sendAction("toggle_favorite", { id });
  },

  async sendAction(action, payload) {
    // Important: Content-Type text/plain pour éviter CORS Preflight (OPTIONS)
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({ action, payload }),
    });
    if (!response.ok) throw new Error("Erreur réseau");
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  }
};""",
    "netlify/src/App.jsx": """import React, { useState, useEffect } from 'react';
import { api, API_URL } from './api';
import RecipeList from './components/RecipeList';
import ImportPanel from './components/ImportPanel';
import IngredientFilter from './components/IngredientFilter';
import { BookOpen, RefreshCw } from 'lucide-react';

function App() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('all'); // 'all', 'favorites'

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    if (API_URL.includes("PLACEHOLDER")) {
      setError("Veuillez configurer l'URL API dans src/api.js avec votre déploiement Apps Script.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRecipes();
      setRecipes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Impossible de charger les recettes. Vérifiez l'URL API et votre connexion.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (result) => {
    if (result && result.recipes) {
      setRecipes(result.recipes);
    } else {
      loadRecipes();
    }
  };

  const filteredRecipes = view === 'favorites'
    ? recipes.filter(r => r.isFavorite)
    : recipes;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-4">
        <h1 className="text-3xl font-bold flex items-center gap-2 text-indigo-700">
          <BookOpen /> Mes Recettes
        </h1>
        <div className="flex gap-2">
           <button
             onClick={() => setView('all')}
             className={`px-4 py-2 rounded transition-colors ${view === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
           >
             Toutes ({recipes.length})
           </button>
           <button
             onClick={() => setView('favorites')}
             className={`px-4 py-2 rounded transition-colors ${view === 'favorites' ? 'bg-pink-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
           >
             Favoris ({recipes.filter(r => r.isFavorite).length})
           </button>
           <button onClick={loadRecipes} className="p-2 bg-gray-100 rounded hover:bg-gray-200" title="Actualiser">
             <RefreshCw className={loading ? "animate-spin" : ""} />
           </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <ImportPanel onImport={handleUpdate} onError={setError} />

          <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
             <h2 className="font-semibold mb-3 text-slate-800 border-b pb-2">Suppression Rapide</h2>
             <IngredientFilter onUpdate={handleUpdate} onError={setError} />
          </div>
        </aside>

        <main className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center mt-10">
                <RefreshCw className="animate-spin text-indigo-600 w-8 h-8" />
            </div>
          ) : (
            <RecipeList
              recipes={filteredRecipes}
              onUpdate={handleUpdate}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;""",
    "netlify/src/components/RecipeList.jsx": """import React from 'react';
import { Heart, Trash2, Clock, List } from 'lucide-react';
import { api } from '../api';

function RecipeList({ recipes, onUpdate }) {
  if (!recipes || recipes.length === 0) {
    return (
      <div className="text-center p-10 bg-white rounded shadow text-gray-500">
        Aucune recette. Commencez par en importer via le panneau de gauche !
      </div>
    );
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette recette ?")) return;
    try {
      const result = await api.deleteRecipe(id);
      onUpdate(result);
    } catch (e) {
      alert("Erreur: " + e.message);
    }
  };

  const handleFavorite = async (id) => {
    try {
      const result = await api.toggleFavorite(id);
      onUpdate(result);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <div key={recipe.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
          <div className="p-4 flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-slate-800 line-clamp-2" title={recipe.titre || recipe.title}>
                 {recipe.titre || recipe.title}
              </h3>
              <button
                onClick={() => handleFavorite(recipe.id)}
                className={`p-1 rounded-full ${recipe.isFavorite ? 'text-pink-600 bg-pink-50' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <Heart className={`w-5 h-5 ${recipe.isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="mt-2 text-sm text-gray-600 space-y-2">
              <div className="flex gap-2 items-start">
                 <List className="w-4 h-4 mt-1 flex-shrink-0" />
                 <p className="line-clamp-3">
                   {recipe.ingredients && recipe.ingredients.join(', ')}
                 </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 border-t flex justify-between items-center text-sm">
             <span className="text-gray-500">
                {recipe.etapes ? `${recipe.etapes.length} étapes` : 'Pas d\\'étapes'}
             </span>
             <button
               onClick={() => handleDelete(recipe.id)}
               className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
               title="Supprimer"
             >
               <Trash2 className="w-4 h-4" />
             </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RecipeList;""",
    "netlify/src/components/ImportPanel.jsx": """import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { api } from '../api';

function ImportPanel({ onUpdate, onError }) {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        // Try to parse JSON. Prompt says "txt file" but formatted as JSON.
        // We should be robust.
        let json;
        try {
          json = JSON.parse(text);
        } catch (err) {
            // Attempt to clean markdown code blocks if Gemini added them
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '');
            json = JSON.parse(cleaned);
        }

        if (!Array.isArray(json)) throw new Error("Le fichier ne contient pas une liste de recettes (Tableau JSON attendu).");

        const result = await api.importRecipes(json);
        onUpdate(result);
        alert(`${json.length} recettes importées avec succès !`);
        e.target.value = null; // Reset input
      } catch (err) {
        onError("Erreur d'import : " + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
      <h2 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5" /> Importer
      </h2>
      <label className="block w-full cursor-pointer bg-white border-2 border-dashed border-indigo-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
        <input
          type="file"
          accept=".txt,.json"
          className="hidden"
          onChange={handleFileUpload}
          disabled={loading}
        />
        <div className="flex flex-col items-center gap-2 text-indigo-600">
          {loading ? (
             <span>Importation...</span>
          ) : (
            <>
             <FileText className="w-8 h-8 opacity-50" />
             <span className="text-sm font-medium">Glissez un fichier .txt ou cliquez ici</span>
            </>
          )}
        </div>
      </label>
      <p className="text-xs text-indigo-400 mt-2 text-center">
        Format attendu : Liste JSON générée par Gemini/ChatGPT.
      </p>
    </div>
  );
}

export default ImportPanel;""",
    "netlify/src/components/IngredientFilter.jsx": """import React, { useState } from 'react';
import { Trash } from 'lucide-react';
import { api } from '../api';

function IngredientFilter({ onUpdate, onError }) {
  const [ingredient, setIngredient] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBulkDelete = async () => {
    if (!ingredient.trim()) return;

    if (!window.confirm(`Voulez-vous vraiment supprimer TOUTES les recettes contenant "${ingredient}" ?\\nCette action est irréversible.`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await api.bulkDelete(ingredient);
      onUpdate(result);
      setIngredient("");
      alert("Nettoyage terminé.");
    } catch (e) {
      onError("Erreur lors de la suppression : " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Supprimer les recettes contenant un ingrédient spécifique (ex: "petit pois").
      </p>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={ingredient}
          onChange={(e) => setIngredient(e.target.value)}
          placeholder="Ingrédient à bannir..."
          className="w-full p-2 border rounded focus:ring-2 focus:ring-red-200 outline-none"
        />
        <button
          onClick={handleBulkDelete}
          disabled={!ingredient || loading}
          className="w-full bg-red-50 text-red-600 p-2 rounded flex items-center justify-center gap-2 hover:bg-red-100 disabled:opacity-50 font-medium transition-colors"
        >
          {loading ? "..." : <><Trash className="w-4 h-4" /> Supprimer tout</>}
        </button>
      </div>
    </div>
  );
}

export default IngredientFilter;"""
}

# Create directories first
directories = [
    "netlify",
    "netlify/src",
    "netlify/src/components"
]

for d in directories:
    if not os.path.exists(d):
        os.makedirs(d)

for filepath, content in files.items():
    with open(filepath, "w") as f:
        f.write(content)

print("Restoration complete.")

import React, { useState, useEffect } from 'react';
import { api, API_URL } from './api';
import RecipeList from './components/RecipeList';
import ImportPanel from './components/ImportPanel';
import IngredientFilter from './components/IngredientFilter';
import FavoriteIngredients from './components/FavoriteIngredients';
import { BookOpen, RefreshCw } from 'lucide-react';

function App() {
  const [recipes, setRecipes] = useState([]);
  const [favIngredients, setFavIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('all'); // 'all', 'favorites'

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    if (API_URL.includes("PLACEHOLDER")) {
      setError("Veuillez configurer l'URL API dans src/api.js avec votre déploiement Apps Script.");
      // For demo purposes if API is not set, ensure empty state or minimal feedback
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRecipes();
      if (data && typeof data === 'object' && !Array.isArray(data)) {
         setRecipes(data.recipes || []);
         setFavIngredients(data.favoriteIngredients || []);
      } else if (Array.isArray(data)) {
         // Fallback for old API format
         setRecipes(data);
         setFavIngredients([]);
      }
    } catch (err) {
      setError("Impossible de charger les recettes. Vérifiez l'URL API et votre connexion.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (result) => {
    if (result) {
      if (result.recipes) setRecipes(result.recipes);
      if (result.favoriteIngredients) setFavIngredients(result.favoriteIngredients);
    } else {
      loadRecipes();
    }
  };

  const handleToggleIngredient = async (ing) => {
    try {
      const result = await api.toggleIngredientFavorite(ing);
      handleUpdate(result);
    } catch (e) {
      setError("Erreur lors de la mise à jour des favoris ingrédients");
    }
  };

  const filteredRecipes = view === 'favorites'
    ? recipes.filter(r => r.isFavorite)
    : recipes;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-bold flex items-center gap-2 text-indigo-700">
            <BookOpen className="text-indigo-600" /> Les Vagues du Cœur
          </h1>
          <div className="flex gap-2">
             <button
               onClick={() => setView('all')}
               className={`px-4 py-2 rounded-full font-medium transition-colors ${view === 'all' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
             >
               Toutes ({recipes.length})
             </button>
             <button
               onClick={() => setView('favorites')}
               className={`px-4 py-2 rounded-full font-medium transition-colors ${view === 'favorites' ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
             >
               Favoris ({recipes.filter(r => r.isFavorite).length})
             </button>
             <button onClick={loadRecipes} className="p-2 bg-white rounded-full hover:bg-slate-100 shadow-sm border border-slate-200" title="Actualiser">
               <RefreshCw className={loading ? "animate-spin text-indigo-600" : "text-slate-600"} />
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

            <FavoriteIngredients
              ingredients={favIngredients}
              onToggle={handleToggleIngredient}
            />

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
                favoriteIngredients={favIngredients}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;

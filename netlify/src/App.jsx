import React, { useState, useEffect } from 'react';
import { api, API_URL } from './api';
import RecipeList from './components/RecipeList';
import ImportPanel from './components/ImportPanel';
import IngredientFilter from './components/IngredientFilter';
import FavoriteIngredients from './components/FavoriteIngredients';
import { Home, ChefHat, Heart, ShoppingCart, Ban, Loader2, Utensils } from 'lucide-react';

function App() {
  const [recipes, setRecipes] = useState([]);
  const [favIngredients, setFavIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState('home'); // 'home', 'recipes', 'favorites', 'courses', 'interdits'

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRecipes();
      if (data && typeof data === 'object' && !Array.isArray(data)) {
         setRecipes(data.recipes || []);
         setFavIngredients(data.favoriteIngredients || []);
      } else if (Array.isArray(data)) {
         setRecipes(data);
         setFavIngredients([]);
      }
    } catch (err) {
      setError("Impossible de charger les données. Vérifiez votre connexion.");
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

  // Views Configuration
  const renderView = () => {
    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

    switch(view) {
      case 'home':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white shadow-lg">
               <h2 className="text-3xl font-bold mb-2">Bienvenue !</h2>
               <p className="opacity-90">Gérez vos recettes et votre alimentation en toute simplicité.</p>
               <div className="mt-6 flex gap-4">
                 <button onClick={() => setView('recipes')} className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
                   Voir les Recettes
                 </button>
                 <button onClick={() => setView('favorites')} className="bg-pink-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-pink-600 transition">
                   Mes Favoris
                 </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-emerald-500" /> Suggestions
                  </h3>
                  <RecipeList
                    recipes={recipes.slice(0, 2)}
                    onUpdate={handleUpdate}
                    favoriteIngredients={favIngredients}
                  />
                  {recipes.length > 2 && (
                    <button onClick={() => setView('recipes')} className="mt-4 w-full text-center text-indigo-600 text-sm font-medium hover:underline">
                      Voir plus...
                    </button>
                  )}
               </div>

               <div className="space-y-6">
                   <ImportPanel onImport={handleUpdate} onError={setError} />
               </div>
            </div>
          </div>
        );

      case 'recipes':
        return (
          <div className="space-y-6">
             <h2 className="text-2xl font-bold text-slate-800">Toutes les recettes</h2>
             <RecipeList recipes={recipes} onUpdate={handleUpdate} favoriteIngredients={favIngredients} />
          </div>
        );

      case 'favorites':
        return (
          <div className="space-y-6">
             <h2 className="text-2xl font-bold text-pink-700">Mes Favoris</h2>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
                 <FavoriteIngredients ingredients={favIngredients} onToggle={handleToggleIngredient} />
             </div>

             <h3 className="text-xl font-semibold text-slate-700">Recettes Favorites</h3>
             <RecipeList
               recipes={recipes.filter(r => r.isFavorite)}
               onUpdate={handleUpdate}
               favoriteIngredients={favIngredients}
             />
          </div>
        );

      case 'interdits':
        return (
          <div className="space-y-6">
             <h2 className="text-2xl font-bold text-red-700">Gestion des Interdits</h2>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
                <IngredientFilter onUpdate={handleUpdate} onError={setError} />
             </div>
          </div>
        );

      case 'courses':
        return (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">Liste de courses bientôt disponible</p>
          </div>
        );

      default:
        return <div>Vue inconnue</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20"> {/* pb-20 for bottom nav */}

      {/* Header Mobile/Desktop */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
           <h1 className="text-xl font-bold text-indigo-700 flex items-center gap-2">
             <ChefHat className="w-6 h-6" /> Les Vagues du Cœur
           </h1>
           {loading && <Loader2 className="animate-spin w-5 h-5 text-indigo-600" />}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4">
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 border border-red-200">
            {error}
          </div>
        )}

        {renderView()}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom z-50">
        <div className="max-w-4xl mx-auto flex justify-around">
           <NavButton icon={Home} label="Accueil" active={view === 'home'} onClick={() => setView('home')} />
           <NavButton icon={Utensils} label="Menu" active={view === 'menu'} onClick={() => setView('home')} /> {/* Using Home for Menu for now as placeholder */}
           <NavButton icon={ChefHat} label="Recettes" active={view === 'recipes'} onClick={() => setView('recipes')} />
           <NavButton icon={ShoppingCart} label="Courses" active={view === 'courses'} onClick={() => setView('courses')} />
           <NavButton icon={Ban} label="Interdits" active={view === 'interdits'} onClick={() => setView('interdits')} />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center py-3 px-1 transition-colors ${
        active ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      <Icon className={`w-6 h-6 mb-1 ${active ? 'fill-current opacity-20 stroke-current' : ''}`} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

export default App;

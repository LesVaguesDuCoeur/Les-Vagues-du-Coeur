import React from 'react';
import { Heart, Trash2, Clock, Utensils } from 'lucide-react';
import { api } from '../api';

function RecipeList({ recipes, onUpdate, favoriteIngredients = [] }) {
  if (!recipes || recipes.length === 0) {
    return (
      <div className="text-center p-10 bg-white rounded-lg shadow-sm border border-slate-200 text-gray-500">
        <Utensils className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="text-xl font-semibold mb-2 text-slate-700">Aucune recette</p>
        <p className="text-sm max-w-md mx-auto">
          Votre livre de recettes est vide. Utilisez le panneau d'import (à gauche) pour ajouter les recettes depuis <code>Recettes.txt</code> ou générées par IA.
        </p>
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
        <div key={recipe.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          {/* Header Image Placeholder */}
          <div className="h-32 bg-gradient-to-br from-indigo-500 to-blue-600 relative flex items-center justify-center">
             <Utensils className="text-white opacity-20 w-12 h-12" />
             <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => handleFavorite(recipe.id)}
                  className={`p-2 rounded-full backdrop-blur-sm transition-all ${recipe.isFavorite ? 'bg-white/90 text-pink-600 shadow-sm' : 'bg-black/10 text-white hover:bg-black/20'}`}
                  title={recipe.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <Heart className={`w-5 h-5 ${recipe.isFavorite ? 'fill-current' : ''}`} />
                </button>
             </div>
             {recipe.time && (
               <div className="absolute bottom-2 right-2 bg-slate-900/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1 font-medium">
                 <Clock className="w-3 h-3" /> {recipe.time}
               </div>
             )}
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <div className="mb-3">
               {recipe.category && (
                 <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide bg-emerald-50 px-2 py-0.5 rounded-full">
                   {recipe.category}
                 </span>
               )}
               <h3 className="text-lg font-bold text-slate-800 leading-tight mt-2" title={recipe.titre || recipe.title}>
                 {recipe.titre || recipe.title}
               </h3>
            </div>

            <div className="mt-auto pt-2">
              <div className="flex flex-wrap gap-1">
                 {recipe.ingredients && recipe.ingredients.slice(0, 4).map((ing, idx) => {
                   // Check if ingredient is favored
                   const isFav = favoriteIngredients.some(fav => ing.toLowerCase().includes(fav.toLowerCase()));
                   return (
                     <span key={idx} className={`text-xs px-2 py-1 rounded-full ${isFav ? 'bg-pink-100 text-pink-700 border border-pink-200' : 'bg-slate-100 text-slate-600'}`}>
                       {ing}
                     </span>
                   );
                 })}
                 {recipe.ingredients && recipe.ingredients.length > 4 && (
                   <span className="text-xs px-2 py-1 bg-slate-50 text-slate-400 rounded-full">+{recipe.ingredients.length - 4}</span>
                 )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
             <span>
                {recipe.steps ? `${recipe.steps.length} étapes` : (recipe.etapes ? `${recipe.etapes.length} étapes` : 'Pas d\'étapes')}
             </span>
             <button
               onClick={() => handleDelete(recipe.id)}
               className="text-slate-400 hover:text-red-600 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
               title="Supprimer la recette"
             >
               <Trash2 className="w-3 h-3" />
             </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RecipeList;

import React from 'react';
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
                {recipe.etapes ? `${recipe.etapes.length} étapes` : 'Pas d\'étapes'}
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

export default RecipeList;
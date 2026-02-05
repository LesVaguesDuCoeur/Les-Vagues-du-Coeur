import React, { useState } from 'react';
import { Heart, Plus, X } from 'lucide-react';

export default function FavoriteIngredients({ ingredients = [], onToggle }) {
  const [newIng, setNewIng] = useState("");

  const handleAdd = () => {
    if (!newIng.trim()) return;
    onToggle(newIng.trim());
    setNewIng("");
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-pink-100 mt-6">
      <h2 className="font-semibold mb-3 text-pink-700 border-b pb-2 flex items-center gap-2">
        <Heart className="w-4 h-4 fill-current" /> Ingrédients Favoris
      </h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newIng}
          onChange={(e) => setNewIng(e.target.value)}
          placeholder="Ajouter..."
          className="flex-1 p-2 border rounded text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="bg-pink-100 text-pink-700 p-2 rounded hover:bg-pink-200"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ingredients.map((ing) => (
          <span key={ing} className="bg-pink-50 text-pink-800 px-2 py-1 rounded-full text-sm flex items-center gap-1 border border-pink-200">
            {ing}
            <button onClick={() => onToggle(ing)} className="hover:text-red-600" title="Retirer">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {ingredients.length === 0 && (
          <span className="text-gray-400 text-sm italic">Aucun ingrédient favori.</span>
        )}
      </div>
    </div>
  );
}

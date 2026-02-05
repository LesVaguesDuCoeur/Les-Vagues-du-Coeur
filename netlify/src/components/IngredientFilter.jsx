import React, { useState } from 'react';
import { Trash } from 'lucide-react';
import { api } from '../api';

function IngredientFilter({ onUpdate, onError }) {
  const [ingredient, setIngredient] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBulkDelete = async () => {
    if (!ingredient.trim()) return;

    if (!window.confirm(`Voulez-vous vraiment supprimer TOUTES les recettes contenant "${ingredient}" ?\nCette action est irréversible.`)) {
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

export default IngredientFilter;
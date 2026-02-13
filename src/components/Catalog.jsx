import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { MealCard } from './MealCard';
import { MealModal } from './MealModal';

export function Catalog({ recipes }) {
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [selectedRecipe, setSelectedRecipe] = useState(null);

    const filteredRecipes = recipes.filter(recipe => {
        const matchesSearch = recipe.title.toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === 'all' || recipe.type === filterType || (filterType === 'meal' && (recipe.type === 'lunch' || recipe.type === 'dinner' || recipe.type === 'meal'));
        return matchesSearch && matchesType;
    });

    return (
        <div className="h-full flex flex-col animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Catalogue de Recettes</h1>
                <p className="text-slate-500">Plus de {recipes.length} recettes saines et adaptées.</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher une recette (ex: Saumon, Poulet...)"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['all', 'breakfast', 'meal', 'snack'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${filterType === type ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                        >
                            {type === 'all' ? 'Tout' : type === 'meal' ? 'Plats' : type === 'breakfast' ? 'Petit-Dèj' : 'Collations'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                {filteredRecipes.map(recipe => (
                    <MealCard
                        key={recipe.id}
                        recipe={recipe}
                        onClick={() => setSelectedRecipe(recipe)}
                    />
                ))}
            </div>

            {/* Modal */}
            <MealModal
                recipe={selectedRecipe}
                isOpen={!!selectedRecipe}
                onClose={() => setSelectedRecipe(null)}
            />
        </div>
    );
}

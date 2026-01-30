import React from 'react';
import { Flame } from 'lucide-react';

export function MealCard({ recipe, onClick, compact = false }) {
    if (!recipe) return null;

    const typeColor = {
        breakfast: 'bg-amber-100 text-amber-800 border-amber-200',
        lunch: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dinner: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        snack: 'bg-pink-100 text-pink-800 border-pink-200',
        meal: 'bg-slate-100 text-slate-800 border-slate-200'
    }[recipe.type] || 'bg-slate-100 text-slate-800 border-slate-200';

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 cursor-pointer hover:shadow-md hover:border-emerald-400 transition-all group h-full flex flex-col ${compact ? 'text-sm p-3' : ''}`}
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeColor} uppercase tracking-wider`}>
                    {recipe.type === 'meal' ? (recipe.calories > 400 ? 'Repas' : 'Léger') : recipe.type}
                </span>
                <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                    <Flame size={12} className="text-orange-400" />
                    <span>{recipe.calories}</span>
                </div>
            </div>

            <h3 className={`font-bold text-slate-800 group-hover:text-emerald-600 transition-colors ${compact ? 'text-xs leading-snug line-clamp-2' : 'text-base mb-2 line-clamp-2'}`}>
                {recipe.title}
            </h3>

            {!compact && (
                <div className="mt-auto pt-3 flex flex-wrap gap-1">
                    {recipe.tags && recipe.tags.slice(0, 2).map(tag => (
                         <span key={tag} className="text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">#{tag}</span>
                    ))}
                </div>
            )}
        </div>
    );
}

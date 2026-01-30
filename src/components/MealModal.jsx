import React from 'react';
import { X, Flame, ChefHat } from 'lucide-react';

export function MealModal({ recipe, isOpen, onClose }) {
    if (!isOpen || !recipe) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
                    <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                {recipe.type}
                            </span>
                            {recipe.tags?.map(tag => (
                                <span key={tag} className="text-slate-500 text-xs px-2 py-1 bg-white border border-slate-200 rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 leading-tight">{recipe.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 flex-shrink-0">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {/* Stats */}
                    <div className="flex gap-6 mb-8 text-sm text-slate-600">
                        <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg text-orange-700 border border-orange-100">
                            <Flame size={18} />
                            <span className="font-semibold">{recipe.calories} kcal</span>
                        </div>
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg text-blue-700 border border-blue-100">
                            <ChefHat size={18} />
                            <span className="font-semibold">Niveau: Facile</span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Ingredients */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                                Ingrédients
                            </h3>
                            <ul className="space-y-3">
                                {recipe.ingredients.map((ing, idx) => (
                                    <li key={idx} className="flex justify-between items-center text-slate-700 border-b border-slate-50 pb-2">
                                        <span className="font-medium">{ing.name}</span>
                                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-sm whitespace-nowrap">{ing.quantity}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Instructions */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                                Instructions
                            </h3>
                            <div className="space-y-4">
                                {recipe.instructions.map((step, idx) => (
                                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm leading-relaxed text-slate-700 shadow-sm">
                                        {/* Simple markdown parser for bold text */}
                                        {step.split('**').map((part, i) =>
                                            i % 2 === 1 ? <strong key={i} className="text-slate-900 block mb-1 text-base">{part}</strong> : part
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}

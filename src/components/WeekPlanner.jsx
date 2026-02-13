import React, { useState } from 'react';
import { MealCard } from './MealCard';
import { MealModal } from './MealModal';

const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const MEAL_TYPES = [
    { key: 'breakfast', label: 'Petit Déjeuner' },
    { key: 'snack1', label: 'Collation' },
    { key: 'lunch', label: 'Déjeuner' },
    { key: 'snack2', label: 'Collation' },
    { key: 'dinner', label: 'Dîner' }
];

export function WeekPlanner({ menu }) {
    const [selectedMeal, setSelectedMeal] = useState(null);

    return (
        <div className="h-full flex flex-col animate-fade-in">
             <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Semainier</h1>
                <p className="text-slate-500">Votre menu personnalisé gastrite & perte de poids.</p>
            </div>

            <div className="flex-1 overflow-x-auto pb-8 custom-scrollbar">
                <div className="min-w-[1400px] grid grid-cols-[120px_repeat(7,1fr)] gap-4">
                    {/* Top Left Empty */}
                    <div></div>

                    {/* Day Headers */}
                    {DAYS.map(day => (
                        <div key={day} className="text-center font-bold text-slate-800 uppercase tracking-wider bg-white py-3 rounded-xl shadow-sm border border-slate-100 sticky top-0 z-10">
                            {day}
                        </div>
                    ))}

                    {/* Meal Rows */}
                    {MEAL_TYPES.map(type => (
                        <React.Fragment key={type.key}>
                            {/* Row Label */}
                            <div className="flex items-center justify-center font-bold text-slate-500 text-xs uppercase tracking-wider text-center bg-slate-100/50 rounded-xl px-2 border border-slate-200">
                                {type.label}
                            </div>

                            {/* Days Cells */}
                            {DAYS.map(day => {
                                const meal = menu[day]?.[type.key];
                                return (
                                    <div key={`${day}-${type.key}`} className="min-h-[140px]">
                                        {meal ? (
                                            <MealCard
                                                recipe={meal}
                                                onClick={() => setSelectedMeal(meal)}
                                                compact
                                            />
                                        ) : (
                                            <div className="h-full border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 text-sm bg-slate-50/30">
                                                -
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <MealModal
                recipe={selectedMeal}
                isOpen={!!selectedMeal}
                onClose={() => setSelectedMeal(null)}
            />
        </div>
    );
}

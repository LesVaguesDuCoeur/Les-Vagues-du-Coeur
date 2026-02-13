import React from 'react';
import { Calendar, Book, Save } from 'lucide-react';

export function Layout({ children, view, setView, onSave }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col shadow-xl sticky top-0 md:h-screen z-10">
                <div className="text-2xl font-bold mb-8 flex items-center gap-2">
                    <span className="text-emerald-400">Gastro</span>Plan
                </div>

                <nav className="flex-1 space-y-2">
                    <button
                        onClick={() => setView('planner')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'planner' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                        <Calendar size={20} />
                        Semainier
                    </button>
                    <button
                        onClick={() => setView('catalog')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'catalog' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:bg-slate-800'}`}
                    >
                        <Book size={20} />
                        Catalogue
                    </button>
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-700">
                    <button
                        onClick={onSave}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-blue-900/50 active:scale-95"
                    >
                        <Save size={20} />
                        Sauvegarder
                    </button>
                    <p className="text-xs text-slate-500 mt-4 text-center">
                        Données sauvegardées via Google Script
                    </p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

import React from 'react';
import { useCV } from '../../store/cvStore';
import { Plus, Trash2 } from 'lucide-react';

const LanguagesForm = () => {
  const { state, updateSection } = useCV();
  const languages = state.languages || [];

  const handleChange = (id, field, value) => {
    const newLanguages = languages.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    updateSection('languages', newLanguages);
  };

  const handleDelete = (id) => {
    updateSection('languages', languages.filter((item) => item.id !== id));
  };

  const handleAdd = () => {
    const newItem = {
      id: Date.now().toString(),
      name: '',
      level: 'Niveau intermédiaire'
    };
    updateSection('languages', [...languages, newItem]);
  };

  const levels = ["Langue maternelle", "Natif", "Bilingue", "Courant", "Niveau avancé", "Niveau intermédiaire", "Niveau scolaire", "Débutant"];

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Langues</h2>
        <button
            onClick={handleAdd}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
            <Plus size={16} className="mr-1" /> Ajouter
        </button>
      </div>

      <div className="space-y-2">
        {languages.map((item) => (
            <div key={item.id} className="flex items-center space-x-2 border p-2 rounded bg-gray-50">
                <input
                    placeholder="Langue (ex: Anglais)"
                    value={item.name}
                    onChange={(e) => handleChange(item.id, 'name', e.target.value)}
                    className="flex-grow border rounded p-1 text-sm"
                />
                <select
                    value={item.level}
                    onChange={(e) => handleChange(item.id, 'level', e.target.value)}
                    className="border rounded p-1 text-sm w-40"
                >
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={16} />
                </button>
            </div>
        ))}
      </div>
    </div>
  );
};

export default LanguagesForm;

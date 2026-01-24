import React from 'react';
import { useCV } from '../../store/cvStore';
import { Plus, Trash2 } from 'lucide-react';

const InterestsForm = () => {
  const { state, updateSection } = useCV();
  const interests = state.interests || [];

  const handleChange = (id, value) => {
    const newInterests = interests.map((item) => {
      if (item.id === id) {
        return { ...item, name: value };
      }
      return item;
    });
    updateSection('interests', newInterests);
  };

  const handleDelete = (id) => {
    updateSection('interests', interests.filter((item) => item.id !== id));
  };

  const handleAdd = () => {
    const newItem = {
      id: Date.now().toString(),
      name: ''
    };
    updateSection('interests', [...interests, newItem]);
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Centres d'intérêt</h2>
        <button
            onClick={handleAdd}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
            <Plus size={16} className="mr-1" /> Ajouter
        </button>
      </div>

      <div className="space-y-2">
        {interests.map((item) => (
            <div key={item.id} className="flex items-center space-x-2 border p-2 rounded bg-gray-50">
                <input
                    placeholder="Centre d'intérêt"
                    value={item.name}
                    onChange={(e) => handleChange(item.id, e.target.value)}
                    className="flex-grow border rounded p-1 text-sm"
                />
                <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={16} />
                </button>
            </div>
        ))}
      </div>
    </div>
  );
};

export default InterestsForm;

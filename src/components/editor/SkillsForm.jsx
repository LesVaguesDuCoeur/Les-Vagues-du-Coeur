import React from 'react';
import { useCV } from '../../store/cvStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { Plus, Trash2 } from 'lucide-react';

const SkillsForm = () => {
  const { state, updateSection } = useCV();
  const skills = state.skills || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event, categoryId) => {
    const { active, over } = event;
    if (active.id !== over.id) {
        const categoryIndex = skills.findIndex(c => c.id === categoryId);
        const category = skills[categoryIndex];
        const oldIndex = category.items.findIndex((item) => item.id === active.id);
        const newIndex = category.items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(category.items, oldIndex, newIndex);
        const newSkills = [...skills];
        newSkills[categoryIndex] = { ...category, items: newItems };
        updateSection('skills', newSkills);
    }
  };

  const handleCategoryChange = (id, value) => {
    const newSkills = skills.map(c => c.id === id ? { ...c, category: value } : c);
    updateSection('skills', newSkills);
  };

  const handleDeleteCategory = (id) => {
    updateSection('skills', skills.filter(c => c.id !== id));
  };

  const handleAddCategory = () => {
    const newCat = {
        id: Date.now().toString(),
        category: 'Nouvelle Catégorie',
        items: []
    };
    updateSection('skills', [...skills, newCat]);
  };

  const handleAddItem = (categoryId) => {
    const newSkills = skills.map(c => {
        if (c.id === categoryId) {
            return {
                ...c,
                items: [...c.items, { id: Date.now().toString(), name: '' }]
            };
        }
        return c;
    });
    updateSection('skills', newSkills);
  };

  const handleItemChange = (categoryId, itemId, value) => {
      const newSkills = skills.map(c => {
        if (c.id === categoryId) {
            return {
                ...c,
                items: c.items.map(i => i.id === itemId ? { ...i, name: value } : i)
            };
        }
        return c;
    });
    updateSection('skills', newSkills);
  };

  const handleDeleteItem = (categoryId, itemId) => {
      const newSkills = skills.map(c => {
        if (c.id === categoryId) {
            return {
                ...c,
                items: c.items.filter(i => i.id !== itemId)
            };
        }
        return c;
    });
    updateSection('skills', newSkills);
  };

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Compétences</h2>
        <button
            onClick={handleAddCategory}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
            <Plus size={16} className="mr-1" /> Ajouter Catégorie
        </button>
      </div>

      {skills.map((cat) => (
        <div key={cat.id} className="border rounded-md p-4 bg-gray-50">
            <div className="flex justify-between mb-4">
                <input
                    value={cat.category}
                    onChange={(e) => handleCategoryChange(cat.id, e.target.value)}
                    className="font-bold text-lg bg-transparent border-b border-gray-300 focus:border-blue-500 w-full mr-4"
                />
                <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={18} />
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(e, cat.id)}
                id={`dnd-${cat.id}`} // Unique ID for context if needed, but actually DndContext should handle its own ID.
            >
                <SortableContext
                    items={cat.items.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {cat.items.map(item => (
                            <SortableItem key={item.id} id={item.id}>
                                <div className="flex items-center w-full">
                                    <input
                                        value={item.name}
                                        onChange={(e) => handleItemChange(cat.id, item.id, e.target.value)}
                                        className="flex-grow border rounded p-1 text-sm mr-2"
                                    />
                                    <button onClick={() => handleDeleteItem(cat.id, item.id)} className="text-red-400 hover:text-red-600">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </SortableItem>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
            <button
                onClick={() => handleAddItem(cat.id)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
                <Plus size={14} className="mr-1" /> Ajouter Compétence
            </button>
        </div>
      ))}
    </div>
  );
};

export default SkillsForm;

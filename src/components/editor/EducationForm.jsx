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

const EducationForm = () => {
  const { state, updateSection } = useCV();
  const education = state.education || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = education.findIndex((item) => item.id === active.id);
      const newIndex = education.findIndex((item) => item.id === over.id);
      updateSection('education', arrayMove(education, oldIndex, newIndex));
    }
  };

  const handleChange = (id, field, value) => {
    const newEducation = education.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    updateSection('education', newEducation);
  };

  const handleDelete = (id) => {
    const newEducation = education.filter((item) => item.id !== id);
    updateSection('education', newEducation);
  };

  const handleAdd = () => {
    const newItem = {
      id: Date.now().toString(),
      degree: '',
      school: '',
      city: '',
      dates: ''
    };
    updateSection('education', [newItem, ...education]);
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Formations</h2>
        <button
            onClick={handleAdd}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
            <Plus size={16} className="mr-1" /> Ajouter
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={education.map(e => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {education.map((item) => (
              <SortableItem key={item.id} id={item.id}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                    <div className="col-span-1">
                        <input
                            placeholder="Diplôme"
                            value={item.degree}
                            onChange={(e) => handleChange(item.id, 'degree', e.target.value)}
                            className="w-full border rounded p-1 text-sm font-semibold"
                        />
                    </div>
                    <div className="col-span-1">
                        <input
                            placeholder="Établissement"
                            value={item.school}
                            onChange={(e) => handleChange(item.id, 'school', e.target.value)}
                            className="w-full border rounded p-1 text-sm"
                        />
                    </div>
                    <div className="col-span-1">
                         <input
                            placeholder="Ville"
                            value={item.city}
                            onChange={(e) => handleChange(item.id, 'city', e.target.value)}
                            className="w-full border rounded p-1 text-sm"
                        />
                    </div>
                     <div className="col-span-1">
                         <input
                            placeholder="Dates"
                            value={item.dates}
                            onChange={(e) => handleChange(item.id, 'dates', e.target.value)}
                            className="w-full border rounded p-1 text-sm"
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2 flex justify-end">
                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 text-sm flex items-center">
                            <Trash2 size={14} className="mr-1"/> Supprimer
                        </button>
                    </div>
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default EducationForm;

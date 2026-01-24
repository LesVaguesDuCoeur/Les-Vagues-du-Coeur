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

const ExperienceForm = () => {
  const { state, updateSection } = useCV();
  const experiences = state.experiences || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = experiences.findIndex((item) => item.id === active.id);
      const newIndex = experiences.findIndex((item) => item.id === over.id);
      updateSection('experiences', arrayMove(experiences, oldIndex, newIndex));
    }
  };

  const handleChange = (id, field, value) => {
    const newExperiences = experiences.map((exp) => {
      if (exp.id === id) {
        return { ...exp, [field]: value };
      }
      return exp;
    });
    updateSection('experiences', newExperiences);
  };

  const handleDelete = (id) => {
    const newExperiences = experiences.filter((exp) => exp.id !== id);
    updateSection('experiences', newExperiences);
  };

  const handleAdd = () => {
    const newExp = {
      id: Date.now().toString(),
      title: '',
      company: '',
      city: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    updateSection('experiences', [newExp, ...experiences]); // Add to top
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Expériences Professionnelles</h2>
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
          items={experiences.map(e => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {experiences.map((exp) => (
              <SortableItem key={exp.id} id={exp.id}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                    <div className="col-span-1">
                        <input
                            placeholder="Titre du poste"
                            value={exp.title}
                            onChange={(e) => handleChange(exp.id, 'title', e.target.value)}
                            className="w-full border rounded p-1 text-sm font-semibold"
                        />
                    </div>
                    <div className="col-span-1">
                        <input
                            placeholder="Entreprise"
                            value={exp.company}
                            onChange={(e) => handleChange(exp.id, 'company', e.target.value)}
                            className="w-full border rounded p-1 text-sm"
                        />
                    </div>
                    <div className="col-span-1">
                         <input
                            placeholder="Ville"
                            value={exp.city}
                            onChange={(e) => handleChange(exp.id, 'city', e.target.value)}
                            className="w-full border rounded p-1 text-sm"
                        />
                    </div>
                     <div className="col-span-1 flex space-x-2">
                         <input
                            placeholder="Date début"
                            value={exp.startDate}
                            onChange={(e) => handleChange(exp.id, 'startDate', e.target.value)}
                            className="w-1/2 border rounded p-1 text-sm"
                        />
                         <input
                            placeholder="Date fin"
                            value={exp.endDate}
                            onChange={(e) => handleChange(exp.id, 'endDate', e.target.value)}
                            className="w-1/2 border rounded p-1 text-sm"
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <textarea
                            placeholder="Description"
                            value={exp.description}
                            onChange={(e) => handleChange(exp.id, 'description', e.target.value)}
                            rows={3}
                            className="w-full border rounded p-1 text-sm"
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2 flex justify-end">
                        <button onClick={() => handleDelete(exp.id)} className="text-red-500 hover:text-red-700 text-sm flex items-center">
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

export default ExperienceForm;

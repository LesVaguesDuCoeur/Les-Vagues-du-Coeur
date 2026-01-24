import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export const SortableItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-50 border rounded-md mb-2">
      <div className="flex items-start p-2">
        <button {...attributes} {...listeners} className="mt-2 mr-2 cursor-grab text-gray-400 hover:text-gray-600">
            <GripVertical size={20} />
        </button>
        <div className="flex-grow">
            {children}
        </div>
      </div>
    </div>
  );
};

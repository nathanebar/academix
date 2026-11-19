import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import SortableItem from './SortableItem';
import { GenericSortableList } from './GenericSortableList/GenericSortableList';


function MySortableList() {
  const [items, setItems] = useState(['Item 1', 'Item 2', 'Item 3']);



  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  
  if (over) {
    const oldIndex = items.indexOf(active.id as string);
    const newIndex = items.indexOf(over.id as string);
    
    const newItems = [...items];
    const [movedItem] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, movedItem);
    
    setItems(newItems);
  }
}

type User = {
  id: number;
  name: string;
};

const [users, setUsers] = useState<User[]>([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Bob2' },
  { id: 4, name: 'Bob3' },
]);

  return (


<GenericSortableList
  items={users}
  onItemsChange={setUsers}
  idExtractor={(user) => user.id} 
  renderItem={(u) => (
   <div style={{
        padding: '15px',
        margin: '8px 0',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        cursor: 'grab',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        userSelect: 'none',
      }}>
      <div style={{ fontWeight: 'bold', color: '#495057' }}>
        User: {u.name}
      </div>
      <div style={{ fontSize: '12px', color: '#6c757d' }}>
        ID: {u.id}
      </div>
    </div>
  )}
/>


  );
}

export default MySortableList
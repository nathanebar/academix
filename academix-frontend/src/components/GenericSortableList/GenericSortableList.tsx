import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSSProperties } from "react";
import { CSS } from "@dnd-kit/utilities";
// הרכיב הפשוט שמאפשר גרירה
export function SortableItem({
  id,
  children,
}: {
  id: string | number;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 1000 : 1,
    pointerEvents: isDragging ? "none" : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

// הרכיב הגנרי
interface GenericSortableListProps<T> {
  items: T[];
  onItemsChange: (newItems: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  idExtractor?: (item: T) => string | number;
}

export function GenericSortableList<T>({
  items,
  onItemsChange,
  renderItem,
  idExtractor = (item) => String(item),
}: GenericSortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(
        (item) => idExtractor(item) === active.id
      );
      const newIndex = items.findIndex((item) => idExtractor(item) === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(items, oldIndex, newIndex);
        onItemsChange(newItems);
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragMove={(event: any) => {
        // כאן אפשר לבדוק אם הרכיב יוצא מהמסגרת
      }}
    >
      <SortableContext
        items={items.map(idExtractor)}
        strategy={verticalListSortingStrategy}
        disabled={false}
      >
        {items?.map((item, index) => (
          <SortableItem key={idExtractor(item)} id={idExtractor(item)}>
            {renderItem(item, index)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}

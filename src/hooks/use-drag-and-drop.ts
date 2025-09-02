import { useState, useMemo } from "react";
import {
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

interface UseDragAndDropOptions<T> {
  items: T[];
  getId: (item: T) => string;
  onReorder: (items: T[]) => void;
  strategy?: typeof rectSortingStrategy;
}

interface UseDragAndDropReturn<T> {
  sensors: ReturnType<typeof useSensors>;
  itemIds: string[];
  activeId: string | null;
  strategy: typeof rectSortingStrategy;
  collisionDetection: typeof closestCenter;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  activeItem: T | null;
}

export function useDragAndDrop<T>({
  items,
  getId,
  onReorder,
  strategy = rectSortingStrategy
}: UseDragAndDropOptions<T>): UseDragAndDropReturn<T> {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const itemIds = useMemo(() => items.map(getId), [items, getId]);

  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return items.find(item => getId(item) === activeId) || null;
  }, [activeId, items, getId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(item => getId(item) === active.id);
      const newIndex = items.findIndex(item => getId(item) === over?.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems);
    }

    setActiveId(null);
  };

  return {
    sensors,
    itemIds,
    activeId,
    strategy,
    collisionDetection: closestCenter,
    handleDragStart,
    handleDragEnd,
    activeItem
  };
}

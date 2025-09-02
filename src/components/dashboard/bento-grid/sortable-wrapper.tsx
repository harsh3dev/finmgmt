import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface SortableWrapperProps {
  id: string;
  children: (props: {
    dragHandleProps: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      attributes: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      listeners: any;
    };
    isDragging: boolean;
  }) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function SortableWrapper({ 
  id, 
  children, 
  className,
  style: customStyle 
}: SortableWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...customStyle,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group transition-all duration-300 ease-in-out",
        isDragging && "z-50 opacity-50",
        className
      )}
    >
      {children({
        dragHandleProps: { attributes, listeners },
        isDragging
      })}
    </div>
  );
}

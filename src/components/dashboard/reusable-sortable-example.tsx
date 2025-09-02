import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";
import { SortableWrapper } from "./bento-grid/sortable-wrapper";

interface DemoItem {
  id: string;
  title: string;
  content: string;
}

interface ReusableSortableCardProps {
  item: DemoItem;
  onEdit?: (item: DemoItem) => void;
  onDelete?: (item: DemoItem) => void;
}

// Example of how SortableWrapper can be reused in other contexts
export function ReusableSortableCard({ 
  item, 
  onEdit, 
  onDelete 
}: ReusableSortableCardProps) {
  return (
    <SortableWrapper 
      id={item.id}
      className="w-full"
    >
      {({ dragHandleProps, isDragging }) => (
        <Card className={`
          transition-all duration-200 
          ${isDragging ? 'shadow-lg scale-105' : 'hover:shadow-md'}
        `}>
          {/* Drag Handle */}
          <div
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <GripVertical className="h-3 w-3" />
            </Button>
          </div>

          <CardHeader>
            <CardTitle className="pr-8">{item.title}</CardTitle>
          </CardHeader>
          
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {item.content}
            </p>
            
            <div className="flex gap-2">
              {onEdit && (
                <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button size="sm" variant="destructive" onClick={() => onDelete(item)}>
                  Delete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </SortableWrapper>
  );
}

// Example usage component showing how to use the reusable components
export function ReusableSortableExample() {
  const [items] = React.useState<DemoItem[]>([
    { id: '1', title: 'Task 1', content: 'This is the first task' },
    { id: '2', title: 'Task 2', content: 'This is the second task' },
    { id: '3', title: 'Task 3', content: 'This is the third task' },
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Reusable Sortable Cards Example</h2>
      <div className="grid gap-4">
        {items.map(item => (
          <ReusableSortableCard
            key={item.id}
            item={item}
            onEdit={(item) => console.log('Edit:', item)}
            onDelete={(item) => console.log('Delete:', item)}
          />
        ))}
      </div>
    </div>
  );
}

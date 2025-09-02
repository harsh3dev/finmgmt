"use client";

import React from "react";
import {
  DndContext,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
} from "@dnd-kit/sortable";
import type { Widget, ApiEndpoint } from "@/types/widget";
import { cn } from "@/lib/utils";
import { useDragAndDrop } from "@/hooks/use-drag-and-drop";
import { useWidgetData } from "@/hooks/use-widget-data";
import { useWidgetGrid } from "@/hooks/use-widget-grid";
import { 
  SortableWidget, 
  DeleteConfirmationDialog, 
  DragOverlay as CustomDragOverlay 
} from "./bento-grid/index";

interface BentoGridProps {
  widgets: Widget[];
  apiEndpoints: ApiEndpoint[];
  onConfigureWidget: (widget: Widget) => void;
  onRemoveWidget: (widgetId: string) => void;
  onUpdateWidgetOrder: (widgets: Widget[]) => void;
}

export function BentoGrid({ 
  widgets, 
  apiEndpoints, 
  onConfigureWidget, 
  onRemoveWidget, 
  onUpdateWidgetOrder 
}: BentoGridProps) {
  // Custom hooks for state management
  const { widgetData, manualRefreshStates, handleManualRefresh } = useWidgetData(widgets, apiEndpoints);
  const {
    expandedWidget,
    deleteDialog,
    handleExpand,
    handleCollapse,
    handleRemoveWidget,
    confirmDelete,
    cancelDelete
  } = useWidgetGrid(onRemoveWidget);

  // Drag and drop functionality
  const {
    sensors,
    itemIds,
    activeId,
    strategy,
    collisionDetection,
    handleDragStart,
    handleDragEnd,
    activeItem
  } = useDragAndDrop({
    items: widgets,
    getId: (widget) => widget.id,
    onReorder: onUpdateWidgetOrder
  });

  if (widgets.length === 0) {
    return null;
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={itemIds} strategy={strategy}>
          <div className={cn(
            "grid gap-4 transition-all duration-300 items-start",
            "grid-cols-1", // Mobile
            "sm:grid-cols-1", // Small
            "md:grid-cols-2", // Medium
            "lg:grid-cols-2", // Large
            "xl:grid-cols-3", // Extra large
            "2xl:grid-cols-4", // 2XL
          )}
          style={{ gridAutoRows: 'min-content' }}>
            {widgets.map(widget => {
              const data = widgetData[widget.id] || { data: null, status: 'loading' };
              const isManualRefreshing = manualRefreshStates[widget.id] || false;
              const isExpanded = expandedWidget === widget.id;
              
              return (
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  data={data}
                  isExpanded={isExpanded}
                  isManualRefreshing={isManualRefreshing}
                  onExpand={() => handleExpand(widget.id)}
                  onCollapse={handleCollapse}
                  onManualRefresh={() => handleManualRefresh(widget)}
                  onConfigureWidget={onConfigureWidget}
                  onRemoveWidget={handleRemoveWidget}
                />
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId && activeItem ? (
            <CustomDragOverlay
              widget={activeItem}
              data={widgetData[activeId] || { data: null, status: 'loading' }}
              onConfigureWidget={onConfigureWidget}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        widget={deleteDialog.widget}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}

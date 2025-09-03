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
            "lg:grid-cols-3", // Large
            "xl:grid-cols-12", // Extra large: 12-col system
            "2xl:grid-cols-12", // 2XL also 12 columns
          )}
          style={{ gridAutoRows: 'min-content' }}>
            {widgets.map(widget => {
              const data = widgetData[widget.id] || { data: null, status: 'loading' };
              const isManualRefreshing = manualRefreshStates[widget.id] || false;
              const isExpanded = expandedWidget === widget.id;
              // Dynamic width scaling (relative ratios: card=1x, chart=2x, table=3x)
              // Grid columns: xl=3, 2xl=4. For xl (3 cols) table spans full row, chart spans 2.
              const spanClass = widget.displayType === 'table'
                ? 'xl:col-span-12 2xl:col-span-12'
                : widget.displayType === 'chart'
                  ? 'xl:col-span-8 2xl:col-span-8'
                  : 'xl:col-span-4 2xl:col-span-4';
              
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
                  // Pass span classes via wrapperClass prop (added below if not existing)
                  wrapperClassName={spanClass}
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

      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        widget={deleteDialog.widget}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}

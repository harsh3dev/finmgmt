import { useState } from "react";
import { Widget } from "@/types/widget";

interface UseWidgetGridReturn {
  expandedWidget: string | null;
  deleteDialog: {
    isOpen: boolean;
    widget: Widget | null;
  };
  handleExpand: (widgetId: string) => void;
  handleCollapse: () => void;
  handleRemoveWidget: (widget: Widget) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
}

export function useWidgetGrid(onRemoveWidget: (widgetId: string) => void): UseWidgetGridReturn {
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    widget: Widget | null;
  }>({
    isOpen: false,
    widget: null
  });

  const handleExpand = (widgetId: string) => {
    setExpandedWidget(widgetId);
  };

  const handleCollapse = () => {
    setExpandedWidget(null);
  };

  const handleRemoveWidget = (widget: Widget) => {
    setDeleteDialog({
      isOpen: true,
      widget: widget
    });
  };

  const confirmDelete = () => {
    if (deleteDialog.widget) {
      onRemoveWidget(deleteDialog.widget.id);
      if (expandedWidget === deleteDialog.widget.id) {
        setExpandedWidget(null);
      }
    }
    setDeleteDialog({
      isOpen: false,
      widget: null
    });
  };

  const cancelDelete = () => {
    setDeleteDialog({
      isOpen: false,
      widget: null
    });
  };

  return {
    expandedWidget,
    deleteDialog,
    handleExpand,
    handleCollapse,
    handleRemoveWidget,
    confirmDelete,
    cancelDelete
  };
}

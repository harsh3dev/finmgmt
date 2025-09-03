import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Widget, WidgetPosition } from '@/types/widget';
import { dashboardStorage } from '@/lib/dashboard-storage';

interface WidgetsState {
  widgets: Widget[];
  userWidgets: Widget[];
  importedWidgets: Widget[];
  loading: boolean;
  error: string | null;
  selectedWidget: Widget | null;
}

const initialState: WidgetsState = {
  widgets: [],
  userWidgets: [],
  importedWidgets: [],
  loading: false,
  error: null,
  selectedWidget: null,
};

// Async thunks for widget operations
export const loadWidgets = createAsyncThunk(
  'widgets/loadWidgets',
  async () => {
    try {
      console.log('🔄 Widgets: loadWidgets async thunk called');
      const widgets = await dashboardStorage.getWidgets();
      console.log(`📦 Widgets: loadWidgets returned ${widgets.length} widgets from dashboardStorage`);
      return widgets;
    } catch (error) {
      console.error('❌ Widgets: Error loading widgets:', error);
      throw error;
    }
  }
);

export const saveWidgets = createAsyncThunk(
  'widgets/saveWidgets',
  async (widgets: Widget[]) => {
    try {
      await dashboardStorage.saveWidgets(widgets);
      return widgets;
    } catch (error) {
      console.error('Error saving widgets:', error);
      throw error;
    }
  }
);

export const addWidget = createAsyncThunk(
  'widgets/addWidget',
  async (widget: Widget) => {
    try {
      await dashboardStorage.addWidget(widget);
      return widget;
    } catch (error) {
      console.error('Error adding widget:', error);
      throw error;
    }
  }
);

export const updateWidget = createAsyncThunk(
  'widgets/updateWidget',
  async ({ widgetId, updates }: { widgetId: string; updates: Partial<Widget> }) => {
    try {
      await dashboardStorage.updateWidget(widgetId, updates);
      return { widgetId, updates };
    } catch (error) {
      console.error('Error updating widget:', error);
      throw error;
    }
  }
);

export const removeWidget = createAsyncThunk(
  'widgets/removeWidget',
  async (widgetId: string) => {
    try {
      await dashboardStorage.removeWidget(widgetId);
      return widgetId;
    } catch (error) {
      console.error('Error removing widget:', error);
      throw error;
    }
  }
);

export const reorderWidgets = createAsyncThunk(
  'widgets/reorderWidgets',
  async (reorderedWidgets: Widget[]) => {
    try {
      await dashboardStorage.saveWidgets(reorderedWidgets);
      return reorderedWidgets;
    } catch (error) {
      console.error('Error reordering widgets:', error);
      throw error;
    }
  }
);

const widgetsSlice = createSlice({
  name: 'widgets',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedWidget: (state, action: PayloadAction<Widget | null>) => {
      state.selectedWidget = action.payload;
    },
    updateWidgetPosition: (state, action: PayloadAction<{ widgetId: string; position: WidgetPosition }>) => {
      const { widgetId, position } = action.payload;
      const widget = state.widgets.find(w => w.id === widgetId);
      if (widget) {
        widget.position = position;
        widget.updatedAt = new Date();
      }
    },
    // Local state updates that will be persisted later
    updateWidgetLocal: (state, action: PayloadAction<{ widgetId: string; updates: Partial<Widget> }>) => {
      const { widgetId, updates } = action.payload;
      const widgetIndex = state.widgets.findIndex(w => w.id === widgetId);
      if (widgetIndex !== -1) {
        state.widgets[widgetIndex] = { 
          ...state.widgets[widgetIndex], 
          ...updates, 
          updatedAt: new Date() 
        };
        // Update filtered arrays
        state.userWidgets = state.widgets.filter(w => !w.isImported);
        state.importedWidgets = state.widgets.filter(w => w.isImported);
      }
    },
    // Initialize from localStorage for immediate loading
    initializeFromStorage: (state) => {
      try {
        console.log('🔄 Widgets: initializeFromStorage called');
        const saved = localStorage.getItem('finance-dashboard-widgets');
        if (saved) {
          const widgets = JSON.parse(saved).map((widget: Widget) => ({
            ...widget,
            isImported: widget.isImported ?? false,
            createdAt: new Date(widget.createdAt),
            updatedAt: new Date(widget.updatedAt),
          }));
          console.log(`✅ Widgets: Loaded ${widgets.length} widgets from localStorage`);
          state.widgets = widgets;
          state.userWidgets = widgets.filter((w: Widget) => !w.isImported);
          state.importedWidgets = widgets.filter((w: Widget) => w.isImported);
        } else {
          console.log('ℹ️ Widgets: No data found in localStorage');
        }
      } catch (error) {
        console.error('❌ Widgets: Error loading widgets from localStorage:', error);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Load widgets
      .addCase(loadWidgets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadWidgets.fulfilled, (state, action) => {
        console.log(`✅ Widgets: loadWidgets.fulfilled - setting ${action.payload.length} widgets in state`);
        state.loading = false;
        state.widgets = action.payload;
        state.userWidgets = action.payload.filter(w => !w.isImported);
        state.importedWidgets = action.payload.filter(w => w.isImported);
      })
      .addCase(loadWidgets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load widgets';
      })
      
      // Save widgets
      .addCase(saveWidgets.fulfilled, (state, action) => {
        state.widgets = action.payload;
        state.userWidgets = action.payload.filter(w => !w.isImported);
        state.importedWidgets = action.payload.filter(w => w.isImported);
      })
      .addCase(saveWidgets.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to save widgets';
      })
      
      // Add widget
      .addCase(addWidget.fulfilled, (state, action) => {
        state.widgets.push(action.payload);
        if (action.payload.isImported) {
          state.importedWidgets.push(action.payload);
        } else {
          state.userWidgets.push(action.payload);
        }
      })
      .addCase(addWidget.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to add widget';
      })
      
      // Update widget
      .addCase(updateWidget.fulfilled, (state, action) => {
        const { widgetId, updates } = action.payload;
        const widgetIndex = state.widgets.findIndex(w => w.id === widgetId);
        if (widgetIndex !== -1) {
          state.widgets[widgetIndex] = { ...state.widgets[widgetIndex], ...updates };
          // Update filtered arrays
          state.userWidgets = state.widgets.filter(w => !w.isImported);
          state.importedWidgets = state.widgets.filter(w => w.isImported);
        }
      })
      .addCase(updateWidget.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update widget';
      })
      
      // Remove widget
      .addCase(removeWidget.fulfilled, (state, action) => {
        const widgetId = action.payload;
        state.widgets = state.widgets.filter(w => w.id !== widgetId);
        state.userWidgets = state.userWidgets.filter(w => w.id !== widgetId);
        state.importedWidgets = state.importedWidgets.filter(w => w.id !== widgetId);
        if (state.selectedWidget?.id === widgetId) {
          state.selectedWidget = null;
        }
      })
      .addCase(removeWidget.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to remove widget';
      })
      
      // Reorder widgets
      .addCase(reorderWidgets.fulfilled, (state, action) => {
        state.widgets = action.payload;
        state.userWidgets = action.payload.filter(w => !w.isImported);
        state.importedWidgets = action.payload.filter(w => w.isImported);
      })
      .addCase(reorderWidgets.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to reorder widgets';
      });
  },
});

// Selectors
export const selectWidgets = (state: { widgets: WidgetsState }) => state.widgets.widgets;
export const selectUserWidgets = (state: { widgets: WidgetsState }) => state.widgets.userWidgets;
export const selectImportedWidgets = (state: { widgets: WidgetsState }) => state.widgets.importedWidgets;
export const selectWidgetsLoading = (state: { widgets: WidgetsState }) => state.widgets.loading;
export const selectWidgetsError = (state: { widgets: WidgetsState }) => state.widgets.error;
export const selectSelectedWidget = (state: { widgets: WidgetsState }) => state.widgets.selectedWidget;

export const selectWidgetById = (widgetId: string) => 
  (state: { widgets: WidgetsState }) => 
    state.widgets.widgets.find(w => w.id === widgetId);

export const selectWidgetsByApiEndpoint = (apiEndpointId: string) => 
  (state: { widgets: WidgetsState }) => 
    state.widgets.widgets.filter(w => w.apiEndpointId === apiEndpointId);

export const selectWidgetCount = (state: { widgets: WidgetsState }) => state.widgets.widgets.length;
export const selectUserWidgetCount = (state: { widgets: WidgetsState }) => state.widgets.userWidgets.length;
export const selectImportedWidgetCount = (state: { widgets: WidgetsState }) => state.widgets.importedWidgets.length;

export const {
  clearError,
  setSelectedWidget,
  updateWidgetPosition,
  updateWidgetLocal,
  initializeFromStorage,
} = widgetsSlice.actions;

export default widgetsSlice.reducer;

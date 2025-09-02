import { useState, useEffect } from "react";
import { Widget, ApiResponse, ApiEndpoint } from "@/types/widget";
import { apiService } from "@/lib/api-service";

interface UseWidgetDataReturn {
  widgetData: Record<string, ApiResponse>;
  manualRefreshStates: Record<string, boolean>;
  handleManualRefresh: (widget: Widget) => Promise<void>;
}

export function useWidgetData(
  widgets: Widget[], 
  apiEndpoints: ApiEndpoint[]
): UseWidgetDataReturn {
  const [widgetData, setWidgetData] = useState<Record<string, ApiResponse>>({});
  const [refreshTimers, setRefreshTimers] = useState<Record<string, NodeJS.Timeout>>({});
  const [manualRefreshStates, setManualRefreshStates] = useState<Record<string, boolean>>({});

  const fetchWidgetData = async (widget: Widget, options: { bypassCache?: boolean } = {}) => {
    setWidgetData(prev => ({
      ...prev,
      [widget.id]: { ...prev[widget.id], status: 'loading' }
    }));

    try {
      let endpoint = apiEndpoints.find(api => api.id === widget.apiEndpointId);
      
      if (!endpoint) {
        endpoint = apiEndpoints.find(api => api.url === widget.apiUrl);
      }
      
      if (!endpoint) {
        throw new Error('API endpoint not found for widget');
      }

      const response = await apiService.fetchData(endpoint, {
        bypassCache: options.bypassCache,
        timeout: 30000
      });

      setWidgetData(prev => ({
        ...prev,
        [widget.id]: {
          ...response,
          nextUpdate: response.status === 'success' 
            ? new Date(Date.now() + widget.refreshInterval * 1000)
            : undefined
        }
      }));
    } catch (error) {
      setWidgetData(prev => ({
        ...prev,
        [widget.id]: {
          data: null,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          lastUpdated: new Date()
        }
      }));
    }
  };

  const handleManualRefresh = async (widget: Widget) => {
    setManualRefreshStates(prev => ({ ...prev, [widget.id]: true }));
    
    setWidgetData(prev => ({
      ...prev,
      [widget.id]: { ...prev[widget.id], status: 'loading' }
    }));
    
    try {
      let endpoint = apiEndpoints.find(api => api.id === widget.apiEndpointId);
      
      if (!endpoint) {
        endpoint = apiEndpoints.find(api => api.url === widget.apiUrl);
      }
      
      if (!endpoint) {
        throw new Error('API endpoint not found for widget');
      }

      const response = await apiService.forceRefresh(endpoint);

      setWidgetData(prev => ({
        ...prev,
        [widget.id]: {
          ...response,
          nextUpdate: response.status === 'success' 
            ? new Date(Date.now() + widget.refreshInterval * 1000)
            : undefined
        }
      }));
    } catch (error) {
      setWidgetData(prev => ({
        ...prev,
        [widget.id]: {
          data: null,
          status: 'error',
          error: error instanceof Error ? error.message : 'Manual refresh failed',
          lastUpdated: new Date()
        }
      }));
    } finally {
      setTimeout(() => {
        setManualRefreshStates(prev => ({ ...prev, [widget.id]: false }));
      }, 500);
    }
  };

  useEffect(() => {
    // Clear existing timers
    Object.values(refreshTimers).forEach(timer => clearInterval(timer));

    const newTimers: Record<string, NodeJS.Timeout> = {};
    
    widgets.forEach(widget => {
      fetchWidgetData(widget, { bypassCache: false });
      
      const timer = setInterval(() => {
        fetchWidgetData(widget, { bypassCache: false });
      }, widget.refreshInterval * 1000);
      
      newTimers[widget.id] = timer;
    });

    setRefreshTimers(newTimers);

    return () => {
      Object.values(newTimers).forEach(timer => clearInterval(timer));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgets]);

  return {
    widgetData,
    manualRefreshStates,
    handleManualRefresh
  };
}

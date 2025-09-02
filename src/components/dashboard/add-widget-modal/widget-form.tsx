import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { 
  REFRESH_INTERVALS,
} from "@/constants/widget-modal";
import type { CreateWidgetInput } from "@/lib/validation";
import type { ApiEndpoint } from "@/types/widget";
import { ErrorDisplay } from "./error-display";

interface WidgetFormProps {
  widgetData: CreateWidgetInput;
  errors: Record<string, string>;
  apiEndpoints: ApiEndpoint[];
  onFieldChange: <K extends keyof CreateWidgetInput>(field: K, value: CreateWidgetInput[K]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function WidgetForm({ 
  widgetData, 
  errors, 
  apiEndpoints, 
  onFieldChange, 
  onSubmit, 
  onCancel 
}: WidgetFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Widget Name</Label>
          <Input
            id="name"
            placeholder="e.g., Stock Prices, Portfolio Value"
            value={widgetData.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="apiEndpoint">API Endpoint</Label>
          <Select
            value={widgetData.apiEndpointId}
            onValueChange={(value) => onFieldChange('apiEndpointId', value)}
          >
            <SelectTrigger className={errors.apiEndpointId ? "border-destructive" : ""}>
              <SelectValue placeholder={apiEndpoints.length === 0 ? "Create a new API endpoint" : "Select an API endpoint"} />
            </SelectTrigger>
            <SelectContent>
              {apiEndpoints.length === 0 ? (
                <SelectItem value="new">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">Create New API Endpoint</span>
                      <span className="text-sm text-muted-foreground">
                        No API endpoints found - create your first one
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ) : (
                <>
                  {apiEndpoints.map((endpoint) => (
                    <SelectItem key={endpoint.id} value={endpoint.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{endpoint.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {endpoint.category} • {endpoint.url}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="new">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Add New API Endpoint</span>
                    </div>
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          {errors.apiEndpointId && (
            <p className="text-sm text-destructive">{errors.apiEndpointId}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="refreshInterval">Refresh Interval</Label>
          <Select
            value={widgetData.refreshInterval.toString()}
            onValueChange={(value) => onFieldChange('refreshInterval', parseInt(value))}
          >
            <SelectTrigger className={errors.refreshInterval ? "border-destructive" : ""}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REFRESH_INTERVALS.map((interval) => (
                <SelectItem key={interval.value} value={interval.value.toString()}>
                  {interval.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.refreshInterval && (
            <p className="text-sm text-destructive">{errors.refreshInterval}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Minimum 30 seconds to avoid rate limiting. Display type will be automatically determined based on your data structure.
          </p>
        </div>

        <ErrorDisplay errors={errors} />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={!widgetData.name || !widgetData.apiEndpointId}
        >
          {widgetData.apiEndpointId === 'new' 
            ? 'Next: Configure API' 
            : 'Add Widget'}
        </Button>
      </div>
    </form>
  );
}

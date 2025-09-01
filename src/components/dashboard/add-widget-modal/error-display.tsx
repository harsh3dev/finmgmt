import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  errors: Record<string, string>;
  title?: string;
}

export function ErrorDisplay({ errors, title = "Please fix the following errors:" }: ErrorDisplayProps) {
  if (Object.keys(errors).length === 0) return null;

  return (
    <Card className="border-destructive">
      <CardContent className="pt-6">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-destructive">{title}</h4>
            <ul className="text-sm text-destructive space-y-1">
              {Object.entries(errors).map(([field, message]) => (
                <li key={field} className="flex items-start gap-1">
                  {field !== 'general' && (
                    <span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  )}
                  <span>{message}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

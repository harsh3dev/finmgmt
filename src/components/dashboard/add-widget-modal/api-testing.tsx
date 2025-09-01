import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, TestTube } from "lucide-react";

interface ApiTestingProps {
  isTestingApi: boolean;
  apiTestResult: { success: boolean; message: string } | null;
  onTest: () => void;
  disabled?: boolean;
}

export function ApiTesting({ 
  isTestingApi, 
  apiTestResult, 
  onTest, 
  disabled = false 
}: ApiTestingProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Test API Connection</h4>
            <p className="text-sm text-muted-foreground">
              Verify that your API endpoint is working correctly
            </p>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onTest}
            disabled={disabled || isTestingApi}
          >
            {isTestingApi ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Test API
              </>
            )}
          </Button>
        </div>
        
        {apiTestResult && (
          <div className="mt-4 flex items-start gap-2">
            {apiTestResult.success ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Success
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{apiTestResult.message}</p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">
                      Failed
                    </Badge>
                  </div>
                  <p className="text-sm text-destructive">{apiTestResult.message}</p>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

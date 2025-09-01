import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Terminal, Wand2 } from "lucide-react";

interface CurlInputProps {
  curlCommand: string;
  isParsing: boolean;
  parseError: string | null;
  onCurlChange: (command: string) => void;
  onParse: () => void;
}

export function CurlInput({ 
  curlCommand, 
  isParsing, 
  parseError, 
  onCurlChange, 
  onParse 
}: CurlInputProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          cURL Command
        </CardTitle>
        <CardDescription>
          Paste your cURL command to automatically configure the API endpoint
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="curl -X GET 'https://api.example.com/data' -H 'Authorization: Bearer token'"
          value={curlCommand}
          onChange={(e) => onCurlChange(e.target.value)}
          className={parseError ? "border-destructive" : ""}
          rows={3}
        />
        {parseError && (
          <p className="text-sm text-destructive">{parseError}</p>
        )}
        <Button 
          type="button" 
          variant="outline" 
          onClick={onParse}
          disabled={!curlCommand.trim() || isParsing}
          className="w-full"
        >
          {isParsing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Parsing cURL command...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Parse cURL Command
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

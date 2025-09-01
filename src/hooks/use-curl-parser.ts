import { useState } from 'react';
import { apiService } from '@/lib/api-service';
import type { CreateApiEndpointInput } from '@/lib/validation';

export function useCurlParser() {
  const [curlCommand, setCurlCommand] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const parseCurlToForm = async (onParsed?: (parsed: Partial<CreateApiEndpointInput>) => void) => {
    if (!curlCommand.trim()) {
      setParseError('Please enter a cURL command');
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {      
      const parsed = apiService.parseCurlCommand(curlCommand);
      
      if (!parsed.url) {
        setParseError('No valid URL found in cURL command');
        return;
      }
      
      const parsedData: Partial<CreateApiEndpointInput> = {
        url: parsed.url,
        headers: { ...parsed.headers },
      };

      // Auto-populate name if not set
      if (parsed.url) {
        try {
          const urlObj = new URL(parsed.url);
          const hostname = urlObj.hostname.replace('www.', '');
          parsedData.name = `API from ${hostname}`;
        } catch {
          // Ignore URL parsing errors for name generation
        }
      }
      
      if (onParsed) {
        onParsed(parsedData);
      }
      
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Invalid cURL command format');
    } finally {
      setIsParsing(false);
    }
  };

  const updateCurlCommand = (command: string) => {
    setCurlCommand(command);
    if (parseError) {
      setParseError(null);
    }
  };

  const reset = () => {
    setCurlCommand("");
    setIsParsing(false);
    setParseError(null);
  };

  return {
    curlCommand,
    isParsing,
    parseError,
    updateCurlCommand,
    parseCurlToForm,
    reset,
    hasCommand: curlCommand.trim().length > 0
  };
}

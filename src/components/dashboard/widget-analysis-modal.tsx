"use client";

import { useState, useEffect, useMemo } from 'react';
import { Widget, ApiEndpoint } from '@/types/widget';
import { useWidgetAnalysis } from '@/hooks/use-widget-analysis';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, StopCircle, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface WidgetAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: Widget[];
  apiEndpoints: ApiEndpoint[];
}

export function WidgetAnalysisModal({ open, onOpenChange, widgets, apiEndpoints }: WidgetAnalysisModalProps) {
  const [mode, setMode] = useState<'full' | 'quick'>('full');
  const { output, status, error, start, cancel, tokenCount } = useWidgetAnalysis(widgets, apiEndpoints, { mode });

  const rendered = useMemo(() => {
    let text = output;
    if (text.startsWith('```')) {
      const firstLineEnd = text.indexOf('\n');
      const firstLine = text.substring(0, firstLineEnd).toLowerCase();
      if (firstLine.includes('```markdown') || firstLine.includes('```md')) {
        text = text.substring(firstLineEnd + 1);
      }
      if (text.endsWith('```')) {
        text = text.slice(0, -3);
      }
    }
    return text.trim();
  }, [output]);

  useEffect(() => {
    if (open) {
      start({ mode });
    } else {
      cancel();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  const downloadMarkdown = () => {
    const blob = new Blob([output], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'widget-analysis.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[75vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b bg-muted/40">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Widget Configuration Analysis
          </DialogTitle>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline">Widgets: {widgets.length}</Badge>
            <Badge variant="outline">APIs: {apiEndpoints.length}</Badge>
            <Badge variant={mode === 'quick' ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => setMode(mode === 'quick' ? 'full' : 'quick')}>
              Mode: {mode}
            </Badge>
            {status === 'streaming' && <Badge className="bg-emerald-600">Streaming</Badge>}
            {status === 'error' && <Badge variant="destructive">Error</Badge>}
          </div>
        </DialogHeader>
        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-6">
            {status === 'idle' && (
              <div className="text-sm text-muted-foreground">Initiate an AI analysis of your current widget configuration.</div>
            )}
            {status === 'loading' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/> Preparing analysis...</div>
            )}
            <article className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{rendered}</ReactMarkdown>
            </article>
            {error && <div className="mt-4 text-sm text-destructive">{error}</div>}
          </ScrollArea>
          <div className="px-6 py-3 border-t bg-background flex items-center gap-2 justify-between">
            <div className="text-xs text-muted-foreground">
              Status: {status} • {tokenCount} tokens
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadMarkdown} disabled={!output}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              {status === 'streaming' ? (
                <Button variant="destructive" size="sm" onClick={cancel}>
                  <StopCircle className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              ) : (
                <Button size="sm" onClick={() => start({ mode })} disabled={status === 'loading'}>
                  <Sparkles className="h-4 w-4 mr-1" />
                  {status === 'done' ? 'Re-run' : 'Analyze'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

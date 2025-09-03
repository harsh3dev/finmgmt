"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { Widget, ApiEndpoint } from '@/types/widget';

export interface AnalysisState {
  status: 'idle' | 'loading' | 'streaming' | 'error' | 'done';
  output: string;
  error?: string;
  startedAt?: number;
  finishedAt?: number;
  tokenCount: number;
  mode: 'full' | 'quick';
}

interface UseWidgetAnalysisOptions {
  mode?: 'full' | 'quick';
  autoStart?: boolean;
  message?: string;
}

export function useWidgetAnalysis(widgets: Widget[], apiEndpoints: ApiEndpoint[], opts: UseWidgetAnalysisOptions = {}) {
  const { mode = 'full', autoStart = false, message } = opts;
  const [state, setState] = useState<AnalysisState>({ status: 'idle', output: '', tokenCount: 0, mode });
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback((override?: { mode?: 'full' | 'quick'; message?: string }) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: 'loading', output: '', tokenCount: 0, mode: override?.mode || mode, startedAt: Date.now() });

    // Light projection / sanitization to reduce payload size
    const payload = {
      widgets: widgets.map(w => ({
        id: w.id,
        name: w.name,
        apiEndpointId: w.apiEndpointId,
        apiUrl: w.apiUrl,
        refreshInterval: w.refreshInterval,
        displayType: w.displayType,
        config: { selectedFields: w.config?.selectedFields || [] },
        isImported: w.isImported,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      })),
      apiEndpoints: apiEndpoints.map(a => ({ id: a.id, name: a.name, category: a.category, url: a.url })),
      mode: override?.mode || mode,
      message: override?.message || message,
    };

    fetch('/api/ai/widgets-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).then(res => {
      if (!res.ok || !res.body) throw new Error(`Request failed: ${res.status}`);
      setState(prev => ({ ...prev, status: 'streaming' }));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

  const pump = (): Promise<void> => reader.read().then(({ done, value }): Promise<void> | void => {
        if (done) {
          setState(prev => ({ ...prev, status: 'done', finishedAt: Date.now() }));
          return;
        }
        const chunk = decoder.decode(value);
        // Parse SSE: lines starting with 'data:'
        chunk.split(/\n\n/).forEach(block => {
          const line = block.trim();
            if (!line.startsWith('data:')) return;
            const jsonStr = line.replace(/^data:\s*/, '');
            try {
              const data = JSON.parse(jsonStr);
              if (data.done) {
                setState(prev => ({ ...prev, status: 'done', finishedAt: Date.now() }));
              } else if (data.text) {
                setState(prev => ({
                  ...prev,
                  output: prev.output + data.text,
                  tokenCount: prev.tokenCount + data.text.split(/\s+/).length,
                }));
              } else if (data.error) {
                setState(prev => ({ ...prev, status: 'error', error: data.error, finishedAt: Date.now() }));
              }
            } catch {
              // ignore parse errors
            }
        });
        return pump();
      }).catch(err => {
        if (controller.signal.aborted) return;
        setState(prev => ({ ...prev, status: 'error', error: err.message, finishedAt: Date.now() }));
      });
      return pump();
    }).catch(err => {
      if (controller.signal.aborted) return;
      setState(prev => ({ ...prev, status: 'error', error: err.message, finishedAt: Date.now() }));
    });
  }, [widgets, apiEndpoints, mode, message]);

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setState(prev => ({ ...prev, status: prev.status === 'done' ? 'done' : 'idle' }));
  }, []);

  useEffect(() => {
    if (autoStart && widgets.length) {
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return { ...state, start, cancel };
}

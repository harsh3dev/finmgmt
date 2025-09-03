"use client";

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DashboardTemplate, TemplateSetupConfig } from '@/types/template';
import { SecureApiKeyInput } from '@/components/ui/secure-api-key-input';
import { ApiEndpoint } from '@/types/widget';

interface TemplateApplyModalProps {
  isOpen: boolean;
  template: DashboardTemplate | null;
  onCancel: () => void;
  onApply: (config: TemplateSetupConfig) => void;
}

interface RequiredKeyDescriptor {
  service: string;
  location: 'query' | 'header';
  label: string;
  paramName?: string;
  headerName?: string;
  endpoints: string[]; // endpoint names
}

export function TemplateApplyModal({ isOpen, template, onCancel, onApply }: TemplateApplyModalProps) {
  const [customName, setCustomName] = useState('');
  const [rawKeys, setRawKeys] = useState<Record<string, string>>({});
  // Persist the last successfully stored raw key (even after SecureApiKeyInput clears its field)
  const [storedKeys, setStoredKeys] = useState<Record<string, string>>({});
  const [secureSet, setSecureSet] = useState<Record<string, boolean>>({});
  // Stable per-service handlers to avoid recreating callback identities each render (prevents effect loops)
  const keyChangeHandlersRef = useRef<Record<string, (hasKey: boolean, masked: string) => void>>({});

  const getKeyChangeHandler = useCallback((service: string) => {
    if (!keyChangeHandlersRef.current[service]) {
  keyChangeHandlersRef.current[service] = (hasKey: boolean) => {
        setSecureSet(prev => (prev[service] === hasKey ? prev : { ...prev, [service]: hasKey }));
      };
    }
    return keyChangeHandlersRef.current[service];
  }, []);
  const [submitting, setSubmitting] = useState(false);

  const requiredKeys: RequiredKeyDescriptor[] = useMemo(() => {
    if (!template) return [];
    const map: Record<string, RequiredKeyDescriptor> = {};
    template.apiEndpoints.forEach((api: ApiEndpoint) => {
      if (api.requiresApiKey && api.apiKeyService && api.apiKeyLocation) {
        const existing = map[api.apiKeyService];
        if (existing) {
          existing.endpoints.push(api.name);
        } else {
          map[api.apiKeyService] = {
            service: api.apiKeyService,
            location: api.apiKeyLocation,
            label: api.apiKeyService.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' API Key',
            paramName: api.apiKeyParamName,
            headerName: api.apiKeyHeaderName,
            endpoints: [api.name]
          };
        }
      }
    });
    return Object.values(map);
  }, [template]);

  const allKeysSatisfied = requiredKeys.every(k => secureSet[k.service] || (rawKeys[k.service] && rawKeys[k.service].trim().length > 0) || storedKeys[k.service]);

  const handleApply = () => {
    if (!template) return;
    if (!allKeysSatisfied) return;
    setSubmitting(true);
    const userProvidedApiKeys: Record<string, string> = {};
    requiredKeys.forEach(k => {
      if (rawKeys[k.service]?.trim()) {
        userProvidedApiKeys[k.service] = rawKeys[k.service].trim();
      } else if (storedKeys[k.service]?.trim()) {
        userProvidedApiKeys[k.service] = storedKeys[k.service].trim();
      }
    });
    onApply({ templateId: template.id, customName: customName.trim() || undefined, userProvidedApiKeys });
    setSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Apply Template</DialogTitle>
        </DialogHeader>
        {template && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
              <p className="text-sm text-muted-foreground">Provide required API keys to personalize this template.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Custom Prefix (optional)</label>
                <Input
                  placeholder="e.g. My Portfolio"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">If provided, this will prefix each widget name.</p>
              </div>
              {requiredKeys.length === 0 ? (
                <div className="flex items-start gap-2 rounded-md border p-3 bg-muted/30 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    No API keys required for this template.
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {requiredKeys.map(descriptor => (
                    <div key={descriptor.service} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {descriptor.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Used by {descriptor.endpoints.length} endpoint{descriptor.endpoints.length>1?'s':''}</span>
                      </div>
                      <SecureApiKeyInput
                        storageKey={descriptor.service}
                        label={descriptor.label}
                        placeholder={`Enter ${descriptor.label}`}
                        onChange={(val) => setRawKeys(prev => (prev[descriptor.service] === val ? prev : { ...prev, [descriptor.service]: val }))}
                        onSecureKeyChange={getKeyChangeHandler(descriptor.service)}
                        onKeyStored={(raw) => setStoredKeys(prev => (prev[descriptor.service] === raw ? prev : { ...prev, [descriptor.service]: raw }))}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Injected via {descriptor.location === 'query' ? `query parameter (${descriptor.paramName})` : `header (${descriptor.headerName})`}
                      </p>
                    </div>
                  ))}
                  <div className="text-xs text-muted-foreground flex gap-2 items-start">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    API keys are encrypted locally in your browser. Raw keys are only used to build endpoint URLs/headers during template application.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter className="mt-4 flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
          <Button onClick={handleApply} disabled={submitting || !template || !allKeysSatisfied}>
            {submitting ? 'Applying...' : 'Apply Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

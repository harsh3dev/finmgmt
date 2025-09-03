import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Shield, ShieldCheck } from 'lucide-react';
import { useSecureApiKey } from '@/hooks/use-secure-api-key';
import { cn } from '@/lib/utils';

interface SecureApiKeyInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSecureKeyChange?: (hasKey: boolean, maskedKey: string) => void;
  /** Called exactly when a key is successfully stored/updated (raw value before wipe) */
  onKeyStored?: (rawKey: string) => void;
  storageKey: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  required?: boolean;
  autoFocus?: boolean;
}

export function SecureApiKeyInput({
  label = 'API Key',
  placeholder = 'Enter your API key',
  value = '',
  onChange,
  onSecureKeyChange,
  onKeyStored,
  storageKey,
  className,
  disabled = false,
  error,
  helperText,
  required = false,
  autoFocus = false,
}: SecureApiKeyInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [showValue, setShowValue] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const {
    state,
    storeApiKey,
    updateApiKey,
    removeApiKey,
    getMaskedKey,
    clearError,
    isKeySet,
  } = useSecureApiKey({
    storageKey,
    autoLoad: true,
    onError: (error) => console.error('Secure API Key Error:', error),
  });

  // Update parent component when secure key changes
  useEffect(() => {
    onSecureKeyChange?.(isKeySet(), getMaskedKey());
  }, [isKeySet, getMaskedKey, onSecureKeyChange]);

  // Handle input value changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  }, [onChange]);

  // Save the API key securely
  const handleSaveKey = useCallback(async () => {
    if (!inputValue.trim()) return;

    const success = isKeySet() 
      ? await updateApiKey(inputValue.trim())
      : await storeApiKey(inputValue.trim());

    if (success) {
    // Provide raw key to parent before wiping local input
    onKeyStored?.(inputValue.trim());
      setInputValue('');
      setIsEditing(false);
      setShowValue(false);
      onChange?.('');
    }
  }, [inputValue, isKeySet, updateApiKey, storeApiKey, onChange, onKeyStored]);

  // Remove the stored key
  const handleRemoveKey = useCallback(async () => {
    const success = await removeApiKey();
    if (success) {
      setInputValue('');
      setIsEditing(false);
      setShowValue(false);
      onChange?.('');
    }
  }, [removeApiKey, onChange]);

  // Toggle editing mode
  const handleEditKey = useCallback(() => {
    setIsEditing(true);
    setInputValue('');
    clearError();
  }, [clearError]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setInputValue('');
    setShowValue(false);
    onChange?.('');
  }, [onChange]);

  // Toggle visibility (only for input, not stored keys)
  const toggleVisibility = useCallback(() => {
    setShowValue(prev => !prev);
  }, []);

  const hasStoredKey = isKeySet();
  const maskedKey = getMaskedKey();
  const isLoading = state.isLoading;
  const hasError = !!(state.error || error);
  const displayError = state.error || error;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label with security indicator */}
      <div className="flex items-center justify-between">
        <Label htmlFor={`secure-api-key-${storageKey}`} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        
        <div className="flex items-center space-x-2">
          {hasStoredKey && (
            <Badge variant="secondary" className="text-xs">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Encrypted
            </Badge>
          )}
          {isLoading && (
            <Badge variant="outline" className="text-xs">
              Loading...
            </Badge>
          )}
        </div>
      </div>

      {/* Input/Display Area */}
      <div className="relative">
        {!isEditing && hasStoredKey ? (
          // Display masked key when stored and not editing
          <div className="flex items-center space-x-2">
            <div className="flex-1 px-3 py-2 bg-muted rounded-md border border-input text-sm font-mono">
              {maskedKey}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEditKey}
              disabled={disabled || isLoading}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveKey}
              disabled={disabled || isLoading}
              className="text-destructive hover:text-destructive"
            >
              Remove
            </Button>
          </div>
        ) : (
          // Input field for new/editing keys
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Input
                id={`secure-api-key-${storageKey}`}
                type={showValue ? 'text' : 'password'}
                placeholder={placeholder}
                value={inputValue}
                onChange={handleInputChange}
                disabled={disabled || isLoading}
                autoFocus={autoFocus}
                className={cn(
                  'pr-10 font-mono',
                  hasError && 'border-destructive focus:border-destructive'
                )}
              />
              
              {/* Toggle visibility button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={toggleVisibility}
                disabled={disabled || isLoading}
              >
                {showValue ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Action buttons when editing */}
            {(inputValue.trim() || isEditing) && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveKey}
                  disabled={disabled || isLoading || !inputValue.trim()}
                >
                  <Shield className="w-4 h-4 mr-1" />
                  Save
                </Button>
                
                {isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={disabled || isLoading}
                  >
                    Cancel
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Helper text or error */}
      {(helperText || hasError) && (
        <div className="text-sm">
          {hasError ? (
            <p className="text-destructive">{displayError}</p>
          ) : (
            <p className="text-muted-foreground">
              {helperText}
              {hasStoredKey && ' Key is encrypted and stored securely.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Specialized components for common use cases
export function AlphaVantageApiKeyInput(props: Omit<SecureApiKeyInputProps, 'storageKey'>) {
  return (
    <SecureApiKeyInput
      {...props}
      storageKey="alpha-vantage"
      label="Alpha Vantage API Key"
      placeholder="Enter your Alpha Vantage API key"
      helperText="Get your free API key from alphavantage.co"
    />
  );
}

export function CustomApiKeyInput({ 
  serviceName, 
  ...props 
}: Omit<SecureApiKeyInputProps, 'storageKey'> & { serviceName: string }) {
  return (
    <SecureApiKeyInput
      {...props}
      storageKey={`custom-${serviceName}`}
      helperText="Will be encrypted and stored securely in your browser"
    />
  );
}

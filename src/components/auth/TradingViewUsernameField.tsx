'use client';

import { useState, forwardRef } from 'react';
import { Check, ExternalLink, AlertCircle } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TradingViewUsernameFieldProps
  extends React.ComponentProps<typeof Input> {
  onVerify?: (username: string, isValid: boolean) => void;
}

export const TradingViewUsernameField = forwardRef<
  HTMLInputElement,
  TradingViewUsernameFieldProps
>(({ className, onVerify, onChange, value, ...props }, ref) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    'idle' | 'valid' | 'invalid' | 'error'
  >('idle');

  const validateUsername = (username: string): boolean => {
    // TradingView username validation rules:
    // - 3-15 characters
    // - Alphanumeric, underscores, and hyphens only
    // - Cannot start or end with underscore or hyphen
    // - Cannot have consecutive underscores or hyphens
    if (!username) return false;

    const isValidLength = username.length >= 3 && username.length <= 15;
    const isValidCharacters = /^[a-zA-Z0-9_-]+$/.test(username);
    const startsEndsCorrectly = /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(
      username
    );
    const noConsecutiveSpecial = !/[_-]{2,}/.test(username);

    return (
      isValidLength &&
      isValidCharacters &&
      startsEndsCorrectly &&
      noConsecutiveSpecial
    );
  };

  const verifyUsernameExists = async (username: string): Promise<boolean> => {
    try {
      // Check if the username exists on TradingView
      const response = await fetch(`/api/tradingview/verify-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const { exists } = await response.json();
      return exists;
    } catch (error) {
      console.error('Username verification error:', error);
      throw error;
    }
  };

  const handleVerification = async () => {
    const username = String(value || '').trim();

    if (!username) {
      setVerificationStatus('idle');
      return;
    }

    if (!validateUsername(username)) {
      setVerificationStatus('invalid');
      onVerify?.(username, false);
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('idle');

    try {
      const exists = await verifyUsernameExists(username);
      const isValid = exists;

      setVerificationStatus(isValid ? 'valid' : 'invalid');
      onVerify?.(username, isValid);
    } catch (error) {
      setVerificationStatus('error');
      onVerify?.(username, false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationStatus('idle');
    onChange?.(e);
  };

  const getInputClassName = () => {
    const baseClasses = 'pr-20';

    switch (verificationStatus) {
      case 'valid':
        return cn(
          baseClasses,
          'border-green-500 focus-visible:border-green-500'
        );
      case 'invalid':
      case 'error':
        return cn(
          baseClasses,
          'border-destructive focus-visible:border-destructive'
        );
      default:
        return baseClasses;
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'valid':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'invalid':
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    const username = String(value || '').trim();

    if (!username) return null;

    switch (verificationStatus) {
      case 'valid':
        return (
          <p className="text-sm text-green-600 dark:text-green-400">
            Username verified ✓
          </p>
        );
      case 'invalid':
        if (!validateUsername(username)) {
          return (
            <p className="text-sm text-destructive">
              Username must be 3-15 characters, alphanumeric with
              underscores/hyphens, cannot start/end with special characters.
            </p>
          );
        }
        return (
          <p className="text-sm text-destructive">
            Username not found on TradingView. Please check the spelling.
          </p>
        );
      case 'error':
        return (
          <p className="text-sm text-destructive">
            Unable to verify username. Please try again.
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          ref={ref}
          className={cn(getInputClassName(), className)}
          placeholder="TradingView username"
          value={value}
          onChange={handleInputChange}
          onBlur={() => {
            if (value && verificationStatus === 'idle') {
              handleVerification();
            }
          }}
          {...props}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {getStatusIcon()}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleVerification}
            disabled={isVerifying || !value}
          >
            {isVerifying ? '...' : 'Verify'}
          </Button>
        </div>
      </div>

      {getStatusMessage()}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>This will be used for TradingView alerts delivery</span>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          asChild
        >
          <a
            href="https://www.tradingview.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1"
          >
            <span>Find on TradingView</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </div>
    </div>
  );
});

TradingViewUsernameField.displayName = 'TradingViewUsernameField';

export default TradingViewUsernameField;

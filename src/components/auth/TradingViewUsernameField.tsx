'use client';

import { forwardRef } from 'react';
import { ExternalLink } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TradingViewUsernameFieldProps
  extends React.ComponentProps<typeof Input> {
  // No additional props needed
}

export const TradingViewUsernameField = forwardRef<
  HTMLInputElement,
  TradingViewUsernameFieldProps
>(({ className, onChange, value, ...props }, ref) => {
  const validateUsername = (username: string): boolean => {
    // TradingView username validation rules:
    // - 3-15 characters
    // - Alphanumeric, underscores, and hyphens only
    // - Cannot start or end with underscore or hyphen
    // - Cannot have consecutive underscores or hyphens
    if (!username) return true; // Allow empty for optional field

    const isValidLength = username.length >= 3;
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

  const username = String(value || '').trim();
  const isValid = validateUsername(username);
  const showError = username && !isValid;

  return (
    <div className="space-y-2">
      <Input
        ref={ref}
        className={cn(
          showError
            ? 'border-destructive focus-visible:border-destructive'
            : '',
          className
        )}
        placeholder="TradingView username (optional)"
        value={value}
        onChange={onChange}
        {...props}
      />

      {showError && (
        <p className="text-sm text-destructive">
          Username must be at least 3 characters, alphanumeric with
          underscores/hyphens, cannot start/end with special characters.
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Optional: Used for TradingView alerts delivery</span>
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

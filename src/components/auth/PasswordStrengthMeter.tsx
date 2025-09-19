'use client';

import { useMemo } from 'react';
import { Check, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: 'One number',
    test: (password) => /[0-9]/.test(password),
  },
  {
    id: 'special',
    label: 'One special character',
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
  showRequirements?: boolean;
}

export function PasswordStrengthMeter({
  password,
  className,
  showRequirements = true,
}: PasswordStrengthMeterProps) {
  const analysis = useMemo(() => {
    if (!password) {
      return {
        score: 0,
        strength: 'None',
        color: 'bg-muted',
        textColor: 'text-muted-foreground',
        percentage: 0,
        satisfiedRequirements: [],
      };
    }

    const satisfiedRequirements = requirements.filter((req) =>
      req.test(password)
    );
    const score = satisfiedRequirements.length;
    const percentage = (score / requirements.length) * 100;

    let strength: string;
    let color: string;
    let textColor: string;

    if (score <= 1) {
      strength = 'Very Weak';
      color = 'bg-destructive';
      textColor = 'text-destructive';
    } else if (score <= 2) {
      strength = 'Weak';
      color = 'bg-orange-500';
      textColor = 'text-orange-600';
    } else if (score <= 3) {
      strength = 'Fair';
      color = 'bg-yellow-500';
      textColor = 'text-yellow-600';
    } else if (score <= 4) {
      strength = 'Good';
      color = 'bg-blue-500';
      textColor = 'text-blue-600';
    } else {
      strength = 'Strong';
      color = 'bg-green-500';
      textColor = 'text-green-600';
    }

    return {
      score,
      strength,
      color,
      textColor,
      percentage,
      satisfiedRequirements,
    };
  }, [password]);

  if (!password) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password strength:</span>
        <span className={cn('font-medium', analysis.textColor)}>
          {analysis.strength}
        </span>
      </div>

      <div className="relative">
        <Progress value={analysis.percentage} className="h-2" />
        <div
          className={cn(
            'absolute inset-0 h-2 rounded-full transition-all',
            analysis.color
          )}
          style={{ width: `${analysis.percentage}%` }}
        />
      </div>

      {showRequirements && (
        <div className="space-y-1.5">
          {requirements.map((requirement) => {
            const isSatisfied = analysis.satisfiedRequirements.some(
              (req) => req.id === requirement.id
            );

            return (
              <div
                key={requirement.id}
                className={cn(
                  'flex items-center space-x-2 text-sm transition-colors',
                  isSatisfied
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full text-xs',
                    isSatisfied
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isSatisfied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </div>
                <span className={cn(isSatisfied && 'line-through')}>
                  {requirement.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PasswordStrengthMeter;

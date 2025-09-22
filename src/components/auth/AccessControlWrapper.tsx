'use client';

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown, Zap } from 'lucide-react';
import Link from 'next/link';

interface AccessControlWrapperProps {
  children: ReactNode;
  isAccessible: boolean;
  fallbackType?: 'blur' | 'lock' | 'upgrade';
  title?: string;
  description?: string;
  upgradeUrl?: string;
  className?: string;
}

export function AccessControlWrapper({
  children,
  isAccessible,
  fallbackType = 'lock',
  title = 'Premium Feature',
  description = 'Subscribe to unlock this feature',
  upgradeUrl = '/subscriptions',
  className,
}: AccessControlWrapperProps) {
  if (isAccessible) {
    return <>{children}</>;
  }

  const getFallbackContent = () => {
    switch (fallbackType) {
      case 'blur':
        return (
          <div className={`relative ${className}`}>
            <div className="filter blur-sm pointer-events-none">{children}</div>
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-lg">
              <Card className="bg-slate-800/90 border-slate-700 shadow-xl">
                <CardContent className="p-6 text-center">
                  <Lock className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {title}
                  </h3>
                  <p className="text-slate-400 mb-4">{description}</p>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link href={upgradeUrl}>
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade Now
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'upgrade':
        return (
          <Card
            className={`bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 ${className}`}
          >
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <Zap className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
              <p className="text-slate-400 mb-6">{description}</p>
              <Button
                asChild
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Link href={upgradeUrl}>
                  <Crown className="h-4 w-4 mr-2" />
                  Unlock Premium Features
                </Link>
              </Button>
            </CardContent>
          </Card>
        );

      default: // 'lock'
        return (
          <div
            className={`flex items-center justify-center p-8 bg-slate-800/30 border border-slate-700 rounded-lg ${className}`}
          >
            <div className="text-center">
              <Lock className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">
                {title}
              </h3>
              <p className="text-slate-500 mb-4">{description}</p>
              <Button
                asChild
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                <Link href={upgradeUrl}>View Plans</Link>
              </Button>
            </div>
          </div>
        );
    }
  };

  return getFallbackContent();
}

// Higher-order component for easier usage
export function withAccessControl<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  accessCheck: (props: T) => boolean,
  fallbackProps?: Partial<AccessControlWrapperProps>
) {
  return function AccessControlledComponent(props: T) {
    const isAccessible = accessCheck(props);

    return (
      <AccessControlWrapper isAccessible={isAccessible} {...fallbackProps}>
        <Component {...props} />
      </AccessControlWrapper>
    );
  };
}

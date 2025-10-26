'use client';

import { SessionProvider } from 'next-auth/react';
import { ReduxProvider } from '@/store/Provider';
import { Toaster } from '@/components/ui/sonner';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ReduxProvider>
        {children}
        <Toaster position="top-center" />
      </ReduxProvider>
    </SessionProvider>
  );
}

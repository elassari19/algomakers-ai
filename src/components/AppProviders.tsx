'use client';

import { SessionProvider } from 'next-auth/react';
import { ReduxProvider } from '@/store/Provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ReduxProvider>{children}</ReduxProvider>
    </SessionProvider>
  );
}

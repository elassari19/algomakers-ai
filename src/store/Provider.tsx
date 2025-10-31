'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from '.';
import { Loader2 } from 'lucide-react';
import { GradientBackground } from '@/components/ui/gradient-background';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <GradientBackground className="flex h-full w-full flex-col items-center justify-center gap-4">
          <div className='flex flex-col justify-center items-center'>
            <Loader2 className="h-6 w-6 animate-spin text-white" />
            <div className="text-white text-lg">Loading...</div>
          </div>
          </GradientBackground>
        }
        persistor={persistor}
      >
        {children}
      </PersistGate>
    </Provider>
  );
}

import { ReduxProvider } from '@/store/Provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ReduxProvider>{children}</ReduxProvider>;
}

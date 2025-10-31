'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GradientBackground } from '../ui/gradient-background';

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AuthRedirect({
  children,
  redirectTo = '/dashboard',
}: AuthRedirectProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, redirect them away from auth pages
    if (status === 'authenticated' && session) {
      router.replace(redirectTo);
    }
  }, [status, session, router, redirectTo]);

  // Show loading while checking authentication status
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <GradientBackground className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white" />
      </GradientBackground>
    );
  }

  // If user is authenticated, don't render the auth page content
  // while redirecting
  // if (status === 'authenticated') {
  //   return (
  //     <GradientBackground className="min-h-screen flex items-center justify-center">
  //       <div className="text-white text-lg">Redirecting...</div>
  //     </GradientBackground>
  //   );
  // }

  // User is not authenticated, render the auth page
  return <GradientBackground className="min-h-screen flex items-center justify-center">{children}</GradientBackground>;
}

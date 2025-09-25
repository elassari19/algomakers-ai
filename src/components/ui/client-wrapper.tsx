'use client';

import { useState, useEffect, ReactNode } from 'react';

interface ClientWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  dependencies?: any[];
}

/**
 * A reusable wrapper component that ensures hydration safety by only rendering
 * children on the client side after hydration is complete.
 *
 * This prevents hydration mismatches when components use client-side only APIs
 * like useRouter, useSearchParams, localStorage, etc.
 *
 * @param children - The content to render once client-side
 * @param fallback - Optional custom loading component
 * @param className - CSS classes to apply to the wrapper
 * @param dependencies - Optional array of dependencies to trigger re-evaluation of client state
 */
export function ClientWrapper({
  children,
  fallback,
  className,
  dependencies = [],
}: ClientWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, dependencies);

  if (!isClient) {
    return fallback ? (
      <div className={className}>{fallback}</div>
    ) : (
      <div
        className={`flex items-center justify-center p-4 ${className || ''}`}
      >
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        <span className="ml-3 text-white/80">Loading...</span>
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

/**
 * A hook version that just returns the client state
 */
export function useClientOnly(dependencies: any[] = []) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, dependencies);

  return isClient;
}

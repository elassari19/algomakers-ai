'use client';

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NotificationDismissButton({ notificationId }: { notificationId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return; // Prevent multiple clicks

    setIsLoading(true);
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        router.refresh();
      } else {
        console.error('Failed to dismiss notification', await res.text());
      }
    } catch (err) {
      console.error('Failed to dismiss notification', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDismiss}
      disabled={isLoading}
      className="inline-flex items-center justify-center rounded-md border px-2 py-1 text-sm text-slate-300 hover:bg-white/5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      title={isLoading ? "Dismissing..." : "Dismiss"}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <X className="h-4 w-4" />
      )}
    </button>
  );
}

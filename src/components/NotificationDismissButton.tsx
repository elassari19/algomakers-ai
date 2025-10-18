'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NotificationDismissButton({ notificationId }: { notificationId: string }) {
  const router = useRouter();

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
    }
  };

  return (
    <button
      onClick={handleDismiss}
      className="inline-flex items-center justify-center rounded-md border px-2 py-1 text-sm text-slate-300 hover:bg-white/5 cursor-pointer"
      title="Dismiss"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

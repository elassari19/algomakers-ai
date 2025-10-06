'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { GradientBackground } from '@/components/ui/gradient-background';

interface AccessDeniedCardProps {
  title?: string;
  message?: string;
  subMessage?: string;
  icon?: React.ReactNode;
}

export function AccessDeniedCard({ 
  title = "Access Denied",
  message = "You don't have permission to view this page.",
  subMessage = "Contact your administrator for access to this page.",
  icon
}: AccessDeniedCardProps) {
  return (
    <GradientBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8 max-w-md w-full text-center shadow-xl">
          {icon || <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />}
          <h1 className="text-2xl font-bold text-white mb-4">{title}</h1>
          <p className="text-gray-300 mb-6">{message}</p>
          {subMessage && (
            <div className="text-sm text-gray-400">
              {subMessage}
            </div>
          )}
        </div>
      </div>
    </GradientBackground>
  );
}
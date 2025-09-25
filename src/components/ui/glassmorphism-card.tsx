'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface GlassmorphismCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'blue' | 'orange' | 'purple' | 'green';
  hover?: boolean;
  shine?: boolean;
}

const variantStyles = {
  default:
    'bg-gradient-to-br from-blue-600/15 to-orange-400/25 border-purple-400/20',
  blue: 'bg-gradient-to-br from-blue-600/20 to-cyan-400/20 border-blue-400/30',
  orange:
    'bg-gradient-to-br from-orange-500/20 to-amber-400/20 border-orange-400/30',
  purple:
    'bg-gradient-to-br from-purple-600/20 to-indigo-400/20 border-purple-400/30',
  green:
    'bg-gradient-to-br from-green-600/20 to-emerald-400/20 border-green-400/30',
};

export function GlassmorphismCard({
  children,
  className,
  variant = 'default',
  hover = true,
  shine = true,
}: GlassmorphismCardProps) {
  const baseClasses =
    'group relative backdrop-blur-md border-2 rounded-xl overflow-hidden';
  const hoverClasses = hover
    ? 'hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl'
    : '';
  const variantClass = variantStyles[variant];

  return (
    <Card className={cn(baseClasses, variantClass, hoverClasses, className)}>
      {/* Gradient overlay on hover */}
      {hover && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Subtle shine effect */}
      {shine && (
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      )}
    </Card>
  );
}

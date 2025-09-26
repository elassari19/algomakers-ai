'use client';

import { ReactNode } from 'react';
import { DotPattern } from './dot-pattern';
import { cn } from '../../lib/utils';

interface DotPatternProps {
  className?: string;
  cx?: number;
  cy?: number;
  cr?: number;
}

interface GradientBackgroundProps {
  children: ReactNode;
  className?: string;
}

export function GradientBackground({
  children,
  className = '',
}: GradientBackgroundProps) {
  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Fixed Gradient Background */}
      <div className="fixed inset-0 -z-10">
        {/* Base background */}
        <div className="absolute inset-0 bg-[#0f060c]" />

        {/* Main egg-shaped gradient center covering 70% of page */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 30% 70%, #0f060c 0%, #1a0b11 20%, #2d1b24 40%, #0f060c 70%, transparent 100%)`,
            transform: 'rotate(-25deg)',
            transformOrigin: 'center',
          }}
        />

        {/* Top-right purple area */}
        <div
          className="absolute top-0 right-0 w-1/2 h-1/2"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 85% 15%, #6a1b9a 0%, #6a1b9aaa 25%, #6a1b9a66 50%, transparent 100%)',
          }}
        />

        {/* Bottom-left orange area */}
        <div
          className="absolute bottom-0 left-0 w-1/2 h-1/2"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 15% 85%, #8b4a2f 0%, #8b4a2faa 25%, #8b4a2f66 50%, transparent 100%)',
          }}
        />

        {/* Animated Background Elements */}
        <div className="absolute top-[10%] right-[10%] w-64 h-64 bg-[#6a1b9a]/12 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] bg-[#0f060c]/35 rounded-full blur-3xl animate-pulse delay-500"
          style={{
            transform: 'translate(-50%, -50%) rotate(-25deg)',
          }}
        />
        <div className="absolute bottom-[10%] left-[10%] w-64 h-64 bg-[#8b4a2f]/12 rounded-full blur-3xl animate-pulse delay-1000" />

        {/* MagicUI-style Dot Pattern - Primary */}
        <DotPattern
          width={20}
          height={20}
          cx={1}
          cy={1}
          cr={1}
          className={cn(
            '[mask-image:linear-gradient(to_bottom_right,#6a1b9a,red,orange)]'
          )}
        />
        {/* Additional texture overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `
              linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.02) 50%, transparent 60%),
              linear-gradient(-45deg, transparent 40%, rgba(255,255,255,0.02) 50%, transparent 60%)
            `,
            backgroundSize: '100px 100px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

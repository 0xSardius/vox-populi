'use client';

import { type ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { useFarcaster } from '@/lib/farcaster';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { isReady } = useFarcaster();

  if (!isReady) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 animate-in">
          <div className="relative w-20 h-20">
            {/* Outer ring with gold glow */}
            <div className="absolute inset-0 border border-secondary/15 rounded-full" />
            <div className="absolute inset-[-3px] border border-secondary/[0.04] rounded-full" />
            {/* Spinning red arc */}
            <div className="absolute inset-1.5 border-2 border-transparent border-t-primary rounded-full animate-spin" />
            {/* Center mark */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-display font-bold text-shimmer">VP</span>
            </div>
          </div>
          <p className="text-[10px] font-display uppercase tracking-[0.3em] text-muted/30">
            Vox Populi
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useFarcaster } from '@/lib/farcaster';
import { useVaultStats, formatUsdc } from '@/lib/contracts';

export default function Home() {
  const { displayName, pfpUrl, isInClient } = useFarcaster();
  const { totalDeposited, totalFunded, isLive } = useVaultStats();

  // Live on-chain data (0 if no deposits yet — that's real)
  const tvl = totalDeposited !== undefined
    ? Number(formatUsdc(totalDeposited))
    : 0;
  const funded = totalFunded !== undefined
    ? Number(formatUsdc(totalFunded))
    : 0;

  return (
    <div className="px-5 py-6 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between animate-in">
        <div>
          <h1 className="text-[28px] font-display font-bold text-foreground tracking-tight leading-none">
            Vox Populi
          </h1>
          <p className="text-shimmer font-display text-[11px] tracking-[0.25em] uppercase mt-1.5">
            Voice of the People
          </p>
        </div>
        {pfpUrl ? (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-br from-primary/60 to-secondary/60 rounded-full blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
            <img
              src={pfpUrl}
              alt={displayName || 'Profile'}
              className="relative w-11 h-11 rounded-full ring-2 ring-secondary/40"
            />
          </div>
        ) : (
          <div className="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center">
            <span className="text-secondary/50 text-xs font-display font-bold">VP</span>
          </div>
        )}
      </header>

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-2xl card-elevated animate-in animate-in-delay-1">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/[0.06] rounded-full blur-[100px] animate-float" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-secondary/[0.06] rounded-full blur-[80px] animate-float-delayed" />
        <div className="absolute top-0 left-8 right-8 accent-line-gold" />

        <div className="relative p-6 space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-display uppercase tracking-[0.25em] text-muted/60">
                Total Value Locked
              </p>
            </div>
            <p className="text-[44px] leading-none font-display font-bold text-foreground tracking-tight">
              ${tvl.toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[28px] font-display font-bold text-shimmer leading-none">
              4&ndash;7%
            </span>
            <span className="text-[10px] font-display uppercase tracking-[0.2em] text-muted/50 mt-1">
              APY
            </span>
            <span className="relative flex h-2 w-2 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success/50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
          </div>

          <Link
            href="/deposit"
            className="group relative block w-full py-4 px-6 overflow-hidden rounded-xl text-center press-scale"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary-hover" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-hover to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" />
            <span className="relative font-display font-semibold text-white text-sm tracking-[0.15em] uppercase">
              Deposit & Earn
            </span>
          </Link>
        </div>

        <div className="absolute bottom-0 left-8 right-8 accent-line-red" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 animate-in animate-in-delay-2">
        <div className="relative card-subtle rounded-xl p-4 overflow-hidden">
          <div className="absolute top-3 right-3 text-secondary/15">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <p className="text-[10px] font-display uppercase tracking-[0.2em] text-muted/50">
            Journalism Funded
          </p>
          <p className="text-xl font-display font-bold text-secondary mt-1.5">
            ${funded.toLocaleString()}
          </p>
        </div>

        <div className="relative card-subtle rounded-xl p-4 overflow-hidden">
          <div className="absolute top-3 right-3 text-primary/15">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-[10px] font-display uppercase tracking-[0.2em] text-muted/50">
            Depositors
          </p>
          <p className="text-xl font-display font-bold text-primary mt-1.5">
            &mdash;
          </p>
        </div>
      </div>

      {/* How it Works */}
      <section className="space-y-5 animate-in animate-in-delay-3">
        <h2 className="text-[10px] font-display uppercase tracking-[0.3em] text-muted/50">
          How it Works
        </h2>
        <div className="relative">
          <div className="absolute left-[15px] top-6 bottom-6 w-px bg-gradient-to-b from-secondary/25 via-primary/15 to-secondary/25" />
          <div className="space-y-5">
            <StepCard numeral="I" title="Deposit USDC" description="Choose your lock period and strategy on Base" />
            <StepCard numeral="II" title="Earn Yield" description="Your assets generate returns via Aave V3" />
            <StepCard numeral="III" title="Fund Journalism" description="A portion of yield flows to independent newsrooms" />
          </div>
        </div>
      </section>

      {!isInClient && (
        <div className="animate-in animate-in-delay-4 rounded-xl p-4 card-subtle">
          <p className="text-[10px] text-muted/40 text-center font-display tracking-[0.2em] uppercase">
            Open in Warpcast to connect wallet
          </p>
        </div>
      )}
    </div>
  );
}

function StepCard({ numeral, title, description }: { numeral: string; title: string; description: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="relative z-10 w-[30px] h-[30px] rounded-full bg-[#111] border border-secondary/15 flex items-center justify-center flex-shrink-0 shadow-[0_0_8px_rgba(212,175,55,0.06)]">
        <span className="text-secondary/80 font-display text-[11px] font-semibold">{numeral}</span>
      </div>
      <div className="pt-0.5">
        <p className="font-display font-semibold text-foreground text-[15px] leading-snug">{title}</p>
        <p className="text-[13px] text-muted/60 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

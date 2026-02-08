'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

const LOCK_TIERS = [
  { id: 'flexible', label: 'Flexible', months: 0, userShare: 25, newsroomShare: 75 },
  { id: '3month', label: '3 Months', months: 3, userShare: 50, newsroomShare: 50 },
  { id: '6month', label: '6 Months', months: 6, userShare: 60, newsroomShare: 40 },
  { id: '12month', label: '12 Months', months: 12, userShare: 75, newsroomShare: 25 },
] as const;

const STRATEGIES = [
  { id: 'stable', label: 'Stable', icon: '🛡️', apy: { min: 4, max: 7 }, risk: 'Low', available: true },
  { id: 'optimized', label: 'Optimized', icon: '⚖️', apy: { min: 6, max: 10 }, risk: 'Medium', available: false },
  { id: 'aggressive', label: 'Aggressive', icon: '🚀', apy: { min: 10, max: 15 }, risk: 'Higher', available: false },
] as const;

const MIN_DEPOSIT = 10;

export default function DepositPage() {
  const [amount, setAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('3month');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('stable');

  const numericAmount = parseFloat(amount) || 0;
  const isValidAmount = numericAmount >= MIN_DEPOSIT;

  const tier = LOCK_TIERS.find((t) => t.id === selectedTier)!;
  const strategy = STRATEGIES.find((s) => s.id === selectedStrategy)!;

  const projectedEarnings = useMemo(() => {
    if (!isValidAmount) return null;

    const avgApy = (strategy.apy.min + strategy.apy.max) / 2 / 100;
    const annualYield = numericAmount * avgApy;
    const userYield = annualYield * (tier.userShare / 100);
    const newsroomYield = annualYield * (tier.newsroomShare / 100);

    return { total: annualYield, user: userYield, newsroom: newsroomYield };
  }, [numericAmount, isValidAmount, tier, strategy]);

  return (
    <div className="px-5 py-6 space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4 animate-in">
        <Link
          href="/"
          className="w-10 h-10 rounded-full card-subtle flex items-center justify-center hover:bg-surface-hover transition-colors press-scale"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">Deposit</h1>
          <p className="text-[11px] text-muted/50 font-display uppercase tracking-[0.15em]">
            Configure your position
          </p>
        </div>
      </header>

      {/* Amount Input */}
      <section className="space-y-2 animate-in animate-in-delay-1">
        <label className="text-[10px] font-display uppercase tracking-[0.2em] text-muted/50">
          Amount (USDC)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40 text-lg font-display">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min={MIN_DEPOSIT}
            className="w-full bg-transparent rounded-xl py-4 px-8 text-2xl font-display font-bold text-foreground placeholder:text-muted/20 focus:outline-none transition-all border border-white/[0.06] focus:border-primary/40 focus:shadow-[0_0_0_3px_rgba(196,30,58,0.08)]"
          />
        </div>
        {amount && !isValidAmount && (
          <p className="text-error text-[12px] font-display tracking-wide">
            Minimum deposit is ${MIN_DEPOSIT}
          </p>
        )}
      </section>

      {/* Lock Period */}
      <section className="space-y-3 animate-in animate-in-delay-2">
        <label className="text-[10px] font-display uppercase tracking-[0.2em] text-muted/50">
          Lock Period
        </label>
        <div className="grid grid-cols-2 gap-3">
          {LOCK_TIERS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTier(t.id)}
              className={`relative p-4 rounded-xl transition-all text-left press-scale ${
                selectedTier === t.id
                  ? 'card-elevated border-primary/30 shadow-[0_0_12px_rgba(196,30,58,0.08)]'
                  : 'card-subtle hover:bg-surface-hover'
              }`}
            >
              <p className="font-display font-semibold text-foreground text-[15px]">{t.label}</p>
              <p className="text-[11px] text-muted/50 mt-1 font-display tracking-wide">
                Keep {t.userShare}%
              </p>
              {selectedTier === t.id && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgba(196,30,58,0.5)]" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Yield Strategy */}
      <section className="space-y-3 animate-in animate-in-delay-3">
        <label className="text-[10px] font-display uppercase tracking-[0.2em] text-muted/50">
          Yield Strategy
        </label>
        <div className="space-y-3">
          {STRATEGIES.map((s) => (
            <button
              key={s.id}
              onClick={() => s.available && setSelectedStrategy(s.id)}
              disabled={!s.available}
              className={`relative w-full p-4 rounded-xl transition-all text-left ${
                !s.available
                  ? 'card-subtle opacity-40 cursor-not-allowed'
                  : selectedStrategy === s.id
                    ? 'card-elevated border-secondary/25 shadow-[0_0_12px_rgba(212,175,55,0.06)]'
                    : 'card-subtle hover:bg-surface-hover press-scale'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <p className="font-display font-semibold text-foreground text-[15px]">{s.label}</p>
                    <p className="text-[11px] text-muted/50 font-display tracking-wide">
                      {s.risk} risk
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-secondary text-[15px]">
                    {s.apy.min}&ndash;{s.apy.max}%
                  </p>
                  <p className="text-[10px] text-muted/40 font-display uppercase tracking-wider">APY</p>
                </div>
              </div>
              {!s.available && (
                <span className="absolute top-3 right-3 text-[10px] font-display tracking-wider uppercase bg-surface/80 px-2 py-0.5 rounded-md border border-white/[0.04] text-muted/40">
                  Soon
                </span>
              )}
              {s.available && selectedStrategy === s.id && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-secondary shadow-[0_0_6px_rgba(212,175,55,0.5)]" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Yield Split Preview */}
      <section className="card-elevated rounded-xl p-5 space-y-4 animate-in animate-in-delay-4">
        <p className="text-[10px] font-display uppercase tracking-[0.2em] text-muted/50">
          Yield Split
        </p>

        {/* Bar visualization */}
        <div className="flex items-center gap-1 h-4">
          <div
            className="h-full rounded-l-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
            style={{ width: `${tier.userShare}%` }}
          />
          <div
            className="h-full rounded-r-full bg-gradient-to-r from-secondary/80 to-secondary transition-all duration-500"
            style={{ width: `${tier.newsroomShare}%` }}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-[13px] text-foreground font-display">
              You: <span className="font-bold text-primary">{tier.userShare}%</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-foreground font-display">
              Newsroom: <span className="font-bold text-secondary">{tier.newsroomShare}%</span>
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
          </div>
        </div>
      </section>

      {/* Projected Earnings */}
      {projectedEarnings && (
        <section className="card-subtle rounded-xl p-5 space-y-3 animate-in">
          <p className="text-[10px] font-display uppercase tracking-[0.2em] text-muted/50">
            Projected Annual Earnings
          </p>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-muted/70">You earn</span>
              <span className="font-display font-bold text-primary text-[15px]">
                ${projectedEarnings.user.toFixed(2)}
                <span className="text-[11px] font-normal text-muted/40">/year</span>
              </span>
            </div>
            <div className="accent-line-gold" />
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-muted/70">Newsroom receives</span>
              <span className="font-display font-bold text-secondary text-[15px]">
                ${projectedEarnings.newsroom.toFixed(2)}
                <span className="text-[11px] font-normal text-muted/40">/year</span>
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Deposit Button */}
      <button
        disabled={!isValidAmount}
        className={`w-full py-4 px-6 rounded-xl font-display font-semibold text-sm text-center tracking-[0.15em] uppercase transition-all press-scale ${
          isValidAmount
            ? 'bg-gradient-to-r from-primary via-primary to-primary-hover text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_4px_16px_rgba(196,30,58,0.2)]'
            : 'card-subtle text-muted/30 cursor-not-allowed'
        }`}
      >
        {isValidAmount ? 'Review Deposit' : 'Enter Amount'}
      </button>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useFarcaster } from '@/lib/farcaster';
import {
  useUsdcBalance,
  useUsdcAllowance,
  useApproveUsdc,
  useDeposit,
  parseUsdc,
  TIER_ID_MAP,
} from '@/lib/contracts';

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

type TxStep = 'idle' | 'approving' | 'depositing' | 'confirmed';

export default function DepositPage() {
  const [amount, setAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('3month');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('stable');
  const [txStep, setTxStep] = useState<TxStep>('idle');

  const { isConnected, address } = useAccount();
  const { isInClient } = useFarcaster();
  const { balance, formatted: balanceFormatted } = useUsdcBalance();
  const { allowance, refetch: refetchAllowance } = useUsdcAllowance();

  const {
    approve,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isConfirmed: isApproveConfirmed,
    reset: resetApprove,
  } = useApproveUsdc();

  const {
    deposit,
    isPending: isDepositPending,
    isConfirming: isDepositConfirming,
    isConfirmed: isDepositConfirmed,
    error: depositError,
    reset: resetDeposit,
  } = useDeposit();

  const numericAmount = parseFloat(amount) || 0;
  const isValidAmount = numericAmount >= MIN_DEPOSIT;
  const depositAmountRaw = isValidAmount ? parseUsdc(amount) : 0n;
  const needsApproval = isValidAmount && allowance !== undefined && allowance < depositAmountRaw;

  const tier = LOCK_TIERS.find((t) => t.id === selectedTier)!;
  const strategy = STRATEGIES.find((s) => s.id === selectedStrategy)!;

  const projectedEarnings = useMemo(() => {
    if (!isValidAmount) return null;
    const avgApy = (strategy.apy.min + strategy.apy.max) / 2 / 100;
    const annualYield = numericAmount * avgApy;
    return {
      total: annualYield,
      user: annualYield * (tier.userShare / 100),
      newsroom: annualYield * (tier.newsroomShare / 100),
    };
  }, [numericAmount, isValidAmount, tier, strategy]);

  // Handle approve → deposit flow
  async function handleAction() {
    if (!isValidAmount || !isConnected) return;

    if (needsApproval) {
      setTxStep('approving');
      approve(depositAmountRaw);
    } else {
      setTxStep('depositing');
      deposit(depositAmountRaw, TIER_ID_MAP[selectedTier]);
    }
  }

  // When approval confirms, proceed to deposit
  if (isApproveConfirmed && txStep === 'approving') {
    refetchAllowance();
    resetApprove();
    setTxStep('depositing');
    deposit(depositAmountRaw, TIER_ID_MAP[selectedTier]);
  }

  // When deposit confirms
  if (isDepositConfirmed && txStep === 'depositing') {
    setTxStep('confirmed');
  }

  const isBusy = isApprovePending || isApproveConfirming || isDepositPending || isDepositConfirming;

  function getButtonLabel(): string {
    if (txStep === 'confirmed') return 'Deposit Successful!';
    if (isDepositConfirming) return 'Confirming Deposit...';
    if (isDepositPending) return 'Confirm in Wallet...';
    if (isApproveConfirming) return 'Confirming Approval...';
    if (isApprovePending) return 'Approve in Wallet...';
    if (!isConnected && isInClient) return 'Connecting Wallet...';
    if (!isConnected) return 'Open in Warpcast';
    if (!isValidAmount) return 'Enter Amount';
    if (needsApproval) return 'Approve USDC';
    return 'Deposit';
  }

  function resetFlow() {
    setTxStep('idle');
    setAmount('');
    resetDeposit();
    resetApprove();
  }

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

      {/* Success State */}
      {txStep === 'confirmed' ? (
        <div className="flex flex-col items-center py-12 space-y-5 animate-in">
          <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="text-center space-y-1.5">
            <p className="font-display font-bold text-foreground text-lg">Deposit Confirmed</p>
            <p className="text-[13px] text-muted/60">
              ${numericAmount.toLocaleString()} USDC deposited with {tier.label} lock
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="py-3 px-6 bg-gradient-to-r from-primary to-primary-hover text-white font-display font-semibold text-sm tracking-[0.1em] uppercase rounded-xl press-scale"
            >
              View Position
            </Link>
            <button
              onClick={resetFlow}
              className="py-3 px-6 card-subtle font-display font-semibold text-sm tracking-[0.1em] uppercase rounded-xl press-scale text-foreground"
            >
              New Deposit
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Amount Input */}
          <section className="space-y-2 animate-in animate-in-delay-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-display uppercase tracking-[0.2em] text-muted/50">
                Amount (USDC)
              </label>
              {isConnected && balanceFormatted && (
                <button
                  onClick={() => setAmount(balanceFormatted)}
                  className="text-[10px] font-display uppercase tracking-wider text-secondary/60 hover:text-secondary transition-colors"
                >
                  Balance: ${Number(balanceFormatted).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40 text-lg font-display">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min={MIN_DEPOSIT}
                disabled={isBusy}
                className="w-full bg-transparent rounded-xl py-4 px-8 text-2xl font-display font-bold text-foreground placeholder:text-muted/20 focus:outline-none transition-all border border-white/[0.06] focus:border-primary/40 focus:shadow-[0_0_0_3px_rgba(196,30,58,0.08)] disabled:opacity-50"
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
                  disabled={isBusy}
                  className={`relative p-4 rounded-xl transition-all text-left press-scale ${
                    selectedTier === t.id
                      ? 'card-elevated border-primary/30 shadow-[0_0_12px_rgba(196,30,58,0.08)]'
                      : 'card-subtle hover:bg-surface-hover'
                  } disabled:opacity-50`}
                >
                  <p className="font-display font-semibold text-foreground text-[15px]">{t.label}</p>
                  <p className="text-[11px] text-muted/50 mt-1 font-display tracking-wide">Keep {t.userShare}%</p>
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
                  disabled={!s.available || isBusy}
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
                        <p className="text-[11px] text-muted/50 font-display tracking-wide">{s.risk} risk</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-secondary text-[15px]">{s.apy.min}&ndash;{s.apy.max}%</p>
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
            <p className="text-[10px] font-display uppercase tracking-[0.2em] text-muted/50">Yield Split</p>
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
              <p className="text-[10px] font-display uppercase tracking-[0.2em] text-muted/50">Projected Annual Earnings</p>
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

          {/* Action Button */}
          <button
            onClick={handleAction}
            disabled={!isValidAmount || isBusy || (!isConnected && !isInClient)}
            className={`w-full py-4 px-6 rounded-xl font-display font-semibold text-sm text-center tracking-[0.15em] uppercase transition-all press-scale ${
              isValidAmount && !isBusy
                ? 'bg-gradient-to-r from-primary via-primary to-primary-hover text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_4px_16px_rgba(196,30,58,0.2)]'
                : 'card-subtle text-muted/30 cursor-not-allowed'
            }`}
          >
            {getButtonLabel()}
          </button>

          {depositError && (
            <p className="text-error text-[12px] font-display text-center">
              {depositError.message?.includes('User rejected')
                ? 'Transaction rejected'
                : 'Transaction failed. Please try again.'}
            </p>
          )}
        </>
      )}
    </div>
  );
}

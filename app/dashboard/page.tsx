'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useFarcaster } from '@/lib/farcaster';
import {
  useUserPositions,
  useClaimYield,
  useWithdraw,
  formatUsdc,
  TIER_LABELS,
} from '@/lib/contracts';

// Mock positions for demo mode (when not connected or vault not deployed)
const MOCK_POSITIONS = [
  {
    id: 1,
    amount: 1000,
    lockTier: '6 Months',
    strategy: 'Stable',
    depositDate: new Date('2025-12-01'),
    unlockDate: new Date('2026-06-01'),
    userShare: 60,
    accruedYield: { user: 12.45, newsroom: 8.30 },
  },
  {
    id: 2,
    amount: 500,
    lockTier: 'Flexible',
    strategy: 'Stable',
    depositDate: new Date('2026-01-15'),
    unlockDate: null,
    userShare: 25,
    accruedYield: { user: 1.23, newsroom: 3.69 },
  },
];

export default function DashboardPage() {
  const { displayName } = useFarcaster();
  const { isConnected } = useAccount();
  const { positions: livePositions, isLoading } = useUserPositions();

  // Use live positions when available, otherwise mock
  const isLive = isConnected && livePositions !== undefined;
  const activePositions = isLive
    ? livePositions.filter((p) => p.active)
    : null;
  const hasPositions = isLive ? activePositions!.length > 0 : MOCK_POSITIONS.length > 0;

  // Calculate totals from live data
  const liveTotals = activePositions
    ? activePositions.reduce(
        (acc, pos) => ({
          deposited: acc.deposited + Number(formatUsdc(pos.amount)),
          userYield: 0, // Yield requires off-chain calc or indexer
          newsroomYield: 0,
        }),
        { deposited: 0, userYield: 0, newsroomYield: 0 }
      )
    : null;

  const mockTotals = MOCK_POSITIONS.reduce(
    (acc, pos) => ({
      deposited: acc.deposited + pos.amount,
      userYield: acc.userYield + pos.accruedYield.user,
      newsroomYield: acc.newsroomYield + pos.accruedYield.newsroom,
    }),
    { deposited: 0, userYield: 0, newsroomYield: 0 }
  );

  const totals = liveTotals || mockTotals;

  return (
    <div className="px-5 py-6 space-y-6">
      {/* Header */}
      <header className="animate-in">
        <div className="flex items-center gap-2">
          <p className="text-[11px] text-muted/40 font-display uppercase tracking-[0.15em]">
            {displayName ? `Welcome back, ${displayName}` : 'Your Dashboard'}
          </p>
          {!isLive && (
            <span className="text-[8px] font-display uppercase tracking-wider text-muted/30 bg-white/[0.04] px-1.5 py-0.5 rounded">
              Demo
            </span>
          )}
        </div>
        <h1 className="text-[24px] font-display font-bold text-foreground tracking-tight mt-0.5">
          Positions
        </h1>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-transparent border-t-primary rounded-full animate-spin" />
        </div>
      ) : hasPositions ? (
        <>
          {/* Portfolio Summary */}
          <div className="grid grid-cols-3 gap-3 animate-in animate-in-delay-1">
            <SummaryCard label="Deposited" value={`$${totals.deposited.toLocaleString()}`} />
            <SummaryCard label="Your Yield" value={`$${totals.userYield.toFixed(2)}`} accent="primary" />
            <SummaryCard label="Funded" value={`$${totals.newsroomYield.toFixed(2)}`} accent="secondary" />
          </div>

          {/* Positions List */}
          <section className="space-y-4 animate-in animate-in-delay-2">
            <h2 className="text-[10px] font-display uppercase tracking-[0.3em] text-muted/40">
              Active Positions
            </h2>
            {isLive
              ? activePositions!.map((position, index) => (
                  <LivePositionCard key={index} position={position} positionId={index} />
                ))
              : MOCK_POSITIONS.map((position) => (
                  <MockPositionCard key={position.id} position={position} />
                ))}
          </section>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 space-y-5 animate-in animate-in-delay-1">
          <div className="relative w-20 h-20 rounded-full card-subtle flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-secondary/10" />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted/30">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-foreground font-display font-semibold text-[16px]">No positions yet</p>
            <p className="text-[13px] text-muted/50">Deposit USDC to start earning yield</p>
          </div>
          <Link
            href="/deposit"
            className="py-3 px-8 bg-gradient-to-r from-primary to-primary-hover text-white font-display font-semibold text-sm tracking-[0.1em] uppercase rounded-xl transition-all press-scale shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset]"
          >
            Make First Deposit
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Components ───────────────────────────────────

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: 'primary' | 'secondary' }) {
  return (
    <div className="card-subtle rounded-xl p-3 text-center">
      <p className="text-[9px] font-display uppercase tracking-[0.2em] text-muted/40">{label}</p>
      <p className={`text-[17px] font-display font-bold mt-1 ${
        accent === 'primary' ? 'text-primary' : accent === 'secondary' ? 'text-secondary' : 'text-foreground'
      }`}>
        {value}
      </p>
    </div>
  );
}

/** Card for live on-chain positions */
function LivePositionCard({
  position,
  positionId,
}: {
  position: { amount: bigint; depositTime: bigint; unlockTime: bigint; tier: number; lastClaimTime: bigint; active: boolean };
  positionId: number;
}) {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const isUnlocked = now >= position.unlockTime;

  const depositDate = new Date(Number(position.depositTime) * 1000);
  const unlockDate = new Date(Number(position.unlockTime) * 1000);
  const daysRemaining = isUnlocked ? 0 : Math.ceil((Number(position.unlockTime) - Number(now)) / 86400);
  const totalDays = Math.ceil((Number(position.unlockTime) - Number(position.depositTime)) / 86400);
  const progressPercent = totalDays > 0 ? Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100) : 100;

  const amountFormatted = Number(formatUsdc(position.amount));

  const {
    claim,
    isPending: isClaimPending,
    isConfirming: isClaimConfirming,
  } = useClaimYield();

  const {
    withdraw,
    isPending: isWithdrawPending,
    isConfirming: isWithdrawConfirming,
  } = useWithdraw();

  return (
    <div className="card-elevated rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/[0.04]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[22px] font-display font-bold text-foreground leading-none">
              ${amountFormatted.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted/40 mt-1 font-display tracking-wide">Stable Strategy</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-display font-semibold uppercase tracking-wider ${
            isUnlocked
              ? 'bg-success/10 text-success/80 border border-success/15'
              : 'bg-secondary/10 text-secondary/80 border border-secondary/15'
          }`}>
            {TIER_LABELS[position.tier] || 'Unknown'}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {daysRemaining > 0 && (
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-muted/40 font-display tracking-wide">Unlocks in</span>
              <span className="text-foreground font-display font-semibold text-[13px]">{daysRemaining} days</span>
            </div>
            <div className="mt-2.5 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-secondary/60 to-secondary transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 pt-0 flex gap-3">
        <button
          onClick={() => claim(BigInt(positionId))}
          disabled={isClaimPending || isClaimConfirming}
          className="flex-1 py-2.5 px-4 rounded-lg font-display font-semibold text-[11px] uppercase tracking-wider transition-all press-scale bg-primary/10 hover:bg-primary/15 text-primary border border-primary/10 disabled:opacity-50"
        >
          {isClaimPending || isClaimConfirming ? 'Claiming...' : 'Claim'}
        </button>
        <button
          onClick={() => withdraw(BigInt(positionId))}
          disabled={!isUnlocked || isWithdrawPending || isWithdrawConfirming}
          className={`flex-1 py-2.5 px-4 rounded-lg font-display font-semibold text-[11px] uppercase tracking-wider transition-all ${
            isUnlocked
              ? 'card-subtle hover:bg-surface-hover text-foreground press-scale'
              : 'bg-white/[0.02] text-muted/25 cursor-not-allowed border border-white/[0.02]'
          } disabled:opacity-50`}
        >
          {isWithdrawPending || isWithdrawConfirming ? 'Withdrawing...' : isUnlocked ? 'Withdraw' : 'Locked'}
        </button>
      </div>
    </div>
  );
}

/** Card for mock/demo positions */
function MockPositionCard({ position }: { position: (typeof MOCK_POSITIONS)[0] }) {
  const now = new Date();
  const isUnlocked = position.unlockDate ? now >= position.unlockDate : true;
  const daysRemaining = position.unlockDate
    ? Math.max(0, Math.ceil((position.unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const totalDays = position.unlockDate
    ? Math.ceil((position.unlockDate.getTime() - position.depositDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const progressPercent = totalDays && daysRemaining !== null
    ? Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100)
    : 100;

  return (
    <div className="card-elevated rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/[0.04]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[22px] font-display font-bold text-foreground leading-none">
              ${position.amount.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted/40 mt-1 font-display tracking-wide">{position.strategy} Strategy</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-display font-semibold uppercase tracking-wider ${
            isUnlocked
              ? 'bg-success/10 text-success/80 border border-success/15'
              : 'bg-secondary/10 text-secondary/80 border border-secondary/15'
          }`}>
            {position.lockTier}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[12px] text-muted/50 font-display tracking-wide">Your yield</span>
          <span className="text-primary font-display font-bold text-[14px]">+${position.accruedYield.user.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[12px] text-muted/50 font-display tracking-wide">Newsroom funded</span>
          <span className="text-secondary font-display font-bold text-[14px]">+${position.accruedYield.newsroom.toFixed(2)}</span>
        </div>

        {daysRemaining !== null && daysRemaining > 0 && (
          <div className="pt-3 border-t border-white/[0.04]">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-muted/40 font-display tracking-wide">Unlocks in</span>
              <span className="text-foreground font-display font-semibold text-[13px]">{daysRemaining} days</span>
            </div>
            <div className="mt-2.5 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-secondary/60 to-secondary transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 pt-0 flex gap-3">
        <button className="flex-1 py-2.5 px-4 rounded-lg font-display font-semibold text-[11px] uppercase tracking-wider transition-all press-scale bg-primary/10 hover:bg-primary/15 text-primary border border-primary/10">
          Claim
        </button>
        <button
          disabled={!isUnlocked}
          className={`flex-1 py-2.5 px-4 rounded-lg font-display font-semibold text-[11px] uppercase tracking-wider transition-all ${
            isUnlocked
              ? 'card-subtle hover:bg-surface-hover text-foreground press-scale'
              : 'bg-white/[0.02] text-muted/25 cursor-not-allowed border border-white/[0.02]'
          }`}
        >
          {isUnlocked ? 'Withdraw' : 'Locked'}
        </button>
      </div>
    </div>
  );
}

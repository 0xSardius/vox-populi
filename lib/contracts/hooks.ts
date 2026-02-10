'use client';

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { voxVaultAbi } from './voxVaultAbi';
import { erc20Abi } from './erc20Abi';
import { CONTRACTS, ACTIVE_CHAIN } from '../wagmi';

// ── Addresses & Constants ────────────────────────

const VAULT_ADDRESS = (CONTRACTS.VOX_VAULT[ACTIVE_CHAIN.id] || undefined) as
  | `0x${string}`
  | undefined;
const USDC_ADDRESS = CONTRACTS.USDC[ACTIVE_CHAIN.id] as `0x${string}`;

const isVaultDeployed = !!VAULT_ADDRESS && VAULT_ADDRESS.length > 2;

export const USDC_DECIMALS = 6;

export const LockTier = {
  Flexible: 0,
  ThreeMonth: 1,
  SixMonth: 2,
  TwelveMonth: 3,
} as const;

export const TIER_ID_MAP: Record<string, number> = {
  flexible: LockTier.Flexible,
  '3month': LockTier.ThreeMonth,
  '6month': LockTier.SixMonth,
  '12month': LockTier.TwelveMonth,
};

export const TIER_LABELS: Record<number, string> = {
  [LockTier.Flexible]: 'Flexible',
  [LockTier.ThreeMonth]: '3 Months',
  [LockTier.SixMonth]: '6 Months',
  [LockTier.TwelveMonth]: '12 Months',
};

export function formatUsdc(amount: bigint): string {
  return formatUnits(amount, USDC_DECIMALS);
}

export function parseUsdc(amount: string): bigint {
  return parseUnits(amount, USDC_DECIMALS);
}

// ── Read Hooks ───────────────────────────────────

export function useVaultStats() {
  const totalDeposited = useReadContract({
    address: VAULT_ADDRESS!,
    abi: voxVaultAbi,
    functionName: 'totalDeposited',
    query: { enabled: isVaultDeployed },
  });

  const totalFunded = useReadContract({
    address: VAULT_ADDRESS!,
    abi: voxVaultAbi,
    functionName: 'totalNewsroomFunded',
    query: { enabled: isVaultDeployed },
  });

  return {
    totalDeposited: totalDeposited.data,
    totalFunded: totalFunded.data,
    isLoading: totalDeposited.isLoading || totalFunded.isLoading,
    isLive: isVaultDeployed,
  };
}

export function useUserPositions() {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: VAULT_ADDRESS!,
    abi: voxVaultAbi,
    functionName: 'getUserPositions',
    args: [address!],
    query: { enabled: isVaultDeployed && !!address },
  });

  return { positions: data, isLoading, error, refetch };
}

export function useUsdcBalance() {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address },
  });

  return {
    balance: data,
    formatted: data !== undefined ? formatUsdc(data) : undefined,
    isLoading,
    refetch,
  };
}

export function useUsdcAllowance() {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address!, VAULT_ADDRESS!],
    query: { enabled: !!address && isVaultDeployed },
  });

  return { allowance: data, isLoading, refetch };
}

// ── Write Hooks ──────────────────────────────────

export function useApproveUsdc() {
  const { data: hash, writeContract, isPending, error, reset } =
    useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  function approve(amount: bigint) {
    writeContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'approve',
      args: [VAULT_ADDRESS!, amount],
    });
  }

  return { approve, hash, isPending, isConfirming, isConfirmed, error, reset };
}

export function useDeposit() {
  const { data: hash, writeContract, isPending, error, reset } =
    useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  function deposit(amount: bigint, tier: number) {
    writeContract({
      address: VAULT_ADDRESS!,
      abi: voxVaultAbi,
      functionName: 'deposit',
      args: [amount, tier],
    });
  }

  return { deposit, hash, isPending, isConfirming, isConfirmed, error, reset };
}

export function useWithdraw() {
  const { data: hash, writeContract, isPending, error, reset } =
    useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  function withdraw(positionId: bigint) {
    writeContract({
      address: VAULT_ADDRESS!,
      abi: voxVaultAbi,
      functionName: 'withdraw',
      args: [positionId],
    });
  }

  return { withdraw, hash, isPending, isConfirming, isConfirmed, error, reset };
}

export function useClaimYield() {
  const { data: hash, writeContract, isPending, error, reset } =
    useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  function claim(positionId: bigint) {
    writeContract({
      address: VAULT_ADDRESS!,
      abi: voxVaultAbi,
      functionName: 'claimYield',
      args: [positionId],
    });
  }

  return { claim, hash, isPending, isConfirming, isConfirmed, error, reset };
}

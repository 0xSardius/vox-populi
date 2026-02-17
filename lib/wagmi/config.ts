import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { farcaster } from './farcasterConnector';

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [farcaster()],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});

// Contract addresses
export const CONTRACTS = {
  USDC: {
    [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const,
    [baseSepolia.id]: '0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f' as const, // Aave's mock USDC (mint via staging.aave.com/faucet)
  },
  AAVE_POOL: {
    [base.id]: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5' as const,
  },
  VOX_VAULT: {
    [base.id]: '0x0672322b544B5291277F2d99142104B29a155846' as const,
    [baseSepolia.id]: '0x3Ef45c1609196Df07Fae89448e1c6740660523D8' as const,
  },
} as const;

// Chain configuration — switch to `base` for mainnet launch
export const ACTIVE_CHAIN = base;
export const DEFAULT_CHAIN = base;
export const SUPPORTED_CHAINS = [base, baseSepolia] as const;

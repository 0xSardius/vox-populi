import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

export const config = createConfig({
  chains: [base, baseSepolia],
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
    [baseSepolia.id]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const, // Circle's testnet USDC
  },
  AAVE_POOL: {
    [base.id]: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5' as const,
  },
  VOX_VAULT: {
    [base.id]: '' as const, // To be deployed
    [baseSepolia.id]: '' as const, // To be deployed
  },
} as const;

// Chain configuration
export const DEFAULT_CHAIN = base;
export const SUPPORTED_CHAINS = [base, baseSepolia] as const;

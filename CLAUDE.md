# Vox Populi - Claude Code Instructions

## Project Overview

Vox Populi is a Farcaster miniapp that enables users to stake USDC on Base, earn yield via DeFi protocols, and automatically share a portion with an independent journalism fund. Core innovation: time-weighted yield splitting - longer lock commitments = more yield retained.

**Tagline**: "Earn yield. Fund journalism. Voice of the people."

## Tech Stack

- **Framework**: Next.js 16+ (App Router) with React 19
- **Farcaster Integration**: `@farcaster/miniapp-sdk` (NOT MiniKit/OnchainKit)
- **Auth**: Farcaster Quick Auth (`sdk.quickAuth.getToken()`)
- **Chain**: Base (chain ID 8453)
- **Wallet**: Wagmi v2 + Viem for contract interactions
- **Smart Contracts**: Solidity (Foundry), deployed to Base
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Neon Postgres
- **Yield Distribution**: 0xSplits
- **Deployment**: Vercel
- **Package Manager**: pnpm

## Key Architecture Decisions

### Farcaster SDK (NOT MiniKit)
Use the clean Farcaster SDK directly:
```typescript
import { sdk } from '@farcaster/miniapp-sdk'

// Initialize app
await sdk.actions.ready()

// Quick Auth for sessions
const token = await sdk.quickAuth.getToken()

// Get Ethereum provider for wallet
const provider = sdk.wallet.getEthereumProvider()
```

### Yield Split Tiers
| Lock Period | User Keeps | Newsroom Gets |
|-------------|------------|---------------|
| Flexible    | 25%        | 75%           |
| 3 months    | 50%        | 50%           |
| 6 months    | 60%        | 40%           |
| 12 months   | 75%        | 25%           |

### Contract Addresses (Base)
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Aave V3 Pool: `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5`
- aBasUSDC: `0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB`

## Git Guidelines

**IMPORTANT**: Do NOT include "Co-Authored-By: Claude" in commit messages. This project pushes to a public GitHub repository.

When committing:
- Write clear, descriptive commit messages
- Do not add AI attribution to commits
- Follow conventional commit format when appropriate

## File Structure

```
vox-populi/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (routes)/          # Page routes
│   └── components/        # React components
├── contracts/             # Foundry smart contracts
│   ├── src/              # Contract source
│   ├── test/             # Contract tests
│   └── script/           # Deploy scripts
├── lib/                   # Shared utilities
│   ├── contracts/        # ABIs, addresses, hooks
│   ├── farcaster/        # SDK utilities
│   └── db/               # Database queries
├── docs/                  # Project documentation
└── public/               # Static assets
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build

# Run contract tests
cd contracts && forge test

# Deploy contracts
cd contracts && forge script script/Deploy.s.sol --rpc-url base
```

## MVP Scope

### In Scope (v1)
- USDC deposits on Base
- Four lock tiers (flexible / 3mo / 6mo / 12mo)
- Stable yield strategy only (Aave V3)
- Yield splitting logic
- Early withdrawal penalty
- Basic miniapp UI (deposit / dashboard / withdraw)
- Social share cards
- Farcaster Quick Auth

### Out of Scope (v2+)
- VOX governance token
- Optimized (Yearn) and Aggressive (Pendle) strategies
- Multi-token deposits
- On-chain governance
- DAO structure

## Design System

**Theme**: Roman-inspired (red & gold)

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0a0a0a` | App background |
| Primary | `#C41E3A` | Cardinal red - CTAs, accents |
| Secondary | `#D4AF37` | Roman gold - highlights, badges |
| Surface | `#1a1a1a` | Cards, elevated surfaces |
| Border | `#2a2a2a` | Subtle borders |
| Text | `#ffffff` | Primary text |
| Text Muted | `#a1a1a1` | Secondary text |

## Available Skills

Use these Claude Code skills to speed up development:

| Skill | When to Use |
|-------|-------------|
| `/wagmi` | React hooks for wallet connections, contract reads/writes |
| `/viem` | Low-level EVM interactions, ABI encoding, transaction signing |
| `/frontend-design` | Building polished UI components and pages |
| `/vercel-react-best-practices` | React/Next.js performance optimization |
| `/ai-sdk-core` | Backend AI features (if needed later) |
| `/ai-sdk-ui` | React chat interfaces (if needed later) |

**Trigger skills** when working on their relevant domains for best results.

## Reference Docs

- PRD: `docs/Vox_Populi_PRD_v0.4.md`
- Build Guide: `docs/Vox_Populi_Claude_Code_Prompt.md`
- Farcaster SDK: `docs/farcaster-docs.txt.txt`

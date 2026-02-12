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

### Contract Addresses (Base Mainnet)
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Aave V3 Pool: `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5`
- aBasUSDC: `0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB`
- VoxVault: _Not yet deployed_

### Contract Addresses (Base Sepolia)
- USDC (Aave mock): `0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f` — mint at staging.aave.com/faucet
- Aave V3 Pool: `0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27`
- aBasUSDC: `0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC`
- VoxVault: `0x3Ef45c1609196Df07Fae89448e1c6740660523D8`
- Deployer: `0x1155E63A4E2B24350b351BE13E6cDcFFcDf08F57`

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
- RNBW token staking (separate vault contract — see Phase 9 below)
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

---

## Build Progress / Scratchpad

### Completed

**Phase 1 - Project Setup** ✅
- Next.js 16 + React 19 + Tailwind v4 initialized
- Farcaster SDK (`@farcaster/miniapp-sdk` v0.2.2) integrated
- Wagmi v3 + Viem configured for Base
- TanStack React Query provider wired up

**Phase 2 - Frontend UI** ✅
- **Home page** (`app/page.tsx`) - Hero card with TVL/APY, stats grid, how-it-works steps
- **Deposit page** (`app/deposit/page.tsx`) - Amount input, 4 lock tier selector, 3 strategy cards, yield split viz, projected earnings
- **Dashboard page** (`app/dashboard/page.tsx`) - Portfolio summary, position cards with unlock timers, claim/withdraw buttons
- **AppShell** (`app/components/AppShell.tsx`) - Loading state with branded spinner, bottom nav wrapper
- **BottomNav** (`app/components/BottomNav.tsx`) - 3-tab nav (Home/Deposit/Dashboard) with active indicators
- **Design system** - Cinzel display font, gold shimmer animations, card-elevated/card-subtle depth system, staggered entrance animations, press-scale micro-interactions, Roman numeral step indicators

**Phase 2.5 - Farcaster Integration** ✅
- `FarcasterProvider` + `useFarcaster()` hook (`lib/farcaster/context.tsx`)
- SDK init, Quick Auth token, user context (fid, displayName, pfpUrl)
- Farcaster manifest route (`.well-known/farcaster.json`) - needs domain signing
- MiniApp embed metadata in layout

**Phase 3 - Smart Contracts** ✅
- `VoxVault.sol` (`contracts/src/`) - Core vault with deposits, lock tiers, Aave V3 yield routing, yield splitting, early withdrawal penalty
- `VoxVault.t.sol` (`contracts/test/`) - 17 tests all passing (deposits, yield splits, withdrawals, access control)
- `Deploy.s.sol` (`contracts/script/`) - Base mainnet deploy script
- OpenZeppelin + forge-std dependencies installed

**Phase 4 - Contract Integration** ✅
- VoxVault ABI + ERC20 ABI exported with `as const` type safety (`lib/contracts/`)
- 4 read hooks: `useVaultStats`, `useUserPositions`, `useUsdcBalance`, `useUsdcAllowance`
- 4 write hooks: `useDeposit`, `useWithdraw`, `useClaimYield`, `useApproveUsdc`
- Custom Farcaster wallet connector (`lib/wagmi/farcasterConnector.ts`) using `sdk.wallet.getEthereumProvider()`
- Auto-connect in `FarcasterProvider` when inside Farcaster client
- Deposit page: full approve → deposit → confirm flow with tx status, USDC balance display, success state
- Dashboard: `LivePositionCard` (on-chain reads + real claim/withdraw) and `MockPositionCard` (demo fallback)
- Home page: live TVL/funded from contract with "Demo" badge when vault not deployed
- `tsconfig.json` target bumped to ES2020 for BigInt literal support
- Helper utils: `formatUsdc`, `parseUsdc`, `TIER_ID_MAP`, `TIER_LABELS`, `LockTier` enum

**Phase 4.5 - Local Testing** ✅
- [x] `pnpm build` passes clean (all 5 routes, 0 TypeScript errors)
- [x] All 3 pages render correctly (200 responses, SSR → client hydration)
- [x] Dashboard shows mock position cards in demo mode with "Demo" badge
- [x] Home page shows mock TVL/funded stats with "Demo" badge
- [x] Wagmi hooks safely disabled when vault address is empty (`query: { enabled: isVaultDeployed }`)
- [x] Fonts loading (Cinzel, Geist, Geist Mono all preloaded in SSR HTML)
- [x] Farcaster `fc:miniapp` meta tag present with correct schema
- [x] Dev server runs with zero errors in console

### In Progress / Next Up

**Phase 5 - Testnet Deployment** ✅
- [x] Deploy VoxVault to Base Sepolia: `0x3Ef45c1609196Df07Fae89448e1c6740660523D8`
- [x] Deploy script: `contracts/script/DeploySepolia.s.sol` (Aave V3 Sepolia addresses hardcoded)
- [x] Deployer wallet: `0x1155E63A4E2B24350b351BE13E6cDcFFcDf08F57` (testnet throwaway, key in `contracts/.env`)
- [x] Updated `CONTRACTS.VOX_VAULT[baseSepolia.id]` with deployed address
- [x] Switched `ACTIVE_CHAIN` to `baseSepolia` for testing (hooks now read from testnet)
- [x] Updated USDC address to Aave's mock USDC (`0xba50...`) — NOT Circle's testnet USDC
- [x] Contract verified on-chain: `totalDeposited()=0`, `owner()=deployer`, `newsroomFund()=deployer`
- [ ] End-to-end test: approve → deposit → view position → claim → withdraw
- [ ] Vercel deployment with `NEXT_PUBLIC_URL` env var

**Phase 6 - Backend & Data** 🔜
- [ ] Neon Postgres setup (optional for MVP - can use on-chain reads only)
- [ ] API routes: `/api/positions`, `/api/yields`, `/api/stats`
- [ ] Contract event indexing for historical data
- [ ] Leaderboard data

**Phase 7 - Polish & Social** 🔜
- [ ] Share cards after deposit (Farcaster cast composer)
- [ ] Farcaster manifest domain signing
- [ ] Notifications
- [ ] Error boundaries + loading skeletons
- [ ] Accessibility audit

**Phase 8 - Mainnet Launch** 🔜
- [ ] Security review of VoxVault contract
- [ ] Deploy to Base mainnet
- [ ] Set up newsroom fund multisig address
- [ ] Final Farcaster miniapp registration

**Phase 9 - RNBW Token Staking** 🔜
- [ ] Research RNBW token (contract address, chain, tokenomics)
- [ ] Design separate RNBWVault contract (different yield strategy from USDC vault)
- [ ] Determine yield source for RNBW (staking rewards? LP? custom?)
- [ ] Build + test RNBWVault with Foundry
- [ ] Frontend: multi-vault UI — token selector on deposit page
- [ ] Deploy RNBWVault to Base

### Key Decisions Made
- Using Farcaster SDK directly (not MiniKit/OnchainKit)
- Cinzel serif font for display text (Roman inscription aesthetic)
- CSS-only animations (no framer-motion dependency)
- Single VoxVault contract for MVP (no separate strategy contracts). RNBW staking will be a separate vault (Phase 9).
- MIN_DEPOSIT lowered from 10 USDC to 1 USDC — dust deposits just earn zero yield, no risk
- Simplified yield tracking (pro-rata from aUSDC balance)
- Wagmi v3 (latest, matches wagmi skill)
- Custom `createConnector` for Farcaster wallet (with `Promise<any>` return to handle v3.4 `withCapabilities` generic)
- Demo mode: pages gracefully fall back to mock data when vault not deployed or wallet not connected
- Hooks use `query: { enabled }` pattern to prevent calls when address/vault unavailable
- `ACTIVE_CHAIN` pattern: single variable in wagmi config controls which chain hooks target; swap from `baseSepolia` → `base` for mainnet launch

### Lessons Learned

**TypeScript / Build**
- `tsconfig.json` target must be ES2020+ to use BigInt literals (`0n`). The Next.js default (ES2017) doesn't support them.
- Always use `as const` on ABI arrays for Viem/Wagmi type inference. Without it, `functionName` and `args` lose type safety entirely.

**Wagmi v3**
- Wagmi v3.4 added a `withCapabilities` generic to the connector `connect()` method. Custom connectors need `Promise<any>` return type to avoid type conflicts. Annotate the factory function as `CreateConnectorFn`.
- Use `query: { enabled: boolean }` on all read hooks to prevent calls when addresses are undefined or vault isn't deployed. This is the Wagmi equivalent of conditional fetching.
- `useConnectors()` is a separate hook in v3 (not returned from `useConnect()`).

**Farcaster SDK**
- Must use dynamic `import('@farcaster/miniapp-sdk')` inside the Wagmi connector to prevent SSR crashes. The SDK assumes `window` exists.
- Auto-connect logic lives in `FarcasterProvider` — when SDK is ready + inside Farcaster client + not already connected, it finds the `farcaster` connector by ID and calls `connect()`.

**Architecture Patterns**
- **Demo mode pattern**: Every page should gracefully fall back to mock data when the vault isn't deployed or wallet isn't connected. Use a simple `isLive` boolean and "Demo" badge so devs and users always know which state they're seeing.
- **Guard before you call**: `isVaultDeployed` is computed once at module level from the config. Read hooks check it; write hooks are only triggered by user clicks, so they naturally won't fire when there's no vault.
- Parallel agent work (UI + contracts simultaneously) is efficient but requires careful commit separation — keep frontend and contract commits distinct for cleaner git history.

**Deployment**
- Aave V3 on Base Sepolia uses its own mock USDC (`0xba50...`), NOT Circle's testnet USDC (`0x036C...`). Must mint via https://staging.aave.com/faucet/. This tripped us up initially.
- The Aave mock USDC token's `mint()` is owner-restricted. The owner is a faucet/ACL contract (`0xD914...`), not the Aave Faucet UI contract (`0xf2a2...`). Direct `cast send` minting doesn't work — use the staging.aave.com/faucet UI instead (connect wallet, select Base Sepolia, mint USDC).
- `contracts/.env` `source` does not work reliably in git bash on Windows. Use inline `export VAR=value &&` or set vars directly when running cast commands.
- `foundry.toml` etherscan config eagerly resolves env vars even when not verifying. Comment out the `[etherscan]` section if `BASESCAN_API_KEY` is not set, or the deploy script will fail.
- `cast wallet new` generates a fresh deployer — cheap and disposable for testnets. Fund via Superchain/Alchemy/Coinbase faucets.
- Base Sepolia L2 gas is extremely cheap (~0.000004 ETH for a full contract deploy).

**Tooling / DX**
- Windows creates literal `nul` files when shell output is redirected to `NUL` (case-sensitive filesystem issue). Clean these up with `rm -f nul`.
- `pnpm build` is the single source of truth for TypeScript correctness. Run it after any significant changes.
- Foundry submodule deps (`forge-std`, `openzeppelin-contracts`) show as modified in `git status` — this is normal and doesn't need to be committed unless versions changed.

### Git History
| Commit | Description |
|--------|-------------|
| `abd04b3` | Initial Create Next App |
| `cf605f7` | Farcaster SDK setup with Roman theme |
| `5ae6725` | Farcaster manifest and miniapp embed metadata |
| `ea87ec8` | Premium Roman-themed UI polish across all pages |
| `ab3f067` | VoxVault smart contract with Aave V3 yield routing (17 tests) |
| `c8e2a13` | CLAUDE.md build progress scratchpad |
| `09416e9` | Wire VoxVault contract hooks into frontend |
| `c9449a1` | Update build progress through Phase 4 completion |
| `9cf0116` | Complete Phase 4.5 testing, add lessons learned |
| `5b69f7f` | Deploy VoxVault to Base Sepolia (0x3Ef45c16) |
| `12c87e2` | Add Base Sepolia addresses, deployment lessons learned |

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
- VoxVault: `0x0672322b544B5291277F2d99142104B29a155846`

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
- `VoxVault.t.sol` (`contracts/test/`) - 45 tests all passing (deposits, yield splits, withdrawals, access control, multi-user fairness, Aave rounding)
- `Deploy.s.sol` (`contracts/script/`) - Base mainnet deploy script
- OpenZeppelin + forge-std dependencies installed
- Security hardening: MasterChef-style `accYieldPerShare` accumulator, ReentrancyGuard, Pausable, per-tier early withdrawal penalties, Aave rounding tolerance, `renounceOwnership` disabled, zero-address validation on all constructor params

**Phase 4 - Contract Integration** ✅
- VoxVault ABI + ERC20 ABI exported with `as const` type safety (`lib/contracts/`)
- 4 read hooks: `useVaultStats`, `useUserPositions`, `useUsdcBalance`, `useUsdcAllowance`
- 4 write hooks: `useDeposit`, `useWithdraw`, `useClaimYield`, `useApproveUsdc`
- Custom Farcaster wallet connector (`lib/wagmi/farcasterConnector.ts`) using `sdk.wallet.getEthereumProvider()`
- Auto-connect in `FarcasterProvider` when inside Farcaster client
- Deposit page: full approve -> deposit -> confirm flow with tx status, USDC balance display, success state
- Dashboard: `LivePositionCard` with on-chain reads + real claim/withdraw
- Home page: live TVL/funded from contract
- `tsconfig.json` target bumped to ES2020 for BigInt literal support
- Helper utils: `formatUsdc`, `parseUsdc`, `TIER_ID_MAP`, `TIER_LABELS`, `LockTier` enum
- All write hooks include explicit `chainId: CHAIN_ID` for safety

**Phase 4.5 - Local Testing** ✅
- [x] `pnpm build` passes clean (all 5 routes, 0 TypeScript errors)
- [x] All 3 pages render correctly (200 responses, SSR -> client hydration)
- [x] Wagmi hooks safely disabled when vault address is empty (`query: { enabled: isVaultDeployed }`)
- [x] Fonts loading (Cinzel, Geist, Geist Mono all preloaded in SSR HTML)
- [x] Farcaster `fc:miniapp` meta tag present with correct schema
- [x] Dev server runs with zero errors in console

**Phase 5 - Security Hardening** ✅
- Rewrote yield accounting: naive snapshot -> MasterChef `accYieldPerShare` accumulator with per-position `yieldDebt`
- Added ReentrancyGuard on all state-changing functions (deposit, withdraw, claimYield)
- Added Pausable with owner-only emergency stop (`pause()` / `unpause()`)
- Changed early withdrawal penalty from flat 5% to tiered: 0% / 5% / 7.5% / 10%
- Changed `approve()` to `forceApprove()` for non-standard ERC20 tokens
- Added `getPendingYield()` view function for frontend yield display
- Zero-address validation on all constructor params
- Overrode `renounceOwnership()` to revert (prevents bricking pause/admin)
- Handled residual yield windfall on first deposit after all withdrawals
- Handled aUSDC balance decrease (Aave bad debt) without breaking accumulator
- Capped all Aave withdrawals to actual aUSDC balance (rounding tolerance)
- Safe subtraction on `lastTrackedBalance` to prevent underflow
- Test suite expanded from 17 to 45 tests

**Phase 5b - Base Mainnet Deployment** ✅
- Deployer: `0xa8242b9F72d021B9eb07Ff7101bE83D122588a0b`
- Newsroom fund: `0xfB77EEdD447A853869Dff15453E5021Be4E463EF`
- VoxVault v1 deployed: `0x654E89904de401eB863992D55a8211266fB6d0Ca` (abandoned — withdraw bug from Aave rounding)
- VoxVault v2 deployed: `0x0672322b544B5291277F2d99142104B29a155846` (current, with Aave rounding fix)
- Frontend config updated: `ACTIVE_CHAIN = base`, vault address in `CONTRACTS.VOX_VAULT[base.id]`
- E2E test passed: approve 1 USDC -> deposit -> withdraw -> newsroom received yield split
- Frontend deployed to Vercel
- Mock/demo data removed — all pages show real on-chain data

### In Progress / Next Up

**Phase 7 - Polish & Social** 🔜 ← **START HERE NEXT SESSION**
- [ ] Farcaster manifest domain signing (visit https://farcaster.xyz/~/developers/mini-apps/manifest?domain=YOUR_VERCEL_DOMAIN)
- [ ] Share cards after deposit (Farcaster cast composer)
- [ ] Error boundaries + loading skeletons
- [ ] Accessibility audit

**Phase 6 - Backend & Data** 🔜 (optional for MVP)
- [ ] Neon Postgres setup (can use on-chain reads only for now)
- [ ] API routes: `/api/positions`, `/api/yields`, `/api/stats`
- [ ] Contract event indexing for historical data
- [ ] Leaderboard data
- [ ] Depositor count (not available on-chain without indexer)

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
- MasterChef-style `accYieldPerShare` yield accounting (replaces naive snapshot approach that had first-claimer advantage)
- Wagmi v3 (latest, matches wagmi skill)
- Custom `createConnector` for Farcaster wallet (with `Promise<any>` return to handle v3.4 `withCapabilities` generic)
- All pages show real on-chain data (mock/demo mode removed after mainnet deployment)
- Hooks use `query: { enabled }` pattern to prevent calls when address/vault unavailable
- `ACTIVE_CHAIN` pattern: single variable in wagmi config controls which chain hooks target; currently set to `base` (mainnet)
- Skipped Sepolia testing (faucet issues), deployed directly to Base mainnet with small amounts
- VoxVault v1 abandoned after discovering Aave rounding bug; v2 deployed with fix

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
- **Guard before you call**: `isVaultDeployed` is computed once at module level from the config. Read hooks check it; write hooks are only triggered by user clicks, so they naturally won't fire when there's no vault.
- All pages show real on-chain data. When wallet is not connected or no positions exist, show the "No positions yet" empty state with a CTA to deposit.
- Parallel agent work (UI + contracts simultaneously) is efficient but requires careful commit separation — keep frontend and contract commits distinct for cleaner git history.

**Aave V3 Integration**
- Depositing X USDC gives X-1 or X-2 aUSDC due to Aave's scaled balance math (`getReserveNormalizedIncome`). All Aave withdrawals MUST be capped to `min(amount, aUsdc.balanceOf(this))` or they revert with `0x47bc4b2c` (INSUFFICIENT_BALANCE).
- After yield settlement withdraws a tiny amount, the remaining aUSDC may be less than the principal. Safe subtraction is required on `lastTrackedBalance`.
- Aave V3 on Base Sepolia uses its own mock USDC (`0xba50...`), NOT Circle's testnet USDC (`0x036C...`). Must mint via https://staging.aave.com/faucet/.
- The Aave mock USDC token's `mint()` is owner-restricted. Direct `cast send` minting doesn't work — use the staging.aave.com/faucet UI.

**Deployment**
- `contracts/.env` `source` does not work reliably in git bash on Windows. Use inline `export VAR=value &&` or set vars directly when running cast commands.
- `foundry.toml` etherscan config eagerly resolves env vars even when not verifying. Comment out the `[etherscan]` section if `BASESCAN_API_KEY` is not set, or the deploy script will fail.
- Base mainnet gas is extremely cheap (~$0.01 for a full contract deploy). Deploying directly to mainnet with small amounts is viable when testnet faucets are broken.
- Gas estimation on Base can fail for complex Aave interactions (`cast send` arithmetic overflow). Pass `--gas-limit 500000` explicitly.
- Farcaster Quick Auth is fully client-side — no private keys or env vars needed on Vercel for auth.

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
| `c40722d` | Add faucet minting lessons, env sourcing notes |
| `845173f` | Lower minimum deposit to 1 USDC, add RNBW staking to roadmap |
| `6f4ec57` | Security hardening: MasterChef yield, ReentrancyGuard, Pausable (35 tests) |
| `6b4ab9d` | Deep audit fixes: Aave return capture, rounding tolerance (45 tests) |
| `031d297` | Deploy VoxVault v2 to Base mainnet (0x06723...) |
| `9d7383e` | Update README with project overview |
| `66d3d08` | Record session progress, pivot to mainnet deploy |

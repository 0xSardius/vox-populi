# Vox Populi — Claude Code Build Prompt

## What You're Building

Vox Populi is a Farcaster miniapp that lets users deposit USDC, earn yield via DeFi protocols on Base, and automatically split a portion of that yield with a newsroom treasury that funds independent journalism. The core innovation is **time-weighted yield splitting**: longer lock commitments let users keep more yield while still funding public goods journalism.

**Tagline**: "Earn yield. Fund journalism. Voice of the people."

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Farcaster Integration**: MiniKit (`@coinbase/onchainkit/minikit`) — this is the primary miniapp SDK
- **Chain**: Base (chain ID 8453)
- **Wallet**: Wagmi + Farcaster miniapp connector (`@farcaster/miniapp-wagmi-connector`)
- **Smart Contracts**: Solidity (Foundry for compilation/testing), deployed to Base
- **Onchain Components**: OnchainKit `<Transaction />` component for contract interactions
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Neon Postgres (for off-chain position tracking, leaderboards, analytics)
- **Yield Distribution**: 0xSplits for automated newsroom treasury payments
- **Deployment**: Vercel
- **Package Manager**: pnpm

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│              Farcaster Client                │
│         (Warpcast / Coinbase Wallet)         │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           Next.js Miniapp (Vercel)           │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │  Home /  │ │ Deposit  │ │  Dashboard   │ │
│  │  Landing │ │  Flow    │ │  (Positions) │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  API Routes                          │    │
│  │  /api/positions  — read user data    │    │
│  │  /api/yields     — fetch APY data    │    │
│  │  /api/webhook    — frame events      │    │
│  │  /api/notification — proxy           │    │
│  └──────────────────────────────────────┘    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           Base (L2)                          │
│                                              │
│  ┌──────────────────────────────┐            │
│  │  VoxVault.sol                │            │
│  │  - deposit(amount, tier,     │            │
│  │    strategy)                 │            │
│  │  - claimYield()              │            │
│  │  - withdraw()                │            │
│  │  - earlyWithdraw()           │            │
│  └──────────┬───────────────────┘            │
│             │                                │
│  ┌──────────▼───────────────────┐            │
│  │  Yield Strategies            │            │
│  │  - Aave V3 (Stable)          │            │
│  │  - Yearn USDC vault (Opt.)   │            │
│  │  - Pendle (Aggressive)       │            │
│  └──────────┬───────────────────┘            │
│             │                                │
│  ┌──────────▼───────────────────┐            │
│  │  0xSplits                    │            │
│  │  (newsroom treasury)         │            │
│  └──────────────────────────────┘            │
└──────────────────────────────────────────────┘
```

---

## Smart Contract: VoxVault.sol

This is the core contract. Build with Foundry (forge).

### Data Structures

```solidity
enum LockTier { Flexible, ThreeMonth, SixMonth, TwelveMonth }
enum YieldStrategy { Stable, Optimized, Aggressive }

struct Position {
    address user;
    uint256 amount;          // USDC deposited (6 decimals)
    LockTier tier;
    YieldStrategy strategy;
    uint256 depositTimestamp;
    uint256 unlockTimestamp;  // 0 for Flexible tier
    uint256 yieldClaimed;    // cumulative yield claimed by user
    bool active;
}
```

### Constants & Parameters

```
Yield Split Ratios (user keeps / newsroom gets):
- Flexible:   25% / 75%
- 3 months:   50% / 50%
- 6 months:   60% / 40%
- 12 months:  75% / 25%

Early Withdrawal Slash (% of principal sent to newsroom):
- 3 months:   5%
- 6 months:   7.5%
- 12 months:  10%
- Flexible:   N/A (no lock)

Minimum deposit: 10 USDC ($10)
```

### Key Functions

```solidity
// Core
function deposit(uint256 amount, LockTier tier, YieldStrategy strategy) external
function claimYield(uint256 positionId) external          // claim accrued yield (allowed during lock)
function withdraw(uint256 positionId) external             // withdraw principal + remaining yield after lock
function earlyWithdraw(uint256 positionId) external        // withdraw before lock expires (slash applies)

// View
function getPosition(uint256 positionId) external view returns (Position memory)
function getUserPositions(address user) external view returns (uint256[] memory)
function getAccruedYield(uint256 positionId) external view returns (uint256 userShare, uint256 newsroomShare)
function getTotalTVL() external view returns (uint256)

// Admin
function setNewsroomAddress(address newsroom) external onlyOwner
function pause() / unpause() external onlyOwner
```

### Yield Routing Logic

For the MVP, implement the **Stable strategy only** (Aave V3 USDC lending on Base). The contract should be designed with a strategy interface so Optimized and Aggressive can be added later without redeployment.

```solidity
interface IYieldStrategy {
    function deposit(uint256 amount) external returns (uint256 shares);
    function withdraw(uint256 shares) external returns (uint256 amount);
    function getBalance(uint256 shares) external view returns (uint256);
    function getAPY() external view returns (uint256); // basis points
}
```

For MVP, create `AaveStrategy.sol` that wraps Aave V3's USDC pool on Base:
- Aave V3 Pool on Base: `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5`
- USDC on Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- aBasUSDC (Aave receipt token): `0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB`

### 0xSplits Integration

When yield is distributed, the newsroom's share should be sent to the 0xSplits contract address. For MVP, use a hardcoded placeholder address that can be updated by the owner once the team's multisig is confirmed.

### Important Contract Design Notes

- Users can hold **multiple positions** simultaneously with different tiers/strategies
- Position IDs are sequential uint256s
- Yield claiming is allowed **during** lock period (only principal is locked)
- Strategy switching mid-lock is **not** allowed
- Use OpenZeppelin for Ownable, Pausable, ReentrancyGuard
- USDC has 6 decimals (not 18)
- Emit events for all state changes (Deposited, YieldClaimed, Withdrawn, EarlyWithdrawn)

---

## Frontend: Miniapp Screens

### Project Setup

Initialize with MiniKit CLI:
```bash
npx create-onchain --mini
```

This scaffolds a Next.js project with MiniKitProvider, wagmi config, webhook routes, and farcaster.json manifest handling already wired up.

### Screen 1: Home

The landing screen users see when opening the miniapp.

**Content:**
- App name "Vox Populi" + tagline
- Total TVL in protocol (read from contract `getTotalTVL()`)
- Current APY range displayed (e.g., "4-7% APY")
- Big "Deposit" CTA button
- If wallet connected: show summary of user's active positions
- Collective impact metric: "Together we've funded $X for journalism"

### Screen 2: Deposit Flow

The configuration screen where users set up their position.

**Content:**
- Amount input (USDC, min $10)
- Lock period selector: 4 cards (Flexible / 3mo / 6mo / 12mo), each showing the yield split
- Yield strategy selector: 3 cards (Stable 🛡️ / Optimized ⚖️ / Aggressive 🚀) with APY ranges and risk labels. Only Stable is active for MVP; Optimized and Aggressive show "Coming Soon" badges
- Live projection calculator: as user adjusts inputs, show estimated earnings breakdown
  - "You earn: $X.XX/year"
  - "Newsroom receives: $X.XX/year"
- Review summary before confirming
- Use OnchainKit `<Transaction />` component to execute the deposit

### Screen 3: Dashboard

Shows user's active positions and overall stats.

**Content:**
- List of user's positions, each showing:
  - Amount deposited
  - Lock tier + countdown timer to unlock
  - Strategy
  - Accrued yield (split view: "Your share: $X | Newsroom: $Y")
  - "Claim Yield" button (always available)
  - "Withdraw" button (enabled only when unlocked, or shows "Early Withdraw" with slash warning)
- Total portfolio value
- Total yield earned
- Total contributed to journalism

### Social / Viral Elements

- Share card generated after deposit: "I'm supporting independent journalism on Vox Populi 📰" — include amount, lock tier, projected impact
- Use MiniKit's `useShareComposer()` or cast intent URL: `https://warpcast.com/~/compose?text=...&embeds[]=<miniapp-url>`
- Friend leaderboard: "Top supporters among your Farcaster friends" (v1 can be simple total deposits ranking)

### Design System

- **Color scheme**: Dark background (#0a0a0a), Farcaster purple (#8B5CF6) as accent, white text
- Use shadcn/ui components for cards, buttons, inputs, dialogs
- Mobile-first (miniapps run in Farcaster mobile clients)
- Respect MiniKit safe area insets (MiniKitProvider handles this automatically)

---

## Database Schema (Neon Postgres)

For off-chain tracking, leaderboards, and caching yield data:

```sql
-- Track positions (mirrors on-chain, for fast reads)
CREATE TABLE positions (
  id SERIAL PRIMARY KEY,
  position_id INTEGER NOT NULL,        -- on-chain position ID
  user_address TEXT NOT NULL,
  fid INTEGER,                          -- Farcaster FID if available
  amount NUMERIC(20, 6) NOT NULL,
  lock_tier TEXT NOT NULL,
  yield_strategy TEXT NOT NULL,
  deposit_timestamp TIMESTAMPTZ NOT NULL,
  unlock_timestamp TIMESTAMPTZ,
  status TEXT DEFAULT 'active',         -- active, withdrawn, early_withdrawn
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track yield claims
CREATE TABLE yield_claims (
  id SERIAL PRIMARY KEY,
  position_id INTEGER NOT NULL,
  user_share NUMERIC(20, 6) NOT NULL,
  newsroom_share NUMERIC(20, 6) NOT NULL,
  claimed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard / social
CREATE TABLE users (
  address TEXT PRIMARY KEY,
  fid INTEGER,
  username TEXT,
  total_deposited NUMERIC(20, 6) DEFAULT 0,
  total_yield_earned NUMERIC(20, 6) DEFAULT 0,
  total_journalism_funded NUMERIC(20, 6) DEFAULT 0,
  first_deposit_at TIMESTAMPTZ
);
```

---

## API Routes

```
GET  /api/positions?address=0x...     — fetch user's positions (from DB cache)
GET  /api/yields                       — current APY for each strategy
GET  /api/stats                        — TVL, total funded, depositor count
GET  /api/leaderboard                  — top depositors (by total funded)
POST /api/webhook                      — Farcaster frame webhook handler
POST /api/notification                 — notification proxy (MiniKit built-in)
POST /api/sync                         — sync on-chain events to DB (called by cron or webhook)
```

---

## Environment Variables

```env
# App
NEXT_PUBLIC_URL=https://voxpopuli.app
NEXT_PUBLIC_APP_NAME=Vox Populi

# Coinbase / OnchainKit
NEXT_PUBLIC_ONCHAINKIT_API_KEY=
NEXT_PUBLIC_CDP_CLIENT_API_KEY=

# Contract addresses (set after deployment)
NEXT_PUBLIC_VOXVAULT_ADDRESS=
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Database
DATABASE_URL=                          # Neon Postgres connection string

# Farcaster / Frame (auto-generated by MiniKit CLI)
FARCASTER_HEADER=
FARCASTER_PAYLOAD=
FARCASTER_SIGNATURE=

# Redis (for notifications/webhooks, required by MiniKit)
KV_REST_API_URL=
KV_REST_API_TOKEN=

# 0xSplits
NEWSROOM_SPLIT_ADDRESS=               # placeholder until multisig confirmed
```

---

## Build Order

Follow this sequence. Each phase should be a working, testable state.

### Phase 1: Project Scaffold + Frontend Shell
1. Initialize project with `npx create-onchain --mini`
2. Set up Tailwind + shadcn/ui
3. Build the three screens (Home, Deposit, Dashboard) with hardcoded/mock data
4. Wire up MiniKit hooks: `useMiniKit()`, `useAddFrame()`, `useNotification()`
5. Implement wallet connection with Farcaster miniapp connector
6. Deploy to Vercel, test in Warpcast dev tools

### Phase 2: Smart Contract
1. Initialize Foundry project in `/contracts` subdirectory
2. Build VoxVault.sol with the IYieldStrategy interface
3. Build AaveStrategy.sol (Stable strategy wrapping Aave V3)
4. Write comprehensive tests (deposit, claim, withdraw, early withdraw, edge cases)
5. Deploy to Base Sepolia testnet
6. Verify on Basescan

### Phase 3: Contract Integration
1. Generate TypeScript ABIs from compiled contracts
2. Wire deposit flow to real contract using OnchainKit `<Transaction />`
3. Wire claim/withdraw to real contract
4. Add USDC approval flow (user must approve VoxVault to spend their USDC)
5. Read TVL, position data, accrued yield from contract

### Phase 4: Database + API
1. Set up Neon Postgres with schema above
2. Build API routes for positions, stats, leaderboard
3. Add event indexer: listen for contract events and sync to DB
4. Wire frontend to read from API for fast loading, fall back to contract for accuracy

### Phase 5: Social + Polish
1. Build share card / cast composer for post-deposit sharing
2. Build leaderboard component
3. Add collective impact metric
4. Notifications for yield milestones
5. Polish UI, loading states, error handling
6. Mobile testing in Warpcast

---

## Key MiniKit Patterns to Follow

### Provider Setup (providers.tsx)
```tsx
import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { base } from 'wagmi/chains';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
      config={{
        appearance: {
          mode: 'dark',
          theme: 'default',
          name: 'Vox Populi',
        },
      }}
    >
      {children}
    </MiniKitProvider>
  );
}
```

### Initialize Frame (page.tsx)
```tsx
const { setFrameReady, isFrameReady, context } = useMiniKit();

useEffect(() => {
  if (!isFrameReady) setFrameReady();
}, [isFrameReady, setFrameReady]);
```

### Deposit Transaction Example
```tsx
import { Transaction, TransactionButton, TransactionStatus } from '@coinbase/onchainkit/transaction';

<Transaction
  chainId={8453}
  contracts={[
    // Step 1: Approve USDC
    {
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'approve',
      args: [VOXVAULT_ADDRESS, depositAmount],
    },
    // Step 2: Deposit
    {
      address: VOXVAULT_ADDRESS,
      abi: voxVaultAbi,
      functionName: 'deposit',
      args: [depositAmount, lockTier, yieldStrategy],
    },
  ]}
  onSuccess={(response) => {
    // Show share card, update UI
  }}
>
  <TransactionButton text="Deposit & Earn" />
  <TransactionStatus>
    <TransactionStatusLabel />
    <TransactionStatusAction />
  </TransactionStatus>
</Transaction>
```

---

## What NOT to Build (Out of Scope for MVP)

- VOX governance token
- Breadchain/Breadcoop integration
- Multi-token deposits (ETH, other stables)
- On-chain governance for fund allocation
- Journalist recipient selection mechanism
- DAO structure
- Agentic/AI features
- Optimized (Yearn) and Aggressive (Pendle) strategies — UI shows "Coming Soon", contract has interface ready

---

## Success Criteria

The MVP is done when:
1. A user can open the miniapp in Warpcast
2. Connect their wallet
3. Deposit USDC with a selected lock tier
4. See their position on the dashboard with accrued yield
5. Claim yield (split automatically between user and newsroom)
6. Withdraw after lock expires (or early withdraw with slash)
7. Share their deposit via a cast
8. See a leaderboard of top supporters

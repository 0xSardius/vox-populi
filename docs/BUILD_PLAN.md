# Vox Populi Build Plan

## Overview

This document outlines the phased implementation plan for Vox Populi MVP. Each phase produces a working, testable state.

---

## Phase 1: Project Setup & Farcaster Integration

### 1.1 Dependencies & Configuration
- [ ] Install core dependencies:
  - `@farcaster/miniapp-sdk` - Farcaster SDK
  - `wagmi` + `viem` - Wallet/contract interactions
  - `@tanstack/react-query` - Data fetching
  - `shadcn/ui` components - UI library
- [ ] Configure Tailwind CSS v4 with dark theme
- [ ] Set up environment variables structure
- [ ] Configure wagmi for Base chain

### 1.2 Farcaster SDK Setup
- [ ] Create SDK initialization wrapper
- [ ] Implement `sdk.actions.ready()` call on app load
- [ ] Set up Quick Auth (`sdk.quickAuth.getToken()`)
- [ ] Create auth context/hook for session management
- [ ] Implement wallet provider via `sdk.wallet.getEthereumProvider()`

### 1.3 Manifest & Metadata
- [ ] Create `/.well-known/farcaster.json` manifest route
- [ ] Set up `fc:miniapp` meta tags for embed
- [ ] Create splash screen assets (200x200 icon)
- [ ] Create OG image (3:2 ratio)

### 1.4 Basic App Shell
- [ ] Create layout with dark theme (#0a0a0a background)
- [ ] Build navigation structure (Home / Deposit / Dashboard)
- [ ] Create placeholder pages with mock data
- [ ] Test in Farcaster dev tools / preview

**Deliverable**: App loads in Warpcast, shows splash, initializes SDK, user can connect

---

## Phase 2: Frontend UI (Mock Data)

### 2.1 Home Screen
- [ ] Hero section with tagline
- [ ] TVL display (mock: $1.2M)
- [ ] APY range display (4-7%)
- [ ] "Deposit" CTA button
- [ ] Connected user position summary
- [ ] Collective impact metric

### 2.2 Deposit Flow
- [ ] Amount input with USDC formatting
- [ ] Minimum deposit validation ($10)
- [ ] Lock tier selector (4 cards with yield split display):
  - Flexible (25% user / 75% newsroom)
  - 3 months (50% / 50%)
  - 6 months (60% / 40%)
  - 12 months (75% / 25%)
- [ ] Yield strategy selector:
  - Stable (active, 4-7% APY)
  - Optimized (Coming Soon badge)
  - Aggressive (Coming Soon badge)
- [ ] Live earnings projection calculator
- [ ] Review/confirm screen
- [ ] Transaction status UI

### 2.3 Dashboard
- [ ] Position cards with:
  - Amount deposited
  - Lock tier + countdown timer
  - Strategy badge
  - Accrued yield split view
- [ ] Claim yield button
- [ ] Withdraw button (locked/unlocked states)
- [ ] Early withdraw with slash warning
- [ ] Portfolio totals

### 2.4 Shared Components
- [ ] Button variants (primary, secondary, ghost)
- [ ] Card component
- [ ] Input with validation
- [ ] Loading states/skeletons
- [ ] Toast notifications
- [ ] Modal/dialog component

**Deliverable**: Full UI flow with mock data, all screens functional

---

## Phase 3: Smart Contracts

### 3.1 Foundry Setup
- [ ] Initialize Foundry in `/contracts`
- [ ] Configure for Base chain
- [ ] Set up OpenZeppelin imports
- [ ] Create deployment scripts

### 3.2 VoxVault.sol Core
- [ ] Position struct and storage
- [ ] LockTier and YieldStrategy enums
- [ ] Constants for yield splits and slash percentages
- [ ] `deposit(amount, tier, strategy)` function
- [ ] `getPosition(id)` and `getUserPositions(user)` views
- [ ] Events: Deposited, YieldClaimed, Withdrawn, EarlyWithdrawn

### 3.3 Yield Strategy Interface
- [ ] `IYieldStrategy` interface:
  ```solidity
  function deposit(uint256 amount) external returns (uint256 shares);
  function withdraw(uint256 shares) external returns (uint256 amount);
  function getBalance(uint256 shares) external view returns (uint256);
  function getAPY() external view returns (uint256);
  ```
- [ ] Strategy registry in VoxVault

### 3.4 AaveStrategy.sol
- [ ] Wrap Aave V3 USDC pool on Base
- [ ] Deposit USDC → receive aBasUSDC
- [ ] Track shares per position
- [ ] Calculate yield based on aToken balance growth

### 3.5 Yield & Withdrawal Logic
- [ ] `claimYield(positionId)` - split per tier ratios
- [ ] `withdraw(positionId)` - return principal after unlock
- [ ] `earlyWithdraw(positionId)` - apply slash penalty
- [ ] `getTotalTVL()` view
- [ ] `getAccruedYield(positionId)` view

### 3.6 Admin & Safety
- [ ] Ownable (OpenZeppelin)
- [ ] Pausable (OpenZeppelin)
- [ ] ReentrancyGuard
- [ ] `setNewsroomAddress(address)`
- [ ] Placeholder newsroom address for dev

### 3.7 Testing
- [ ] Deposit flow tests
- [ ] Yield accrual tests (with time manipulation)
- [ ] Withdrawal tests (normal + early)
- [ ] Edge cases (min deposit, multiple positions)
- [ ] Slash calculation tests

### 3.8 Deployment
- [ ] Deploy to Base Sepolia testnet
- [ ] Verify on Basescan
- [ ] Export ABIs to frontend

**Deliverable**: Tested, deployed contracts on Base Sepolia

---

## Phase 4: Contract Integration

### 4.1 Contract Setup
- [ ] Add contract ABIs to `/lib/contracts`
- [ ] Configure contract addresses (env vars)
- [ ] Create typed contract hooks with wagmi

### 4.2 Deposit Integration
- [ ] USDC approval flow (check allowance, approve if needed)
- [ ] Deposit transaction with proper args
- [ ] Transaction status tracking
- [ ] Success/error handling

### 4.3 Read Contract Data
- [ ] Fetch user positions on connect
- [ ] Display real TVL from contract
- [ ] Calculate and display accrued yield
- [ ] Show unlock countdown from chain data

### 4.4 Claim & Withdraw
- [ ] Wire claim yield button to contract
- [ ] Wire withdraw button (check unlock time)
- [ ] Wire early withdraw with confirmation modal
- [ ] Show slash amount before confirming

**Deliverable**: Full deposit/claim/withdraw flow working against testnet contracts

---

## Phase 5: Database & API

### 5.1 Database Setup
- [ ] Provision Neon Postgres database
- [ ] Create schema:
  - positions table
  - yield_claims table
  - users table
- [ ] Set up database client (drizzle or prisma)

### 5.2 API Routes
- [ ] `GET /api/positions?address=` - cached position data
- [ ] `GET /api/yields` - current APY data
- [ ] `GET /api/stats` - TVL, total funded, depositor count
- [ ] `GET /api/leaderboard` - top depositors

### 5.3 Event Indexing
- [ ] Listen for contract events
- [ ] Sync Deposited events to positions table
- [ ] Sync YieldClaimed events
- [ ] Sync Withdrawn/EarlyWithdrawn events
- [ ] Update user aggregates

### 5.4 Webhook Handler
- [ ] `POST /api/webhook` - Farcaster events
- [ ] Handle miniapp_added
- [ ] Handle notifications_enabled
- [ ] Store notification tokens

**Deliverable**: API serving cached data, events syncing to DB

---

## Phase 6: Social & Polish

### 6.1 Share Cards
- [ ] Post-deposit share composer
- [ ] Dynamic OG image with deposit details
- [ ] Cast intent URL generation
- [ ] "I'm supporting journalism" template

### 6.2 Leaderboard
- [ ] Friend leaderboard component
- [ ] Top supporters among Farcaster friends
- [ ] Global leaderboard view

### 6.3 Notifications
- [ ] Yield milestone notifications
- [ ] Unlock ready notifications
- [ ] Weekly summary notifications

### 6.4 Polish
- [ ] Loading states everywhere
- [ ] Error boundaries
- [ ] Empty states
- [ ] Mobile testing in Warpcast
- [ ] Accessibility review
- [ ] Performance optimization

**Deliverable**: Production-ready MVP

---

## Phase 7: Launch Prep

### 7.1 Mainnet Deployment
- [ ] Deploy contracts to Base mainnet
- [ ] Verify on Basescan
- [ ] Update contract addresses
- [ ] Configure newsroom treasury address (0xSplits)

### 7.2 Security
- [ ] Contract audit (or thorough review)
- [ ] Frontend security review
- [ ] Rate limiting on APIs
- [ ] Error monitoring setup

### 7.3 Go Live
- [ ] Domain setup
- [ ] Production environment variables
- [ ] Monitoring/alerts
- [ ] Soft launch to group chat
- [ ] Broader launch

---

## Key Technical Notes

### Farcaster SDK (NOT MiniKit)
```typescript
import { sdk } from '@farcaster/miniapp-sdk'

// Initialize
await sdk.actions.ready()

// Auth
const token = await sdk.quickAuth.getToken()

// Wallet
const provider = sdk.wallet.getEthereumProvider()
```

### Contract Constants
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (6 decimals)
- Aave V3 Pool: `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5`
- Base Chain ID: 8453

### Design Tokens (Roman Theme)
- Background: #0a0a0a
- Primary: #C41E3A (Cardinal red)
- Secondary: #D4AF37 (Roman gold)
- Surface: #1a1a1a
- Border: #2a2a2a
- Text: #ffffff
- Text Muted: #a1a1a1

---

## Success Criteria

MVP complete when a user can:
1. Open miniapp in Warpcast
2. Connect via Quick Auth
3. Deposit USDC with selected lock tier
4. See position on dashboard with accrued yield
5. Claim yield (auto-split to newsroom)
6. Withdraw after lock expires
7. Share deposit via cast
8. See leaderboard of supporters

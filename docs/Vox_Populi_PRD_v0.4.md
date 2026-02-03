# VOX POPULI

### Product Requirements Document

**Version 0.4 | January 30, 2026 | DRAFT FOR REVIEW**

> *"Earn yield. Fund journalism. Voice of the people."*

---

## Overview

Vox Populi is a Farcaster miniapp that enables users to stake assets, earn yield, and automatically share a portion with an independent journalism fund. The core innovation is **time-weighted yield splitting** — longer lock commitments let users keep more of their yield while still funding public goods journalism.

Unlike traditional donation models where users give up their capital, Vox Populi uses a **crowdstaking** approach: users retain their principal and only share a portion of the yield generated. This creates sustainable, ongoing funding for journalism without requiring continuous fundraising.

### Problem

Independent journalism lacks sustainable funding mechanisms. Traditional models (subscriptions, donations, ads) create dependencies on either audience size or wealthy benefactors. Public goods funding rounds are sporadic and competitive.

### Solution

A yield-splitting protocol where users stake assets, earn yield, and automatically share a portion with journalism. Users are incentivized (not purely altruistic) because they keep yield too. Longer commitments = more yield retained, creating alignment between user benefit and journalism funding sustainability.

---

## Core Mechanics

### Yield Split Tiers

Users select their commitment level when depositing. Longer locks = higher percentage of yield retained by the user.

| Lock Period | User Keeps | Newsroom Gets | Use Case |
|:---:|:---:|:---:|:---:|
| Flexible (no lock) | 25% | **75%** | *Maximum impact, full liquidity* |
| 3 months | 50% | 50% | *Balanced commitment* |
| 6 months | 60% | 40% | *Serious supporter* |
| 12 months | **75%** | 25% | *True believer, max yield* |

### Multi-Strategy Yield

Users also select a yield strategy, giving them control over their risk/reward profile.

| Strategy | Expected APY | Risk Level | How It Works |
|---|:---:|:---:|---|
| 🛡️ Stable | 4-7% | Low | Aave/Morpho lending. Battle-tested, reliable. |
| ⚖️ Optimized | 6-10% | Medium | Yearn vaults. Auto-rebalances across protocols for best rates. |
| 🚀 Aggressive | 10-15%+ | Higher | Pendle yield tokenization. Higher complexity, higher potential. |

### Strategy Details

**Stable (Aave/Morpho):** USDC deposited into battle-tested lending protocols. Borrowers pay interest, lenders earn yield. Lowest risk, most predictable returns.

**Optimized (Yearn):** Yearn vaults automatically move funds between protocols (Aave, Morpho, Compound) to capture the best rates. Auto-compounding. More smart contract exposure but higher average yields.

**Aggressive (Pendle):** Pendle tokenizes future yield, allowing users to trade yield separately from principal. More complex mechanics but can capture significantly higher returns in certain market conditions.

---

## Technical Architecture

### Stack

- **Frontend:** Next.js + MiniKit (Farcaster native)
- **Chain:** Base (low gas, Farcaster alignment, protocols live)
- **Yield Sources:** Aave/Morpho (Stable), Yearn (Optimized), Pendle (Aggressive)
- **Distribution:** 0xSplits for automated newsroom payments
- **Auth:** Farcaster Quick Auth / wallet connect

### Smart Contract: VoxVault

Core contract that manages deposits, tracks positions, routes to yield strategies, and handles withdrawals.

- **`deposit(amount, lockTier, strategy)`** — accept USDC, record position, route to selected yield strategy
- **`claimYield()`** — calculate accrued yield, split per lock tier, send to user + newsroom
- **`withdraw()`** — return principal after lock expires (or apply penalty if early)
- **`earlyWithdraw()`** — apply slashing penalty, return remaining principal
- Tracks: user address, amount, lock tier, strategy, unlock timestamp, accrued yield

### Yield Strategy Routing

VoxVault routes deposits to the appropriate yield source based on user selection:

- **Stable:** Direct deposit to Aave V3 or Morpho lending pools on Base
- **Optimized:** Deposit to Yearn USDC vault, which auto-rebalances across protocols
- **Aggressive:** Deposit to Pendle for yield tokenization strategies

---

## Technical Parameters

The following parameters are proposed defaults. These can be adjusted via contract configuration.

| Parameter | Proposed Value | Rationale |
|---|---|---|
| **Early withdrawal slash** | 5% of principal | Meaningful enough to discourage early exit, not so harsh it deters deposits |
| **Slash scaling** | Scales with lock tier | 3mo = 5%, 6mo = 7.5%, 12mo = 10%. Longer commitment = higher penalty for breaking it |
| **Yield claiming during lock** | Yes, allowed | Lets users see real yield flowing. Improves engagement and reduces early withdrawal pressure |
| **Strategy switching mid-lock** | No | Reduces contract complexity. Users can open new positions with different strategy |
| **Minimum deposit** | $10 USDC | Low enough for accessibility, high enough to avoid dust deposits that cost more in gas |
| **Multiple positions** | Yes, allowed | Users can have different amounts at different tiers and strategies simultaneously |

---

## MVP Scope

### In Scope (v1)

- USDC deposits on Base
- Four lock tiers (flexible / 3mo / 6mo / 12mo)
- Three yield strategies (Stable / Optimized / Aggressive)
- Yield splitting logic based on lock tier
- Early withdrawal penalty (principal slashing)
- Basic miniapp UI (deposit / dashboard / withdraw)
- Newsroom treasury accumulation via 0xSplits
- Social share cards for deposits

### Out of Scope (v2+)

- Governance token (VOX) — see Token Considerations below
- Breadchain / Breadcoop integration
- Multi-token deposit support (ETH, other stables)
- On-chain governance for fund allocation
- Journalist recipient selection mechanism
- DAO structure
- Agentic features

---

## Token Considerations (v2)

A native VOX token is being considered for v2 but is intentionally excluded from MVP to maintain focus and ship faster. Below is an analysis of potential token utility and trade-offs.

### Potential Token Use Cases

| Use Case | How It Would Work |
|---|---|
| **Governance** | Token holders vote on which journalists/orgs receive funding from the newsroom treasury |
| **Boosted Yields** | Stake VOX to get better split ratios (e.g., 65% instead of 60% for 6-month lock) |
| **LP Incentives** | Reward early depositors with VOX emissions to bootstrap TVL |
| **Fee Sharing** | VOX stakers receive portion of protocol fees (requires adding a protocol fee layer) |

### Why Not MVP

- **Scope creep:** Token adds smart contract complexity, tokenomics design, and potential audit requirements
- **Narrative clarity:** "Earn yield, fund journalism" is clean. Adding "...and buy our token" muddies the message
- **Regulatory surface:** Yield-bearing token with fee accrual increases securities risk
- **Premature optimization:** Tokens work better with proven product-market fit and existing TVL to bootstrap from

### When Token Makes Sense

- Protocol has meaningful TVL and proven demand
- Community wants decentralized governance over journalist selection
- Need to incentivize growth or bootstrap liquidity
- Clear value accrual mechanism designed (e.g., protocol fee share)

---

## Miniapp UX

### Screen 1: Home

- Total TVL in protocol
- Current APY range
- **"Deposit" CTA** — big, prominent button
- Your active positions (if connected)

### Screen 2: Deposit

- Amount input field
- Lock period selector (cards: Flexible / 3mo / 6mo / 12mo)
- Yield strategy selector (Stable / Optimized / Aggressive) with APY ranges and risk labels
- Clear breakdown: "You earn X%, Newsroom gets Y%"
- Projected earnings calculator based on amount + strategy + lock
- Confirm button

### Screen 3: Dashboard

- Your positions with countdown timers
- Accrued yield breakdown (your share vs newsroom share)
- Claim yield button
- Withdraw button (enabled when unlocked)

### Social / Viral Elements

- Friend leaderboard: "Top supporters among your Farcaster friends"
- Share card when depositing: "I'm supporting independent journalism on Vox Populi"
- Collective impact metric: "Together we've funded $X for journalism"

---

## Decisions & Status

### 1. Early Withdrawal Penalty ✅

**Decision:** Principal slashing, scaled by lock tier. 3mo = 5%, 6mo = 7.5%, 12mo = 10%. Slashed amount goes to newsroom treasury. Flexible tier has no lock so no penalty applies.

### 2. Yield Claiming During Lock ✅

**Decision:** Yes, users can claim accrued yield while principal remains locked. Reduces early withdrawal pressure and improves engagement by showing real yield flowing.

### 3. Strategy Switching ✅

**Decision:** No mid-lock strategy switching. Reduces contract complexity. Users can open new positions with different strategies.

### 4. Minimum Deposit ✅

**Decision:** $10 USDC minimum. Low enough for accessibility, high enough to avoid dust deposits that cost more in gas than they generate.

### 5. Multiple Positions ✅

**Decision:** Yes, users can hold multiple positions simultaneously with different amounts, lock tiers, and yield strategies.

### 6. Newsroom Treasury ⏳

**Status:** Multisig being set up by team member. Once address is confirmed, it will be configured as the recipient in 0xSplits. Using placeholder address for development.

### 7. Rainbow Grant Timing 🔲

RNBW TGE is February 5, 2026. Decision pending on whether to submit grant proposal before or after TGE.

### 8. Launch Strategy 🔲

Soft launch to group chat first vs. broader visibility from Rainbow/Farcaster ecosystems at launch. To be decided closer to MVP completion.

---

## Why This Works

### For Users

- Earn yield on their assets (not pure donation)
- Support journalism without giving up principal
- Flexible commitment options
- Social signaling within Farcaster community

### For Journalism

- Sustainable, ongoing funding (not one-time grants)
- Grows with TVL — more deposits = more yield = more funding
- Independence from traditional funding dependencies

### For Rainbow Ecosystem

- First public goods funding mechanism on RNBW
- Drives staking adoption and TVL
- Positive PR: "Rainbow funds independent journalism"

---

## Next Steps

1. Review this PRD and align on open questions
2. Decide on Rainbow grant timing
3. Set up newsroom multisig
4. Begin smart contract development
5. Design miniapp UI
6. Soft launch to community

---

*Vox Populi — Voice of the People*

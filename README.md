# Vox Populi

**Earn yield. Fund journalism. Voice of the people.**

Vox Populi is a Farcaster miniapp that enables users to stake USDC on Base, earn yield via Aave V3, and automatically share a portion with an independent journalism fund. The core innovation is time-weighted yield splitting — longer lock commitments let users keep more of their yield.

## How It Works

1. **Deposit USDC** on Base with a chosen lock tier
2. **Earn yield** via Aave V3 lending
3. **Yield is split** between you and a newsroom fund based on your commitment

| Lock Period | You Keep | Newsroom Gets |
|---|---|---|
| Flexible | 25% | 75% |
| 3 months | 50% | 50% |
| 6 months | 60% | 40% |
| 12 months | 75% | 25% |

Early withdrawals incur a penalty (5%/7.5%/10% scaled by tier) that goes to the newsroom fund.

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4
- **Chain**: Base (L2)
- **Wallet**: Wagmi v3 + Farcaster SDK
- **Yield**: Aave V3 USDC lending
- **Smart Contracts**: Solidity (Foundry), 45 tests passing
- **Package Manager**: pnpm

## Contract Addresses (Base Mainnet)

| Contract | Address |
|---|---|
| VoxVault | `0x0672322b544B5291277F2d99142104B29a155846` |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Aave V3 Pool | `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5` |
| aBasUSDC | `0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB` |

## Development

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build

# Run contract tests
cd contracts && forge test

# Deploy contracts (requires PRIVATE_KEY and NEWSROOM_FUND in contracts/.env)
cd contracts && forge script script/Deploy.s.sol --rpc-url https://mainnet.base.org --broadcast
```

## Project Structure

```
vox-populi/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Home — TVL, APY, deposit CTA
│   ├── deposit/           # Deposit flow — amount, tier, strategy
│   ├── dashboard/         # Positions, claim yield, withdraw
│   └── components/        # AppShell, BottomNav
├── contracts/             # Foundry smart contracts
│   ├── src/VoxVault.sol  # Core vault (Aave yield + splitting)
│   └── test/             # 45 tests
├── lib/
│   ├── contracts/        # ABIs, hooks (deposit, withdraw, claim)
│   ├── farcaster/        # SDK init, Quick Auth, provider
│   └── wagmi/            # Config, Farcaster wallet connector
└── docs/                  # PRD, build guide
```

## Security

The VoxVault contract includes:

- **MasterChef-style yield accounting** — fair distribution across multiple depositors
- **ReentrancyGuard** on all state-changing functions
- **Pausable** with owner-only emergency stop
- **Zero-address validation** on all constructor params
- **Aave rounding tolerance** — handles 1-2 wei precision loss from scaled balance math
- **renounceOwnership disabled** — prevents accidental contract bricking

## License

MIT

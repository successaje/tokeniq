# TokenIQ - User Flows & Features Documentation

## Overview
TokenIQ is a world-class DeFi platform built on Sei Network, offering AI-powered capital optimization, yield strategies, and comprehensive asset management.

## Platform Architecture

### Built on Sei Network
- **High Performance**: Leveraging Sei's parallelized execution engine
- **Low Fees**: Ultra-low transaction costs
- **Fast Finality**: <100ms transaction confirmation
- **Sei Intelligence Layer**: AI-powered insights and recommendations

---

## Core User Flows

### 1. Dashboard Flow
**Entry Point**: `/protected/dashboard`

**Features**:
- Portfolio overview with real-time value
- Quick action cards for common tasks
- Performance charts (Portfolio & Yield)
- Token holdings summary
- Sei Network status indicators

**Key Metrics Displayed**:
- Total Portfolio Value: $30,000
- Projected Annual Yield: +$3,200
- Average APY: 8.5%
- Active Strategies: 3 (Conservative, Balanced, Growth)

**User Actions**:
1. View portfolio performance
2. Quick access to Discover, Portfolio, Insights, Analytics
3. Monitor token holdings
4. Track yield performance

---

### 2. Portfolio Management Flow
**Entry Point**: `/protected/portfolio`

**Features**:
- **Strategy Cards**: Three AI strategies (Conservative, Balanced, Growth)
  - Conservative: $22,000 allocated, 8.5% APY, Low Risk
  - Balanced: $4,000 allocated, 10.2% APY, Medium Risk
  - Growth: $4,000 allocated, 12.8% APY, High Risk
  
- **Token Holdings**: 
  - Sei (SEI): 25,000 tokens @ $0.64 = $12,000 (40%)
  - USDC: 10,000 @ $1.00 = $10,000 (33.3%)
  - USDT: 3,000 @ $1.00 = $3,000 (10%)
  - Bitcoin: 0.048387 BTC @ $105,340 = $3,000 (10%)
  - Ethereum: 0.588235 ETH @ $3,528 = $2,000 (6.7%)

- **Recent Activities**: Sei Network transaction history

**Interactive Features**:
- **Emergency Withdraw**: Wallet popup → Confirm → Funds restored
- **Yield Charts**: Live projection graphs for each strategy
- **Funds Status**: Real-time allocation tracking

---

### 3. Discover & Capital Optimization Flow
**Entry Point**: `/protected/discover`

**AI-Powered Capital Optimization Section**:
- **Spending vs. Savings Chart**: AI analysis of financial patterns
- **Idle Capital Detection**: Shows $45,000 idle capital
- **Activation Flow**:
  1. Click "Activate TokenIQ Intelligence"
  2. Wallet popup appears
  3. Confirm transaction (mock TX hash generated)
  4. Progress bar: "Allocating funds to Sei yield pools..."
  5. Animation showing allocation to:
     - Sei: $18,000 (40%)
     - USDC: $15,000 (33.3%)
     - Bitcoin: $12,000 (26.7%)
  6. Success confirmation with "Done!" message

**Vault Discovery**:
- Browse available vaults across chains
- Filter by chain, category, APY
- View detailed vault information
- Deposit/withdraw functionality

---

### 4. Insights & AI Recommendations Flow
**Entry Point**: `/protected/insights`

**AI Insights Card**:
- Projected Annual Yield: +$3,200
- Based on current allocations

**ElizaOS Treasury Copilot**:
- Strategy recommendations
- Risk assessment
- Market signals
- **Reason Box** (expandable):
  - Spending trendline: "You spend 62% of monthly income"
  - Savings rate: "Monthly savings rate: 38% (above 30% target)"
  - Idle capital: "$45,000 idle USDC detected (15% of portfolio)"
  - Risk exposure: "Portfolio risk level: Moderate (45% volatility)"
  - Yield efficiency: "Current yield: 8.5% APY, potential: 12.8% APY"

**Recommendations**:
- "Reduce idle USDC by 10% to improve liquidity"
- "Increase Sei Network allocation by 5% for higher yield potential"

**Badges**:
- "Powered by Sei Intelligence Layer"
- ElizaOS Badge

---

### 5. Assets Management Flow
**Entry Point**: `/protected/assets`

**Features**:
- **Asset Overview**:
  - Total Value: $46,000
  - Active Assets: 6
  - Average APY: 9.8%
  - Sei Network Assets: 6

- **Asset Types**:
  - Tokens (SEI, BTC, ETH)
  - Stablecoins (USDC, USDT)
  - Vaults (Sei Yield Vault)
  - Staking positions

- **Actions**:
  - Search and filter assets
  - View detailed asset information
  - Track performance
  - Add new assets

---

### 6. Vaults Flow
**Entry Point**: `/protected/vaults`

**Sei Network Vaults**:
- **Sei High Yield Pool**: 12.8% APY, $1.2M TVL, Medium Risk
- **Sei Stablecoin Vault**: 9.5% APY, $800K TVL, Low Risk

**Features**:
- Vault statistics
- Deposit/withdraw functionality
- Performance tracking
- Risk assessment

---

### 7. Analytics Flow
**Entry Point**: `/protected/analytics`

**Metrics Displayed**:
- Total Value Locked: $4.5M (+12.5% 30d)
- Active Users: 1,500 (+25% 30d)
- Transaction Volume: $500K (+15% 30d)
- Average APY: 8.5% (+0.5% 30d)

**Charts**:
- TVL Growth (Area Chart)
- Asset Distribution (Pie Chart)
- User Growth (Line Chart)
- Transaction Volume (Bar Chart)

---

## Wallet Integration

### Transaction Flow
1. **User Action**: Click any action button (Activate, Withdraw, Deposit, etc.)
2. **Wallet Modal**: 
   - Shows transaction details
   - Network: Sei Network
   - Gas Fee: ~0.001 SEI
   - Transaction type clearly displayed
3. **Confirmation**: 
   - User confirms in wallet (MetaMask, WalletConnect, etc.)
   - Real transaction hash generated
   - Processing state with progress indicator
4. **Success**: 
   - Transaction confirmed
   - UI updates with new state
   - Success message displayed

### Supported Wallets
- MetaMask
- WalletConnect
- Coinbase Wallet
- Any EIP-1193 compatible wallet

---

## Design System

### Sei Branding
- **Primary Color**: Purple (#8B5CF6)
- **Secondary Color**: Indigo (#6366F1)
- **Gradients**: Purple to Indigo gradients throughout
- **Badges**: "Powered by Sei Intelligence Layer"

### UI Components
- **Cards**: Elevated surfaces with subtle shadows
- **Charts**: Recharts with Sei brand colors
- **Buttons**: Gradient effects on primary actions
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first design

---

## Key Features

### AI-Powered
- Capital optimization recommendations
- Yield strategy suggestions
- Risk assessment
- Spending analysis
- Idle capital detection

### Sei Network Integration
- Native Sei token support
- Sei vaults and strategies
- Sei Network transaction history
- Sei-specific analytics

### Real-time Updates
- Portfolio value tracking
- Yield calculations
- Transaction confirmations
- Performance metrics

---

## Mock Data & Simulation

### Portfolio Data
- Total Value: $30,000
- Tokens: SEI, USDC, USDT, BTC, ETH
- Current prices updated to market rates

### Transaction Simulation
- Wallet popups for all transactions
- Mock transaction hashes
- Progress indicators
- Success/failure states

### Performance Metrics
- Historical data (6-12 months)
- Projected yields
- APY calculations
- Risk assessments

---

## Navigation Structure

```
Dashboard → Overview & Quick Actions
├── Portfolio → Strategy Cards & Token Holdings
├── Discover → Vault Discovery & Capital Optimization
├── Insights → AI Recommendations & Analysis
├── Assets → Asset Management
├── Vaults → Yield Strategies
├── Analytics → Platform Metrics
└── Settings → User Preferences
```

---

## User Experience Highlights

1. **Clean, Modern UI**: World-class DeFi interface
2. **Sei Network Focus**: Prominent Sei branding throughout
3. **AI Integration**: Intelligent recommendations and insights
4. **Real-time Updates**: Live portfolio and yield tracking
5. **Smooth Animations**: Polished interactions
6. **Responsive Design**: Works on all devices
7. **Wallet Integration**: Seamless transaction flows
8. **Comprehensive Analytics**: Detailed metrics and charts

---

## Technical Stack

- **Framework**: Next.js 15
- **UI**: React, Tailwind CSS, shadcn/ui
- **Charts**: Recharts
- **Wallet**: Wagmi, Web3Modal
- **Animations**: Framer Motion
- **Network**: Sei Network (Testnet)

---

## Future Enhancements

- [ ] Real-time price feeds
- [ ] Multi-chain support
- [ ] Advanced analytics
- [ ] Social features
- [ ] Mobile app
- [ ] Staking rewards
- [ ] Governance participation


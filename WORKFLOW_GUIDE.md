# UniLedger Development Workflow Guide

This guide explains the complete development workflow for UniLedger, from initial setup through production deployment.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Development Setup](#development-setup)
3. [Smart Contract Workflow](#smart-contract-workflow)
4. [Frontend Workflow](#frontend-workflow)
5. [Testing Workflow](#testing-workflow)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Deployment Workflow](#deployment-workflow)
8. [Common Development Tasks](#common-development-tasks)

---

## Project Overview

**UniLedger** is a decentralized campus event and finance management platform built on Algorand blockchain. The repository consists of:

- **Smart Contracts** (Python/AlgoKit): Backend blockchain logic
- **Frontend** (React/TypeScript/Vite): User interface
- **CI/CD** (GitHub Actions): Automated testing and deployment

### Architecture Flow

```
User (Browser)
    ↓
React Frontend (src/components/)
    ↓
Wallet Connection (@txnlab/use-wallet)
    ↓
Contract Clients (src/contracts/)
    ↓
Algorand Blockchain
    ↓
Smart Contracts (Counter, Bank)
```

---

## Development Setup

### Prerequisites

1. **Python 3.12+** - For smart contract development
2. **Node.js 18+** - For frontend development
3. **pnpm** - Package manager (or npm)
4. **AlgoKit CLI** - Algorand development toolkit
5. **Poetry** - Python dependency management
6. **Git** - Version control

### Initial Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/knokvik/uniledger.git
cd uniledger

# 2. Install AlgoKit (if not already installed)
pipx install algokit

# 3. Bootstrap all projects
algokit project bootstrap all

# This command does the following:
#   - Installs Python dependencies via Poetry (for contracts)
#   - Installs Node.js dependencies via pnpm (for frontend)
#   - Generates contract client files
#   - Sets up development environment
```

### Environment Configuration

Create `.env` files in both projects:

**For Contracts** (`projects/contracts/.env`):
```bash
# Deployer account mnemonic (25-word phrase)
DEPLOYER_MNEMONIC="your mnemonic here..."

# Network configuration
ALGOD_TOKEN="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
ALGOD_SERVER="http://localhost"
ALGOD_PORT="4001"
```

**For Frontend** (`projects/frontend/.env`):
```bash
# Algorand node configuration
VITE_ALGOD_TOKEN="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
VITE_ALGOD_SERVER="http://localhost"
VITE_ALGOD_PORT="4001"
VITE_ALGOD_NETWORK="localnet"

# Indexer configuration
VITE_INDEXER_SERVER="http://localhost"
VITE_INDEXER_PORT="8980"
VITE_INDEXER_TOKEN="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

# Contract IDs (updated after deployment)
VITE_COUNTER_APP_ID="123456"
VITE_BANK_APP_ID="123457"

# Pinata (IPFS) for NFT metadata
VITE_PINATA_JWT="your_pinata_jwt_here"
```

---

## Smart Contract Workflow

### Directory Structure
```
projects/contracts/
├── smart_contracts/
│   ├── counter/contract.py      # Counter contract logic
│   ├── bank/contract.py         # Bank contract logic
│   └── artifacts/               # Compiled outputs
├── tests/                       # Test files
├── pyproject.toml              # Dependencies
└── .algokit.toml               # AlgoKit config
```

### Development Cycle

#### 1. Write Smart Contract

**Example: Extending the Bank Contract**

```python
# In projects/contracts/smart_contracts/bank/contract.py

from algopy import ARC4Contract, UInt64, BoxMap, gtxn, Txn, itxn, arc4

class Bank(ARC4Contract):
    def __init__(self) -> None:
        self.deposits = BoxMap(arc4.Address, UInt64, key_prefix="d")
        self.total_deposit = UInt64(0)
    
    @arc4.abimethod
    def deposit(self, memo: arc4.String, pay_txn: gtxn.PaymentTransaction) -> None:
        # Validation
        assert pay_txn.receiver == Txn.current_application_address
        assert pay_txn.amount > 0
        
        # Update state
        self.deposits[Txn.sender] = self.deposits.get(Txn.sender, default=UInt64(0)) + pay_txn.amount
        self.total_deposit += pay_txn.amount
    
    @arc4.abimethod
    def withdraw(self, amount: UInt64) -> None:
        # Validation
        assert amount > 0
        assert Txn.sender in self.deposits
        assert self.deposits[Txn.sender] >= amount
        
        # Update state
        self.deposits[Txn.sender] -= amount
        self.total_deposit -= amount
        
        # Send funds via inner transaction
        itxn.Payment(
            receiver=Txn.sender,
            amount=amount,
        ).submit()
```

#### 2. Write Tests

```python
# In projects/contracts/tests/bank_test.py

import pytest
import algokit_utils
from algopy_testing import AlgopyTestContext, algopy_testing_context

def test_deposit():
    # Setup
    context = AlgopyTestContext()
    bank = Bank()
    
    # Execute deposit
    amount = 1_000_000  # 1 ALGO
    with algopy_testing_context() as ctx:
        ctx.gtxn.payment(amount=amount)
        bank.deposit(memo="Test deposit")
    
    # Verify
    assert bank.deposits[ctx.sender] == amount
    assert bank.total_deposit == amount

def test_withdraw():
    # Setup and deposit first
    # ... deposit logic ...
    
    # Execute withdrawal
    withdraw_amount = 500_000
    bank.withdraw(withdraw_amount)
    
    # Verify
    assert bank.deposits[ctx.sender] == amount - withdraw_amount
```

#### 3. Run Tests Locally

```bash
cd projects/contracts

# Run all tests
algokit project run test

# Or use pytest directly
poetry run pytest tests/ -v

# Run with coverage
poetry run pytest tests/ --cov=smart_contracts --cov-report=term-missing
```

#### 4. Lint and Format

```bash
# Check code quality
algokit project run lint

# Or use tools directly
poetry run ruff check smart_contracts/
poetry run black smart_contracts/ --check
poetry run mypy smart_contracts/
```

#### 5. Build Contracts

```bash
# Compile Python to TEAL
algokit project run build

# This creates files in smart_contracts/artifacts/:
#   - Bank/Bank.approval.teal  (approval program)
#   - Bank/Bank.clear.teal     (clear program)
#   - Bank/Bank.arc56.json     (ABI specification)
```

#### 6. Deploy to LocalNet

```bash
# Start local Algorand network
algokit localnet start

# Deploy contracts
algokit project deploy localnet

# This runs projects/contracts/smart_contracts/*/deploy_config.py
# and outputs deployed app IDs
```

#### 7. Test Deployed Contracts

```bash
# Interact with deployed contract
algokit goal app call --app-id 1234 --method "deposit" --arg "Test memo" --from DEPLOYER

# Check contract state
algokit goal app read --app-id 1234 --global
```

---

## Frontend Workflow

### Directory Structure
```
projects/frontend/
├── src/
│   ├── components/          # React components
│   ├── contracts/           # Auto-generated clients
│   ├── utils/              # Helper functions
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── public/                 # Static files
├── package.json            # Dependencies
└── vite.config.ts         # Build config
```

### Development Cycle

#### 1. Generate Contract Clients

After deploying or updating contracts:

```bash
cd projects/frontend

# Generate TypeScript clients from contract artifacts
pnpm run generate:app-clients

# Or use AlgoKit
algokit project link --all

# This creates/updates files in src/contracts/:
#   - Counter.ts  (Counter contract client)
#   - Bank.ts     (Bank contract client)
```

#### 2. Start Development Server

```bash
# Start Vite dev server (with hot reload)
pnpm run dev

# Opens http://localhost:5173
# Changes auto-reload in browser
```

#### 3. Develop React Components

**Example: Creating a new component**

```typescript
// src/components/EventManager.tsx

import { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'

export function EventManager() {
  const { activeAddress, signTransactions, sendTransactions } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const [eventName, setEventName] = useState('')

  const createEvent = async () => {
    try {
      if (!activeAddress) {
        throw new Error('Please connect wallet first')
      }

      // Create transaction (example)
      const txn = // ... transaction creation logic
      
      // Sign and send
      const signedTxn = await signTransactions([txn])
      const result = await sendTransactions(signedTxn)
      
      enqueueSnackbar('Event created successfully!', { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(`Error: ${error.message}`, { variant: 'error' })
    }
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Create Event</h2>
        <input
          type="text"
          placeholder="Event name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          className="input input-bordered"
        />
        <button onClick={createEvent} className="btn btn-primary">
          Create
        </button>
      </div>
    </div>
  )
}
```

#### 4. Integrate with Smart Contracts

```typescript
// Example: Using the Bank contract client

import { BankClient } from './contracts/Bank'
import { useWallet } from '@txnlab/use-wallet-react'
import algosdk from 'algosdk'

export function BankInteraction() {
  const { activeAddress, signer } = useWallet()
  
  const deposit = async (amount: number) => {
    // Setup Algorand client
    const algodClient = new algosdk.Algodv2(
      process.env.VITE_ALGOD_TOKEN!,
      process.env.VITE_ALGOD_SERVER!,
      process.env.VITE_ALGOD_PORT!
    )
    
    // Create bank client
    const bankClient = new BankClient(
      {
        sender: { addr: activeAddress!, signer },
        resolveBy: 'id',
        id: Number(process.env.VITE_BANK_APP_ID!)
      },
      algodClient
    )
    
    // Create payment transaction
    const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: activeAddress!,
      to: (await bankClient.appClient.getAppReference()).appAddress,
      amount: amount,
      suggestedParams: await algodClient.getTransactionParams().do()
    })
    
    // Call deposit method
    const result = await bankClient.deposit(
      { memo: 'Deposit from UI', payTxn },
      { sendParams: { fee: algosdk.microAlgos(2000) } }
    )
    
    console.log('Deposit successful:', result.txId)
  }
  
  // ... component JSX
}
```

#### 5. Run Tests

```bash
# Unit tests with Jest
pnpm run test

# E2E tests with Playwright
pnpm run playwright:test
```

#### 6. Lint and Format

```bash
# Check code quality
pnpm run lint

# Auto-fix issues
pnpm run lint:fix

# Format with Prettier
pnpm run format
```

#### 7. Build for Production

```bash
# Create optimized production bundle
pnpm run build

# Output in dist/ directory
# Includes minified JS, CSS, and assets

# Preview production build locally
pnpm run preview
```

---

## Testing Workflow

### Smart Contract Testing

**Test Pyramid:**
1. **Unit Tests** - Test individual contract methods
2. **Integration Tests** - Test contract interactions with blockchain
3. **Security Tests** - Test for vulnerabilities

```bash
# Run all contract tests
cd projects/contracts
algokit project run test

# Run specific test file
poetry run pytest tests/bank_test.py -v

# Run with coverage report
poetry run pytest --cov=smart_contracts --cov-report=html
```

### Frontend Testing

**Test Types:**
1. **Unit Tests** (Jest) - Test component logic
2. **Integration Tests** (Jest) - Test component interactions
3. **E2E Tests** (Playwright) - Test full user flows

```bash
cd projects/frontend

# Unit/Integration tests
pnpm run test

# Watch mode (re-run on changes)
pnpm run test -- --watch

# E2E tests
pnpm run playwright:test

# E2E with UI
pnpm run playwright:test --ui
```

### Manual Testing on LocalNet

```bash
# 1. Start LocalNet
algokit localnet start

# 2. Deploy contracts
cd projects/contracts
algokit project deploy localnet

# 3. Start frontend with LocalNet config
cd projects/frontend
pnpm run dev

# 4. Connect wallet in browser (use KMD for LocalNet)

# 5. Test features manually through UI

# 6. Reset LocalNet if needed
algokit localnet reset
```

---

## CI/CD Pipeline

### Continuous Integration (CI)

**Triggered on:** Every pull request

#### Contract CI Pipeline (`onchain-counter-contracts-ci.yaml`)

```
1. Checkout code
2. Install Python 3.12 + Poetry
3. Install AlgoKit
4. Start LocalNet
5. Bootstrap dependencies
6. Audit dependencies (pip-audit for security)
7. Lint code (ruff, black, mypy)
8. Run pytest suite
9. Build contracts (compile to TEAL)
10. Audit TEAL (security checks)
11. Deploy to LocalNet (integration test)
```

**Status checks must pass before merge.**

#### Frontend CI Pipeline (`onchain-counter-frontend-ci.yaml`)

```
1. Checkout code
2. Setup Node.js 18
3. Install AlgoKit + Python (for client generation)
4. Bootstrap dependencies (pnpm install)
5. Run ESLint
6. Run Jest tests
7. Build production bundle
```

**Status checks must pass before merge.**

### Continuous Deployment (CD)

#### To TestNet (Manual Trigger)

```bash
# Manually trigger CD workflow
gh workflow run onchain-counter-contracts-cd.yaml \
  --field network=testnet \
  --field version=v1.0.0

# Pipeline:
# 1. Build contracts
# 2. Deploy to TestNet
# 3. Update contract IDs in config
# 4. Generate clients
# 5. Deploy frontend with TestNet config
```

#### To MainNet (Release Tag)

```bash
# Create release tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# This triggers:
# 1. Contract deployment to MainNet
# 2. Frontend build with MainNet config
# 3. Deployment to production hosting
# 4. GitHub release creation
```

---

## Deployment Workflow

### LocalNet (Development)

```bash
# 1. Start LocalNet
algokit localnet start

# 2. Deploy contracts
cd projects/contracts
algokit project deploy localnet

# 3. Note deployed app IDs from output
# Example output:
# ✅ Counter deployed: App ID 1001
# ✅ Bank deployed: App ID 1002

# 4. Update frontend .env
cd ../frontend
echo "VITE_COUNTER_APP_ID=1001" >> .env
echo "VITE_BANK_APP_ID=1002" >> .env

# 5. Generate clients
pnpm run generate:app-clients

# 6. Start frontend
pnpm run dev
```

### TestNet (Staging)

```bash
# 1. Fund deployer account on TestNet
# Get ALGO from dispenser: https://bank.testnet.algorand.network/

# 2. Update .env with TestNet config
cd projects/contracts
cat > .env << EOF
DEPLOYER_MNEMONIC="your 25 word mnemonic"
ALGOD_TOKEN=""
ALGOD_SERVER="https://testnet-api.algonode.cloud"
ALGOD_PORT=""
EOF

# 3. Deploy contracts
algokit project deploy testnet

# 4. Update frontend .env with TestNet config and app IDs

# 5. Build and deploy frontend
cd ../frontend
pnpm run build
# Deploy dist/ to hosting (Vercel, Netlify, etc.)
```

### MainNet (Production)

**⚠️ Use extreme caution - real money involved!**

```bash
# 1. Final security audit
cd projects/contracts
algokit project run audit-teal

# 2. Comprehensive testing on TestNet

# 3. Fund deployer account on MainNet (sufficient ALGO)

# 4. Update .env for MainNet
ALGOD_SERVER="https://mainnet-api.algonode.cloud"

# 5. Deploy contracts (PERMANENT!)
algokit project deploy mainnet

# 6. Verify deployment on AlgoExplorer
# https://algoexplorer.io/application/[APP_ID]

# 7. Update frontend with MainNet config

# 8. Deploy frontend to production
```

---

## Common Development Tasks

### Adding a New Smart Contract

```bash
# 1. Create contract directory
cd projects/contracts/smart_contracts
mkdir my_contract

# 2. Create contract file
cat > my_contract/contract.py << EOF
from algopy import ARC4Contract, arc4

class MyContract(ARC4Contract):
    @arc4.abimethod
    def my_method(self) -> arc4.String:
        return arc4.String("Hello!")
EOF

# 3. Create deploy config
cat > my_contract/deploy_config.py << EOF
import logging
from algopy import Account
from algokit_utils import get_account

logger = logging.getLogger(__name__)

def deploy(algod_client, deployer: Account):
    # Deployment logic
    pass
EOF

# 4. Write tests
cat > tests/my_contract_test.py << EOF
def test_my_method():
    # Test logic
    pass
EOF

# 5. Build and test
algokit project run build
algokit project run test

# 6. Deploy
algokit project deploy localnet
```

### Adding a New Frontend Component

```bash
# 1. Create component file
cd projects/frontend/src/components
cat > MyComponent.tsx << EOF
import { useState } from 'react'

export function MyComponent() {
  const [state, setState] = useState('')
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  )
}
EOF

# 2. Add to Home.tsx
# Import and use <MyComponent />

# 3. Test
pnpm run dev
# Verify in browser

# 4. Add tests
cat > MyComponent.test.tsx << EOF
import { render } from '@testing-library/react'
import { MyComponent } from './MyComponent'

test('renders correctly', () => {
  const { getByText } = render(<MyComponent />)
  // Assertions
})
EOF

# 5. Run tests
pnpm run test
```

### Updating Dependencies

```bash
# Smart Contracts
cd projects/contracts
poetry update
poetry lock

# Frontend
cd projects/frontend
pnpm update
pnpm install
```

### Debugging

**Smart Contracts:**
```bash
# Enable debug logging
export ALGOD_DEBUG=true

# Use algokit goal for direct interaction
algokit goal app info --app-id 1234

# Check contract state
algokit goal app read --app-id 1234 --global
algokit goal app read --app-id 1234 --local --from ADDRESS
```

**Frontend:**
```bash
# Browser DevTools Console
# React DevTools Extension
# Network tab for transaction inspection

# Enable verbose logging
localStorage.setItem('debug', '*')
```

### Resetting Local Environment

```bash
# Reset LocalNet (clears all data)
algokit localnet reset

# Clean contract artifacts
cd projects/contracts
rm -rf smart_contracts/artifacts/

# Clean frontend build
cd projects/frontend
rm -rf dist/ node_modules/
pnpm install

# Rebuild everything
algokit project bootstrap all
```

---

## Best Practices

### Smart Contracts
- ✅ Always validate inputs with assertions
- ✅ Use Box storage for scalable state
- ✅ Test on LocalNet before TestNet
- ✅ Audit TEAL before MainNet deployment
- ✅ Version control contract artifacts

### Frontend
- ✅ Use TypeScript for type safety
- ✅ Handle wallet connection errors gracefully
- ✅ Show loading states during transactions
- ✅ Validate user inputs before signing
- ✅ Test across different wallets

### General
- ✅ Keep .env files out of version control
- ✅ Use meaningful commit messages
- ✅ Write tests for new features
- ✅ Update documentation
- ✅ Code review before merging

---

## Troubleshooting

### Common Issues

**"LocalNet not running"**
```bash
algokit localnet start
# Wait 10-15 seconds for startup
algokit localnet status
```

**"Transaction failed: fee too small"**
```bash
# Increase fee in transaction
sendParams: { fee: algosdk.microAlgos(2000) }
```

**"Application does not exist"**
```bash
# Verify app ID in .env matches deployed contract
algokit goal app info --app-id YOUR_APP_ID
```

**"Cannot read property of undefined (wallet)"**
```bash
# Ensure wallet is connected before transactions
if (!activeAddress) {
  throw new Error('Connect wallet first')
}
```

---

## Workflow Summary Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Cycle                         │
└─────────────────────────────────────────────────────────────┘

Developer
    │
    ├─> Write Smart Contract (Python)
    │       │
    │       ├─> Write Tests (pytest)
    │       ├─> Lint/Format (ruff, black)
    │       ├─> Build (compile to TEAL)
    │       └─> Deploy to LocalNet
    │
    ├─> Generate Contract Clients (TypeScript)
    │
    ├─> Write Frontend Code (React/TS)
    │       │
    │       ├─> Write Tests (Jest/Playwright)
    │       ├─> Lint (ESLint)
    │       └─> Build (Vite)
    │
    ├─> Test Locally (LocalNet + Dev Server)
    │
    ├─> Commit & Push
    │       │
    │       └─> GitHub Actions CI
    │               ├─> Contract Tests
    │               ├─> Frontend Tests
    │               └─> Build Validation
    │
    └─> Merge PR
            │
            └─> GitHub Actions CD
                    ├─> Deploy Contracts (TestNet/MainNet)
                    └─> Deploy Frontend (Hosting Platform)

Production
```

---

## Additional Resources

- **AlgoKit Documentation:** https://developer.algorand.org/docs/get-started/algokit/
- **Algorand Developer Portal:** https://developer.algorand.org/
- **PyTeal Guide:** https://pyteal.readthedocs.io/
- **React Documentation:** https://react.dev/
- **Vite Documentation:** https://vitejs.dev/

---

**Happy Building! 🚀**

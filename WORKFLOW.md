# UniLedger Repository Workflow & File Significance

## Table of Contents
1. [Repository Overview](#repository-overview)
2. [Architecture](#architecture)
3. [Root Directory Files](#root-directory-files)
4. [Smart Contracts (`projects/contracts`)](#smart-contracts-projectscontracts)
5. [Frontend Application (`projects/frontend`)](#frontend-application-projectsfrontend)
6. [Development Workflow](#development-workflow)
7. [Build & Deployment](#build--deployment)
8. [Testing Strategy](#testing-strategy)

---

## Repository Overview

**UniLedger** is a decentralized campus event and finance management platform built on the Algorand blockchain. It provides a unified solution for Indian colleges and universities to manage:
- Event creation and ticketing
- Secure blockchain-based check-ins
- Transparent payments and fund management
- Volunteer coordination
- Club treasuries and expense tracking

**Tech Stack:**
- **Blockchain:** Algorand (fast finality, low fees)
- **Smart Contracts:** Python + Algorand Python (formerly PyTeal)
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Wallet Integration:** Pera Wallet, Defly, Exodus, Lute
- **Build System:** AlgoKit (Algorand development framework)

---

## Architecture

The project follows a **monorepo structure** with two main sub-projects:

```
uniledger/
├── projects/
│   ├── contracts/       # Smart contracts (Python/AlgoPy)
│   └── frontend/        # React web application
├── .github/workflows/   # CI/CD pipelines
└── [root config files]  # AlgoKit, Git, IDE settings
```

**Workflow:** Smart contracts are developed and tested independently, then compiled. The frontend automatically generates TypeScript clients from compiled contracts to interact with them.

---

## Root Directory Files

### Configuration Files

#### `.algokit.toml`
**Significance:** Main AlgoKit configuration file that defines the monorepo structure.
- **Purpose:** Tells AlgoKit this is a workspace project with multiple sub-projects
- **Key Settings:**
  - `type = 'workspace'` - enables monorepo management
  - `projects_root_path = 'projects'` - where sub-projects live
  - `project.run.build` - defines build order for sub-projects

#### `.gitignore`
**Significance:** Controls which files are excluded from version control.
- Ignores Python build artifacts (`__pycache__`, `*.pyc`)
- Ignores dependencies (`node_modules`, `.venv`)
- Ignores environment files (`.env`, contains secrets)
- Ignores IDE settings (`.idea`, VSCode workspace files)
- Ignores test artifacts (`coverage.xml`, `.pytest_cache`)

#### `.gitattributes`
**Significance:** Git configuration for how files are handled.
- Normalizes line endings across platforms
- Ensures consistent behavior across Windows/Mac/Linux

#### `.editorconfig`
**Significance:** Standardizes code formatting across different editors/IDEs.
- **Key Settings:**
  - `indent_style = space`, `indent_size = 2` - use 2 spaces for indentation
  - `charset = utf-8` - consistent character encoding
  - `end_of_line = lf` - Unix-style line endings
  - `trim_trailing_whitespace = true` - keeps code clean

### Documentation Files

#### `README.md`
**Significance:** Main project documentation and landing page.
- **Content:**
  - Project overview and problem statement
  - Key features (ticketing, payments, volunteer management)
  - Tech stack explanation
  - Cost efficiency details (Algorand transaction fees)
- **Audience:** New developers, potential contributors, stakeholders

#### `Alokit_setup.md` 
> **Note:** This file appears to have a typo in its name - it should likely be `AlgoKit_setup.md` to match the official "AlgoKit" branding. The content refers to AlgoKit setup.

**Significance:** Setup and installation guide for developers.
- **Content:**
  - Initial setup instructions (Docker, AlgoKit installation)
  - Bootstrap commands (`algokit project bootstrap all`)
  - Environment configuration
  - Build instructions
  - CI/CD pipeline explanation
- **Audience:** Developers setting up local development environment

### Workspace Files

#### `OnChain-Counter.code-workspace`
**Significance:** VS Code workspace configuration.
- Provides a unified multi-project view in VS Code
- Configures IDE settings for the entire monorepo
- Enables integrated debugging and testing

---

## Smart Contracts (`projects/contracts`)

### Directory Structure
```
projects/contracts/
├── smart_contracts/          # Contract source code
│   ├── counter/              # Example counter contract
│   │   ├── contract.py       # Counter logic
│   │   └── deploy_config.py  # Deployment settings
│   ├── bank/                 # Bank/escrow contract
│   │   ├── contract.py       # Bank logic
│   │   └── deploy_config.py  # Deployment settings
│   ├── artifacts/            # Compiled contracts (auto-generated)
│   ├── __init__.py
│   └── __main__.py           # Entry point for contract compilation
├── tests/                    # Contract tests
├── pyproject.toml            # Python project configuration
├── poetry.lock               # Locked dependencies
└── README.md                 # Contracts-specific documentation
```

### Key Files

#### `pyproject.toml`
**Significance:** Python project configuration using Poetry package manager.
- **Dependencies:**
  - `algorand-python ^2.0.0` - Algorand smart contract SDK
  - `algokit-utils ^4.0.0` - Utility library for Algorand development
  - `python-dotenv ^1.0.0` - Environment variable management
- **Dev Dependencies:**
  - `pytest` - Testing framework
  - `black` - Code formatter
  - `ruff` - Fast Python linter
  - `mypy` - Static type checker
- **Tool Configurations:**
  - Ruff: Line length 120, various linting rules
  - MyPy: Strict type checking enabled
  - Pytest: Test discovery paths

#### `poetry.lock`
**Significance:** Lock file ensuring reproducible dependency installation.
- Contains exact versions of all transitive dependencies
- Ensures everyone on the team uses identical package versions

#### `smart_contracts/counter/contract.py`
**Significance:** Example smart contract demonstrating basic state management.
```python
class Counter(ARC4Contract):
    count: UInt64  # Global state variable
    
    @abimethod()
    def incr_counter(self) -> UInt64:
        # Increments and returns counter value
```
- **Purpose:** Teaching example showing ARC4 contract structure
- **Features:**
  - State storage (global state)
  - ABI methods (callable from frontend)
  - Type-safe programming with AlgoPy

#### `smart_contracts/bank/contract.py`
**Significance:** Core banking/escrow contract for fund management.
```python
class Bank(ARC4Contract):
    total_deposit: UInt64
    deposits: BoxMap[Account, UInt64]  # User balances
    
    @abimethod()
    def deposit(self, memo: String, pay_txn: gtxn.PaymentTransaction) -> UInt64:
        # Accepts payments into escrow
    
    @abimethod()
    def withdraw(self, amount: UInt64) -> UInt64:
        # Returns funds to user
```
- **Purpose:** Manages event funds, donations, and escrow
- **Features:**
  - Box storage for user balances (scales to many users)
  - Atomic payment handling
  - Inner transactions for withdrawals
  - Balance tracking per account
- **Security:**
  - Validates payment receivers
  - Checks sufficient balance before withdrawals
  - Uses assertions to prevent invalid states

#### `smart_contracts/deploy_config.py`
**Significance:** Deployment configuration for each contract.
- Defines deployment parameters
- Sets initial contract state
- Specifies on-creation arguments

#### `smart_contracts/__main__.py`
**Significance:** CLI entry point for contract operations.
- Compiles contracts using PuyaPy compiler
- Generates TEAL code and ABI JSON
- Creates TypeScript client stubs
- Can be run via `python -m smart_contracts`

#### `tests/counter_test.py` & `tests/counter_client_test.py`
**Significance:** Contract test suites.
- **counter_test.py:** Unit tests using AlgoPy testing framework
- **counter_client_test.py:** Integration tests using generated client
- **Purpose:** Validate contract logic before deployment
- **Coverage:** State changes, edge cases, error conditions

#### `tests/conftest.py`
**Significance:** Pytest configuration and shared fixtures.
- Sets up test environment
- Provides reusable test utilities
- Configures Algorand sandbox connection

---

## Frontend Application (`projects/frontend`)

### Directory Structure
```
projects/frontend/
├── src/
│   ├── components/           # React components
│   │   ├── AppCalls.tsx      # Smart contract interactions
│   │   ├── Bank.tsx          # Bank contract UI
│   │   ├── ConnectWallet.tsx # Wallet connection modal
│   │   ├── SendAlgo.tsx      # ALGO transfer UI
│   │   ├── MintNFT.tsx       # NFT minting UI
│   │   ├── CreateASA.tsx     # Asset creation UI
│   │   └── AssetOptIn.tsx    # Asset opt-in UI
│   ├── contracts/            # Auto-generated TS clients
│   │   ├── Counter.ts        # Counter contract client
│   │   └── Bank.ts           # Bank contract client
│   ├── utils/                # Utility functions
│   │   ├── network/          # Algorand network configs
│   │   ├── ellipseAddress.ts # Address formatting
│   │   └── pinata.ts         # IPFS integration
│   ├── interfaces/           # TypeScript interfaces
│   ├── assets/               # Images, icons
│   ├── styles/               # CSS/styling
│   ├── App.tsx               # Root component
│   ├── Home.tsx              # Main page
│   └── main.tsx              # Entry point
├── public/                   # Static assets
├── tests/                    # E2E tests (Playwright)
├── package.json              # Node.js project config
├── vite.config.ts            # Vite bundler config
├── tsconfig.json             # TypeScript config
├── tailwind.config.cjs       # Tailwind CSS config
└── README.md                 # Frontend documentation
```

### Key Files

#### `package.json`
**Significance:** Node.js project configuration and dependencies.
- **Scripts:**
  - `generate:app-clients` - Generates TS clients from contracts
  - `dev` - Starts development server (Vite)
  - `build` - Production build
  - `test` - Runs Jest unit tests
  - `playwright:test` - Runs E2E tests
  - `lint` - Code quality checks with ESLint
- **Dependencies:**
  - `@algorandfoundation/algokit-utils` - Algorand SDK
  - `algosdk ^3.0.0` - Algorand JavaScript SDK
  - `@txnlab/use-wallet-react` - Multi-wallet support
  - `@perawallet/connect` - Pera Wallet integration
  - `react ^18.2.0` - UI framework
  - `daisyui ^4.0.0` - UI component library
  - `notistack ^3.0.1` - Toast notifications
- **Dev Dependencies:**
  - `vite ^5.0.0` - Fast build tool
  - `typescript ^5.1.6` - Type safety
  - `@playwright/test` - E2E testing
  - `tailwindcss` - Utility-first CSS

#### `vite.config.ts`
**Significance:** Vite bundler configuration.
- Configures React plugin
- Sets up node polyfills for blockchain libraries
- Defines build output directory
- Configures dev server port

#### `tsconfig.json`
**Significance:** TypeScript compiler configuration.
- **Key Settings:**
  - `strict: true` - Maximum type safety
  - `target: ES2020` - Modern JavaScript features
  - `module: ESNext` - ES modules
  - Path aliases for cleaner imports
- **Purpose:** Catches bugs at compile time, enables IDE features

#### `tailwind.config.cjs`
**Significance:** Tailwind CSS configuration.
- Defines custom theme colors
- Configures DaisyUI plugin
- Sets up content paths for tree-shaking
- **Purpose:** Utility-first styling system

#### `src/App.tsx`
**Significance:** Root React component and wallet provider setup.
- **Purpose:**
  - Initializes wallet manager with supported wallets
  - Configures network (localnet/testnet/mainnet)
  - Sets up notification provider
  - Wraps app with context providers
- **Wallet Support:**
  - **Localnet:** KMD (Key Management Daemon)
  - **TestNet/MainNet:** Pera, Defly, Exodus, Lute wallets

#### `src/Home.tsx`
**Significance:** Main application page with component orchestration.
- **Features:**
  - Wallet connection UI
  - Modal management for different operations
  - Component routing
  - Responsive layout
- **Components Integrated:**
  - `ConnectWallet` - Wallet selection
  - `AppCalls` - Counter contract demo
  - `Bank` - Banking operations
  - `SendAlgo` - Payment transactions
  - `MintNFT` - NFT creation
  - `CreateASA` - Token creation
  - `AssetOptIn` - Asset registration

#### `src/components/AppCalls.tsx`
**Significance:** Demonstrates smart contract interaction pattern.
- Shows how to call contract methods
- Handles transaction signing with wallet
- Displays contract state
- Error handling and user feedback
- **Pattern Used:** Can be replicated for other contracts

#### `src/components/Bank.tsx`
**Significance:** UI for bank contract interactions.
- Deposit funds into escrow
- Withdraw funds from escrow
- Display user balance
- Atomic transaction composition
- **Use Case:** Template for UniLedger payment features

#### `src/components/ConnectWallet.tsx`
**Significance:** Wallet connection modal.
- Lists available wallets
- Handles wallet connection/disconnection
- Shows connected account address
- Error handling for connection failures

#### `src/components/MintNFT.tsx`
**Significance:** NFT minting functionality.
- Creates unique NFTs on Algorand
- IPFS integration for metadata
- Asset configuration (decimals, clawback, freeze)
- **Relevance:** Will be used for VIP tickets and reward badges

#### `src/components/CreateASA.tsx`
**Significance:** Fungible token (ASA) creation.
- Creates Algorand Standard Assets
- Configurable supply, decimals, unit name
- Manager, freeze, clawback addresses
- **Relevance:** Used for event tickets and club tokens

#### `src/components/AssetOptIn.tsx`
**Significance:** Asset opt-in transaction handler.
- Required before receiving any ASA/NFT on Algorand
- 0 ALGO self-transfer to activate asset slot
- **Critical:** Users must opt-in before buying tickets

#### `src/contracts/Counter.ts` & `src/contracts/Bank.ts`
**Significance:** Auto-generated TypeScript clients.
- **Generated By:** `algokit generate client` from compiled contracts
- **Purpose:** Type-safe contract interaction from frontend
- **Features:**
  - Method signatures matching contract ABIs
  - Automatic transaction composition
  - Parameter validation
  - Return type mapping
- **Workflow:** Never edit manually - regenerated on contract changes

#### `src/utils/network/getAlgoClientConfigs.ts`
**Significance:** Network configuration loader.
- Reads environment variables for network settings
- Supports localnet (Docker sandbox) and TestNet/MainNet
- Provides algod and indexer configurations
- **Environment Variables:**
  - `VITE_ALGOD_SERVER` - Algorand node URL
  - `VITE_ALGOD_PORT` - Node port
  - `VITE_ALGOD_TOKEN` - API token
  - `VITE_ALGOD_NETWORK` - Network identifier

#### `src/utils/pinata.ts`
**Significance:** IPFS integration via Pinata service.
- Uploads event images, metadata to IPFS
- Returns permanent content hash (CID)
- Used for storing NFT metadata off-chain
- **Benefit:** Decentralized storage for event details

#### `.env.template`
**Significance:** Template for environment variables.
- Developers copy to `.env` and fill in values
- Documents required environment variables
- Never committed (excluded in `.gitignore`)
- **Contains:** API keys, network endpoints, feature flags

#### `playwright.config.ts`
**Significance:** End-to-end test configuration.
- Defines test browsers (Chromium, Firefox, WebKit)
- Sets base URL for tests
- Configures test timeout and retries
- Screenshots and video recording settings

---

## `.github/workflows` - CI/CD Pipelines

### Workflow Files

#### `validate.yaml`
**Significance:** Quick validation on all PRs and commits.
- **Triggers:** On every push and PR
- **Purpose:** Fast feedback loop
- **Checks:** Basic syntax and configuration validation

#### `onchain-counter-contracts-ci.yaml`
**Significance:** Smart contracts continuous integration.
- **Triggers:** On PR to main, changes in contracts directory
- **Steps:**
  1. Sets up Python environment
  2. Installs Poetry dependencies
  3. Runs `black` code formatting check
  4. Runs `ruff` linting
  5. Runs `mypy` type checking
  6. Runs `pytest` unit tests with coverage
  7. Runs `pip-audit` for security vulnerabilities
  8. Compiles contracts to TEAL
- **Purpose:** Ensures contract quality before merge

#### `onchain-counter-contracts-cd.yaml`
**Significance:** Smart contracts continuous deployment.
- **Triggers:** On push to main branch (after merge)
- **Steps:**
  1. Compiles contracts
  2. Deploys to Algorand TestNet using AlgoNode
  3. Stores deployment artifacts
- **Purpose:** Automatic deployment to test environment

#### `onchain-counter-frontend-ci.yaml`
**Significance:** Frontend continuous integration.
- **Triggers:** On PR to main, changes in frontend directory
- **Steps:**
  1. Sets up Node.js environment
  2. Installs npm dependencies
  3. Generates TypeScript contract clients
  4. Runs `eslint` linting
  5. Runs `jest` unit tests
  6. Builds production bundle with Vite
  7. Runs Playwright E2E tests
- **Purpose:** Ensures frontend quality and functionality

#### `onchain-counter-frontend-cd.yaml`
**Significance:** Frontend continuous deployment.
- **Triggers:** On push to main branch
- **Steps:**
  1. Builds production frontend
  2. Deploys to hosting platform (Vercel/Netlify)
- **Purpose:** Automatic deployment to production/staging

#### `multisig-implementation-ci.yaml` & `multisig-implementation-cd.yaml`
**Significance:** CI/CD for multi-signature wallet functionality.
- Similar structure to main contracts
- Handles deployment of multi-sig treasury contracts
- **Use Case:** Club treasuries requiring multiple approvals

#### `release.yaml`
**Significance:** Release automation workflow.
- **Triggers:** On version tags (e.g., `v1.0.0`)
- **Steps:**
  1. Builds release artifacts
  2. Creates GitHub release
  3. Uploads binaries/assets
  4. Updates changelog
- **Purpose:** Streamlined release process

---

## Development Workflow

### 1. Initial Setup
```bash
# Prerequisites: Docker, AlgoKit CLI
algokit project bootstrap all  # Install all dependencies
algokit localnet start          # Start local Algorand node
```

### 2. Smart Contract Development
```bash
cd projects/contracts

# Make changes to smart_contracts/*/contract.py
# Write tests in tests/

# Run tests
poetry run pytest

# Lint and format
poetry run black smart_contracts/
poetry run ruff check smart_contracts/
poetry run mypy smart_contracts/

# Compile contracts
algokit project run build
# Generates:
# - TEAL bytecode (artifacts/*.teal)
# - ABI JSON (artifacts/*.arc32.json)
# - TypeScript clients (copied to frontend)
```

### 3. Frontend Development
```bash
cd projects/frontend

# Regenerate clients if contracts changed
npm run generate:app-clients

# Start dev server
npm run dev  # Opens http://localhost:5173

# Make changes to src/**/*.tsx

# Test changes
npm run test           # Unit tests
npm run playwright:test  # E2E tests

# Lint
npm run lint:fix
```

### 4. Testing End-to-End Flow
```bash
# 1. Start local Algorand network
algokit localnet start

# 2. Deploy contracts to localnet
cd projects/contracts
algokit project deploy localnet

# 3. Start frontend with localnet config
cd projects/frontend
VITE_ALGOD_NETWORK=localnet npm run dev

# 4. Connect wallet (KMD with default accounts)
# 5. Test contract interactions in browser
```

### 5. Git Workflow
```bash
# Create feature branch
git checkout -b feature/add-ticketing

# Make changes...
git add .
git commit -m "feat: add ticketing contract"

# Push and create PR
git push origin feature/add-ticketing
# GitHub Actions run CI checks automatically

# After approval and merge to main:
# - CD workflows deploy to TestNet automatically
```

---

## Build & Deployment

### Build Process

#### Smart Contracts
```bash
algokit project run build
```
**What Happens:**
1. PuyaPy compiler translates AlgoPy → TEAL
2. Generates ABI JSON (contract interface)
3. Creates TypeScript client code
4. Outputs:
   - `artifacts/<contract>/approval.teal` - Contract logic
   - `artifacts/<contract>/clear.teal` - Clear state program
   - `artifacts/<contract>/<contract>.arc32.json` - ABI specification
   - `artifacts/<contract>/<contract>_client.py` - Python client

#### Frontend
```bash
npm run build
```
**What Happens:**
1. TypeScript compilation (type checking)
2. React JSX transformation
3. Vite bundling and tree-shaking
4. Tailwind CSS purging (removes unused styles)
5. Output: `dist/` directory with optimized assets
   - `dist/index.html` - Entry HTML
   - `dist/assets/*.js` - Bundled JavaScript
   - `dist/assets/*.css` - Bundled styles

### Deployment Targets

#### Localnet (Development)
- Docker-based Algorand sandbox
- Instant finality, unlimited ALGO
- Reset anytime for clean state
- **Use:** Development and testing

#### TestNet (Staging)
- Public test network
- Real network conditions
- Free ALGO from dispenser
- **Use:** Integration testing, demos

#### MainNet (Production)
- Live Algorand blockchain
- Real ALGO required
- Permanent transactions
- **Use:** Production deployment

### Deployment Commands
```bash
# Deploy to localnet
algokit project deploy localnet

# Deploy to TestNet
algokit project deploy testnet

# Deploy to MainNet (requires confirmation)
algokit project deploy mainnet
```

---

## Testing Strategy

### Smart Contract Tests

#### Unit Tests (`tests/*_test.py`)
- **Framework:** pytest + algorand-python-testing
- **Purpose:** Test individual contract methods in isolation
- **Coverage:**
  - State initialization
  - Method logic correctness
  - Edge cases (zero values, overflow)
  - Error conditions and assertions
- **Example:**
  ```python
  def test_increment_counter():
      # Given: Fresh counter contract
      # When: Call incr_counter()
      # Then: Count increases by 1
  ```

#### Integration Tests (`tests/*_client_test.py`)
- **Framework:** pytest + algokit-utils
- **Purpose:** Test contract via generated client
- **Coverage:**
  - Full transaction flow
  - Multi-transaction scenarios
  - Opt-ins and asset transfers
  - Gas costs and transaction fees
- **Runs Against:** Localnet sandbox

### Frontend Tests

#### Unit Tests (Jest)
- **Location:** `*.spec.tsx` files next to components
- **Purpose:** Test React components in isolation
- **Coverage:**
  - Component rendering
  - User interactions (clicks, inputs)
  - State management
  - Props handling
- **Mocking:** Wallet connections, API calls

#### E2E Tests (Playwright)
- **Location:** `tests/` directory
- **Purpose:** Test complete user workflows
- **Coverage:**
  - Wallet connection flow
  - Transaction signing
  - Contract interactions
  - Multi-step operations
- **Browsers:** Chromium, Firefox, WebKit

### Running Tests
```bash
# Contracts
cd projects/contracts
poetry run pytest                    # All tests
poetry run pytest -v                 # Verbose
poetry run pytest --cov              # With coverage
poetry run pytest tests/counter_test.py  # Specific file

# Frontend
cd projects/frontend
npm run test                         # Jest tests
npm run playwright:test              # E2E tests
npm run playwright:test -- --headed  # With browser UI
```

---

## Additional Resources

### IDE Configuration

#### `.vscode/` Directories
- **Significance:** VS Code workspace settings
- **Contains:**
  - `settings.json` - Editor config (formatters, linters)
  - `launch.json` - Debug configurations
  - `extensions.json` - Recommended extensions
- **Benefits:**
  - Consistent dev environment across team
  - One-click debugging
  - Auto-formatting on save

#### `.algokit/` Directories
- **Significance:** AlgoKit-specific project configuration
- **Contains:**
  - Generator templates
  - Deployment configurations
  - Custom AlgoKit commands

### Documentation Tours

#### `.tours/` Directory
- **Significance:** Interactive code walkthroughs
- Uses CodeTour extension for VS Code
- Guided tours through codebase for onboarding
- **Example Tours:**
  - "Smart Contract Basics"
  - "Frontend Architecture"
  - "Deployment Process"

---

## Summary: How Everything Fits Together

1. **Development:**
   - Write smart contracts in AlgoPy (Python-like syntax)
   - Test contracts with pytest
   - Compile to TEAL bytecode

2. **Integration:**
   - AlgoKit auto-generates TypeScript clients
   - Frontend imports clients for type-safe contract calls
   - React components use clients to build UI

3. **Testing:**
   - Unit tests verify contract logic
   - Integration tests verify end-to-end flows
   - E2E tests verify user experience

4. **Deployment:**
   - CI runs on every PR (quality gates)
   - CD deploys on merge to main
   - Contracts → TestNet
   - Frontend → Vercel/Netlify

5. **Monitoring:**
   - AlgoExplorer for transaction history
   - Wallet UI shows user balances
   - Dashboard tracks contract state

**Key Principles:**
- **Type Safety:** TypeScript + Python type hints catch bugs early
- **Automation:** CI/CD reduces manual work and errors
- **Testability:** Comprehensive tests ensure reliability
- **Developer Experience:** AlgoKit streamlines common tasks
- **Monorepo:** Shared configuration, coordinated releases

---

## Next Steps for New Developers

1. **Read:** `README.md` for project overview
2. **Setup:** Follow `Alokit_setup.md` (or `AlgoKit_setup.md` if renamed) instructions
3. **Explore:** Run the counter demo end-to-end
4. **Learn:** Study `Bank.tsx` and `bank/contract.py` together
5. **Build:** Create your first feature (start small!)
6. **Test:** Write tests before coding (TDD approach)
7. **Deploy:** Push to TestNet and share demo

**Questions?** Check existing issues or open a discussion on GitHub!

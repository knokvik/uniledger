# UniLedger Repository Structure Documentation

This document provides a detailed explanation of every file and directory in the UniLedger repository, their significance, and their role in the project.

---

## Table of Contents

1. [Root Level Files](#root-level-files)
2. [Root Level Directories](#root-level-directories)
3. [Smart Contracts Project](#smart-contracts-project)
4. [Frontend Project](#frontend-project)
5. [CI/CD Workflows](#cicd-workflows)

---

## Root Level Files

### `.algokit.toml`
**Purpose:** AlgoKit workspace configuration file  
**Significance:** 
- Defines the project as an AlgoKit workspace
- Specifies minimum AlgoKit version required (v2.0.0)
- Configures project structure with `projects_root_path = 'projects'`
- Defines build order for subprojects (contracts first, then frontend)
- Essential for AlgoKit CLI commands to work properly

### `.editorconfig`
**Purpose:** Code editor configuration for consistent formatting  
**Significance:**
- Ensures consistent code style across different editors and IDEs
- Defines indentation, line endings, charset, and whitespace rules
- Helps maintain code quality and prevents formatting conflicts

### `.gitattributes`
**Purpose:** Git attribute configuration  
**Significance:**
- Controls how Git handles line endings and binary files
- Ensures consistent behavior across different operating systems
- Important for cross-platform development

### `.gitignore`
**Purpose:** Specifies files and directories Git should ignore  
**Significance:**
- Excludes build artifacts, dependencies (node_modules, .venv), and IDE files
- Prevents sensitive data and temporary files from being committed
- Keeps repository clean and reduces repo size
- Includes patterns for Python (__pycache__, *.pyc), Node.js, AlgoKit, and IDE-specific files

### `README.md`
**Purpose:** Main project documentation and overview  
**Significance:**
- Provides comprehensive introduction to UniLedger platform
- Explains the problem statement (campus event and finance chaos)
- Lists key features: ticketing, payments, volunteer management, club treasuries
- Documents tech stack: React + Vite + Algorand blockchain
- First document developers and stakeholders read
- Critical for onboarding and understanding project scope

### `Alokit_setup.md`
**Purpose:** AlgoKit setup and getting started guide  
**Significance:**
- Step-by-step instructions for setting up development environment
- Guides developers through AlgoKit installation and configuration
- Essential for new developers joining the project
- Reduces setup friction and standardizes development environment

### `OnChain-Counter.code-workspace`
**Purpose:** VS Code workspace configuration  
**Significance:**
- Multi-root workspace file for VS Code
- Organizes both contracts and frontend projects in single workspace
- Provides unified development experience
- Includes workspace-specific settings and extensions

---

## Root Level Directories

### `.algokit/`
**Purpose:** AlgoKit-specific configuration and generators  
**Contains:**
- `.copier-answers.yml` - Stores answers from AlgoKit project template generation
- `generators/create-devcontainer/` - DevContainer generator templates

**Significance:**
- Maintains project template metadata
- Enables reproducible project structure
- Supports DevContainer setup for consistent development environments

### `.github/`
**Purpose:** GitHub-specific configurations and CI/CD workflows  
**Contains:** 
- `workflows/` directory with 8 GitHub Actions workflow files

**Significance:**
- Automates testing, building, and deployment
- Ensures code quality through automated checks
- Critical for DevOps and continuous integration/deployment

### `.vscode/`
**Purpose:** VS Code editor settings for the workspace  
**Contains:**
- `launch.json` - Debug configurations for smart contracts and frontend
- `settings.json` - Workspace-specific editor settings

**Significance:**
- Provides consistent debugging experience
- Configures linting, formatting, and IntelliSense
- Improves developer productivity with pre-configured tools

### `projects/`
**Purpose:** Main codebase directory containing all source code  
**Contains:**
- `contracts/` - Algorand smart contracts written in Python
- `frontend/` - React/TypeScript web application

**Significance:**
- Houses entire application logic
- Separates concerns between blockchain (backend) and UI (frontend)
- Most active development happens here

---

## Smart Contracts Project

**Location:** `/projects/contracts/`

### Root Files

#### `pyproject.toml`
**Purpose:** Python project configuration and dependency management  
**Significance:**
- Defines project metadata (name: "OnChain-Counter-contracts", version, authors)
- Lists runtime dependencies: algokit-utils, algorand-python, python-dotenv
- Lists development dependencies: pytest, black, ruff, mypy, pip-audit
- Configures code quality tools (ruff linting rules, pytest paths, mypy strictness)
- Essential for Poetry package manager to install dependencies

#### `poetry.toml`
**Purpose:** Poetry configuration  
**Significance:**
- Configures Poetry's behavior for this project
- Specifies virtual environment location and installation preferences

#### `poetry.lock`
**Purpose:** Dependency lock file  
**Significance:**
- Pins exact versions of all dependencies and sub-dependencies
- Ensures reproducible builds across different machines
- Generated and maintained by Poetry
- Should be committed to version control

#### `.algokit.toml`
**Purpose:** AlgoKit configuration for contracts project  
**Significance:**
- Defines contract-specific build, test, and deployment commands
- Configures deployment targets (localnet, testnet, mainnet)
- Specifies contract artifacts location

#### `README.md`
**Purpose:** Contracts project documentation  
**Significance:**
- Explains smart contract architecture
- Provides setup and deployment instructions
- Documents contract APIs and usage

### `smart_contracts/` Directory

#### `__init__.py`
**Purpose:** Python package initialization  
**Significance:**
- Makes the directory a Python package
- May contain shared imports or package-level configuration

#### `__main__.py`
**Purpose:** Entry point for direct module execution  
**Significance:**
- Allows running the contracts package as a module: `python -m smart_contracts`
- Typically used for CLI operations or deployment scripts

#### `counter/` Directory

##### `contract.py`
**Purpose:** Counter smart contract implementation  
**Significance:**
- Simple state-tracking contract demonstrating Algorand smart contract basics
- Maintains a `count` variable (UInt64) in global state
- Provides `incr_counter()` method to increment count by 1
- **Use Case:** Educational example showing state mutations
- **Key Concepts:** State variables, ARC4 methods, return values

##### `deploy_config.py`
**Purpose:** Counter contract deployment configuration  
**Significance:**
- Defines deployment strategy using AlgoKit utilities
- Loads deployer account from environment variables
- Uses `AppendApp` update strategy (allows schema changes)
- Sends 1 ALGO to contract address post-deployment for transaction fees
- Critical for automated contract deployment in CI/CD

#### `bank/` Directory

##### `contract.py`
**Purpose:** Bank/Escrow smart contract implementation  
**Significance:**
- Production-grade contract demonstrating real-world use case
- **Features:**
  - Deposit ALGO: Accepts payments and tracks per-user balances
  - Withdraw ALGO: Returns funds from user's balance
  - BoxMap storage: Efficient per-account balance tracking
  - Inner transactions: Contract-initiated transfers
- **Security:** Input validation, balance checks, assertion-based error handling
- **Storage:** Uses Algorand's Box storage for scalable state
- **Use Case:** Foundation for UniLedger's payment and escrow features

##### `deploy_config.py`
**Purpose:** Bank contract deployment configuration  
**Significance:**
- Similar to counter deployment but tailored for bank contract
- Handles Box storage fees during deployment
- Configures contract permissions and settings

#### `artifacts/` Directory
**Purpose:** Compiled smart contract outputs  
**Contains:**
- `Counter/` - Compiled TEAL bytecode and ARC-56 JSON spec for Counter
- `Bank/` - Compiled TEAL bytecode and ARC-56 JSON spec for Bank

**Significance:**
- Generated during build process
- TEAL files: Low-level bytecode executed on Algorand Virtual Machine (AVM)
- ARC-56 JSON: Contract interface specification for client generation
- Used by frontend to interact with deployed contracts
- Version-controlled to track contract changes

### `tests/` Directory
**Purpose:** Smart contract test suite  
**Contains:**
- `counter_test.py` - Unit tests for Counter contract
- `counter_client_test.py` - Integration tests using generated clients

**Significance:**
- Validates contract behavior before deployment
- Tests state changes, error conditions, and edge cases
- Uses pytest framework with AlgoKit testing utilities
- Runs in CI pipeline to catch bugs early
- Essential for maintaining contract reliability

---

## Frontend Project

**Location:** `/projects/frontend/`

### Root Files

#### `package.json`
**Purpose:** Node.js project configuration and dependencies  
**Significance:**
- Defines project metadata (name: "OnChain-Counter-frontend", version, author)
- Lists dependencies:
  - **Runtime:** React, algosdk, wallet connectors (@perawallet, @blockshake/defly-connect)
  - **UI:** daisyUI, tailwindcss, notistack (notifications)
  - **Algorand:** @algorandfoundation/algokit-utils, @txnlab/use-wallet-react
- Lists devDependencies: TypeScript, Vite, ESLint, Playwright, Jest
- Defines npm scripts:
  - `dev`: Start development server
  - `build`: Production build
  - `test`: Run Jest tests
  - `lint`: Code quality checks
  - `generate:app-clients`: Generate TypeScript clients from smart contracts

#### `pnpm-lock.yaml`
**Purpose:** pnpm dependency lock file  
**Significance:**
- Ensures deterministic dependency installations
- Faster and more efficient than npm/yarn
- Should be committed to version control

#### `vite.config.ts`
**Purpose:** Vite bundler configuration  
**Significance:**
- Configures React plugin
- Sets up development server
- Configures build output and optimization
- Adds polyfills for Node.js modules (needed for algosdk in browser)

#### `tsconfig.json`
**Purpose:** TypeScript compiler configuration  
**Significance:**
- Defines TypeScript strictness levels
- Configures module resolution
- Sets target JavaScript version
- Enables JSX for React
- Critical for type safety

#### `tailwind.config.cjs`
**Purpose:** Tailwind CSS configuration  
**Significance:**
- Configures design system (colors, spacing, breakpoints)
- Defines content paths for class purging
- Integrates daisyUI component library
- Ensures consistent styling

#### `postcss.config.cjs`
**Purpose:** PostCSS configuration  
**Significance:**
- Processes Tailwind CSS
- Adds autoprefixer for browser compatibility
- Part of CSS build pipeline

#### `.eslintrc.cjs`
**Purpose:** ESLint configuration  
**Significance:**
- Defines code quality rules
- Configures TypeScript-specific linting
- Ensures code consistency across team

#### `.prettierrc.cjs`
**Purpose:** Prettier code formatter configuration  
**Significance:**
- Defines code formatting rules
- Works with ESLint for comprehensive code quality

#### `playwright.config.ts`
**Purpose:** Playwright E2E test configuration  
**Significance:**
- Configures end-to-end browser testing
- Defines test browsers and devices
- Sets up test environment

#### `jest.config.ts`
**Purpose:** Jest unit test configuration  
**Significance:**
- Configures unit testing framework
- Sets up test environment and coverage

### `src/` Directory - Source Code

#### `main.tsx`
**Purpose:** Application entry point  
**Significance:**
- Initializes React
- Renders root App component
- Sets up global providers and context
- First file executed when app starts

#### `App.tsx`
**Purpose:** Root application component  
**Significance:**
- Sets up wallet providers (Pera, Defly, KMD, Lute)
- Configures notification system (SnackbarProvider)
- Defines app-wide layout and structure
- Manages global state and routing

#### `Home.tsx`
**Purpose:** Main landing page component  
**Significance:**
- Primary user interface
- Displays all major features and components
- Entry point for user interactions

#### `vite-env.d.ts`
**Purpose:** TypeScript type definitions for Vite  
**Significance:**
- Provides type safety for Vite-specific features
- Enables IntelliSense for environment variables

### `src/components/` Directory - React Components

#### `Account.tsx`
**Purpose:** Display connected wallet information  
**Features:**
- Shows wallet address (truncated)
- Displays current network (localnet/testnet/mainnet)
- Links to blockchain explorer (Lora)
**Significance:** Critical for user awareness of their connected identity

#### `ConnectWallet.tsx`
**Purpose:** Wallet connection modal  
**Features:**
- Lists available wallet providers (Pera, Defly, KMD, etc.)
- Handles wallet connection/disconnection
- Displays active account status
**Significance:** Gateway for blockchain interactions; required for all transactions

#### `ErrorBoundary.tsx`
**Purpose:** React error boundary  
**Features:**
- Catches runtime errors in component tree
- Displays user-friendly error messages
- Provides troubleshooting guidance
**Significance:** Prevents entire app crashes; improves user experience

#### `Transact.tsx`
**Purpose:** Simple ALGO payment interface  
**Features:**
- Send 1 ALGO to specified address
- Address validation (58-character Algorand format)
- Transaction confirmation
**Significance:** Basic payment functionality; user onboarding

#### `SendAlgo.tsx`
**Purpose:** Advanced payment modal  
**Features:**
- Flexible amount selection
- Address input with validation
- Success/error notifications
**Significance:** Primary payment interface for UniLedger transactions

#### `AssetOptIn.tsx`
**Purpose:** ASA opt-in interface  
**Features:**
- Input field for asset ID
- Opt-in transaction creation
- Notification feedback
**Significance:** Required for receiving custom tokens (tickets, badges) in UniLedger

#### `AppCalls.tsx`
**Purpose:** Counter contract interaction demo  
**Features:**
- View current count
- Increment counter button
- Contract state display
**Significance:** Demonstrates smart contract interaction patterns

#### `Bank.tsx`
**Purpose:** Full-featured bank contract interface  
**Features:**
- Deposit/withdrawal operations
- Transaction history display
- Contract deployment UI
- Global state viewer
- Integration with Algorand indexer for transaction logs
**Significance:** Core financial component; prototype for UniLedger's treasury and escrow features

#### `CreateASA.tsx`
**Purpose:** Fungible token creation interface  
**Features:**
- Configure token name, unit name, decimals, total supply
- Create ASA transaction
- Success notification with asset ID
**Significance:** Used for creating event tickets and reward tokens in UniLedger

#### `MintNFT.tsx`
**Purpose:** NFT minting interface (ARC-3 standard)  
**Features:**
- File upload to IPFS (via Pinata)
- Metadata generation with SHA-256 hashing
- NFT creation with metadata links
- Full ARC-3 compliance
**Significance:** Used for VIP tickets, unique badges, and collectibles in UniLedger

### `src/contracts/` Directory - Contract Clients

**Purpose:** TypeScript clients for smart contract interaction  
**Contains:**
- `Counter.ts` - Auto-generated Counter contract client
- `Bank.ts` - Auto-generated Bank contract client

**Significance:**
- Generated from ARC-56 contract specs
- Provides type-safe contract interaction
- Abstracts ABI encoding/decoding
- Simplifies frontend-blockchain integration

### `src/interfaces/` Directory

**Purpose:** TypeScript type definitions  
**Contains:** Network configuration interfaces

**Significance:**
- Ensures type safety across application
- Documents data structures
- Enables better IDE support

### `src/utils/` Directory - Utility Functions

**Contains:**
- `ellipseAddress.ts` - Truncates Algorand addresses for display
- `pinata.ts` - IPFS file upload utilities
- Network configuration helpers

**Significance:**
- Shared utility functions
- Reduces code duplication
- Centralizes common operations

### `src/styles/` Directory
**Purpose:** Global CSS and styling  
**Significance:**
- Application-wide styles
- Tailwind CSS imports
- Custom CSS overrides

### `src/assets/` Directory
**Purpose:** Static assets (images, SVGs, fonts)  
**Significance:**
- Logo files
- Icons and graphics
- Branding materials

### `public/` Directory
**Purpose:** Static public files  
**Contains:**
- `index.html` - HTML entry point
- `robots.txt` - Search engine directives
- Favicon and PWA manifest

**Significance:**
- Served directly without processing
- SEO and browser configuration

---

## CI/CD Workflows

**Location:** `/.github/workflows/`

### `validate.yaml`
**Purpose:** Main PR validation workflow  
**Triggers:** On every pull request  
**Actions:**
- Calls contract CI workflow
- Calls frontend CI workflow
**Significance:** Entry point for automated testing; prevents broken code from merging

### `onchain-counter-contracts-ci.yaml`
**Purpose:** Smart contract continuous integration  
**Steps:**
1. Install Poetry and Python 3.12
2. Install AlgoKit CLI
3. Start LocalNet (local Algorand network)
4. Bootstrap project dependencies
5. Audit Python dependencies for security vulnerabilities
6. Lint and format code (black, ruff)
7. Run pytest test suite
8. Build smart contracts (compile to TEAL)
9. Audit TEAL files for vulnerabilities
10. Deploy contracts to LocalNet for integration testing

**Significance:**
- Ensures contract quality and security
- Catches bugs before deployment
- Validates contracts work on real network

### `onchain-counter-frontend-ci.yaml`
**Purpose:** Frontend continuous integration  
**Steps:**
1. Setup Node.js 18
2. Install AlgoKit and Python (for contract client generation)
3. Bootstrap dependencies (npm install)
4. Run ESLint for code quality
5. Run Jest unit tests
6. Build production bundle with Vite

**Significance:**
- Validates frontend builds successfully
- Catches TypeScript errors and test failures
- Ensures production readiness

### `onchain-counter-contracts-cd.yaml`
**Purpose:** Smart contract continuous deployment  
**Triggers:** Manual or on release  
**Actions:**
- Deploys contracts to TestNet or MainNet
- Updates contract addresses in configuration

**Significance:**
- Automates production deployment
- Reduces manual errors
- Maintains deployment audit trail

### `onchain-counter-frontend-cd.yaml`
**Purpose:** Frontend continuous deployment  
**Triggers:** On main branch merge  
**Actions:**
- Builds production bundle
- Deploys to hosting platform (likely Vercel/Netlify)

**Significance:**
- Automates frontend releases
- Ensures staging/production parity

### `multisig-implementation-ci.yaml` & `multisig-implementation-cd.yaml`
**Purpose:** CI/CD for multi-signature contract implementation  
**Significance:**
- Separate workflows for advanced contract features
- Supports treasury management with multi-sig approval

### `release.yaml`
**Purpose:** Automated release management  
**Triggers:** On version tags  
**Actions:**
- Creates GitHub releases
- Generates changelog
- Archives build artifacts

**Significance:**
- Standardizes release process
- Provides versioned artifacts
- Documents changes between versions

---

## Summary

This repository is a well-structured monorepo using AlgoKit workspace features. It follows modern best practices with:

- **Clear separation** between smart contracts (Python) and frontend (TypeScript/React)
- **Comprehensive CI/CD** with automated testing, linting, and deployment
- **Type safety** through TypeScript and mypy
- **Code quality** tools (ESLint, Prettier, Ruff, Black)
- **Security** audits for dependencies and TEAL code
- **Developer experience** focus with VS Code integration and documentation

The architecture supports the UniLedger vision of a decentralized campus event platform built on Algorand blockchain, with smart contracts handling financial logic and a React frontend providing user-friendly interfaces.

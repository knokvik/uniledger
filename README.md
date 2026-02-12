<div align="center">

<img width="240" height="63" alt="uniledger" src="https://github.com/user-attachments/assets/eb3b6a94-2917-4a86-b46e-cdd6217ae982" />

### Web3-Powered Decentralized Campus Governance, Events & Treasury Protocol

<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
<img src="https://img.shields.io/badge/Algorand-000000?style=for-the-badge&logo=algorand&logoColor=white" />

<br/>

Hybrid Governance + On-Chain Finance + NFT Infrastructure

[Features](#-key-features) •
[Web3 Layer](#-web3-layer) •
[Architecture](#-architecture-overview) •
[Installation](#-installation) •
[Deployment](#-deployment)

</div>

---

# 🎯 Problem Statement

College ecosystems often struggle with:

- Manual event approvals  
- Financial opacity in club treasuries  
- Cash-based reconciliation issues  
- Fake payment confirmations  
- No verifiable proof of participation  
- Weak administrative oversight  

Traditional solutions rely on centralized databases and spreadsheets.

**UniLedger solves this by combining institutional governance with decentralized blockchain verification.**

---

# 🚀 Core Vision

To build a **Campus Operating System** that merges:

✅ Role-based governance  
✅ Blockchain-verified payments  
✅ NFT-based ticketing  
✅ Smart escrow crowdfunding  
✅ Transparent treasury monitoring  
✅ Real-time collaboration  

---


# ⭐ What Makes UniLedger Unique

| Feature | Description |
|----------|-------------|
| Hybrid Governance | Centralized admin + decentralized finance |
| NFT Ticketing | On-chain entry verification |
| Escrow Crowdfunding | Trustless fundraising |
| Transparent Treasury | Publicly auditable |
| Modular Architecture | Easily extendable to DAO model |

---

# 🔑 Key Features

## 1️⃣ Role-Based Governance (RBAC)

### 🔵 College Admin
- Approves clubs and events
- Lifecycle control (suspend/cancel)
- Read-only treasury oversight
- Platform analytics dashboard

### 🟢 Club Owner / Organizer
- Create & manage clubs
- Launch events
- Set ticket pricing
- Launch crowdfunding campaigns
- Manage members & volunteers

### 🟡 Volunteer
- Entry QR scanning access
- Limited moderation privileges

### ⚪ Member / Participant
- Join clubs
- Buy NFT tickets
- Contribute to crowdfunding
- Participate in discussions

---

## 2️⃣ Club Infrastructure

- Structured membership system  
- Join request workflow  
- Channel-based communication (Discord-like)  
- Treasury tracking  
- Notification engine  
- Admin approval gating  

---

## 3️⃣ Event Management

- Club-based or independent events  
- Ticket pricing logic  
- NFT-based ticket issuance  
- Volunteer moderation  
- Blockchain payment verification  
- Channel discussions  

---

# 🌐 Web3 Layer

UniLedger integrates full on-chain financial logic.

---

## 💰 4️⃣ On-Chain Crowdfunding (Smart Escrow)

Large-scale events can launch blockchain-based funding campaigns.

### Flow

1. Organizer sets target & deadline  
2. Escrow smart contract is deployed  
3. Contributors send funds from wallet  
4. If target met → funds released  
5. If target not met → contributors refunded  

### Benefits

- No backend fund custody  
- Automatic refund logic  
- Transparent on-chain contributions  
- Immutable transaction history  

---

## 🎟 5️⃣ NFT Ticket Generation

Tickets are minted as blockchain assets (ASA).

Each ticket includes:

- Unique asset ID  
- Wallet-bound ownership  
- Event metadata  
- Timestamp  
- Embedded QR reference  

Properties:

- Non-duplicable  
- Publicly verifiable  
- Cannot be forged  
- Transferable (configurable)  

---

## 📲 6️⃣ Decentralized QR Ticket Scanning

Entry validation does NOT rely on database-only confirmation.

### Entry Flow

1. User presents QR  
2. Volunteer scans  
3. Scanner extracts wallet + asset ID  
4. Backend verifies on blockchain  
5. NFT ownership confirmed  
6. Entry marked as consumed  

### Fraud Protection

- Screenshot reuse prevented  
- Fake payment detection  
- Double-entry blocked  
- On-chain validation source of truth  

---

# 🏗 Architecture Overview

## Frontend

```
├── React (Vite)
├── TypeScript
├── React Router
├── Redux
├── React Query
├── Axios
└── Pera Wallet / WalletConnect
```

## Backend

```
├── Node.js
├── Express.js
├── Supabase (PostgreSQL)
├── Session-based authentication
├── Role-based middleware
├── Crowdfunding service
├── NFT minting service
└── QR verification service
```

## Blockchain Layer

```
├── Algorand Testnet / Mainnet
├── Smart escrow contracts
├── ASA NFT minting
├── Indexer verification
└── Transaction validation worker
```

---

# 🗄 Database Design

## Core Entities

```
users
clubs
events
club_members
event_members
channels
messages
join_requests
event_payments
crowdfunding_campaigns
campaign_contributions
nft_tickets
ticket_scans
notifications
```

## Relationships

- Many-to-many membership tables  
- Blockchain transaction IDs linked to payments  
- NFT asset IDs stored for verification  
- Escrow contract IDs linked to campaigns  

---

# 🔐 Security Model

- bcrypt password hashing  
- HTTP-only session cookies  
- Strict role middleware enforcement  
- Server-side blockchain verification  
- No trust in frontend-only validation  
- Escrow-controlled fund releases  
- One-time ticket scan protection  

---

# 📦 Installation

## Prerequisites

- Node.js v18+
- Supabase account
- Algorand wallet (Pera Wallet)

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Backend

```bash
cd backend
npm install

cp .env.example .env
npm run dev
```

---

# 🔑 Environment Variables

```env
# Backend
DATABASE_URL=
SUPABASE_KEY=
SESSION_SECRET=
ALGORAND_ALGOD_URL=
ALGORAND_INDEXER_URL=
NFT_MANAGER_ADDRESS=
ESCROW_DEPLOYER_PRIVATE_KEY=

# Frontend
VITE_API_URL=http://localhost:5000
VITE_ALGORAND_NETWORK=testnet
```

---

# 📈 Scalability Strategy

- Stateless REST APIs  
- Indexed database queries  
- Blockchain verification only when required  
- Async blockchain worker queues  
- Caching with React Query  
- Modular service-based backend  

---

# 🚀 Deployment

## Recommended Stack

| Component | Platform |
|------------|----------|
| Frontend | Vercel / Netlify |
| Backend | Railway / Docker / VPS |
| Database | Supabase |
| Blockchain | Algorand Mainnet |
| CI/CD | GitHub Actions |

---

# 🌍 Industry Positioning

UniLedger is not just a campus app.

It is a **Web3 Governance & Financial Transparency Protocol** adaptable to:

- Universities  
- Corporate innovation hubs  
- Hackathon ecosystems  
- DAO-lite communities  
- Educational consortiums  

It bridges institutional control with decentralized trust.

---

# 🔮 Future Enhancements

- Soulbound NFT certificates  
- DAO-style club governance  
- Governance tokens  
- On-chain voting  
- Multi-college federation model  
- Public treasury dashboard  
- Multi-sig admin wallets  

---

# 🤝 Contributing

1. Fork repository  
2. Create feature branch  
3. Commit changes  
4. Push branch  
5. Open Pull Request  

---

# 📄 License

MIT License

---

# 📞 Contact

Project Maintainer: Niraj Rajendra Naphade  

GitHub: https://github.com/knokvik/uniledger  

---

<div align="center">

Made with ❤️ for campus communities  

</div>

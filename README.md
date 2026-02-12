<div align="center">

<img width="240" height="63" alt="uniledger" src="https://github.com/user-attachments/assets/eb3b6a94-2917-4a86-b46e-cdd6217ae982" />

### Decentralized Campus Clubs, Events & Treasury Management Platform

<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
<img src="https://img.shields.io/badge/Algorand-000000?style=for-the-badge&logo=algorand&logoColor=white" />

<br/>

[Features](#-key-features) • 
[Architecture](#-architecture-overview) • 
[Installation](#-installation) • 
[Contributing](#-contributing) • 
[License](#-license)

</div>

---

## 📸 Visual Preview

View UI screenshots, admin dashboard flows, event creation screens, and payment workflows here:

🔗 **[View Screenshots & Design Files](https://drive.google.com/drive/folders/1ydFeoI0MHMEVCit9Q6HxQrXEkrhIKAtV?usp=sharing)**

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Core Vision](#-core-vision)
- [Key Features](#-key-features)
- [What Makes UniLedger Unique](#-what-makes-uniledger-unique)
- [Architecture Overview](#️-architecture-overview)
- [Database Design](#-database-design)
- [Security Model](#-security-model)
- [Installation](#-installation)
- [Use Cases](#-use-cases)
- [Future Enhancements](#-future-enhancements)
- [Scalability Strategy](#-scalability-strategy)
- [Deployment](#-deployment)
- [Industry Positioning](#-industry-positioning)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Problem Statement

College ecosystems often suffer from critical operational challenges:

- **Manual Event Approvals** – Fragmented coordination and approval workflows
- **Financial Opacity** – Lack of transparency in club and event treasuries
- **Reconciliation Issues** – Cash-based ticketing with poor accountability
- **No Proof of Participation** – No verifiable records of attendance or contribution
- **Inefficient Tracking** – Poor volunteer and membership management systems
- **Limited Oversight** – Weak administrative visibility into activities

**Existing solutions** rely heavily on centralized spreadsheets, messaging apps, and payment gateways, leading to inconsistencies, fraud risks, and trust issues.

**UniLedger solves this** by introducing **structured governance with decentralized financial verification**.

---

## 🚀 Core Vision

To build a **structured, role-based campus operating system** that combines:

✅ **Centralized governance** (admin approvals, oversight)  
✅ **Decentralized financial verification** (Algorand blockchain)  
✅ **Real-time collaboration** (channels, notifications)  
✅ **Transparent treasury visibility**  
✅ **Scalable event infrastructure**

---

## 🔑 Key Features

### 1. **Role-Based Governance (RBAC)**

Structured permission system with four core roles:

#### 🔵 **College Admin**
- Approves clubs and events
- Views platform insights (read-only oversight)
- Monitors treasury and activity
- Controls lifecycle (suspend/cancel)

#### 🟢 **Club Owner / Event Organizer**
- Creates and manages clubs
- Creates events with ticket pricing
- Manages channels and members
- Oversees participants and volunteers

#### 🟡 **Volunteer**
- Access to limited management channels
- Entry scanning for events
- Participation tracking

#### ⚪ **Member / Participant**
- Join clubs (request-based workflow)
- Purchase event tickets
- Participate in discussions
- View club activities

---

### 2. **Club Infrastructure**

Each club provides:

- ✅ Structured membership system
- ✅ Join request workflow (pending → approved/rejected)
- ✅ Multiple channels (Discord-like structure)
- ✅ Role-based visibility per channel
- ✅ Treasury tracking
- ✅ Notifications system

> **Note:** Clubs must be approved by college admin before becoming active.

---

### 3. **Event Management System**

Comprehensive event support:

- ✅ Independent or club-based creation
- ✅ Ticket pricing logic
- ✅ Wallet-based payment integration
- ✅ Participant tracking
- ✅ Role-based event access
- ✅ Channel-based discussions
- ✅ Volunteer moderation

> **Note:** Event creation requests must be approved by admin.

---

### 4. **Decentralized Ticketing & Treasury (Algorand Integration)**

UniLedger integrates **Algorand blockchain** to introduce verifiable payment tracking.

#### How It Works

1. **Organizer** sets a ticket price
2. **Organizer wallet address** is stored
3. **Participant** connects wallet (Pera Wallet)
4. **Payment transaction** is signed client-side
5. **Backend verifies** transaction on Algorand network
6. **Entry access** is granted only after confirmation

#### Key Properties

✅ Payments are **not stored as balances** in database  
✅ Blockchain is **source of truth** for transactions  
✅ Backend verifies via **Algorand indexer**  
✅ **No internal ledger manipulation**  
✅ **Transparent and auditable**

#### This Prevents:

❌ Fake confirmations  
❌ Manual manipulation of payment records  
❌ Unauthorized event access

---

### 5. **Notification Engine**

System-generated notifications for:

- Club join requests
- Approval/rejection updates
- Event approvals
- Payment confirmations
- Administrative decisions

**Features:**
- Mark as read
- Delete notifications
- Real-time updates

---

### 6. **Admin Oversight Dashboard**

Comprehensive admin panel providing:

- 📊 Total users, clubs, and events
- 📋 Pending requests tracking
- ✅ Approved/Rejected filtering
- 🔍 Full read-only inspection of clubs and events
- ⚙️ Status control (suspend/cancel)

> **Note:** Admin cannot modify content but can control lifecycle.

---

## ⭐ What Makes UniLedger Unique

| Feature | Description |
|---------|-------------|
| **🔄 Hybrid Architecture** | Combines centralized governance with decentralized finance |
| **🎫 Verifiable Ticket Payments** | Blockchain-backed entry system prevents fraud |
| **👥 Role-Driven Club Governance** | Structured authority hierarchy |
| **💬 Discord-like Community Model** | Channels per club and event with visibility rules |
| **💰 Transparent Treasury Oversight** | Admin can monitor without interfering |
| **🎓 Extensible to Real Certificates** | Can mint NFTs for participation certificates |

---

## 🏗️ Architecture Overview

### **Frontend**
```
├── React (Vite)
├── React Router
├── Redux (UI + Auth state)
├── React Query (Server state caching)
├── Axios (API communication)
└── WalletConnect / Pera Wallet integration
```

### **Backend**
```
├── Node.js
├── Express.js
├── Supabase (PostgreSQL)
├── Session-based authentication
├── Role-based middleware
└── RESTful API architecture
```

### **Blockchain Layer**
```
├── Algorand (Testnet / Mainnet)
├── Wallet signature validation
├── Transaction verification via indexer
└── Event-based payment confirmation
```

---

## 🗄️ Database Design

### **Core Entities**

```
├── users
├── clubs
├── events
├── club_members
├── event_members
├── channels
├── messages
├── join_requests
├── event_payments
└── notifications
```

### **Relationships**

- ✅ Many-to-many membership models
- ✅ Role enforcement via membership tables
- ✅ Payment verification linked to blockchain transaction IDs
- ✅ Visibility controlled at query level

---

## 🔐 Security Model

- ✅ **Password hashing** with bcrypt
- ✅ **HTTP-only session cookies**
- ✅ **Role-based middleware enforcement**
- ✅ **Server-side verification** of blockchain transactions
- ✅ **Strict admin gating**
- ✅ **No trust in frontend-only validation**

---

## 📦 Installation

### Prerequisites

- Node.js (v18+)
- npm or yarn
- PostgreSQL (via Supabase)
- Algorand wallet (Pera Wallet)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Update .env with your Supabase and Algorand credentials

npm run dev
```

### Environment Variables

```env
# Backend
DATABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SESSION_SECRET=your_session_secret
ALGORAND_INDEXER_URL=https://testnet-idx.algonode.cloud
ALGORAND_ALGOD_URL=https://testnet-api.algonode.cloud

# Frontend
VITE_API_URL=http://localhost:5000
VITE_ALGORAND_NETWORK=testnet
```

---

## 💼 Use Cases

- 🎪 College fests
- 💻 Tech symposiums
- 🎭 Cultural events
- ⚽ Sports competitions
- 🏆 Hackathons
- 📢 Club recruitment drives
- 💵 Sponsorship transparency

---

## 🔮 Future Enhancements

- [ ] NFT-based digital certificates
- [ ] Decentralized voting system for clubs
- [ ] On-chain crowdfunding campaigns
- [ ] Multi-college support
- [ ] Advanced analytics dashboard
- [ ] Token-based reward system
- [ ] DAO-style governance model
- [ ] Automated approval deadlines
- [ ] Smart contract escrow for large events

---

## 📈 Scalability Strategy

- ✅ **Stateless backend APIs**
- ✅ **Caching via React Query**
- ✅ **Indexed database queries**
- ✅ **Blockchain verification only when required**
- ✅ **Modular service-based backend structure**

---

## 🚀 Deployment

### **Recommended Stack**

| Component | Platform |
|-----------|----------|
| Frontend | Vercel / Netlify |
| Backend | Node server / Docker / Railway |
| Database | Supabase |
| Blockchain | Algorand Mainnet/Testnet |
| CI/CD | GitHub Actions |

### **Production Checklist**

- [ ] Configure production environment variables
- [ ] Set up SSL certificates
- [ ] Configure CORS policies
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure backup strategy
- [ ] Set up CDN for static assets
- [ ] Configure rate limiting
- [ ] Set up automated testing pipeline

---

## 🌍 Industry Positioning

UniLedger is **not just a campus app**. It is a **modular governance and financial transparency framework** adaptable to:

- 🎓 **Universities**
- 🏢 **Corporate internal communities**
- 💻 **Hackathon ecosystems**
- 🗳️ **DAO-lite organizations**
- 🌐 **Educational consortiums**

**It bridges institutional control and decentralized trust.**

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact

**Project Maintainer:** Niraj Rajendra Naphade

**Project Link:** [https://github.com/knokvik/uniledger](https://github.com/knokvik/uniledger)

---

<div align="center">

Made with ❤️ for campus communities

**[⬆ back to top](#uniledger)**

</div>

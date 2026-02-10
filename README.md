# **UniLedger – Decentralized Campus Event & Finance Hub**

*A simple, mobile-first decentralized application built on Algorand for Indian colleges and universities*

**Current Date Reference:** February 2026  
**Blockchain:** :contentReference[oaicite:0]{index=0} (fast finality, sub-cent fees, ASA tokens & smart contracts)  
**Primary Wallet Integration:** :contentReference[oaicite:1]{index=1}  
**Target Users:** Students, club organizers, volunteers, attendees in campus communities  

---

## **Overview**

**UniLedger** solves the real-world chaos of campus events in India: long queues at entry, lost or fake tickets, cash counting errors, *“I’ll pay later”* arguments, lack of transparency in funds, volunteer burnout, and manual tracking nightmares.

Instead of scattered tools (Google Forms + WhatsApp + Razorpay + Excel + cash boxes), **UniLedger** provides **one unified app** that handles:

- Event creation & discovery  
- Secure, blockchain-based ticketing (no PDFs or screenshots)  
- Instant wallet-scan check-in  
- Transparent payments, escrow & auto-refunds  
- Volunteer coordination & rewards  
- Group expense splitting & club treasuries  

All with **near-zero fees**, **full on-chain transparency**, and a **clean UX students actually want to use**.

---

## **Problems We Solve**

### 🎟️ Ticketing & Entry Chaos
- Fake tickets, lost QR codes  
- 300+ person queues  
- Manual name checks  

### 💸 Payment & Money Mess
- Cash theft risks  
- Miscounts & reconciliation errors  
- Delayed sponsorships  
- Refund disputes  

### 🧑‍🤝‍🧑 Volunteer Struggles
- No recognition or proof of work  
- Poor coordination  
- Last-minute dropouts  

### 🔍 Transparency Gaps
- *“Where did the fest budget go?”*  
- No verifiable records  

### 🧩 Fragmented Tools
- 5+ apps/groups per event  
- Lost messages & data  

---

## **Key Features**

### **1. Event Management**
- Create events: cultural fests, tech symposiums, club meets, fundraisers  
- Ticket types:
  - Free  
  - Paid (ALGO / USDCa)  
  - Tiered  
  - Donation-based  
- Custom details:
  - Description  
  - Schedule  
  - Venue  
  - Sponsors (stored on IPFS)  
- Promo codes, capacity limits & waitlists  
- Discovery feed for upcoming campus events  

---

### **2. Decentralized Ticketing**
- Tickets minted as **Algorand Standard Assets (ASAs)**  
  - Fungible tokens for general admission  
  - NFTs for VIP / seated access  
- Purchase via wallet connect → instant transfer to user wallet  
- **Anti-forgery:** on-chain ownership proof  
- Optional controlled resale:
  - Anti-scalping rules  
  - Royalties to organizers  

---

### **3. Check-in & Attendance**
- Volunteer opens **mobile scanner (PWA – no install required)**  
- Attendee shows wallet “Share Address” QR  
- **2–3 second verification** + on-chain attendance log  
- Real-time attendance dashboard for organizers  

---

### **4. Payments & Fund Management**
- All inflows (tickets, donations, sponsorships) → **escrow smart contract**  
- Auto-release after event completion  
- Multi-sig approval support  
- Auto-refunds if:
  - Event is cancelled  
  - Minimum goal is not met  
- Expense logging & group splitting:
  - Atomic transfers settle debts instantly  
- Transparent treasury view:
  - For club members  
  - For faculty oversight  

---

### **5. Volunteer & Team Tools**
- Volunteer sign-up by roles & shifts  
- Built-in scheduler & reminders  
- **Reward badges (ASAs / NFTs)** for participation  
  - Perfect for resumes & LinkedIn proofs  

---

### **6. Club Profiles & Extras**
- Create or join clubs  
- Shared on-chain treasury pots  
- Group savings for trips & inter-college fests  
- Dashboard:
  - Stats  
  - Reports  
  - CSV exports  
- Immutable on-chain audit trail for all money movements  

---

## **Tech Stack**

- **Frontend:** React + Vite + Tailwind CSS  
  - PWA support for offline scanning  
- **Wallet Integration:** Pera Connect / WalletConnect  
- **Smart Contracts:**  
  - PyTEAL or Beaker  
  - Stateful contracts for escrow & group treasuries  
  - Stateless contracts for simple transfers  
- **Tokens:**  
  - ASAs for tickets & reward badges  
  - NFTs for unique or VIP access  
- **Storage:** IPFS (images, descriptions, metadata)  
- **Indexing / APIs:** AlgoExplorer, free indexer nodes, or NFD handles  
- **Hosting:** Vercel / Netlify (frontend only, minimal backend)  
- **Scanner:** Browser-based QR (e.g., react-qr-scanner)  

---

## **Cost Efficiency**

- **Transaction Cost per Action:**  
  ~**0.001 – 0.01 ALGO**  
  *(fractions of a rupee per action)*  

---

## **Developer Documentation**

For detailed documentation about the repository structure and development workflows, see:

- 📚 **[Documentation Index](./DOCUMENTATION_INDEX.md)** - Quick reference guide for navigating all documentation
- 📁 **[Repository Structure](./REPOSITORY_STRUCTURE.md)** - Detailed explanation of every file and directory (130+ files)
- 🔧 **[Workflow Guide](./WORKFLOW_GUIDE.md)** - Complete development workflow from setup to production
- 🚀 **[AlgoKit Setup](./Alokit_setup.md)** - AlgoKit installation and configuration

### Quick Start for Developers

```bash
# 1. Install AlgoKit
pipx install algokit

# 2. Clone and bootstrap
git clone https://github.com/knokvik/uniledger.git
cd uniledger
algokit project bootstrap all

# 3. Start LocalNet
algokit localnet start

# 4. Deploy contracts
cd projects/contracts
algokit project deploy localnet

# 5. Start frontend
cd ../frontend
pnpm run dev
```

For more details, see the [Workflow Guide](./WORKFLOW_GUIDE.md).

---

**UniLedger = One ledger for every university event.  
No chaos. No confusion. Just clean, transparent campus operations.**

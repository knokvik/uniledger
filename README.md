# FestChain – Decentralized Campus Event & Finance Hub

**A simple, mobile-first decentralized application built on Algorand for Indian colleges and universities**

**Current Date Reference:** February 2026  
**Blockchain:** Algorand (fast finality, sub-cent fees, ASA tokens & smart contracts)  
**Primary Wallet Integration:** Pera Wallet  
**Target Users:** Students, club organizers, volunteers, attendees in campus communities

## Overview

FestChain solves the real-world chaos of campus events in India: long queues at entry, lost/fake tickets, cash counting errors, "I'll pay later" fights, lack of transparency in funds, volunteer burnout, and manual tracking nightmares.

Instead of scattered tools (Google Forms + WhatsApp + Razorpay + Excel + cash boxes), FestChain provides **one app** that handles:

- Event creation & discovery
- Secure, blockchain-based ticketing (no PDFs/screenshots)
- Instant wallet-scan check-in
- Transparent payments, escrow, & auto-refunds
- Volunteer coordination & rewards
- Group expense splitting & club treasuries

All with near-zero fees, full on-chain transparency, and a clean UX that students actually want to use.

## Problems We Solve

- **Ticketing & Entry Chaos** → Fake tickets, lost QR codes, 300+ person queues, manual name checks  
- **Payment & Money Mess** → Cash theft risk, miscounts, delayed sponsorships, refund fights  
- **Volunteer Struggles** → No recognition, poor coordination, last-minute dropouts  
- **Transparency Gaps** → "Where did the fest budget go?" – no verifiable records  
- **Fragmented Tools** → 5+ apps/groups per event → lost messages & data

## Key Features

### 1. Event Management
- Create events (cultural fests, tech symposiums, club meets, fundraisers)
- Ticket types: Free, Paid (ALGO / USDCa), Tiered, Donation-based
- Custom details: Description, schedule, venue, sponsors (IPFS storage)
- Promo codes, capacity limits, waitlists
- Discovery feed: Browse upcoming campus events

### 2. Decentralized Ticketing
- Tickets minted as Algorand Standard Assets (ASAs): fungible for general admission, NFTs for VIP/seated
- Buy via wallet connect → instant transfer to Pera Wallet
- Anti-forgery: On-chain ownership proof
- Optional controlled resale with rules (e.g., anti-scalping, royalties)

### 3. Check-in & Attendance
- Volunteer opens mobile scanner (PWA – no install needed)
- Attendee shows Pera Wallet "Share Address" QR
- 2–3 second verification + on-chain log
- Real-time attendance dashboard for organizers

### 4. Payments & Fund Management
- All inflows (tickets, donations, sponsors) → escrow smart contract
- Auto-release after event (or multi-sig approval)
- Auto-refund if cancelled / goal not met
- Expense logging & splitting: Atomic transfers settle debts instantly
- Transparent treasury view for club members / faculty

### 5. Volunteer & Team Tools
- Sign-up for roles/shifts
- Scheduler + reminders
- Reward badges (small ASAs / NFTs) for participation – great for resumes

### 6. Club Profiles & Extras
- Create/join clubs → shared treasury pots
- Group savings for trips/fests
- Dashboard: Stats, reports, exports
- On-chain audit trail for all money movements

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS (PWA for offline scanner)
- **Wallet Integration:** Pera Connect / WalletConnect
- **Smart Contracts:** PyTEAL or Beaker (stateful for escrow/groups, stateless for simple transfers)
- **Tokens:** ASAs (fungible tickets + reward badges, NFTs for unique access)
- **Storage:** IPFS for images/descriptions
- **Indexing / API:** AlgoExplorer, free indexer nodes, or NFD handles
- **Hosting:** Vercel / Netlify (frontend), no heavy backend needed
- **Scanner:** Browser-based QR (react-qr-scanner or similar)

**Transaction Cost per Action:** ~0.001–0.01 ALGO (fractions of a rupee)

## Why Algorand?

- < 5-second finality → instant check-in & payments
- Extremely low fees → viable for ₹50–500 tickets
- ASA standard → easy minting of tickets/rewards
- Green & scalable → appeals to student eco-conscious vibe
- Strong mobile wallet ecosystem (Pera)

## Roadmap (Phased – Student Developer Friendly)

**Phase 1: MVP (4–8 weeks)**
- Event creation + ticket minting
- Buy ticket + wallet check-in scanner
- Basic escrow + auto-release

**Phase 2: Polish & Transparency**
- Volunteer sign-up + rewards
- Expense splitter + club treasury
- Real-time dashboard

**Phase 3: Full-Fledged**
- Discovery feed + promo codes
- Multi-event club profiles
- Sponsor views + reports

**Pilot Strategy:** Start with 1 small club event (100–300 people) on TestNet → then MainNet for a major fest.

## Name & Branding

**Chosen Name:** FestChain  
(Short, combines "fest" – core to Indian campus culture – with "chain" for blockchain transparency)

Alternatives Considered:
- CampusFlow
- UniLedger
- EventLedger
- VibeChain
- AlgoFest

**Visual Style Inspiration:**

Here are some clean, modern dark-mode dashboard examples that align with the app's mobile-first, student-friendly vibe:












Wallet-based ticketing & QR scan concepts:








Vibrant Indian college fest energy:








Blockchain/DeFi aesthetic for logos & visuals:








## Next Steps

1. Finalize name & check domain/NFD availability
2. Set up GitHub repo & AlgoKit project
3. Deploy basic contracts on TestNet
4. Build frontend MVP + scanner
5. Run pilot with a real campus event

Ready to start building? Let me know which phase or feature to detail next (e.g., contract outline, user flows, repo structure). Let's make campus events painless! 🚀
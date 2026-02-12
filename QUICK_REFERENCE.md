# Quick Reference: Notifications, Join Requests & Payments

## ✅ What's Implemented

### 1. Notification System
- **Backend**: Complete API for notifications
- **Frontend**: Notification bell in Dashboard (top-right)
- **Features**:
  - Real-time updates (polls every 30 seconds)
  - Unread count badge
  - Mark as read / Mark all as read
  - Delete notifications
  - Beautiful dropdown UI

### 2. Club Join Requests with Notifications
- **User Side**: Request to join clubs (API ready, UI needed)
- **Owner Side**: View, accept, reject, or hold requests (API ready, UI needed)
- **Notifications**:
  - Owner gets notified when user requests
  - User gets notified when owner responds

### 3. Event Payments with Algorand
- **Backend**: Complete transaction verification
- **Frontend**: Payment utilities ready (UI integration needed)
- **Features**:
  - Blockchain verification using algosdk
  - Validates receiver, amount, uniqueness
  - Auto-adds user to event on success

---

## 📦 Files Created/Modified

### Backend
```
projects/backend/
├── migrations/
│   ├── add_join_requests_and_payments.sql (NEW)
│   └── add_notifications.sql (NEW)
├── routes/
│   ├── join-requests.js (NEW)
│   ├── payments.js (NEW)
│   └── notifications.js (NEW)
├── utils/
│   └── algorand.js (already existed)
└── server.js (updated - registered new routes)
```

### Frontend
```
projects/frontend/
└── src/
    ├── components/
    │   ├── NotificationBell.tsx (NEW)
    │   └── Dashboard.tsx (updated - added notification bell)
    └── utils/
        └── algorandPayment.ts (NEW - fixed TypeScript errors)
```

### Documentation
```
├── TESTING_GUIDE.md (NEW - comprehensive testing instructions)
├── JOIN_REQUESTS_AND_PAYMENTS.md (existing)
└── IMPLEMENTATION_SUMMARY.md (existing)
```

---

## 🚀 Quick Setup

### Step 1: Run Database Migrations

In **Supabase SQL Editor**:

```sql
-- 1. Join Requests & Payments Tables
-- Run: projects/backend/migrations/add_join_requests_and_payments.sql

-- 2. Notifications Table
-- Run: projects/backend/migrations/add_notifications.sql
```

### Step 2: Restart Backend (if needed)

```bash
cd projects/backend
npm start
```

Backend will now have these new routes:
- `/api/join-requests/*`
- `/api/payments/*`
- `/api/notifications/*`

### Step 3: Check Frontend

The NotificationBell is already integrated in the Dashboard!

Look for the 🔔 icon in the top-right corner of the Dashboard.

---

## 🔔 Notification Bell Usage

### Location
**Dashboard** → **Top-right corner** (next to wallet button)

### Features
- Shows unread count badge
- Click to see dropdown with notifications
- Each notification shows:
  - Icon based on type
  - Title and message
  - Time ago
  - Mark as read button
  - Delete button

### Notification Types
- `join_request` 👥 - New join request for your club
- `join_accepted` ✅ - Your request was accepted
- `join_rejected` ❌ - Your request was rejected
- `join_hold` ⏸️ - Your request is on hold
- `payment_verified` 💰 - Payment verified (future)

---

## 📝 Testing Quick Reference

### Test Join Requests

```bash
# 1. User requests to join club
curl -X POST http://localhost:3000/api/join-requests/club/CLUB_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=SESSION" \
  -d '{"message": "I want to join!"}'

# 2. Check owner's notifications
curl http://localhost:3000/api/notifications \
  -H "Cookie: connect.sid=OWNER_SESSION"

# 3. Owner accepts request
curl -X PUT http://localhost:3000/api/join-requests/REQUEST_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=OWNER_SESSION" \
  -d '{"status": "accepted", "ownerMessage": "Welcome!"}'

# 4. Check user's notifications
curl http://localhost:3000/api/notifications \
  -H "Cookie: connect.sid=USER_SESSION"
```

### Test Notifications

```bash
# Get all notifications
curl http://localhost:3000/api/notifications \
  -H "Cookie: connect.sid=SESSION"

# Get only unread
curl http://localhost:3000/api/notifications?unreadOnly=true \
  -H "Cookie: connect.sid=SESSION"

# Mark as read
curl -X PUT http://localhost:3000/api/notifications/NOTIF_ID/read \
  -H "Cookie: connect.sid=SESSION"

# Mark all as read
curl -X PUT http://localhost:3000/api/notifications/read-all \
  -H "Cookie: connect.sid=SESSION"

# Delete
curl -X DELETE http://localhost:3000/api/notifications/NOTIF_ID \
  -H "Cookie: connect.sid=SESSION"
```

### Test Event Payment

```javascript
// Frontend integration example
import { createPaymentTransaction } from '../utils/algorandPayment';
import { useWallet } from '@txnlab/use-wallet-react';

const { activeAddress, signTransactions, sendTransactions } = useWallet();

// 1. Create transaction
const txn = await createPaymentTransaction(
  activeAddress,
  'EVENT_WALLET_ADDRESS',
  1.5, // ALGO amount
  'Event Ticket'
);

// 2. Sign with Pera Wallet
const encoded = algosdk.encodeUnsignedTransaction(txn);
const signed = await signTransactions([encoded]);

// 3. Send to blockchain
const { id: txId } = await sendTransactions(signed);

// 4. Verify on backend
const response = await fetch('/api/payments/event/EVENT_ID/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    transactionId: txId,
    walletAddress: activeAddress
  })
});
```

---

## 🎯 What's Next (Frontend Integration Needed)

### For Join Requests
1. Add "Request to Join" button on club search results
2. Create join request management panel for club owners
3. Show user's request status in UI
4. Integrate owner response form (accept/reject/hold with message)

### For Event Payments
1. Add ticket price display on events
2. Add "Buy Ticket" button on event pages
3. Create payment modal with Pera Wallet integration
4. Show payment success/error messages
5. Display "Already Purchased" badge for paid events

### For Notifications
- ✅ Notification bell with unread count
- ✅ Dropdown panel
- ✅ Mark as read/delete
- 🔲 Full notifications page (optional)
- 🔲 Push notifications (optional)

---

## 🐛 Common Issues

### Notifications Not Showing
**Check:**
1. Database table exists: `SELECT * FROM notifications LIMIT 1;`
2. Backend route registered: Look for `/api/notifications` in server.js
3. Browser console for errors
4. Network tab for API calls

### Join Request Failed
**Check:**
1. Table exists: `SELECT * FROM club_join_requests LIMIT 1;`
2. User not already a member
3. No existing pending request
4. Session cookie valid

### Payment Verification Failed
**Check:**
1. Transaction confirmed on https://testnet.algoexplorer.io/
2. Event has `wallet_address` and `ticket_price`
3. Transaction sent to correct address
4. Amount is sufficient

---

## 📊 Database Tables

### `notifications`
```sql
id              UUID PRIMARY KEY
user_id         UUID → users(id)
type            VARCHAR(50)  -- join_request, join_accepted, etc.
title           VARCHAR(255)
message         TEXT
related_id      UUID         -- club_id, event_id, etc.
related_type    VARCHAR(50)  -- 'club', 'event', etc.
is_read         BOOLEAN DEFAULT FALSE
created_at      TIMESTAMP
```

### `club_join_requests`
```sql
id              UUID PRIMARY KEY
club_id         UUID → clubs(id)
user_id         UUID → users(id)
status          VARCHAR(20)  -- pending, accepted, rejected, hold
message         TEXT         -- user's message
owner_message   TEXT         -- owner's response
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### `event_payments`
```sql
id              UUID PRIMARY KEY
event_id        UUID → events(id)
user_id         UUID → users(id)
transaction_id  VARCHAR(255) UNIQUE  -- Algorand TX ID
amount          NUMERIC
wallet_address  VARCHAR(255)
status          VARCHAR(20)  -- pending, verified, failed
verified_at     TIMESTAMP
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

---

## 🎉 What Works Right Now

✅ **Fully Functional:**
- Notification system (backend + frontend)
- Join request workflow (backend only)
- Payment verification (backend only)
- Notification bell in Dashboard

🔲 **Needs UI:**
- Join request buttons in search results
- Owner management panel
- Payment buttons on events
- Payment modal with wallet integration

---

**See `TESTING_GUIDE.md` for detailed testing instructions!**

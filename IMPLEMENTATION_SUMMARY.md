# Implementation Summary: Join Requests & Payments

## ✅ What's Been Implemented

### 1. Club Join Request System

**Backend (`projects/backend/`):**
- ✅ `migrations/add_join_requests_and_payments.sql` - Database schema
- ✅ `routes/join-requests.js` - Complete API for join request management

**Database Table:** `club_join_requests`
- Tracks user requests to join clubs
- Status: pending, accepted, rejected, hold
- Supports messaging between users and owners

**API Endpoints:**
- `POST /api/join-requests/club/:clubId` - User requests to join
- `GET /api/join-requests/club/:clubId` - Owner views requests
- `PUT /api/join-requests/:requestId` - Owner accepts/rejects/holds
- `GET /api/join-requests/my-requests` - User views their requests

**Workflow:**
1. User searches for club
2. User clicks "Request to Join" (add this button in frontend)
3. Owner receives request
4. Owner can: **Accept** (user becomes member), **Reject** (with message), or **Hold** (ask for more info)

---

### 2. Event Payment System with Algorand

**Backend (`projects/backend/`):**
- ✅ `routes/payments.js` - Algorand transaction verification
- ✅ `utils/algorand.js` - Wallet generation utilities (already existed)

**Frontend (`projects/frontend/`):**
- ✅ `utils/algorandPayment.ts` - Payment transaction creation utilities

**Database Table:** `event_payments`
- Tracks Algorand transactions for event tickets
- Verifies transactions on blockchain
- Status: pending, verified, failed

**API Endpoints:**
- `GET /api/payments/event/:eventId/details` - Get payment info
- `POST /api/payments/event/:eventId/verify` - Verify transaction and grant access
- `GET /api/payments/my-payments` - View payment history

**Workflow:**
1. Event has `ticket_price` and `wallet_address` set
2. User sees event with price
3. User connects Pera Wallet (already integrated)
4. User clicks "Buy Ticket"
5. Frontend creates Algorand payment transaction
6. User signs with Pera Wallet
7. Transaction sent to blockchain
8. Backend verifies transaction:
   - Checks it exists on Algorand TestNet
   - Verifies receiver = event wallet
   - Verifies amount >= ticket price
   - Ensures transaction not reused
9. Backend adds user to event members
10. User gains access!

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Run Database Migration

**Supabase SQL Editor:**
```sql
-- Run the entire file
-- projects/backend/migrations/add_join_requests_and_payments.sql
```

This creates:
- `club_join_requests` table
- `event_payments` table
- All necessary indexes

### Step 2: Verify Backend Routes

Backend routes are already registered in `server.js`:
- ✅ `/api/join-requests/*`
- ✅ `/api/payments/*`

Backend is ready to use!

### Step 3: Frontend Integration (TODO)

You need to add UI components for:

**For Join Requests:**
- "Request to Join" button on club search results
- Join request management UI for club owners
- Status display for pending requests

**For Event Payments:**
- Show ticket price on events
- "Buy Ticket" button with Pera Wallet integration
- Payment flow modal
- Success/error handling

---

## 📋 Example Frontend: Event Payment

```typescript
import { useWallet } from '@txnlab/use-wallet-react';
import { createPaymentTransaction, waitForConfirmation } from '../utils/algorandPayment';
import algosdk from 'algosdk';
import axios from 'axios';

const BuyTicketButton = ({ event }) => {
  const { activeAddress, signTransactions, sendTransactions } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleBuyTicket = async () => {
    if (!activeAddress) {
      alert('Please connect your Pera Wallet first!');
      return;
    }

    try {
      setLoading(true);

      // 1. Get payment details
      const { data } = await axios.get(
        `/api/payments/event/${event.id}/details`,
        { withCredentials: true }
      );

      if (data.alreadyPaid) {
        alert('You already own a ticket!');
        return;
      }

      // 2. Create Algorand transaction
      const txn = await createPaymentTransaction(
        activeAddress,              // From: user's wallet
        data.event.walletAddress,   // To: event's wallet
        data.event.ticketPrice,     // Amount in ALGO
        `Ticket: ${event.title}`    // Note
      );

      // 3. Sign with Pera Wallet
      const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
      const signedTxns = await signTransactions([encodedTxn]);

      // 4. Send to blockchain
      const { id: txId } = await sendTransactions(signedTxns);
      console.log('Transaction ID:', txId);

      // 5. Wait for confirmation (optional but recommended)
      await waitForConfirmation(txId);

      // 6. Verify on backend
      const verifyRes = await axios.post(
        `/api/payments/event/${event.id}/verify`,
        {
          transactionId: txId,
          walletAddress: activeAddress
        },
        { withCredentials: true }
      );

      if (verifyRes.data.success) {
        alert('✅ Payment successful! Welcome to the event!');
        // Refresh or redirect to event page
        window.location.reload();
      }

    } catch (error) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBuyTicket}
      disabled={loading || !activeAddress}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
    >
      {loading ? 'Processing...' : `Buy Ticket (${event.ticketPrice} ALGO)`}
    </button>
  );
};
```

---

## 🧪 Testing Instructions

### Test Club Join Requests

1. **Create a club** (as User A)
2. **Login as different user** (User B)
3. **Make request**:
   ```bash
   curl -X POST http://localhost:3000/api/join-requests/club/CLUB_ID \
     -H "Content-Type: application/json" \
     -b "connect.sid=SESSION_COOKIE" \
     -d '{"message": "I want to join!"}'
   ```
4. **Login as owner** (User A)
5. **View requests**:
   ```bash
   curl http://localhost:3000/api/join-requests/club/CLUB_ID \
     -b "connect.sid=SESSION_COOKIE"
   ```
6. **Accept request**:
   ```bash
   curl -X PUT http://localhost:3000/api/join-requests/REQUEST_ID \
     -H "Content-Type: application/json" \
     -b "connect.sid=SESSION_COOKIE" \
     -d '{"status": "accepted", "ownerMessage": "Welcome!"}'
   ```

### Test Event Payments

1. **Setup event with payment**:
   - Set `ticket_price = 1` ALGO
   - Generate wallet: `node -e "import('./projects/backend/utils/algorand.js').then(m => console.log(m.generateWallet()))"`
   - Update event's `wallet_address`

2. **Get TestNet ALGO**:
   - Go to: https://bank.testnet.algorand.network/
   - Dispense to your Pera Wallet

3. **Make payment** (use frontend or test script)

4. **Verify**:
   ```sql
   SELECT * FROM event_payments WHERE event_id = 'EVENT_ID';
   SELECT * FROM event_members WHERE event_id = 'EVENT_ID';
   ```

---

## 📁 Files Created

```
projects/backend/
├── migrations/
│   └── add_join_requests_and_payments.sql
├── routes/
│   ├── join-requests.js (NEW)
│   └── payments.js (NEW)
├── utils/
│   └── algorand.js (already existed)
└── server.js (updated)

projects/frontend/
└── src/
    └── utils/
        └── algorandPayment.ts (NEW)

Documentation/
└── JOIN_REQUESTS_AND_PAYMENTS.md (comprehensive guide)
```

---

## 🎯 Next Steps

### Immediate:
1. Run the SQL migration in Supabase
2. Test backend APIs with curl/Postman
3. Generate event wallets for events with ticket prices

### Frontend Integration:
1. Add "Request to Join" button in search results for clubs
2. Create join request management UI for club owners
3. Add payment button for events with ticket prices
4. Implement payment modal with Pera Wallet integration
5. Add payment status indicators

---

## 🔐 Security Notes

- ✅ All endpoints require authentication
- ✅ Owner-only actions verified server-side
- ✅ Transactions verified on Algorand blockchain
- ✅ Double-spending prevented (unique transaction IDs)
- ✅ Amount and receiver validated
- ⚠️ Event wallet private keys must be stored securely (for withdrawals)

---

**Documentation:** See `JOIN_REQUESTS_AND_PAYMENTS.md` for complete API reference and examples.

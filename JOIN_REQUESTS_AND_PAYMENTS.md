# Club Join Requests & Event Payment System

## 🎯 Complete Implementation Guide

This guide covers two major features:
1. **Club Join Request System** - Request-based membership approval
2. **Event Payment System** - Algorand-based ticket purchases

---

## Part 1: Club Join Request System

### Database Setup

Run this SQL in **Supabase SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS club_join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  message TEXT,
  owner_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(club_id, user_id),
  CHECK (status IN ('pending', 'accepted', 'rejected', 'hold'))
);

CREATE INDEX IF NOT EXISTS idx_club_join_requests_club_id ON club_join_requests(club_id);
CREATE INDEX IF NOT EXISTS idx_club_join_requests_user_id ON club_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_club_join_requests_status ON club_join_requests(status);
```

### API Endpoints

#### 1. Request to Join Club
```http
POST /api/join-requests/club/:clubId
Authorization: Required (session)
Content-Type: application/json

Body:
{
  "message": "I'd like to join this club!" // Optional
}

Response:
{
  "success": true,
  "message": "Join request sent successfully",
  "request": { ... }
}
```

#### 2. Get Join Requests (Owner Only)
```http
GET /api/join-requests/club/:clubId?status=pending
Authorization: Required (owner)

Response:
{
  "success": true,
  "requests": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "status": "pending",
      "message": "User's message",
      "created_at": "2024-01-01T00:00:00Z",
      "users": {
        "name": "John Doe",
        "email": "john@example.com",
        "avatar_url": "..."
      }
    }
  ]
}
```

#### 3. Manage Join Request (Owner Only)
```http
PUT /api/join-requests/:requestId
Authorization: Required (owner)
Content-Type: application/json

Body:
{
  "status": "accepted" | "rejected" | "hold",
  "ownerMessage": "Welcome to the club!" // Optional
}

Response (if accepted):
{
  "success": true,
  "message": "User added to club successfully"
}

Response (if rejected/hold):
{
  "success": true,
  "message": "Request rejected",
  "request": { ... }
}
```

#### 4. Get My Join Requests
```http
GET /api/join-requests/my-requests
Authorization: Required

Response:
{
  "success": true,
  "requests": [
    {
      "id": "uuid",
      "status": "pending",
      "message": "My message",
      "owner_message": null,
      "clubs": {
        "name": "Coding Club",
        "logo_url": "..."
      }
    }
  ]
}
```

### Workflow

1. **User** searches for a club
2. **User** clicks "Request to Join" button
3. **System** creates a `pending` join request
4. **Owner** receives notification (implement in frontend)
5. **Owner** views requests in club settings
6. **Owner** can:
   - **Accept**: User is added to `club_members` with `role='member'`, request deleted
   - **Reject**: Request status changes to `rejected`, owner can add message
   - **Hold**: Request status changes to `hold`, owner can add message for more info
7. **User** can view status of their requests

---

## Part 2: Event Payment System

### Database Setup

Run this SQL in **Supabase SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS event_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  transaction_id VARCHAR(255) NOT NULL,
  amount NUMERIC NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(transaction_id),
  CHECK (status IN ('pending', 'verified', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_event_payments_event_id ON event_payments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_user_id ON event_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_transaction_id ON event_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_status ON event_payments(status);
```

### Prerequisites

Events must have:
- `ticket_price` (NUMERIC) - Price in ALGO
- `wallet_address` (VARCHAR) - Algorand wallet to receive payments

You can generate event wallets using:
```javascript
import { generateWallet } from './utils/algorand.js';

const eventWallet = generateWallet();
// Store eventWallet.address in events.wallet_address
// Store eventWallet.secretKey securely (for withdrawals)
```

### API Endpoints

#### 1. Get Payment Details
```http
GET /api/payments/event/:eventId/details
Authorization: Required

Response:
{
  "success": true,
  "event": {
    "id": "uuid",
    "title": "HackFest 2026",
    "ticketPrice": 5.5,
    "walletAddress": "ABCD...XYZ"
  },
  "alreadyPaid": false,
  "alreadyMember": false
}
```

#### 2. Verify Payment
```http
POST /api/payments/event/:eventId/verify
Authorization: Required
Content-Type: application/json

Body:
{
  "transactionId": "ABC123...",
  "walletAddress": "USER_WALLET_ADDRESS"
}

Response:
{
  "success": true,
  "message": "Payment verified! You now have access to the event.",
  "payment": {
    "transactionId": "ABC123...",
    "amount": 5.5,
    "verified": true
  }
}
```

#### 3. Get My Payments
```http
GET /api/payments/my-payments
Authorization: Required

Response:
{
  "success": true,
  "payments": [
    {
      "id": "uuid",
      "transaction_id": "ABC123...",
      "amount": 5.5,
      "status": "verified",
      "verified_at": "2024-01-01T00:00:00Z",
      "events": {
        "title": "HackFest 2026",
        "banner_url": "..."
      }
    }
  ]
}
```

### Payment Flow

1. **User** searches for event and sees ticket price
2. **User** clicks "Buy Ticket" button
3. **Frontend** fetches payment details from `/api/payments/event/:eventId/details`
4. **Frontend** connects to Pera Wallet
5. **Frontend** creates Algorand payment transaction:
   ```javascript
   import { createPaymentTransaction } from './utils/algorandPayment';
   import { useWallet } from '@txnlab/use-wallet-react';
   
   const { activeAddress, signTransactions, sendTransactions } = useWallet();
   
   // Create transaction
   const txn = await createPaymentTransaction(
     activeAddress,           // User's wallet
     event.walletAddress,     // Event's wallet
     event.ticketPrice,       // Amount in ALGO
     `Ticket for ${event.title}` // Note
   );
   
   // Sign transaction with Pera Wallet
   const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
   const signedTxns = await signTransactions([encodedTxn]);
   
   // Send transaction  
   const { id } = await sendTransactions(signedTxns);
   ```

6. **Frontend** sends transaction ID to backend `/api/payments/event/:eventId/verify`
7. **Backend** verifies transaction on Algorand blockchain:
   - Checks transaction exists
   - Verifies receiver = event wallet
   - Verifies amount >= ticket price
   - Checks transaction not already used
8. **Backend** creates `event_payments` record with `status='verified'`
9. **Backend** adds user to `event_members` with `role='member'`
10. **User** gains access to event!

### Transaction Verification Logic

The backend uses `algosdk` to verify transactions:

```javascript
// Fetch transaction from blockchain
const transaction = await algodClient.pendingTransactionInformation(transactionId).do();

// Extract details
const txAmount = transaction['txn']['txn']['amt']; // microAlgos
const txReceiver = transaction['txn']['txn']['rcv']; // base64
const txSender = transaction['txn']['txn']['snd']; // base64

// Validate
const receiverAddress = algosdk.encodeAddress(Buffer.from(txReceiver, 'base64'));
const expectedAmount = ticketPrice * 1000000; // Convert ALGO to microAlgos

if (receiverAddress !== eventWalletAddress) {
  // FAIL: Wrong receiver
}

if (txAmount < expectedAmount) {
  // FAIL: Insufficient amount
}

// SUCCESS: Transaction verified!
```

---

## 🎨 Frontend Implementation

### Search Results Integration

When displaying search results, show:

**For Clubs:**
- "Request to Join" button if not a member
- "Requested" badge if request pending
- Handle request submission

**For Events:**
- Ticket price badge
- "Buy Ticket (X ALGO)" button
- Payment flow modal

### Example: Event Payment Component

```typescript
import { useWallet } from '@txnlab/use-wallet-react';
import { createPaymentTransaction, waitForConfirmation } from '../utils/algorandPayment';
import algosdk from 'algosdk';
import axios from 'axios';

const EventPaymentButton = ({ event }) => {
  const { activeAddress, signTransactions, sendTransactions } = useWallet();
  const [paying, setPaying] = useState(false);

  const handlePayment = async () => {
    try {
      setPaying(true);

      // 1. Get payment details
      const { data } = await axios.get(`/api/payments/event/${event.id}/details`, {
        withCredentials: true
      });

      if (data.alreadyPaid) {
        alert('You already have access to this event!');
        return;
      }

      // 2. Create transaction
      const txn = await createPaymentTransaction(
        activeAddress,
        data.event.walletAddress,
        data.event.ticketPrice,
        `Ticket: ${data.event.title}`
      );

      // 3. Sign with Pera Wallet
      const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
      const signedTxns = await signTransactions([encodedTxn]);

      // 4. Send transaction
      const { id: txId } = await sendTransactions(signedTxns);

      // 5. Wait for confirmation
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
        alert('Payment successful! You now have access.');
        window.location.reload();
      }

    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <button onClick={handlePayment} disabled={paying || !activeAddress}>
      {paying ? 'Processing...' : `Buy Ticket (${event.ticketPrice} ALGO)`}
    </button>
  );
};
```

---

## 🧪 Testing

### Test Club Join Requests

1. Create a club as User A
2. Login as User B
3. Search for the club
4. Click "Request to Join"
5. Login back as User A
6. View join requests in club settings
7. Accept/Reject/Hold the request
8. Login as User B and check status

### Test Event Payments

1. **Setup**:
   - Create event with `ticket_price = 1` ALGO
   - Generate wallet for event: `generateWallet()`
   - Update event's `wallet_address`
   - Fund the event wallet with 0 ALGO (just to create account on TestNet)

2. **Get TestNet ALGO**:
   - Go to: https://bank.testnet.algorand.network/
   - Enter your Pera Wallet address
   - Click "Dispense"
   - Wait for funds

3. **Make Payment**:
   - Search for the event
   - Connect Pera Wallet
   - Click "Buy Ticket"
   - Approve transaction in Pera Wallet
   - Wait for verification
   - Check event access granted!

4. **Verify**:
   - Check `event_payments` table has verified record
   - Check `event_members` table has your entry
   - Check event wallet received payment

---

## 🐛 Troubleshooting

### Join Requests Not Working

**Check**: Database table exists
```sql
SELECT * FROM club_join_requests LIMIT 1;
```

**Check**: User is not already a member
```sql
SELECT * FROM club_members WHERE club_id = 'CLUB_ID' AND user_id = 'USER_ID';
```

### Payment Verification Failing

**Check 1**: Transaction confirmed on blockchain
- Go to: https://testnet.algoexplorer.io/
- Search for transaction ID
- Verify it exists and is confirmed

**Check 2**: Correct wallet address
- Event's `wallet_address` must match transaction receiver

**Check 3**: Sufficient amount
- Transaction amount >= ticket price

**Check 4**: Transaction not already used
```sql
SELECT * FROM event_payments WHERE transaction_id = 'TX_ID';
```

### Pera Wallet Not Connecting

**Check 1**: Network configuration
- Frontend must be on TestNet (check `.env`)
- Pera Wallet must be on TestNet

**Check 2**: Wallet has funds
- Get TestNet ALGO from faucet

---

## 📊 Database Schema Overview

```
club_join_requests
├── id (UUID)
├── club_id (FK → clubs.id)
├── user_id (FK → users.id)
├── status (pending/accepted/rejected/hold)
├── message (user's message)
├── owner_message (owner's response)
├── created_at
└── updated_at

event_payments
├── id (UUID)
├── event_id (FK → events.id)
├── user_id (FK → users.id)
├── transaction_id (Algorand TX ID)
├── amount (ALGO)
├── wallet_address (user's wallet)
├── status (pending/verified/failed)
├── verified_at
├── created_at
└── updated_at
```

---

**Need Help?** Check backend logs and browser console for detailed error messages!

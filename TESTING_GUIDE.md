# Complete Testing Guide: Join Requests & Payments

## 🎯 Prerequisites

### 1. Run All Database Migrations

In **Supabase SQL Editor**, run these migrations in order:

```sql
-- Migration 1: Join Requests & Payments Tables
-- Copy & paste projects/backend/migrations/add_join_requests_and_payments.sql

-- Migration 2: Notifications Table  
-- Copy & paste projects/backend/migrations/add_notifications.sql
```

### 2. Verify Backend is Running

```bash
cd projects/backend
npm start  # Should be running on port 3000
```

### 3. Verify Frontend is Running

```bash
cd projects/frontend
npm run dev  # Should be running on port 5173
```

---

## 🧪 Part 1: Testing Club Join Requests with Notifications

### Test Scenario: User Requests to Join Club

#### Step 1: Create a Club (as Owner)
1. Login as **User A** (email: usera@test.com)
2. Create a club called "Coding Club"
3. Note the club ID from Dashboard or database

#### Step 2: Request to Join (as Regular User)
1. Logout and login as **User B** (email: userb@test.com)
2. **Using cURL** (since frontend UI not yet integrated):

```bash
# Replace SESSION_COOKIE with your actual session cookie from browser
# Replace CLUB_ID with actual club ID

curl -X POST http://localhost:3000/api/join-requests/club/CLUB_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{"message": "I love coding and would like to join!"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Join request sent successfully",
  "request": {
    "id": "uuid",
    "club_id": "uuid",
    "user_id": "uuid",
    "status": "pending",
    "message": "I love coding and would like to join!",
    "created_at": "..."
  }
}
```

#### Step 3: Check Owner's Notifications
```bash
# Login as User A and get notifications
curl http://localhost:3000/api/notifications \
  -H "Cookie: connect.sid=OWNER_SESSION_COOKIE"
```

**Expected Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "type": "join_request",
      "title": "New join request for Coding Club",
      "message": "User B has requested to join your club: I love coding and would like to join!",
      "is_read": false,
      "created_at": "..."
    }
  ],
  "unreadCount": 1
}
```

#### Step 4: Owner Views Join Requests
```bash
# As User A (owner)
curl http://localhost:3000/api/join-requests/club/CLUB_ID \
  -H "Cookie: connect.sid=OWNER_SESSION_COOKIE"
```

**Expected Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "REQUEST_ID",
      "club_id": "CLUB_ID",
      "user_id": "USER_B_ID",
      "status": "pending",
      "message": "I love coding and would like to join!",
      "users": {
        "name": "User B",
        "email": "userb@test.com",
        "avatar_url": null
      }
    }
  ]
}
```

#### Step 5: Owner Accepts Request
```bash
# As User A (owner), accept the request
curl -X PUT http://localhost:3000/api/join-requests/REQUEST_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=OWNER_SESSION_COOKIE" \
  -d '{"status": "accepted", "ownerMessage": "Welcome to Coding Club!"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User added to club successfully"
}
```

#### Step 6: Check User B's Notifications
```bash
# As User B
curl http://localhost:3000/api/notifications \
  -H "Cookie: connect.sid=USER_B_SESSION_COOKIE"
```

**Expected Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "type": "join_accepted",
      "title": "Join request accepted",
      "message": "Your join request for Coding Club has been accepted! Welcome to Coding Club!",
      "is_read": false
    }
  ],
  "unreadCount": 1
}
```

#### Step 7: Verify Membership
```sql
-- In Supabase SQL Editor
SELECT * FROM club_members 
WHERE club_id = 'CLUB_ID' AND user_id = 'USER_B_ID';
```

**Expected:** One row showing User B as a member of the club

---

### Test Scenario: Owner Rejects Request

Repeat Steps 1-4, then:

```bash
# Owner rejects with message
curl -X PUT http://localhost:3000/api/join-requests/REQUEST_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=OWNER_SESSION_COOKIE" \
  -d '{"status": "rejected", "ownerMessage": "Sorry, club is full."}'
```

Check User B's notifications:
```json
{
  "type": "join_rejected",
  "title": "Join request rejected",
  "message": "Your join request for Coding Club was rejected. Sorry, club is full."
}
```

---

### Test Scenario: Owner Puts Request on Hold

```bash
# Owner puts on hold
curl -X PUT http://localhost:3000/api/join-requests/REQUEST_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=OWNER_SESSION_COOKIE" \
  -d '{"status": "hold", "ownerMessage": "Please send me your GitHub profile."}'
```

Check User B's notifications:
```json
{
  "type": "join_hold",
  "title": "Join request on hold",
  "message": "Your join request for Coding Club is on hold. Please send me your GitHub profile."
}
```

---

## 🪙 Part 2: Testing Event Payments with Algorand

### Prerequisites for Payment Testing

1. **Create Event Wallet**

```bash
cd projects/backend
node -e "import('./utils/algorand.js').then(m => { const w = m.generateWallet(); console.log('Address:', w.address); console.log('Save this mnemonic:', w.secretKey); })"
```

**Output:**
```
--- NEW WALLET GENERATED ---
Public Address: ABCDEFG123...XYZ789
Mnemonic Phrase (KEEP SECURE): word1 word2 ... word24
----------------------------
```

**Save both**: You'll need the address for the event, and mnemonic to withdraw funds later.

2. **Fund the Wallet (TestNet)**
   - Go to: https://bank.testnet.algorand.network/
   - Paste the wallet address
   - Click "Dispense"
   - Wait for confirmation

3. **Create Event with Payment**

In Supabase or via API:
```sql
UPDATE events 
SET ticket_price = 1.5,
    wallet_address = 'YOUR_EVENT_WALLET_ADDRESS'
WHERE id = 'YOUR_EVENT_ID';
```

4. **Get TestNet ALGO for User**
   - Install Pera Wallet on your phone or browser
   - Switch to TestNet
   - Go to faucet and fund your wallet
   - Connect Pera Wallet to your app

---

### Test Scenario: User Pays for Event Ticket

#### Step 1: Get Payment Details

```bash
curl http://localhost:3000/api/payments/event/EVENT_ID/details \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

**Expected Response:**
```json
{
  "success": true,
  "event": {
    "id": "uuid",
    "title": "HackFest 2026",
    "ticketPrice": 1.5,
    "walletAddress": "ABCDEFG...XYZ"
  },
  "alreadyPaid": false,
  "alreadyMember": false
}
```

#### Step 2: Make Payment (Frontend Integration Required)

You'll need to integrate this into your frontend. Here's the logic:

```typescript
import { useWallet } from '@txnlab/use-wallet-react';
import { createPaymentTransaction, waitForConfirmation } from '../utils/algorandPayment';
import algosdk from 'algosdk';

// In your component
const { activeAddress, signTransactions, sendTransactions } = useWallet();

async function handlePayment() {
  // 1. Get event details
  const response = await fetch(`/api/payments/event/${eventId}/details`, {
    credentials: 'include'
  });
  const { event } = await response.json();

  // 2. Create transaction
  const txn = await createPaymentTransaction(
    activeAddress,
    event.walletAddress,
    event.ticketPrice,
    `Ticket: ${event.title}`
  );

  // 3. Encode and sign
  const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
  const signedTxns = await signTransactions([encodedTxn]);

  // 4. Send transaction
  const { id: txId } = await sendTransactions(signedTxns);
  console.log('Transaction ID:', txId);

  // 5. Wait for confirmation (optional but recommended)
  await waitForConfirmation(txId);

  // 6. Verify on backend
  const verifyResponse = await fetch(`/api/payments/event/${eventId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      transactionId: txId,
      walletAddress: activeAddress
    })
  });

  const result = await verifyResponse.json();
  if (result.success) {
    alert('Payment successful! You now have access to the event!');
  }
}
```

#### Step 3: Manual Testing with AlgoSDK

If you want to test without full frontend integration:

1. Install Algorand.js SDK globally:
```bash
npm install -g algosdk
```

2. Create a test script `test_payment.js`:

```javascript
import algosdk from 'algosdk';

const algodToken = '';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = '';

const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

// Your wallet mnemonic (from Pera Wallet or generated)
const mnemonic = "your 25-word mnemonic phrase here";
const account = algosdk.mnemonicToSecretKey(mnemonic);

// Event wallet address
const eventWallet = "EVENT_WALLET_ADDRESS";
const amount = 1.5; // ALGO

async function sendPayment() {
  try {
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: account.addr,
      receiver: eventWallet,
      amount: algosdk.algosToMicroalgos(amount),
      note: new Uint8Array(Buffer.from("Ticket: HackFest 2026")),
      suggestedParams
    });

    const signedTxn = txn.signTxn(account.sk);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();

    console.log("Transaction ID:", txId);
    console.log("Use this to verify on backend!");

    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    console.log("Transaction confirmed in round:", confirmedTxn["confirmed-round"]);

    return txId;
  } catch (error) {
    console.error("Error:", error);
  }
}

sendPayment();
```

3. Run it:
```bash
node test_payment.js
```

#### Step 4: Verify Payment on Backend

```bash
curl -X POST http://localhost:3000/api/payments/event/EVENT_ID/verify \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "transactionId": "TRANSACTION_ID_FROM_STEP_3",
    "walletAddress": "YOUR_WALLET_ADDRESS"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Payment verified! You now have access to the event.",
  "payment": {
    "transactionId": "ABC123...",
    "amount": 1.5,
    "verified": true
  }
}
```

#### Step 5: Verify in Database

```sql
-- Check payment record
SELECT * FROM event_payments WHERE event_id = 'EVENT_ID';

-- Check event membership
SELECT * FROM event_members WHERE event_id = 'EVENT_ID' AND user_id = 'YOUR_USER_ID';
```

#### Step 6: Verify on Blockchain

Go to: https://testnet.algoexplorer.io/
Search for your transaction ID
Verify:
- ✅ Transaction confirmed
- ✅ Sender = your wallet
- ✅ Receiver = event wallet
- ✅ Amount = ticket price

---

## 🔍 Testing Notifications API

### Get All Notifications

```bash
curl http://localhost:3000/api/notifications \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### Get Only Unread Notifications

```bash
curl http://localhost:3000/api/notifications?unreadOnly=true \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### Mark Notification as Read

```bash
curl -X PUT http://localhost:3000/api/notifications/NOTIFICATION_ID/read \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### Mark All as Read

```bash
curl -X PUT http://localhost:3000/api/notifications/read-all \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

### Delete a Notification

```bash
curl -X DELETE http://localhost:3000/api/notifications/NOTIFICATION_ID \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Transaction Not Found

**Error:** "Transaction not found on blockchain"

**Solutions:**
1. Wait 5-10 seconds after sending transaction
2. Verify transaction on https://testnet.algoexplorer.io/
3. Ensure wallet has sufficient ALGO (balance + fee)
4. Check you're using TestNet, not MainNet

### Issue 2: Invalid Receiver Address

**Error:** "Transaction receiver does not match event wallet address"

**Solutions:**
1. Verify event's `wallet_address` in database
2. Ensure you sent to correct wallet
3. Check for typos in addresses

### Issue 3: Insufficient Amount

**Error:** "Insufficient payment amount"

**Solutions:**
1. Check event's `ticket_price` in database
2. Ensure you sent exactly that amount or more
3. Remember amounts are in ALGO, not microAlgos

### Issue 4: Request Already Exists

**Error:** "You already have a pending request for this club"

**Solutions:**
1. Check status of existing request
2. If rejected, delete old request first:
   ```sql
   DELETE FROM club_join_requests 
   WHERE club_id = 'CLUB_ID' AND user_id = 'USER_ID';
   ```

### Issue 5: Notifications Not Appearing

**Solutions:**
1. Check database table exists:
   ```sql
   SELECT * FROM notifications LIMIT 1;
   ```
2. Verify notification was created:
   ```sql
   SELECT * FROM notifications 
   WHERE user_id = 'YOUR_USER_ID' 
   ORDER BY created_at DESC;
   ```
3. Check session cookie is valid

---

## ✅ Complete Feature Checklist

### Join Requests
- [ ] User can request to join club
- [ ] Owner receives notification
- [ ] Owner can view all requests
- [ ] Owner can accept request (user becomes member)
- [ ] Owner can reject request with message
- [ ] Owner can put request on hold with message
- [ ] User receives notification for all responses
- [ ] Notifications show in UI (needs frontend)

### Event Payments
- [ ] Event has ticket_price and wallet_address
- [ ] User can see payment requirements
- [ ] User can connect Pera Wallet
- [ ] User can make payment via Algorand
- [ ] Backend verifies transaction on blockchain
- [ ] Backend checks receiver, amount, uniqueness
- [ ] User added to event_members on success
- [ ] Payment history tracked in database
- [ ] Failed transactions recorded with reason

### Notifications
- [ ] Notifications created for join requests
- [ ] Notifications created for owner responses
- [ ] Users can fetch notifications
- [ ] Users can mark as read
- [ ] Users can delete notifications
- [ ] Unread count displayed (needs frontend)
- [ ] Notifications show in UI bell icon (needs frontend)

---

## 📊 Testing Summary

Run tests in this order:

1. **Database Setup** - Run migrations
2. **Join Requests** - Test create, view, accept/reject/hold
3. **Notifications** - Verify owner and user receive notifications
4. **Event Wallet Setup** - Generate and fund wallet
5. **Payment Flow** - Test transaction creation and verification
6. **Error Cases** - Test invalid transactions, duplicate payments

---

**Need Help?** Check backend console logs and browser console for detailed error messages!

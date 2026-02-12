import express from 'express';
import { supabase } from '../config/supabase.js';
import { checkBalance } from '../utils/algorand.js';
import algosdk from 'algosdk';

const router = express.Router();

// Algod Configuration for TestNet
const ALGOD_TOKEN = '';
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = '';

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    next();
};

/**
 * @route   POST /api/payments/event/:eventId/join-free
 * @desc    Join a free event (no payment required)
 * @access  Private
 */
router.post('/event/:eventId/join-free', requireAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.session.userId;

        // Get event details
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, title, ticket_price')
            .eq('id', eventId)
            .single();

        if (eventError || !event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if event is actually free
        if (event.ticket_price && event.ticket_price > 0) {
            return res.status(400).json({
                success: false,
                message: 'This event requires payment'
            });
        }

        // Check if already a member
        const { data: existingMember } = await supabase
            .from('event_members')
            .select('id')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .single();

        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: 'You are already a member of this event'
            });
        }

        // Add user to event
        const { error: memberError } = await supabase
            .from('event_members')
            .insert({
                event_id: eventId,
                user_id: userId,
                role: 'member'
            });

        if (memberError) {
            console.error('Error adding event member:', memberError);
            return res.status(500).json({
                success: false,
                message: 'Failed to join event',
                error: memberError.message
            });
        }

        res.json({
            success: true,
            message: 'Successfully joined the event!'
        });

    } catch (error) {
        console.error('Join free event error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/payments/event/:eventId/details
 * @desc    Get payment details for an event
 * @access  Private
 */
router.get('/event/:eventId/details', requireAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.session.userId;

        // Get event details
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, title, ticket_price, wallet_address')
            .eq('id', eventId)
            .single();

        if (eventError || !event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if user already paid
        const { data: existingPayment } = await supabase
            .from('event_payments')
            .select('id, status, amount, created_at')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .eq('status', 'verified')
            .single();

        if (existingPayment) {
            return res.json({
                success: true,
                alreadyPaid: true,
                payment: existingPayment
            });
        }

        // Check if user is already a member (owner, volunteer)
        const { data: membership } = await supabase
            .from('event_members')
            .select('role')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .single();

        if (membership) {
            return res.json({
                success: true,
                alreadyMember: true,
                role: membership.role
            });
        }

        res.json({
            success: true,
            event: {
                id: event.id,
                title: event.title,
                ticketPrice: event.ticket_price,
                walletAddress: event.wallet_address
            },
            alreadyPaid: false,
            alreadyMember: false
        });

    } catch (error) {
        console.error('Get payment details error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/payments/event/:eventId/verify
 * @desc    Verify Algorand transaction and grant event access
 * @access  Private
 */
router.post('/event/:eventId/verify', requireAuth, async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.session.userId;
        const { transactionId, walletAddress } = req.body;

        if (!transactionId || !walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Transaction ID and wallet address are required'
            });
        }

        // Get event details
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, title, ticket_price, wallet_address')
            .eq('id', eventId)
            .single();

        if (eventError || !event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (!event.wallet_address) {
            return res.status(400).json({
                success: false,
                message: 'Event does not have a payment wallet configured'
            });
        }

        if (!event.ticket_price || event.ticket_price <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Event does not require payment'
            });
        }

        // Check if transaction already used
        const { data: existingPayment } = await supabase
            .from('event_payments')
            .select('id')
            .eq('transaction_id', transactionId)
            .single();

        if (existingPayment) {
            return res.status(400).json({
                success: false,
                message: 'This transaction has already been used'
            });
        }

        // Verify transaction on Algorand blockchain
        let transaction;
        try {
            transaction = await algodClient.pendingTransactionInformation(transactionId).do();
        } catch (txError) {
            console.error('Transaction lookup error:', txError);

            // Create pending payment record
            await supabase
                .from('event_payments')
                .insert({
                    event_id: eventId,
                    user_id: userId,
                    transaction_id: transactionId,
                    wallet_address: walletAddress,
                    amount: event.ticket_price,
                    status: 'failed'
                });

            return res.status(400).json({
                success: false,
                message: 'Transaction not found on blockchain. Please ensure the transaction is confirmed.',
                error: txError.message
            });
        }

        // Verify transaction details
        console.log('Transaction info:', JSON.stringify(transaction, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value, 2));

        if (!transaction) {
            throw new Error('Invalid transaction structure returned from Algod');
        }

        // Robustly find transaction body
        let txnBody = transaction.txn; // Default path
        if (transaction.txn && transaction.txn.txn) {
            txnBody = transaction.txn.txn; // Standard path
        } else if (transaction.transaction && transaction.transaction.txn) {
            txnBody = transaction.transaction.txn; // Alternative path
        }

        if (!txnBody) {
            console.error('Invalid structure:', transaction);
            throw new Error('Could not find transaction body in response');
        }

        console.log('Transaction Body:', JSON.stringify(txnBody, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value, 2));

        let rawAmount = txnBody.amt ?? txnBody.amount;
        let rawReceiver = txnBody.rcv ?? txnBody.receiver;
        let rawSender = txnBody.snd ?? txnBody.sender;

        // Handle nested payment structure (seen in recent logs)
        if (txnBody.payment) {
            rawAmount = txnBody.payment.amount ?? rawAmount;
            rawReceiver = txnBody.payment.receiver ?? rawReceiver;
        }

        // Handle nested publicKey structure (common in some SDK versions)
        if (rawReceiver && rawReceiver.publicKey) {
            rawReceiver = rawReceiver.publicKey;
        }

        if (rawSender && rawSender.publicKey) { // Also normalize sender if needed
            rawSender = rawSender.publicKey;
        }

        const txAmount = rawAmount !== undefined ? Number(rawAmount) : undefined;
        const txReceiver = rawReceiver;
        const txSender = rawSender;

        // Check if it's a payment transaction (if type is present)
        if (txnBody.type && txnBody.type !== 'pay') {
            return res.status(400).json({
                success: false,
                message: 'Transaction is not a payment transaction'
            });
        }



        if (txReceiver === undefined) {
            throw new Error('Transaction receiver (rcv) is missing');
        }

        if (txAmount === undefined) {
            throw new Error('Transaction amount (amt) is missing');
        }

        // Convert ALGO to microAlgos for comparison
        const expectedAmount = event.ticket_price * 1000000;

        // Verify receiver matches event wallet
        // txReceiver might be Buffer (Uint8Array) or base64 string or address string
        let receiverAddress;
        if (typeof txReceiver === 'string' && txReceiver.length === 58) {
            // It's likely an address string already
            receiverAddress = txReceiver;
        } else {
            // If Buffer or base64 string
            try {
                const buffer = Buffer.isBuffer(txReceiver) ? txReceiver : Buffer.from(txReceiver, 'base64');
                receiverAddress = algosdk.encodeAddress(buffer);
            } catch (e) {
                console.error('Error encoding address:', e);
                throw new Error('Failed to encode receiver address from transaction data');
            }
        }

        if (receiverAddress !== event.wallet_address.trim()) {
            // Determine sender for debugging log if needed
            let senderAddr = 'unknown';
            try {
                if (txSender) {
                    const sBuf = Buffer.isBuffer(txSender) ? txSender : Buffer.from(txSender, 'base64');
                    senderAddr = algosdk.encodeAddress(sBuf);
                }
            } catch (e) { }
            console.log(`Mismatch: Expected ${event.wallet_address}, Got ${receiverAddress}. Sender: ${senderAddr}`);

            await supabase
                .from('event_payments')
                .insert({
                    event_id: eventId,
                    user_id: userId,
                    transaction_id: transactionId,
                    wallet_address: walletAddress,
                    amount: event.ticket_price,
                    status: 'failed'
                });

            return res.status(400).json({
                success: false,
                message: 'Transaction receiver does not match event wallet address'
            });
        }

        // Verify amount
        if (txAmount < expectedAmount) {
            await supabase
                .from('event_payments')
                .insert({
                    event_id: eventId,
                    user_id: userId,
                    transaction_id: transactionId,
                    wallet_address: walletAddress,
                    amount: txAmount / 1000000,
                    status: 'failed'
                });

            return res.status(400).json({
                success: false,
                message: `Insufficient payment amount. Expected: ${event.ticket_price} ALGO, Received: ${txAmount / 1000000} ALGO`
            });
        }

        // Transaction verified! Create payment record
        const { error: paymentError } = await supabase
            .from('event_payments')
            .insert({
                event_id: eventId,
                user_id: userId,
                transaction_id: transactionId,
                wallet_address: walletAddress,
                amount: txAmount / 1000000,
                status: 'verified',
                verified_at: new Date().toISOString()
            });

        if (paymentError) {
            console.error('Error creating payment record:', paymentError);
            return res.status(500).json({
                success: false,
                message: 'Failed to record payment',
                error: paymentError.message
            });
        }

        // Add user to event as a member
        const { error: memberError } = await supabase
            .from('event_members')
            .insert({
                event_id: eventId,
                user_id: userId,
                role: 'member'
            });

        if (memberError) {
            console.error('Error adding event member:', memberError);
            return res.status(500).json({
                success: false,
                message: 'Payment verified but failed to add you to event',
                error: memberError.message
            });
        }

        res.json({
            success: true,
            message: 'Payment verified! You now have access to the event.',
            payment: {
                transactionId,
                amount: txAmount / 1000000,
                verified: true
            }
        });

    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during payment verification',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/payments/my-payments
 * @desc    Get current user's payment history
 * @access  Private
 */
router.get('/my-payments', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        const { data: payments, error } = await supabase
            .from('event_payments')
            .select(`
                id,
                event_id,
                transaction_id,
                amount,
                status,
                verified_at,
                created_at,
                events:event_id (
                    id,
                    title,
                    banner_url,
                    event_date
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching payments:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch payment history',
                error: error.message
            });
        }

        res.json({
            success: true,
            payments: payments || []
        });

    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

export default router;

import algosdk from 'algosdk';

// Algod Configuration for TestNet
const ALGOD_TOKEN = '';
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = '';

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

/**
 * Create a payment transaction for event ticket purchase
 */
export const createPaymentTransaction = async (
    fromAddress: string,
    toAddress: string,
    amount: number,
    note: string = ''
) => {
    try {
        // Get suggested transaction parameters
        const suggestedParams = await algodClient.getTransactionParams().do();

        // Convert ALGO to microAlgos
        const amountInMicroAlgos = algosdk.algosToMicroalgos(amount);

        // Create payment transaction
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            sender: fromAddress,
            receiver: toAddress,
            amount: amountInMicroAlgos,
            note: note ? new Uint8Array(Buffer.from(note)) : undefined,
            suggestedParams
        });

        return txn;
    } catch (error) {
        console.error('Error creating payment transaction:', error);
        throw new Error('Failed to create payment transaction');
    }
};

/**
 * Wait for transaction confirmation
 */
export const waitForConfirmation = async (txId: string, timeout: number = 4) => {
    try {
        const status = await algosdk.waitForConfirmation(algodClient, txId, timeout);
        return status;
    } catch (error) {
        console.error('Error waiting for confirmation:', error);
        throw new Error('Transaction confirmation timeout');
    }
};

/**
 * Get transaction details from blockchain
 */
export const getTransaction = async (txId: string) => {
    try {
        const txInfo = await algodClient.pendingTransactionInformation(txId).do();
        return txInfo;
    } catch (error) {
        console.error('Error getting transaction:', error);
        throw new Error('Failed to get transaction details');
    }
};

/**
 * Format Algorand address for display
 */
export const formatAlgoAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Validate Algorand address
 */
export const isValidAlgoAddress = (address: string): boolean => {
    try {
        return algosdk.isValidAddress(address);
    } catch {
        return false;
    }
};

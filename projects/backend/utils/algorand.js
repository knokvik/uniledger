
import algosdk from 'algosdk';

// Algod Configuration for TestNet
const ALGOD_TOKEN = '';
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = '';

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

/**
 * Generates a new Algorand TestNet wallet (account).
 * Logs the mnemonic phrase for development purposes.
 * RETURNS functionality to access public address and secret key.
 * DO NOT expose secret key via API.
 */
export const generateWallet = () => {
    try {
        const account = algosdk.generateAccount();
        const mnemonic = algosdk.secretKeyToMnemonic(account.sk);

        console.log('--- NEW WALLET GENERATED ---');
        console.log('Public Address:', account.addr.toString());
        console.log('Mnemonic Phrase (KEEP SECURE):', mnemonic);
        console.log('----------------------------');

        return {
            address: account.addr.toString(),
            // Return secret key for backend storage only
            secretKey: mnemonic // Storing mnemonic as it is easier to restore from
        };
    } catch (error) {
        console.error('Error generating wallet:', error);
        throw new Error('Failed to generate wallet');
    }
};

/**
 * Checks the balance of an Algorand address on TestNet.
 * @param {string} address - The Algorand public address.
 * @returns {Promise<string>} The balance in ALGO (formatted).
 */
export const checkBalance = async (address) => {
    try {
        if (!algosdk.isValidAddress(address)) {
            throw new Error('Invalid Algorand address');
        }

        const accountInfo = await algodClient.accountInformation(address).do();
        const microAlgos = accountInfo.amount || 0;
        const algos = algosdk.microalgosToAlgos(microAlgos);

        return algos.toFixed(6); // Returns formatted string
    } catch (error) {
        console.error(`Error fetching balance for ${address}:`, error);
        // Return 0 if account not found (often means empty/new account on network)
        if (error.response && error.response.status === 404) {
            return "0.000000";
        }
        throw new Error('Failed to fetch balance');
    }
};

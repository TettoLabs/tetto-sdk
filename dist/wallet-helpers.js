"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWalletFromKeypair = createWalletFromKeypair;
exports.createWalletFromAdapter = createWalletFromAdapter;
/**
 * Create a TettoWallet from a Keypair (for Node.js/backend usage)
 *
 * @param keypair - Solana keypair
 * @param connection - Solana connection
 * @returns TettoWallet object
 *
 * @example
 * ```typescript
 * const keypair = Keypair.fromSecretKey(secretKeyArray);
 * const connection = createConnection('mainnet');
 * const wallet = createWalletFromKeypair(keypair, connection);
 *
 * const result = await tetto.callAgent(agentId, input, wallet);
 * ```
 */
function createWalletFromKeypair(keypair, connection) {
    return {
        publicKey: keypair.publicKey,
        signTransaction: async (tx) => {
            tx.sign(keypair);
            return tx;
        },
        sendTransaction: async (tx) => {
            tx.sign(keypair);
            const signature = await connection.sendRawTransaction(tx.serialize());
            return signature;
        },
        connection,
    };
}
/**
 * Create a TettoWallet from browser wallet adapter
 *
 * @param adapter - Wallet adapter from @solana/wallet-adapter-react
 * @param connection - Solana connection
 * @returns TettoWallet object
 *
 * @example
 * ```typescript
 * import { useWallet } from '@solana/wallet-adapter-react';
 *
 * const walletAdapter = useWallet();
 * const connection = createConnection('mainnet');
 * const wallet = createWalletFromAdapter(walletAdapter, connection);
 *
 * const result = await tetto.callAgent(agentId, input, wallet);
 * ```
 */
function createWalletFromAdapter(adapter, connection) {
    if (!adapter.publicKey) {
        throw new Error("Wallet not connected");
    }
    if (!adapter.signTransaction && !adapter.sendTransaction) {
        throw new Error("Wallet does not support signing or sending transactions");
    }
    return {
        publicKey: adapter.publicKey,
        signTransaction: adapter.signTransaction,
        sendTransaction: adapter.sendTransaction,
        connection,
    };
}

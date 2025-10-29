"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWalletFromKeypair = createWalletFromKeypair;
exports.createWalletFromAdapter = createWalletFromAdapter;
/**
 * Create a TettoWallet from a Keypair (for Node.js/backend usage)
 *
 * No RPC connection needed - platform handles transaction submission
 *
 * @param keypair - Solana keypair
 * @returns TettoWallet object
 *
 * @example
 * ```typescript
 * const keypair = Keypair.fromSecretKey(secretKeyArray);
 * const wallet = createWalletFromKeypair(keypair);  // No connection!
 *
 * const result = await tetto.callAgent(agentId, input, wallet);
 * ```
 */
function createWalletFromKeypair(keypair) {
    return {
        publicKey: keypair.publicKey,
        signTransaction: async (tx) => {
            tx.sign(keypair);
            return tx;
        },
    };
}
/**
 * Create a TettoWallet from browser wallet adapter
 *
 * No RPC connection needed - platform handles transaction submission
 *
 * @param adapter - Wallet adapter from @solana/wallet-adapter-react
 * @returns TettoWallet object
 *
 * @example
 * ```typescript
 * import { useWallet } from '@solana/wallet-adapter-react';
 *
 * const walletAdapter = useWallet();
 * const wallet = createWalletFromAdapter(walletAdapter);  // No connection!
 *
 * const result = await tetto.callAgent(agentId, input, wallet);
 * ```
 */
function createWalletFromAdapter(adapter) {
    if (!adapter.publicKey) {
        throw new Error("Wallet not connected");
    }
    if (!adapter.signTransaction) {
        throw new Error("Wallet does not support signing transactions");
    }
    return {
        publicKey: adapter.publicKey,
        signTransaction: adapter.signTransaction,
    };
}

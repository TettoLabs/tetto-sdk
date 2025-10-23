import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import type { TettoWallet } from "./index";
/**
 * Create a TettoWallet from a Keypair (for Node.js/backend usage)
 *
 * SDK3: No connection needed - platform handles transaction submission
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
export declare function createWalletFromKeypair(keypair: Keypair): TettoWallet;
/**
 * Create a TettoWallet from browser wallet adapter
 *
 * SDK3: No connection needed - platform handles transaction submission
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
export declare function createWalletFromAdapter(adapter: {
    publicKey: PublicKey | null;
    signTransaction?: (tx: Transaction) => Promise<Transaction>;
}): TettoWallet;

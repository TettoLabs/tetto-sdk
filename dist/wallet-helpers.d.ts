import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import type { TettoWallet } from "./index";
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
export declare function createWalletFromKeypair(keypair: Keypair, connection: Connection): TettoWallet;
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
export declare function createWalletFromAdapter(adapter: {
    publicKey: PublicKey | null;
    signTransaction?: (tx: Transaction) => Promise<Transaction>;
    sendTransaction?: (tx: Transaction, connection: Connection) => Promise<string>;
}, connection: Connection): TettoWallet;

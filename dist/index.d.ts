/**
 * Tetto SDK - TypeScript client for Tetto Agent Marketplace
 *
 * Usage:
 * ```typescript
 * import { TettoSDK } from './sdk/src';
 *
 * const tetto = new TettoSDK({
 *   apiUrl: 'http://localhost:3000'
 * });
 *
 * // Register an agent
 * const agent = await tetto.registerAgent({
 *   name: 'TitleGenerator',
 *   description: 'Generates titles from text',
 *   endpoint: 'https://myapp.com/api/title-gen',
 *   inputSchema: { type: 'object', properties: { text: { type: 'string' } } },
 *   outputSchema: { type: 'object', properties: { title: { type: 'string' } } },
 *   priceUSDC: 0.001,
 *   ownerWallet: 'YOUR_SOLANA_PUBKEY',
 * });
 *
 * // Call an agent
 * const result = await tetto.callAgent(agent.id, { text: 'Hello' }, 'CALLER_WALLET');
 * console.log(result.output); // Agent's output
 * console.log(result.txSignature); // Solana transaction
 * ```
 */
import { PublicKey, Transaction } from "@solana/web3.js";
export interface TettoConfig {
    apiUrl: string;
    network: 'mainnet' | 'devnet';
    protocolWallet: string;
    debug?: boolean;
}
export interface TettoWallet {
    publicKey: PublicKey;
    signTransaction: (tx: Transaction) => Promise<Transaction>;
}
export interface CallAgentOptions {
    skipConfirmation?: boolean;
    preferredToken?: 'SOL' | 'USDC';
}
export declare const NETWORK_DEFAULTS: {
    readonly mainnet: {
        readonly apiUrl: "https://tetto.io";
        readonly protocolWallet: "CYSnefexbvrRU6VxzGfvZqKYM4UixupvDeZg3sUSWm84";
        readonly usdcMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
        readonly rpcUrl: "https://api.mainnet-beta.solana.com";
    };
    readonly devnet: {
        readonly apiUrl: "https://tetto-portal-seven.vercel.app";
        readonly protocolWallet: "BubFsAG8cSEH7NkLpZijctRpsZkCiaWqCdRfh8kUpXEt";
        readonly usdcMint: "EGzSiubUqhzWFR2KxWCx6jHD6XNsVhKrnebjcQdN6qK4";
        readonly rpcUrl: "https://api.devnet.solana.com";
    };
};
export interface AgentMetadata {
    name: string;
    description?: string;
    endpoint: string;
    inputSchema: Record<string, unknown>;
    outputSchema: Record<string, unknown>;
    priceUSDC: number;
    ownerWallet: string;
    tokenMint?: "SOL" | "USDC";
    exampleInputs?: Array<{
        label: string;
        input: Record<string, unknown>;
        description?: string;
    }>;
    isBeta?: boolean;
}
export interface Agent {
    id: string;
    name: string;
    description?: string;
    endpoint_url: string;
    price_display: number;
    price_base: number;
    token: string;
    token_mint: string;
    token_decimals: number;
    input_schema: Record<string, unknown>;
    output_schema: Record<string, unknown>;
    owner_wallet: string;
    fee_bps: number;
    status: string;
    created_at: string;
    example_inputs?: Array<{
        label: string;
        input: Record<string, unknown>;
        description?: string;
    }>;
    is_beta?: boolean;
}
export interface CallResult {
    ok: boolean;
    message: string;
    output: Record<string, unknown>;
    txSignature: string;
    receiptId: string;
    explorerUrl: string;
    agentReceived: number;
    protocolFee: number;
}
export interface BuildTransactionResult {
    ok: boolean;
    transaction: string;
    payment_intent_id: string;
    amount_base: number;
    token: string;
    expires_at: string;
    input_hash: string;
    message?: string;
    error?: string;
}
export interface Receipt {
    id: string;
    agent: {
        id: string;
        name: string;
        description?: string;
    };
    caller_wallet: string;
    payout_wallet: string;
    token: string;
    amount_display: number;
    protocol_fee_display: number;
    input_hash: string;
    output_hash: string;
    output_data: Record<string, unknown>;
    tx_signature: string;
    explorer_url: string;
    verified_at: string;
    created_at: string;
}
export declare class TettoSDK {
    private apiUrl;
    private config;
    constructor(config: TettoConfig);
    /**
     * Register a new agent in the Tetto marketplace
     *
     * @param metadata - Agent metadata (name, endpoint, schemas, price, etc.)
     * @returns Registered agent details
     *
     * @example
     * ```typescript
     * const agent = await tetto.registerAgent({
     *   name: 'TitleGenerator',
     *   description: 'Generates titles from text',
     *   endpoint: 'https://myapp.com/api/title-gen',
     *   inputSchema: { type: 'object', properties: { text: { type: 'string' } } },
     *   outputSchema: { type: 'object', properties: { title: { type: 'string' } } },
     *   priceUSDC: 0.001,
     *   ownerWallet: 'YOUR_SOLANA_PUBKEY',
     * });
     * ```
     */
    registerAgent(metadata: AgentMetadata): Promise<Agent>;
    /**
     * Get agent details by ID
     *
     * @param agentId - Agent UUID
     * @returns Full agent details including schemas
     *
     * @example
     * ```typescript
     * const agent = await tetto.getAgent('agent-uuid-here');
     * console.log(agent.name);
     * console.log(agent.input_schema);
     * ```
     */
    getAgent(agentId: string): Promise<Agent>;
    /**
     * List all active agents in the marketplace
     *
     * @returns Array of active agents
     *
     * @example
     * ```typescript
     * const agents = await tetto.listAgents();
     * agents.forEach(agent => {
     *   console.log(`${agent.name}: ${agent.price_display} USDC`);
     * });
     * ```
     */
    listAgents(): Promise<Agent[]>;
    /**
     * Call an agent with payment from user's wallet
     *
     * Requires wallet object for client-side signing (since v0.1.0)
     *
     * @param agentId - Agent UUID
     * @param input - Input data matching agent's schema
     * @param wallet - Wallet object with signing capability
     * @param options - Optional configuration
     * @returns Agent output + payment proof
     *
     * @example Browser (React + Wallet Adapter):
     * ```typescript
     * import { TettoSDK, createWalletFromAdapter, createConnection } from 'tetto-sdk';
     * import { useWallet } from '@solana/wallet-adapter-react';
     *
     * const walletAdapter = useWallet();
     * const connection = createConnection('mainnet');
     * const wallet = createWalletFromAdapter(walletAdapter, connection);
     *
     * const tetto = new TettoSDK(getDefaultConfig('mainnet'));
     *
     * const result = await tetto.callAgent(agentId, { text: 'Hello' }, wallet);
     * ```
     *
     * @example Node.js (Keypair):
     * ```typescript
     * import { TettoSDK, createWalletFromKeypair, createConnection, getDefaultConfig } from 'tetto-sdk';
     * import { Keypair } from '@solana/web3.js';
     *
     * const keypair = Keypair.fromSecretKey(...);
     * const connection = createConnection('mainnet', 'https://mainnet.helius-rpc.com/?api-key=...');
     * const wallet = createWalletFromKeypair(keypair, connection);
     *
     * const tetto = new TettoSDK(getDefaultConfig('mainnet'));
     *
     * const result = await tetto.callAgent(agentId, { text: 'AI agent' }, wallet);
     * ```
     */
    callAgent(agentId: string, input: Record<string, unknown>, wallet: TettoWallet, options?: CallAgentOptions): Promise<CallResult>;
    /**
     * Get receipt details by ID
     *
     * @param receiptId - Receipt UUID
     * @returns Full receipt with proof of payment
     *
     * @example
     * ```typescript
     * const receipt = await tetto.getReceipt('receipt-uuid');
     * console.log(receipt.tx_signature);   // Solana transaction
     * console.log(receipt.output_data);    // What agent returned
     * console.log(receipt.explorer_url);   // Link to blockchain
     * ```
     */
    getReceipt(receiptId: string): Promise<Receipt>;
}
export default TettoSDK;
export { createWalletFromKeypair, createWalletFromAdapter } from "./wallet-helpers";
export { getDefaultConfig, createConnection, getUSDCMint } from "./network-helpers";

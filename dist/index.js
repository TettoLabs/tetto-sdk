"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAgentPaymentTransaction = exports.getUSDCMint = exports.createConnection = exports.getDefaultConfig = exports.createWalletFromAdapter = exports.createWalletFromKeypair = exports.TettoSDK = exports.NETWORK_DEFAULTS = void 0;
const web3_js_1 = require("@solana/web3.js");
// Network defaults
exports.NETWORK_DEFAULTS = {
    mainnet: {
        apiUrl: 'https://tetto.io',
        protocolWallet: 'CYSnefexbvrRU6VxzGfvZqKYM4UixupvDeZg3sUSWm84',
        usdcMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        rpcUrl: 'https://api.mainnet-beta.solana.com',
    },
    devnet: {
        apiUrl: 'https://tetto-portal-seven.vercel.app',
        protocolWallet: 'BubFsAG8cSEH7NkLpZijctRpsZkCiaWqCdRfh8kUpXEt',
        usdcMint: 'EGzSiubUqhzWFR2KxWCx6jHD6XNsVhKrnebjcQdN6qK4',
        rpcUrl: 'https://api.devnet.solana.com',
    },
};
// ============================================================================
// TETTO SDK CLASS
// ============================================================================
class TettoSDK {
    constructor(config) {
        this.apiUrl = config.apiUrl.replace(/\/$/, ""); // Remove trailing slash
        this.config = config;
    }
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
    async registerAgent(metadata) {
        const response = await fetch(`${this.apiUrl}/api/agents/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: metadata.name,
                description: metadata.description,
                endpoint_url: metadata.endpoint,
                input_schema: metadata.inputSchema,
                output_schema: metadata.outputSchema,
                price_usdc: metadata.priceUSDC,
                owner_wallet_pubkey: metadata.ownerWallet,
                token_mint: metadata.tokenMint,
                example_inputs: metadata.exampleInputs,
                is_beta: metadata.isBeta || false,
            }),
        });
        const result = await response.json();
        if (!result.ok) {
            throw new Error(result.error || "Agent registration failed");
        }
        return result.agent;
    }
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
    async getAgent(agentId) {
        const response = await fetch(`${this.apiUrl}/api/agents/${agentId}`);
        const result = await response.json();
        if (!result.ok) {
            throw new Error(result.error || "Agent not found");
        }
        return result.agent;
    }
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
    async listAgents() {
        const response = await fetch(`${this.apiUrl}/api/agents`);
        const result = await response.json();
        if (!result.ok) {
            throw new Error(result.error || "Failed to list agents");
        }
        return result.agents;
    }
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
    async callAgent(agentId, input, wallet, options) {
        // Validate wallet (SDK3 - CP1: Simplified validation)
        if (!wallet.publicKey) {
            throw new Error('Wallet public key is required');
        }
        if (!wallet.signTransaction) {
            throw new Error('Wallet must provide signTransaction method');
        }
        if (this.config.debug) {
            console.log(`🤖 Calling agent: ${agentId}`);
            console.log(`   Payer: ${wallet.publicKey.toBase58()}`);
        }
        // Step 1: Get agent details
        const agent = await this.getAgent(agentId);
        if (this.config.debug) {
            console.log(`   Agent: ${agent.name}`);
            console.log(`   Price: ${agent.price_display} ${agent.token}`);
        }
        // Step 2: Request transaction from platform (SDK3 - CP1: Phase 1)
        // Platform validates input BEFORE payment_intent creation (fail fast!)
        if (this.config.debug) {
            console.log("   Requesting transaction from platform (with input validation)...");
        }
        const buildResponse = await fetch(`${this.apiUrl}/api/agents/${agentId}/build-transaction`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                payer_wallet: wallet.publicKey.toBase58(),
                selected_token: options?.preferredToken,
                input: input, // SDK3 - CP1: Input validated at build-time!
            }),
        });
        const buildResult = await buildResponse.json();
        if (!buildResult.ok) {
            if (this.config.debug) {
                console.error("   ❌ Transaction building failed:", buildResult.error);
            }
            throw new Error(buildResult.error || "Transaction building failed");
        }
        if (this.config.debug) {
            console.log(`   ✅ Transaction built (input validated)`);
            console.log(`   Payment intent: ${buildResult.payment_intent_id}`);
            console.log(`   Amount: ${buildResult.amount_base} base units`);
            console.log(`   Token: ${buildResult.token}`);
            console.log(`   Input hash: ${buildResult.input_hash}`);
        }
        // Step 3: Deserialize transaction from platform
        const transaction = web3_js_1.Transaction.from(Buffer.from(buildResult.transaction, 'base64'));
        const payment_intent_id = buildResult.payment_intent_id;
        if (this.config.debug)
            console.log("   Transaction deserialized, requesting signature...");
        // Step 4: Sign transaction (SDK3 - CP1: Phase 2)
        // SDK only signs, platform will submit to Solana
        if (this.config.debug)
            console.log("   Signing transaction...");
        let signedTransaction;
        try {
            signedTransaction = await wallet.signTransaction(transaction);
            if (this.config.debug)
                console.log("   ✅ Transaction signed (platform will submit)");
        }
        catch (error) {
            if (this.config.debug)
                console.error("   ❌ Transaction signing failed:", error);
            throw error;
        }
        // Step 5: Call platform API with signed transaction (SDK3 - CP1: Phase 3)
        // SDK3: Only 2 fields - payment_intent_id + signed_transaction
        // All context (agent_id, input, caller_wallet, token) is in payment_intent
        if (this.config.debug)
            console.log("   Sending signed transaction to platform...");
        const response = await fetch(`${this.apiUrl}/api/agents/call`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                payment_intent_id: payment_intent_id,
                signed_transaction: signedTransaction.serialize().toString('base64'),
            }),
        });
        const result = await response.json();
        if (!result.ok) {
            if (this.config.debug)
                console.error("   ❌ Backend call failed:", result.error);
            throw new Error(result.error || "Agent call failed");
        }
        if (this.config.debug)
            console.log("   ✅ Agent call successful");
        return {
            ok: result.ok,
            message: result.message,
            output: result.output,
            txSignature: result.tx_signature,
            receiptId: result.receipt_id,
            explorerUrl: result.explorer_url,
            agentReceived: result.agent_received,
            protocolFee: result.protocol_fee,
        };
    }
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
    async getReceipt(receiptId) {
        const response = await fetch(`${this.apiUrl}/api/receipts/${receiptId}`);
        const result = await response.json();
        if (!result.ok) {
            throw new Error(result.error || "Receipt not found");
        }
        return result.receipt;
    }
}
exports.TettoSDK = TettoSDK;
// ============================================================================
// EXPORTS
// ============================================================================
exports.default = TettoSDK;
// Helpers
var wallet_helpers_1 = require("./wallet-helpers");
Object.defineProperty(exports, "createWalletFromKeypair", { enumerable: true, get: function () { return wallet_helpers_1.createWalletFromKeypair; } });
Object.defineProperty(exports, "createWalletFromAdapter", { enumerable: true, get: function () { return wallet_helpers_1.createWalletFromAdapter; } });
var network_helpers_1 = require("./network-helpers");
Object.defineProperty(exports, "getDefaultConfig", { enumerable: true, get: function () { return network_helpers_1.getDefaultConfig; } });
Object.defineProperty(exports, "createConnection", { enumerable: true, get: function () { return network_helpers_1.createConnection; } });
Object.defineProperty(exports, "getUSDCMint", { enumerable: true, get: function () { return network_helpers_1.getUSDCMint; } });
var transaction_builder_1 = require("./transaction-builder");
Object.defineProperty(exports, "buildAgentPaymentTransaction", { enumerable: true, get: function () { return transaction_builder_1.buildAgentPaymentTransaction; } });

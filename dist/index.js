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
exports.getUSDCMint = exports.createConnection = exports.getDefaultConfig = exports.createWalletFromAdapter = exports.createWalletFromKeypair = exports.TettoSDK = exports.NETWORK_DEFAULTS = void 0;
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
        apiUrl: 'https://dev.tetto.io',
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
        this.plugins = new Map(); // NEW: Initialize plugin registry
        this.callingAgentId = config.agentId || process.env.TETTO_AGENT_ID || null; // NEW: Set agent identity
        if (this.config.debug && this.callingAgentId) {
            console.log(`🤖 SDK initialized with agent identity: ${this.callingAgentId}`);
        }
    }
    /**
     * Validate UUID format
     * @private
     */
    _validateUUID(id, type) {
        if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            throw new Error(`Invalid ${type} format. Expected UUID.`);
        }
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
        // Build headers (conditionally add Authorization if apiKey provided)
        const headers = {
            "Content-Type": "application/json",
        };
        if (this.config.apiKey) {
            headers["Authorization"] = `Bearer ${this.config.apiKey}`;
        }
        const response = await fetch(`${this.apiUrl}/api/agents/register`, {
            method: "POST",
            headers: headers,
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
            // Improved error message for authentication failures
            if (result.error?.includes('API key') || result.error?.includes('Unauthorized') || result.error?.includes('Not authenticated')) {
                throw new Error(`Authentication failed: ${result.error}\n\n` +
                    `To fix this:\n` +
                    `1. Generate an API key at https://www.tetto.io/dashboard/api-keys\n` +
                    `2. Add to your config: { apiKey: process.env.TETTO_API_KEY }\n` +
                    `3. Set environment variable: TETTO_API_KEY=your-key-here`);
            }
            throw new Error(result.error || "Agent registration failed");
        }
        if (!result.agent) {
            throw new Error("Agent data missing from response");
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
        this._validateUUID(agentId, 'agent ID');
        const response = await fetch(`${this.apiUrl}/api/agents/${agentId}`);
        const result = await response.json();
        if (!result.ok) {
            throw new Error(result.error || `Agent not found: ${agentId}\n\n` +
                `This agent may not exist or has been removed.\n` +
                `Browse available agents: ${this.apiUrl}/agents`);
        }
        if (!result.agent) {
            throw new Error("Agent data missing from response");
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
        if (!result.agents) {
            throw new Error("Agents data missing from response");
        }
        return result.agents;
    }
    /**
     * Call an agent with payment from user's wallet
     *
     * Platform validates input BEFORE payment (fail fast!)
     * Platform builds and submits transaction (you only sign)
     * No RPC connection needed (simpler!)
     *
     * @param agentId - Agent UUID
     * @param input - Input data matching agent's schema
     * @param wallet - Wallet object with signing capability
     * @param options - Optional configuration
     * @returns Agent output + payment proof
     *
     * @example Browser (React + Wallet Adapter):
     * ```typescript
     * import { TettoSDK, createWalletFromAdapter, getDefaultConfig } from 'tetto-sdk';
     * import { useWallet } from '@solana/wallet-adapter-react';
     *
     * const walletAdapter = useWallet();
     * const wallet = createWalletFromAdapter(walletAdapter);  // No connection needed!
     * const tetto = new TettoSDK(getDefaultConfig('mainnet'));
     *
     * const result = await tetto.callAgent(agentId, { text: 'Hello' }, wallet);
     * ```
     *
     * @example Node.js (Keypair - For AI Agents):
     * ```typescript
     * import { TettoSDK, createWalletFromKeypair, getDefaultConfig } from 'tetto-sdk';
     * import { Keypair } from '@solana/web3.js';
     *
     * const secretKey = JSON.parse(process.env.WALLET_SECRET);
     * const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
     * const wallet = createWalletFromKeypair(keypair);  // No connection needed!
     * const tetto = new TettoSDK(getDefaultConfig('mainnet'));
     *
     * const result = await tetto.callAgent(agentId, { text: 'AI agent' }, wallet);
     * ```
     */
    async callAgent(agentId, input, wallet, options) {
        // Validate wallet format
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
        // Step 2: Request unsigned transaction from platform
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
                input: input, // Input validated at build-time (fail fast!)
                calling_agent_id: this.callingAgentId || undefined, // NEW: Include agent identity
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
        // Step 4: Sign transaction (client-side signing)
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
        // Step 5: Submit signed transaction to platform
        // Simple submission: payment_intent_id + signed_transaction
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
            message: result.message || "",
            output: result.output || {},
            txSignature: result.tx_signature || "",
            receiptId: result.receipt_id || "",
            explorerUrl: result.explorer_url || "",
            agentReceived: result.agent_received || 0,
            protocolFee: result.protocol_fee || 0,
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
        this._validateUUID(receiptId, 'receipt ID');
        const response = await fetch(`${this.apiUrl}/api/receipts/${receiptId}`);
        const result = await response.json();
        if (!result.ok) {
            throw new Error(result.error || `Receipt not found: ${receiptId}\n\n` +
                `Receipts are available immediately after agent calls complete.\n` +
                `Check your dashboard: ${this.apiUrl}/dashboard/analytics`);
        }
        if (!result.receipt) {
            throw new Error("Receipt data missing from response");
        }
        return result.receipt;
    }
    // ============================================================================
    // PLUGIN SYSTEM (v2.0)
    // ============================================================================
    /**
     * Create restricted API for plugins (security boundary)
     *
     * This method creates a sandboxed interface that plugins receive.
     * Plugins CANNOT access:
     * - API keys (config.apiKey)
     * - Private keys (wallet internals)
     * - Other plugins (isolation)
     * - Internal SDK state
     *
     * @returns Restricted PluginAPI interface
     * @private
     */
    createPluginAPI() {
        return {
            // Proxy safe public methods (bind to preserve 'this')
            callAgent: this.callAgent.bind(this),
            getAgent: this.getAgent.bind(this),
            listAgents: this.listAgents.bind(this),
            // Return safe subset of config (no secrets!)
            getConfig: () => ({
                apiUrl: this.apiUrl,
                network: this.config.network,
                protocolWallet: this.config.protocolWallet,
                debug: this.config.debug || false
            }),
            // Allow checking if plugin is loaded (boolean only, no access to instance)
            hasPlugin: (pluginId) => this.plugins.has(pluginId)
        };
    }
    /**
     * Register a plugin with security boundary
     *
     * Plugins receive restricted PluginAPI (not full SDK) for security.
     * All plugin methods must accept wallet parameter from caller.
     *
     * @param plugin - Plugin function
     * @param options - Plugin-specific options
     * @returns Plugin instance
     *
     * @example
     * ```typescript
     * import { WarmMemoryPlugin } from '@warmcontext/tetto-plugin';
     *
     * tetto.use(WarmMemoryPlugin);
     * await tetto.memory.set('key', 'value', wallet);  // Wallet required!
     * ```
     */
    use(plugin, options) {
        // Pass restricted API (NOT full SDK) - SECURITY BOUNDARY
        const instance = plugin(this.createPluginAPI(), options);
        const pluginId = instance.id || plugin.id || instance.name || 'unknown';
        // Check for namespace collisions
        if (instance.name && instance.name in this) {
            throw new Error(`Plugin namespace collision: '${instance.name}' is already in use.\n\n` +
                `Loaded plugins:\n` +
                `${this.listPlugins().map(id => `  - ${id}`).join('\n')}\n\n` +
                `Solutions:\n` +
                `1. Load only one plugin at a time\n` +
                `2. Use custom name: tetto.use(Plugin, { name: 'customName' })\n` +
                `3. Access via plugins Map: tetto.getPlugin('${pluginId}')`);
        }
        // Store in registry
        this.plugins.set(pluginId, instance);
        // Auto-attach if safe (convenient access via tetto.pluginName)
        if (instance.name) {
            this[instance.name] = instance;
            if (this.config.debug) {
                console.log(`✅ Plugin '${instance.name}' attached to SDK (secure mode)`);
            }
        }
        // Call lifecycle hook if available (don't await to prevent blocking)
        if (instance.onInit && typeof instance.onInit === 'function') {
            Promise.resolve(instance.onInit()).catch(err => {
                console.error(`Plugin ${pluginId} initialization failed:`, err);
                // Call onError if available
                if (instance.onError && typeof instance.onError === 'function') {
                    instance.onError(err, { operation: 'init' });
                }
            });
        }
        return instance;
    }
    /**
     * Get plugin by ID (safe access)
     *
     * @param pluginId - Plugin identifier
     * @returns Plugin instance or undefined
     *
     * @example
     * ```typescript
     * const memory = tetto.getPlugin('warmmemory');
     * if (memory) {
     *   await memory.set('key', 'value', wallet);
     * }
     * ```
     */
    getPlugin(pluginId) {
        return this.plugins.get(pluginId);
    }
    /**
     * List all loaded plugins
     *
     * @returns Array of plugin IDs
     */
    listPlugins() {
        return Array.from(this.plugins.keys());
    }
    /**
     * Destroy all plugins (cleanup)
     *
     * Calls onDestroy lifecycle hook for each plugin.
     * Use when shutting down application.
     *
     * @example
     * ```typescript
     * // On application shutdown:
     * await tetto.destroy();
     * ```
     */
    async destroy() {
        for (const [id, instance] of this.plugins.entries()) {
            if (instance.onDestroy && typeof instance.onDestroy === 'function') {
                try {
                    await instance.onDestroy();
                    if (this.config.debug) {
                        console.log(`✅ Plugin ${id} destroyed`);
                    }
                }
                catch (err) {
                    console.error(`Plugin ${id} cleanup failed:`, err);
                }
            }
        }
        this.plugins.clear();
    }
    /**
     * Create SDK from tetto_context (agent-to-agent calls)
     *
     * When agents receive tetto_context, they can use this method
     * to create an SDK instance that preserves caller identity.
     *
     * @param context - TettoContext from request body
     * @param overrides - Optional config overrides
     * @returns SDK instance with caller identity preserved
     *
     * @example
     * ```typescript
     * export const POST = createAgentHandler({
     *   async handler(input, context) {
     *     // Create SDK from context (preserves calling_agent_id)
     *     const tetto = TettoSDK.fromContext(context.tetto_context, {
     *       network: 'mainnet'
     *     });
     *
     *     // Calls to agents will include caller_agent_id automatically
     *     await tetto.callAgent('warmmemory', { action: 'store' }, wallet);
     *
     *     return { success: true };
     *   }
     * });
     * ```
     */
    static fromContext(context, overrides = {}) {
        const network = overrides.network || 'mainnet';
        const defaults = exports.NETWORK_DEFAULTS[network];
        return new TettoSDK({
            apiUrl: overrides.apiUrl || defaults.apiUrl,
            network,
            protocolWallet: overrides.protocolWallet || defaults.protocolWallet,
            debug: overrides.debug || false,
            apiKey: overrides.apiKey || process.env.TETTO_API_KEY,
            agentId: context.caller_agent_id || undefined, // Preserve caller identity!
        });
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

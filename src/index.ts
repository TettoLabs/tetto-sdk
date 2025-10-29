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

import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
} from "@solana/web3.js";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TettoConfig {
  apiUrl: string;
  network: 'mainnet' | 'devnet';
  protocolWallet: string; // REQUIRED: No fallbacks
  debug?: boolean; // Optional: Enable console logging
  apiKey?: string; // Optional: API key for authentication (get from dashboard)
}

// Simplified wallet interface (no RPC connection needed - platform handles submission)
export interface TettoWallet {
  publicKey: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;  // Required (platform submits)
}

export interface CallAgentOptions {
  skipConfirmation?: boolean;
  preferredToken?: 'SOL' | 'USDC'; // Optional: Specify payment token preference
}

// Network defaults
export const NETWORK_DEFAULTS = {
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
} as const;

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

/**
 * Studio owner information returned by the platform API
 *
 * Represents the developer/studio that owns an agent.
 * Used for marketplace attribution ("by SubChain.ai ✓").
 *
 * @since v1.2.0 - Added studio support
 */
export interface OwnerInfo {
  /** Display name of the studio/developer */
  display_name: string;

  /** Avatar/logo URL (null if not set) */
  avatar_url: string | null;

  /** Whether studio has verified badge (blue checkmark ✓) */
  verified: boolean;

  /** Studio slug for profile page (null if no studio created) */
  studio_slug: string | null;

  /** Studio bio/description (null if not set) */
  bio: string | null;
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

  /**
   * Studio owner information (added in v1.2.0)
   *
   * Null for agents registered before studios feature,
   * or if owner hasn't completed their profile yet.
   *
   * Use this to display attribution like "by SubChain.ai ✓"
   *
   * @since v1.2.0
   */
  owner?: OwnerInfo | null;

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

// Platform builds unsigned transaction (client signs and submits)
export interface BuildTransactionResult {
  ok: boolean;
  transaction: string;          // Base64 unsigned transaction
  payment_intent_id: string;    // UUID for agents/call
  amount_base: number;          // Amount in base units
  token: string;                // 'SOL' or 'USDC'
  expires_at: string;           // ISO timestamp
  input_hash: string;           // SHA256 of input
  message?: string;
  error?: string;
}

// API Response interfaces for type safety
interface AgentResponse {
  ok: boolean;
  agent?: Agent;
  error?: string;
}

interface AgentsResponse {
  ok: boolean;
  agents?: Agent[];
  count?: number;
  error?: string;
}

interface ReceiptResponse {
  ok: boolean;
  receipt?: Receipt;
  error?: string;
}

interface RegisterResponse {
  ok: boolean;
  agent?: Agent;
  error?: string;
}

interface CallResponse {
  ok: boolean;
  message?: string;
  output?: Record<string, unknown>;
  tx_signature?: string;
  receipt_id?: string;
  explorer_url?: string;
  agent_received?: number;
  protocol_fee?: number;
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

// ============================================================================
// TETTO SDK CLASS
// ============================================================================

export class TettoSDK {
  private apiUrl: string;
  private config: TettoConfig;

  constructor(config: TettoConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, ""); // Remove trailing slash
    this.config = config;
  }

  /**
   * Validate UUID format
   * @private
   */
  private _validateUUID(id: string, type: string): void {
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
  async registerAgent(metadata: AgentMetadata): Promise<Agent> {
    // Build headers (conditionally add Authorization if apiKey provided)
    const headers: Record<string, string> = {
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

    const result = await response.json() as RegisterResponse;

    if (!result.ok) {
      // Improved error message for authentication failures
      if (result.error?.includes('API key') || result.error?.includes('Unauthorized') || result.error?.includes('Not authenticated')) {
        throw new Error(
          `Authentication failed: ${result.error}\n\n` +
          `To fix this:\n` +
          `1. Generate an API key at https://www.tetto.io/dashboard/api-keys\n` +
          `2. Add to your config: { apiKey: process.env.TETTO_API_KEY }\n` +
          `3. Set environment variable: TETTO_API_KEY=your-key-here`
        );
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
  async getAgent(agentId: string): Promise<Agent> {
    this._validateUUID(agentId, 'agent ID');

    const response = await fetch(`${this.apiUrl}/api/agents/${agentId}`);
    const result = await response.json() as AgentResponse;

    if (!result.ok) {
      throw new Error(
        result.error || `Agent not found: ${agentId}\n\n` +
        `This agent may not exist or has been removed.\n` +
        `Browse available agents: ${this.apiUrl}/agents`
      );
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
  async listAgents(): Promise<Agent[]> {
    const response = await fetch(`${this.apiUrl}/api/agents`);
    const result = await response.json() as AgentsResponse;

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
  async callAgent(
    agentId: string,
    input: Record<string, unknown>,
    wallet: TettoWallet,
    options?: CallAgentOptions
  ): Promise<CallResult> {
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

    const buildResponse = await fetch(
      `${this.apiUrl}/api/agents/${agentId}/build-transaction`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payer_wallet: wallet.publicKey.toBase58(),
          selected_token: options?.preferredToken,
          input: input,  // Input validated at build-time (fail fast!)
        }),
      }
    );

    const buildResult = await buildResponse.json() as BuildTransactionResult;

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
    const transaction = Transaction.from(
      Buffer.from(buildResult.transaction, 'base64')
    );

    const payment_intent_id = buildResult.payment_intent_id;

    if (this.config.debug) console.log("   Transaction deserialized, requesting signature...");

    // Step 4: Sign transaction (client-side signing)
    // SDK only signs, platform will submit to Solana
    if (this.config.debug) console.log("   Signing transaction...");

    let signedTransaction: Transaction;

    try {
      signedTransaction = await wallet.signTransaction(transaction);
      if (this.config.debug) console.log("   ✅ Transaction signed (platform will submit)");
    } catch (error) {
      if (this.config.debug) console.error("   ❌ Transaction signing failed:", error);
      throw error;
    }

    // Step 5: Submit signed transaction to platform
    // Simple submission: payment_intent_id + signed_transaction
    // All context (agent_id, input, caller_wallet, token) is in payment_intent
    if (this.config.debug) console.log("   Sending signed transaction to platform...");

    const response = await fetch(`${this.apiUrl}/api/agents/call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_intent_id: payment_intent_id,
        signed_transaction: signedTransaction.serialize().toString('base64'),
      }),
    });

    const result = await response.json() as CallResponse;

    if (!result.ok) {
      if (this.config.debug) console.error("   ❌ Backend call failed:", result.error);
      throw new Error(result.error || "Agent call failed");
    }

    if (this.config.debug) console.log("   ✅ Agent call successful");

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
  async getReceipt(receiptId: string): Promise<Receipt> {
    this._validateUUID(receiptId, 'receipt ID');

    const response = await fetch(`${this.apiUrl}/api/receipts/${receiptId}`);
    const result = await response.json() as ReceiptResponse;

    if (!result.ok) {
      throw new Error(
        result.error || `Receipt not found: ${receiptId}\n\n` +
        `Receipts are available immediately after agent calls complete.\n` +
        `Check your dashboard: ${this.apiUrl}/dashboard/analytics`
      );
    }

    if (!result.receipt) {
      throw new Error("Receipt data missing from response");
    }

    return result.receipt;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TettoSDK;

// Helpers
export { createWalletFromKeypair, createWalletFromAdapter } from "./wallet-helpers";
export { getDefaultConfig, createConnection, getUSDCMint } from "./network-helpers";

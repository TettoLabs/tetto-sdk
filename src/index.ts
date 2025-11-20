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

// Plugin system imports
import type { PluginAPI } from './plugin-api';
import type { Plugin, PluginInstance, TettoContext } from './types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TettoConfig {
  apiUrl: string;
  network: 'mainnet' | 'devnet';
  protocolWallet: string; // REQUIRED: No fallbacks
  debug?: boolean; // Optional: Enable console logging
  apiKey?: string; // Optional: API key for authentication (get from dashboard)
  agentId?: string; // Optional: Agent ID (for agent-to-agent calls, preserves identity)
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
    usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
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

  /**
   * Agent type determines timeout and behavior
   *
   * - simple: 20s timeout, standard agent
   * - coordinator: 180s timeout, calls other agents
   * - complex: 120s timeout, complex operations
   *
   * Defaults to 'simple' if not specified.
   *
   * @since 2.3.0
   */
  agentType?: 'simple' | 'coordinator' | 'complex';

  /**
   * Whether agent requires authorization to call
   *
   * Defaults based on network:
   * - DevNet: defaults to true (prevents abuse)
   * - Mainnet: defaults to false (public marketplace agent)
   *
   * Set to true for private/B2B agents on mainnet.
   *
   * @since 2.2.0 - Private agents feature
   */
  isPrivate?: boolean;

  /**
   * Array of Solana wallet public keys authorized to call this agent
   *
   * Only used if isPrivate = true.
   * Owner wallet is automatically added (no need to include explicitly).
   *
   * For agent-to-agent calls, include coordinator's operational wallet.
   *
   * @example ['7hGXe4k9pQzTZHbXwFhtQs4R8W5K3p4JvDxNZJz5MqkW', 'Bx4Ty8m3...']
   *
   * @since 2.2.0 - Private agents feature
   */
  accessList?: string[];

  /**
   * Operational wallet for coordinator agents
   *
   * Required for agents that call other agents. This wallet pays for sub-agent calls.
   * Generate with: solana-keygen new
   *
   * @example '2Ys2jTPgg6KLgkYbSDbi9cQNaxKHU3Es6MQZDJscAu95'
   * @since 2.3.0
   */
  operationalWallet?: string;

  /**
   * Signature proving ownership of operational wallet
   *
   * Sign a verification message with your operational wallet.
   * Optional - can be verified later via dashboard.
   *
   * @since 2.3.0
   */
  operationalWalletSignature?: string;
}

/**
 * Metadata fields that can be updated after agent registration
 *
 * All fields are optional - only provide the fields you want to update.
 * Schemas will be validated before update.
 *
 * @since v2.1.0 - Added agent update capability
 */
export interface UpdateAgentMetadata {
  /** New input schema (will be validated) */
  inputSchema?: Record<string, unknown>;

  /** New output schema (will be validated) */
  outputSchema?: Record<string, unknown>;

  /** Updated description */
  description?: string;

  /** Updated price in USD (e.g., 0.02 = 2 cents) */
  priceUSDC?: number;

  /** Updated example inputs (will be validated against input schema) */
  exampleInputs?: Array<{
    label: string;
    input: Record<string, unknown>;
    description?: string;
  }>;
}

/**
 * Studio owner information returned by the platform API
 *
 * Represents the developer/studio that owns an agent.
 * Used for marketplace attribution ("by Your Studio ✓").
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

  /**
   * Input schema (optional - only present on detail endpoint)
   * Use getAgent() to fetch full agent details including schemas
   * @since 2.6.0 - Made optional (not in list responses)
   */
  input_schema?: Record<string, unknown>;

  /**
   * Output schema (optional - only present on detail endpoint)
   * Use getAgent() to fetch full agent details including schemas
   * @since 2.6.0 - Made optional (not in list responses)
   */
  output_schema?: Record<string, unknown>;

  owner_wallet: string;

  /**
   * Studio owner information (added in v1.2.0)
   *
   * Null for agents registered before studios feature,
   * or if owner hasn't completed their profile yet.
   *
   * Use this to display attribution like "by Your Studio ✓"
   *
   * @since v1.2.0
   */
  owner?: OwnerInfo | null;

  fee_bps: number;
  status: string;
  created_at: string;

  /**
   * Example inputs (optional - only present on detail endpoint)
   * Use getAgent() to fetch full agent details including example inputs
   * @since 2.6.0 - Made optional (not in list responses)
   */
  example_inputs?: Array<{
    label: string;
    input: Record<string, unknown>;
    description?: string;
  }>;
  is_beta?: boolean;

  /**
   * Whether agent requires authorization
   * @since 2.2.0
   */
  is_private?: boolean;

  /**
   * Authorized wallet addresses (only exposed to agent owner)
   * For security, this field is typically not included in public API responses
   * @since 2.2.0
   */
  access_list?: string[];
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
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
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
  private plugins: Map<string, PluginInstance>;  // NEW: Plugin registry
  private callingAgentId: string | null;  // NEW: Agent identity for agent-to-agent calls

  constructor(config: TettoConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, ""); // Remove trailing slash
    this.config = config;
    this.plugins = new Map();
    this.callingAgentId = config.agentId || process.env.TETTO_AGENT_ID || null;

    if (this.config.debug && this.callingAgentId) {
      console.log(`🤖 SDK initialized with agent identity: ${this.callingAgentId}`);
    }

    if (!this.callingAgentId && this.config.debug) {
      console.warn(
        '⚠️  TettoSDK initialized without agentId.\n' +
        '   For coordinator agents, use TettoSDK.fromContext(context.tetto_context)\n' +
        '   to automatically configure agent identity for proper analytics tracking.'
      );
    }
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
        agent_type: metadata.agentType,
        is_private: metadata.isPrivate,
        access_list: metadata.accessList,
        operational_wallet_pubkey: metadata.operationalWallet,
        operational_wallet_signature: metadata.operationalWalletSignature,
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
   * Update agent schemas and metadata without re-registering
   *
   * Allows in-place schema evolution, preserving agent ID and history.
   * Only updates fields that are provided (partial update).
   * Schemas validated with AJV before update.
   *
   * ⚠️ **Warning:** Changing schemas may break existing integrations!
   * - Add optional fields (safe)
   * - Avoid changing required fields (breaking)
   * - Test on DevNet first
   *
   * @param agentId - Agent UUID
   * @param updates - Fields to update (all optional)
   * @returns Promise<Agent> - Updated agent with new schemas
   *
   * @throws Error if not authenticated (API key required)
   * @throws Error if not owner (403 Forbidden)
   * @throws Error if schema validation fails (invalid JSON Schema format)
   * @throws Error if example inputs don't match new schema
   *
   * @example Add optional field to input schema
   * ```typescript
   * const updated = await tetto.updateAgent('agent-uuid', {
   *   inputSchema: {
   *     type: 'object',
   *     properties: {
   *       question: { type: 'string' },
   *       context: { type: 'string' }  // NEW optional field
   *     },
   *     required: ['question']  // Still only requires 'question'
   *   },
   *   description: 'Now supports optional context',
   *   exampleInputs: [
   *     {
   *       label: 'Question with context',
   *       input: { question: 'What is the capital?', context: 'France' }
   *     }
   *   ]
   * });
   * ```
   *
   * @see {@link https://docs.tetto.io/sdk/schema-management Full Schema Management Guide}
   * @see {@link https://json-schema.org JSON Schema Documentation}
   *
   * @since v2.1.0
   */
  async updateAgent(
    agentId: string,
    updates: UpdateAgentMetadata
  ): Promise<Agent> {
    this._validateUUID(agentId, 'agent ID');

    // API key required for updates
    if (!this.config.apiKey) {
      throw new Error(
        'API key required for updateAgent.\n\n' +
        'Generate one at: https://www.tetto.io/dashboard/api-keys\n' +
        'Add to config: { apiKey: process.env.TETTO_API_KEY }'
      );
    }

    // At least one field must be provided
    if (!updates.inputSchema && !updates.outputSchema && !updates.description &&
        updates.priceUSDC === undefined && !updates.exampleInputs) {
      throw new Error(
        'No updates provided. Specify at least one field:\n' +
        '- inputSchema\n' +
        '- outputSchema\n' +
        '- description\n' +
        '- priceUSDC\n' +
        '- exampleInputs'
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`
    };

    const response = await fetch(`${this.apiUrl}/api/agents/${agentId}/schemas`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        input_schema: updates.inputSchema,
        output_schema: updates.outputSchema,
        description: updates.description,
        price_usd: updates.priceUSDC,
        example_inputs: updates.exampleInputs
      })
    });

    const result = await response.json() as AgentResponse;

    if (!result.ok) {
      // Handle specific error codes
      if (response.status === 403) {
        throw new Error(
          `Permission denied: ${result.error}\n\n` +
          'Only the agent owner can update schemas.\n' +
          'Verify you are using the correct API key.'
        );
      }

      if (response.status === 400) {
        throw new Error(
          `Validation failed: ${result.error}\n\n` +
          'Check that your schemas are valid JSON Schema format.\n' +
          'Ensure example inputs match the input schema.'
        );
      }

      if (response.status === 401) {
        throw new Error(
          `Authentication failed: ${result.error}\n\n` +
          'Your API key may be invalid or expired.\n' +
          'Generate a new one at: https://www.tetto.io/dashboard/api-keys'
        );
      }

      throw new Error(result.error || 'Agent update failed');
    }

    if (!result.agent) {
      throw new Error('Agent data missing from response');
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
   * List active agents from marketplace with pagination support
   *
   * **Important:** Schemas (`input_schema`, `output_schema`, `example_inputs`) are
   * NOT included in list responses for performance. Use `getAgent()` to fetch full
   * agent details including schemas.
   *
   * @param options - Pagination options
   * @param options.limit - Max agents per page (default: 50, max: 1000)
   * @param options.offset - Skip N agents (default: 0)
   * @returns Object with agents array and pagination metadata
   *
   * @example Basic usage (no pagination):
   * ```typescript
   * const result = await tetto.listAgents();
   * result.agents.forEach(agent => {
   *   console.log(`${agent.name}: ${agent.price_display} USDC`);
   * });
   * console.log(`Showing ${result.count} of ${result.pagination.total} agents`);
   * ```
   *
   * @example With pagination:
   * ```typescript
   * // Get first 10 agents
   * const page1 = await tetto.listAgents({ limit: 10, offset: 0 });
   * console.log(`Page 1: ${page1.count} agents`);
   *
   * // Get next page
   * if (page1.pagination.hasMore) {
   *   const page2 = await tetto.listAgents({ limit: 10, offset: 10 });
   * }
   * ```
   *
   * @example Get full agent details (with schemas):
   * ```typescript
   * const result = await tetto.listAgents({ limit: 5 });
   * const firstAgent = result.agents[0];
   *
   * // Schemas NOT available in list
   * console.log(firstAgent.input_schema);  // undefined
   *
   * // Fetch full details to get schemas
   * const fullAgent = await tetto.getAgent(firstAgent.id);
   * console.log(fullAgent.input_schema);  // { type: 'object', ... }
   * ```
   *
   * @since 2.6.0 - Added pagination support, schemas removed from list response
   */
  async listAgents(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{
    agents: Agent[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
    };
    count: number;
  }> {
    // Build query string
    const params = new URLSearchParams();
    if (options?.limit !== undefined) {
      params.append('limit', options.limit.toString());
    }
    if (options?.offset !== undefined) {
      params.append('offset', options.offset.toString());
    }

    const url = `${this.apiUrl}/api/agents${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    const result = await response.json() as AgentsResponse;

    if (!result.ok) {
      throw new Error(result.error || "Failed to list agents");
    }

    if (!result.agents) {
      throw new Error("Agents data missing from response");
    }

    if (!result.pagination) {
      throw new Error("Pagination data missing from response");
    }

    return {
      agents: result.agents,
      pagination: result.pagination,
      count: result.count || result.agents.length,
    };
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
          calling_agent_id: this.callingAgentId || undefined,  // NEW: Include agent identity
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
  private createPluginAPI(): PluginAPI {
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
      hasPlugin: (pluginId: string) => this.plugins.has(pluginId)
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
   * import { StudioPlugin } from '@your-studio/tetto-plugin';
   *
   * tetto.use(StudioPlugin);
   * await tetto.memory.set('key', 'value', wallet);  // Wallet required!
   * ```
   */
  use(plugin: Plugin, options?: any): PluginInstance {
    // Pass restricted API (NOT full SDK) - SECURITY BOUNDARY
    const instance = plugin(this.createPluginAPI(), options);

    const pluginId = instance.id || plugin.id || instance.name || 'unknown';

    // Check for namespace collisions
    if (instance.name && instance.name in this) {
      throw new Error(
        `Plugin namespace collision: '${instance.name}' is already in use.\n\n` +
        `Loaded plugins:\n` +
        `${this.listPlugins().map(id => `  - ${id}`).join('\n')}\n\n` +
        `Solutions:\n` +
        `1. Load only one plugin at a time\n` +
        `2. Use custom name: tetto.use(Plugin, { name: 'customName' })\n` +
        `3. Access via plugins Map: tetto.getPlugin('${pluginId}')`
      );
    }

    // Store in registry
    this.plugins.set(pluginId, instance);

    // Auto-attach if safe (convenient access via tetto.pluginName)
    if (instance.name) {
      (this as any)[instance.name] = instance;

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
   * const memory = tetto.getPlugin('studioplugin');
   * if (memory) {
   *   await memory.set('key', 'value', wallet);
   * }
   * ```
   */
  getPlugin(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * List all loaded plugins
   *
   * @returns Array of plugin IDs
   */
  listPlugins(): string[] {
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
  async destroy(): Promise<void> {
    for (const [id, instance] of this.plugins.entries()) {
      if (instance.onDestroy && typeof instance.onDestroy === 'function') {
        try {
          await instance.onDestroy();

          if (this.config.debug) {
            console.log(`✅ Plugin ${id} destroyed`);
          }
        } catch (err) {
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
   *     // Create SDK from context (uses current_agent_id for identity)
   *     const tetto = TettoSDK.fromContext(context.tetto_context, {
   *       network: 'mainnet'
   *     });
   *
   *     // Sub-agent calls will be tracked with this coordinator's ID
   *     await tetto.callAgent('studioplugin', { action: 'store' }, wallet);
   *
   *     return { success: true };
   *   }
   * });
   * ```
   */
  static fromContext(
    context: TettoContext,
    overrides: Partial<TettoConfig> = {}
  ): TettoSDK {
    if (!context.current_agent_id && overrides.debug) {
      console.warn(
        '⚠️  Context missing current_agent_id.\n' +
        '   Sub-agent calls will not be tracked in analytics.\n' +
        '   Ensure platform is up to date (v1.2+).'
      );
    }

    const network = context.current_agent_network || overrides.network || 'mainnet';
    const defaults = NETWORK_DEFAULTS[network];

    return new TettoSDK({
      apiUrl: overrides.apiUrl || defaults.apiUrl,
      network,
      protocolWallet: overrides.protocolWallet || defaults.protocolWallet,
      debug: overrides.debug || false,
      apiKey: overrides.apiKey || process.env.TETTO_API_KEY,
      agentId: context.current_agent_id || undefined,
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TettoSDK;

// Helpers
export { createWalletFromKeypair, createWalletFromAdapter } from "./wallet-helpers";
export { getDefaultConfig, createConnection, getUSDCMint } from "./network-helpers";

// Plugin System (v2.0)
export type { PluginAPI } from './plugin-api';
export type { Plugin, PluginInstance, TettoContext, ErrorContext, PluginOptions } from './types';

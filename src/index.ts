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
import { buildAgentPaymentTransaction } from "./transaction-builder";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TettoConfig {
  apiUrl: string;
  network: 'mainnet' | 'devnet';
  protocolWallet: string; // REQUIRED: No fallbacks
  debug?: boolean; // Optional: Enable console logging
}

export interface TettoWallet {
  publicKey: PublicKey;
  signTransaction?: (tx: Transaction) => Promise<Transaction>;
  sendTransaction?: (tx: Transaction, connection: Connection) => Promise<string>;
  connection: Connection;
}

export interface CallAgentOptions {
  skipConfirmation?: boolean;
  preferredToken?: 'SOL' | 'USDC'; // CP3: Let users specify payment token preference
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
    apiUrl: 'https://tetto-portal-seven.vercel.app',
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

// SDK3 - CP1: Build transaction response from platform
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

    const result: any = await response.json();

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
  async getAgent(agentId: string): Promise<Agent> {
    const response = await fetch(`${this.apiUrl}/api/agents/${agentId}`);
    const result: any = await response.json();

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
  async listAgents(): Promise<Agent[]> {
    const response = await fetch(`${this.apiUrl}/api/agents`);
    const result: any = await response.json();

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
  async callAgent(
    agentId: string,
    input: Record<string, unknown>,
    wallet: TettoWallet,
    options?: CallAgentOptions
  ): Promise<CallResult> {
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

    const buildResponse = await fetch(
      `${this.apiUrl}/api/agents/${agentId}/build-transaction`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payer_wallet: wallet.publicKey.toBase58(),
          selected_token: options?.preferredToken,
          input: input,  // SDK3 - CP1: Input validated at build-time!
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

    // Step 4: Sign transaction (SDK3 - CP1: Phase 2)
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

    // Step 5: Call platform API with signed transaction (SDK3 - CP1: Phase 3)
    // SDK3: Only 2 fields - payment_intent_id + signed_transaction
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

    const result: any = await response.json();

    if (!result.ok) {
      if (this.config.debug) console.error("   ❌ Backend call failed:", result.error);
      throw new Error(result.error || "Agent call failed");
    }

    if (this.config.debug) console.log("   ✅ Agent call successful");

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
  async getReceipt(receiptId: string): Promise<Receipt> {
    const response = await fetch(`${this.apiUrl}/api/receipts/${receiptId}`);
    const result: any = await response.json();

    if (!result.ok) {
      throw new Error(result.error || "Receipt not found");
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
export { buildAgentPaymentTransaction } from "./transaction-builder";

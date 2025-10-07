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

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TettoConfig {
  apiUrl: string;
}

export interface AgentMetadata {
  name: string;
  description?: string;
  endpoint: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  priceUSDC: number;
  ownerWallet: string;
  tokenMint?: "SOL" | "USDC";
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

  constructor(config: TettoConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, ""); // Remove trailing slash
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
  async getAgent(agentId: string): Promise<Agent> {
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
  async listAgents(): Promise<Agent[]> {
    const response = await fetch(`${this.apiUrl}/api/agents`);
    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || "Failed to list agents");
    }

    return result.agents;
  }

  /**
   * Call an agent with input and handle payment automatically
   *
   * This method:
   * 1. Validates input against agent's schema
   * 2. Calls the agent's endpoint
   * 3. Validates output against agent's schema
   * 4. Executes USDC payment (if output valid)
   * 5. Returns output + transaction proof
   *
   * @param agentId - Agent UUID to call
   * @param input - Input data (must match agent's input_schema)
   * @param callerWallet - Solana wallet address of caller
   * @returns Agent output + payment proof
   *
   * @example
   * ```typescript
   * const result = await tetto.callAgent(
   *   'agent-uuid',
   *   { text: 'Hello world' },
   *   'YOUR_SOLANA_WALLET'
   * );
   *
   * console.log(result.output);      // Agent's response
   * console.log(result.txSignature);  // Solana transaction
   * console.log(result.receiptId);    // Receipt for proof
   * ```
   */
  async callAgent(
    agentId: string,
    input: Record<string, unknown>,
    callerWallet: string
  ): Promise<CallResult> {
    const response = await fetch(`${this.apiUrl}/api/agents/call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_id: agentId,
        input,
        caller_wallet: callerWallet,
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || "Agent call failed");
    }

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
    const result = await response.json();

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

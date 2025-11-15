/**
 * Coordinator Agent Example - Multi-Agent Orchestration
 *
 * Shows how to build a coordinator agent that calls other agents to accomplish
 * complex tasks. Demonstrates fromContext() and operational wallet patterns.
 *
 * Use case: Research assistant that calls multiple sub-agents for comprehensive analysis
 *
 * Requirements:
 * - COORDINATOR_OPERATIONAL_SECRET in .env (funded wallet)
 * - SUB_AGENT_ID in .env (agent you want to call)
 *
 * Learn more: docs/advanced/coordinators.md
 */

import { createAgentHandler } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';
import { TettoSDK, createWalletFromKeypair } from 'tetto-sdk';
import { Keypair } from '@solana/web3.js';

/**
 * Load operational wallet from environment
 *
 * Operational wallet is a dedicated wallet used to pay sub-agents.
 * This pattern is used by all production coordinator agents.
 *
 * SECURITY: Never commit wallet secrets to git!
 */
function getOperationalWallet() {
  if (!process.env.COORDINATOR_OPERATIONAL_SECRET) {
    throw new Error(
      'COORDINATOR_OPERATIONAL_SECRET not set.\n\n' +
      'Setup:\n' +
      '1. Generate wallet: solana-keygen new --outfile coordinator-wallet.json\n' +
      '2. Get secret: cat coordinator-wallet.json\n' +
      '3. Add to .env: COORDINATOR_OPERATIONAL_SECRET=[64-element array]\n' +
      '4. Fund wallet with USDC (DevNet: https://spl-token-faucet.com)\n\n' +
      'Learn more: docs/building-agents/operational-wallet-guide.md'
    );
  }

  const secretArray = JSON.parse(process.env.COORDINATOR_OPERATIONAL_SECRET);
  const secretKey = Uint8Array.from(secretArray);
  const keypair = Keypair.fromSecretKey(secretKey);
  return createWalletFromKeypair(keypair);
}

/**
 * Coordinator Agent Handler
 *
 * Orchestrates multiple sub-agent calls to accomplish complex tasks.
 */
export const POST = createAgentHandler({
  async handler(input: { task: string }, context: AgentRequestContext) {
    // Validate input
    if (!input?.task || typeof input.task !== 'string') {
      throw new Error('Invalid input: task field is required (string)');
    }

    if (input.task.length < 10) {
      throw new Error('Task too short: minimum 10 characters');
    }

    // Log caller information
    console.log('🎯 Coordinator called by:', {
      caller_wallet: context.tetto_context.caller_wallet,
      caller_agent: context.tetto_context.caller_agent_id || 'user',
      my_agent_id: context.tetto_context.current_agent_id,
      my_agent_name: context.tetto_context.current_agent_name,
      network: context.tetto_context.current_agent_network,
      intent_id: context.tetto_context.intent_id,
    });

    // Initialize SDK (auto-configured from context!)
    // This automatically sets:
    // - agentId (from current_agent_id)
    // - network (from current_agent_network)
    // - apiUrl (based on network)
    const tetto = TettoSDK.fromContext(context.tetto_context);

    // Get operational wallet (for paying sub-agents)
    const operationalWallet = getOperationalWallet();

    console.log(`📋 Processing task: ${input.task.substring(0, 60)}...`);

    // Get sub-agent ID from environment
    const subAgentId = process.env.SUB_AGENT_ID;

    if (!subAgentId) {
      throw new Error(
        'SUB_AGENT_ID environment variable not set.\n\n' +
        'Find agents at: https://tetto.io/agents\n' +
        'Add to .env: SUB_AGENT_ID=your-chosen-agent-id'
      );
    }

    // Call sub-agent (autonomous payment from operational wallet)
    console.log(`📞 Calling sub-agent: ${subAgentId.substring(0, 8)}...`);

    try {
      const result = await tetto.callAgent(
        subAgentId,
        {
          text: input.task,
        },
        operationalWallet
      );

      // Validate response
      if (!result.output) {
        throw new Error('Sub-agent returned empty output');
      }

      console.log(`✅ Sub-agent call successful`);
      console.log(`💰 Cost: $${((result.agentReceived + result.protocolFee) / 1e6).toFixed(3)}`);

      // Return aggregated result
      return {
        result: result.output,
        sub_agent_cost: (result.agentReceived + result.protocolFee) / 1e6,
        transaction: result.txSignature,
      };
    } catch (error: any) {
      console.error('❌ Sub-agent call failed:', error.message);
      throw new Error(`Failed to call sub-agent: ${error.message}`);
    }
  },
});

/**
 * Coordinator Economics Example:
 *
 * User pays coordinator: $0.50
 * Coordinator pays sub-agent: $0.20 (from operational wallet)
 * Coordinator profit: $0.30
 * Protocol fees: ~$0.02 (10% of sub-agent call)
 *
 * IMPORTANT: Coordinator must maintain sufficient USDC balance in operational
 * wallet to pay sub-agents! Monitor balance and refill when low.
 */

/**
 * Setup Instructions:
 *
 * 1. Generate operational wallet:
 *    solana-keygen new --outfile coordinator-wallet.json
 *    solana-keygen pubkey coordinator-wallet.json
 *
 * 2. Fund operational wallet:
 *    DevNet: Visit https://spl-token-faucet.com → Airdrop USDC-Dev
 *    MainNet: Transfer USDC from your personal wallet
 *
 * 3. Add to .env:
 *    COORDINATOR_OPERATIONAL_SECRET=[paste array from coordinator-wallet.json]
 *    SUB_AGENT_ID=your-chosen-sub-agent-id
 *
 * 4. Deploy and register:
 *    vercel --prod
 *
 *    const agent = await tetto.registerAgent({
 *      name: 'MyCoordinator',
 *      agentType: 'coordinator',  // Required!
 *      operationalWallet: 'YOUR_WALLET_PUBKEY',  // Required!
 *      endpoint: 'https://your-app.vercel.app/api/coordinator',
 *      inputSchema: { type: 'object', properties: { task: { type: 'string' } }, required: ['task'] },
 *      outputSchema: { type: 'object', properties: { result: { type: 'object' } }, required: ['result'] },
 *      priceUSDC: 0.50,  // Must cover sub-agent costs + profit
 *      ownerWallet: process.env.OWNER_WALLET_PUBKEY,
 *    });
 *
 * 5. Monitor operational wallet balance:
 *    solana balance YOUR_OPERATIONAL_WALLET_ADDRESS
 *    spl-token balance EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v YOUR_WALLET  # USDC
 *
 * Learn more:
 * - Operational wallet guide: docs/building-agents/operational-wallet-guide.md
 * - Coordinator patterns: docs/advanced/coordinators.md
 */

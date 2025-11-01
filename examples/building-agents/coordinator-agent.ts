/**
 * Coordinator Agent Example
 *
 * This example shows how to build an agent that calls multiple other agents
 * to accomplish a complex task. The coordinator handles payments to sub-agents
 * autonomously.
 *
 * Use case: Code audit that combines security scanning + quality analysis
 *
 * Requirements:
 * - Coordinator must have its own funded wallet
 * - COORDINATOR_WALLET_SECRET in .env
 */

import { createAgentHandler, getTokenMint } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';
import TettoSDK, {
  getDefaultConfig,
  createWalletFromKeypair
} from 'tetto-sdk';
import { Keypair } from '@solana/web3.js';

// Load coordinator's wallet
const coordinatorSecret = JSON.parse(process.env.COORDINATOR_WALLET_SECRET || '[]');
const coordinatorKeypair = Keypair.fromSecretKey(Uint8Array.from(coordinatorSecret));

// Setup SDK for calling sub-agents
const network = (process.env.NETWORK as 'mainnet' | 'devnet') || 'mainnet';
const coordinatorWallet = createWalletFromKeypair(coordinatorKeypair);  // No connection needed!
const tetto = new TettoSDK(getDefaultConfig(network));

export const POST = createAgentHandler({
  async handler(input: { code: string; language: string }, context: AgentRequestContext) {
    console.log('🎯 Coordinator: Starting code audit...');

    // Step 1: Find sub-agents dynamically
    const agents = await tetto.listAgents();

    const securityScanner = agents.find(a => a.name === 'SecurityScanner');
    const qualityAnalyzer = agents.find(a => a.name === 'QualityAnalyzer');

    if (!securityScanner || !qualityAnalyzer) {
      throw new Error('Required sub-agents not found in marketplace');
    }

    console.log(`✅ Found SecurityScanner: $${securityScanner.price_display}`);
    console.log(`✅ Found QualityAnalyzer: $${qualityAnalyzer.price_display}`);

    // Step 2: Call SecurityScanner (autonomous payment)
    console.log('🔒 Calling SecurityScanner...');
    const securityResult = await tetto.callAgent(
      securityScanner.id,
      {
        code: input.code,
        language: input.language
      },
      coordinatorWallet
    );

    console.log(`✅ Security scan complete: ${securityResult.output.score}/100`);

    // Step 3: Call QualityAnalyzer (autonomous payment)
    console.log('📊 Calling QualityAnalyzer...');
    const qualityResult = await tetto.callAgent(
      qualityAnalyzer.id,
      {
        code: input.code,
        language: input.language
      },
      coordinatorWallet
    );

    console.log(`✅ Quality analysis complete: ${qualityResult.output.score}/100`);

    // Step 4: Aggregate results
    const overallScore = Math.round(
      (securityResult.output.score + qualityResult.output.score) / 2
    );

    const grade = overallScore >= 90 ? 'A' :
                  overallScore >= 80 ? 'B' :
                  overallScore >= 70 ? 'C' :
                  overallScore >= 60 ? 'D' : 'F';

    // Step 5: Return comprehensive report
    return {
      overall_score: overallScore,
      grade: grade,
      security: {
        score: securityResult.output.score,
        issues: securityResult.output.issues,
        tx: securityResult.txSignature
      },
      quality: {
        score: qualityResult.output.score,
        suggestions: qualityResult.output.suggestions,
        tx: qualityResult.txSignature
      },
      agents_called: ['SecurityScanner', 'QualityAnalyzer'],
      total_cost: (
        securityResult.agentReceived + securityResult.protocolFee +
        qualityResult.agentReceived + qualityResult.protocolFee
      ) / 1e6
    };
  }
});

/**
 * Coordinator Economics:
 *
 * User pays coordinator: $0.50
 * Coordinator pays SecurityScanner: $0.20
 * Coordinator pays QualityAnalyzer: $0.20
 * Coordinator profit: $0.10
 * Protocol fees: ~$0.04 (10% of each call)
 *
 * Coordinator must maintain sufficient balance to pay sub-agents!
 */

/**
 * Setup:
 *
 * 1. Generate coordinator wallet:
 *    solana-keygen new --outfile coordinator-wallet.json
 *
 * 2. Fund coordinator (mainnet):
 *    Send 0.1 SOL + $10 USDC
 *
 * 3. Add to .env:
 *    COORDINATOR_WALLET_SECRET=[keypair array from step 1]
 *    NETWORK=mainnet
 *
 * 4. Deploy and register with higher price:
 *    Price: $0.50 (must cover sub-agent costs + profit)
 *    Type: coordinator
 *    Timeout: 180s (allows time for multiple calls)
 *
 * 5. Monitor balance:
 *    solana balance YOUR_COORDINATOR_ADDRESS
 */

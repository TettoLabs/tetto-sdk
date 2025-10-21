/**
 * Node.js Example: Call Tetto Agent with Keypair
 *
 * This example shows how to call agents from a backend/script
 * using a Solana keypair for autonomous payments.
 *
 * Use cases:
 * - AI agents calling other AI agents
 * - Backend automation
 * - Batch processing
 * - Scheduled tasks
 *
 * Requirements:
 * - tetto-sdk
 * - @solana/web3.js
 * - dotenv (for loading env vars)
 */

import { Keypair } from '@solana/web3.js';
import dotenv from 'dotenv';
import TettoSDK, {
  createWalletFromKeypair,
  createConnection,
  getDefaultConfig
} from 'tetto-sdk';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🤖 Autonomous Agent Call Example\n');

  // Step 1: Load keypair from environment
  const secretKeyArray = JSON.parse(process.env.WALLET_SECRET || '[]');
  if (secretKeyArray.length === 0) {
    console.error('❌ ERROR: Missing WALLET_SECRET in .env');
    console.error('Add your keypair: WALLET_SECRET=[123,45,67,...]');
    process.exit(1);
  }

  const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
  console.log(`✅ Loaded keypair: ${keypair.publicKey.toBase58()}`);

  // Step 2: Setup connection
  const network = (process.env.NETWORK as 'mainnet' | 'devnet') || 'devnet';
  const connection = createConnection(network);
  console.log(`✅ Connected to ${network}`);

  // Step 3: Create wallet
  const wallet = createWalletFromKeypair(keypair, connection);

  // Step 4: Initialize SDK
  const tetto = new TettoSDK(getDefaultConfig(network));
  console.log(`✅ SDK initialized\n`);

  // Step 5: Find agent to call
  console.log('🔍 Finding TitleGenerator agent...');
  const agents = await tetto.listAgents();
  const titleGen = agents.find(a => a.name === 'TitleGenerator');

  if (!titleGen) {
    throw new Error('TitleGenerator not found');
  }

  console.log(`✅ Found: ${titleGen.name}`);
  console.log(`   Price: $${titleGen.price_display} ${titleGen.token}`);
  console.log(`   Owner: ${titleGen.owner_wallet}\n`);

  // Step 6: Call agent autonomously
  console.log('🚀 Calling agent...');

  const result = await tetto.callAgent(
    titleGen.id,
    {
      text: 'Autonomous AI agents are revolutionizing how we build and deploy AI services by enabling direct machine-to-machine payments on blockchain networks.'
    },
    wallet
  );

  // Step 7: Display results
  console.log('\n✅ Success!\n');
  console.log('📊 Output:');
  console.log(JSON.stringify(result.output, null, 2));
  console.log();
  console.log('💰 Payment Details:');
  console.log(`   Transaction: ${result.txSignature}`);
  console.log(`   Receipt ID: ${result.receiptId}`);
  console.log(`   Agent Received: $${(result.agentReceived / 1e6).toFixed(6)}`);
  console.log(`   Protocol Fee: $${(result.protocolFee / 1e6).toFixed(6)}`);
  console.log(`   Total Cost: $${((result.agentReceived + result.protocolFee) / 1e6).toFixed(6)}`);
  console.log();
  console.log('🔗 Explorer:');
  console.log(`   ${result.explorerUrl}`);
  console.log();

  // Step 8: Verify receipt (optional)
  console.log('📝 Fetching receipt...');
  const receipt = await tetto.getReceipt(result.receiptId);
  console.log('✅ Receipt verified:');
  console.log(`   Status: ${receipt.status}`);
  console.log(`   Created: ${receipt.created_at}`);
  console.log();
}

// Run example
main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

/**
 * To run this example:
 *
 * 1. Create .env file:
 *    WALLET_SECRET=[your,keypair,array]
 *    NETWORK=devnet
 *
 * 2. Fund your wallet (devnet):
 *    solana airdrop 1 --keypair your-wallet.json --url devnet
 *
 * 3. Run:
 *    npx tsx examples/calling-agents/node-keypair.ts
 */

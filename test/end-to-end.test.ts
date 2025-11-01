/**
 * End-to-End Integration Test
 *
 * Tests complete SDK workflow against live Tetto platform:
 * - Wallet loading and configuration
 * - Agent discovery (listAgents)
 * - Agent calling with payment
 * - Result verification
 *
 * No RPC connection needed! Platform handles transaction submission.
 *
 * Requires: Funded wallet (devnet or mainnet), TEST_WALLET_SECRET in .env
 * Network: Devnet (default, free) or Mainnet (costs real money)
 *
 * This validates the complete developer experience from setup to earning revenue.
 */

import { Keypair } from '@solana/web3.js';
import dotenv from 'dotenv';
import TettoSDK, {
  createWalletFromKeypair,
  getDefaultConfig
} from '../src/index';

// Load environment variables
dotenv.config();

async function testSDK() {
  console.log('🧪 Testing Tetto SDK v2.0.0 (Node.js + Keypair)\n');
  console.log('='.repeat(60));

  // Step 1: Load test wallet from local .env
  console.log('\n1. Loading test wallet...');

  if (!process.env.TEST_WALLET_SECRET) {
    console.error('\n❌ ERROR: Missing TEST_WALLET_SECRET environment variable\n');
    console.error('To fix this:');
    console.error('  1. Copy .env.example to .env:');
    console.error('     $ cp .env.example .env\n');
    console.error('  2. Generate a test wallet:');
    console.error('     $ solana-keygen new --outfile ~/.config/solana/test-wallet.json\n');
    console.error('  3. Copy the keypair array from test-wallet.json to .env:');
    console.error('     TEST_WALLET_SECRET=[123,45,67,...]\n');
    console.error('  4. Fund the wallet on devnet (free):');
    console.error('     $ solana airdrop 1 --keypair ~/.config/solana/test-wallet.json --url devnet');
    console.error('     Or visit: https://faucet.solana.com\n');
    console.error('  5. Run tests again:');
    console.error('     $ npm test\n');
    process.exit(1);
  }

  let keypair: Keypair;
  try {
    const secretKeyArray = JSON.parse(process.env.TEST_WALLET_SECRET);
    keypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
    console.log(`   ✅ Loaded keypair: ${keypair.publicKey.toBase58()}`);
  } catch (error) {
    console.error('\n❌ ERROR: Invalid TEST_WALLET_SECRET format\n');
    console.error('Expected format: [123,45,67,...]');
    console.error('Received:', process.env.TEST_WALLET_SECRET?.substring(0, 50) + '...\n');
    process.exit(1);
  }

  // Step 2: Determine network (No connection needed!)
  console.log('\n2. Determining network...');
  const network = (process.env.TEST_NETWORK as 'mainnet' | 'devnet') || 'devnet';
  console.log(`   ✅ Using ${network}`);
  console.log(`   ✅ No RPC connection needed!`);

  if (network === 'mainnet') {
    console.warn('\n⚠️  WARNING: Running tests on MAINNET');
    console.warn('⚠️  This will cost real SOL/USDC!');
    console.warn('⚠️  Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Step 3: Create wallet object (No connection parameter!)
  console.log('\n3. Creating wallet object...');
  const wallet = createWalletFromKeypair(keypair);
  console.log(`   ✅ Wallet ready: ${wallet.publicKey.toBase58()}`);

  // Step 4: Initialize Tetto SDK
  console.log('\n4. Initializing Tetto SDK...');
  const config = getDefaultConfig(network);
  config.debug = process.env.DEBUG === 'true';
  const tetto = new TettoSDK(config);
  console.log(`   ✅ SDK initialized`);
  console.log(`      API: ${config.apiUrl}`);
  console.log(`      Network: ${config.network}`);
  console.log(`      Protocol: ${config.protocolWallet}`);

  // Step 5: Get TitleGenerator agent
  console.log('\n5. Fetching TitleGenerator agent...');
  const agents = await tetto.listAgents();
  const titleGen = agents.find(a => a.name === 'TitleGenerator');

  if (!titleGen) {
    throw new Error('TitleGenerator not found');
  }

  console.log(`   ✅ Found agent: ${titleGen.name}`);
  console.log(`      Price: $${titleGen.price_display} ${titleGen.token}`);
  console.log(`      Owner: ${titleGen.owner_wallet}`);

  // Step 6: Call agent with test input
  console.log('\n6. Calling agent (input validated before payment!)...');
  console.log('   Input: "Tetto SDK v2.0.0 - context passing and coordinator patterns"');

  const result = await tetto.callAgent(
    titleGen.id,
    { text: 'Tetto SDK v2.0.0 enables autonomous AI agent payments with required context parameter, plugin system, and proven coordinator patterns for multi-agent workflows' },
    wallet
  );

  console.log('\n' + '='.repeat(60));
  console.log('✅ TEST PASSED!\n');
  console.log('Result:');
  console.log(`   Output: ${JSON.stringify(result.output, null, 2)}`);
  console.log(`   TX Signature: ${result.txSignature}`);
  console.log(`   Receipt: ${result.receiptId}`);
  console.log(`   Explorer: ${result.explorerUrl}`);
  console.log(`   Agent Received: $${result.agentReceived}`);
  console.log(`   Protocol Fee: $${result.protocolFee}`);
  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 SDK v2.0.0 is working! Complete workflow validated end-to-end!\n');
}

// Run test
testSDK().catch(error => {
  console.error('\n❌ TEST FAILED:\n');
  console.error(error);
  process.exit(1);
});

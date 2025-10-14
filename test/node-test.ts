/**
 * Test SDK v0.2.0 with Node.js Keypair
 *
 * This tests the new client-side signing flow on mainnet
 */

import { Keypair } from '@solana/web3.js';
import TettoSDK, {
  createWalletFromKeypair,
  createConnection,
  getDefaultConfig
} from '../src/index';

async function testSDK() {
  console.log('🧪 Testing Tetto SDK v0.2.0 (Node.js + Keypair)\n');
  console.log('='.repeat(60));

  // Step 1: Load AI agent wallet from parent tetto-portal
  console.log('\n1. Loading AI agent wallet...');
  const secretKeyPath = '../tetto-portal/.env';

  // For testing, we'll use the demo payer wallet from portal
  // In production, external devs would use their own keypair
  const fs = require('fs');
  const envContent = fs.readFileSync(secretKeyPath, 'utf-8');
  const match = envContent.match(/DEMO_PAYER_SECRET_KEY=\[(.*?)\]/);

  if (!match) {
    throw new Error('Could not find DEMO_PAYER_SECRET_KEY in .env');
  }

  const secretKeyArray = JSON.parse(`[${match[1]}]`);
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));

  console.log(`   ✅ Loaded keypair: ${keypair.publicKey.toBase58()}`);

  // Step 2: Create connection (mainnet)
  console.log('\n2. Creating Solana connection...');
  const connection = createConnection('mainnet');
  console.log(`   ✅ Connected to mainnet`);

  // Step 3: Create wallet object
  console.log('\n3. Creating wallet object...');
  const wallet = createWalletFromKeypair(keypair, connection);
  console.log(`   ✅ Wallet ready: ${wallet.publicKey.toBase58()}`);

  // Step 4: Initialize SDK
  console.log('\n4. Initializing Tetto SDK...');
  const config = getDefaultConfig('mainnet');
  config.debug = true; // Enable debug logging
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
  console.log('\n6. Calling agent (this will submit a mainnet transaction)...');
  console.log('   Input: "Tetto SDK v0.2.0 enables autonomous AI agent payments"');

  const result = await tetto.callAgent(
    titleGen.id,
    { text: 'Tetto SDK v0.2.0 enables autonomous AI agent payments on Solana mainnet with client-side transaction signing' },
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
  console.log('\n🎉 SDK v0.2.0 is working! External developers can now use Tetto!\n');
}

// Run test
testSDK().catch(error => {
  console.error('\n❌ TEST FAILED:\n');
  console.error(error);
  process.exit(1);
});

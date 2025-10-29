/**
 * Devnet Testing Example - Complete Workflow
 *
 * This example demonstrates the complete workflow for testing agents on devnet
 * before promoting to mainnet.
 *
 * Prerequisites:
 * - Devnet SOL: solana airdrop 2 --url devnet (free, unlimited)
 * - Devnet USDC: https://spl-token-faucet.com → Select "USDC-Dev" (free, unlimited)
 * - TETTO_API_KEY: Get from https://www.tetto.io/dashboard/api-keys
 * - Deployed agent endpoint (can be same as mainnet will use)
 *
 * Run:
 * TETTO_NETWORK=devnet npx ts-node examples/testing/devnet-example.ts
 *
 * Learn more: docs/testing-on-devnet.md
 */

import TettoSDK, { NETWORK_DEFAULTS, createWalletFromKeypair } from '../../src/index';
import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Load Solana keypair from file
 */
function loadKeypair(filepath: string): Keypair {
  const expandedPath = filepath.replace('~', os.homedir());
  const keypairData = JSON.parse(fs.readFileSync(expandedPath, 'utf-8'));
  return Keypair.fromSecretKey(new Uint8Array(keypairData));
}

async function main() {
  console.log('🧪 Devnet Testing Example - Complete Workflow');
  console.log('='.repeat(70));
  console.log();
  console.log('Testing on: dev.tetto.io');
  console.log('Using: Devnet USDC (fake tokens, FREE testing)');
  console.log();

  // Verify environment
  const network = (process.env.TETTO_NETWORK || 'devnet') as 'mainnet' | 'devnet';

  if (network !== 'devnet') {
    console.warn('⚠️  WARNING: TETTO_NETWORK is set to', network);
    console.warn('⚠️  This example is for DEVNET testing only.');
    console.warn('⚠️  Set TETTO_NETWORK=devnet to continue.');
    console.warn();
    process.exit(1);
  }

  // Step 1: Load wallet
  console.log('Step 1: Loading wallet...');
  const keypairPath = process.env.SOLANA_KEYPAIR_PATH || '~/.config/solana/id.json';

  let keypair: Keypair;
  try {
    keypair = loadKeypair(keypairPath);
    console.log('✅ Wallet loaded:', keypair.publicKey.toBase58());
  } catch (error) {
    console.error('❌ Failed to load keypair from:', keypairPath);
    console.error('   Set SOLANA_KEYPAIR_PATH or create wallet at ~/.config/solana/id.json');
    console.error();
    console.error('To create wallet:');
    console.error('  solana-keygen new --outfile ~/.config/solana/id.json');
    process.exit(1);
  }

  console.log();

  // Step 2: Verify devnet funds
  console.log('Step 2: Checking devnet funds...');
  console.log();
  console.log('Make sure you have:');
  console.log('  • Devnet SOL (for transaction fees)');
  console.log('    Get free: solana airdrop 2 --url devnet');
  console.log('    Or visit: https://faucet.solana.com');
  console.log();
  console.log('  • Devnet USDC (for agent payments)');
  console.log('    Get free: https://spl-token-faucet.com → Select "USDC-Dev"');
  console.log();
  console.log('Press Enter when you have devnet funds...');

  // In real script, you might check balances programmatically
  // For this example, we'll continue

  console.log('✅ Continuing (assuming you have devnet funds)');
  console.log();

  // Step 3: Configure SDK for devnet
  console.log('Step 3: Configuring SDK for devnet...');

  const tetto = new TettoSDK({
    ...NETWORK_DEFAULTS.devnet,
    network: 'devnet',
    apiKey: process.env.TETTO_API_KEY,
  });

  console.log('✅ SDK configured for devnet');
  console.log('   API URL: https://dev.tetto.io');
  console.log('   Network: devnet');
  console.log();

  // Step 4: Register test agent
  console.log('Step 4: Registering test agent to dev.tetto.io...');
  console.log();

  try {
    const agent = await tetto.registerAgent({
      name: 'DevnetTestAgent',
      description: 'Testing agent on devnet before mainnet deployment',
      endpoint: 'https://my-agent.vercel.app/api/test',  // Your agent endpoint
      inputSchema: {
        type: 'object',
        required: ['text'],
        properties: {
          text: {
            type: 'string',
            description: 'Text to process',
            minLength: 10
          }
        }
      },
      outputSchema: {
        type: 'object',
        required: ['result'],
        properties: {
          result: {
            type: 'string',
            description: 'Processed result'
          }
        }
      },
      priceUSDC: 0.01,  // Costs 0.01 devnet USDC (fake!)
      ownerWallet: keypair.publicKey.toBase58(),
      isBeta: true,  // Mark as beta during testing
    });

    console.log('✅ Agent registered to devnet!');
    console.log('   ID:', agent.id);
    console.log('   Name:', agent.name);
    console.log('   View at: https://dev.tetto.io/agents/' + agent.id);
    console.log();

    // Step 5: Test calling the agent
    console.log('Step 5: Testing agent call...');
    console.log();

    const wallet = createWalletFromKeypair(keypair);

    const callResult = await tetto.callAgent(
      agent.id,
      { text: 'This is a test input for devnet testing. It should be at least 10 characters.' },
      wallet
    );

    console.log('✅ Agent call successful!');
    console.log('   Output:', callResult.output);
    console.log('   TX Signature:', callResult.txSignature);
    console.log('   Receipt ID:', callResult.receiptId);
    console.log('   Explorer:', callResult.explorerUrl);
    console.log('   Cost: 0.01 devnet USDC (fake!)');
    console.log();

    // Step 6: Ready for mainnet
    console.log('='.repeat(70));
    console.log('🎉 Devnet Testing Complete!');
    console.log('='.repeat(70));
    console.log();
    console.log('Your agent works on devnet. Ready to promote to mainnet?');
    console.log();
    console.log('Promotion Steps:');
    console.log('1. Change config to mainnet:');
    console.log('   const tetto = new TettoSDK(getDefaultConfig(\'mainnet\'));');
    console.log();
    console.log('2. Re-register agent (same endpoint URL!):');
    console.log('   const prodAgent = await tetto.registerAgent({');
    console.log('     name: \'MyAgent\',  // Remove "Test" prefix');
    console.log('     endpoint: \'' + 'https://my-agent.vercel.app/api/test' + '\',');
    console.log('     // ... same configuration');
    console.log('     isBeta: false,  // Production ready!');
    console.log('   });');
    console.log();
    console.log('3. Agent appears on www.tetto.io (live marketplace!)');
    console.log();
    console.log('4. Complete your profile:');
    console.log('   https://www.tetto.io/dashboard/profile');
    console.log();
    console.log('5. Start earning real revenue!');
    console.log();
    console.log('Learn more:');
    console.log('  • Testing Guide: docs/testing-on-devnet.md');
    console.log('  • Environments: docs/environments.md');
    console.log('  • Studios: docs/studios/README.md');
    console.log();

  } catch (error) {
    console.error('❌ Error during testing:', error instanceof Error ? error.message : error);
    console.error();
    console.error('Common issues:');
    console.error('  • No API key: Get from https://www.tetto.io/dashboard/api-keys');
    console.error('  • Insufficient USDC: Get free devnet USDC from https://spl-token-faucet.com');
    console.error('  • Insufficient SOL: Run "solana airdrop 2 --url devnet"');
    console.error();
    console.error('See troubleshooting: docs/troubleshooting.md');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

/**
 * Complete Agent Registration Example - With Profile Awareness
 *
 * This example shows the FULL workflow:
 * 1. Register your agent
 * 2. Reminder to complete profile
 * 3. Check eligibility for verification
 *
 * Run: npx ts-node examples/building-agents/register-with-profile.ts
 */

import { TettoSDK, NETWORK_DEFAULTS } from '../../src/index';
import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * Load Solana keypair from file
 */
function loadKeypair(filepath: string): Keypair {
  const expandedPath = filepath.replace('~', os.homedir());
  const keypairData = JSON.parse(fs.readFileSync(expandedPath, 'utf-8'));
  return Keypair.fromSecretKey(new Uint8Array(keypairData));
}

async function main() {
  console.log('🚀 Tetto Agent Registration with Profile Awareness\n');

  // Load wallet (owner receives 90% of payments)
  const keypairPath = process.env.SOLANA_KEYPAIR_PATH || '~/.config/solana/id.json';
  let keypair: Keypair;

  try {
    keypair = loadKeypair(keypairPath);
    console.log('✅ Wallet loaded:', keypair.publicKey.toBase58(), '\n');
  } catch (error) {
    console.error('❌ Failed to load keypair from:', keypairPath);
    console.error('   Set SOLANA_KEYPAIR_PATH or create wallet at ~/.config/solana/id.json');
    process.exit(1);
  }

  // Initialize SDK
  const tetto = new TettoSDK({
    ...NETWORK_DEFAULTS.mainnet,
    network: 'mainnet',
    apiKey: process.env.TETTO_API_KEY, // Get from dashboard/api-keys
  });

  console.log('📝 Registering agent...\n');

  // Register agent
  try {
    const agent = await tetto.registerAgent({
      name: 'TextSummarizer',
      description: 'Summarizes text into concise summaries using Claude',
      endpoint: 'https://my-agent.vercel.app/api/summarize',
      inputSchema: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', description: 'Text to summarize' }
        }
      },
      outputSchema: {
        type: 'object',
        required: ['summary'],
        properties: {
          summary: { type: 'string', description: 'Summarized text' }
        }
      },
      priceUSDC: 0.01,
      ownerWallet: keypair.publicKey.toBase58(),
    });

    console.log('✅ Agent registered successfully!');
    console.log(`   ID: ${agent.id}`);
    console.log(`   Name: ${agent.name}`);
    console.log(`   View: https://www.tetto.io/agents/${agent.id}`);
    console.log();

  } catch (error) {
    console.error('❌ Registration failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // PROFILE REMINDER
  console.log('━'.repeat(60));
  console.log('📝 IMPORTANT: Complete Your Developer Profile');
  console.log('━'.repeat(60));
  console.log();
  console.log('Your agent is live, but customers don\'t know who built it!');
  console.log();
  console.log('✨ Complete your profile to:');
  console.log('  • Show "by [Your Name]" on your agents');
  console.log('  • Get discovered on /studios directory');
  console.log('  • Become eligible for verified badge (✓)');
  console.log('  • Enable customer support contact');
  console.log();
  console.log('👉 Visit: https://www.tetto.io/dashboard/profile');
  console.log();
  console.log('📋 What to add:');
  console.log('  - Display Name (your name or studio name)');
  console.log('  - Avatar URL (your logo, 400x400px)');
  console.log('  - Bio (explain what you do, 100+ chars)');
  console.log('  - Social Links (GitHub, Twitter, or Website)');
  console.log();
  console.log('🏢 Optional: Create Studio');
  console.log('  - Check "Create Studio Page"');
  console.log('  - Choose slug (⚠️  permanent!)');
  console.log('  - Add tagline');
  console.log('  - Add support email');
  console.log();

  // Check verification eligibility (if API key provided)
  if (process.env.TETTO_API_KEY) {
    console.log('━'.repeat(60));
    console.log('🔍 Checking Verification Eligibility');
    console.log('━'.repeat(60));
    console.log();

    try {
      // Note: This endpoint requires authentication
      // For now, just show the URL to check manually
      console.log('Check your eligibility at:');
      console.log('  https://www.tetto.io/api/studios/eligibility');
      console.log();
      console.log('📊 Verification Requirements:');
      console.log('  • 25+ successful agent calls');
      console.log('  • 95%+ success rate');
      console.log('  • 3+ active agents');
      console.log('  • $100+ revenue OR $50+ in last 30 days');
      console.log('  • Complete profile + 14+ day account');
      console.log();
      console.log('Learn more: https://tetto.io/docs/studios/verification');
      console.log();
    } catch (error) {
      // Expected if not authenticated
      console.log('ℹ️  Complete your profile first, then check eligibility');
      console.log();
    }
  } else {
    console.log('━'.repeat(60));
    console.log('ℹ️  Get an API Key for Verification Checks');
    console.log('━'.repeat(60));
    console.log();
    console.log('Visit: https://www.tetto.io/dashboard/api-keys');
    console.log('Then set: export TETTO_API_KEY=your_key_here');
    console.log();
  }

  console.log('━'.repeat(60));
  console.log('✨ Next Steps');
  console.log('━'.repeat(60));
  console.log();
  console.log('1. ✅ Complete your profile (link above)');
  console.log('2. 🎯 Build track record (get calls!)');
  console.log('3. 🚀 Deploy more agents (3+ for verification)');
  console.log('4. 💰 Earn revenue ($100+ total OR $50+ in 30d)');
  console.log('5. ✓  Get verified automatically');
  console.log();
  console.log('📚 Documentation:');
  console.log('  • Studios Guide: https://tetto.io/docs/studios');
  console.log('  • Verification: https://tetto.io/docs/studios/verification');
  console.log('  • Best Practices: https://tetto.io/docs/studios/best-practices');
  console.log();
  console.log('🎉 Happy building!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

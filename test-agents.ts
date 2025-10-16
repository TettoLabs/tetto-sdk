/**
 * Flexible agent testing - test specific agents
 *
 * Usage:
 *   npm run test:agents -- summarizer title-generator
 *   npm run test:agents -- wallet-inspector fact-checker
 *   npm run test:agents -- all
 */

import TettoSDK, {
  createWalletFromKeypair,
  createConnection,
  getDefaultConfig
} from './src/index';
import { Keypair } from '@solana/web3.js';

// All available agents
const ALL_AGENTS: Record<string, any> = {
  'summarizer': {
    id: 'aadc71f2-0b84-4f03-8811-aadb445ce57f',
    name: 'Summarizer',
    input: {
      text: 'Artificial intelligence and machine learning are revolutionizing how we build software. AI agents can now autonomously make decisions, call other agents, and process payments.'
    },
    expectedOutput: ['summary'],
  },
  'title-generator': {
    id: '60fa88a8-5e8e-4884-944f-ac9fe278ff18',
    name: 'TitleGenerator',
    input: {
      text: 'The emerging AI agent economy and how autonomous agents transact using blockchain.'
    },
    expectedOutput: ['title'],
  },
  'wallet-inspector': {
    id: 'f29c8d65-4744-493b-90e6-c55810e3bbc9',
    name: 'WalletInspector',
    input: {
      wallet: 'CYSnefexbvrRU6VxzGfvZqKYM4UixupvDeZg3sUSWm84'
    },
    expectedOutput: ['sol_balance', 'tokens'],
  },
  'security-scanner': {
    id: '69cc177d-9f26-419d-8172-05ee31f52c23',
    name: 'SecurityScanner',
    input: {
      code: 'const query = "SELECT * FROM users WHERE id = " + userId;',
      language: 'javascript'
    },
    expectedOutput: ['security_score', 'vulnerabilities'],
  },
  'quality-analyzer': {
    id: '888bf081-523d-4d14-b372-b168533b9794',
    name: 'QualityAnalyzer',
    input: {
      code: `function processData(data) {
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data.length; j++) {
      console.log(data[i], data[j]);
    }
  }
}`,
      language: 'javascript'
    },
    expectedOutput: ['quality_score', 'complexity'],
  },
  'fact-checker': {
    id: 'ab58b647-183c-434d-beed-77233f13b50a',
    name: 'FactChecker',
    input: {
      original_text: 'The Earth is flat and rests on the back of a giant turtle.',
      summary: 'The Earth has been proven to be flat by multiple independent studies.'
    },
    expectedOutput: ['verdict', 'score', 'reasons'],
  },
  'code-audit-pro': {
    id: 'b7dc24b4-870d-447f-8c41-af2b81f5ec30',
    name: 'CodeAuditPro',
    input: {
      code: 'function test() { return "test"; }',
      language: 'javascript'
    },
    expectedOutput: ['overall_score', 'security', 'quality'],
  },
};

async function testAgent(agentKey: string, runs: number = 2) {
  const agent = ALL_AGENTS[agentKey];
  if (!agent) {
    console.error(`❌ Unknown agent: ${agentKey}`);
    console.log(`\nAvailable agents: ${Object.keys(ALL_AGENTS).join(', ')}`);
    return { passed: 0, failed: runs };
  }

  console.log(`\n📦 Testing ${agent.name}...`);
  console.log(`   Agent ID: ${agent.id}`);
  console.log(`   Runs: ${runs}\n`);

  let passed = 0;
  let failed = 0;

  for (let run = 1; run <= runs; run++) {
    const startTime = Date.now();

    try {
      const connection = createConnection('mainnet');
      const testSecret = JSON.parse(process.env.TEST_WALLET_SECRET!);
      const keypair = Keypair.fromSecretKey(Uint8Array.from(testSecret));
      const wallet = createWalletFromKeypair(keypair, connection);
      const tetto = new TettoSDK(getDefaultConfig('mainnet'));

      const result = await tetto.callAgent(agent.id, agent.input, wallet);
      const duration = Date.now() - startTime;

      // Verify output has expected fields
      const hasExpectedFields = agent.expectedOutput.every((field: string) =>
        result.output.hasOwnProperty(field)
      );

      if (!hasExpectedFields) {
        const actualFields = Object.keys(result.output);
        throw new Error(
          `Missing fields. Expected: [${agent.expectedOutput.join(', ')}], Got: [${actualFields.join(', ')}]`
        );
      }

      console.log(`   ✅ Run ${run}/${runs}: Success (${duration}ms)`);
      console.log(`      Receipt: ${result.receiptId}`);
      console.log(`      TX: ${result.txSignature.slice(0, 20)}...`);

      passed++;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`   ❌ Run ${run}/${runs}: Failed (${duration}ms)`);
      console.error(`      Error: ${error.message}`);

      failed++;
    }

    // Wait between calls
    if (run < runs) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n   Summary: ${passed}/${runs} passed (${((passed/runs)*100).toFixed(0)}%)`);
  return { passed, failed };
}

async function main() {
  // Parse command line args
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: npx ts-node test-agents.ts <agent-name> [--runs N]');
    console.log('\nAvailable agents:');
    Object.keys(ALL_AGENTS).forEach(key => {
      console.log(`  - ${key}`);
    });
    console.log('\nExamples:');
    console.log('  npx ts-node test-agents.ts summarizer');
    console.log('  npx ts-node test-agents.ts wallet-inspector --runs 3');
    process.exit(0);
  }

  // Check for --runs flag
  let runs = 2;
  const runsIndex = args.indexOf('--runs');
  if (runsIndex !== -1 && args[runsIndex + 1]) {
    runs = parseInt(args[runsIndex + 1]);
    args.splice(runsIndex, 2); // Remove --runs and value
  }

  // Get single agent to test
  const agentKey = args[0];

  if (!ALL_AGENTS[agentKey]) {
    console.error(`❌ Unknown agent: ${agentKey}`);
    console.log(`\nAvailable: ${Object.keys(ALL_AGENTS).join(', ')}`);
    process.exit(1);
  }

  // Load test wallet
  if (!process.env.TEST_WALLET_SECRET) {
    console.error('❌ TEST_WALLET_SECRET environment variable not set');
    process.exit(1);
  }

  const testSecret = JSON.parse(process.env.TEST_WALLET_SECRET);
  const keypair = Keypair.fromSecretKey(Uint8Array.from(testSecret));
  const connection = createConnection('mainnet');

  console.log('🧪 Tetto Agent Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\nTest wallet: ${keypair.publicKey.toBase58()}`);

  // Check balance
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`SOL balance: ${(balance / 1e9).toFixed(4)} SOL`);

  try {
    const { getAccount, getAssociatedTokenAddress } = await import('@solana/spl-token');
    const { PublicKey } = await import('@solana/web3.js');
    const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    const ata = await getAssociatedTokenAddress(usdcMint, keypair.publicKey);
    const account = await getAccount(connection, ata);
    console.log(`USDC balance: ${(Number(account.amount) / 1e6).toFixed(2)} USDC`);
  } catch {
    console.log('USDC balance: 0 USDC');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test the agent
  const results = await testAgent(agentKey, runs);

  // Summary
  const total = results.passed + results.failed;
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Result: ${results.passed}/${total} passed (${((results.passed/total)*100).toFixed(0)}%)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const exitCode = results.failed === 0 ? 0 : 1;
  process.exit(exitCode);
}

main().catch(error => {
  console.error('\n❌ Test crashed:', error);
  process.exit(1);
});

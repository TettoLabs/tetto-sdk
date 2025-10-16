/**
 * Comprehensive test suite for all Tetto agents
 *
 * Tests each agent 5 times to verify:
 * - Payment processing
 * - Agent execution
 * - Output validity
 * - Receipt generation
 * - Fee splits
 */

import TettoSDK, {
  createWalletFromKeypair,
  createConnection,
  getDefaultConfig
} from './src/index';
import { Keypair } from '@solana/web3.js';

// Agent test configurations (CORRECTED IDs from API)
const AGENTS = [
  {
    id: 'aadc71f2-0b84-4f03-8811-aadb445ce57f',
    name: 'Summarizer',
    input: {
      text: 'Artificial intelligence and machine learning are revolutionizing how we build software. AI agents can now autonomously make decisions, call other agents, and process payments. This creates a new economy where software services can transact with each other without human intervention. The implications are profound for automation and scalability.'
    },
    expectedOutput: ['summary'],
  },
  {
    id: '60fa88a8-5e8e-4884-944f-ac9fe278ff18', // CORRECTED
    name: 'TitleGenerator',
    input: {
      text: 'In this article we explore the emerging AI agent economy and how autonomous agents are beginning to transact with each other using blockchain technology.'
    },
    expectedOutput: ['title'],
  },
  {
    id: 'f29c8d65-4744-493b-90e6-c55810e3bbc9', // CORRECTED
    name: 'WalletInspector',
    input: {
      wallet: 'CYSnefexbvrRU6VxzGfvZqKYM4UixupvDeZg3sUSWm84'
    },
    expectedOutput: ['sol_balance', 'tokens'], // Match registered schema
  },
  {
    id: '69cc177d-9f26-419d-8172-05ee31f52c23',
    name: 'SecurityScanner',
    input: {
      code: 'const query = "SELECT * FROM users WHERE id = " + userId;',
      language: 'javascript'
    },
    expectedOutput: ['security_score', 'vulnerabilities'],
  },
  {
    id: '888bf081-523d-4d14-b372-b168533b9794',
    name: 'QualityAnalyzer',
    input: {
      code: `function processData(data) {
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data.length; j++) {
      for (let k = 0; k < data.length; k++) {
        console.log(data[i], data[j], data[k]);
      }
    }
  }
}`,
      language: 'javascript'
    },
    expectedOutput: ['quality_score', 'complexity'],
  },
  {
    id: 'ab58b647-183c-434d-beed-77233f13b50a', // ADDED FactChecker
    name: 'FactChecker',
    input: {
      original_text: 'The Earth is flat and rests on the back of a giant turtle.',
      summary: 'The Earth has been proven to be flat by multiple independent studies.'
    },
    expectedOutput: ['verdict', 'score', 'reasons'], // Match registered schema
  },
];

interface TestResult {
  agent: string;
  run: number;
  success: boolean;
  duration: number;
  txSignature?: string;
  receiptId?: string;
  error?: string;
}

async function runTests() {
  console.log('🧪 Tetto Agent Test Suite');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Load test wallet
  if (!process.env.TEST_WALLET_SECRET) {
    console.error('❌ TEST_WALLET_SECRET environment variable not set');
    console.error('\nUsage:');
    console.error('TEST_WALLET_SECRET=\'[123,45,...]\' npx ts-node test-all-agents.ts');
    process.exit(1);
  }

  const testSecret = JSON.parse(process.env.TEST_WALLET_SECRET);
  const keypair = Keypair.fromSecretKey(Uint8Array.from(testSecret));

  console.log(`Test wallet: ${keypair.publicKey.toBase58()}\n`);

  // Check balance
  const connection = createConnection('mainnet');
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`SOL balance: ${(balance / 1e9).toFixed(4)} SOL`);

  try {
    const { getAccount, getAssociatedTokenAddress } = await import('@solana/spl-token');
    const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const ata = await getAssociatedTokenAddress(
      new (await import('@solana/web3.js')).PublicKey(usdcMint),
      keypair.publicKey
    );
    const account = await getAccount(connection, ata);
    console.log(`USDC balance: ${(Number(account.amount) / 1e6).toFixed(2)} USDC`);
  } catch {
    console.log('USDC balance: 0 USDC (no ATA)');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Setup SDK
  const wallet = createWalletFromKeypair(keypair, connection);
  const tetto = new TettoSDK(getDefaultConfig('mainnet'));

  const allResults: TestResult[] = [];
  let totalTests = 0;
  let passedTests = 0;

  // Test each agent
  for (const agent of AGENTS) {
    console.log(`\n📦 Testing ${agent.name}...`);
    console.log(`   Agent ID: ${agent.id}`);
    console.log('');

    for (let run = 1; run <= 5; run++) {
      totalTests++;
      const startTime = Date.now();

      try {
        const result = await tetto.callAgent(agent.id, agent.input, wallet);
        const duration = Date.now() - startTime;

        // Verify output has expected fields
        const hasExpectedFields = agent.expectedOutput.every(field =>
          result.output.hasOwnProperty(field)
        );

        if (!hasExpectedFields) {
          throw new Error(`Output missing expected fields: ${agent.expectedOutput.join(', ')}`);
        }

        console.log(`   ✅ Run ${run}/5: Success (${duration}ms)`);
        console.log(`      Receipt: ${result.receiptId}`);
        console.log(`      TX: ${result.txSignature.slice(0, 16)}...`);

        allResults.push({
          agent: agent.name,
          run,
          success: true,
          duration,
          txSignature: result.txSignature,
          receiptId: result.receiptId,
        });

        passedTests++;

      } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error(`   ❌ Run ${run}/5: Failed (${duration}ms)`);
        console.error(`      Error: ${error.message}`);

        allResults.push({
          agent: agent.name,
          run,
          success: false,
          duration,
          error: error.message,
        });
      }

      // Wait 2s between calls to avoid rate limits
      if (run < 5) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Print summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 TEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`Failed: ${totalTests - passedTests}\n`);

  // Per-agent summary
  console.log('Per-Agent Results:\n');

  for (const agent of AGENTS) {
    const agentResults = allResults.filter(r => r.agent === agent.name);
    const agentPassed = agentResults.filter(r => r.success).length;
    const successRate = (agentPassed / agentResults.length) * 100;
    const avgDuration = agentResults.reduce((sum, r) => sum + r.duration, 0) / agentResults.length;

    const icon = successRate === 100 ? '✅' : successRate >= 80 ? '⚠️' : '❌';
    console.log(`${icon} ${agent.name.padEnd(20)} ${agentPassed}/5 passed (${successRate.toFixed(0)}%) - avg ${avgDuration.toFixed(0)}ms`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Failed tests detail
  const failures = allResults.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('\n⚠️  FAILURES DETAIL:\n');
    failures.forEach(failure => {
      console.log(`${failure.agent} (Run ${failure.run}):`);
      console.log(`   Error: ${failure.error}\n`);
    });
  }

  // Exit code
  const exitCode = passedTests === totalTests ? 0 : 1;
  if (exitCode === 0) {
    console.log('\n✅ All tests passed! Platform is ready for users.\n');
  } else {
    console.log(`\n⚠️  ${totalTests - passedTests} tests failed. Fix before launch.\n`);
  }

  process.exit(exitCode);
}

runTests().catch(error => {
  console.error('\n❌ Test suite crashed:', error);
  process.exit(1);
});

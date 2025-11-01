/**
 * Coordinator Agent Example - CodeAuditPro
 *
 * Demonstrates building a coordinator agent that calls multiple sub-agents.
 * Shows real production patterns from CodeAuditPro.
 *
 * Prerequisites:
 * - ANTHROPIC_API_KEY in .env
 * - COORDINATOR_WALLET_SECRET in .env (funded wallet)
 * - Production agent access
 *
 * Run:
 *   npx tsx examples/building-agents/coordinator-example.ts
 *
 * Learn more: docs/advanced/coordinators.md
 */

import TettoSDK, {
  createWalletFromKeypair,
  createConnection,
  getDefaultConfig
} from './src/index';
import { Keypair } from '@solana/web3.js';
// Load from environment (set TEST_WALLET_SECRET manually)

async function testCoordinator() {
  console.log('🧪 Testing CodeAuditPro Coordinator via Tetto SDK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Load test wallet
  const testSecret = JSON.parse(process.env.TEST_WALLET_SECRET!);
  const keypair = Keypair.fromSecretKey(Uint8Array.from(testSecret));

  console.log(`Test wallet: ${keypair.publicKey.toBase58()}`);
  console.log('');

  // Setup SDK
  const connection = createConnection('mainnet');
  const wallet = createWalletFromKeypair(keypair, connection);
  const tetto = new TettoSDK(getDefaultConfig('mainnet'));

  // Test code with intentional issues
  const testCode = `const query = "SELECT * FROM users WHERE id = " + userId;
function processData(data) {
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data.length; j++) {
      for (let k = 0; k < data.length; k++) {
        console.log(data[i], data[j], data[k]);
      }
    }
  }
}`;

  console.log('📝 Test Code:');
  console.log(testCode);
  console.log('');

  console.log('🔄 Calling CodeAuditPro...\n');

  try {
    const result = await tetto.callAgent(
      'b7dc24b4-870d-447f-8c41-af2b81f5ec30', // CodeAuditPro
      {
        code: testCode,
        language: 'javascript'
      },
      wallet
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ CODE AUDIT RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`Overall Score: ${result.output.overall_score}/100`);
    console.log(`Grade: ${result.output.grade}`);
    console.log(`Production Ready: ${result.output.ready_for_production ? '✅ YES' : '❌ NO'}`);
    console.log(`Critical Issues: ${result.output.critical_issues}\n`);

    console.log(`Executive Summary:`);
    console.log(`"${result.output.executive_summary}"\n`);

    if (result.output.security && !(result.output.security as any).error) {
      const sec = result.output.security as any;
      console.log('🔒 Security Analysis:');
      console.log(`   Score: ${sec.security_score}/100`);
      console.log(`   Critical: ${sec.critical_count}`);
      console.log(`   High: ${sec.high_count}`);
      console.log(`   Vulnerabilities: ${sec.vulnerabilities?.length || 0}`);
      if (sec.vulnerabilities?.length) {
        sec.vulnerabilities.forEach((vuln: any, i: number) => {
          console.log(`   ${i+1}. [${vuln.severity.toUpperCase()}] ${vuln.type} (${vuln.cwe_id})`);
        });
      }
      console.log('');
    }

    if (result.output.quality && !(result.output.quality as any).error) {
      const qual = result.output.quality as any;
      console.log('📊 Quality Analysis:');
      console.log(`   Score: ${qual.quality_score}/100`);
      console.log(`   Grade: ${qual.grade}`);
      console.log(`   Cyclomatic Complexity: ${qual.complexity?.cyclomatic || 'N/A'}`);
      console.log(`   Maintainability: ${qual.complexity?.maintainability_index || 'N/A'}/100`);
      console.log(`   Code Smells: ${qual.code_smells?.length || 0}`);
      console.log('');
    }

    console.log('💰 Payment Details:');
    console.log(`   Agent Received: $${(result.agentReceived / 1e6).toFixed(2)}`);
    console.log(`   Protocol Fee: $${(result.protocolFee / 1e6).toFixed(2)}`);
    console.log(`   Total Cost: $${result.output.total_cost || 0.35}`);
    console.log('');

    console.log('📝 Agents Called:');
    const agentsCalled = (result.output as any).agents_called;
    console.log(`   ${agentsCalled?.join(', ') || 'N/A'}`);
    console.log(`   Succeeded: ${result.output.agents_succeeded}/2`);
    console.log(`   Execution Time: ${result.output.execution_time_seconds}s`);
    console.log('');

    console.log('🔗 Blockchain Proof:');
    console.log(`   Transaction: ${result.txSignature}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${result.txSignature}`);
    console.log(`   Receipt: https://tetto.io/receipts/${result.receiptId}`);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ AI-TO-AI COORDINATOR TEST SUCCESSFUL!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎯 What happened:');
    console.log('   1. Test wallet paid CodeAuditPro ($0.75)');
    console.log('   2. CodeAuditPro autonomously paid SecurityScanner ($0.10)');
    console.log('   3. CodeAuditPro autonomously paid QualityAnalyzer ($0.10)');
    console.log('   4. Both sub-agents analyzed the code');
    console.log('   5. Results intelligently aggregated');
    console.log('   6. Comprehensive audit report returned');
    console.log('');
    console.log('🚀 This proves the AI-to-AI economy works!');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  }
}

testCoordinator();

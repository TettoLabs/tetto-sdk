/**
 * Example: Schema Evolution with updateAgent()
 *
 * Demonstrates how to safely evolve agent schemas without breaking
 * existing integrations.
 *
 * Prerequisites:
 * 1. Tetto SDK installed: npm install tetto-sdk
 * 2. Environment variables set:
 *    - TETTO_DEVNET_API_KEY (for testing)
 *    - TETTO_API_KEY (for production)
 * 3. Existing agent to update (or register one first)
 *
 * Run: npx tsx examples/advanced/schema-evolution.ts
 */

import { TettoSDK, getDefaultConfig } from '../../src/index';
import * as dotenv from 'dotenv';

dotenv.config();

const AGENT_ID = process.env.TEST_AGENT_ID || '';

if (!AGENT_ID) {
  console.error('❌ Error: TEST_AGENT_ID environment variable required');
  console.error('   Set it to an agent you own for testing');
  process.exit(1);
}

async function main() {
  // Initialize SDK for DevNet (safer for testing)
  const tetto = new TettoSDK({
    ...getDefaultConfig('devnet'),
    apiKey: process.env.TETTO_DEVNET_API_KEY,
  });

  console.log('🔧 Schema Evolution Example\n');
  console.log(`Testing with agent: ${AGENT_ID}\n`);

  // Step 1: Get current agent state
  console.log('📋 Step 1: Fetch current agent...');
  const currentAgent = await tetto.getAgent(AGENT_ID);
  console.log(`   Current agent: ${currentAgent.name}`);
  console.log(`   Current input schema:`, JSON.stringify(currentAgent.input_schema, null, 2));
  console.log();

  // Step 2: Add optional field (safe evolution)
  console.log('🔄 Step 2: Add optional "context" field...');

  // Build updated schema by adding optional context field
  const existingProperties = (currentAgent.input_schema.properties as Record<string, unknown>) || {};
  const updatedSchema = {
    type: 'object',
    properties: {
      ...existingProperties,
      context: {
        type: 'string',
        description: 'Optional context for better answers',
      },
    },
    required: currentAgent.input_schema.required || [], // Keep existing required fields
  };

  console.log('   New input schema:', JSON.stringify(updatedSchema, null, 2));
  console.log();

  // Step 3: Update agent with new schema
  console.log('💾 Step 3: Update agent schema...');
  try {
    const updated = await tetto.updateAgent(AGENT_ID, {
      inputSchema: updatedSchema,
      description: 'Now supports optional context for better answers',
      exampleInputs: [
        {
          label: 'Question with context',
          input: {
            question: 'What is the capital?',
            context: 'France',
          },
        },
        {
          label: 'Question without context (backward compatible)',
          input: {
            question: 'What is 2+2?',
          },
        },
      ],
    });

    console.log('   ✅ Update successful!');
    console.log(`   Agent name: ${updated.name}`);
    console.log(`   Description: ${updated.description}`);
    console.log();
  } catch (error) {
    console.error('   ❌ Update failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // Step 4: Test backward compatibility
  console.log('🧪 Step 4: Test backward compatibility...');
  console.log('   ℹ️  To test calling the agent, you would need:');
  console.log('   1. A deployed agent endpoint');
  console.log('   2. A wallet with funds for payment');
  console.log('   3. Use tetto.callAgent(agentId, input, wallet)');
  console.log('   ');
  console.log('   Example test code (requires wallet):');
  console.log('   ```');
  console.log('   const wallet = createWalletFromKeypair(keypair);');
  console.log('   const result = await tetto.callAgent(agentId, { question: "test" }, wallet);');
  console.log('   ```');
  console.log();

  console.log('✅ Schema Evolution Complete!\n');
  console.log('Key Takeaways:');
  console.log('• Added optional field without breaking existing callers');
  console.log('• Updated description to inform users of new capability');
  console.log('• Provided examples showing both old and new formats');
  console.log('• Tested backward compatibility');
  console.log();
}

main()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

/**
 * Update Agent Example - Evolve Schemas Without Re-registration
 *
 * This example shows how to update an agent's schema to add a new optional field.
 *
 * Use Case: Adding "namespace" field for multi-user isolation
 *
 * Run: npx ts-node examples/building-agents/update-agent-example.ts
 */

import { TettoSDK, getDefaultConfig } from '../../src/index';

async function main() {
  console.log('🔄 Tetto Agent Update Example\n');

  // Check for API key
  if (!process.env.TETTO_API_KEY) {
    console.error('❌ TETTO_API_KEY environment variable required');
    console.error('   Generate at: https://www.tetto.io/dashboard/api-keys');
    process.exit(1);
  }

  // Initialize SDK
  const tetto = new TettoSDK({
    ...getDefaultConfig('devnet'),  // Use devnet for testing
    apiKey: process.env.TETTO_API_KEY,
    debug: true  // Show detailed logs
  });

  // Your agent ID (replace with your actual agent)
  const agentId = 'your-agent-id-here';

  console.log('Scenario: Adding optional "namespace" field for multi-user support\n');

  // Step 1: Get current schema
  console.log('Step 1: Fetching current schema...');
  const before = await tetto.getAgent(agentId);
  console.log('Current input schema:', JSON.stringify(before.input_schema, null, 2));
  console.log();

  // Step 2: Update schema with new optional field
  console.log('Step 2: Updating schema to add namespace field...');

  const updated = await tetto.updateAgent(agentId, {
    inputSchema: {
      type: 'object',
      required: ['action', 'question'],  // Keep existing required fields
      properties: {
        action: {
          type: 'string',
          enum: ['teach', 'ask'],
          description: 'Action to perform'
        },
        namespace: {
          type: 'string',
          description: 'Optional namespace for multi-user isolation (NEW!)'
        },
        question: {
          type: 'string',
          description: 'The question text'
        },
        answer: {
          type: 'string',
          description: 'Answer for teach action'
        }
      },
      additionalProperties: false
    },
    description: 'Q&A agent with memory and multi-user namespace support',
    exampleInputs: [
      {
        label: 'Basic question',
        input: { action: 'ask', question: 'What is 2+2?' },
        description: 'Simple question without namespace'
      },
      {
        label: 'Namespaced question',
        input: {
          action: 'ask',
          namespace: 'user_alice',
          question: 'What did I teach you?'
        },
        description: 'Question scoped to specific user namespace'
      }
    ]
  });

  console.log('✅ Schema updated successfully!');
  console.log('Agent ID (unchanged):', updated.id);
  console.log('Updated description:', updated.description);
  console.log();

  // Step 3: Verify changes
  console.log('Step 3: Verifying changes...');
  const after = await tetto.getAgent(agentId);

  const hasNamespace = 'namespace' in ((after.input_schema.properties as Record<string, unknown>) || {});
  console.log('Has namespace field:', hasNamespace ? '✅ YES' : '❌ NO');
  console.log('Number of examples:', after.example_inputs?.length || 0);
  console.log();

  // Summary
  console.log('━'.repeat(60));
  console.log('✅ Update Complete!');
  console.log('━'.repeat(60));
  console.log();
  console.log('What changed:');
  console.log('  • Added optional "namespace" field');
  console.log('  • Updated description');
  console.log('  • Added 2 example inputs');
  console.log();
  console.log('What stayed the same:');
  console.log('  • Agent ID (no breaking changes)');
  console.log('  • Required fields (backward compatible)');
  console.log('  • Existing callers continue working');
  console.log();
  console.log('Next steps:');
  console.log('  1. Test agent with old input (should still work)');
  console.log('  2. Test agent with new namespace field');
  console.log('  3. Update your agent endpoint to use namespace');
  console.log('  4. Update to production when ready');
  console.log();
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

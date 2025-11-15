/**
 * Schema Update Example - Demonstrates adding optional fields to existing agent
 *
 * Shows how to evolve an agent's schema without breaking existing callers.
 * Adding optional fields is backward compatible - existing callers continue working.
 *
 * Use cases:
 * - Add optional parameter (namespace, metadata, tags, etc.)
 * - Extend agent capabilities without breaking changes
 * - Preserve agent ID (no migration needed for callers)
 *
 * Requirements:
 * - TETTO_API_KEY environment variable
 * - TEST_AGENT_ID environment variable (agent you own)
 *
 * Run:
 * TETTO_API_KEY=your_key TEST_AGENT_ID=your_agent_id npx tsx examples/advanced/schema-update-example.ts
 *
 * Learn more: docs/building-agents/schema-evolution.md
 */

import { TettoSDK, getDefaultConfig } from '../../src/index';

async function schemaUpdateExample() {
  console.log('='.repeat(60));
  console.log('SCHEMA UPDATE EXAMPLE - ADD OPTIONAL FIELD');
  console.log('='.repeat(60));
  console.log();

  // Load credentials from environment
  const apiKey = process.env.TETTO_API_KEY;
  const agentId = process.env.TEST_AGENT_ID;

  if (!apiKey) {
    console.error('❌ TETTO_API_KEY environment variable not set');
    console.error('');
    console.error('Get your API key:');
    console.error('  1. Visit https://www.tetto.io');
    console.error('  2. Connect wallet');
    console.error('  3. Click "API Keys" in bottom left');
    console.error('  4. Generate new key');
    console.error('');
    console.error('Then run:');
    console.error('  TETTO_API_KEY=your_key TEST_AGENT_ID=your_agent_id \\');
    console.error('  npx tsx examples/advanced/schema-update-example.ts');
    process.exit(1);
  }

  if (!agentId) {
    console.error('❌ TEST_AGENT_ID environment variable not set');
    console.error('');
    console.error('Find your agent ID at: https://www.tetto.io/dashboard/agents');
    console.error('');
    console.error('Then run:');
    console.error('  TETTO_API_KEY=your_key TEST_AGENT_ID=your_agent_id \\');
    console.error('  npx tsx examples/advanced/schema-update-example.ts');
    process.exit(1);
  }

  // Initialize SDK
  const tetto = new TettoSDK({
    ...getDefaultConfig('mainnet'),
    apiKey
  });

  console.log('✓ SDK initialized (mainnet)');
  console.log('✓ Agent ID:', agentId.substring(0, 8) + '...');
  console.log();

  console.log('Scenario: Add optional "metadata" field to agent schema');
  console.log();

  // Get current schema
  console.log('STEP 1: Check current schema');
  console.log('-'.repeat(60));
  const before = await tetto.getAgent(agentId);
  const currentProps = Object.keys(before.input_schema.properties || {});
  console.log('Current input schema properties:', currentProps.join(', '));
  console.log('Has "metadata" field:', 'metadata' in (before.input_schema.properties || {}) ? '✅ YES' : '❌ NO');
  console.log();

  // Store original schema for revert
  const originalSchema = before.input_schema;

  // Update schema to add metadata field
  console.log('STEP 2: Add optional "metadata" field to schema');
  console.log('-'.repeat(60));

  const updatedSchema = {
    ...originalSchema,
    properties: {
      ...originalSchema.properties,
      metadata: {
        type: 'object',
        description: 'Optional custom metadata (backward compatible - existing callers unaffected)'
      }
    }
  };

  console.log('Updating schema with new "metadata" field...');

  const updated = await tetto.updateAgent(agentId, {
    inputSchema: updatedSchema
  });

  console.log('✓ Schema updated successfully!');
  console.log();

  // Verify update
  console.log('STEP 3: Verify new field is in schema');
  console.log('-'.repeat(60));

  const after = await tetto.getAgent(agentId);
  const newProps = Object.keys(after.input_schema.properties || {});
  console.log('Updated input schema properties:', newProps.join(', '));
  console.log('Has "metadata" field:', 'metadata' in (after.input_schema.properties || {}) ? '✅ YES' : '❌ NO');
  console.log();

  // Revert schema (remove metadata field)
  console.log('STEP 4: Revert schema to original (cleanup)');
  console.log('-'.repeat(60));

  await tetto.updateAgent(agentId, {
    inputSchema: originalSchema
  });

  console.log('✓ Schema reverted to original');
  console.log();

  // Final verification
  const final = await tetto.getAgent(agentId);
  const finalProps = Object.keys(final.input_schema.properties || {});
  console.log('Final properties:', finalProps.join(', '));
  console.log('Has "metadata" field:', 'metadata' in (final.input_schema.properties || {}) ? '✅ YES (unexpected)' : '❌ NO (reverted)');
  console.log();

  console.log('='.repeat(60));
  console.log('✅ SCHEMA UPDATE EXAMPLE COMPLETE!');
  console.log('='.repeat(60));
  console.log();
  console.log('Demonstrated:');
  console.log('  ✓ Can add optional fields to schema');
  console.log('  ✓ Changes persist immediately');
  console.log('  ✓ Agent ID unchanged (no breaking changes)');
  console.log('  ✓ Backward compatible (optional fields)');
  console.log('  ✓ Can revert changes');
  console.log();
}

updateAgentExample().catch(error => {
  console.error('❌ EXAMPLE FAILED:', error.message);
  console.error(error);
  process.exit(1);
});

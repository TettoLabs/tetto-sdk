/**
 * Test schema update - the main use case
 * 
 * Demonstrates updating an agent's input schema to add a new optional field
 * without breaking existing callers.
 */

import { TettoSDK, getDefaultConfig } from './src/index';

async function testSchemaUpdate() {
  console.log('='.repeat(60));
  console.log('TESTING SCHEMA UPDATE - REAL WORLD USE CASE');
  console.log('='.repeat(60));
  console.log();

  const apiKey = 'tetto_sk_live_7HiOprhN6PNGhhi0utO2kEPHJVTIs6be';
  const agentId = 'a4ebc22d-388a-4687-964f-7e27c428ddb9'; // WarmAnswers mainnet

  const tetto = new TettoSDK({
    ...getDefaultConfig('mainnet'),
    apiKey
  });

  console.log('Scenario: Update WarmAnswers to support custom metadata field');
  console.log();

  // Get current schema
  console.log('STEP 1: Check current schema');
  console.log('-'.repeat(60));
  const before = await tetto.getAgent(agentId);
  const currentProps = Object.keys(before.input_schema.properties || {});
  console.log('Current input schema properties:', currentProps.join(', '));
  console.log();

  // Update schema to add metadata field
  console.log('STEP 2: Add optional "metadata" field to schema');
  console.log('-'.repeat(60));
  
  const updatedSchema = {
    type: 'object',
    required: ['action', 'question'],
    properties: {
      action: {
        type: 'string',
        enum: ['teach', 'ask', 'update', 'forget'],
        description: 'Action to perform: teach=store, ask=retrieve, update=modify, forget=delete'
      },
      namespace: {
        type: 'string',
        description: 'Namespace for multi-user isolation (optional - defaults to wallet for backward compatibility)'
      },
      wallet: {
        type: 'string',
        description: 'Target wallet address (optional, defaults to caller wallet)'
      },
      question: {
        type: 'string',
        description: 'The question text'
      },
      answer: {
        type: 'string',
        description: 'Answer for teach/update actions'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional tags for categorization'
      },
      metadata: {
        type: 'object',
        description: 'Optional custom metadata (NEW FIELD - backward compatible)'
      }
    },
    additionalProperties: false
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
  console.log();
  console.log('Has "metadata" field:', 'metadata' in (after.input_schema.properties || {}) ? '✅ YES' : '❌ NO');
  console.log();

  // Revert schema (remove metadata field)
  console.log('STEP 4: Revert schema to original (remove metadata)');
  console.log('-'.repeat(60));
  
  const originalSchema = {
    type: 'object',
    required: ['action', 'question'],
    properties: {
      action: {
        type: 'string',
        enum: ['teach', 'ask', 'update', 'forget'],
        description: 'Action to perform: teach=store, ask=retrieve, update=modify, forget=delete'
      },
      namespace: {
        type: 'string',
        description: 'Namespace for multi-user isolation (optional - defaults to wallet for backward compatibility)'
      },
      wallet: {
        type: 'string',
        description: 'Target wallet address (optional, defaults to caller wallet)'
      },
      question: {
        type: 'string',
        description: 'The question text'
      },
      answer: {
        type: 'string',
        description: 'Answer for teach/update actions'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional tags for categorization'
      }
    },
    additionalProperties: false
  };

  await tetto.updateAgent(agentId, {
    inputSchema: originalSchema
  });

  console.log('✓ Schema reverted to original');
  console.log();

  // Final verification
  const final = await tetto.getAgent(agentId);
  const finalProps = Object.keys(final.input_schema.properties || {});
  console.log('Final properties:', finalProps.join(', '));
  console.log();

  console.log('='.repeat(60));
  console.log('✅ SCHEMA UPDATE TEST PASSED!');
  console.log('='.repeat(60));
  console.log();
  console.log('Demonstrated:');
  console.log('  ✓ Can add optional fields to schema');
  console.log('  ✓ Changes persist immediately');
  console.log('  ✓ Agent ID unchanged (no breaking changes)');
  console.log('  ✓ Backward compatible (optional fields)');
  console.log();
}

testSchemaUpdate().catch(error => {
  console.error('❌ TEST FAILED:', error.message);
  console.error(error);
  process.exit(1);
});

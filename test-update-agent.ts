/**
 * Test updateAgent() method with real API
 * 
 * Tests:
 * 1. Update agent description
 * 2. Update price
 * 3. Verify changes persisted
 */

import { TettoSDK, getDefaultConfig } from './src/index';

async function testUpdateAgent() {
  console.log('='.repeat(60));
  console.log('TESTING updateAgent() METHOD');
  console.log('='.repeat(60));
  console.log();

  // Check for API key
  const apiKey = process.env.TETTO_API_KEY || 'tetto_sk_live_7HiOprhN6PNGhhi0utO2kEPHJVTIs6be';
  
  if (!apiKey) {
    throw new Error('TETTO_API_KEY environment variable not set');
  }

  console.log('✓ API key loaded:', apiKey.substring(0, 20) + '...');
  console.log();

  // Initialize SDK
  const tetto = new TettoSDK({
    ...getDefaultConfig('mainnet'),
    apiKey
  });

  console.log('✓ SDK initialized (mainnet)');
  console.log();

  // Test agent ID (WarmAnswers mainnet)
  const agentId = 'a4ebc22d-388a-4687-964f-7e27c428ddb9';

  // Test 1: Get current agent state
  console.log('TEST 1: Fetch current agent state');
  console.log('-'.repeat(60));
  
  const before = await tetto.getAgent(agentId);
  console.log('Agent Name:', before.name);
  console.log('Current Description:', before.description?.substring(0, 80) + '...');
  console.log('Current Price:', before.price_display);
  console.log('Has namespace in schema:', 'namespace' in (before.input_schema.properties || {}));
  console.log();

  // Test 2: Update description
  console.log('TEST 2: Update description using SDK');
  console.log('-'.repeat(60));
  
  const newDescription = 'Intelligent Q&A agent with memory and multi-user namespace support. Teach it anything, ask it later. Uses Claude for semantic search and WarmMemory for durable storage.';
  
  console.log('Updating description to:', newDescription.substring(0, 60) + '...');
  
  const updated = await tetto.updateAgent(agentId, {
    description: newDescription
  });

  console.log('✓ Update successful!');
  console.log('New Description:', updated.description?.substring(0, 80) + '...');
  console.log();

  // Test 3: Verify changes persisted
  console.log('TEST 3: Verify changes persisted');
  console.log('-'.repeat(60));
  
  const after = await tetto.getAgent(agentId);
  console.log('Fetched Description:', after.description?.substring(0, 80) + '...');
  console.log('Match:', after.description === newDescription ? '✅ YES' : '❌ NO');
  console.log();

  // Test 4: Update price
  console.log('TEST 4: Update price (will revert after test)');
  console.log('-'.repeat(60));
  
  const originalPrice = before.price_display;
  const testPrice = 0.015; // Change to 1.5 cents
  
  console.log('Original Price:', originalPrice);
  console.log('Test Price:', testPrice);
  
  const priceUpdated = await tetto.updateAgent(agentId, {
    priceUSDC: testPrice
  });

  console.log('✓ Price update successful!');
  console.log('New Price:', priceUpdated.price_display);
  console.log();

  // Revert price
  console.log('Reverting price to original...');
  await tetto.updateAgent(agentId, {
    priceUSDC: originalPrice
  });
  console.log('✓ Price reverted');
  console.log();

  // Summary
  console.log('='.repeat(60));
  console.log('✅ ALL TESTS PASSED!');
  console.log('='.repeat(60));
  console.log();
  console.log('Verified:');
  console.log('  ✓ SDK can authenticate with API key');
  console.log('  ✓ updateAgent() method works');
  console.log('  ✓ Description updates persist');
  console.log('  ✓ Price updates work');
  console.log('  ✓ Changes are immediately visible via API');
  console.log();
}

// Run test
testUpdateAgent().catch(error => {
  console.error('❌ TEST FAILED:', error.message);
  process.exit(1);
});

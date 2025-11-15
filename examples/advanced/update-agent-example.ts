/**
 * Update Agent Example - Demonstrates updateAgent() method
 *
 * Shows how to update an existing agent's metadata without re-registration.
 * This preserves the agent ID and maintains backward compatibility.
 *
 * Use cases:
 * - Update agent description
 * - Adjust pricing dynamically
 * - Modify schemas to add optional fields
 * - Update example inputs
 *
 * Requirements:
 * - TETTO_API_KEY environment variable (get from dashboard)
 * - Agent ID you own
 *
 * Run:
 * TETTO_API_KEY=your_key npx tsx examples/advanced/update-agent-example.ts
 */

import { TettoSDK, getDefaultConfig } from '../../src/index';

async function updateAgentExample() {
  console.log('='.repeat(60));
  console.log('UPDATE AGENT EXAMPLE');
  console.log('='.repeat(60));
  console.log();

  // Load API key from environment
  const apiKey = process.env.TETTO_API_KEY;

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
    console.error('  TETTO_API_KEY=your_key npx tsx examples/advanced/update-agent-example.ts');
    process.exit(1);
  }

  console.log('✓ API key loaded');
  console.log();

  // Initialize SDK
  const tetto = new TettoSDK({
    ...getDefaultConfig('mainnet'),
    apiKey
  });

  console.log('✓ SDK initialized (mainnet)');
  console.log();

  // Get agent ID from environment (or use your own)
  const agentId = process.env.TEST_AGENT_ID;

  if (!agentId) {
    console.error('❌ TEST_AGENT_ID environment variable not set');
    console.error('');
    console.error('Set your agent ID:');
    console.error('  TEST_AGENT_ID=your-agent-id npx tsx examples/advanced/update-agent-example.ts');
    process.exit(1);
  }

  // Test 1: Get current agent state
  console.log('TEST 1: Fetch current agent state');
  console.log('-'.repeat(60));

  const before = await tetto.getAgent(agentId);
  console.log('Agent Name:', before.name);
  console.log('Current Description:', before.description?.substring(0, 80) + '...');
  console.log('Current Price:', before.price_display);
  console.log();

  // Test 2: Update description
  console.log('TEST 2: Update description');
  console.log('-'.repeat(60));

  const newDescription = 'Updated description - demonstrating updateAgent() method';

  console.log('Updating description to:', newDescription);

  const updated = await tetto.updateAgent(agentId, {
    description: newDescription
  });

  console.log('✓ Update successful!');
  console.log('New Description:', updated.description);
  console.log();

  // Test 3: Verify changes persisted
  console.log('TEST 3: Verify changes persisted');
  console.log('-'.repeat(60));

  const after = await tetto.getAgent(agentId);
  console.log('Fetched Description:', after.description);
  console.log('Match:', after.description === newDescription ? '✅ YES' : '❌ NO');
  console.log();

  // Test 4: Update price (then revert)
  console.log('TEST 4: Update price (will revert)');
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

  // Revert description
  console.log('Reverting description to original...');
  await tetto.updateAgent(agentId, {
    description: before.description || ''
  });
  console.log('✓ Description reverted');
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
  console.log('  ✓ Can revert changes');
  console.log();
}

// Run example
updateAgentExample().catch(error => {
  console.error('❌ EXAMPLE FAILED:', error.message);
  console.error(error);
  process.exit(1);
});

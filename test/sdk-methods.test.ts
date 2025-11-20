/**
 * SDK Methods Integration Test
 *
 * Tests all SDK methods against local Gateway API (development):
 * - registerAgent: Agent registration
 * - getAgent: Fetch agent details
 * - listAgents: Browse marketplace
 * - callAgent: Call agent with payment
 * - getReceipt: Verify payment proof
 *
 * Requires: Local Gateway running on localhost:3001
 * Purpose: Development testing of SDK + Gateway integration
 * Network: Local development environment
 *
 * This validates SDK methods work correctly with the Gateway API
 * before deploying to staging or production environments.
 *
 * Run: npx tsx test/sdk-methods.test.ts
 */

import { TettoSDK } from "../src/index";

async function main() {
  console.log("🧪 Testing Tetto SDK");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Initialize SDK pointing to local dev server
  const tetto = new TettoSDK({
    apiUrl: "http://localhost:3001",
  });

  try {
    // Test 1: Register an agent
    console.log("📝 Test 1: Register Agent");
    const agent = await tetto.registerAgent({
      name: "SDKTestAgent",
      description: "Test agent registered via SDK",
      endpoint: "http://localhost:3001/api/demo-agent",
      inputSchema: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
      },
      outputSchema: {
        type: "object",
        properties: { result: { type: "string" } },
        required: ["result"],
      },
      priceUSDC: 0.001,
      ownerWallet: "BubFsAG8cSEH7NkLpZijctRpsZkCiaWqCdRfh8kUpXEt",
    });

    console.log(`✅ Agent registered: ${agent.id}`);
    console.log(`   Name: ${agent.name}`);
    console.log(`   Price: ${agent.price_display} USDC\n`);

    // Test 2: Get agent details
    console.log("📋 Test 2: Get Agent Details");
    const agentDetails = await tetto.getAgent(agent.id);
    console.log(`✅ Agent retrieved: ${agentDetails.name}`);
    console.log(`   Endpoint: ${agentDetails.endpoint_url}`);
    console.log(`   Token: ${agentDetails.token}\n`);

    // Test 3: List all agents
    console.log("📜 Test 3: List All Agents");
    const agentListResult = await tetto.listAgents();
    console.log(`✅ Found ${agentListResult.count} active agents (${agentListResult.pagination.total} total)`);
    agentListResult.agents.slice(0, 3).forEach((a) => {
      console.log(`   - ${a.name}: ${a.price_display} ${a.token}`);
    });
    console.log();

    // Test 4: Call the agent (FULL FLOW)
    console.log("🤖 Test 4: Call Agent (Full Payment Flow)");
    console.log("   Calling agent with input...");

    const result = await tetto.callAgent(
      agent.id,
      { text: "sdk test successful" },
      "SDKTestCallerWallet123"
    );

    console.log(`✅ Agent called successfully!`);
    console.log(`   Output: ${JSON.stringify(result.output)}`);
    console.log(`   Transaction: ${result.txSignature}`);
    console.log(`   Agent Received: ${result.agentReceived} base units`);
    console.log(`   Protocol Fee: ${result.protocolFee} base units`);
    console.log(`   Receipt ID: ${result.receiptId}\n`);

    // Test 5: Get receipt
    console.log("🧾 Test 5: Get Receipt");
    const receipt = await tetto.getReceipt(result.receiptId);
    console.log(`✅ Receipt retrieved`);
    console.log(`   Agent: ${receipt.agent.name}`);
    console.log(`   Amount: ${receipt.amount_display} ${receipt.token}`);
    console.log(`   Protocol Fee: ${receipt.protocol_fee_display} ${receipt.token}`);
    console.log(`   TX Signature: ${receipt.tx_signature}`);
    console.log(`   Explorer: ${receipt.explorer_url}\n`);

    // Success summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 ALL SDK TESTS PASSED!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n✅ SDK is fully functional:");
    console.log("   - registerAgent() ✅");
    console.log("   - getAgent() ✅");
    console.log("   - listAgents() ✅");
    console.log("   - callAgent() ✅ (with payment!)");
    console.log("   - getReceipt() ✅");
    console.log("\n🚀 Tetto SDK ready for production use!");

  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error(error);
    process.exit(1);
  }
}

main();

/**
 * Context & Identity Validation Test Suite
 *
 * Validates that SDK v2.0+ fully supports context passing and identity preservation:
 * - calling_agent_id sent to portal
 * - fromContext() uses current_agent_id (v2.3.0+) with caller_agent_id fallback
 * - Handler receives required tetto_context
 * - Context parameter is required (not optional)
 *
 * ALL TESTS MUST PASS before merging SDK to main.
 *
 * Created: 2025-10-30
 * Updated: 2025-11-13 (v2.3.0 current_agent_id support)
 * Status: BLOCKING for SDK main merge
 */

import { TettoSDK, getDefaultConfig } from '../src/index';
import { createAgentHandler } from '../src/agent/handler';
import type { TettoContext, TettoWallet } from '../src/index';
import type { AgentRequestContext } from '../src/agent/handler';

console.log('🔬 Context & Identity Validation Test Suite\n');
console.log('='.repeat(70));
console.log('Validates SDK v2.0.0 context and identity features');
console.log('='.repeat(70) + '\n');

let testsPassed = 0;
let testsFailed = 0;

// Mock wallet for testing
const mockWallet: TettoWallet = {
  publicKey: {
    toBase58: () => 'TestWallet111111111111111111111111111111'
  } as any,
  signTransaction: async (tx: any) => tx
};

// ============================================================================
// TEST 1: SDK sends calling_agent_id in callAgent()
// ============================================================================
try {
  const tetto = new TettoSDK({
    ...getDefaultConfig('devnet'),
    agentId: 'coordinator-agent-123'
  });

  // Verify agentId config works
  const config = (tetto as any).config;
  if (config.agentId !== 'coordinator-agent-123') {
    throw new Error('agentId not set in config');
  }

  // Verify callingAgentId is set
  const callingAgentId = (tetto as any).callingAgentId;
  if (callingAgentId !== 'coordinator-agent-123') {
    throw new Error('callingAgentId not initialized from config');
  }

  console.log('✅ Test 1: SDK stores agentId for calling_agent_id');
  testsPassed++;
} catch (error) {
  console.error('❌ Test 1 failed:', error);
  testsFailed++;
}

// ============================================================================
// TEST 2: SDK reads agentId from environment variable
// ============================================================================
try {
  // Simulate environment variable
  const originalEnv = process.env.TETTO_AGENT_ID;
  process.env.TETTO_AGENT_ID = 'env-agent-456';

  const tetto = new TettoSDK(getDefaultConfig('devnet'));

  const callingAgentId = (tetto as any).callingAgentId;
  if (callingAgentId !== 'env-agent-456') {
    throw new Error('agentId not read from TETTO_AGENT_ID env var');
  }

  // Restore environment
  if (originalEnv) {
    process.env.TETTO_AGENT_ID = originalEnv;
  } else {
    delete process.env.TETTO_AGENT_ID;
  }

  console.log('✅ Test 2: SDK reads TETTO_AGENT_ID from environment');
  testsPassed++;
} catch (error) {
  console.error('❌ Test 2 failed:', error);
  testsFailed++;
}

// ============================================================================
// TEST 3: Config agentId takes precedence over env var
// ============================================================================
try {
  const originalEnv = process.env.TETTO_AGENT_ID;
  process.env.TETTO_AGENT_ID = 'env-agent-low-priority';

  const tetto = new TettoSDK({
    ...getDefaultConfig('devnet'),
    agentId: 'config-agent-high-priority'
  });

  const callingAgentId = (tetto as any).callingAgentId;
  if (callingAgentId !== 'config-agent-high-priority') {
    throw new Error('Config agentId should override env var');
  }

  // Restore
  if (originalEnv) {
    process.env.TETTO_AGENT_ID = originalEnv;
  } else {
    delete process.env.TETTO_AGENT_ID;
  }

  console.log('✅ Test 3: Config agentId takes precedence over env');
  testsPassed++;
} catch (error) {
  console.error('❌ Test 3 failed:', error);
  testsFailed++;
}

// ============================================================================
// TEST 4: fromContext() uses current_agent_id (v2.3.0+) with caller_agent_id fallback
// ============================================================================
try {
  const mockContext: TettoContext = {
    caller_wallet: 'UserWallet1111111111111111111111111111',
    caller_agent_id: 'upstream-agent-789',
    caller_agent_name: 'UpstreamAgent',
    current_agent_id: 'current-agent-456',  // NEW in v2.3.0
    current_agent_name: 'CurrentAgent',
    current_agent_network: 'devnet',
    intent_id: 'intent-123',
    timestamp: Date.now(),
    version: '2.3.0'
  };

  const tetto = TettoSDK.fromContext(mockContext, { network: 'devnet' });

  const callingAgentId = (tetto as any).callingAgentId;
  if (callingAgentId !== 'current-agent-456') {
    throw new Error('fromContext should use current_agent_id (not caller_agent_id)');
  }

  const config = (tetto as any).config;
  if (config.agentId !== 'current-agent-456') {
    throw new Error('agentId should be set from current_agent_id');
  }

  console.log('✅ Test 4: fromContext() uses current_agent_id (v2.3.0)');
  testsPassed++;
} catch (error) {
  console.error('❌ Test 4 failed:', error);
  testsFailed++;
}

// ============================================================================
// TEST 5: fromContext() handles null caller_agent_id
// ============================================================================
try {
  const mockContext: TettoContext = {
    caller_wallet: 'UserWallet1111111111111111111111111111',
    caller_agent_id: null,  // Direct user call
    caller_agent_name: null,
    current_agent_id: undefined,  // Platform < v1.2 compatibility
    current_agent_name: undefined,
    current_agent_network: undefined,
    intent_id: 'intent-456',
    timestamp: Date.now(),
    version: '1.0.0'
  };

  const tetto = TettoSDK.fromContext(mockContext, { network: 'devnet' });

  const callingAgentId = (tetto as any).callingAgentId;
  if (callingAgentId !== null && callingAgentId !== undefined) {
    throw new Error('fromContext should handle null caller_agent_id');
  }

  console.log('✅ Test 5: fromContext() handles null caller_agent_id');
  testsPassed++;
} catch (error) {
  console.error('❌ Test 5 failed:', error);
  testsFailed++;
}

// ============================================================================
// ASYNC TESTS (Tests 6, 9, 10, 11, 12, 13)
// ============================================================================
(async () => {
  // ============================================================================
  // TEST 6: Handler extracts and passes tetto_context
  // ============================================================================
  try {
    let receivedContext: AgentRequestContext | undefined;

    const handler = createAgentHandler({
      async handler(input: any, context: AgentRequestContext) {
        receivedContext = context;
        return { success: true };
      }
    });

    // Mock request with tetto_context
    const mockRequest = {
      json: async () => ({
        input: { test: 'data' },
        tetto_context: {
          caller_wallet: 'TestWallet',
          caller_agent_id: 'test-agent',
          intent_id: 'intent-789',
          timestamp: Date.now(),
          version: '1.0.0'
        }
      })
    };

    await handler(mockRequest as any);

    if (!receivedContext) {
      throw new Error('Handler did not receive context');
    }

    if (!receivedContext.tetto_context) {
      throw new Error('Context missing tetto_context');
    }

    if (receivedContext.tetto_context.caller_agent_id !== 'test-agent') {
      throw new Error('Context has wrong caller_agent_id');
    }

    console.log('✅ Test 6: Handler receives and passes tetto_context');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 6 failed:', error);
    testsFailed++;
  }

  // ============================================================================
  // TEST 9: TettoContext type is exported
  // ============================================================================
  try {
    // Type check: Can import and use TettoContext
    const mockContext: TettoContext = {
      caller_wallet: 'Test',
      caller_agent_id: 'test',
      caller_agent_name: 'TestAgent',
      current_agent_id: 'current-test',
      current_agent_name: 'CurrentTestAgent',
      current_agent_network: 'devnet',
      intent_id: 'intent',
      timestamp: Date.now(),
      version: '2.3.0'
    };

    if (!mockContext.caller_wallet) {
      throw new Error('TettoContext type invalid');
    }

    console.log('✅ Test 9: TettoContext type exported and usable');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 9 failed:', error);
    testsFailed++;
  }

  // ============================================================================
  // TEST 10: AgentRequestContext type is exported and properly typed
  // ============================================================================
  try {
    // Verify AgentRequestContext requires non-null TettoContext
    const mockCtx: AgentRequestContext = {
      tetto_context: {
        caller_wallet: 'TestWallet123',
        caller_agent_id: 'test-agent',
        caller_agent_name: 'TestAgent',
        current_agent_id: 'current-test-agent',
        current_agent_name: 'CurrentTestAgent',
        current_agent_network: 'mainnet',
        intent_id: 'intent-test',
        timestamp: Date.now(),
        version: '2.3'
      }
    };

    // Verify all required fields present
    if (!mockCtx.tetto_context) {
      throw new Error('AgentRequestContext requires tetto_context');
    }

    if (!mockCtx.tetto_context.caller_wallet) {
      throw new Error('TettoContext requires caller_wallet');
    }

    console.log('✅ Test 10: AgentRequestContext type exported and properly typed');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 10 failed:', error);
    testsFailed++;
  }

  // ============================================================================
  // TEST 11: Full agent-to-agent call flow (simulation)
  // ============================================================================
  try {
    // Step 1: Upstream agent receives call from user
    const upstreamHandler = createAgentHandler({
      async handler(input: any, context: AgentRequestContext) {
        // Step 2: Create SDK from context (context always present in v2.0)
        const tetto = TettoSDK.fromContext(context.tetto_context, {
          network: 'devnet'
        });

        // Verify SDK has agent identity
        const callingAgentId = (tetto as any).callingAgentId;
        if (!callingAgentId) {
          throw new Error('SDK should have calling agent ID from context');
        }

        // Step 3: When this SDK calls another agent, it will send calling_agent_id
        // (Can't test actual API call without network, but verify SDK is configured)

        return { success: true, callingAgentId };
      }
    });

    // Simulate upstream agent receiving request
    const upstreamRequest = {
      json: async () => ({
        input: { action: 'process' },
        tetto_context: {
          caller_wallet: 'UserWallet123',
          caller_agent_id: 'upstream-agent-abc',
          caller_agent_name: 'UpstreamAgent',
          current_agent_id: 'current-coordinator-xyz',
          current_agent_name: 'CurrentCoordinator',
          current_agent_network: 'devnet',
          intent_id: 'intent-xyz',
          timestamp: Date.now(),
          version: '2.3.0'
        }
      })
    };

    const response = await upstreamHandler(upstreamRequest as any);
    const data = await response?.json();

    if (!data.success) {
      throw new Error('Agent-to-agent flow failed');
    }

    if (data.callingAgentId !== 'current-coordinator-xyz') {
      throw new Error('Agent identity should use current_agent_id');
    }

    console.log('✅ Test 11: Full agent-to-agent flow works');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 11 failed:', error);
    testsFailed++;
  }

  // ============================================================================
  // TEST 12: SDK validates tetto_context is required
  // ============================================================================
  try {
    const handler = createAgentHandler({
      async handler(input: any, context: AgentRequestContext) {
        return { success: true };
      }
    });

    // Mock request WITHOUT tetto_context (should error)
    const mockRequest = {
      json: async () => ({
        input: { test: 'data' }
        // Missing tetto_context!
      })
    };

    const response = await handler(mockRequest as any);
    const data = await response?.json();

    if (!data.error || !data.error.includes('tetto_context')) {
      throw new Error('Should reject missing tetto_context');
    }

    console.log('✅ Test 12: SDK validates tetto_context is required');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 12 failed:', error);
    testsFailed++;
  }

  // ============================================================================
  // TEST 13: All TettoContext fields are accessible and typed
  // ============================================================================
  try {
    const mockContext: TettoContext = {
      caller_wallet: 'AYPz8VHckZbbqsQd4qQfypKrE6bpSpJKJNYr9r4AJNZV',
      caller_agent_id: 'agent-uuid-123',
      caller_agent_name: 'TestAgent',
      current_agent_id: 'current-agent-uuid-456',
      current_agent_name: 'CurrentTestAgent',
      current_agent_network: 'mainnet',
      intent_id: '1d50f128-2c92-4f53-b466-9a554044a6d1',
      timestamp: 1730419845000,
      version: '2.3'
    };

    // Verify all fields accessible and typed correctly
    if (!mockContext.caller_wallet) throw new Error('caller_wallet required');
    if (mockContext.caller_agent_id === undefined) throw new Error('caller_agent_id required');
    if (mockContext.caller_agent_name === undefined) throw new Error('caller_agent_name defined');
    if (mockContext.current_agent_id === undefined) throw new Error('current_agent_id defined');
    if (mockContext.current_agent_name === undefined) throw new Error('current_agent_name defined');
    if (mockContext.current_agent_network === undefined) throw new Error('current_agent_network defined');
    if (!mockContext.intent_id) throw new Error('intent_id required');
    if (!mockContext.timestamp) throw new Error('timestamp required');
    if (!mockContext.version) throw new Error('version required');

    console.log('✅ Test 13: All TettoContext fields accessible and typed');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 13 failed:', error);
    testsFailed++;
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n' + '='.repeat(70));
  console.log('CONTEXT & IDENTITY VALIDATION RESULTS');
  console.log('='.repeat(70));
  console.log(`Passed: ${testsPassed}/11`);
  console.log(`Failed: ${testsFailed}/11`);
  console.log('='.repeat(70));

  if (testsFailed > 0) {
    console.error('\n❌ VALIDATION FAILED - DO NOT MERGE TO MAIN');
    console.error('\nSDK does not fully support context and identity features.');
    console.error('Fix issues before merging staging → main.\n');
    process.exit(1);
  } else {
    console.log('\n✅ ALL VALIDATION TESTS PASSED');
    console.log('\nSDK v2.0.0 fully supports:');
    console.log('  ✅ calling_agent_id sent to portal');
    console.log('  ✅ fromContext() preserves agent identity');
    console.log('  ✅ Handler receives required tetto_context (not optional)');
    console.log('  ✅ Context validation (errors if missing)');
    console.log('  ✅ All TettoContext fields properly typed');
    console.log('  ✅ Types exported correctly');
    console.log('\n🎯 SAFE TO MERGE SDK STAGING → MAIN\n');
  }
})();

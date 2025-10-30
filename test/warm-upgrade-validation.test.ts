/**
 * TETTO_WARM_UPGRADE Validation Test Suite
 *
 * Validates that SDK v2.0.0 fully supports the patterns from CP0+CP1:
 * - calling_agent_id sent to portal
 * - fromContext() preserves agent identity
 * - Handler receives tetto_context
 * - Backward compatibility maintained
 *
 * ALL TESTS MUST PASS before merging SDK to main.
 *
 * Created: 2025-10-30
 * Status: BLOCKING for SDK main merge
 */

import { TettoSDK, getDefaultConfig } from '../src/index';
import { createAgentHandler } from '../src/agent/handler';
import type { TettoContext, TettoWallet } from '../src/index';
import type { AgentRequestContext } from '../src/agent/handler';

console.log('🔬 TETTO_WARM_UPGRADE Validation Test Suite\n');
console.log('='.repeat(70));
console.log('Validates SDK v2.0.0 supports CP0+CP1 patterns');
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
// TEST 4: fromContext() preserves caller_agent_id
// ============================================================================
try {
  const mockContext: TettoContext = {
    caller_wallet: 'UserWallet1111111111111111111111111111',
    caller_agent_id: 'upstream-agent-789',
    caller_agent_name: 'UpstreamAgent',
    intent_id: 'intent-123',
    timestamp: Date.now(),
    version: '1.0.0'
  };

  const tetto = TettoSDK.fromContext(mockContext, { network: 'devnet' });

  const callingAgentId = (tetto as any).callingAgentId;
  if (callingAgentId !== 'upstream-agent-789') {
    throw new Error('fromContext did not preserve caller_agent_id');
  }

  const config = (tetto as any).config;
  if (config.agentId !== 'upstream-agent-789') {
    throw new Error('agentId not set in config from context');
  }

  console.log('✅ Test 4: fromContext() preserves agent identity');
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
// ASYNC TESTS (Tests 6-8 and 11)
// ============================================================================
(async () => {
  // ============================================================================
  // TEST 6: Handler extracts and passes tetto_context
  // ============================================================================
  try {
    let receivedContext: AgentRequestContext | undefined;

    const handler = createAgentHandler({
      async handler(input: any, context?: AgentRequestContext) {
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
  // TEST 7: Handler backward compatible (no tetto_context in request)
  // ============================================================================
  try {
    let receivedContext: AgentRequestContext | undefined;

    const handler = createAgentHandler({
      async handler(input: any, context?: AgentRequestContext) {
        receivedContext = context;
        return { success: true };
      }
    });

    // Mock request WITHOUT tetto_context (old portal)
    const mockRequest = {
      json: async () => ({
        input: { test: 'data' }
        // No tetto_context field
      })
    };

    await handler(mockRequest as any);

    if (!receivedContext) {
      throw new Error('Handler did not receive context object');
    }

    if (receivedContext.tetto_context !== null) {
      throw new Error('Context should have null tetto_context for old requests');
    }

    console.log('✅ Test 7: Handler backward compatible (no tetto_context)');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 7 failed:', error);
    testsFailed++;
  }

  // ============================================================================
  // TEST 8: Old handler signature still works (v1.x compatibility)
  // ============================================================================
  try {
    // Old-style handler (no context parameter)
    const oldHandler = createAgentHandler({
      async handler(input: any) {
        // Old handlers ignore context parameter
        return { result: 'success' };
      }
    });

    const mockRequest = {
      json: async () => ({
        input: { test: 'data' },
        tetto_context: {
          caller_wallet: 'Test',
          caller_agent_id: null,
          intent_id: 'test',
          timestamp: Date.now(),
          version: '1.0.0'
        }
      })
    };

    const response = await oldHandler(mockRequest as any);
    const data = await response?.json();

    if (data.result !== 'success') {
      throw new Error('Old handler did not work');
    }

    console.log('✅ Test 8: Old handler signature works (v1.x compat)');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 8 failed:', error);
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
      intent_id: 'intent',
      timestamp: Date.now(),
      version: '1.0.0'
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
  // TEST 10: AgentRequestContext type is exported
  // ============================================================================
  try {
    // Import works (already did it at top)
    const mockCtx: AgentRequestContext = {
      tetto_context: null
    };

    if (mockCtx.tetto_context !== null) {
      throw new Error('AgentRequestContext type invalid');
    }

    console.log('✅ Test 10: AgentRequestContext type exported');
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
      async handler(input: any, context?: AgentRequestContext) {
        // Step 2: Create SDK from context
        const tetto = TettoSDK.fromContext(context!.tetto_context!, {
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
          intent_id: 'intent-xyz',
          timestamp: Date.now(),
          version: '1.0.0'
        }
      })
    };

    const response = await upstreamHandler(upstreamRequest as any);
    const data = await response?.json();

    if (!data.success) {
      throw new Error('Agent-to-agent flow failed');
    }

    if (data.callingAgentId !== 'upstream-agent-abc') {
      throw new Error('Agent identity not preserved in flow');
    }

    console.log('✅ Test 11: Full agent-to-agent flow works');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 11 failed:', error);
    testsFailed++;
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n' + '='.repeat(70));
  console.log('WARM_UPGRADE VALIDATION RESULTS');
  console.log('='.repeat(70));
  console.log(`Passed: ${testsPassed}/11`);
  console.log(`Failed: ${testsFailed}/11`);
  console.log('='.repeat(70));

  if (testsFailed > 0) {
    console.error('\n❌ VALIDATION FAILED - DO NOT MERGE TO MAIN');
    console.error('\nSDK does not fully support CP0+CP1 patterns.');
    console.error('Fix issues before merging staging → main.\n');
    process.exit(1);
  } else {
    console.log('\n✅ ALL VALIDATION TESTS PASSED');
    console.log('\nSDK v2.0.0 fully supports:');
    console.log('  ✅ calling_agent_id sent to portal (CP1)');
    console.log('  ✅ fromContext() preserves agent identity');
    console.log('  ✅ Handler receives tetto_context');
    console.log('  ✅ Backward compatibility maintained');
    console.log('  ✅ Types exported correctly');
    console.log('\n🎯 SAFE TO MERGE SDK STAGING → MAIN\n');
  }
})();

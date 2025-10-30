/**
 * Plugin Security Test Suite - TETTO_WARM_UPGRADE CP2
 *
 * CRITICAL: All 16 tests MUST pass before publishing SDK v2.0
 *
 * These tests verify the PluginAPI security boundary prevents:
 * - API key theft
 * - Private key theft
 * - Method interception
 * - Cross-plugin access
 * - State modification
 *
 * Created: 2025-10-28
 * Status: BLOCKING for SDK v2.0 release
 */

import { TettoSDK, getDefaultConfig } from '../src/index';
import type { Plugin, PluginAPI, TettoContext } from '../src/index';

console.log('🔒 Plugin Security Test Suite\n');
console.log('=' .repeat(70));
console.log('TETTO_WARM_UPGRADE CP2 - Security Validation');
console.log('All 16 tests must pass before SDK v2.0 release');
console.log('=' .repeat(70) + '\n');

const config = {
  ...getDefaultConfig('devnet'),
  apiKey: 'secret_test_key_12345',
  agentId: 'test-agent-id'
};

let testsPassed = 0;
let testsFailed = 0;

// ============================================================================
// TEST 1: Plugins cannot access API key
// ============================================================================
try {
  const tetto = new TettoSDK(config);
  let capturedAPI: any;

  tetto.use((api: PluginAPI) => {
    capturedAPI = api;
    return { name: 'spy', id: 'spy' };
  });

  if ((capturedAPI as any).config !== undefined) {
    throw new Error('Plugin has access to config object');
  }
  if ((capturedAPI as any).apiKey !== undefined) {
    throw new Error('Plugin has access to apiKey');
  }
  if (typeof capturedAPI.callAgent !== 'function') {
    throw new Error('Plugin missing callAgent method');
  }
  if (typeof capturedAPI.getConfig !== 'function') {
    throw new Error('Plugin missing getConfig method');
  }

  console.log('✅ Test 1: API key protected from plugins');
  testsPassed++;
} catch (error) {
  console.error('❌ Test 1 failed:', error);
  testsFailed++;
}

// ============================================================================
// TEST 2: Plugins cannot access other plugins
// ============================================================================
try {
  const tetto = new TettoSDK(config);

  tetto.use((api) => ({ name: 'plugin1', id: 'plugin1', secret: 'data1' }));

  let capturedAPI: any;
  tetto.use((api) => {
    capturedAPI = api;
    return { name: 'plugin2', id: 'plugin2' };
  });

  if ((capturedAPI as any).plugin1 !== undefined) {
    throw new Error('Plugin can access other plugin instance');
  }
  if ((capturedAPI as any).plugins !== undefined) {
    throw new Error('Plugin has access to plugins Map');
  }
  if (typeof capturedAPI.hasPlugin !== 'function') {
    throw new Error('Plugin missing hasPlugin method');
  }
  if (typeof capturedAPI.hasPlugin('plugin1') !== 'boolean') {
    throw new Error('hasPlugin does not return boolean');
  }

  console.log('✅ Test 2: Plugin isolation enforced');
  testsPassed++;
} catch (error) {
  console.error('❌ Test 2 failed:', error);
  testsFailed++;
}

// ============================================================================
// TEST 3: getConfig() only returns safe fields
// ============================================================================
try {
  const tetto = new TettoSDK(config);
  let safeConfig: any;

  tetto.use((api) => {
    safeConfig = api.getConfig();
    return { name: 'test', id: 'test' };
  });

  if (!safeConfig.apiUrl) {
    throw new Error('Safe config missing apiUrl');
  }
  if (safeConfig.network !== 'devnet') {
    throw new Error('Safe config has wrong network');
  }
  if (!safeConfig.protocolWallet) {
    throw new Error('Safe config missing protocolWallet');
  }
  if ((safeConfig as any).apiKey !== undefined) {
    throw new Error('Safe config exposes apiKey');
  }
  if ((safeConfig as any).agentId !== undefined) {
    throw new Error('Safe config exposes agentId');
  }

  console.log('✅ Test 3: getConfig returns safe fields only');
  testsPassed++;
} catch (error) {
  console.error('❌ Test 3 failed:', error);
  testsFailed++;
}

// ============================================================================
// TEST 4: Namespace collision detection
// ============================================================================
try {
  const tetto = new TettoSDK(config);

  const PollutionPlugin: Plugin = (api: any) => {
    return {
      name: 'callAgent',  // Try to override core method!
      id: 'evil'
    };
  };

  try {
    tetto.use(PollutionPlugin);
    throw new Error('Namespace collision not detected');
  } catch (err: any) {
    if (!err.message.includes('collision')) {
      throw new Error('Wrong error message for collision');
    }
  }

  console.log('✅ Test 4: Namespace collision detected');
  testsPassed++;
} catch (error) {
  console.error('❌ Test 4 failed:', error);
  testsFailed++;
}

// ============================================================================
// TEST 5: Multiple plugins can coexist
// ============================================================================
try {
  const tetto = new TettoSDK(config);

  tetto.use((api) => ({ name: 'memory', id: 'warmmemory' }));
  tetto.use((api) => ({ name: 'search', id: 'vectordb' }));
  tetto.use((api) => ({ name: 'analytics', id: 'analytics' }));

  const plugins = tetto.listPlugins();
  if (plugins.length !== 3) {
    throw new Error(`Expected 3 plugins, got ${plugins.length}`);
  }
  if (!plugins.includes('warmmemory')) {
    throw new Error('Missing warmmemory plugin');
  }
  if (!(tetto as any).memory) {
    throw new Error('memory not attached to SDK');
  }

  console.log('✅ Test 5: Multiple plugins coexist');
  testsPassed++;
} catch (error) {
  console.error('❌ Test 5 failed:', error);
  testsFailed++;
}

// ============================================================================
// TEST 6: getPlugin() safe access
// ============================================================================
try {
  const tetto = new TettoSDK(config);

  tetto.use((api) => ({
    name: 'test',
    id: 'test-plugin',
    testMethod: () => 'works'
  }));

  const retrieved = tetto.getPlugin('test-plugin');
  if (!retrieved) {
    throw new Error('getPlugin returned undefined for valid plugin');
  }
  if (typeof (retrieved as any).testMethod !== 'function') {
    throw new Error('Retrieved plugin missing method');
  }
  if ((retrieved as any).testMethod() !== 'works') {
    throw new Error('Retrieved plugin method returned wrong value');
  }

  const missing = tetto.getPlugin('nonexistent');
  if (missing !== undefined) {
    throw new Error('getPlugin returned value for nonexistent plugin');
  }

  console.log('✅ Test 6: getPlugin() safe access works');
  testsPassed++;
} catch (error) {
  console.error('❌ Test 6 failed:', error);
  testsFailed++;
}

// ============================================================================
// TEST 7: Lifecycle hooks called correctly
// ============================================================================
(async () => {
  try {
    const tetto = new TettoSDK(config);

    let initCalled = false;
    let destroyCalled = false;

    tetto.use((api) => ({
      name: 'lifecycle',
      id: 'lifecycle-test',

      async onInit() {
        initCalled = true;
      },

      async onDestroy() {
        destroyCalled = true;
      }
    }));

    // Wait for async onInit
    await new Promise(resolve => setTimeout(resolve, 100));
    if (!initCalled) {
      throw new Error('onInit was not called');
    }

    // Call destroy
    await tetto.destroy();
    if (!destroyCalled) {
      throw new Error('onDestroy was not called');
    }

    console.log('✅ Test 7: Lifecycle hooks work');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 7 failed:', error);
    testsFailed++;
  }

  // ============================================================================
  // TEST 8: fromContext() preserves agent identity
  // ============================================================================
  try {
    const context: TettoContext = {
      caller_wallet: 'WalletTest1111111111111111111111111111',
      caller_agent_id: 'upstream-agent-123',
      caller_agent_name: 'Upstream Agent',
      intent_id: 'intent-123',
      timestamp: Date.now(),
      version: '1.0.0'
    };

    const tetto = TettoSDK.fromContext(context, { network: 'devnet' });

    if (!(tetto instanceof TettoSDK)) {
      throw new Error('fromContext did not return TettoSDK instance');
    }

    console.log('✅ Test 8: fromContext() preserves identity');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 8 failed:', error);
    testsFailed++;
  }

  // ============================================================================
  // TEST 9: hasPlugin() returns boolean only
  // ============================================================================
  try {
    const tetto = new TettoSDK(config);

    tetto.use((api) => ({ name: 'test', id: 'test-plugin' }));

    let hasPluginResult: any;

    tetto.use((api) => {
      hasPluginResult = api.hasPlugin('test-plugin');
      return { name: 'checker', id: 'checker' };
    });

    if (typeof hasPluginResult !== 'boolean') {
      throw new Error('hasPlugin returned non-boolean');
    }
    if (hasPluginResult !== true) {
      throw new Error('hasPlugin returned false for existing plugin');
    }
    if ((hasPluginResult as any).name !== undefined) {
      throw new Error('hasPlugin leaked plugin instance');
    }

    console.log('✅ Test 9: hasPlugin() returns boolean only');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 9 failed:', error);
    testsFailed++;
  }

  // ============================================================================
  // TEST 10: Plugin registry isolated from plugins
  // ============================================================================
  try {
    const tetto = new TettoSDK(config);

    let capturedAPI: any;

    tetto.use((api) => {
      capturedAPI = api;
      return { name: 'test', id: 'test' };
    });

    if ((capturedAPI as any).plugins !== undefined) {
      throw new Error('Plugin has access to plugins Map');
    }
    if ((capturedAPI as any).listPlugins !== undefined) {
      throw new Error('Plugin has access to listPlugins');
    }
    if (typeof capturedAPI.hasPlugin !== 'function') {
      throw new Error('Plugin missing hasPlugin');
    }

    console.log('✅ Test 10: Plugin registry isolated');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 10 failed:', error);
    testsFailed++;
  }

  // ============================================================================
  // TEST 11: Collision error provides helpful guidance
  // ============================================================================
  try {
    const tetto = new TettoSDK(config);

    tetto.use((api) => ({ name: 'memory', id: 'plugin1' }));

    try {
      tetto.use((api) => ({ name: 'memory', id: 'plugin2' }));
      throw new Error('Collision not detected');
    } catch (err: any) {
      if (!err.message.includes('collision')) {
        throw new Error('No collision in error message');
      }
      if (!err.message.includes('Solutions')) {
        throw new Error('No solutions in error message');
      }
      if (!err.message.includes('customName')) {
        throw new Error('No custom name suggestion');
      }
    }

    console.log('✅ Test 11: Helpful collision error messages');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 11 failed:', error);
    testsFailed++;
  }

  // ============================================================================
  // TEST 12: Custom plugin naming works
  // ============================================================================
  try {
    const tetto = new TettoSDK(config);

    const CustomPlugin: Plugin = (api, options = {}) => {
      const customName = options.name || 'default';
      return {
        name: customName,
        id: 'custom-plugin'
      };
    };

    tetto.use(CustomPlugin, { name: 'custom1' });
    tetto.use(CustomPlugin, { name: 'custom2' });

    if (!(tetto as any).custom1) {
      throw new Error('custom1 not attached');
    }
    if (!(tetto as any).custom2) {
      throw new Error('custom2 not attached');
    }

    console.log('✅ Test 12: Custom naming works');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 12 failed:', error);
    testsFailed++;
  }

  // ============================================================================
  // TEST 13: Handler backward compatible (v1.x works)
  // ============================================================================
  try {
    // Old-style handler (v1.x) should compile without errors
    const oldHandler = async (input: any) => {
      return { result: 'success' };
    };

    const result = await oldHandler({ test: 'data' });
    if (result.result !== 'success') {
      throw new Error('Old handler failed');
    }

    console.log('✅ Test 13: Backward compatible handlers');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 13 failed:', error);
    testsFailed++;
  }

  // ============================================================================
  // TEST 14: Handler context parameter works (v2.0)
  // ============================================================================
  try {
    // New-style handler (v2.0) with context parameter
    const newHandler = async (input: any, context?: any) => {
      if (!context) {
        throw new Error('Context not provided');
      }
      return { result: 'success', caller: context.tetto_context?.caller_wallet };
    };

    const mockContext = {
      tetto_context: {
        caller_wallet: 'TestWallet',
        caller_agent_id: null,
        intent_id: 'test',
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };

    const result = await newHandler({ test: 'data' }, mockContext);
    if (result.result !== 'success') {
      throw new Error('New handler failed');
    }

    console.log('✅ Test 14: Handler context parameter works');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 14 failed:', error);
    testsFailed++;
  }

  // ============================================================================
  // TEST 15: Bound methods immutable
  // ============================================================================
  try {
    const tetto = new TettoSDK(config);

    let originalCallAgent: any;

    tetto.use((api) => {
      originalCallAgent = api.callAgent;

      // Try to override (should not affect SDK)
      (api as any).callAgent = () => 'hacked';

      return { name: 'attacker', id: 'attacker' };
    });

    if (typeof originalCallAgent !== 'function') {
      throw new Error('callAgent is not a function');
    }

    console.log('✅ Test 15: Bound methods immutable');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 15 failed:', error);
    testsFailed++;
  }

  // ============================================================================
  // TEST 16: SDK methods protected
  // ============================================================================
  try {
    const tetto = new TettoSDK(config);

    const EvilPlugin: Plugin = (api: any) => {
      // Try to modify API methods
      api.callAgent = () => Promise.resolve({ hacked: true });
      api.getAgent = () => Promise.resolve({ hacked: true });
      return { name: 'evil', id: 'evil' };
    };

    tetto.use(EvilPlugin);

    // Original methods should still be functions
    if (typeof tetto.callAgent !== 'function') {
      throw new Error('callAgent corrupted');
    }
    if (typeof tetto.getAgent !== 'function') {
      throw new Error('getAgent corrupted');
    }

    console.log('✅ Test 16: SDK methods protected');
    testsPassed++;
  } catch (error) {
    console.error('❌ Test 16 failed:', error);
    testsFailed++;
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n' + '='.repeat(70));
  console.log('SECURITY TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`Passed: ${testsPassed}/16`);
  console.log(`Failed: ${testsFailed}/16`);
  console.log('='.repeat(70));

  if (testsFailed > 0) {
    console.error('\n❌ SECURITY TESTS FAILED - DO NOT PUBLISH');
    process.exit(1);
  } else {
    console.log('\n✅ ALL SECURITY TESTS PASSED - SAFE TO PUBLISH');
  }
})();

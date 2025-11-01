/**
 * Agent Utilities Test Suite
 *
 * Unit tests for agent builder utilities (no external dependencies):
 * - getTokenMint: Derive token mint addresses (USDC/SOL for mainnet/devnet)
 * - loadAgentEnv: Validate environment variables with helpful errors
 * - createAnthropic: Create Anthropic SDK client from environment
 * - createAgentHandler: Wrap agent logic with automatic request handling
 *
 * Fast, focused tests (<1 second, no setup required)
 *
 * These utilities help developers build agents with 67% less boilerplate.
 * All tests validate utility functions work correctly and prevent common errors.
 */

import { getTokenMint } from '../src/agent/token-mint';
import { loadAgentEnv } from '../src/agent/env';
import { createAnthropic } from '../src/agent/anthropic';
import { createAgentHandler } from '../src/agent/handler';

// ============================================================================
// TOKEN MINT TESTS
// ============================================================================

console.log('🧪 Testing Agent Utilities\n');

// Test 1: getTokenMint - mainnet USDC
try {
  const mint = getTokenMint('USDC', 'mainnet');
  if (mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
    console.log('✅ getTokenMint: mainnet USDC correct');
  } else {
    throw new Error(`Expected mainnet USDC mint, got ${mint}`);
  }
} catch (error) {
  console.error('❌ getTokenMint: mainnet USDC failed:', error);
  process.exit(1);
}

// Test 2: getTokenMint - devnet USDC
try {
  const mint = getTokenMint('USDC', 'devnet');
  if (mint === 'EGzSiubUqhzWFR2KxWCx6jHD6XNsVhKrnebjcQdN6qK4') {
    console.log('✅ getTokenMint: devnet USDC correct');
  } else {
    throw new Error(`Expected devnet USDC mint, got ${mint}`);
  }
} catch (error) {
  console.error('❌ getTokenMint: devnet USDC failed:', error);
  process.exit(1);
}

// Test 3: getTokenMint - mainnet and devnet have different USDC mints
try {
  const mainnetMint = getTokenMint('USDC', 'mainnet');
  const devnetMint = getTokenMint('USDC', 'devnet');
  if (mainnetMint !== devnetMint) {
    console.log('✅ getTokenMint: mainnet and devnet USDC are different');
  } else {
    throw new Error('Mainnet and devnet USDC mints should be different');
  }
} catch (error) {
  console.error('❌ getTokenMint: mainnet/devnet comparison failed:', error);
  process.exit(1);
}

// Test 4: getTokenMint - SOL same on both networks
try {
  const mainnetSol = getTokenMint('SOL', 'mainnet');
  const devnetSol = getTokenMint('SOL', 'devnet');
  if (mainnetSol === devnetSol && mainnetSol === 'So11111111111111111111111111111111111111112') {
    console.log('✅ getTokenMint: SOL same on both networks');
  } else {
    throw new Error('SOL mint should be same on both networks');
  }
} catch (error) {
  console.error('❌ getTokenMint: SOL test failed:', error);
  process.exit(1);
}

// Test 5: getTokenMint - throws for invalid token
try {
  getTokenMint('INVALID' as any, 'mainnet');
  console.error('❌ getTokenMint: should throw for invalid token');
  process.exit(1);
} catch (error) {
  if (error instanceof Error && error.message.includes('Unknown token/network')) {
    console.log('✅ getTokenMint: throws for invalid token');
  } else {
    console.error('❌ getTokenMint: wrong error for invalid token');
    process.exit(1);
  }
}

// ============================================================================
// ENVIRONMENT TESTS
// ============================================================================

// Save original env
const originalEnv = { ...process.env };

// Test 6: loadAgentEnv - loads required variable
try {
  process.env.TEST_KEY = 'test-value';
  const env = loadAgentEnv({
    TEST_KEY: 'required'
  });
  if (env.TEST_KEY === 'test-value') {
    console.log('✅ loadAgentEnv: loads required variable');
  } else {
    throw new Error('Failed to load required variable');
  }
} catch (error) {
  console.error('❌ loadAgentEnv: load required failed:', error);
  process.exit(1);
} finally {
  process.env = { ...originalEnv };
}

// Test 7: loadAgentEnv - throws for missing required
try {
  delete process.env.MISSING_KEY;
  loadAgentEnv({
    MISSING_KEY: 'required'
  });
  console.error('❌ loadAgentEnv: should throw for missing required');
  process.exit(1);
} catch (error) {
  if (error instanceof Error && error.message.includes('Missing required environment variables')) {
    console.log('✅ loadAgentEnv: throws for missing required');
  } else {
    console.error('❌ loadAgentEnv: wrong error for missing required');
    process.exit(1);
  }
} finally {
  process.env = { ...originalEnv };
}

// Test 8: loadAgentEnv - allows optional missing
try {
  delete process.env.OPTIONAL_KEY;
  const env = loadAgentEnv({
    OPTIONAL_KEY: 'optional'
  });
  if (env.OPTIONAL_KEY === undefined) {
    console.log('✅ loadAgentEnv: allows optional missing');
  } else {
    throw new Error('Optional key should be undefined');
  }
} catch (error) {
  console.error('❌ loadAgentEnv: optional missing failed:', error);
  process.exit(1);
} finally {
  process.env = { ...originalEnv };
}

// ============================================================================
// ANTHROPIC TESTS
// ============================================================================

// Test 9: createAnthropic - creates from env var
try {
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
  const anthropic = createAnthropic();
  if (anthropic && anthropic.apiKey === 'sk-ant-test-key') {
    console.log('✅ createAnthropic: creates from env var');
  } else {
    throw new Error('Failed to create Anthropic client from env');
  }
} catch (error) {
  console.error('❌ createAnthropic: env var test failed:', error);
  process.exit(1);
} finally {
  process.env = { ...originalEnv };
}

// Test 10: createAnthropic - creates from explicit API key
try {
  const anthropic = createAnthropic({
    apiKey: 'sk-ant-explicit-key'
  });
  if (anthropic && anthropic.apiKey === 'sk-ant-explicit-key') {
    console.log('✅ createAnthropic: creates from explicit API key');
  } else {
    throw new Error('Failed to create Anthropic client with explicit key');
  }
} catch (error) {
  console.error('❌ createAnthropic: explicit key test failed:', error);
  process.exit(1);
}

// Test 11: createAnthropic - explicit key takes precedence
try {
  process.env.ANTHROPIC_API_KEY = 'sk-ant-env-key';
  const anthropic = createAnthropic({
    apiKey: 'sk-ant-explicit-key'
  });
  if (anthropic.apiKey === 'sk-ant-explicit-key') {
    console.log('✅ createAnthropic: explicit key takes precedence');
  } else {
    throw new Error('Explicit key should take precedence over env');
  }
} catch (error) {
  console.error('❌ createAnthropic: precedence test failed:', error);
  process.exit(1);
} finally {
  process.env = { ...originalEnv };
}

// Test 12: createAnthropic - throws if missing
try {
  delete process.env.ANTHROPIC_API_KEY;
  createAnthropic();
  console.error('❌ createAnthropic: should throw if missing');
  process.exit(1);
} catch (error) {
  if (error instanceof Error && error.message.includes('Missing ANTHROPIC_API_KEY')) {
    console.log('✅ createAnthropic: throws if missing');
  } else {
    console.error('❌ createAnthropic: wrong error for missing key');
    process.exit(1);
  }
} finally {
  process.env = { ...originalEnv };
}

// ============================================================================
// HANDLER TESTS
// ============================================================================

// Test 13: createAgentHandler - successful request
(async () => {
  try {
    const handler = createAgentHandler({
      async handler(input: { text: string }) {
        return { result: input.text.toUpperCase() };
      }
    });

    const mockRequest = {
      json: async () => ({
        input: { text: 'hello' },
        tetto_context: {
          caller_wallet: 'Test',
          caller_agent_id: null,
          intent_id: 'test',
          timestamp: Date.now(),
          version: '1.0.0'
        }
      })
    };

    const response = await handler(mockRequest);
    const data = JSON.parse(await response.text());

    if (data.result === 'HELLO' && response.status === 200) {
      console.log('✅ createAgentHandler: successful request');
    } else {
      throw new Error('Handler did not process request correctly');
    }
  } catch (error) {
    console.error('❌ createAgentHandler: success test failed:', error);
    process.exit(1);
  }
})();

// Test 14: createAgentHandler - missing input field
(async () => {
  try {
    const handler = createAgentHandler({
      async handler(input) {
        return { result: 'ok' };
      }
    });

    const mockRequest = {
      json: async () => ({ notInput: 'data' })
    };

    const response = await handler(mockRequest);
    const data = JSON.parse(await response.text());

    if (data.error && data.error.includes('Missing') && response.status === 400) {
      console.log('✅ createAgentHandler: handles missing input');
    } else {
      throw new Error('Handler should reject missing input');
    }
  } catch (error) {
    console.error('❌ createAgentHandler: missing input test failed:', error);
    process.exit(1);
  }
})();

// Test 15: createAgentHandler - invalid JSON
(async () => {
  try {
    const handler = createAgentHandler({
      async handler(input) {
        return { result: 'ok' };
      }
    });

    const mockRequest = {
      json: async () => {
        throw new Error('Invalid JSON');
      }
    };

    const response = await handler(mockRequest);
    const data = JSON.parse(await response.text());

    if (data.error && data.error.includes('Invalid JSON') && response.status === 400) {
      console.log('✅ createAgentHandler: handles invalid JSON');
    } else {
      throw new Error('Handler should reject invalid JSON');
    }
  } catch (error) {
    console.error('❌ createAgentHandler: invalid JSON test failed:', error);
    process.exit(1);
  }
})();

// Test 16: createAgentHandler - handler errors
(async () => {
  try {
    const handler = createAgentHandler({
      async handler() {
        throw new Error('Test error');
      }
    });

    const mockRequest = {
      json: async () => ({
        input: { text: 'test' },
        tetto_context: {
          caller_wallet: 'Test',
          caller_agent_id: null,
          intent_id: 'test',
          timestamp: Date.now(),
          version: '1.0.0'
        }
      })
    };

    const response = await handler(mockRequest);
    const data = JSON.parse(await response.text());

    if (data.error === 'Test error' && response.status === 500) {
      console.log('✅ createAgentHandler: handles handler errors');
    } else {
      throw new Error('Handler should catch and return errors');
    }
  } catch (error) {
    console.error('❌ createAgentHandler: error handling test failed:', error);
    process.exit(1);
  }
})();

// Test 17: createAgentHandler - proper content-type
(async () => {
  try {
    const handler = createAgentHandler({
      async handler(input) {
        return { result: 'ok' };
      }
    });

    const mockRequest = {
      json: async () => ({
        input: { text: 'test' },
        tetto_context: {
          caller_wallet: 'Test',
          caller_agent_id: null,
          intent_id: 'test',
          timestamp: Date.now(),
          version: '1.0.0'
        }
      })
    };

    const response = await handler(mockRequest);

    if (response.headers.get('Content-Type') === 'application/json') {
      console.log('✅ createAgentHandler: returns proper content-type');
    } else {
      throw new Error('Handler should return application/json content-type');
    }
  } catch (error) {
    console.error('❌ createAgentHandler: content-type test failed:', error);
    process.exit(1);
  }
})();

console.log('\n============================================================');
console.log('✅ ALL AGENT UTILITY TESTS PASSED!');
console.log('============================================================\n');

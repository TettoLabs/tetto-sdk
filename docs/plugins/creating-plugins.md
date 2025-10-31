# Creating Plugins

> Build plugins to extend Tetto SDK functionality

**Status:** API ready, awaiting community plugins
**For:** Advanced developers

---

## 🎯 Overview

This guide shows how to create plugins for Tetto SDK v2.0.

**Requirements:**
- TypeScript knowledge
- Understanding of PluginAPI interface
- Familiarity with SDK patterns

---

## 📦 Plugin Structure

### Basic Plugin

```typescript
import type { Plugin, PluginAPI, TettoWallet } from 'tetto-sdk';

export const MyPlugin: Plugin = (api: PluginAPI, options = {}) => {
  // Plugin initialization
  console.log('MyPlugin loading...');

  return {
    // Plugin metadata
    name: 'myPlugin',  // Namespace on SDK (tetto.myPlugin)
    id: 'my-plugin',   // Unique identifier

    // Plugin methods
    async doSomething(param: string, wallet: TettoWallet) {
      // All methods MUST accept wallet parameter
      return await api.callAgent('agent-id', { param }, wallet);
    },

    // Lifecycle hooks
    async onInit() {
      console.log('MyPlugin initialized');
    },

    async onDestroy() {
      console.log('MyPlugin cleaned up');
    },

    onError(error: Error, context: any) {
      console.error('MyPlugin error:', error);
    }
  };
};
```

### Plugin Type

```typescript
interface Plugin {
  (api: PluginAPI, options?: any): PluginInstance;
}

interface PluginInstance {
  name?: string;        // SDK namespace
  id?: string;          // Unique ID
  onInit?(): Promise<void> | void;
  onDestroy?(): Promise<void> | void;
  onError?(error: Error, context: ErrorContext): void;
  [key: string]: any;   // Your plugin methods
}
```

---

## 🔒 Security Model

### PluginAPI Interface

Plugins receive restricted PluginAPI (not full SDK):

```typescript
interface PluginAPI {
  // Call agents (requires wallet)
  callAgent(agentId: string, input: Record<string, unknown>,
            wallet: TettoWallet, options?: CallAgentOptions): Promise<CallResult>;

  // Get agent metadata
  getAgent(agentId: string): Promise<Agent>;

  // List marketplace agents
  listAgents(): Promise<Agent[]>;

  // Get public config (no secrets!)
  getConfig(): {
    apiUrl: string;
    network: 'mainnet' | 'devnet';
    protocolWallet: string;
    debug: boolean;
  };

  // Check if plugin loaded
  hasPlugin(pluginId: string): boolean;
}
```

### Security Rules

**Plugins CANNOT:**
- ❌ Access `config.apiKey` (would leak credentials)
- ❌ Access `config.agentId` (would enable impersonation)
- ❌ Access other plugin instances (isolation)
- ❌ Modify SDK internal state
- ❌ Store wallet references

**Plugins MUST:**
- ✅ Accept wallet as parameter for all methods
- ✅ Use PluginAPI for agent calls
- ✅ Handle errors gracefully
- ✅ Clean up resources in onDestroy()

**Validated by:** 16 security tests in `test/plugin-security.test.ts`

---

## 💡 Example: Storage Plugin

### Complete Plugin

```typescript
import type { Plugin, PluginAPI, TettoWallet, PluginOptions } from 'tetto-sdk';

interface StoragePluginOptions extends PluginOptions {
  agentId?: string;
  debug?: boolean;
}

export const StoragePlugin: Plugin = (api: PluginAPI, options: StoragePluginOptions = {}) => {
  const agentId = options.agentId || 'warmmemory-default-id';
  const debug = options.debug || false;

  function log(...args: any[]) {
    if (debug) console.log('[StoragePlugin]', ...args);
  }

  return {
    name: 'storage',
    id: 'storage-plugin',

    async onInit() {
      log('Initializing...');
      // Verify agent exists
      try {
        const agent = await api.getAgent(agentId);
        log(`Connected to agent: ${agent.name}`);
      } catch (error) {
        console.error('Storage agent not found:', agentId);
        throw error;
      }
    },

    async set(key: string, value: any, wallet: TettoWallet) {
      log('Setting', key);
      const result = await api.callAgent(
        agentId,
        {
          action: 'set',
          key,
          value: JSON.stringify(value)
        },
        wallet
      );
      return result.output;
    },

    async get(key: string, wallet: TettoWallet) {
      log('Getting', key);
      const result = await api.callAgent(
        agentId,
        {
          action: 'get',
          key
        },
        wallet
      );
      return JSON.parse(result.output.value);
    },

    async list(wallet: TettoWallet) {
      log('Listing keys');
      const result = await api.callAgent(
        agentId,
        { action: 'list' },
        wallet
      );
      return result.output.keys;
    },

    async delete(key: string, wallet: TettoWallet) {
      log('Deleting', key);
      await api.callAgent(
        agentId,
        {
          action: 'delete',
          key
        },
        wallet
      );
    },

    async onDestroy() {
      log('Cleaning up...');
      // Close connections, flush buffers, etc.
    },

    onError(error: Error, context: any) {
      console.error('[StoragePlugin] Error:', error.message);
      console.error('Context:', context);
    }
  };
};
```

### Usage

```typescript
import TettoSDK, { getDefaultConfig } from 'tetto-sdk';
import { StoragePlugin } from './storage-plugin';

const tetto = new TettoSDK(getDefaultConfig('mainnet'));

tetto.use(StoragePlugin, {
  agentId: 'my-storage-agent',
  debug: true
});

// Now available:
await tetto.storage.set('key', 'value', wallet);
const value = await tetto.storage.get('key', wallet);
```

---

## 🎨 Lifecycle Hooks

### onInit()

**Called when:** Plugin loaded via `tetto.use()`

**Use for:**
- Verify dependencies
- Check agent availability
- Initialize connections
- Warm caches

```typescript
async onInit() {
  // Verify agent exists
  const agent = await api.getAgent(this.agentId);
  if (!agent) {
    throw new Error('Agent not found');
  }

  // Initialize cache
  this.cache = new Map();
}
```

### onDestroy()

**Called when:** `tetto.destroy()` called

**Use for:**
- Close connections
- Flush buffers
- Save state
- Clean up resources

```typescript
async onDestroy() {
  // Flush pending writes
  await this.flush();

  // Clear cache
  this.cache.clear();

  // Close connections
  await this.connection.close();
}
```

### onError()

**Called when:** Plugin method throws error

**Use for:**
- Log errors
- Track error rates
- Provide user feedback
- Trigger alerts

```typescript
onError(error: Error, context: ErrorContext) {
  // Log to monitoring
  console.error('Plugin error:', {
    operation: context.operation,
    agentId: context.agentId,
    error: error.message
  });

  // Track metrics
  this.errorCount++;
}
```

---

## 🧪 Testing Plugins

### Unit Tests

```typescript
import { StoragePlugin } from './storage-plugin';
import type { PluginAPI } from 'tetto-sdk';

// Mock PluginAPI
const mockAPI: PluginAPI = {
  callAgent: jest.fn(),
  getAgent: jest.fn(),
  listAgents: jest.fn(),
  getConfig: jest.fn(),
  hasPlugin: jest.fn()
};

describe('StoragePlugin', () => {
  it('should set and get values', async () => {
    const plugin = StoragePlugin(mockAPI);

    (mockAPI.callAgent as jest.Mock).mockResolvedValue({
      output: { value: JSON.stringify('test-value') }
    });

    await plugin.set('key', 'test-value', mockWallet);
    const value = await plugin.get('key', mockWallet);

    expect(value).toBe('test-value');
  });
});
```

### Integration Tests

```typescript
import TettoSDK, { getDefaultConfig } from 'tetto-sdk';
import { StoragePlugin } from './storage-plugin';

describe('StoragePlugin Integration', () => {
  it('should work with real SDK', async () => {
    const tetto = new TettoSDK(getDefaultConfig('devnet'));
    tetto.use(StoragePlugin);

    await tetto.storage.set('test-key', 'test-value', wallet);
    const value = await tetto.storage.get('test-key', wallet);

    expect(value).toBe('test-value');
  });
});
```

---

## 📚 Best Practices

### 1. Always Require Wallet

```typescript
// ✅ Good: Wallet required
async set(key: string, value: any, wallet: TettoWallet) {
  return await api.callAgent(agentId, { key, value }, wallet);
}

// ❌ Bad: No wallet parameter
async set(key: string, value: any) {
  return await api.callAgent(agentId, { key, value }, this._wallet);
}
```

### 2. Handle Errors Gracefully

```typescript
async get(key: string, wallet: TettoWallet) {
  try {
    const result = await api.callAgent(agentId, { action: 'get', key }, wallet);
    return result.output.value;
  } catch (error) {
    if (error.message.includes('not found')) {
      return null;  // Key doesn't exist
    }
    throw error;  // Other errors
  }
}
```

### 3. Document Your Plugin

```typescript
/**
 * Storage Plugin for Tetto SDK
 *
 * Provides persistent key-value storage powered by agents.
 *
 * @example
 * ```typescript
 * tetto.use(StoragePlugin);
 * await tetto.storage.set('key', 'value', wallet);
 * ```
 */
export const StoragePlugin: Plugin = (api, options) => {
  // ...
};
```

### 4. Version Your Plugin

```typescript
export const StoragePlugin: Plugin = (api, options) => {
  return {
    name: 'storage',
    id: 'storage-plugin',
    version: '1.0.0',  // Track versions
    // ...
  };
};
```

---

## 📦 Publishing Plugins

### Package Structure

```
my-tetto-plugin/
├── src/
│   └── index.ts
├── dist/
│   └── index.js
├── package.json
├── README.md
└── LICENSE
```

### package.json

```json
{
  "name": "@yourorg/tetto-plugin-storage",
  "version": "1.0.0",
  "description": "Storage plugin for Tetto SDK",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "peerDependencies": {
    "tetto-sdk": "^2.0.0"
  },
  "keywords": ["tetto", "plugin", "storage"]
}
```

### Publish to npm

```bash
npm publish --access public
```

---

## 🔗 Resources

**Source Code:**
- [src/plugin-api.ts](../../src/plugin-api.ts) - PluginAPI interface
- [src/types.ts](../../src/types.ts) - Plugin types
- [test/plugin-security.test.ts](../../test/plugin-security.test.ts) - Security tests (16 tests, great examples!)

**Documentation:**
- [Using Plugins](using-plugins.md) - User guide
- [Plugin Security](../advanced/security.md) - Security model

**Tests:**
```bash
# Run security tests to see patterns
npm run test:security
```

---

**Version:** 2.0.0
**Last Updated:** 2025-10-30
**Status:** API ready, awaiting community plugins
**Difficulty:** Advanced

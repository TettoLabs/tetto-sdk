# Plugins (v2.0 - Future Feature)

> Extend SDK functionality with plugins

**Added in:** v2.0.0
**Status:** API available, ecosystem developing
**Priority:** Future feature (context features take priority)

---

## 🎯 What Are Plugins?

Plugins are extensions that add functionality to the Tetto SDK.

**Example use cases:**
- Persistent storage (WarmMemory plugin)
- Analytics tracking
- Custom logging
- Protocol extensions

### Status

- ✅ Plugin API available in v2.0
- ✅ Security model implemented (16 tests passing)
- 🚧 Official plugins coming soon
- 🚧 Plugin marketplace planned
- 🚧 Community plugins welcome

---

## 📦 How Plugins Work

### Basic Concept

```typescript
import { WarmMemoryPlugin } from '@warmcontext/tetto-plugin';
import TettoSDK, { getDefaultConfig } from 'tetto-sdk';

// Initialize SDK
const tetto = new TettoSDK(getDefaultConfig('mainnet'));

// Load plugin
tetto.use(WarmMemoryPlugin);

// Use plugin methods
await tetto.memory.set('key', 'value', wallet);
const value = await tetto.memory.get('key', wallet);
```

### Plugin Methods

Plugins add methods to the SDK:
```typescript
tetto.use(MyPlugin);

// Plugin methods available on SDK
await tetto.pluginNamespace.methodName(args, wallet);
```

---

## 🔒 Security Model

**Plugins run with restricted access:**

**Plugins CAN:**
- ✅ Call agents (via PluginAPI)
- ✅ Get agent metadata
- ✅ List marketplace agents
- ✅ Read safe config (network, apiUrl)
- ✅ Check if other plugins loaded

**Plugins CANNOT:**
- ❌ Access API keys (protected)
- ❌ Access private keys (protected)
- ❌ Access other plugin instances (isolated)
- ❌ Modify SDK state
- ❌ Store wallet references

**Security validation:** 16 tests in `test/plugin-security.test.ts`

---

## 🎨 Example Usage (When Available)

### Using a Plugin

```typescript
import { WarmMemoryPlugin } from '@warmcontext/tetto-plugin';
import TettoSDK, { getDefaultConfig, createWalletFromKeypair } from 'tetto-sdk';

const tetto = new TettoSDK(getDefaultConfig('mainnet'));

// Load plugin with options
tetto.use(WarmMemoryPlugin, {
  agentId: 'warmmemory-agent-id',  // Override default
  debug: true
});

// Get wallet
const wallet = createWalletFromKeypair(keypair);

// Store data (pays agent automatically)
await tetto.memory.set('user-123', { name: 'Alice' }, wallet);

// Retrieve data
const data = await tetto.memory.get('user-123', wallet);
console.log(data);  // { name: 'Alice' }

// List keys
const keys = await tetto.memory.list(wallet);
```

### Plugin Lifecycle

```typescript
// Plugin loads
tetto.use(MyPlugin);
// → Plugin's onInit() called

// SDK cleanup
await tetto.destroy();
// → Plugin's onDestroy() called

// Error handling
// → Plugin's onError() called on errors
```

---

## 🚧 Current Status

### Available Now

- **Plugin API** - Security boundary implemented
- **Lifecycle hooks** - onInit, onDestroy, onError
- **Plugin methods** - use(), getPlugin(), listPlugins(), destroy()
- **Security tests** - 16 tests validating isolation

### Coming Soon

- **Official plugins:**
  - WarmMemory (persistent storage)
  - Analytics (usage tracking)
  - Custom plugins (community)

- **Plugin marketplace:**
  - Browse plugins
  - Install via npm
  - Plugin documentation

- **Developer tools:**
  - Plugin template
  - Testing utilities
  - Publishing guide

---

## 📚 Learn More

**Documentation:**
- [Using Plugins](using-plugins.md) - How to use plugins (when available)
- [Creating Plugins](creating-plugins.md) - How to create plugins
- [Plugin Security](../advanced/security.md) - Security model

**Source Code:**
- [src/plugin-api.ts](../../src/plugin-api.ts) - PluginAPI interface
- [src/types.ts](../../src/types.ts) - Plugin types
- [test/plugin-security.test.ts](../../test/plugin-security.test.ts) - Security tests

**Tests:**
```bash
# Run plugin security tests
npm run test:security

# Expected: 16/16 tests pass
```

---

## 💡 Why Not Prioritize Plugins?

**Focus on core features first:**

1. **Context features (v2.0)** - Agent-to-agent tracking is critical
2. **Documentation** - Clear guides for current features
3. **Examples** - Working patterns for developers
4. **Plugin ecosystem** - Takes time to build

**Timeline:**
- ✅ v2.0: Plugin API shipped
- 🔄 Q1 2025: Official plugins
- 📅 Q2 2025: Plugin marketplace

---

## 🎯 For Plugin Developers

Interested in creating plugins? We'd love your help!

**Get started:**
1. Read [Creating Plugins](creating-plugins.md)
2. Check [test/plugin-security.test.ts](../../test/plugin-security.test.ts) for examples
3. Join discussions on GitHub
4. Share your plugin ideas

**Plugin ideas:**
- Memory/storage solutions
- Analytics integrations
- Protocol extensions
- Developer tools

---

**Version:** 2.0.0
**Last Updated:** 2025-10-30
**Status:** Ecosystem developing, API ready
**Priority:** Future feature

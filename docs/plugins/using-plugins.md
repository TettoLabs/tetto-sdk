# Using Plugins

> How to use Tetto SDK plugins in your project

**Status:** Coming soon
**Availability:** Official plugins in development

---

## 🎯 Overview

This guide will show you how to use plugins once they're available.

**Current status:**
- ✅ Plugin API implemented
- 🚧 Official plugins in development
- 📅 Expected: Q1 2025

---

## 📦 Installing Plugins

### Via npm

```bash
# Once available
npm install @warmcontext/tetto-plugin
```

### Via yarn

```bash
yarn add @warmcontext/tetto-plugin
```

---

## 🚀 Loading Plugins

### Basic Usage

```typescript
import TettoSDK, { getDefaultConfig } from 'tetto-sdk';
import { WarmMemoryPlugin } from '@warmcontext/tetto-plugin';

// Initialize SDK
const tetto = new TettoSDK(getDefaultConfig('mainnet'));

// Load plugin
tetto.use(WarmMemoryPlugin);

// Plugin methods now available
await tetto.memory.set('key', 'value', wallet);
```

### With Options

```typescript
tetto.use(WarmMemoryPlugin, {
  agentId: 'custom-agent-id',  // Override default agent
  debug: true,                  // Enable debug logging
  timeout: 30000                // Custom timeout
});
```

---

## 🎨 Using Plugin Methods

### Example: WarmMemory Plugin

```typescript
import { WarmMemoryPlugin } from '@warmcontext/tetto-plugin';

// Load plugin
tetto.use(WarmMemoryPlugin);

// Store data
await tetto.memory.set('user-123', {
  name: 'Alice',
  email: 'alice@example.com'
}, wallet);

// Retrieve data
const user = await tetto.memory.get('user-123', wallet);
console.log(user.name);  // 'Alice'

// List keys
const keys = await tetto.memory.list(wallet);
console.log(keys);  // ['user-123', ...]

// Delete data
await tetto.memory.delete('user-123', wallet);
```

### Error Handling

```typescript
try {
  const data = await tetto.memory.get('nonexistent-key', wallet);
} catch (error) {
  if (error.message.includes('not found')) {
    console.log('Key does not exist');
  }
}
```

---

## 🔄 Plugin Lifecycle

### Initialization

```typescript
// Plugin loads when you call use()
tetto.use(MyPlugin);
// → Plugin's onInit() hook called
```

### Cleanup

```typescript
// Clean up all plugins
await tetto.destroy();
// → Each plugin's onDestroy() hook called
```

---

## 🔍 Checking Plugin Availability

### Check if Plugin Loaded

```typescript
// Load first plugin
tetto.use(WarmMemoryPlugin);

// Check from SDK
if (tetto.getPlugin('warmmemory')) {
  console.log('WarmMemory plugin is loaded');
}

// List all plugins
const plugins = tetto.listPlugins();
console.log('Loaded plugins:', plugins);
```

### Plugin Dependencies

```typescript
// Some plugins may depend on others
tetto.use(CorePlugin);      // Load dependency first
tetto.use(ExtensionPlugin); // Then load plugin that depends on it
```

---

## 🛡️ Security

### Wallet Requirements

**All plugin methods require wallet parameter:**

```typescript
// ✅ Correct: Wallet provided
await tetto.memory.set('key', 'value', wallet);

// ❌ Wrong: Would fail (no stored wallet access)
await tetto.memory.set('key', 'value');
```

**Why?** Plugins pay for agent calls. You must approve each payment.

### Plugin Isolation

- Plugins cannot access your API keys
- Plugins cannot access your private keys
- Plugins cannot access each other's data
- Plugins run in isolation

**Validated by:** 16 security tests

---

## 📚 Available Plugins

### Official Plugins (Coming Soon)

**WarmMemory Plugin**
- Persistent key-value storage
- Agent-powered data management
- Automatic payment handling

**Analytics Plugin**
- Usage tracking
- Custom events
- Dashboard integration

**Custom Plugins**
- Community developed
- Available via npm
- Plugin marketplace coming

---

## 🔧 Troubleshooting

### Plugin Not Found

```typescript
// Error: Plugin 'foo' not found
tetto.use(UnknownPlugin);
```

**Solution:** Check plugin is installed and imported correctly

### Method Not Available

```typescript
// Error: tetto.memory is undefined
await tetto.memory.get('key', wallet);
```

**Solution:** Make sure plugin is loaded first:
```typescript
tetto.use(WarmMemoryPlugin);  // Load first
await tetto.memory.get('key', wallet);  // Then use
```

---

## 📖 Next Steps

- [Creating Plugins](creating-plugins.md) - Build your own plugin
- [Plugin Security](../advanced/security.md) - Security model
- [Plugin API Reference](README.md) - PluginAPI interface

---

**Version:** 2.0.0
**Last Updated:** 2025-10-30
**Status:** Coming soon (API ready, plugins in development)

# Changelog

All notable changes to the Tetto SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-10-30

### Added - Plugin System & Context Passing

**Major Features:**
- Plugin system with PluginAPI security boundary
- Context passing for agent-to-agent calls
- fromContext() preserves agent identity
- Handler receives tetto_context parameter
- SDK sends calling_agent_id to portal

### Added

- **Plugin System** (`src/index.ts`):
  - `use(plugin, options)` - Load plugins
  - `getPlugin(pluginId)` - Get plugin instance
  - `listPlugins()` - List loaded plugins
  - `destroy()` - Cleanup all plugins
  - PluginAPI security boundary (prevents API key theft, cross-plugin access)
  - Lifecycle hooks (onInit, onDestroy, onError)

- **Context Passing** (`src/index.ts`, `src/agent/handler.ts`):
  - `TettoSDK.fromContext(context, overrides)` - Create SDK from context
  - Handler receives optional `context: AgentRequestContext` parameter
  - SDK sends `calling_agent_id` to portal automatically
  - TettoContext interface (caller_wallet, caller_agent_id, intent_id, timestamp, version)

- **New Types** (`src/types.ts`):
  - `TettoContext` - Request metadata passed to agents
  - `AgentRequestContext` - Context wrapper for handlers
  - `PluginInstance` - Plugin interface with lifecycle hooks
  - `ErrorContext` - Error metadata for plugins

- **Tests**:
  - 16 plugin security tests (`test/plugin-security.test.ts`)
  - 11 WARM_UPGRADE validation tests (`test/warm-upgrade-validation.test.ts`)
  - 100% backward compatibility validation

### Changed

- `TettoConfig` interface: Added optional `agentId` field
- SDK constructor: Reads `TETTO_AGENT_ID` from environment
- `callAgent()`: Automatically includes `calling_agent_id` in requests
- `createAgentHandler()`: Passes context to handler as second parameter

### Backward Compatibility

- ✅ All v1.x code works unchanged
- ✅ Context parameter is optional
- ✅ Handlers without context parameter still work
- ✅ Zero breaking changes

### Migration Guide

**No migration needed!** v2.0 is fully backward compatible.

**To use new features:**

**1. Context in agents:**
```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';

export const POST = createAgentHandler({
  async handler(input, context: AgentRequestContext) {
    // Access caller information
    console.log('Caller:', context.tetto_context.caller_wallet);
    console.log('Calling agent:', context.tetto_context.caller_agent_id);

    return { result: '...' };
  }
});
```

**2. fromContext in coordinators:**
```typescript
import TettoSDK from 'tetto-sdk';
import { createAgentHandler } from 'tetto-sdk/agent';

export const POST = createAgentHandler({
  async handler(input, context: AgentRequestContext) {
    // Preserve identity when calling sub-agents
    const tetto = TettoSDK.fromContext(context.tetto_context, {
      network: 'mainnet'
    });

    // Automatically includes calling_agent_id
    await tetto.callAgent('sub-agent-id', input, wallet);

    return { result: '...' };
  }
});
```

**3. Plugins (future):**
```typescript
import { WarmMemoryPlugin } from '@warmcontext/tetto-plugin';

const tetto = new TettoSDK(getDefaultConfig('mainnet'));
tetto.use(WarmMemoryPlugin);

// Use plugin methods
await tetto.memory.set('key', 'value', wallet);
```

### Related Links

- [Plugin Security Tests](test/plugin-security.test.ts) - 16 tests validating security boundary
- [WARM_UPGRADE Validation Tests](test/warm-upgrade-validation.test.ts) - 11 tests proving v2.0 patterns work
- [TETTO_WARM_UPGRADE Docs](../DOCS/OCT27/TETTO_WARM_UPGRADE/) - Full upgrade documentation

---

## [1.2.0] - 2025-10-28

### Added - Studios & Developer Profiles

**New Feature:** Complete studios and verification system documentation

- ✅ **`OwnerInfo` interface** - Studio owner data (display_name, avatar_url, verified, studio_slug, bio)
- ✅ **`Agent.owner` field** - Optional owner information on agent responses
- 📚 **Complete documentation** - 2,200+ lines across 3 comprehensive guides
- 📖 **Studios guide** (`docs/studios/README.md`) - Setup, verification, best practices
- 🎓 **Updated tutorials** - Profile setup now included in quickstart (Step 6)
- 📝 **CLI reminders** - Profile completion reminder after agent creation

### Documentation

- **New Files:**
  - `docs/studios/README.md` - Complete studios guide (880 lines)
  - `docs/studios/verification.md` - Verification criteria deep dive (654 lines)
  - `docs/studios/best-practices.md` - Studio optimization guide (680 lines)
  - `examples/building-agents/register-with-profile.ts` - Complete workflow example

- **Updated Files:**
  - `docs/building-agents/quickstart.md` - Added Step 6 (Complete Your Profile)
  - `docs/building-agents/README.md` - Added Studios overview section
  - `docs/building-agents/deployment.md` - Added post-deployment profile steps
  - `README.md` - Added Studios section with quick setup guide

**Impact:** Developers can now create studio profiles, get verified badges, and build brand recognition on Tetto marketplace.

## [1.1.1] - 2025-10-27

### Fixed

- **Devnet URL Configuration** (`src/index.ts`):
  - Fixed devnet `apiUrl` to use official subdomain `https://dev.tetto.io`
  - Previously pointed to temporary Vercel URL `https://tetto-portal-seven.vercel.app`
  - Updated all documentation references (AI_LOOK_HERE.md, README.old.md, API docs)
  - Impact: Devnet examples now work correctly for developers

## [1.1.0] - 2025-10-25

### Added - API Key Authentication

**New Feature:** Optional API key authentication for agent registration

- ✅ **Optional `apiKey` field** in `TettoConfig` interface
- 🔐 **Bearer token authentication** - SDK automatically sends `Authorization` header
- 📖 **Helpful error messages** - Clear instructions if API key required
- 🔄 **Backward compatible** - Works with or without API key

### Added

- **API Key Support** (`src/index.ts`):
  - Added optional `apiKey?: string` to `TettoConfig` interface
  - Updated `registerAgent()` to send `Authorization: Bearer` header if key provided
  - Improved error messages for authentication failures with recovery steps

### Changed

- **Error Handling** (`src/index.ts`):
  - Authentication errors now show helpful instructions:
    - Where to generate API key (dashboard link)
    - How to add to config
    - How to set environment variable

### Migration Guide

**For existing users:** No changes required! Your code continues to work.

**To add API key support (optional):**

1. Generate API key:
   - Visit https://www.tetto.io/dashboard/api-keys
   - Click "Generate New Key"
   - Copy the key (shown once)

2. Add to environment:
   ```bash
   # .env
   TETTO_API_KEY=tetto_sk_live_abc123...
   ```

3. Update SDK config:
   ```typescript
   import TettoSDK, { getDefaultConfig } from 'tetto-sdk';

   const tetto = new TettoSDK({
     ...getDefaultConfig('mainnet'),
     apiKey: process.env.TETTO_API_KEY,  // NEW: Add this line
   });
   ```

4. Register agents normally:
   ```typescript
   const agent = await tetto.registerAgent({
     name: 'MyAgent',
     // ... rest of config
   });
   // SDK automatically sends Authorization header!
   ```

### Why This Update?

API keys provide authentication for agent registration, preventing spam and ensuring only authorized users can register agents. This is a step toward full platform security.

**Next:** Web3-native authentication (Sign in with Solana) coming in future release.

### Compatibility

- ✅ **Backward Compatible** - No breaking changes
- ✅ **Optional Feature** - Works with or without API key
- ✅ **Drop-in Upgrade** - `npm install tetto-sdk@1.1.0`

---

## [1.0.0] - 2025-10-23 🚀

### Major Version Release - Breaking Changes

**Complete architectural shift** - transactions are now built and submitted by the Tetto platform, dramatically simplifying the SDK and improving security.

### Breaking Changes

- **Wallet Interface Simplified**
  - `TettoWallet` no longer requires `connection` property (❌ REMOVED)
  - `TettoWallet` no longer has `sendTransaction` method (❌ REMOVED)
  - `signTransaction` is now **required** (was optional)

- **Wallet Helpers Updated**
  - `createWalletFromKeypair(keypair)` - removed `connection` parameter
  - `createWalletFromAdapter(adapter)` - removed `connection` parameter

- **Removed Exports**
  - `buildAgentPaymentTransaction` - transaction building now handled by platform

### Added

- ✅ **Input validation before payment** - Invalid input fails BEFORE creating payment transaction
- 🚀 **Platform-powered transactions** - Platform builds, signs, and submits transactions
- 📦 **Build transaction endpoint** - New `/api/agents/[id]/build-transaction` endpoint
- 🎯 **Payment intent system** - All transaction context in single payment_intent record
- 🔒 **Enhanced security** - Platform verifies transaction structure before submission

### Changed

- **API Simplification** - `/api/agents/call` now accepts only 2 fields:
  - `payment_intent_id` (UUID from build-transaction)
  - `signed_transaction` (base64 serialized signed transaction)
- **Flow Update** - New flow:
  1. Request transaction from platform (with input validation)
  2. Sign transaction (client-side)
  3. Send signed transaction to platform
  4. Platform submits to Solana and executes agent

### Removed

- 📦 **Deleted Files**:
  - `src/transaction-builder.ts` (121 lines) - Platform builds transactions now
  - `src/ensure-ata.ts` (99 lines) - Platform handles ATA creation

- 🎁 **Dependencies Removed**:
  - `@solana/spl-token` (17 packages removed)

- 🧹 **Code Reduction**:
  - Total: -260 lines of code (24% reduction)
  - Bundle size: ~24KB (was ~25KB+, target: ~50KB)

### Improved

- **Developer Experience**
  - No RPC connection management needed
  - No blockchain complexity exposed
  - Clearer error messages for invalid input
  - Simpler wallet creation (just keypair, no connection)

- **Bundle Size**
  - Target: 75% reduction (200KB → 50KB)
  - Current: ~24KB compiled output
  - Removed SPL Token dependency

- **Type Safety**
  - `TettoWallet` now enforces required `signTransaction`
  - Added `BuildTransactionResult` interface
  - Better TypeScript inference

### Migration Guide

**Step 1: Update wallet creation**
```diff
// Before (v0.x)
- import { createConnection, createWalletFromKeypair } from 'tetto-sdk';
- const connection = createConnection('mainnet');
- const wallet = createWalletFromKeypair(keypair, connection);

// After (v1.0.0)
+ import { createWalletFromKeypair } from 'tetto-sdk';
+ const wallet = createWalletFromKeypair(keypair);  // No connection!
```

**Step 2: Remove connection references**
```diff
// Before (v0.x)
- const connection = createConnection('mainnet');
- const wallet = createWalletFromAdapter(walletAdapter, connection);

// After (v1.0.0)
+ const wallet = createWalletFromAdapter(walletAdapter);  // No connection!
```

**That's it!** Everything else works the same way. The `callAgent()` API is unchanged.

### Technical Details

- **Platform Architecture**: Platform-powered transaction submission
- **API Version**: v1.0.0
- **Node Version**: ≥20.0.0
- **TypeScript**: 5.0+
- **Dependencies**: 2 (was 3)

### Documentation Updates

- Updated README.md with "What's New in v1.0.0" section
- Updated all examples to remove Connection usage
- Updated API reference documentation
- Updated calling guides (browser, Node.js, quickstart)
- Added comprehensive migration guide
- Updated CHANGELOG.md with full v1.0.0 details

### Related Links

- [Implementation Guide](DOCS/OCT21/FATAL_FLAW/SDK3/)
- [Platform Architecture](DOCS/OCT21/FATAL_FLAW/TETTO3/)
- [Migration Guide](docs/migration-v1.md)

---

## [0.1.0] - 2025-10-18

### Initial Stable Release

First production-ready release of Tetto SDK with complete functionality for both calling and building AI agents.

### Added - For Agent Callers

- **Client-side transaction signing** - Users keep custody of their wallets
- **`TettoSDK` class** with 5 core methods:
  - `listAgents()` - Browse marketplace
  - `getAgent(id)` - Get agent details
  - `callAgent(id, input, wallet)` - Call agents with payment
  - `getReceipt(id)` - Get payment proof
  - `registerAgent(metadata)` - Register new agents
- **Browser wallet support** via Solana Wallet Adapter (Phantom, Solflare, etc.)
- **Node.js support** via Keypair for autonomous AI agents
- **Network helpers**:
  - `getDefaultConfig(network)` - Get mainnet/devnet defaults
  - `createConnection(network, rpcUrl?)` - Create Solana connection
  - `createWalletFromAdapter()` - Browser wallet helper
  - `createWalletFromKeypair()` - Node.js wallet helper
- **Transaction builder** with automatic ATA creation
- **Fee split handling** (90% agent, 10% protocol)
- **Full TypeScript support** with exported types

### Added - For Agent Builders ⭐ NEW

- **`create-tetto-agent` CLI**:
  - Scaffold complete agent projects in 60 seconds
  - Interactive prompts for configuration
  - Generates 8 files with zero manual setup
  - Next.js + TypeScript + Vercel ready
- **Agent utilities** (import from `tetto-sdk/agent`):
  - `createAgentHandler()` - Request wrapper with automatic error handling (67% less code)
  - `getTokenMint()` - Auto-derive token mint addresses (prevents config errors)
  - `loadAgentEnv()` - Environment variable validation with helpful errors
  - `createAnthropic()` - Anthropic SDK client helper
- **Template system**:
  - package.json with correct dependencies
  - Next.js API route with agent logic
  - tetto.config.json for marketplace
  - Environment template (.env.example)
  - README with deployment instructions
  - TypeScript configuration
  - .gitignore
  - vercel.json for one-click deploy

### Technical Details

- **Bundle size**: ~30 KB total (21 KB caller + 8.5 KB builder, tree-shakeable)
- **Zero breaking changes** - Fully backward compatible
- **17 comprehensive tests** for agent utilities
- **Mainnet tested** - 19+ successful transactions

### Documentation

- Complete README with quick starts for both use cases
- API reference for all methods
- Browser and Node.js examples
- Agent building examples (simple, API, coordinator)
- Troubleshooting guide

---

## Release Notes

**v0.1.0 represents the first stable, production-ready release** of the Tetto SDK.

**What's New:**
- Complete SDK for calling agents (production-tested)
- NEW: Complete tooling for building agents (CLI + utilities)
- Professional documentation
- Ready for npm publication

**For Developers:**
- Call agents: `npm install tetto-sdk` → import `TettoSDK`
- Build agents: `npx create-tetto-agent` → scaffold in 60 seconds
- Use utilities: import from `tetto-sdk/agent`

**Production Ready:**
- ✅ Mainnet tested
- ✅ TypeScript support
- ✅ Comprehensive error handling
- ✅ Clear documentation
- ✅ Professional DX

[View full documentation](https://github.com/TettoLabs/tetto-sdk)

---

**Current Version:** 2.0.0
**Latest Release:** 2025-10-30
**License:** MIT

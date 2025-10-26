# Changelog

All notable changes to the Tetto SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [1.0.0] - 2025-10-23 - SDK3 Release 🚀

### Major Version Release - Breaking Changes

**SDK3 represents a complete architectural shift** - transactions are now built and submitted by the Tetto platform, dramatically simplifying the SDK and improving security.

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

- **Platform Architecture**: TETTO3 (platform-powered transactions)
- **API Version**: v1.0.0
- **Node Version**: ≥20.0.0
- **TypeScript**: 5.0+
- **Dependencies**: 2 (was 3)
- **Checkpoints Completed**: CP0, CP1, CP2, CP3

### Documentation Updates

- Updated README.md with "What's New in v1.0.0" section
- Updated all examples to remove Connection usage
- Updated API reference documentation
- Updated calling guides (browser, Node.js, quickstart)
- Added comprehensive migration guide
- Updated CHANGELOG.md with full v1.0.0 details

### Related Links

- [SDK3 Implementation Guide](DOCS/OCT21/FATAL_FLAW/SDK3/)
- [TETTO3 Platform Architecture](DOCS/OCT21/FATAL_FLAW/TETTO3/)
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

**Current Version:** 1.0.0 (SDK3)
**Latest Release:** 2025-10-23
**License:** MIT

# Changelog

All notable changes to the Tetto SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2025-11-13

### Added
- `operationalWallet` field in `AgentMetadata` for coordinator agents
- `operationalWalletSignature` field for operational wallet verification
- Operational wallet support in `registerAgent()` method

## [2.2.0] - 2025-11-09

### Added

**Private Agents** - Wallet-based access control for agents

- New `isPrivate` field in `AgentMetadata` (optional, defaults based on network)
- New `accessList` field for authorized wallet addresses
- DevNet agents default to private (prevents compute abuse)
- Mainnet agents default to public (marketplace discovery)
- Owner wallet automatically included in access list
- Agent interface now includes `is_private` and `access_list` fields

### Documentation

- Updated all `registerAgent` examples with optional privacy parameters
- Added comprehensive JSDoc for privacy fields
- Updated testing-on-devnet.md to explain auto-private behavior

### Backward Compatibility

- Fully backward compatible
- Existing code continues to work without changes
- New parameters are optional
- Mainnet agents default to public (same as before)

## [2.1.0] - 2025-11-06

### Added

**New Method: `updateAgent()`** - Update agent schemas and metadata without re-registration

Enables:
- ✅ Update input/output schemas (add/modify fields)
- ✅ Update description (improve marketplace visibility)
- ✅ Update price (adjust dynamically)
- ✅ Update example inputs (show new features)

**Signature:**
```typescript
async updateAgent(
  agentId: string,
  updates: UpdateAgentMetadata
): Promise<Agent>
```

**Interface:**
```typescript
interface UpdateAgentMetadata {
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  description?: string;
  priceUSDC?: number;
  exampleInputs?: Array<{label, input, description?}>;
}
```

**Key Benefits:**
- Preserves agent ID (no breaking changes)
- Backward compatible (optional fields)
- Immediate updates (no approval process)
- Owner-only (requires API key authentication)

**Use Cases:**
- Add optional parameters (e.g., namespace field for multi-user support)
- Fix schema bugs post-deployment
- Update pricing without re-deploying
- Add examples showing new features

**Example - WarmAnswers Update:**
Real-world usage: Updated WarmAnswers agent (mainnet + devnet) to add `namespace` field for multi-user isolation:
```typescript
const updated = await tetto.updateAgent('a4ebc22d-388a-4687-964f-7e27c428ddb9', {
  inputSchema: {
    // ... existing fields ...
    namespace: {
      type: 'string',
      description: 'Multi-user isolation (optional)'
    }
  }
});
```

**Documentation:**
- API Reference: `docs/calling-agents/api-reference.md#updateagent`
- Tutorial: `docs/building-agents/schema-evolution.md` (new)
- Examples: `examples/building-agents/update-agent-example.ts` (new)

**Platform Requirements:**
- Portal API: `PATCH /api/agents/[id]/schemas` (deployed v2025-11-06)
- Authentication: API key required
- Authorization: Owner-only

**Testing:**
- ✅ End-to-end tested on production
- ✅ Real agents updated (WarmAnswers mainnet + devnet)
- ✅ Schema validation working
- ✅ Backward compatibility verified

**Migration:** No breaking changes. Existing code continues working.

---

## [2.0.0] - 2025-10-31

### BREAKING CHANGES - Context Now Required

**⚠️ BREAKING:** SDK v2.0.0 removes backward compatibility. Context parameter is now required.

**What Changed:**
- ❌ **`tetto_context` no longer nullable** - `AgentRequestContext.tetto_context` is now `TettoContext` (not `TettoContext | null`)
- ❌ **`context` parameter now required** - Handler signature changed from `(input, context?)` to `(input, context)`
- ✅ **Validation added** - SDK now errors if Portal doesn't provide `tetto_context`
- ✅ **Types exported** - `AgentRequestContext` properly exported from `tetto-sdk/agent`

### Migration Guide

**For v2.0.0 users (SubChain agents):**

1. **Remove optional chaining:**
   ```typescript
   // BEFORE (v2.0.0):
   async handler(input, context?: AgentRequestContext) {
     if (context?.tetto_context) {
       console.log('Caller:', context.tetto_context.caller_wallet);
     }
   }

   // AFTER (v2.0.0 - required context):
   async handler(input, context: AgentRequestContext) {
     console.log('Caller:', context.tetto_context.caller_wallet);
   }
   ```

2. **Update imports:**
   ```typescript
   import type { AgentRequestContext } from 'tetto-sdk/agent';
   ```

3. **Remove optional checks:**
   ```typescript
   // BEFORE:
   if (context?.tetto_context) { ... }

   // AFTER:
   // Direct access (context is always present)
   const caller = context.tetto_context.caller_wallet;
   ```

**For v1.x users:**
- ❌ Old handler signature `async handler(input)` no longer works
- ✅ Must upgrade to `async handler(input, context)` signature
- ✅ Portal must be updated to send `tetto_context` (v2.0+ Portal required)

### Removed

- **Backward Compatibility:** Removed v1.x handler signature support
- **Null Context:** Removed `tetto_context: null` fallback logic
- **Optional Parameter:** Removed `context?:` optional parameter support
- **Tests:** Removed backward compatibility tests (Test 7, Test 8)

### Why This Change?

**Problem:** Backward compatibility code caused:
- Optional chaining everywhere (`context?.tetto_context?.field`)
- Silent failures (missing context = null, not error)
- Defensive null checks in all agent code

**Solution:** Make context required:
- Direct property access (`context.tetto_context.field`)
- Immediate errors if Portal doesn't send context
- Cleaner agent code (no defensive checks)

### Impact

**SubChain Agents (only SDK user):**
- ✅ All SubChain agents updated to v2.0.0
- ✅ Controlled environment (no external breaking changes)

**Portal:**
- ✅ No changes needed (already sends tetto_context)
- ✅ Compatible with SDK v2.0.0

**Deployment:**
- 📦 SDK v2.0.0 deployed to staging first
- 📦 SubChain agents updated to SDK v2.0.0
- 📦 Tested on staging before production

### Technical Details

**Files Changed:**
- `src/agent/handler.ts` - Made context required, added validation
- `test/warm-upgrade-validation.test.ts` - Removed backward compat tests
- `CHANGELOG.md` - Added breaking change documentation

**Lines Changed:** ~40 lines across 4 files

**Tests:** All tests pass (9/9 after removing 2 backward compat tests)

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

- [API Reference](docs/calling-agents/api-reference.md)
- [Building Agents Guide](docs/building-agents/README.md)

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
**Latest Release:** 2025-10-31
**License:** MIT

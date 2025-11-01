# AI_LOOK_HERE.md - Tetto SDK Implementation Guide

> **For AI Assistants:** This document provides context for working with the Tetto SDK codebase.

---

## 🎯 What Is This Repository?

**tetto-sdk** is the **TypeScript client library** for the Tetto Agent Marketplace.

**Purpose:** Makes it easy for developers to integrate with Tetto's payment infrastructure for AI agents.

**Relationship to Other Repos:**
- **tetto-portal** (Gateway): Provides the REST API that this SDK wraps
- **tetto-sdk** (THIS REPO): Client library for calling the Gateway
- **subchain-agents** (future): Demo agents that use this SDK

---

## 🚀 Current Status

**Status:** ✅ v2.0.0 - Production Release with Coordinator Support

**Version:** 2.0.0 (Production-ready release)

**Released:** 2025-10-31

**What's Included:**
- ✅ **For Agent Callers:** Complete SDK for calling agents
  - Client-side transaction signing
  - Browser wallet support (Phantom, Solflare)
  - Node.js keypair support (AI agents)
  - Network configuration helpers (mainnet/devnet)
  - Transaction builder with ATA handling
  - **v2.0**: Context passing for multi-agent workflows
  - **v2.0**: Plugin system for extensibility
- ✅ **For Agent Builders:** Utilities to build agents
  - `create-tetto-agent` CLI (scaffold in 60 seconds)
  - Agent request handler utilities (67% less boilerplate)
  - Environment validation helpers
  - Anthropic SDK helper
  - Token mint auto-derivation
  - **v2.0**: Coordinator pattern support
- ✅ **v2.0 Features:**
  - Context passing between coordinators and sub-agents
  - Plugin system for custom functionality
  - Enhanced TypeScript types with strict typing
  - Production-proven coordinator patterns
  - Studio system integration (verified badges)
- ✅ Full TypeScript type safety
- ✅ Comprehensive documentation
- ✅ Production tested on Solana mainnet

**Mainnet Validated:**
- Production-tested with multiple successful transactions
- All methods validated on mainnet
- Proven with 11+ production agents
- Coordinator patterns verified (CodeAuditPro, HunterHandler)
- Reference implementation: SubChain.ai studio

---

## 📦 What's Included

### SDK Class: `TettoSDK`

**5 Methods:**

1. **`registerAgent(metadata)`** - Register new agents in marketplace
2. **`listAgents()`** - Browse all active agents
3. **`getAgent(id)`** - Get agent details
4. **`callAgent(id, input, wallet)`** - Call agent with automatic USDC payment
5. **`getReceipt(id)`** - Get proof of completed transaction

**Key Features:**
- Type-safe TypeScript interfaces
- Automatic error handling
- Clean, developer-friendly API
- Wraps Gateway REST endpoints

---

## 🏗️ Architecture

```
Developer's App
    ↓
[Tetto SDK] ← THIS REPO
    ↓ (HTTP requests)
[Tetto Gateway] (tetto-portal/app/api/*)
    ↓
    ├─→ [Validate Input] (JSON Schema)
    ├─→ [Call Agent Endpoint]
    ├─→ [Validate Output] (JSON Schema)
    ├─→ [Execute USDC Payment] (Solana)
    └─→ [Store Receipt] (Supabase)
```

**SDK Responsibility:**
- Provide clean TypeScript API
- Handle HTTP communication
- Type safety for inputs/outputs
- Error handling

**Gateway Responsibility:**
- Schema validation
- Payment execution
- Receipt generation
- Security & verification

---

## 💻 Code Structure

```
tetto-sdk/
├── src/
│   ├── index.ts              # Main SDK class (calling agents)
│   ├── transaction-builder.ts # Payment transaction builder
│   ├── ensure-ata.ts         # ATA utilities
│   ├── network-helpers.ts    # Network config helpers
│   ├── wallet-helpers.ts     # Wallet creation utilities
│   └── agent/                # Agent builder utilities (NEW v0.1.0)
│       ├── index.ts          # Exports all utilities
│       ├── handler.ts        # Request handler wrapper
│       ├── token-mint.ts     # Token mint auto-derivation
│       ├── env.ts            # Environment validation
│       └── anthropic.ts      # Anthropic client helper
├── test/
│   ├── node-test.ts          # Mainnet caller test
│   └── agent.test.ts         # Agent utilities test (NEW v0.1.0)
├── dist/                     # Compiled JS + .d.ts files
├── package.json              # NPM package config
├── tsconfig.json             # TypeScript config
└── README.md                 # User-facing documentation
```

**File Overview:**

### `src/index.ts` (Main SDK)
- Import statements for Solana dependencies
- Type definitions (TettoConfig, TettoWallet, Agent, CallResult, etc.)
- NETWORK_DEFAULTS constant
- TettoSDK class with 5 methods
- Exports for all helpers and types
- ~430 lines of TypeScript

### `src/transaction-builder.ts` (NEW v0.1.0)
- buildAgentPaymentTransaction() function
- Handles SOL and USDC payments
- Automatic ATA creation
- Fee split calculation (90/10)
- ~120 lines

### `src/ensure-ata.ts` (NEW v0.1.0)
- ensureATAExists() - Single ATA check/create
- ensureMultipleATAsExist() - Batch ATA operations
- Prevents USDC transaction failures
- ~90 lines

### `src/network-helpers.ts` (NEW v0.1.0)
- getDefaultConfig() - Network defaults
- createConnection() - RPC connection helper
- getUSDCMint() - Mint address helper
- ~45 lines

### `src/wallet-helpers.ts`
- createWalletFromKeypair() - Node.js support
- createWalletFromAdapter() - Browser support
- ~75 lines

### `src/agent/` (NEW v0.1.0 - Agent Builder Utilities)

**Purpose:** Make building Tetto agents trivial - eliminate boilerplate, prevent errors.

**`src/agent/handler.ts`** (~100 lines)
- createAgentHandler() - Wraps agent logic with automatic error handling
- Eliminates 67% of boilerplate code
- Automatic request parsing, input validation, error catching

**`src/agent/token-mint.ts`** (~40 lines)
- getTokenMint() - Auto-derives correct token mint addresses
- Prevents configuration errors (found in production!)
- Returns: mainnet/devnet USDC or SOL mint addresses

**`src/agent/env.ts`** (~50 lines)
- loadAgentEnv() - Environment variable validation with helpful errors
- Checks for required vs optional variables
- Clear error messages instead of cryptic failures

**`src/agent/anthropic.ts`** (~40 lines)
- createAnthropic() - Anthropic SDK client helper
- Auto-loads from ANTHROPIC_API_KEY env var
- Helpful error messages with setup instructions

**`src/agent/index.ts`**
- Exports all agent utilities with clean API surface
- Import from 'tetto-sdk/agent'

### `test/node-test.ts`
- End-to-end mainnet test for caller SDK
- Tests complete payment flow
- Run with: `npm test`
- ~100 lines

### `test/agent.test.ts` (NEW v0.1.0)
- Tests all 4 agent builder utilities
- 17 comprehensive test cases
- Validates token mints, env loading, error handling
- ~200 lines

### `README.md` (Documentation)
- Quick start for both callers AND builders (NEW v0.1.0)
- API reference for caller SDK
- API reference for builder utilities (NEW v0.1.0)
- Complete examples (browser, Node.js, agent building)
- Agent examples (simple, API, coordinator)

---

## 🧪 Testing

**Run tests:**
```bash
cd tetto-sdk
npm test
```

**This runs the mainnet integration test** (test/node-test.ts)

**Expected output:**
```
🧪 Testing Tetto SDK v0.1.0 (Node.js + Keypair)

1. Loading AI agent wallet...
   ✅ Loaded keypair: AYPz...

2. Creating Solana connection...
   ✅ Connected to mainnet

3. Creating wallet object...
   ✅ Wallet ready

4. Initializing Tetto SDK...
   ✅ SDK initialized

5. Fetching TitleGenerator agent...
   ✅ Found agent: TitleGenerator

6. Calling agent (this will submit a mainnet transaction)...
   ✅ Transaction submitted: 64wtp...
   ✅ Agent call successful

============================================================
✅ TEST PASSED!

Output: { title: "...", keywords: [...] }
TX Signature: 64wtpSWos4WNLVDQfUmrYL7LTfwmu5LzAiPXP8QP3nsADz9hTxWRtxo3KM9barpmz1Ucq3H7DuWmo9AbF3XdbPzr
Receipt: 1d50f128-2c92-4f53-b466-9a554044a6d1

🎉 SDK v0.1.0 is working! External developers can now use Tetto!
```

**Note:** Test wallet needs USDC + SOL to run the test.

---

## 🔗 Integration with Gateway

**SDK makes HTTP requests to these Gateway endpoints:**

| SDK Method | Gateway Endpoint | HTTP Method |
|------------|------------------|-------------|
| `registerAgent()` | `/api/agents/register` | POST |
| `listAgents()` | `/api/agents` | GET |
| `getAgent(id)` | `/api/agents/{id}` | GET |
| `callAgent()` | `/api/agents/call` | POST |
| `getReceipt(id)` | `/api/receipts/{id}` | GET |

**Gateway must be running** for SDK to work (local or production).

---

## 📝 TypeScript Types

**All interfaces exported:**

- `TettoConfig` - SDK configuration
- `AgentMetadata` - For registering agents
- `Agent` - Agent details from marketplace
- `CallResult` - Response from calling an agent
- `Receipt` - Payment receipt with proof

**Benefits:**
- IntelliSense autocomplete
- Compile-time type checking
- Self-documenting API

---

## 🎯 Future Plans

**Post-MVP:**
- [ ] Publish to npm as `tetto-sdk`
- [ ] Add versioning (semantic versioning)
- [ ] Add more methods (update agent, delete agent, etc.)
- [ ] Add wallet signing (for authenticated operations)
- [ ] Add batch operations (call multiple agents)
- [ ] Add streaming support (for long-running agents)
- [ ] Add webhook support (for async notifications)

---

## 🚨 Critical Context for AI Assistants

**When helping with this codebase:**

1. **v0.1.0 uses client-side signing** - SDK builds and signs transactions locally
2. **Two wallet types supported:**
   - Browser: Wallet adapter (Phantom, Solflare) via `createWalletFromAdapter()`
   - Node.js: Keypair via `createWalletFromKeypair()`
3. **Network config is explicit** - No env var fallbacks, must provide protocolWallet
4. **Debug logging is gated** - Only logs when `config.debug = true`
5. **Type safety is critical** - All methods properly typed, strict TypeScript
6. **Error handling** - Clear errors with helpful messages
7. **Documentation** - Every method has JSDoc with examples
8. **Transaction builder copied from portal** - Don't modify unless portal changes
9. **ATA handling is critical** - ensure-ata.ts prevents USDC failures

---

## 🔗 Related Repositories

- **tetto-portal:** https://github.com/TettoLabs/tetto-portal (Gateway API that SDK calls)
- **tetto-sdk:** https://github.com/TettoLabs/tetto-sdk (THIS REPO)
- **subchain-agents:** (future) Demo agents that will use this SDK

---

## 👤 Primary Developer

Ryan Smith
- Building Tetto (agent marketplace infrastructure)
- GitHub: https://github.com/TettoLabs
- Email: ryan@rsmith.ai

---

**Last Updated:** 2025-10-31
**Version:** 2.0.0
**Status:** ✅ Production - Context passing, plugins, coordinator support
**Tested:** Production-validated on mainnet with 11+ agents
**Repo:** https://github.com/TettoLabs/tetto-sdk
**Gateway:** https://tetto.io (mainnet) / https://dev.tetto.io (devnet)

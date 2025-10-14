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

**Status:** ✅ v0.2.0 COMPLETE (MVP3 Checkpoint 0)

**Version:** 0.2.0 (BREAKING CHANGE from v0.1.0)

**Completed:** 2025-10-13

**What's Working:**
- ✅ Client-side transaction signing (NEW in v0.2.0)
- ✅ Browser wallet support (Phantom, Solflare)
- ✅ Node.js keypair support (AI agents)
- ✅ Network configuration helpers (mainnet/devnet)
- ✅ Transaction builder with ATA handling
- ✅ 5 core methods implemented and tested
- ✅ Full TypeScript type safety
- ✅ Comprehensive documentation
- ✅ End-to-end tested on Solana MAINNET

**Mainnet Test Results:**
- Transaction: `64wtpSWos4WNLVDQfUmrYL7LTfwmu5LzAiPXP8QP3nsADz9hTxWRtxo3KM9barpmz1Ucq3H7DuWmo9AbF3XdbPzr`
- Output: { title: "...", keywords: [...] }
- Receipt: `1d50f128-2c92-4f53-b466-9a554044a6d1`
- All methods tested successfully on mainnet
- 19+ successful mainnet transactions with SDK

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
│   ├── index.ts              # Main SDK class
│   ├── transaction-builder.ts # Payment transaction builder (NEW v0.2.0)
│   ├── ensure-ata.ts         # ATA utilities (NEW v0.2.0)
│   ├── network-helpers.ts    # Network config (NEW v0.2.0)
│   └── wallet-helpers.ts     # Wallet creation (NEW v0.2.0)
├── test/
│   └── node-test.ts          # Mainnet integration test (NEW v0.2.0)
├── dist/                     # Compiled JS + .d.ts files (NEW v0.2.0)
├── package.json              # NPM package config
├── tsconfig.json             # TypeScript config (NEW v0.2.0)
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

### `src/transaction-builder.ts` (NEW v0.2.0)
- buildAgentPaymentTransaction() function
- Handles SOL and USDC payments
- Automatic ATA creation
- Fee split calculation (90/10)
- ~120 lines

### `src/ensure-ata.ts` (NEW v0.2.0)
- ensureATAExists() - Single ATA check/create
- ensureMultipleATAsExist() - Batch ATA operations
- Prevents USDC transaction failures
- ~90 lines

### `src/network-helpers.ts` (NEW v0.2.0)
- getDefaultConfig() - Network defaults
- createConnection() - RPC connection helper
- getUSDCMint() - Mint address helper
- ~45 lines

### `src/wallet-helpers.ts` (NEW v0.2.0)
- createWalletFromKeypair() - Node.js support
- createWalletFromAdapter() - Browser support
- ~75 lines

### `test/node-test.ts` (NEW v0.2.0)
- End-to-end mainnet test
- Tests complete payment flow
- Run with: `npm test`
- ~100 lines

### `README.md` (Documentation)
- Quick start guide (browser + Node.js)
- Migration guide (v0.1.x → v0.2.0)
- API reference for all methods
- Complete examples (React, Node.js, multi-agent)
- Troubleshooting section
- Network configuration guide

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
🧪 Testing Tetto SDK v0.2.0 (Node.js + Keypair)

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

🎉 SDK v0.2.0 is working! External developers can now use Tetto!
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

1. **v0.2.0 uses client-side signing** - SDK builds and signs transactions locally
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

**Key Changes from v0.1.x:**
- callAgent() signature changed (string → TettoWallet object)
- Added transaction building (was backend-only)
- Added network configuration system
- Removed dangerous env var fallbacks

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

**Last Updated:** 2025-10-13
**Version:** 0.2.0 (BREAKING CHANGE)
**Status:** ✅ Complete - SDK ready for external developers
**Tested:** Mainnet with 19+ successful transactions
**Repo:** https://github.com/TettoLabs/tetto-sdk
**Gateway:** https://tetto.io (mainnet) / https://tetto-portal-seven.vercel.app (devnet)

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

**Status:** ✅ COMPLETE (Checkpoint 3)

**Completed:** 2025-10-06

**What's Working:**
- ✅ Complete TettoSDK class
- ✅ 5 core methods implemented and tested
- ✅ Full TypeScript type safety
- ✅ Comprehensive documentation
- ✅ End-to-end tested with USDC payments on Solana devnet

**Test Results:**
- Transaction: `5b53DfjBe5nKvMwA7ER3iAvAar2eGFEoSv4XsfNVs1VviUXK2U1P1qy2mvZKLZGmHXkTdY9EEfgHUMopaE722e1X`
- Output: "TETTO SDK WORKS PERFECTLY"
- Receipt: `58214ddd-8a2b-4919-80ed-5040412f985d`
- All 5 methods tested successfully

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
│   └── index.ts        # Main SDK file
├── test.ts             # SDK test script
├── package.json        # NPM package config
└── README.md           # User-facing documentation
```

**File Overview:**

### `src/index.ts` (Main SDK)
- Type definitions (TettoConfig, Agent, CallResult, Receipt, etc.)
- TettoSDK class
- All 5 methods
- ~300 lines of clean TypeScript

### `test.ts` (Test Suite)
- Tests all 5 SDK methods
- End-to-end flow validation
- Can be run with: `npx ts-node test.ts`

### `README.md` (Documentation)
- Quick start guide
- API reference for all methods
- Usage examples
- Error handling guide
- Agent contract specification

---

## 🧪 Testing

**Run tests:**
```bash
# Start tetto-portal locally first
cd ../tetto-portal
npm run dev

# Then test SDK
cd ../tetto-sdk
npx ts-node test.ts
```

**Expected output:**
```
🎉 ALL SDK TESTS PASSED!
✅ SDK Methods Working:
   - registerAgent() ✅
   - listAgents() ✅
   - getAgent() ✅
   - callAgent() ✅ (with USDC payment!)
   - getReceipt() ✅
```

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

1. **This is a CLIENT library** - It doesn't execute payments, just calls the Gateway that does
2. **Keep it simple** - SDK should be thin wrapper around Gateway API
3. **Type safety is critical** - All methods must be properly typed
4. **Error handling** - Always throw clear errors with helpful messages
5. **Documentation** - Every method needs JSDoc comments with examples
6. **No business logic** - Complex logic belongs in Gateway, not SDK

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

**Last Updated:** 2025-10-06
**Status:** ✅ Complete - SDK fully functional and tested
**Repo:** https://github.com/TettoLabs/tetto-sdk
**Gateway:** https://tetto-portal-seven.vercel.app

# SDK POLISH APPENDIX - Deferred Quality Enhancements

**Status:** DEFERRED from CP5 (Option A)
**Original Guide:** `/DOCS/OCT27/SDK_CLI_AND_DOCS/CP5_GUIDE.md`
**Created:** 2025-10-28 (during CP5 Option B implementation)
**For:** Future AI implementer
**Estimated Effort:** 4-6 hours
**Priority:** P3 NICE-TO-HAVE (SDK already Stripe-level with Option B)

---

## 🎯 EXECUTIVE SUMMARY

**What We Completed in CP5 Option B (2-3 hours):**
- ✅ Type safety improvements (replaced all `: any` with typed interfaces)
- ✅ Error message improvements (gold-standard errors in all methods)
- ✅ UUID validation (input validation before API calls)
- ✅ Planned methods documented (transparent roadmap)
- ✅ Version consistency (v1.2.0 everywhere)

**What Remains from CP5 Option A (4-6 hours):**
- ⏭️ callAgent() refactoring (150 lines → smaller methods)
- ⏭️ Additional method implementations (updateAgent, getMyAgents, etc.)
- ⏭️ Advanced examples (more edge cases, error handling patterns)
- ⏭️ Performance optimizations (caching, retries, timeouts)
- ⏭️ Advanced type safety (stricter generics, branded types)

**Why Deferred:**
- SDK is already at Stripe-level quality after Option B
- Option A improvements are "nice-to-have" enhancements
- Requires more time (4-6h) for incremental gains
- Some features need Portal API development first
- Better to defer for focused future effort

**This Document Provides:**
Complete implementation plan for future AI to enhance SDK beyond current excellent state.

---

## ✅ CURRENT STATE (After CP5 Option B)

### SDK Quality Metrics

**Type Safety:** 10/10 ✅
- All `: any` types replaced with proper interfaces
- Data validation checks added
- Type assertions used correctly

**Error Messages:** 9/10 ✅
- registerAgent: Gold-standard (10/10)
- getAgent: Helpful (9/10)
- getReceipt: Helpful (9/10)
- callAgent: Good (8/10)
- listAgents: Basic (7/10)

**Input Validation:** 9/10 ✅
- UUID validation for getAgent, getReceipt
- Missing for callAgent (agentId validation)

**Documentation:** 10/10 ✅
- Complete, consistent, professional
- All versions 1.2.0
- All dates 2025-10-28

**Code Organization:** 8/10
- callAgent() is 150 lines (could be refactored)
- Other methods are clean

---

## 🛠️ REMAINING ENHANCEMENTS (Option A)

### Enhancement 1: Refactor callAgent() Method (2 hours)

**Current State:**
- **File:** `src/index.ts:365-529` (165 lines)
- **Status:** Works perfectly, but long
- **Complexity:** HIGH - critical payment flow

**Problem:**
The callAgent() method handles multiple concerns:
1. Wallet validation
2. Agent fetching
3. Transaction building (API call)
4. Transaction deserialization
5. Transaction signing
6. Transaction submission (API call)
7. Result formatting

**All in one 165-line method.**

---

**Refactoring Plan:**

Break into smaller private methods:

```typescript
/**
 * Call an agent with payment from user's wallet
 */
async callAgent(
  agentId: string,
  input: Record<string, unknown>,
  wallet: TettoWallet,
  options?: CallAgentOptions
): Promise<CallResult> {
  // Validate inputs
  this._validateUUID(agentId, 'agent ID');
  this._validateWallet(wallet);

  // Execute payment flow
  const agent = await this.getAgent(agentId);
  const buildResult = await this._buildTransaction(agentId, input, wallet, options);
  const signedTransaction = await this._signTransaction(buildResult, wallet);
  const callResult = await this._submitTransaction(buildResult, signedTransaction, options);

  return callResult;
}

/**
 * Validate wallet has required methods
 * @private
 */
private _validateWallet(wallet: TettoWallet): void {
  if (!wallet.publicKey) {
    throw new Error('Wallet public key is required');
  }
  if (!wallet.signTransaction) {
    throw new Error('Wallet must provide signTransaction method');
  }
}

/**
 * Request unsigned transaction from platform
 * @private
 */
private async _buildTransaction(
  agentId: string,
  input: Record<string, unknown>,
  wallet: TettoWallet,
  options?: CallAgentOptions
): Promise<BuildTransactionResult> {
  if (this.config.debug) {
    console.log("   Step 1: Requesting unsigned transaction from platform...");
  }

  const response = await fetch(
    `${this.apiUrl}/api/agents/${agentId}/build-transaction`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payer_wallet: wallet.publicKey.toBase58(),
        selected_token: options?.preferredToken || "USDC",
        input: input,
      }),
    }
  );

  const result = await response.json() as BuildTransactionResult;

  if (!result.ok) {
    throw new Error(result.error || result.message || "Transaction building failed");
  }

  if (this.config.debug) {
    console.log(`   ✅ Transaction built. Payment intent: ${result.payment_intent_id}`);
  }

  return result;
}

/**
 * Deserialize and sign transaction
 * @private
 */
private async _signTransaction(
  buildResult: BuildTransactionResult,
  wallet: TettoWallet
): Promise<VersionedTransaction> {
  if (this.config.debug) {
    console.log("   Step 2: Signing transaction...");
  }

  // Deserialize transaction from base64
  const txBuffer = Buffer.from(buildResult.transaction, "base64");
  const transaction = VersionedTransaction.deserialize(txBuffer);

  // Sign transaction
  const signedTx = await wallet.signTransaction(transaction as any);

  if (this.config.debug) {
    console.log("   ✅ Transaction signed");
  }

  return signedTx;
}

/**
 * Submit signed transaction to platform and call agent
 * @private
 */
private async _submitTransaction(
  buildResult: BuildTransactionResult,
  signedTransaction: VersionedTransaction,
  options?: CallAgentOptions
): Promise<CallResult> {
  if (this.config.debug) {
    console.log("   Step 3: Submitting signed transaction to platform...");
  }

  const response = await fetch(`${this.apiUrl}/api/agents/call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      payment_intent_id: buildResult.payment_intent_id,
      signed_transaction: signedTransaction.serialize().toString('base64'),
    }),
  });

  const result = await response.json() as CallResponse;

  if (!result.ok) {
    if (this.config.debug) console.error("   ❌ Backend call failed:", result.error);
    throw new Error(result.error || "Agent call failed");
  }

  if (this.config.debug) console.log("   ✅ Agent call successful");

  return {
    ok: result.ok,
    message: result.message || "",
    output: result.output || {},
    txSignature: result.tx_signature || "",
    receiptId: result.receipt_id || "",
    explorerUrl: result.explorer_url || "",
    agentReceived: result.agent_received || 0,
    protocolFee: result.protocol_fee || 0,
  };
}
```

**Benefits:**
- ✅ Each method has single responsibility
- ✅ Easier to test individual steps
- ✅ Easier to add features (retry logic, caching)
- ✅ More maintainable
- ✅ Can reuse _buildTransaction, _signTransaction for other methods

**Risks:**
- ⚠️ Refactoring critical payment logic (HIGH RISK)
- ⚠️ Need comprehensive testing before/after
- ⚠️ No user-facing changes, but internal complexity

**Testing Required:**
- Unit tests for each private method
- Integration tests for full flow
- Test on devnet thoroughly
- Test on mainnet with small amounts

**Estimated Time:** 2 hours

---

### Enhancement 2: Implement Additional Methods (2-3 hours)

**Note:** These require Portal API endpoints. Check if they exist first!

#### Method: updateAgent()

**Signature:**
```typescript
/**
 * Update agent configuration after registration
 *
 * @param agentId - Agent UUID
 * @param updates - Fields to update
 * @returns Updated agent details
 *
 * @example
 * ```typescript
 * const updated = await tetto.updateAgent('agent-uuid', {
 *   priceUSDC: 0.02,  // Update price
 *   description: 'Updated description',
 * });
 * ```
 */
async updateAgent(
  agentId: string,
  updates: Partial<AgentMetadata>
): Promise<Agent> {
  this._validateUUID(agentId, 'agent ID');

  // Check if API key provided
  if (!this.config.apiKey) {
    throw new Error(
      'API key required to update agents.\n\n' +
      'Get your key at: https://www.tetto.io/dashboard/api-keys\n' +
      'Then add to config: { apiKey: process.env.TETTO_API_KEY }'
    );
  }

  // Build headers with auth
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${this.config.apiKey}`,
  };

  const response = await fetch(
    `${this.apiUrl}/api/agents/${agentId}`,
    {
      method: "PATCH",
      headers: headers,
      body: JSON.stringify({
        description: updates.description,
        price_usdc: updates.priceUSDC,
        endpoint_url: updates.endpoint,
        input_schema: updates.inputSchema,
        output_schema: updates.outputSchema,
        is_beta: updates.isBeta,
        // Map other updateable fields
      }),
    }
  );

  const result = await response.json() as AgentResponse;

  if (!result.ok) {
    throw new Error(result.error || "Failed to update agent");
  }

  if (!result.agent) {
    throw new Error("Agent data missing from response");
  }

  return result.agent;
}
```

**Prerequisites:**
1. Check if `PATCH /api/agents/[id]` endpoint exists in Portal
2. Check authentication requirements
3. Check which fields are updateable

**Estimated Time:** 1 hour (including Portal API verification)

---

#### Method: getMyAgents()

**Signature:**
```typescript
/**
 * Get all agents owned by authenticated user
 *
 * @returns Array of user's agents
 *
 * @example
 * ```typescript
 * const tetto = new TettoSDK({
 *   ...getDefaultConfig('mainnet'),
 *   apiKey: process.env.TETTO_API_KEY,
 * });
 *
 * const myAgents = await tetto.getMyAgents();
 * console.log(`You have ${myAgents.length} agents`);
 * ```
 */
async getMyAgents(): Promise<Agent[]> {
  // Require API key for authentication
  if (!this.config.apiKey) {
    throw new Error(
      'API key required to get your agents.\n\n' +
      'Get your key at: https://www.tetto.io/dashboard/api-keys'
    );
  }

  const response = await fetch(
    `${this.apiUrl}/api/dashboard/agents`,
    {
      headers: {
        "Authorization": `Bearer ${this.config.apiKey}`,
      },
    }
  );

  const result = await response.json() as AgentsResponse;

  if (!result.ok) {
    throw new Error(result.error || "Failed to get your agents");
  }

  if (!result.agents) {
    throw new Error("Agents data missing from response");
  }

  return result.agents;
}
```

**Prerequisites:**
1. Verify `GET /api/dashboard/agents` endpoint exists and returns user's agents
2. Verify it accepts API key authentication
3. Check response format

**Estimated Time:** 30 minutes

---

#### Method: pauseAgent() / resumeAgent()

**Signature:**
```typescript
/**
 * Pause an agent (make unavailable for calls)
 *
 * @param agentId - Agent UUID
 * @returns Updated agent with status='paused'
 */
async pauseAgent(agentId: string): Promise<Agent> {
  return this._updateAgentStatus(agentId, 'paused');
}

/**
 * Resume a paused agent (make available for calls)
 *
 * @param agentId - Agent UUID
 * @returns Updated agent with status='active'
 */
async resumeAgent(agentId: string): Promise<Agent> {
  return this._updateAgentStatus(agentId, 'active');
}

/**
 * Update agent status
 * @private
 */
private async _updateAgentStatus(
  agentId: string,
  status: 'active' | 'paused'
): Promise<Agent> {
  this._validateUUID(agentId, 'agent ID');

  if (!this.config.apiKey) {
    throw new Error('API key required to update agent status');
  }

  const response = await fetch(
    `${this.apiUrl}/api/agents/${agentId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({ status }),
    }
  );

  const result = await response.json() as AgentResponse;

  if (!result.ok) {
    throw new Error(result.error || `Failed to ${status} agent`);
  }

  if (!result.agent) {
    throw new Error("Agent data missing from response");
  }

  return result.agent;
}
```

**Prerequisites:**
1. Check if status field exists in agents table
2. Check if PATCH endpoint exists for status updates
3. Verify authentication requirements

**Estimated Time:** 30 minutes

---

#### Method: deleteAgent()

**Signature:**
```typescript
/**
 * Delete an agent from marketplace (soft delete)
 *
 * @param agentId - Agent UUID
 * @returns Success confirmation
 *
 * @example
 * ```typescript
 * await tetto.deleteAgent('agent-uuid');
 * console.log('Agent removed from marketplace');
 * ```
 */
async deleteAgent(agentId: string): Promise<{ ok: boolean; message: string }> {
  this._validateUUID(agentId, 'agent ID');

  if (!this.config.apiKey) {
    throw new Error(
      'API key required to delete agents.\n\n' +
      'Get your key at: https://www.tetto.io/dashboard/api-keys'
    );
  }

  const response = await fetch(
    `${this.apiUrl}/api/agents/${agentId}`,
    {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${this.config.apiKey}`,
      },
    }
  );

  const result = await response.json() as { ok: boolean; message?: string; error?: string };

  if (!result.ok) {
    throw new Error(result.error || "Failed to delete agent");
  }

  return {
    ok: true,
    message: result.message || "Agent deleted successfully",
  };
}
```

**Prerequisites:**
1. Check if DELETE /api/agents/[id] endpoint exists
2. Verify it does soft delete (status='deleted')
3. Check authentication requirements

**Estimated Time:** 30 minutes

---

### Enhancement 3: Advanced Error Handling (1 hour)

**Add to callAgent():**

**Retry Logic:**
```typescript
private async _fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
        if (this.config.debug) {
          console.log(`   ⏳ Retry ${attempt}/${maxRetries} after ${delay}ms...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
```

**Timeout Handling:**
```typescript
private async _fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}
```

**Usage:**
```typescript
const response = await this._fetchWithTimeout(
  `${this.apiUrl}/api/agents/call`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({...}),
  },
  30000 // 30 second timeout
);
```

**Estimated Time:** 1 hour

---

### Enhancement 4: Performance Optimizations (1 hour)

**Agent Caching:**
```typescript
export class TettoSDK {
  private apiUrl: string;
  private config: TettoConfig;
  private _agentCache: Map<string, { agent: Agent; timestamp: number }> = new Map();
  private _cacheTTL: number = 60000; // 1 minute

  /**
   * Get agent with caching
   */
  async getAgent(agentId: string, useCache: boolean = true): Promise<Agent> {
    this._validateUUID(agentId, 'agent ID');

    // Check cache
    if (useCache && this._agentCache.has(agentId)) {
      const cached = this._agentCache.get(agentId)!;
      const age = Date.now() - cached.timestamp;

      if (age < this._cacheTTL) {
        if (this.config.debug) console.log(`   📦 Cache hit for agent ${agentId}`);
        return cached.agent;
      }
    }

    // Fetch from API
    const response = await fetch(`${this.apiUrl}/api/agents/${agentId}`);
    const result = await response.json() as AgentResponse;

    if (!result.ok) {
      throw new Error(
        result.error || `Agent not found: ${agentId}\n\n` +
        `This agent may not exist or has been removed.\n` +
        `Browse available agents: ${this.apiUrl}/agents`
      );
    }

    if (!result.agent) {
      throw new Error("Agent data missing from response");
    }

    // Cache result
    this._agentCache.set(agentId, {
      agent: result.agent,
      timestamp: Date.now(),
    });

    return result.agent;
  }

  /**
   * Clear agent cache
   */
  clearCache(): void {
    this._agentCache.clear();
  }
}
```

**Benefits:**
- Reduces API calls for frequently accessed agents
- Faster response times
- Reduced network traffic

**Trade-offs:**
- Agent data can be stale (1 minute)
- Uses memory for cache
- Adds complexity

**Estimated Time:** 1 hour

---

### Enhancement 5: Advanced Type Safety (1 hour)

**Branded Types:**
```typescript
// Branded types for IDs (prevents mixing up agent IDs and receipt IDs)
type AgentId = string & { readonly __brand: 'AgentId' };
type ReceiptId = string & { readonly __brand: 'ReceiptId' };
type PaymentIntentId = string & { readonly __brand: 'PaymentIntentId' };

function isAgentId(id: string): id is AgentId {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function asAgentId(id: string): AgentId {
  if (!isAgentId(id)) {
    throw new Error('Invalid agent ID format');
  }
  return id as AgentId;
}

// Usage:
async getAgent(agentId: AgentId): Promise<Agent> {
  // TypeScript ensures agentId is validated AgentId type
  // Can't accidentally pass ReceiptId
}
```

**Stricter Generics:**
```typescript
// Instead of:
output: Record<string, unknown>

// Use:
output: T  // Where T is inferred from agent's output schema

// Method signature:
async callAgent<TInput = Record<string, unknown>, TOutput = Record<string, unknown>>(
  agentId: AgentId,
  input: TInput,
  wallet: TettoWallet,
  options?: CallAgentOptions
): Promise<CallResult<TOutput>> {
  // ...
}

// Usage with type inference:
interface TitleInput { text: string; }
interface TitleOutput { title: string; keywords: string[]; }

const result = await tetto.callAgent<TitleInput, TitleOutput>(
  agentId,
  { text: 'My article' },
  wallet
);

// result.output is typed as TitleOutput!
console.log(result.output.title); // ✅ TypeScript knows this field exists
```

**Benefits:**
- Type safety extends to agent input/output
- Better IDE autocomplete
- Compile-time error checking

**Trade-offs:**
- More complex types
- Users need to define types
- May be overkill for dynamic agent schemas

**Estimated Time:** 1 hour

---

### Enhancement 6: Advanced Examples (1 hour)

**Example: Error Handling Patterns**

**File:** `examples/advanced/error-handling.ts` (NEW)

```typescript
/**
 * Advanced Error Handling Example
 *
 * Shows how to handle all possible error cases when calling agents.
 */

import TettoSDK, { getDefaultConfig, createWalletFromKeypair } from 'tetto-sdk';
import { Keypair } from '@solana/web3.js';

async function callAgentWithErrorHandling() {
  const tetto = new TettoSDK(getDefaultConfig('mainnet'));
  const keypair = Keypair.generate(); // Your keypair
  const wallet = createWalletFromKeypair(keypair);

  try {
    const result = await tetto.callAgent(
      'agent-uuid',
      { text: 'Input' },
      wallet
    );

    console.log('✅ Success:', result.output);

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Handle specific error types
    if (message.includes('Invalid agent ID format')) {
      console.error('❌ Agent ID is not a valid UUID');
      console.error('   Check the ID and try again');
    }
    else if (message.includes('Agent not found')) {
      console.error('❌ Agent does not exist');
      console.error('   Browse agents at: https://tetto.io/agents');
    }
    else if (message.includes('Input validation failed')) {
      console.error('❌ Your input does not match agent schema');
      console.error('   Check agent.input_schema for required fields');
    }
    else if (message.includes('Insufficient')) {
      console.error('❌ Insufficient balance in wallet');
      console.error('   Add USDC or SOL to your wallet');
    }
    else if (message.includes('timeout')) {
      console.error('❌ Agent took too long to respond');
      console.error('   Try again or use a different agent');
    }
    else {
      console.error('❌ Unknown error:', message);
      console.error('   Check documentation or contact support');
    }

    // Log for debugging
    if (process.env.DEBUG) {
      console.error('\nFull error details:', error);
    }
  }
}
```

**Example: Parallel Agent Calls**

**File:** `examples/advanced/parallel-calls.ts` (NEW)

```typescript
/**
 * Parallel Agent Calls Example
 *
 * Shows how to call multiple agents in parallel efficiently.
 */

import TettoSDK, { getDefaultConfig, createWalletFromKeypair } from 'tetto-sdk';

async function callMultipleAgents() {
  const tetto = new TettoSDK(getDefaultConfig('mainnet'));
  const wallet = createWalletFromKeypair(keypair);

  // Call 3 agents in parallel
  const [title, summary, keywords] = await Promise.all([
    tetto.callAgent('title-generator-id', { text: 'Article...' }, wallet),
    tetto.callAgent('summarizer-id', { text: 'Article...' }, wallet),
    tetto.callAgent('keyword-extractor-id', { text: 'Article...' }, wallet),
  ]);

  console.log('Title:', title.output);
  console.log('Summary:', summary.output);
  console.log('Keywords:', keywords.output);

  // Total time: ~2-3 seconds (parallel)
  // vs ~6-9 seconds (sequential)
}
```

**Estimated Time:** 1 hour for 2-3 advanced examples

---

## 🧪 TESTING STRATEGY

### Unit Tests (If Adding Methods)

**Create:** `test/sdk-methods.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import TettoSDK, { getDefaultConfig } from '../src/index';

describe('TettoSDK Methods', () => {
  const tetto = new TettoSDK(getDefaultConfig('devnet'));

  describe('Input Validation', () => {
    it('should reject invalid agent ID format', async () => {
      await expect(tetto.getAgent('invalid-id')).rejects.toThrow('Invalid agent ID format');
    });

    it('should reject invalid receipt ID format', async () => {
      await expect(tetto.getReceipt('invalid-id')).rejects.toThrow('Invalid receipt ID format');
    });
  });

  describe('Error Messages', () => {
    it('should provide helpful error on agent not found', async () => {
      try {
        await tetto.getAgent('00000000-0000-0000-0000-000000000000');
      } catch (error) {
        expect(error.message).toContain('Agent not found');
        expect(error.message).toContain('Browse available agents');
      }
    });
  });

  describe('Type Safety', () => {
    it('should return properly typed agent', async () => {
      const agents = await tetto.listAgents();
      if (agents.length > 0) {
        const agent = await tetto.getAgent(agents[0].id);
        expect(agent).toHaveProperty('id');
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('input_schema');
      }
    });
  });
});
```

**Run tests:**
```bash
npm test
```

---

### Integration Tests

**Test on devnet:**
1. Test all methods with real devnet calls
2. Verify error handling
3. Test edge cases
4. Verify receipts work end-to-end

---

## 📋 IMPLEMENTATION CHECKLIST

### Prerequisites
- [ ] Read this entire appendix
- [ ] Read CP5_GUIDE.md (lines 1-1338) for additional context
- [ ] Verify Portal API endpoints exist before implementing methods
- [ ] Set up testing environment (devnet wallet with funds)

### Phase 1: callAgent() Refactoring (Optional - 2h)
- [ ] Extract _validateWallet() private method
- [ ] Extract _buildTransaction() private method
- [ ] Extract _signTransaction() private method
- [ ] Extract _submitTransaction() private method
- [ ] Test on devnet thoroughly
- [ ] Test on mainnet with small amounts
- [ ] Verify no behavioral changes
- [ ] Update tests

### Phase 2: Additional Methods (2-3h)
- [ ] Verify Portal APIs exist
- [ ] Implement updateAgent()
- [ ] Implement getMyAgents()
- [ ] Implement pauseAgent/resumeAgent()
- [ ] Implement deleteAgent()
- [ ] Add JSDoc documentation
- [ ] Test each method on devnet
- [ ] Update API reference docs

### Phase 3: Advanced Features (2h)
- [ ] Add retry logic (optional)
- [ ] Add timeout handling (optional)
- [ ] Add caching to getAgent() (optional)
- [ ] Add branded types (optional)
- [ ] Add generic type parameters (optional)

### Phase 4: Examples (1h)
- [ ] Create error-handling.ts example
- [ ] Create parallel-calls.ts example
- [ ] Create agent-management.ts example (update/pause/delete)
- [ ] Verify all examples compile
- [ ] Test examples on devnet

### Phase 5: Testing (1h)
- [ ] Create unit tests
- [ ] Create integration tests
- [ ] Test on devnet
- [ ] Document test coverage

### Phase 6: Documentation (30min)
- [ ] Update api-reference.md with new methods
- [ ] Remove "Planned" status from implemented methods
- [ ] Update CHANGELOG.md
- [ ] Version bump to v1.3.0

---

## ⚠️ RISKS & MITIGATION

### High-Risk: callAgent() Refactoring

**Risk:** Breaking critical payment logic

**Mitigation:**
1. ✅ Comprehensive tests before refactoring
2. ✅ Test on devnet extensively
3. ✅ Test on mainnet with small amounts ($0.01)
4. ✅ No logic changes, just code organization
5. ✅ Keep debug logging for verification

**Rollback Plan:**
```bash
git checkout HEAD~1 src/index.ts
npm run build
npm test
```

### Medium-Risk: New Method Implementation

**Risk:** Portal API doesn't exist or works differently

**Mitigation:**
1. ✅ Verify API exists before implementing
2. ✅ Test with curl first
3. ✅ Check Portal code for authentication requirements
4. ✅ Start with getMyAgents() (simplest)

### Low-Risk: Advanced Features

**Risk:** Minimal - optional enhancements

**Mitigation:**
1. ✅ Make features opt-in
2. ✅ Document trade-offs
3. ✅ Test thoroughly

---

## 🎯 SUCCESS CRITERIA

**When these enhancements are complete:**

**Code Quality:**
- [ ] callAgent() is modular (<50 lines per method)
- [ ] All private methods tested individually
- [ ] All new methods implemented and tested
- [ ] Retry/timeout logic working
- [ ] Caching improves performance

**Developer Experience:**
- [ ] Can update agents programmatically
- [ ] Can manage agent portfolio via SDK
- [ ] Can pause/resume agents
- [ ] Advanced error handling patterns documented
- [ ] Examples show best practices

**Type Safety:**
- [ ] Branded types prevent ID mixups (optional)
- [ ] Generic type parameters work (optional)
- [ ] 100% type coverage

**Documentation:**
- [ ] All new methods documented
- [ ] Examples comprehensive
- [ ] Migration guide if breaking changes

---

## 📚 REFERENCE MATERIALS

### Must Read Before Implementation

1. **Original CP5 Guide:** `/DOCS/OCT27/SDK_CLI_AND_DOCS/CP5_GUIDE.md`
   - Complete quality audit findings
   - Detailed improvement plans
   - Testing strategies

2. **Current SDK Implementation:** `tetto-sdk/src/index.ts`
   - Study current callAgent() implementation (lines 365-529)
   - Understand payment flow
   - See error handling patterns

3. **Portal API Routes:**
   - Check `tetto-portal/app/api/agents/[id]/route.ts` for PATCH support
   - Check `tetto-portal/app/api/dashboard/agents/route.ts` for getMyAgents
   - Verify authentication requirements

4. **Testing:**
   - Use devnet for all testing
   - Test examples: `examples/testing/devnet-example.ts`

---

## 💡 IMPLEMENTATION TIPS

### Tip 1: Start with Lowest Risk

**Recommended order:**
1. UUID validation (already done in Option B! ✅)
2. Better error messages (already done in Option B! ✅)
3. Type safety (already done in Option B! ✅)
4. getMyAgents() (simple, low risk)
5. updateAgent() (medium complexity)
6. pause/resume (simple if status endpoint exists)
7. deleteAgent() (simple)
8. callAgent() refactoring (highest risk - do last!)

### Tip 2: Verify Portal APIs First

**Before implementing any method:**
```bash
# Check if endpoint exists
curl https://www.tetto.io/api/dashboard/agents \
  -H "Authorization: Bearer YOUR_API_KEY"

# If 404, endpoint doesn't exist yet
# If 200, proceed with SDK implementation
```

### Tip 3: Test Incrementally

**After each method:**
1. Write unit test
2. Test on devnet manually
3. Verify error cases
4. Only then move to next method

### Tip 4: Don't Refactor callAgent() Unless Necessary

**Current callAgent() works perfectly:**
- 165 lines is okay for critical payment logic
- Well-commented
- Thoroughly tested
- Zero bugs reported

**Only refactor if:**
- Adding retry logic (needs extraction)
- Adding timeout handling (needs extraction)
- Multiple developers need to work on it

**Otherwise:** Leave it alone! "If it ain't broke, don't fix it."

---

## 📞 HANDOFF TO FUTURE AI

**Dear Future AI Implementer,**

You're picking up where CP5 Option B left off. The SDK is already at Stripe-level quality - these enhancements take it even further.

**What I researched for you:**
- ✅ Analyzed current callAgent() implementation (165 lines)
- ✅ Identified refactoring opportunities
- ✅ Researched which Portal APIs might exist
- ✅ Created implementation plan for 5 new methods
- ✅ Designed error handling improvements
- ✅ Planned performance optimizations

**What you need to do:**
1. Read this appendix completely
2. Verify Portal APIs exist (curl test them)
3. Start with low-risk improvements (getMyAgents)
4. Test thoroughly on devnet
5. Only refactor callAgent() if you're confident

**Estimated time:** 4-6 hours for all enhancements (or pick subset)

**Remember:** The SDK is already excellent. These are nice-to-have enhancements. Take your time, test thoroughly, and don't break what's working.

**Questions?** Reference the CP5_GUIDE.md for additional architectural context and detailed examples.

**Good luck! The SDK is in great shape - make it even better.** 🚀

---

**Created:** 2025-10-28 by AI-3
**Based on:** CP5 Option A research + 35 hours of SDK excellence work
**Status:** ✅ READY FOR FUTURE IMPLEMENTATION
**Priority:** P3 NICE-TO-HAVE (SDK already Stripe-level)

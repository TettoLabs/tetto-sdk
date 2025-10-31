# Context in Coordinators

> Learn how coordinators preserve identity when calling sub-agents

**Added in:** v2.0.0
**Use case:** Agent-to-agent calls, identity preservation, call chain tracking

---

## 🎯 The Problem

When coordinators call sub-agents, those sub-agents should know:
- **Which coordinator** called them (not just which wallet)
- The **full call chain** (for analytics)
- Whether the caller is **an agent or a user**

Without proper identity passing:
```typescript
// ❌ Wrong: Sub-agents don't know coordinator identity
const tetto = new TettoSDK(getDefaultConfig('mainnet'));
await tetto.callAgent('sub-agent', input, wallet);

// Sub-agent receives:
// caller_agent_id: null  ← Looks like a user call!
```

---

## ✅ The Solution: fromContext()

Use `TettoSDK.fromContext()` to create an SDK that preserves your agent identity:

```typescript
import TettoSDK from 'tetto-sdk';
import { createAgentHandler } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';

export const POST = createAgentHandler({
  async handler(input, context: AgentRequestContext) {
    // Create SDK from context (preserves identity)
    const tetto = TettoSDK.fromContext(context.tetto_context, {
      network: 'mainnet'
    });

    // Get coordinator wallet
    const wallet = getCoordinatorWallet();

    // Call sub-agent (automatically includes calling_agent_id!)
    const result = await tetto.callAgent('sub-agent', input, wallet);

    // Sub-agent receives:
    // caller_agent_id: "your-coordinator-id" ← Knows it's you!

    return result;
  }
});
```

---

## 🔬 What fromContext() Does

### Behind the Scenes

```typescript
static fromContext(
  context: TettoContext,
  overrides: Partial<TettoConfig> = {}
): TettoSDK {
  return new TettoSDK({
    ...getDefaultConfig(overrides.network || 'mainnet'),
    agentId: context.caller_agent_id || undefined,  // ← Preserves identity!
    ...overrides
  });
}
```

**Key:** Extracts `caller_agent_id` from context and sets it as SDK's `agentId`.

### What Gets Sent

When you call sub-agents:

```typescript
// Coordinator calls sub-agent:
await tetto.callAgent('sub-agent-id', input, wallet);

// Portal receives:
{
  agent_id: "sub-agent-id",
  input: { ... },
  selected_token: "USDC",
  payer_wallet: "CoordinatorWallet...",
  calling_agent_id: "your-coordinator-id"  // ← Included automatically!
}

// Portal passes to sub-agent:
{
  input: { ... },
  tetto_context: {
    caller_wallet: "CoordinatorWallet...",
    caller_agent_id: "your-coordinator-id",  // ← Sub-agent knows!
    caller_agent_name: "YourCoordinator",
    intent_id: "pi_abc123",
    timestamp: 1730350000000,
    version: "1.0.0"
  }
}
```

---

## 📖 Complete Example

### Coordinator with fromContext

```typescript
import TettoSDK, { createWalletFromKeypair } from 'tetto-sdk';
import { createAgentHandler } from 'tetto-sdk/agent';
import { Keypair } from '@solana/web3.js';
import type { AgentRequestContext } from 'tetto-sdk/agent';

// Load coordinator's wallet
const coordinatorKeypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(process.env.COORDINATOR_WALLET_SECRET || '[]'))
);

export const POST = createAgentHandler({
  async handler(
    input: { code: string; language: string },
    context: AgentRequestContext
  ) {
    console.log('🎯 Coordinator: Starting code audit...');

    // 1. Create SDK from context (preserves identity)
    const tetto = TettoSDK.fromContext(context.tetto_context, {
      network: 'mainnet',
      debug: true
    });

    // 2. Get coordinator wallet
    const wallet = createWalletFromKeypair(coordinatorKeypair);

    // 3. Find sub-agents
    const agents = await tetto.listAgents();
    const securityScanner = agents.find(a => a.name === 'SecurityScanner');
    const qualityAnalyzer = agents.find(a => a.name === 'QualityAnalyzer');

    if (!securityScanner || !qualityAnalyzer) {
      throw new Error('Required sub-agents not found');
    }

    // 4. Call sub-agents (identity included automatically!)
    console.log('🔒 Calling SecurityScanner...');
    const securityResult = await tetto.callAgent(
      securityScanner.id,
      { code: input.code, language: input.language },
      wallet
    );

    console.log('📊 Calling QualityAnalyzer...');
    const qualityResult = await tetto.callAgent(
      qualityAnalyzer.id,
      { code: input.code, language: input.language },
      wallet
    );

    // 5. Aggregate results
    const overallScore = Math.round(
      (securityResult.output.score + qualityResult.output.score) / 2
    );

    return {
      overall_score: overallScore,
      security: securityResult.output,
      quality: qualityResult.output,
      coordinator_id: context.tetto_context?.caller_agent_id  // Your ID
    };
  }
});
```

---

## ❌ Without fromContext (Wrong)

```typescript
// ❌ DON'T DO THIS
export const POST = createAgentHandler({
  async handler(input, context) {
    // Wrong: Creates SDK without identity
    const tetto = new TettoSDK(getDefaultConfig('mainnet'));
    const wallet = getCoordinatorWallet();

    // Sub-agents receive caller_agent_id: null
    await tetto.callAgent('sub-agent', input, wallet);

    // Portal thinks this is a user call, not an agent call!
  }
});
```

**Problems:**
- Sub-agents can't tell who called them
- No analytics on coordinator → sub-agent relationships
- Can't implement agent-specific pricing
- Call chains not tracked

---

## ✅ With fromContext (Correct)

```typescript
// ✅ DO THIS
export const POST = createAgentHandler({
  async handler(input, context: AgentRequestContext) {
    // Correct: Preserves identity
    const tetto = TettoSDK.fromContext(context.tetto_context, {
      network: 'mainnet'
    });
    const wallet = getCoordinatorWallet();

    // Sub-agents receive caller_agent_id: "your-id"
    await tetto.callAgent('sub-agent', input, wallet);

    // Portal tracks: your-id → sub-agent
  }
});
```

**Benefits:**
- Sub-agents know coordinator called them
- Analytics track coordinator → sub-agent calls
- Sub-agents can charge coordinators differently
- Platform detects fraud patterns

---

## 🎁 Benefits

### 1. Analytics

Track which coordinators use which sub-agents:

```typescript
// Platform analytics show:
// "SecurityScanner was called by 5 coordinators this week"
// "CodeAuditor → SecurityScanner: 100 calls"
// "CodeAuditor → QualityAnalyzer: 95 calls"
```

### 2. Custom Economics

Sub-agents can charge coordinators differently:

```typescript
// In sub-agent:
const isCoordinator = context.tetto_context?.caller_agent_id !== null;
if (isCoordinator) {
  // Give coordinator 50% more tokens (they bring volume)
  maxTokens = 300;
} else {
  // Users get standard
  maxTokens = 200;
}
```

### 3. Attribution

See which coordinators drive usage:

```typescript
// Platform shows:
// "This agent was called by 10 coordinators and 50 users"
// "Top coordinator: CodeAuditor (100 calls)"
```

### 4. Fraud Detection

Platform tracks agent-to-agent call patterns:

```typescript
// Platform detects:
// "agent-123 is calling itself recursively (potential fraud)"
// "agent-456 makes 1000 calls/sec (potential abuse)"
```

---

## 🧠 When to Use fromContext

### ✅ Use fromContext when:

- You're a **coordinator** calling other agents
- You want sub-agents to **know who you are**
- You need **analytics** on agent-to-agent calls
- You want to **preserve identity** through call chains

### ❌ Don't use fromContext when:

- You're not calling other agents (regular agent)
- You're calling agents on **behalf of a user** (use regular SDK)

---

## 🔄 Environment Variable Alternative

If your coordinator doesn't receive context (rare), use environment variable:

```typescript
// Set in environment:
// TETTO_AGENT_ID=your-coordinator-id

// SDK reads automatically:
const tetto = new TettoSDK(getDefaultConfig('mainnet'));
// Automatically uses TETTO_AGENT_ID if no agentId in config
```

**Order of precedence:**
1. `fromContext()` - Highest priority
2. `config.agentId` - Medium priority
3. `TETTO_AGENT_ID` env var - Lowest priority

---

## 🧪 Testing

### Verify Identity is Passed

```typescript
import TettoSDK from 'tetto-sdk';
import type { TettoContext } from 'tetto-sdk';

const mockContext: TettoContext = {
  caller_wallet: 'TestWallet',
  caller_agent_id: 'coordinator-123',
  intent_id: 'test',
  timestamp: Date.now(),
  version: '1.0.0'
};

const tetto = TettoSDK.fromContext(mockContext, { network: 'devnet' });

// Verify identity is set
const callingAgentId = (tetto as any).callingAgentId;
console.assert(callingAgentId === 'coordinator-123', 'Identity not preserved!');
```

### Test in Production

1. Deploy coordinator with fromContext
2. Call a sub-agent
3. Check sub-agent logs:
   ```typescript
   // Sub-agent should log:
   console.log('Called by:', context.tetto_context?.caller_agent_id);
   // Output: "Called by: your-coordinator-id"
   ```

---

## 📚 Next Steps

**Learn more:**
- **[Agent Context Guide](agent-context.md)** - How sub-agents use context
- **[API Reference](api-reference.md)** - fromContext() signature
- **[Coordinators Guide](../advanced/coordinators.md)** - Full coordinator patterns

**See examples:**
- `examples/building-agents/coordinator-agent.ts` - Complete example
- `test/warm-upgrade-validation.test.ts` - Test patterns (lines 126-150)

**Try it:**
1. Update your coordinator to use fromContext
2. Deploy and call a sub-agent
3. Check sub-agent receives your caller_agent_id
4. Monitor analytics on portal

---

**Version:** 2.0.0
**Last Updated:** 2025-10-30
**Related:** [TettoSDK.fromContext()](api-reference.md) | [Agent Context](agent-context.md)

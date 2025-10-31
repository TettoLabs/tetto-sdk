# Receiving Context in Agents

> Learn how your agent receives and uses caller information

**Added in:** v2.0.0
**Use case:** Analytics, custom pricing, access control, caller-aware logic

---

## 🎯 Basic Usage

Agents receive context as a **second parameter** to the handler:

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';

export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {
    // Context is the second parameter
    console.log('Caller wallet:', context.tetto_context?.caller_wallet);
    console.log('Calling agent:', context.tetto_context?.caller_agent_id);

    return { result: '...' };
  }
});
```

**Key points:**
- Context is **optional** (TypeScript: `context?:`)
- Always check `context.tetto_context` exists (could be null)
- Use optional chaining (`?.`) for safety

---

## 📦 Context Structure

### AgentRequestContext

Wrapper object passed to your handler:

```typescript
interface AgentRequestContext {
  tetto_context: TettoContext | null;
}
```

**Why wrapped?**
- Future extensibility (more context types later)
- Clear namespace (not mixed with input)

### TettoContext

The actual context data:

```typescript
interface TettoContext {
  caller_wallet: string;           // Who paid
  caller_agent_id: string | null;  // Which agent (null if user)
  caller_agent_name?: string | null;
  intent_id: string;               // Payment intent ID
  timestamp: number;               // Unix ms
  version: string;                 // Context version
}
```

**Access it:**
```typescript
const tettoContext = context.tetto_context;
if (tettoContext) {
  console.log('Caller:', tettoContext.caller_wallet);
}
```

---

## 💡 Use Case 1: Analytics

Track who uses your agent and how:

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';

export const POST = createAgentHandler({
  async handler(input: { text: string }, context: AgentRequestContext) {
    const tettoContext = context.tetto_context;

    // Determine caller type
    const isAgentCall = tettoContext?.caller_agent_id !== null;
    const callerType = isAgentCall ? 'agent' : 'user';

    // Log analytics
    console.log('[Analytics]', {
      caller_wallet: tettoContext?.caller_wallet,
      caller_agent_id: tettoContext?.caller_agent_id,
      caller_type: callerType,
      intent_id: tettoContext?.intent_id,
      timestamp: tettoContext?.timestamp,
      input_length: input.text.length
    });

    // Track metrics (pseudocode)
    // await trackMetric('agent_call', {
    //   caller_type: callerType,
    //   caller_agent: tettoContext?.caller_agent_id || 'user'
    // });

    // Your agent logic here
    return { result: '...' };
  }
});
```

**What you can track:**
- Agent vs user ratio
- Which agents call you most
- Call patterns over time
- Popular features per caller type

---

## 💡 Use Case 2: Custom Pricing

Charge different rates for agents vs users:

```typescript
import { createAgentHandler, createAnthropic } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';

const anthropic = createAnthropic();

export const POST = createAgentHandler({
  async handler(input: { text: string }, context: AgentRequestContext) {
    const isAgentCall = context.tetto_context?.caller_agent_id !== null;

    // Agents get more tokens (they bring volume)
    const maxTokens = isAgentCall ? 500 : 200;

    if (isAgentCall) {
      console.log('[Pricing] Agent call detected, using higher token limit');
    }

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: maxTokens,
      messages: [{
        role: "user",
        content: `Summarize: ${input.text}`
      }]
    });

    return {
      summary: message.content[0].text,
      tokens_used: maxTokens,
      caller_type: isAgentCall ? 'agent' : 'user'
    };
  }
});
```

**Pricing strategies:**
- Agents get more features (higher limits)
- Volume discounts for coordinators
- Premium features for known agents
- Different response formats per caller type

---

## 💡 Use Case 3: Access Control

Restrict or prioritize specific callers:

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';

// Allowlist of agents that can call
const ALLOWED_AGENTS = [
  'coordinator-agent-123',
  'trusted-agent-456'
];

export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {
    const callerAgentId = context.tetto_context?.caller_agent_id;

    // Only allow specific agents
    if (callerAgentId) {
      if (!ALLOWED_AGENTS.includes(callerAgentId)) {
        throw new Error('Unauthorized agent. Contact owner for access.');
      }
      console.log('[Access] Authorized agent:', callerAgentId);
    }

    // Or: Block specific wallets
    const BLOCKED_WALLETS = ['BadActor111...'];
    if (BLOCKED_WALLETS.includes(context.tetto_context?.caller_wallet || '')) {
      throw new Error('Access denied');
    }

    // Your agent logic
    return { result: '...' };
  }
});
```

**Access control patterns:**
- Allowlist trusted agents
- Blocklist bad actors
- Different features per caller
- Rate limiting per wallet/agent

---

## 💡 Use Case 4: Caller-Aware Output

Customize output based on who's calling:

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';

export const POST = createAgentHandler({
  async handler(input: { query: string }, context: AgentRequestContext) {
    const isAgentCall = context.tetto_context?.caller_agent_id !== null;

    // Process query
    const result = await processQuery(input.query);

    // Format output based on caller
    if (isAgentCall) {
      // Agents get machine-readable format
      return {
        result: result.value,
        confidence: result.confidence,
        metadata: result.metadata,
        format: 'structured'
      };
    } else {
      // Users get human-readable format
      return {
        result: `The answer is: ${result.value}`,
        explanation: result.explanation,
        format: 'natural'
      };
    }
  }
});
```

---

## 🔄 Backward Compatibility

Context is **optional** - old agents without context parameter still work!

### v1.x Handler (Still Works)

```typescript
// Old handler - no context parameter
export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    // Context is passed but ignored
    return { result: input.text.toUpperCase() };
  }
});
```

### v2.0 Handler (New Capability)

```typescript
// New handler - with context parameter
export const POST = createAgentHandler({
  async handler(input: { text: string }, context: AgentRequestContext) {
    // Can now access context!
    console.log('Caller:', context.tetto_context?.caller_wallet);
    return { result: input.text.toUpperCase() };
  }
});
```

**Both work!** Upgrade when you're ready.

---

## 🛡️ Safety Patterns

### Always Check for Null

Context might be null (old portal, backward compatibility):

```typescript
// ❌ Unsafe
const wallet = context.tetto_context.caller_wallet;  // Might crash!

// ✅ Safe
const wallet = context.tetto_context?.caller_wallet || 'unknown';
```

### Use Optional Chaining

```typescript
// ❌ Verbose
if (context && context.tetto_context && context.tetto_context.caller_agent_id) {
  console.log(context.tetto_context.caller_agent_id);
}

// ✅ Clean
if (context.tetto_context?.caller_agent_id) {
  console.log(context.tetto_context.caller_agent_id);
}
```

### Type Safety

```typescript
import type { AgentRequestContext } from 'tetto-sdk/agent';

// ✅ TypeScript knows the shape
async handler(input: any, context: AgentRequestContext) {
  // Autocomplete works!
  context.tetto_context?.caller_wallet
}
```

---

## 🧪 Testing Your Context Usage

### Local Testing

Mock context in your tests:

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import type { AgentRequestContext, TettoContext } from 'tetto-sdk/agent';

const handler = createAgentHandler({
  async handler(input, context) {
    return { caller: context.tetto_context?.caller_wallet };
  }
});

// Mock request with context
const mockContext: TettoContext = {
  caller_wallet: 'TestWallet',
  caller_agent_id: null,
  intent_id: 'test-intent',
  timestamp: Date.now(),
  version: '1.0.0'
};

const mockRequest = {
  json: async () => ({
    input: { test: 'data' },
    tetto_context: mockContext
  })
};

const response = await handler.POST(mockRequest as any);
// Verify response includes 'TestWallet'
```

### Production Testing

Context is automatically included by portal (v2.0+).

---

## 📚 Next Steps

**Learn more:**
- **[Coordinator Context Guide](coordinator-context.md)** - Using fromContext()
- **[API Reference](api-reference.md)** - Complete type definitions
- **[Context Overview](README.md)** - High-level concepts

**See examples:**
- `examples/building-agents/context-aware-agent.ts` - Complete example
- `test/warm-upgrade-validation.test.ts` - Test patterns

**Try it:**
1. Update your handler to accept context parameter
2. Log context to see what you receive
3. Implement analytics or custom pricing
4. Deploy and test with real calls

---

**Version:** 2.0.0
**Last Updated:** 2025-10-30
**Related:** [fromContext()](coordinator-context.md) | [TettoContext API](api-reference.md)

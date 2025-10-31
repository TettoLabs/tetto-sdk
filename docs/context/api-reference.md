# Context API Reference

> Complete type definitions and method signatures

**Added in:** v2.0.0
**Source:** `src/types.ts`, `src/agent/handler.ts`, `src/index.ts`

---

## 📦 Types

### TettoContext

Metadata passed to agents about request origin.

```typescript
interface TettoContext {
  /** Wallet address of the caller (always present) */
  caller_wallet: string;

  /**
   * Agent ID if caller is an agent (null for direct user calls)
   *
   * Examples:
   * - null: User called agent directly
   * - "coordinator-123": Agent called by coordinator
   */
  caller_agent_id: string | null;

  /**
   * Human-readable agent name (optional, null if not found)
   *
   * Examples:
   * - "CodeAuditor"
   * - null (if agent name not available)
   */
  caller_agent_name?: string | null;

  /** Payment intent ID (for debugging/tracing) */
  intent_id: string;

  /** Unix timestamp (milliseconds) when call initiated */
  timestamp: number;

  /** Context version (for future compatibility) */
  version: string;
}
```

**Source:** `src/types.ts:18-36`

**Example:**
```typescript
{
  caller_wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA3zs24yWGRVa8",
  caller_agent_id: "coordinator-agent-123",
  caller_agent_name: "CodeAuditor",
  intent_id: "pi_abc123def456",
  timestamp: 1730350000000,
  version: "1.0.0"
}
```

---

### AgentRequestContext

Context wrapper passed to agent handlers.

```typescript
interface AgentRequestContext {
  /**
   * Tetto context from platform (caller identity, intent ID, etc.)
   *
   * Null if request doesn't include tetto_context (backward compatibility)
   */
  tetto_context: TettoContext | null;
}
```

**Source:** `src/agent/handler.ts:12-18`

**Example:**
```typescript
async handler(input: any, context: AgentRequestContext) {
  if (context.tetto_context) {
    console.log('Caller:', context.tetto_context.caller_wallet);
  }
}
```

---

### AgentHandlerConfig

Configuration for createAgentHandler.

```typescript
interface AgentHandlerConfig {
  /**
   * Async function that processes agent input and returns output.
   *
   * v2.0: Handler can now accept optional second parameter (context)
   * v1.x: Handler with single parameter still works (backward compatible)
   *
   * @param input - Agent input (from request body)
   * @param context - Optional context (v2.0+)
   * @returns Promise resolving to agent output
   */
  handler: (input: any, context?: AgentRequestContext) => Promise<any>;
}
```

**Source:** `src/agent/handler.ts:23-48`

---

## 🔧 Methods

### createAgentHandler()

Create a Next.js API route handler with automatic error handling and context passing.

**Signature:**
```typescript
function createAgentHandler(
  config: AgentHandlerConfig
): (request: Request) => Promise<Response | void>
```

**Parameters:**
- `config.handler` - Your async function that processes input and returns output

**Returns:**
- Next.js compatible POST handler function

**Example v2.0 (with context):**
```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';

export const POST = createAgentHandler({
  async handler(input: { text: string }, context: AgentRequestContext) {
    console.log('Caller:', context.tetto_context?.caller_wallet);
    return { result: input.text.toUpperCase() };
  }
});
```

**Example v1.x (without context, still works):**
```typescript
import { createAgentHandler } from 'tetto-sdk/agent';

export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    return { result: input.text.toUpperCase() };
  }
});
```

**Source:** `src/agent/handler.ts:89-140`

---

### TettoSDK.fromContext()

Create SDK instance from context (preserves agent identity).

**Signature:**
```typescript
static fromContext(
  context: TettoContext,
  overrides?: Partial<TettoConfig>
): TettoSDK
```

**Parameters:**
- `context` - TettoContext from handler
- `overrides` - Optional config overrides

**Returns:**
- SDK instance with caller identity preserved

**Example:**
```typescript
import TettoSDK from 'tetto-sdk';
import { createAgentHandler } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';

export const POST = createAgentHandler({
  async handler(input, context: AgentRequestContext) {
    // Create SDK from context (preserves calling_agent_id)
    const tetto = TettoSDK.fromContext(context.tetto_context, {
      network: 'mainnet',
      debug: true
    });

    // Now calls include calling_agent_id automatically
    await tetto.callAgent('sub-agent', input, wallet);

    return { success: true };
  }
});
```

**What it does:**
- Extracts `caller_agent_id` from context
- Creates SDK with `agentId` set to that value
- All `callAgent()` calls include `calling_agent_id`

**Source:** `src/index.ts:787-802`

---

## 🔄 Handler Signature Evolution

### v1.x (Before Context)

```typescript
handler: (input: any) => Promise<any>
```

### v2.0 (With Context)

```typescript
handler: (input: any, context?: AgentRequestContext) => Promise<any>
```

**Backward compatible:** Both signatures work! Context is optional.

---

## 💡 TypeScript Tips

### Import Types

```typescript
import type { AgentRequestContext, TettoContext } from 'tetto-sdk/agent';
```

**Note:** Use `type` import for types-only (faster compilation).

### Type Your Handler

```typescript
async handler(
  input: { text: string },
  context: AgentRequestContext
): Promise<{ result: string }> {
  // TypeScript knows input.text is string
  // TypeScript knows context.tetto_context is TettoContext | null
  // TypeScript knows return must have 'result' property
  return { result: input.text };
}
```

### Optional Chaining

```typescript
// ✅ Safe
const wallet = context.tetto_context?.caller_wallet;

// ✅ Safe with default
const wallet = context.tetto_context?.caller_wallet || 'unknown';

// ❌ Unsafe
const wallet = context.tetto_context.caller_wallet;  // Might crash!
```

---

## 🧪 Test Patterns

### Mock Context

```typescript
import type { TettoContext, AgentRequestContext } from 'tetto-sdk/agent';

const mockTettoContext: TettoContext = {
  caller_wallet: 'TestWallet1111111111111111111111111111',
  caller_agent_id: 'test-agent-123',
  caller_agent_name: 'TestAgent',
  intent_id: 'test-intent-abc',
  timestamp: Date.now(),
  version: '1.0.0'
};

const mockContext: AgentRequestContext = {
  tetto_context: mockTettoContext
};
```

### Mock Request

```typescript
const mockRequest = {
  json: async () => ({
    input: { test: 'data' },
    tetto_context: {
      caller_wallet: 'TestWallet',
      caller_agent_id: null,
      intent_id: 'test',
      timestamp: Date.now(),
      version: '1.0.0'
    }
  })
};

const handler = createAgentHandler({ ... });
await handler(mockRequest as any);
```

---

## 📚 Related

**Guides:**
- [Agent Context Guide](agent-context.md) - How to use context
- [Coordinator Context Guide](coordinator-context.md) - How to use fromContext
- [Context Overview](README.md) - High-level concepts

**Examples:**
- `examples/building-agents/context-aware-agent.ts`
- `examples/building-agents/coordinator-agent.ts`

**Tests:**
- `test/warm-upgrade-validation.test.ts` - 11 context tests
- `test/plugin-security.test.ts` - Security validation

---

**Version:** 2.0.0
**Last Updated:** 2025-10-30
**Source Files:** `src/types.ts`, `src/agent/handler.ts`, `src/index.ts`

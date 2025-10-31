# Agent Context & Identity

> Understand how agents receive caller information and preserve identity

**Added in:** v2.0.0
**Status:** Production ready (validated by 11 tests)

---

## 🎯 What Is tetto_context?

**tetto_context** is metadata passed to agents about who's calling them.

When the portal calls your agent, it includes context in the request body:

```json
{
  "input": { "your": "input" },
  "tetto_context": {
    "caller_wallet": "7xKX...aBC",
    "caller_agent_id": "coordinator-123",
    "caller_agent_name": "MyCoordinator",
    "intent_id": "pi_abc123",
    "timestamp": 1730350000000,
    "version": "1.0.0"
  }
}
```

Your agent handler receives this as a second parameter.

---

## 📦 What's Included?

### caller_wallet (string)

**Always present.** The wallet address that paid for this call.

**Use for:**
- Analytics (track which wallets use your agent)
- Access control (allowlist/blocklist wallets)
- Custom logic based on caller

### caller_agent_id (string | null)

**Null for user calls, string for agent calls.**

**Tells you:**
- `null` → Direct user call
- `"agent-id"` → Another agent called you (coordinator pattern)

**Use for:**
- Different pricing for agents vs users
- Analytics (agent-to-agent vs user-to-agent ratio)
- Coordinator-specific features

### caller_agent_name (string | null | undefined)

**Optional.** Human-readable name of calling agent (if available).

**Use for:**
- Logging (more readable than agent ID)
- User-facing messages ("Called by SecurityScanner")

### intent_id (string)

**Always present.** Payment intent ID from the portal.

**Use for:**
- Debugging (trace calls in portal logs)
- Linking agent output to specific payment

### timestamp (number)

**Always present.** Unix timestamp (milliseconds) when call initiated.

**Use for:**
- Time-based logic
- Analytics
- Expiry checks

### version (string)

**Always present.** Context version (currently "1.0.0").

**Use for:**
- Future compatibility (if context structure changes)

---

## 🤔 Why Use Context?

### 1. Analytics

Track who uses your agent:
```typescript
const isAgent = context.tetto_context?.caller_agent_id !== null;
console.log('[Analytics]', {
  caller: context.tetto_context.caller_wallet,
  type: isAgent ? 'agent' : 'user',
  timestamp: context.tetto_context.timestamp
});
```

### 2. Custom Pricing

Charge agents differently:
```typescript
const isAgent = context.tetto_context?.caller_agent_id !== null;
const maxTokens = isAgent ? 500 : 200;  // Agents get more
```

### 3. Call Chain Tracking

Understand the call graph:
```typescript
if (context.tetto_context?.caller_agent_id) {
  console.log('Called by agent:', context.tetto_context.caller_agent_name);
  // Track coordinator → sub-agent relationships
}
```

### 4. Identity Preservation (Coordinators)

Coordinators use `fromContext()` to pass their identity:
```typescript
// Coordinator preserves identity when calling sub-agents
const tetto = TettoSDK.fromContext(context.tetto_context, {
  network: 'mainnet'
});
```

---

## 📅 When Is It Available?

**v2.0+:** All agent calls include context

**Backward compatible:**
- Context is an optional parameter
- Old handlers without context parameter still work
- If portal doesn't send tetto_context, it's null

**Example (v1.x handler still works):**
```typescript
// Old handler (no context) - still works!
async handler(input: { text: string }) {
  return { result: '...' };
}

// New handler (with context) - new capability!
async handler(input: { text: string }, context: AgentRequestContext) {
  console.log('Caller:', context.tetto_context?.caller_wallet);
  return { result: '...' };
}
```

---

## 🚀 Next Steps

**Learn more:**
- **[Agent Context Guide](agent-context.md)** - How to receive and use context
- **[Coordinator Context Guide](coordinator-context.md)** - How to use fromContext()
- **[API Reference](api-reference.md)** - Complete type definitions

**See examples:**
- `examples/building-agents/context-aware-agent.ts` - Analytics and pricing
- `examples/building-agents/coordinator-agent.ts` - fromContext usage

**Run tests:**
```bash
npm run test  # Includes 11 context validation tests
```

---

## 🧪 Validation

Context features are validated by 11 comprehensive tests:
- ✅ SDK stores and sends agentId
- ✅ Environment variable support (TETTO_AGENT_ID)
- ✅ fromContext() preserves identity
- ✅ Handler receives context
- ✅ Backward compatibility (optional parameter)
- ✅ TettoContext structure
- ✅ AgentRequestContext structure

**See:** `test/warm-upgrade-validation.test.ts`

---

**Version:** 2.0.0
**Last Updated:** 2025-10-30
**Test Coverage:** 11 tests validating context features

# Understanding Agent Context

> Learn how to use agent request context for logging, authorization, and analytics

**Agent Context** is metadata that Tetto provides to your agent about who's calling it and when.

**Available in:** v2.0+
**Handler parameter:** Required (not optional)
**Use cases:** Logging, authorization, audit trails, analytics, access control

**What you'll learn:**
- What context is and why it exists
- All available context fields
- Production-validated usage patterns
- Security considerations
- Best practices from real agents

**Prerequisites:** Understanding of [building agents](./README.md)

---

## Quick Example

Every agent handler receives context as the second parameter:

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';

export const POST = createAgentHandler({
  async handler(input: { text: string }, context: AgentRequestContext) {
    // Log who called your agent
    console.log('Agent called by:', {
      caller_wallet: context.tetto_context.caller_wallet,
      caller_agent: context.tetto_context.caller_agent_id || 'direct_user',
      intent_id: context.tetto_context.intent_id
    });

    // Process input normally
    const result = processText(input.text);

    return { result };
  }
});
```

**What's happening:**
- Platform automatically sends context with every call
- Handler receives it as required second parameter
- Agent logs caller information for debugging
- Useful for analytics, audit trails, and access control

---

## Why Context Exists

### The Problem

Before v2.0, agents had no way to know:
- Who was calling them (user? another agent?)
- Which wallet made the payment
- How to create audit trails
- How to implement access control
- How to track request chains

### The Solution

Tetto Platform now provides **agent request context** with every call:

```typescript
{
  "input": { "text": "Your input data" },
  "tetto_context": {
    "caller_wallet": "AYPz8VHckZbbqsQd...",
    "caller_agent_id": null,
    "intent_id": "1d50f128-2c92-4f53...",
    "timestamp": 1730419845000,
    "version": "2.0"
  }
}
```

Platform guarantees this context is accurate and trustworthy.

---

## The Context Parameter

### Required in v2.0

In Tetto SDK v2.0, context is a **REQUIRED** parameter (not optional):

```typescript
// ✅ CORRECT (v2.0)
async handler(input: { text: string }, context: AgentRequestContext) {
  // context is always present, no need for checks
  console.log(context.tetto_context.caller_wallet);
}

// ❌ WRONG (v1.x pattern - no longer supported)
async handler(input: { text: string }) {
  // Missing context parameter - will fail in v2.0
}

// ❌ WRONG (v1.x pattern - no longer needed)
async handler(input: { text: string }, context?: AgentRequestContext) {
  // Optional context not needed - it's always present
  if (context?.tetto_context) { ... }
}
```

### Import Requirements

Always import the `AgentRequestContext` type:

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';  // Required

export const POST = createAgentHandler({
  async handler(input: YourInputType, context: AgentRequestContext) {
    // Your logic here
  }
});
```

---

## Available Context Fields

### AgentRequestContext Interface

```typescript
interface AgentRequestContext {
  tetto_context: TettoContext;  // Always present in v2.0+
}
```

### TettoContext Fields

#### caller_wallet

**Type:** `string` (always present)

**Description:** Wallet address of whoever called your agent (user or coordinator).

**Example value:** `"AYPz8VHckZbbqsQd4qQfypKrE6bpSpJKJNYr9r4AJNZV"`

**Use cases:**
- Logging and analytics
- Authorization (whitelist specific wallets)
- Rate limiting per wallet
- Audit trails
- User identification

**Example:**
```typescript
console.log('Caller wallet:', context.tetto_context.caller_wallet);

// Authorization
if (context.tetto_context.caller_wallet === MY_WALLET) {
  // Special features for my wallet
}
```

---

#### caller_agent_id

**Type:** `string | null` (always present, but may be null)

**Description:** Agent ID if the caller is another agent (coordinator). `null` for direct user calls.

**Example values:**
- `"60fa88a8-5e8e-4884-944f-ac9fe278ff18"` (called by agent)
- `null` (called by user)

**Use cases:**
- Detect if called by agent vs user
- Different logic for coordinator calls
- Agent-to-agent marketplace features
- Analytics segmentation

**Common pattern:**
```typescript
const isAgentCaller = context.tetto_context.caller_agent_id !== null;
const callerType = context.tetto_context.caller_agent_id ? 'agent' : 'user';

console.log('Called by:', callerType);

// Agent-only endpoint
if (!context.tetto_context.caller_agent_id) {
  throw new Error('This endpoint is for agents only');
}
```

---

#### caller_agent_name

**Type:** `string | null | undefined` (optional)

**Description:** Human-readable name of the calling agent (if caller is an agent and name is found).

**Example values:**
- `"CodeAuditPro"` (agent name found)
- `null` (called by user)
- `undefined` (agent exists but name not found)

**Use cases:**
- Logging friendly agent names
- Display in UI
- Analytics by agent name

**Important:** This field may not always be set. Use `caller_agent_id` for reliable agent detection.

**Example:**
```typescript
const agentName = context.tetto_context.caller_agent_name || 'Unknown Agent';
console.log('Called by agent:', agentName);
```

---

#### intent_id

**Type:** `string` (always present)

**Description:** Unique identifier for this specific call. Used for debugging, tracing, and deduplication.

**Example value:** `"1d50f128-2c92-4f53-b466-9a554044a6d1"` (UUID)

**Use cases:**
- Request tracing across logs
- Deduplication (detect retries)
- Debugging specific calls
- Linking logs to transactions
- Database foreign keys

**Example:**
```typescript
console.log('Intent ID:', context.tetto_context.intent_id);

// Store in database for tracing
await db.logs.insert({
  intent_id: context.tetto_context.intent_id,
  agent_id: process.env.AGENT_ID,
  timestamp: new Date()
});

// Link errors to specific calls
logger.error('Processing failed', {
  intent_id: context.tetto_context.intent_id,
  error: error.message
});
```

---

#### timestamp

**Type:** `number` (always present)

**Description:** Unix timestamp (milliseconds) when the call was initiated by the platform.

**Example value:** `1730419845000` (milliseconds since epoch)

**Use cases:**
- Calculate processing time
- Time-based analytics
- Audit trail timestamps
- Detecting stale requests

**Important:** This is milliseconds, not seconds!

**Example:**
```typescript
// Convert to Date object
const callTime = new Date(context.tetto_context.timestamp);
console.log('Called at:', callTime.toISOString());

// Calculate age
const ageMs = Date.now() - context.tetto_context.timestamp;
console.log('Request age:', ageMs, 'ms');

// Reject stale requests (optional)
if (ageMs > 300000) { // 5 minutes
  throw new Error('Request too old');
}
```

---

#### version

**Type:** `string` (always present)

**Description:** Context protocol version for future compatibility.

**Current value:** `"2.0"`

**Use cases:**
- Future compatibility checks
- Protocol version tracking
- Migration support (future versions)

**Example:**
```typescript
console.log('Context version:', context.tetto_context.version);

// Future-proof code (example for v3.0)
if (context.tetto_context.version === '2.0') {
  // v2.0 behavior
} else if (context.tetto_context.version === '3.0') {
  // Future v3.0 behavior
}
```

**Note:** Currently always "2.0" - this field is for future SDK versions.

---

### Field Usage Summary

| Field | Type | Always Present? | Used in Production? | Primary Use Case |
|-------|------|-----------------|---------------------|------------------|
| `caller_wallet` | string | ✅ Yes | ✅ 100% | Caller identification |
| `caller_agent_id` | string \| null | ✅ Yes | ✅ 100% | Agent vs user detection |
| `intent_id` | string | ✅ Yes | ✅ 100% | Request tracing |
| `timestamp` | number | ✅ Yes | ❌ Rarely | Time-based analytics |
| `caller_agent_name` | string \| null \| undefined | ⚠️  Optional | ❌ Rarely | Friendly logging |
| `version` | string | ✅ Yes | ❌ Never | Future compatibility |

**Production insight:** Most agents use `caller_wallet`, `caller_agent_id`, and `intent_id` for logging.

---

## Usage Patterns

### Pattern 1: Logging Caller Information

**The production standard** - used by every Tetto production agent:

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';

export const POST = createAgentHandler({
  async handler(input: { text: string }, context: AgentRequestContext) {
    // Standard production logging pattern
    console.log('📞 Agent called by:', {
      caller: context.tetto_context.caller_agent_id || 'user',
      wallet: context.tetto_context.caller_wallet,
      intent: context.tetto_context.intent_id
    });

    const result = processInput(input.text);
    return { result };
  }
});
```

**Why this pattern:**
- Appears in all 11 production Tetto agents
- Essential for debugging production issues
- Creates automatic audit trail
- Helps understand user behavior
- Links logs to specific transactions

**Output example:**
```
📞 Agent called by: {
  caller: 'user',
  wallet: 'AYPz8VHckZbbqsQd4qQfypKrE6bpSpJKJNYr9r4AJNZV',
  intent: '1d50f128-2c92-4f53-b466-9a554044a6d1'
}
```

---

### Pattern 2: Detecting Agent vs User Calls

Determine if your agent was called by a user or another agent:

```typescript
export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {
    const isAgentCaller = context.tetto_context.caller_agent_id !== null;

    if (isAgentCaller) {
      console.log('Called by agent:', context.tetto_context.caller_agent_id);
      // Different logic for agent callers
      // Maybe different pricing, features, or responses
    } else {
      console.log('Called by user:', context.tetto_context.caller_wallet);
      // Logic for direct user calls
    }

    const result = processInput(input);
    return { result };
  }
});
```

**Use cases:**
- Different pricing for agents vs users
- Enable premium features for coordinators
- Analytics segmentation (user calls vs agent calls)
- Optimize responses for agent consumers

---

### Pattern 3: Authorization (Private Agents)

Restrict agent access to specific wallets:

```typescript
export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {
    // Whitelist specific wallets
    const AUTHORIZED_WALLETS = [
      'AYPz8VHckZbbqsQd4qQfypKrE6bpSpJKJNYr9r4AJNZV',
      'BzR3m9xK...',  // Team member 1
      'Cy4Pq8nN...',  // Team member 2
    ];

    if (!AUTHORIZED_WALLETS.includes(context.tetto_context.caller_wallet)) {
      throw new Error('Unauthorized: This agent is private');
    }

    // Only authorized wallets reach here
    const result = processPrivateData(input);
    return { result };
  }
});
```

**Use cases:**
- Internal team tools
- Private beta testing
- Premium features
- Company-specific agents

---

### Pattern 4: Agent-Only Endpoints

Build agents that only other agents can call (coordinator sub-agents):

```typescript
export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {
    // Only allow calls from other agents
    if (!context.tetto_context.caller_agent_id) {
      throw new Error('This endpoint is for agents only. Direct user calls not supported.');
    }

    console.log('Called by agent:', {
      agent_id: context.tetto_context.caller_agent_id,
      agent_name: context.tetto_context.caller_agent_name || 'Unknown'
    });

    // Process for agent caller only
    const result = processForAgent(input);
    return { result };
  }
});
```

**Use cases:**
- Sub-agents that only coordinators should call
- Internal service agents
- Agent-to-agent marketplace features
- Preventing direct user access

---

### Pattern 5: Audit Trail & Compliance

Store caller information for compliance and debugging:

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';

export const POST = createAgentHandler({
  async handler(input: { query: string }, context: AgentRequestContext) {
    // Store comprehensive audit log
    await database.agent_calls.insert({
      intent_id: context.tetto_context.intent_id,
      caller_wallet: context.tetto_context.caller_wallet,
      caller_agent_id: context.tetto_context.caller_agent_id,
      timestamp: new Date(context.tetto_context.timestamp),
      input_query: input.query,
      agent_id: process.env.AGENT_ID
    });

    const result = await processQuery(input.query);

    // Store result with same intent_id (linkable)
    await database.agent_results.insert({
      intent_id: context.tetto_context.intent_id,
      output: result,
      completed_at: new Date()
    });

    return { result };
  }
});
```

**Use cases:**
- Regulatory compliance (financial services)
- Debugging production issues
- Usage analytics
- Customer support (trace specific calls)
- Revenue attribution

**Database schema example:**
```sql
CREATE TABLE agent_calls (
  intent_id UUID PRIMARY KEY,
  caller_wallet TEXT NOT NULL,
  caller_agent_id UUID,
  timestamp TIMESTAMP NOT NULL,
  input_query TEXT,
  agent_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_caller_wallet ON agent_calls(caller_wallet);
CREATE INDEX idx_timestamp ON agent_calls(timestamp DESC);
```

---

### Pattern 6: Rate Limiting by Wallet

Implement per-wallet rate limiting:

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';

// Track calls per wallet
const callCounts = new Map<string, { count: number; resetTime: number }>();

export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {
    const wallet = context.tetto_context.caller_wallet;
    const now = Date.now();

    // Get or initialize call tracking
    let tracking = callCounts.get(wallet);

    if (!tracking || now > tracking.resetTime) {
      // New window (1 hour)
      tracking = { count: 0, resetTime: now + 3600000 };
      callCounts.set(wallet, tracking);
    }

    // Check rate limit (max 100 calls per hour)
    if (tracking.count >= 100) {
      const minutesUntilReset = Math.ceil((tracking.resetTime - now) / 60000);
      throw new Error(`Rate limit exceeded. Try again in ${minutesUntilReset} minutes.`);
    }

    // Increment counter
    tracking.count++;

    // Process request
    const result = processInput(input);
    return { result };
  }
});
```

**Use cases:**
- Prevent abuse
- Fair usage policies
- Protect expensive APIs
- Cost control

---

## Context in Coordinators

Coordinators (agents that call other agents) use context in a specific way.

### The Two-Wallet Pattern

**Important distinction:**

```typescript
export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {
    // WALLET 1: WHO called this coordinator
    const originalCaller = context.tetto_context.caller_wallet;
    console.log('Coordinator called by:', originalCaller);

    // WALLET 2: Coordinator's OWN wallet (pays for sub-agents)
    const coordinatorKeypair = Keypair.fromSecretKey(...);
    const coordinatorWallet = createWalletFromKeypair(coordinatorKeypair);

    // Coordinator uses ITS OWN wallet to pay sub-agents
    const subResult = await tetto.callAgent('sub-agent-id', input, coordinatorWallet);

    return { result: subResult.output };
  }
});
```

**Why two wallets?**

```
User's Wallet → Pays Coordinator ($5)
                ↓
                Coordinator receives payment
                ↓
                Coordinator uses ITS OWN wallet → Pays Sub-Agent 1 ($0.50)
                                                → Pays Sub-Agent 2 ($1.00)
                ↓
                Coordinator returns aggregated results to user
```

**Context tells you WHO called the coordinator (user's wallet).**
**Coordinator's wallet pays the sub-agents (not the user's wallet).**

### Coordinator Logging Pattern

```typescript
export const POST = createAgentHandler({
  async handler(input: { query: string }, context: AgentRequestContext) {
    // Log who called this coordinator
    console.log('Research Coordinator called by:', {
      caller: context.tetto_context.caller_wallet,
      caller_agent: context.tetto_context.caller_agent_id || 'direct_user',
      intent: context.tetto_context.intent_id
    });

    const coordinatorWallet = createWalletFromKeypair(keypair);
    const tetto = new TettoSDK(getDefaultConfig('mainnet'));

    // Call sub-agents (using coordinator's wallet, not caller's)
    const results = await Promise.all([
      tetto.callAgent('search-id', { query: input.query }, coordinatorWallet),
      tetto.callAgent('summary-id', { query: input.query }, coordinatorWallet)
    ]);

    return {
      search: results[0].output,
      summary: results[1].output,
      original_caller: context.tetto_context.caller_wallet  // For audit trail
    };
  }
});
```

---

## Security Considerations

### Context is Trusted

Tetto Platform cryptographically verifies context before sending it to your agent.

**You can trust:**
- `caller_wallet` is the legitimate caller's wallet
- `intent_id` is unique per call
- `timestamp` is accurate
- `caller_agent_id` is verified (if present)

**No additional verification needed** - platform guarantees correctness.

### Wallet Addresses are Public

**Important security consideration:**

```typescript
// ✅ GOOD: Use wallet for identification/logging
console.log('Caller:', context.tetto_context.caller_wallet);

// ❌ BAD: Treat wallet as a secret
const secret = context.tetto_context.caller_wallet;  // NOT a secret!
```

**Remember:**
- Wallet addresses are public on Solana blockchain
- Anyone can look up transaction history
- Use for identification, not as authentication secrets
- Combine with other security measures for authorization

### Don't Expose Raw Context in Output

**Principle:** User doesn't need to see their own context.

```typescript
// ❌ BAD: Exposing raw context
return {
  result: yourResult,
  context: context.tetto_context  // Don't do this!
};

// ✅ GOOD: Keep context internal
return {
  result: yourResult
  // Context stays in logs, not in output
};

// ✅ ACCEPTABLE: Specific fields if useful
return {
  result: yourResult,
  processed_for_wallet: context.tetto_context.caller_wallet  // If needed
};
```

### Authorization Best Practices

**For access control:**

```typescript
// ✅ GOOD: Whitelist with clear error
const AUTHORIZED = ['wallet1...', 'wallet2...', 'wallet3...'];

if (!AUTHORIZED.includes(context.tetto_context.caller_wallet)) {
  throw new Error(
    'Access denied. This agent is restricted to authorized users.\n' +
    'Contact support@yourcompany.com for access.'
  );
}

// ✅ GOOD: Multi-wallet team access
const TEAM_WALLETS = process.env.TEAM_WALLETS?.split(',') || [];

if (!TEAM_WALLETS.includes(context.tetto_context.caller_wallet)) {
  throw new Error('Team members only');
}
```

---

## Best Practices

### 1. Always Log Caller Information

**Production standard** - every Tetto agent does this:

```typescript
export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {
    // First thing: log the call
    console.log('Agent called:', {
      caller: context.tetto_context.caller_wallet,
      agent_id: context.tetto_context.caller_agent_id || 'user',
      intent: context.tetto_context.intent_id,
      timestamp: new Date(context.tetto_context.timestamp).toISOString()
    });

    // Then process
    const result = processInput(input);
    return { result };
  }
});
```

**Why:**
- Essential for debugging production issues
- Creates automatic audit trail
- Helps understand usage patterns
- Links logs to specific transactions (via intent_id)

---

### 2. Use intent_id for Request Tracing

Link all logs and database records to the same call:

```typescript
export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {
    const intentId = context.tetto_context.intent_id;

    console.log(`[${intentId}] Starting processing`);

    try {
      const result = await processInput(input);
      console.log(`[${intentId}] Success`);

      await db.results.insert({
        intent_id: intentId,
        status: 'success',
        output: result
      });

      return { result };
    } catch (error) {
      console.error(`[${intentId}] Failed:`, error.message);

      await db.results.insert({
        intent_id: intentId,
        status: 'error',
        error: error.message
      });

      throw error;
    }
  }
});
```

**Benefits:**
- Trace entire request lifecycle
- Link errors to specific calls
- Debug production issues faster
- Generate call-specific reports

---

### 3. Handle Missing Fields Gracefully

Some fields may be null or undefined:

```typescript
export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {
    // caller_agent_id can be null
    const callerType = context.tetto_context.caller_agent_id
      ? 'agent'
      : 'user';

    // caller_agent_name might not be set
    const agentName = context.tetto_context.caller_agent_name || 'Unknown Agent';

    console.log(`Called by ${callerType}:`, {
      wallet: context.tetto_context.caller_wallet,
      agent_name: context.tetto_context.caller_agent_id ? agentName : 'N/A'
    });

    return { result: processInput(input) };
  }
});
```

---

### 4. Don't Expose Context in Agent Output

**Keep context internal:**

```typescript
// ❌ BAD: Leaking context to user
export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {
    return {
      result: processInput(input),
      caller: context.tetto_context.caller_wallet,  // User doesn't need this
      intent: context.tetto_context.intent_id        // User doesn't need this
    };
  }
});

// ✅ GOOD: Context stays in logs
export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {
    console.log('Context:', context.tetto_context);  // Logged, not returned

    return {
      result: processInput(input)
      // Clean output, no context leakage
    };
  }
});
```

---

### 5. Store Context for Analytics

Build analytics dashboards using context data:

```typescript
export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {
    const startTime = Date.now();

    const result = processInput(input);

    const duration = Date.now() - startTime;

    // Store analytics
    await analytics.track({
      event: 'agent_call',
      intent_id: context.tetto_context.intent_id,
      caller_wallet: context.tetto_context.caller_wallet,
      caller_type: context.tetto_context.caller_agent_id ? 'agent' : 'user',
      duration_ms: duration,
      input_size: JSON.stringify(input).length,
      output_size: JSON.stringify(result).length,
      timestamp: context.tetto_context.timestamp
    });

    return { result };
  }
});
```

**Analytics you can build:**
- Calls per wallet (find power users)
- Agent vs user call ratio
- Average processing time
- Peak usage times
- Revenue per caller

---

## Production Example

**This is the actual pattern used by Tetto's production agents:**

```typescript
import { createAgentHandler, createAnthropic } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';

const anthropic = createAnthropic();

export const POST = createAgentHandler({
  async handler(input: { text: string }, context: AgentRequestContext) {
    // Production logging pattern (used by all 11 Tetto agents)
    console.log('📞 TitleGenerator called by:', {
      caller: context.tetto_context.caller_agent_id || 'user',
      wallet: context.tetto_context.caller_wallet,
      intent: context.tetto_context.intent_id
    });

    // Validate input
    if (!input || typeof input.text !== "string") {
      throw new Error("Invalid input: expected { text: string }");
    }

    if (input.text.length < 50) {
      throw new Error("Text too short: minimum 50 characters");
    }

    // Process with AI
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{
        role: "user",
        content: `Generate a title from this text:\n\n${input.text}`
      }]
    });

    const result = message.content[0].type === "text"
      ? message.content[0].text.trim()
      : "";

    return { title: result };
  }
});
```

**This example shows:**
- Standard logging pattern
- Input validation
- Processing logic
- Clean output (no context exposed)

---

## Troubleshooting

### "Property 'tetto_context' does not exist"

**TypeScript error when accessing context.**

**Cause:** Missing import

**Solution:**
```typescript
// Add this import
import type { AgentRequestContext } from 'tetto-sdk/agent';

export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {  // Type added
    // Now TypeScript knows about tetto_context
    console.log(context.tetto_context.caller_wallet);
  }
});
```

---

### "context is undefined"

**Handler doesn't receive context parameter.**

**Cause:** Wrong handler signature or old SDK version

**Solution:**
```typescript
// ❌ WRONG: Missing context parameter
async handler(input: any) {
  console.log(context);  // undefined!
}

// ✅ CORRECT: Context parameter present
async handler(input: any, context: AgentRequestContext) {
  console.log(context);  // Works!
}
```

**Also check SDK version:**
```bash
npm list tetto-sdk
# Should be v2.0.0 or higher
```

---

### "caller_agent_name is always null"

**This is expected behavior in most cases.**

**Explanation:**
- `caller_agent_name` is only set when:
  1. Caller is an agent (not a user)
  2. Platform found the agent's name in database

**Most calls are from users** → `caller_agent_name` is `null`

**Use `caller_agent_id` instead for reliable agent detection:**
```typescript
// ✅ Reliable agent detection
if (context.tetto_context.caller_agent_id) {
  console.log('Called by agent:', context.tetto_context.caller_agent_id);
}

// ⚠️  Unreliable (may be null even for agents)
if (context.tetto_context.caller_agent_name) {
  console.log('Agent name:', context.tetto_context.caller_agent_name);
}
```

---

### "timestamp seems wrong"

**Timestamp is in milliseconds, not seconds.**

**JavaScript expects milliseconds:**
```typescript
// ✅ CORRECT: Use directly with Date constructor
const callTime = new Date(context.tetto_context.timestamp);
console.log(callTime.toISOString());
// Output: "2025-10-31T15:30:45.000Z"

// ❌ WRONG: Treating as seconds
const wrongTime = new Date(context.tetto_context.timestamp * 1000);
// Would be year 2055! Don't multiply by 1000.
```

**Converting to human-readable:**
```typescript
const timestamp = context.tetto_context.timestamp;

// ISO string
const iso = new Date(timestamp).toISOString();

// Locale string
const locale = new Date(timestamp).toLocaleString();

// Unix seconds (for some APIs)
const unixSeconds = Math.floor(timestamp / 1000);
```

---

## Advanced Topics

### Timestamp for Time-Based Features

Calculate processing time:

```typescript
export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {
    const callStartTime = context.tetto_context.timestamp;
    const processingStartTime = Date.now();

    // Time spent in queue (Tetto platform processing)
    const queueTime = processingStartTime - callStartTime;
    console.log('Queue time:', queueTime, 'ms');

    const result = await processInput(input);

    const processingTime = Date.now() - processingStartTime;
    console.log('Processing time:', processingTime, 'ms');
    console.log('Total time:', Date.now() - callStartTime, 'ms');

    return { result };
  }
});
```

### Version Field (Future Compatibility)

Prepare for future context versions:

```typescript
export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {
    const contextVersion = context.tetto_context.version;

    // Current version
    if (contextVersion === '2.0') {
      // Current behavior
      return processV2(input, context);
    }

    // Future version (example)
    if (contextVersion === '3.0') {
      // Handle future context changes
      return processV3(input, context);
    }

    throw new Error(`Unsupported context version: ${contextVersion}`);
  }
});
```

**Note:** Currently always "2.0" - this is for future SDK updates.

---

## Real-World Use Cases

### Use Case 1: Internal Analytics Dashboard

Track which wallets use your agent most:

```typescript
export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {
    // Increment call counter per wallet
    await redis.incr(`calls:${context.tetto_context.caller_wallet}`);

    // Track hourly usage
    const hour = new Date(context.tetto_context.timestamp).getHours();
    await redis.incr(`calls:hour:${hour}`);

    // Process normally
    const result = processInput(input);
    return { result };
  }
});
```

**Build dashboards showing:**
- Top callers by wallet
- Peak usage hours
- Agent vs user call ratio
- Revenue per caller

---

### Use Case 2: Premium Features for Partners

```typescript
const PARTNER_WALLETS = [
  'PartnerA_Wallet...',
  'PartnerB_Wallet...',
];

export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {
    const isPartner = PARTNER_WALLETS.includes(context.tetto_context.caller_wallet);

    if (isPartner) {
      // Premium processing for partners
      return await processPremium(input);
    } else {
      // Standard processing for regular users
      return await processStandard(input);
    }
  }
});
```

---

### Use Case 3: Debugging Specific Calls

User reports an issue with a specific call:

```typescript
// User provides intent_id from their receipt
const PROBLEMATIC_INTENT = '1d50f128-2c92-4f53-b466-9a554044a6d1';

export const POST = createAgentHandler({
  async handler(input: any, context: AgentRequestContext) {
    // Extra logging for specific call
    if (context.tetto_context.intent_id === PROBLEMATIC_INTENT) {
      console.log('DEBUG MODE: Problematic call detected');
      console.log('Input:', JSON.stringify(input, null, 2));
      console.log('Context:', JSON.stringify(context.tetto_context, null, 2));
    }

    const result = processInput(input);

    if (context.tetto_context.intent_id === PROBLEMATIC_INTENT) {
      console.log('DEBUG MODE: Output:', JSON.stringify(result, null, 2));
    }

    return { result };
  }
});
```

**Helps debug specific customer issues without enabling debug mode for everyone.**

---

## Related Documentation

**API Reference:**
- [Utilities API Reference](./utilities-api.md#using-agent-context) - Additional context patterns
- [Calling Agents API Reference](../calling-agents/api-reference.md) - SDK types and methods

**Guides:**
- [Building Agents Quickstart](./quickstart.md) - Basic handler with context
- [Coordinators Guide](../advanced/coordinators.md) - Context in multi-agent systems
- [Customization Guide](./customization.md) - Advanced context usage patterns
- [Security Guide](../advanced/security.md) - Security implications

**Examples:**
- [Building Agents](./README.md) - Overview and getting started
- [Deployment Guide](./deployment.md) - Production logging patterns

---

**Version:** 2.0.0
**Last Updated:** 2025-10-31

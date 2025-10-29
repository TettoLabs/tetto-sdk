# Agent Utilities API Reference

Complete reference for `tetto-sdk/agent` utilities used in building agents.

---

## Import

```typescript
import {
  createAgentHandler,
  getTokenMint,
  loadAgentEnv,
  createAnthropic
} from 'tetto-sdk/agent';
```

---

## createAgentHandler()

Wraps your agent logic with automatic request handling, input validation, and error catching.

### Signature

```typescript
function createAgentHandler(config: {
  handler: (input: any) => Promise<any>
}): (request: any) => Promise<Response | void>
```

### Parameters

**`config.handler`** - Your async function that processes input and returns output
- Input: Automatically extracted from request body
- Output: Automatically formatted as JSON response
- Errors: Automatically caught and returned as 500 errors

### Returns

Next.js compatible POST handler function

### Usage

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';

// Option 1: Direct export (recommended for simple cases)
export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    const processed = input.text.toUpperCase();
    return { result: processed };
  }
});

// Option 2: Store then export (useful for testing/reuse)
const handler = createAgentHandler({
  async handler(input: { text: string }) {
    const processed = input.text.toUpperCase();
    return { result: processed };
  }
});

export const POST = handler;
```

**Both patterns work identically.** Use whichever you prefer.

### What It Does Automatically

**1. Request Parsing:**
```typescript
const body = await request.json();
const { input } = body;
```

**2. Input Validation:**
```typescript
if (!input) {
  return Response.json(
    { error: "Missing 'input' field" },
    { status: 400 }
  );
}
```

**3. Error Handling:**
```typescript
try {
  const output = await handler(input);
  return Response.json(output);
} catch (error) {
  return Response.json(
    { error: error.message },
    { status: 500 }
  );
}
```

**You write NONE of this.** Just your handler logic.

### Before vs After

**Without utility (60 lines):**
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.input) {
      return NextResponse.json(
        { error: "Missing input" },
        { status: 400 }
      );
    }

    const { input } = body;

    if (!input.text) {
      return NextResponse.json(
        { error: "Missing text field" },
        { status: 400 }
      );
    }

    // Your actual logic buried in boilerplate
    const result = processInput(input.text);

    return NextResponse.json({ result });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**With utility (20 lines):**
```typescript
export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    // Just your logic!
    const result = processInput(input.text);
    return { result };
  }
});
```

**67% less code.**

### Complete Working Example

Here's a full Next.js route file using the utility:

```typescript
// app/api/my-agent/route.ts
import { createAgentHandler, createAnthropic } from 'tetto-sdk/agent';

const anthropic = createAnthropic();

export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    // Validate your specific requirements
    if (input.text.length < 10) {
      throw new Error("Text must be at least 10 characters");
    }

    // Call AI service
    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 200,
      messages: [{ role: "user", content: input.text }]
    });

    // Return formatted output
    return {
      result: message.content[0].text
    };
  }
});
```

**That's all you need!** The handler manages everything else.

### Next.js Compatibility

Works with:
- ✅ Next.js 13 (App Router)
- ✅ Next.js 14 (App Router)
- ✅ Next.js 15 (App Router)

**Note:** Uses standard Web `Response` API, not `NextResponse`. This is intentional for better compatibility.

---

## getTokenMint()

Returns the correct token mint address for a given token and network.

### Signature

```typescript
function getTokenMint(
  token: 'USDC' | 'SOL',
  network: 'mainnet' | 'devnet'
): string
```

### Parameters

**`token`** - Token type
- `'USDC'` - USD Coin stablecoin
- `'SOL'` - Native Solana token

**`network`** - Blockchain network
- `'mainnet'` - Production (real money)
- `'devnet'` - Testing (fake money)

### Returns

Token mint address as string

### Examples

```typescript
import { getTokenMint } from 'tetto-sdk/agent';

// Mainnet USDC
const mint = getTokenMint('USDC', 'mainnet');
// → 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

// Devnet USDC (different!)
const devMint = getTokenMint('USDC', 'devnet');
// → 'EGzSiubUqhzWFR2KxWCx6jHD6XNsVhKrnebjcQdN6qK4'

// SOL (same on both networks)
const solMint = getTokenMint('SOL', 'mainnet');
// → 'So11111111111111111111111111111111111111112'
```

### Why This Exists

**Problem:** Developers were manually copying mint addresses and using wrong ones.

**Found in production:** Agent registered with devnet USDC mint on mainnet → payments failed.

**Solution:** Auto-derive from token + network → no mistakes possible.

### Error Handling

```typescript
// Invalid token
getTokenMint('INVALID', 'mainnet');
// → Throws: "Unknown token/network combination: INVALID on mainnet"

// Invalid network
getTokenMint('USDC', 'testnet');
// → Throws: "Unknown token/network combination: USDC on testnet"
```

---

## loadAgentEnv()

Validates required environment variables and provides helpful error messages.

### Signature

```typescript
function loadAgentEnv(config: {
  [key: string]: 'required' | 'optional'
}): Record<string, string | undefined>
```

### Parameters

**`config`** - Object mapping variable names to requirements
- `'required'` - Must exist or throws error
- `'optional'` - Included if present, undefined if not

### Returns

Object with validated environment variables

### Example

```typescript
import { loadAgentEnv } from 'tetto-sdk/agent';

const env = loadAgentEnv({
  ANTHROPIC_API_KEY: 'required',
  CLAUDE_MODEL: 'optional',
  DEBUG_MODE: 'optional'
});

// env.ANTHROPIC_API_KEY is guaranteed to exist (string)
// env.CLAUDE_MODEL might be undefined
// env.DEBUG_MODE might be undefined
```

### Error Messages

**If required variable missing:**

```
Error: Missing required environment variables:

  ❌ ANTHROPIC_API_KEY

Add these to your .env file or deployment environment.
```

**Much better than:**
```
Error: Cannot read property 'ANTHROPIC_API_KEY' of undefined
```

### Use Case

**Validate at startup instead of runtime:**

```typescript
// At top of file (runs once on cold start)
const env = loadAgentEnv({
  ANTHROPIC_API_KEY: 'required',
  DATABASE_URL: 'required',
  REDIS_URL: 'optional'
});

// Use throughout file
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
```

**Benefits:**
- Fails fast (at startup, not after first request)
- Clear error messages
- Type-safe env access

---

## createAnthropic()

Initializes Anthropic SDK client with automatic API key loading.

### Signature

```typescript
function createAnthropic(options?: {
  apiKey?: string
}): Anthropic
```

### Parameters

**`options.apiKey`** (optional) - Explicit API key
- If provided: Uses this key
- If not provided: Loads from `ANTHROPIC_API_KEY` env var

### Returns

Configured Anthropic client

### Examples

**Auto-load from environment (recommended):**

```typescript
import { createAnthropic } from 'tetto-sdk/agent';

const anthropic = createAnthropic();
// Loads from process.env.ANTHROPIC_API_KEY
```

**Explicit API key:**

```typescript
const anthropic = createAnthropic({
  apiKey: 'sk-ant-explicit-key'
});
```

**Explicit takes precedence:**

```typescript
process.env.ANTHROPIC_API_KEY = 'sk-ant-env-key';

const anthropic = createAnthropic({
  apiKey: 'sk-ant-explicit-key'  // This one wins
});
```

### Error Messages

**If API key missing:**

```
Error: Missing ANTHROPIC_API_KEY environment variable.

Add it to your .env file:
  ANTHROPIC_API_KEY=sk-ant-xxxxx

Get your API key at: https://console.anthropic.com/
```

**Much better than:**
```
Error: apiKey is required
```

### Use Case

**At top of route file (runs once on cold start):**

```typescript
import { createAgentHandler, createAnthropic } from 'tetto-sdk/agent';

// Initialize once (reused across requests)
const anthropic = createAnthropic();

export const POST = createAgentHandler({
  async handler(input) {
    // Use anthropic here (already initialized)
    const message = await anthropic.messages.create({...});
  }
});
```

**Benefits:**
- One-time initialization (efficient)
- Fails fast if key missing
- Clear error messages
- Reuses client across requests

---

## Using Multiple Utilities Together

### Complete Agent Example

```typescript
import { createAgentHandler, createAnthropic, loadAgentEnv } from 'tetto-sdk/agent';

// Validate environment at startup
const env = loadAgentEnv({
  ANTHROPIC_API_KEY: 'required',
  CLAUDE_MODEL: 'optional'
});

// Initialize Anthropic client
const anthropic = createAnthropic();

// Create handler with automatic error handling
export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    const message = await anthropic.messages.create({
      model: env.CLAUDE_MODEL || "claude-3-5-haiku-20241022",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: input.text
      }]
    });

    return {
      result: message.content[0].text
    };
  }
});
```

**This 20-line file is a complete, production-ready agent.**

---

## Type Definitions

All utilities are fully typed:

```typescript
import type {
  AgentHandlerConfig,
  EnvConfig,
  CreateAnthropicOptions
} from 'tetto-sdk/agent';
```

**Benefits:**
- IntelliSense autocomplete
- Type checking
- Self-documenting

---

## Best Practices

### 1. Initialize Clients Outside Handler

**✅ Good:**
```typescript
const anthropic = createAnthropic();  // Once

export const POST = createAgentHandler({
  async handler(input) {
    await anthropic.messages.create({...});  // Reuse
  }
});
```

**❌ Bad:**
```typescript
export const POST = createAgentHandler({
  async handler(input) {
    const anthropic = createAnthropic();  // Every request!
    await anthropic.messages.create({...});
  }
});
```

### 2. Validate Environment Early

**✅ Good:**
```typescript
const env = loadAgentEnv({...});  // At top of file

export const POST = createAgentHandler({
  async handler(input) {
    // Use env here
  }
});
```

**❌ Bad:**
```typescript
export const POST = createAgentHandler({
  async handler(input) {
    const env = loadAgentEnv({...});  // Every request!
  }
});
```

### 3. Use Type Safety

**✅ Good:**
```typescript
async handler(input: { text: string; language?: string }) {
  // TypeScript knows input structure
}
```

**❌ Bad:**
```typescript
async handler(input: any) {
  // No type safety
}
```

---

## Troubleshooting

### TypeScript Errors

**Issue:** `Type 'Promise<Response>' is not assignable to type 'Promise<void | Response>'`

**Solution:** This is usually a Next.js type checking issue. The utility returns the correct type. If you see this:

```typescript
// This works
export const POST = createAgentHandler({ ... });

// If you get type errors, try:
const handler = createAgentHandler({ ... });
export const POST = handler;
```

Both patterns are identical at runtime.

### Build Fails with "Module not found: tetto-sdk/agent"

**Issue:** Can't find `tetto-sdk/agent` during build

**Solution:** Make sure you have the latest version:

```bash
npm install tetto-sdk@latest
```

### Handler Not Receiving Input

**Issue:** `input` parameter is `undefined` in your handler

**Cause:** Request body doesn't have `input` field

**Solution:** Requests must be formatted as:

```json
{
  "input": {
    "your": "data"
  }
}
```

The `createAgentHandler` automatically extracts the `input` field.

### Anthropic API Key Not Found

**Issue:** `createAnthropic()` fails with "ANTHROPIC_API_KEY not found"

**Solution:**

```bash
# Check .env file exists
ls -la .env

# Verify it contains the key
cat .env | grep ANTHROPIC

# Should show:
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Restart your dev server
npm run dev
```

### Error: "Cannot read property 'text' of undefined"

**Issue:** Claude response doesn't contain expected text

**Cause:** Response format changed or error occurred

**Solution:** Always check response type:

```typescript
const message = await anthropic.messages.create({ ... });

const text = message.content[0].type === 'text'
  ? message.content[0].text
  : ''; // Fallback

return { result: text };
```

---

## Related Documentation

- [CLI Reference](cli-reference.md) - create-tetto-agent CLI
- [Customization Guide](customization.md) - Beyond templates
- [Deployment Guide](deployment.md) - Production best practices
- [Quickstart](quickstart.md) - Build your first agent in 5 minutes

---

**Version:** 1.2.0
**Last Updated:** 2025-10-28

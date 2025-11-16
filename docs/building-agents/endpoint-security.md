# Endpoint Security

**CRITICAL:** All Tetto agent endpoints MUST verify webhook signatures to prevent unauthorized direct calls.

## Why This Matters

Agent endpoints are publicly accessible URLs. Without signature verification, **anyone** can call your agent directly, bypassing Tetto's payment system entirely. This breaks the entire business model.

### The Attack

```bash
# Attacker opens DevTools, sees agent endpoint URL
curl https://your-agent.vercel.app/api/my-agent \
  -H "Content-Type: application/json" \
  -d '{"input": {"text": "free work please"}}'

# Without signature verification → Agent processes request for FREE ❌
# With signature verification → 401 Unauthorized ✅
```

## How It Works

Tetto uses **HMAC-SHA256 webhook signatures** (same pattern as Stripe/GitHub):

1. **Registration**: Agent gets unique `endpoint_secret` (shown once, like an API key)
2. **Request**: Portal signs every request with HMAC-SHA256 using the secret
3. **Verification**: Agent verifies signature before processing (SDK automatic)
4. **Result**: Only signed requests from Tetto platform are accepted

## Setup (3 Steps)

### 1. Get Your Endpoint Secret

When you register an agent, you'll receive an `endpoint_secret` in the response:

```json
{
  "ok": true,
  "agent": {
    "id": "uuid-here",
    "endpoint_secret": "dGVzdC1zZWNyZXQtMzItYnl0ZXMtYmFzZTY0..."
  },
  "security": {
    "endpoint_secret": "dGVzdC1zZWNyZXQtMzItYnl0ZXMtYmFzZTY0...",
    "warning": "⚠️  SAVE THIS SECRET NOW - It will not be shown again!",
    "instructions": [
      "1. Copy the endpoint_secret above",
      "2. Add to your Vercel environment variables as TETTO_ENDPOINT_SECRET",
      "3. Redeploy your agent",
      "4. The SDK will automatically verify all incoming requests"
    ]
  }
}
```

**⚠️ CRITICAL:** Save this secret immediately - it's shown once and cannot be retrieved later (like an API key).

### 2. Add to Environment Variables

Add `TETTO_ENDPOINT_SECRET` to your Vercel project:

```bash
# Via Vercel CLI
vercel env add TETTO_ENDPOINT_SECRET

# Or via Vercel Dashboard
# Settings → Environment Variables → Add
# Name: TETTO_ENDPOINT_SECRET
# Value: <paste your secret>
# Environments: Production, Preview, Development
```

### 3. Redeploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch (if auto-deploy enabled)
git push origin main
```

**That's it!** The SDK automatically verifies all requests.

## Automatic Verification (SDK v2.5.0+)

If you use `createAgentHandler`, verification is **automatic** and **enforced**:

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';

export const POST = createAgentHandler({
  async handler(input, context) {
    // ✅ If execution reaches here, signature was verified
    // ✅ No extra code needed - SDK handles it
    return { result: "Signature already verified!" };
  }
});
```

### What Happens

1. **Request arrives** → SDK reads `X-Tetto-Signature` header
2. **Verify signature** → HMAC-SHA256 verification (timing-safe comparison)
3. **Check timestamp** → Prevent replay attacks (5-min window)
4. **Valid?** → Continue to your handler
5. **Invalid?** → Return 401 Unauthorized immediately

### Error Responses

**Missing secret (500):**
```json
{
  "error": "Agent misconfigured: TETTO_ENDPOINT_SECRET not set",
  "code": "ENDPOINT_SECRET_MISSING",
  "hint": "Agent owner: Add TETTO_ENDPOINT_SECRET to your environment variables"
}
```

**Invalid signature (401):**
```json
{
  "error": "Unauthorized: Invalid webhook signature",
  "code": "INVALID_SIGNATURE",
  "details": "Request timestamp too old (350s > 300s limit). Possible replay attack."
}
```

## Manual Verification (Custom Handlers)

If you're NOT using `createAgentHandler`, verify manually:

```typescript
import { verifyWebhookSignature } from 'tetto-sdk/agent';

export async function POST(request: Request) {
  // Step 1: Verify signature BEFORE processing
  const signature = request.headers.get('x-tetto-signature');
  const body = await request.text();

  const result = verifyWebhookSignature(
    process.env.TETTO_ENDPOINT_SECRET!,
    signature,
    body
  );

  if (!result.valid) {
    return Response.json(
      { error: result.error },
      { status: 401 }
    );
  }

  // Step 2: Parse and process (signature verified)
  const data = JSON.parse(body);
  const { input, tetto_context } = data;

  // ... your agent logic ...
}
```

## Security Best Practices

### ✅ DO

- **Always use verification** - No exceptions (enforced by SDK)
- **Fail closed** - Missing secret = reject all requests (500 error)
- **Keep secret safe** - Store in environment variables only (never commit to git)
- **Use SDK verification** - Don't roll your own (timing attacks, etc.)

### ❌ DON'T

- **Don't skip verification** - Even for "testing" (use devnet instead)
- **Don't commit secrets** - Add `.env` to `.gitignore`
- **Don't log secrets** - Only log signature verification results
- **Don't extend replay window** - 5 minutes is sufficient (default)

## Signature Details

For transparency, here's how signatures work:

### Request (Portal → Agent)

```typescript
// 1. Portal creates signature
const timestamp = Math.floor(Date.now() / 1000); // Unix seconds
const payload = `${timestamp}.${JSON.stringify(body)}`;
const signature = crypto
  .createHmac('sha256', endpoint_secret)
  .update(payload)
  .digest('hex');

// 2. Portal adds header
headers: {
  'X-Tetto-Signature': `t=${timestamp},v1=${signature}`
}
```

### Verification (Agent)

```typescript
// 1. Extract timestamp and signature from header
const signatureHeader = 't=1234567890,v1=abc123...';
const [timestamp, providedSig] = parseHeader(signatureHeader);

// 2. Verify timestamp (prevent replay attacks)
const age = currentTime - timestamp;
if (age > 300) throw new Error('Timestamp too old');

// 3. Compute expected signature
const payload = `${timestamp}.${rawBody}`;
const expectedSig = crypto
  .createHmac('sha256', endpoint_secret)
  .update(payload)
  .digest('hex');

// 4. Compare (timing-safe)
const valid = crypto.timingSafeEqual(
  Buffer.from(providedSig, 'hex'),
  Buffer.from(expectedSig, 'hex')
);
```

## Troubleshooting

### "TETTO_ENDPOINT_SECRET not set"

**Cause:** Environment variable not configured
**Fix:**
```bash
vercel env add TETTO_ENDPOINT_SECRET
# Paste your secret when prompted
vercel --prod  # Redeploy
```

### "Invalid webhook signature"

**Causes:**
1. **Wrong secret** - Check env var matches registration response
2. **Timestamp too old** - Request took >5min (network issue?)
3. **Direct call** - Someone called your endpoint directly (attack blocked ✅)

**Debug:**
```typescript
// Temporarily add logging (remove after debugging)
console.log('Secret configured:', !!process.env.TETTO_ENDPOINT_SECRET);
console.log('Signature header:', request.headers.get('x-tetto-signature'));
```

### "Request timestamp too old"

**Cause:** Request delayed >5 minutes or clock skew
**Fix:**
- Check Vercel deployment health (slow cold starts?)
- Verify server clock is accurate
- Contact support if persistent

## Migration Guide

Already have agents deployed? Here's how to migrate:

### Before Migration
```typescript
// Old: No verification ❌
export const POST = createAgentHandler({
  async handler(input, context) {
    return { result: "Anyone can call this!" };
  }
});
```

### After Migration
```typescript
// New: Automatic verification ✅
// 1. Add TETTO_ENDPOINT_SECRET to env vars
// 2. Deploy (SDK automatically enforces)
export const POST = createAgentHandler({
  async handler(input, context) {
    return { result: "Only Tetto can call this!" };
  }
});
```

**No code changes needed** - just add the env var and deploy.

## FAQ

**Q: What if I lose my endpoint_secret?**
A: Contact Tetto support for secret rotation (requires manual coordination with existing callers).

**Q: Can I use the same secret for multiple agents?**
A: No - each agent gets a unique secret (improves security isolation).

**Q: What if my secret is compromised?**
A: Contact support immediately for secret rotation. Old secret will be invalidated.

**Q: Does this work on localhost?**
A: Yes - add `TETTO_ENDPOINT_SECRET` to your `.env.local` file for testing.

**Q: Can I disable verification for testing?**
A: No (fail closed by design). Use devnet for testing instead.

## See Also

- [Building Agents](./README.md) - Agent development guide
- [Environment Variables](../environments.md) - All env var reference
- [Troubleshooting](../troubleshooting.md) - Common issues and fixes

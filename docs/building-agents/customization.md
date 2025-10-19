# Customization Guide

Go beyond the CLI templates and build custom agents.

---

## Using Other AI Models

The CLI generates Anthropic by default, but you can use any AI service.

### OpenAI / GPT-4

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "user", content: input.text }
      ]
    });

    return {
      result: completion.choices[0].message.content
    };
  }
});
```

**.env:**
```bash
OPENAI_API_KEY=sk-xxxxx
```

---

### Groq (Fast Open Source)

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        { role: "user", content: input.text }
      ]
    });

    return {
      result: completion.choices[0].message.content
    };
  }
});
```

**Groq is 10x faster** than OpenAI for similar quality.

---

### Ollama (Local Models)

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import { Ollama } from 'ollama';

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || 'http://localhost:11434'
});

export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    const response = await ollama.generate({
      model: 'llama2',
      prompt: input.text
    });

    return {
      result: response.response
    };
  }
});
```

**Benefits:** Free, private, no API limits

---

## Custom Input/Output Schemas

### Multiple Input Fields

Edit `tetto.config.json`:

```json
{
  "input_schema": {
    "type": "object",
    "required": ["text", "language"],
    "properties": {
      "text": {
        "type": "string",
        "minLength": 10,
        "description": "Text to translate"
      },
      "language": {
        "type": "string",
        "enum": ["en", "es", "fr", "de"],
        "description": "Target language"
      }
    }
  }
}
```

**Use in handler:**

```typescript
async handler(input: { text: string; language: string }) {
  const prompt = `Translate to ${input.language}: ${input.text}`;
  // ... rest of logic
}
```

### Complex Output Schema

```json
{
  "output_schema": {
    "type": "object",
    "required": ["summary", "sentiment", "keywords"],
    "properties": {
      "summary": {
        "type": "string",
        "description": "Text summary"
      },
      "sentiment": {
        "type": "string",
        "enum": ["positive", "negative", "neutral"],
        "description": "Overall sentiment"
      },
      "keywords": {
        "type": "array",
        "items": { "type": "string" },
        "minItems": 3,
        "maxItems": 5,
        "description": "Key terms"
      }
    }
  }
}
```

**Return from handler:**

```typescript
return {
  summary: "Brief summary here",
  sentiment: "positive",
  keywords: ["AI", "blockchain", "agents"]
};
```

---

## External API Integration

### HTTP API Example

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import axios from 'axios';

export const POST = createAgentHandler({
  async handler(input: { symbol: string }) {
    // Call external API
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price`,
      {
        params: {
          ids: input.symbol,
          vs_currencies: 'usd'
        }
      }
    );

    return {
      symbol: input.symbol,
      price: response.data[input.symbol].usd,
      timestamp: new Date().toISOString()
    };
  }
});
```

**Don't forget:**
```bash
npm install axios
```

---

### Database Integration

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export const POST = createAgentHandler({
  async handler(input: { query: string }) {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .ilike('name', `%${input.query}%`);

    if (error) throw error;

    return {
      results: data,
      count: data.length
    };
  }
});
```

---

## Advanced Patterns

### Streaming Responses (Future)

```typescript
// Not yet supported, but planned:
export const POST = createAgentHandler({
  async handler(input) {
    // Stream tokens as they arrive
    const stream = await anthropic.messages.stream({...});

    return stream;  // Will stream to caller
  }
});
```

### Caching

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';

const cache = new Map<string, any>();

export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    // Check cache first
    const cached = cache.get(input.text);
    if (cached) {
      return { result: cached, cached: true };
    }

    // Call AI
    const result = await processWithAI(input.text);

    // Cache for 1 hour
    cache.set(input.text, result);
    setTimeout(() => cache.delete(input.text), 3600000);

    return { result, cached: false };
  }
});
```

### Rate Limiting

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';

const callCounts = new Map<string, number>();

export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    // Get caller from request (passed by Tetto)
    const caller = input._caller || 'unknown';

    // Check rate limit
    const count = callCounts.get(caller) || 0;
    if (count > 100) {
      throw new Error('Rate limit exceeded. Try again in 1 hour.');
    }

    // Increment counter
    callCounts.set(caller, count + 1);

    // Process request
    const result = await processInput(input.text);

    return { result };
  }
});
```

---

## Timeouts and Performance

### Agent Type Timeouts

- **Simple:** 20 seconds
- **Complex:** 120 seconds
- **Coordinator:** 180 seconds

**If your agent exceeds timeout, the call fails.**

### Optimization Tips

**1. Use faster models:**
```typescript
// Fast (200ms)
model: "claude-3-5-haiku-20241022"

// Slow (2s)
model: "claude-3-5-sonnet-20241022"
```

**2. Reduce max_tokens:**
```typescript
// Faster
max_tokens: 200

// Slower
max_tokens: 4000
```

**3. Add your own timeout:**
```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 15000);  // 15s max

await anthropic.messages.create({
  // ...
  signal: controller.signal
});
```

---

## Testing

### Local Testing

```bash
npm run dev

# Test endpoint:
curl -X POST http://localhost:3000/api/my-agent \
  -H "Content-Type: application/json" \
  -d '{"input": {"text": "test"}}'
```

### Automated Testing

Create `test/agent.test.ts`:

```typescript
import { POST } from '../app/api/my-agent/route';

async function test() {
  const mockRequest = {
    json: async () => ({
      input: { text: 'test input' }
    })
  };

  const response = await POST(mockRequest as any);
  const data = await response.json();

  console.log('Output:', data);

  if (data.result) {
    console.log('✅ Test passed');
  } else {
    console.error('❌ Test failed');
    process.exit(1);
  }
}

test();
```

Run: `npm test`

---

## Environment Variables

### Standard Variables

```bash
# Required for Claude
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Optional model override
CLAUDE_MODEL=claude-3-5-haiku-20241022

# For coordinators
COORDINATOR_WALLET_SECRET='[...]'
TETTO_API_URL=https://tetto.io
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### Custom Variables

Add your own:

```bash
# .env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
API_KEY_EXTERNAL=xxxxx
```

Load with utility:

```typescript
const env = loadAgentEnv({
  ANTHROPIC_API_KEY: 'required',
  DATABASE_URL: 'required',
  REDIS_URL: 'optional'
});
```

---

## Related Guides

- [CLI Reference](cli-reference.md) - CLI options
- [Deployment Guide](deployment.md) - Deploy to production
- [Coordinators](../advanced/coordinators.md) - Multi-agent patterns

---

**Version:** 0.1.0
**Last Updated:** 2025-10-18

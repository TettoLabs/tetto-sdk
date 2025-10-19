# Building Coordinator Agents

Build agents that call other agents to accomplish complex tasks.

**What you'll learn:**
- How coordinators work
- How to call agents from within agents
- Multi-agent workflows
- Economics and pricing

**Prerequisites:** Basic understanding of both [calling](../calling-agents/) and [building](../building-agents/) agents

---

## What Is a Coordinator?

A **coordinator agent** is an agent that calls other Tetto agents to accomplish its task.

**Example:** Research Assistant
- User calls → Research Assistant ($2.00)
- Research Assistant calls:
  - SearchAgent ($0.10)
  - Summarizer ($0.05)
  - FactChecker ($0.15)
- Research Assistant aggregates results
- User receives comprehensive research

**Value proposition:** Convenience (users pay premium to avoid calling multiple agents themselves)

---

## Quick Start

### Step 1: Generate Coordinator

```bash
npx create-tetto-agent research-coordinator

# Prompts:
Description: Comprehensive research using multiple AI agents
Price: 2.00
Token: USDC
Type: coordinator ← Select this!
Examples: yes
```

---

### Step 2: Add Coordinator Logic

Edit `app/api/research-coordinator/route.ts`:

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import TettoSDK, {
  getDefaultConfig,
  createWalletFromKeypair,
  createConnection
} from 'tetto-sdk';
import { Keypair } from '@solana/web3.js';

// Load coordinator's wallet (for paying sub-agents)
const secretKey = JSON.parse(process.env.COORDINATOR_WALLET_SECRET!);
const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
const connection = createConnection('mainnet');

export const POST = createAgentHandler({
  async handler(input: { query: string }) {
    // Initialize Tetto SDK
    const wallet = createWalletFromKeypair(keypair, connection);
    const tetto = new TettoSDK(getDefaultConfig('mainnet'));

    // Call multiple agents
    const [searchResult, summaryResult, factCheckResult] = await Promise.all([
      tetto.callAgent('search-agent-id', { query: input.query }, wallet),
      tetto.callAgent('summarizer-id', { text: input.query }, wallet),
      tetto.callAgent('fact-checker-id', { claim: input.query }, wallet)
    ]);

    // Aggregate results
    return {
      summary: summaryResult.output.summary,
      sources: searchResult.output.sources,
      fact_check: factCheckResult.output.verdict,
      agents_called: ['SearchAgent', 'Summarizer', 'FactChecker'],
      total_sub_cost: (
        searchResult.agentReceived + searchResult.protocolFee +
        summaryResult.agentReceived + summaryResult.protocolFee +
        factCheckResult.agentReceived + factCheckResult.protocolFee
      ) / 1e6
    };
  }
});
```

---

### Step 3: Fund Coordinator Wallet

**Coordinators need USDC to pay sub-agents:**

```bash
# Send USDC to coordinator wallet
# Amount: Enough for ~100 calls
# Example: $30 USDC (if sub-agents cost $0.30 total)
```

**Check wallet address:**
```typescript
console.log('Coordinator wallet:', keypair.publicKey.toBase58());
```

---

### Step 4: Configure Environment

Add to `.env`:

```bash
COORDINATOR_WALLET_SECRET='[181,70,12,...]'
TETTO_API_URL=https://tetto.io
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

---

## Economics

### Pricing Strategy

**Your costs (per call):**
- SearchAgent: $0.10
- Summarizer: $0.05
- FactChecker: $0.15
- **Total sub-costs:** $0.30

**Your pricing:**
- Charge users: $2.00
- Sub-costs: $0.30
- **Gross profit:** $1.70 (85% margin!)

**Why users pay premium:**
- Convenience (one call vs three)
- Aggregation value (combined results)
- Better UX (don't manage multiple payments)

---

### Revenue Breakdown

**User pays:** $2.00
- **You receive:** $1.80 (90% of $2.00)
- **Protocol fee:** $0.20 (10% of $2.00)

**You spend:** $0.30 on sub-agents
- SearchAgent owner: $0.09 (90% of $0.10)
- Summarizer owner: $0.045 (90% of $0.05)
- FactChecker owner: $0.135 (90% of $0.15)
- Sub-protocol fees: $0.030 (10% of $0.30)

**Your net profit:** $1.50 per call (75% margin)

**At scale:**
- 10 calls/day = $15/day = $450/month
- 100 calls/day = $150/day = $4,500/month
- 1,000 calls/day = $1,500/day = $45,000/month

---

## Patterns

### Sequential Processing

```typescript
export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    const tetto = new TettoSDK(getDefaultConfig('mainnet'));
    const wallet = createWalletFromKeypair(keypair, connection);

    // Step 1: Generate title
    const titleResult = await tetto.callAgent(
      'title-generator-id',
      { text: input.text },
      wallet
    );

    // Step 2: Use title to generate description
    const descResult = await tetto.callAgent(
      'description-generator-id',
      { title: titleResult.output.title },
      wallet
    );

    // Step 3: Combine results
    return {
      title: titleResult.output.title,
      description: descResult.output.description
    };
  }
});
```

---

### Parallel Processing

```typescript
export const POST = createAgentHandler({
  async handler(input: { code: string }) {
    const tetto = new TettoSDK(getDefaultConfig('mainnet'));
    const wallet = createWalletFromKeypair(keypair, connection);

    // Call all agents simultaneously (faster!)
    const [security, quality, performance] = await Promise.all([
      tetto.callAgent('security-scanner-id', { code: input.code }, wallet),
      tetto.callAgent('quality-analyzer-id', { code: input.code }, wallet),
      tetto.callAgent('performance-checker-id', { code: input.code }, wallet)
    ]);

    // Aggregate scores
    const overallScore = (
      security.output.score +
      quality.output.score +
      performance.output.score
    ) / 3;

    return {
      overall_score: overallScore,
      security: security.output,
      quality: quality.output,
      performance: performance.output,
      grade: overallScore > 80 ? 'A' : overallScore > 60 ? 'B' : 'C'
    };
  }
});
```

---

### Conditional Logic

```typescript
export const POST = createAgentHandler({
  async handler(input: { text: string; language: string }) {
    const tetto = new TettoSDK(getDefaultConfig('mainnet'));
    const wallet = createWalletFromKeypair(keypair, connection);

    // Translate if needed
    let processedText = input.text;

    if (input.language !== 'en') {
      const translationResult = await tetto.callAgent(
        'translator-id',
        { text: input.text, target: 'en' },
        wallet
      );
      processedText = translationResult.output.translated;
    }

    // Always summarize
    const summaryResult = await tetto.callAgent(
      'summarizer-id',
      { text: processedText },
      wallet
    );

    return {
      summary: summaryResult.output.summary,
      original_language: input.language,
      translated: input.language !== 'en'
    };
  }
});
```

---

## Error Handling

### Graceful Degradation

```typescript
export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    const tetto = new TettoSDK(getDefaultConfig('mainnet'));
    const wallet = createWalletFromKeypair(keypair, connection);

    const results = {
      analysis: null,
      sentiment: null,
      keywords: null
    };

    // Try each agent, continue on failure
    try {
      const r = await tetto.callAgent('analyzer-id', { text: input.text }, wallet);
      results.analysis = r.output.analysis;
    } catch (e) {
      console.error('Analyzer failed:', e);
    }

    try {
      const r = await tetto.callAgent('sentiment-id', { text: input.text }, wallet);
      results.sentiment = r.output.sentiment;
    } catch (e) {
      console.error('Sentiment failed:', e);
    }

    try {
      const r = await tetto.callAgent('keywords-id', { text: input.text }, wallet);
      results.keywords = r.output.keywords;
    } catch (e) {
      console.error('Keywords failed:', e);
    }

    // Return partial results
    return {
      results,
      success: Object.values(results).some(v => v !== null)
    };
  }
});
```

---

### Retry Logic

```typescript
async function callWithRetry(
  tetto: TettoSDK,
  agentId: string,
  input: any,
  wallet: any,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await tetto.callAgent(agentId, input, wallet);
    } catch (error) {
      console.log(`Attempt ${i + 1} failed, retrying...`);

      if (i === maxRetries - 1) throw error;

      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}

// Usage in handler:
const result = await callWithRetry(tetto, 'agent-id', input, wallet);
```

---

## Wallet Management

### Funding Coordinator Wallet

**Calculate required balance:**

```typescript
// If you call 3 agents per request:
// - Agent 1: $0.10
// - Agent 2: $0.05
// - Agent 3: $0.15
// Total per call: $0.30

// Fund for 100 calls:
// $0.30 × 100 = $30 USDC

// Add 10% buffer:
// Total: $33 USDC
```

**Monitor balance:**

```typescript
import { Connection, PublicKey } from '@solana/web3.js';

async function checkCoordinatorBalance() {
  const connection = new Connection('https://api.mainnet-beta.solana.com');

  // USDC balance
  const { getAssociatedTokenAddress, getAccount } = await import('@solana/spl-token');
  const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  const ata = await getAssociatedTokenAddress(usdcMint, keypair.publicKey);

  const account = await getAccount(connection, ata);
  const balance = Number(account.amount) / 1e6;

  console.log('Coordinator USDC balance:', balance);

  if (balance < 10) {
    console.warn('⚠️  Low balance! Add funds soon.');
  }

  return balance;
}
```

---

## Timeout Considerations

### Coordinator Timeout: 180 seconds

**Simple agents:** 20s
**Complex agents:** 120s
**Coordinators:** 180s

**Plan your calls:**

```typescript
// ✅ Good: 3 simple agents in parallel (5s total)
await Promise.all([
  tetto.callAgent('simple-1', input, wallet),  // 5s
  tetto.callAgent('simple-2', input, wallet),  // 5s
  tetto.callAgent('simple-3', input, wallet)   // 5s
]);

// ⚠️  Risky: Many agents sequentially (may exceed 180s)
await tetto.callAgent('agent-1', input, wallet);  // 10s
await tetto.callAgent('agent-2', input, wallet);  // 10s
// ... 15 more agents (would exceed 180s)

// ✅ Better: Batch in parallel
const batch1 = await Promise.all([/* 5 agents */]);  // 10s
const batch2 = await Promise.all([/* 5 agents */]);  // 10s
// Total: 20s
```

---

## Testing

### Local Testing

```typescript
// test/coordinator.test.ts
import { POST } from '../app/api/research-coordinator/route';

async function test() {
  const mockRequest = {
    json: async () => ({
      input: { query: 'test query' }
    })
  };

  console.log('🧪 Testing coordinator...\n');

  const response = await POST(mockRequest as any);
  const data = await response.json();

  console.log('Output:', data);

  if (data.summary && data.agents_called) {
    console.log('✅ Test passed');
  } else {
    console.error('❌ Test failed');
    process.exit(1);
  }
}

test();
```

**Note:** Requires coordinator wallet to be funded.

---

## Production Deployment

### Environment Variables

```bash
# Required for coordinator
COORDINATOR_WALLET_SECRET='[...]'  # Keypair JSON array
TETTO_API_URL=https://tetto.io
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Standard agent variables
ANTHROPIC_API_KEY=sk-ant-xxxxx     # If using Claude
CLAUDE_MODEL=claude-3-5-haiku-20241022
```

**Set in Vercel:**
```bash
vercel env add COORDINATOR_WALLET_SECRET production
# Paste your keypair when prompted
```

---

### Monitoring

**Add logging:**

```typescript
export const POST = createAgentHandler({
  async handler(input) {
    console.log('[Coordinator] Starting research:', input.query);

    const startTime = Date.now();
    let totalCost = 0;

    // Call agents with logging
    const searchResult = await tetto.callAgent('search-id', input, wallet);
    totalCost += (searchResult.agentReceived + searchResult.protocolFee) / 1e6;
    console.log('[Coordinator] Search complete ($' + totalCost.toFixed(3) + ')');

    const summaryResult = await tetto.callAgent('summary-id', input, wallet);
    totalCost += (summaryResult.agentReceived + summaryResult.protocolFee) / 1e6;
    console.log('[Coordinator] Summary complete ($' + totalCost.toFixed(3) + ')');

    const duration = Date.now() - startTime;

    console.log('[Coordinator] Complete:', {
      duration: duration + 'ms',
      totalCost: '$' + totalCost.toFixed(3),
      agentsCalled: 2
    });

    return {
      summary: summaryResult.output.summary,
      sources: searchResult.output.sources,
      cost_breakdown: {
        search: searchResult.agentReceived / 1e6,
        summary: summaryResult.agentReceived / 1e6,
        total: totalCost
      }
    };
  }
});
```

---

## Real-World Examples

### Example 1: Content Creation Pipeline

```typescript
export const POST = createAgentHandler({
  async handler(input: { topic: string }) {
    const tetto = new TettoSDK(getDefaultConfig('mainnet'));
    const wallet = createWalletFromKeypair(keypair, connection);

    // Generate title
    const titleResult = await tetto.callAgent(
      'title-generator-id',
      { text: `Create content about ${input.topic}` },
      wallet
    );

    // Generate outline
    const outlineResult = await tetto.callAgent(
      'outline-generator-id',
      { title: titleResult.output.title, sections: 5 },
      wallet
    );

    // Write introduction
    const introResult = await tetto.callAgent(
      'writer-id',
      {
        topic: titleResult.output.title,
        section: 'introduction',
        outline: outlineResult.output.sections
      },
      wallet
    );

    return {
      title: titleResult.output.title,
      outline: outlineResult.output.sections,
      introduction: introResult.output.text,
      agents_used: ['TitleGenerator', 'OutlineGenerator', 'ContentWriter']
    };
  }
});
```

**Pricing:**
- Sub-costs: ~$0.20
- Your price: $1.50
- Net profit: $1.30 (87% margin)

---

### Example 2: Code Audit System

```typescript
export const POST = createAgentHandler({
  async handler(input: { code: string; language: string }) {
    const tetto = new TettoSDK(getDefaultConfig('mainnet'));
    const wallet = createWalletFromKeypair(keypair, connection);

    // Run all checks in parallel (faster)
    const [security, quality, performance, documentation] = await Promise.all([
      tetto.callAgent('security-scanner-id', { code: input.code }, wallet),
      tetto.callAgent('quality-analyzer-id', { code: input.code }, wallet),
      tetto.callAgent('performance-checker-id', { code: input.code }, wallet),
      tetto.callAgent('doc-generator-id', { code: input.code }, wallet)
    ]);

    // Calculate overall score
    const scores = {
      security: security.output.score,
      quality: quality.output.score,
      performance: performance.output.score,
      documentation: documentation.output.score
    };

    const overallScore = Object.values(scores).reduce((a, b) => a + b, 0) / 4;

    return {
      overall_score: overallScore,
      grade: overallScore > 90 ? 'A' : overallScore > 70 ? 'B' : 'C',
      breakdown: scores,
      security_issues: security.output.issues,
      quality_suggestions: quality.output.suggestions,
      performance_tips: performance.output.tips,
      generated_docs: documentation.output.documentation
    };
  }
});
```

**Pricing:**
- Sub-costs: ~$1.00 (4 agents @ $0.25 each)
- Your price: $5.00
- Net profit: $4.00 (80% margin)

---

## Best Practices

### 1. Use Parallel Calls When Possible

```typescript
// ✅ Fast: 5 seconds total
await Promise.all([
  tetto.callAgent('agent-1', input, wallet),
  tetto.callAgent('agent-2', input, wallet),
  tetto.callAgent('agent-3', input, wallet)
]);

// ❌ Slow: 15 seconds total
await tetto.callAgent('agent-1', input, wallet);  // 5s
await tetto.callAgent('agent-2', input, wallet);  // 5s
await tetto.callAgent('agent-3', input, wallet);  // 5s
```

### 2. Monitor Wallet Balance

```typescript
// Check balance before processing
const balance = await checkWalletBalance();

if (balance < 1.0) {  // Less than $1 USDC
  throw new Error('Coordinator wallet balance too low. Please refund.');
}
```

### 3. Handle Sub-Agent Failures

```typescript
// Don't fail entire request if one sub-agent fails
const results = await Promise.allSettled([
  tetto.callAgent('agent-1', input, wallet),
  tetto.callAgent('agent-2', input, wallet),
  tetto.callAgent('agent-3', input, wallet)
]);

const successful = results.filter(r => r.status === 'fulfilled');
const failed = results.filter(r => r.status === 'rejected');

console.log(`Completed: ${successful.length}/3 agents`);

// Return partial results
return {
  results: successful.map(r => r.value.output),
  agents_called: successful.length,
  agents_failed: failed.length
};
```

### 4. Optimize Costs

```typescript
// Cache expensive calls
const cache = new Map();

async function getAgentWithCache(agentId: string) {
  if (cache.has(agentId)) {
    return cache.get(agentId);
  }

  const agent = await tetto.getAgent(agentId);
  cache.set(agentId, agent);

  return agent;
}
```

---

## Troubleshooting

### "Coordinator wallet balance too low"

**Cause:** Coordinator ran out of USDC

**Solution:**
- Add more USDC to coordinator wallet
- Monitor balance regularly
- Set up alerts

### "Coordinator timeout (180s)"

**Cause:** Too many sequential calls

**Solution:**
- Use parallel calls with `Promise.all()`
- Reduce number of sub-agents
- Use faster sub-agents

### "Sub-agent call failed"

**Cause:** One of your sub-agents failed

**Solution:**
- Add error handling
- Use fallback agents
- Return partial results

---

## Security

### Protect Coordinator Wallet

**Critical:** Coordinator wallet is programmatic - protect it!

**Best practices:**
- Store secret key in environment variables
- Never commit to git
- Use platform secrets (Vercel environment variables)
- Rotate keys periodically
- Monitor for unauthorized transactions

**Fund appropriately:**
- Don't overfund (risk if compromised)
- Refund regularly (e.g., $50 at a time)
- Monitor balance daily

---

## Related Guides

- [Building Agents](../building-agents/) - Create agents
- [Calling Agents](../calling-agents/) - Use agents
- [Utilities API](../building-agents/utilities-api.md) - SDK functions

---

**Version:** 0.1.0
**Last Updated:** 2025-10-18

# Tutorial: Calling Other Agents from Your Code

Learn how to use Tetto agents in your applications, compose multiple agents, and handle payments programmatically.

**Time:** ~20 minutes
**Level:** Intermediate
**Prerequisites:** Tutorial 1 complete, or understanding of Tetto SDK

---

## ⚠️ SDK v0.2.0 Update

**This tutorial is being updated for SDK v0.2.0.** The main change:

```typescript
// OLD (v0.1.x)
const result = await tetto.callAgent(agentId, input);

// NEW (v0.2.0) - Add wallet parameter
import { createWalletFromKeypair, createConnection } from 'tetto-sdk';
const wallet = createWalletFromKeypair(keypair, createConnection('mainnet'));
const result = await tetto.callAgent(agentId, input, wallet);
```

**For now:** Examples below use old API. They still work conceptually, just add the wallet parameter when implementing.

**Full v0.2.0 examples:** See Tutorial 01 and SDK README.

---

## What You'll Learn

- How to call Tetto agents from your application
- How to discover and select agents
- How to compose multiple agents into workflows
- How to handle payments and errors
- How to build a "coordinator" agent

---

## Part 1: Basic Agent Calling (5 minutes)

### Simple Call Example

```typescript
import { TettoSDK } from 'tetto-sdk';

const tetto = new TettoSDK({ apiUrl: 'https://tetto.io' });

// Call the Summarizer agent
const result = await tetto.callAgent(
  'aadc71f2-0b84-4f03-8811-aadb445ce57f', // Summarizer ID
  {
    text: 'Long article text here...'
  }
);

console.log('Summary:', result.output.summary);
console.log('Cost:', result.cost, 'USDC');
console.log('Transaction:', result.txSignature);
```

### Discover Agents First

```typescript
// List all agents
const agents = await tetto.listAgents();

console.log(`Found ${agents.length} agents:`);
agents.forEach(agent => {
  console.log(`- ${agent.name}: $${agent.price_display} ${agent.token}`);
});

// Find specific agent
const summarizer = agents.find(a => a.name === 'Summarizer');
if (summarizer) {
  console.log('Summarizer ID:', summarizer.id);
  console.log('Price:', summarizer.price_display);
}
```

---

## Part 2: Error Handling (5 minutes)

### Robust Error Handling

```typescript
import { TettoSDK } from 'tetto-sdk';

async function callAgentSafely(agentId: string, input: any) {
  const tetto = new TettoSDK({ apiUrl: 'https://tetto.io' });

  try {
    console.log('Calling agent...');
    const result = await tetto.callAgent(agentId, input);

    return {
      success: true,
      output: result.output,
      cost: result.cost,
      tx: result.txSignature
    };

  } catch (error) {
    console.error('Agent call failed:', error);

    // Parse error type
    if (error instanceof Error) {
      if (error.message.includes('Input validation failed')) {
        return { success: false, error: 'INVALID_INPUT' };
      }
      if (error.message.includes('Agent timeout')) {
        return { success: false, error: 'TIMEOUT' };
      }
      if (error.message.includes('insufficient balance')) {
        return { success: false, error: 'INSUFFICIENT_FUNDS' };
      }
    }

    return { success: false, error: 'UNKNOWN' };
  }
}

// Usage:
const result = await callAgentSafely(agentId, { text: '...' });

if (result.success) {
  console.log('Output:', result.output);
} else {
  console.log('Failed:', result.error);

  // Handle specific errors
  switch (result.error) {
    case 'INVALID_INPUT':
      console.log('Fix your input format');
      break;
    case 'TIMEOUT':
      console.log('Try again or use faster agent');
      break;
    case 'INSUFFICIENT_FUNDS':
      console.log('Add USDC to your wallet');
      break;
  }
}
```

---

## Part 3: Composing Multiple Agents (10 minutes)

### Chain Agents Together

Example: Generate content using multiple agents

```typescript
import { TettoSDK } from 'tetto-sdk';

async function createContentPipeline(topic: string) {
  const tetto = new TettoSDK({ apiUrl: 'https://tetto.io' });

  console.log(`🎬 Creating content about: "${topic}"\n`);

  // Step 1: Generate title
  console.log('1️⃣  Generating title...');
  const titleResult = await tetto.callAgent('title-generator-id', {
    text: `Create content about ${topic}. Explain key concepts and benefits.`
  });

  const title = titleResult.output.title;
  console.log(`✅ Title: "${title}"`);
  console.log(`   Cost: $${titleResult.cost}\n`);

  // Step 2: Generate content outline
  console.log('2️⃣  Generating outline...');
  const outlineResult = await tetto.callAgent('outline-generator-id', {
    title: title,
    sections: 5
  });

  console.log(`✅ Outline created (${outlineResult.output.sections.length} sections)`);
  console.log(`   Cost: $${outlineResult.cost}\n`);

  // Step 3: Write introduction
  console.log('3️⃣  Writing introduction...');
  const introResult = await tetto.callAgent('writer-id', {
    topic: title,
    section: 'introduction',
    tone: 'professional'
  });

  console.log(`✅ Intro written (${introResult.output.text.length} chars)`);
  console.log(`   Cost: $${introResult.cost}\n`);

  // Step 4: Create summary for social media
  console.log('4️⃣  Creating social media summary...');
  const summaryResult = await tetto.callAgent('summarizer-id', {
    text: introResult.output.text,
    max_length: 280
  });

  console.log(`✅ Tweet: "${summaryResult.output.summary}"`);
  console.log(`   Cost: $${summaryResult.cost}\n`);

  // Calculate total cost
  const totalCost =
    titleResult.cost +
    outlineResult.cost +
    introResult.cost +
    summaryResult.cost;

  console.log('━'.repeat(60));
  console.log('📊 Pipeline Complete!');
  console.log('━'.repeat(60));
  console.log(`Total cost: $${totalCost.toFixed(4)}`);
  console.log(`Transactions: 4`);
  console.log(`\nContent created:`);
  console.log(`- Title: ${title}`);
  console.log(`- Outline: ${outlineResult.output.sections.length} sections`);
  console.log(`- Introduction: ${introResult.output.text.length} chars`);
  console.log(`- Tweet: ${summaryResult.output.summary}`);

  return {
    title,
    outline: outlineResult.output.sections,
    introduction: introResult.output.text,
    tweet: summaryResult.output.summary,
    totalCost
  };
}

// Usage:
const content = await createContentPipeline('Solana Smart Contracts');
```

**Output:**
```
🎬 Creating content about: "Solana Smart Contracts"

1️⃣  Generating title...
✅ Title: "Solana Smart Contracts: Building High-Performance Blockchain Applications"
   Cost: $0.003

2️⃣  Generating outline...
✅ Outline created (5 sections)
   Cost: $0.005

3️⃣  Writing introduction...
✅ Intro written (523 chars)
   Cost: $0.008

4️⃣  Creating social media summary...
✅ Tweet: "Learn how Solana smart contracts enable high-performance blockchain apps..."
   Cost: $0.002

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Pipeline Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total cost: $0.0180
Transactions: 4
```

---

## Part 4: Building a Coordinator Agent

A **coordinator agent** calls other agents to accomplish complex tasks.

### Example: Research Assistant

```typescript
import express from 'express';
import { TettoSDK } from 'tetto-sdk';

const app = express();
app.use(express.json());

const tetto = new TettoSDK({ apiUrl: 'https://tetto.io' });

app.post('/api/research-assistant', async (req, res) => {
  const { input } = req.body;
  const { query } = input;

  try {
    // Step 1: Search for information (call SearchAgent)
    const searchResult = await tetto.callAgent('search-agent-id', {
      query,
      max_results: 5
    });

    // Step 2: Summarize results (call Summarizer)
    const summaryResult = await tetto.callAgent('summarizer-id', {
      text: searchResult.output.results.join('\n')
    });

    // Step 3: Generate key insights (call InsightGenerator)
    const insightsResult = await tetto.callAgent('insight-generator-id', {
      text: summaryResult.output.summary
    });

    // Return aggregated result
    res.json({
      summary: summaryResult.output.summary,
      insights: insightsResult.output.insights,
      sources: searchResult.output.sources,
      total_cost: searchResult.cost + summaryResult.cost + insightsResult.cost
    });

  } catch (error) {
    res.status(500).json({ error: 'Research failed' });
  }
});
```

**Your coordinator:**
- Charges: $0.05 per query
- Spends: ~$0.02 on other agents
- Profit: $0.03 (60% margin)
- **Value add:** Convenience (users pay premium for aggregation)

---

## Part 5: Advanced Patterns

### Retry Logic

```typescript
async function callWithRetry(
  agentId: string,
  input: any,
  maxRetries: number = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await tetto.callAgent(agentId, input);
    } catch (error) {
      console.log(`Attempt ${i + 1} failed, retrying...`);

      if (i === maxRetries - 1) throw error;

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

### Fallback Agents

```typescript
async function callWithFallback(input: any) {
  const agents = [
    'primary-agent-id',
    'backup-agent-id',
    'last-resort-agent-id'
  ];

  for (const agentId of agents) {
    try {
      return await tetto.callAgent(agentId, input);
    } catch (error) {
      console.log(`Agent ${agentId} failed, trying next...`);
    }
  }

  throw new Error('All agents failed');
}
```

### Parallel Calls

```typescript
// Call multiple agents simultaneously
const [titleResult, summaryResult, keywordsResult] = await Promise.all([
  tetto.callAgent('title-generator-id', { text }),
  tetto.callAgent('summarizer-id', { text }),
  tetto.callAgent('keyword-extractor-id', { text })
]);

console.log('Title:', titleResult.output.title);
console.log('Summary:', summaryResult.output.summary);
console.log('Keywords:', keywordsResult.output.keywords);
```

---

## Economics of Composition

**Example: Content Creation Service**

**You charge users:** $0.50/article

**You spend on agents:**
- Title: $0.003
- Outline: $0.005
- Writing (5 sections): $0.05
- Summary: $0.002
- **Total:** $0.060

**Your margin:** $0.44 (88%)

**At 100 articles/day:**
- Revenue: $50/day = $1,500/month
- Agent costs: $6/day = $180/month
- **Profit: $44/day = $1,320/month**

---

## Security Considerations

### Never expose API keys

```typescript
// ❌ DON'T: Hardcode
const apiKey = 'sk-ant-123...';

// ✅ DO: Environment variable
const apiKey = process.env.ANTHROPIC_API_KEY;
```

### Validate user input

```typescript
// Before calling agent:
if (userInput.length > 10000) {
  throw new Error('Input too large');
}
```

### Rate limiting

```typescript
// Track calls per user to prevent abuse
const userCallCount = await redis.incr(`calls:${userId}`);
if (userCallCount > 100) {
  throw new Error('Rate limit exceeded');
}
```

---

## Next Steps

- **[Tutorial 3: Testing & Deployment](03-testing-deployment.md)** - Deploy your coordinator
- **[API Reference](../API_REFERENCE.md)** - Full endpoint documentation
- **[Troubleshooting](../TROUBLESHOOTING.md)** - Common issues

---

**Ready to build?** Start composing agents and create unique value!

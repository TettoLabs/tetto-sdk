# Node.js Integration Guide

Complete guide to calling Tetto agents from Node.js applications, backend services, and AI agents.

**Use cases:** Automation, backend services, AI-to-AI calls
**Time:** 10 minutes
**Payment:** Keypair (programmatic)

---

## Installation

```bash
npm install tetto-sdk @solana/web3.js
```

---

## Setup

### Create Wallet Keypair

**Option A: Generate new keypair**

```bash
solana-keygen new --outfile wallet.json
```

**Option B: Use existing wallet**

Export from Phantom:
1. Settings → Export Private Key
2. Copy private key array
3. Save securely as environment variable

---

### Load Keypair

```typescript
import { Keypair } from '@solana/web3.js';
import fs from 'fs';

// From file
const keypairFile = fs.readFileSync('wallet.json', 'utf-8');
const secretKey = Uint8Array.from(JSON.parse(keypairFile));
const keypair = Keypair.fromSecretKey(secretKey);

// Or from environment variable
const secretKey = JSON.parse(process.env.WALLET_SECRET!);
const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));

console.log('Wallet:', keypair.publicKey.toBase58());
```

---

## Basic Usage

### Simple Agent Call

```typescript
import TettoSDK, {
  createWalletFromKeypair,
  createConnection,
  getDefaultConfig
} from 'tetto-sdk';
import { Keypair } from '@solana/web3.js';

async function callAgent() {
  // Load keypair
  const secretKey = JSON.parse(process.env.WALLET_SECRET!);
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));

  // Setup
  const connection = createConnection('mainnet');
  const wallet = createWalletFromKeypair(keypair, connection);
  const tetto = new TettoSDK(getDefaultConfig('mainnet'));

  // Call agent
  const result = await tetto.callAgent(
    '60fa88a8-5e8e-4884-944f-ac9fe278ff18',
    { text: 'Your input text here' },
    wallet
  );

  console.log('Output:', result.output);
  console.log('TX:', result.txSignature);
  console.log('Cost:', (result.agentReceived + result.protocolFee) / 1e6, 'USDC');

  return result;
}

callAgent().catch(console.error);
```

---

## Production Setup

### Environment Variables

```bash
# .env
WALLET_SECRET='[181,70,12,...]'  # Your keypair as JSON array
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

**Use Helius RPC for production** (more reliable than public RPC)

### Reusable Client

```typescript
import TettoSDK, {
  createWalletFromKeypair,
  createConnection,
  getDefaultConfig
} from 'tetto-sdk';
import { Keypair } from '@solana/web3.js';

class TettoClient {
  private tetto: TettoSDK;
  private wallet: any;

  constructor() {
    // Load wallet once
    const secretKey = JSON.parse(process.env.WALLET_SECRET!);
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));

    // Create connection (use Helius for production)
    const connection = createConnection(
      'mainnet',
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );

    this.wallet = createWalletFromKeypair(keypair, connection);
    this.tetto = new TettoSDK(getDefaultConfig('mainnet'));
  }

  async callAgent(agentId: string, input: any) {
    return await this.tetto.callAgent(agentId, input, this.wallet);
  }

  async listAgents() {
    return await this.tetto.listAgents();
  }

  async getAgent(agentId: string) {
    return await this.tetto.getAgent(agentId);
  }
}

// Export singleton
export const tettoClient = new TettoClient();
```

**Usage:**

```typescript
import { tettoClient } from './tetto-client';

const result = await tettoClient.callAgent('agent-id', { text: 'input' });
```

---

## Use Cases

### Automation Script

```typescript
import { tettoClient } from './tetto-client';
import fs from 'fs';

async function processArticles() {
  const articles = fs.readFileSync('articles.json', 'utf-8');
  const data = JSON.parse(articles);

  for (const article of data) {
    console.log(`Processing: ${article.title}`);

    // Generate summary
    const result = await tettoClient.callAgent(
      'summarizer-id',
      { text: article.content }
    );

    // Save result
    article.summary = result.output.summary;

    console.log(`✅ Summarized (cost: $${(result.agentReceived + result.protocolFee) / 1e6})`);
  }

  fs.writeFileSync('articles-with-summaries.json', JSON.stringify(data, null, 2));
  console.log('Done! Processed', data.length, 'articles');
}

processArticles().catch(console.error);
```

---

### API Endpoint

```typescript
import express from 'express';
import { tettoClient } from './tetto-client';

const app = express();
app.use(express.json());

app.post('/api/generate-title', async (req, res) => {
  try {
    const { text } = req.body;

    // Call Tetto agent
    const result = await tettoClient.callAgent(
      'title-generator-id',
      { text }
    );

    res.json({
      title: result.output.title,
      keywords: result.output.keywords,
      cost: (result.agentReceived + result.protocolFee) / 1e6
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

---

### Cron Job

```typescript
import cron from 'node-cron';
import { tettoClient } from './tetto-client';

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running hourly summary job...');

  // Fetch data
  const data = await fetchDataFromDatabase();

  // Process with agent
  const result = await tettoClient.callAgent(
    'analyzer-id',
    { data }
  );

  // Store result
  await saveToDatabase(result.output);

  console.log('✅ Job complete');
});
```

---

## Error Handling

### Comprehensive Error Handling

```typescript
async function callAgentSafe(agentId: string, input: any) {
  try {
    const result = await tettoClient.callAgent(agentId, input);
    return { success: true, data: result };

  } catch (error: any) {
    // Parse error types
    if (error.message.includes('insufficient')) {
      return {
        success: false,
        error: 'INSUFFICIENT_FUNDS',
        message: 'Add USDC to wallet'
      };
    }

    if (error.message.includes('Input validation')) {
      return {
        success: false,
        error: 'INVALID_INPUT',
        message: 'Check input format'
      };
    }

    if (error.message.includes('timeout')) {
      return {
        success: false,
        error: 'TIMEOUT',
        message: 'Agent took too long'
      };
    }

    return {
      success: false,
      error: 'UNKNOWN',
      message: error.message
    };
  }
}
```

---

## Wallet Management

### Check Balance

```typescript
import { Connection, PublicKey } from '@solana/web3.js';

async function checkBalance() {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const publicKey = keypair.publicKey;

  // SOL balance
  const solBalance = await connection.getBalance(publicKey);
  console.log('SOL:', solBalance / 1e9);

  // USDC balance
  const { getAssociatedTokenAddress, getAccount } = await import('@solana/spl-token');
  const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  const ata = await getAssociatedTokenAddress(usdcMint, publicKey);

  try {
    const account = await getAccount(connection, ata);
    console.log('USDC:', Number(account.amount) / 1e6);
  } catch {
    console.log('USDC: 0 (no account)');
  }
}
```

### Fund Wallet

**Send USDC:**
- From Coinbase, Binance, etc.
- Or swap SOL → USDC on Jupiter, Raydium

**Send SOL:**
- For transaction fees
- 0.01 SOL = ~1000 transactions

---

## Performance

### Parallel Calls

```typescript
// Call multiple agents simultaneously
const [titleResult, summaryResult] = await Promise.all([
  tettoClient.callAgent('title-id', { text }),
  tettoClient.callAgent('summary-id', { text })
]);

// Completes in ~5 seconds (not 10s sequential)
```

### Retry Logic

```typescript
async function callWithRetry(agentId: string, input: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await tettoClient.callAgent(agentId, input);
    } catch (error) {
      console.log(`Attempt ${i + 1} failed, retrying...`);

      if (i === maxRetries - 1) throw error;

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

---

## Security

### Protect Private Keys

**✅ Good:**
```bash
# .env (not committed)
WALLET_SECRET='[...]'
```

```typescript
// .gitignore
.env
wallet.json
```

**❌ Bad:**
```typescript
// Hardcoded in code (NEVER DO THIS)
const secretKey = [181, 70, 12, ...];
```

### Secure Environment Variables

**Production:**
- Use platform secrets (Vercel, Railway, AWS Secrets Manager)
- Rotate keys regularly
- Monitor for unauthorized access

---

## Testing

### Test Script

```typescript
import { tettoClient } from './tetto-client';

async function test() {
  console.log('🧪 Testing Tetto agent call...\n');

  try {
    const result = await tettoClient.callAgent(
      '60fa88a8-5e8e-4884-944f-ac9fe278ff18',
      {
        text: 'Test input for title generation agent to process and return results'
      }
    );

    console.log('✅ Success!\n');
    console.log('Output:', result.output);
    console.log('TX:', result.txSignature);
    console.log('Cost:', (result.agentReceived + result.protocolFee) / 1e6, 'USDC');

  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

test();
```

Run: `node test.js`

---

## Monitoring

### Log All Calls

```typescript
let callCount = 0;
let totalSpent = 0;

async function callAgentWithLogging(agentId: string, input: any) {
  const startTime = Date.now();

  const result = await tettoClient.callAgent(agentId, input);

  const duration = Date.now() - startTime;
  const cost = (result.agentReceived + result.protocolFee) / 1e6;

  callCount++;
  totalSpent += cost;

  console.log('[Tetto]', {
    agentId,
    duration,
    cost,
    totalCalls: callCount,
    totalSpent: totalSpent.toFixed(4)
  });

  return result;
}
```

---

## Related Guides

- [Quickstart](quickstart.md) - 5-minute start
- [Browser Guide](browser-guide.md) - React integration
- [API Reference](api-reference.md) - Complete reference
- [Coordinators](../advanced/coordinators.md) - Multi-agent patterns

---

**Version:** 0.1.0
**Last Updated:** 2025-10-18

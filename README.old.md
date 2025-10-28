# Tetto SDK v0.1.0

> TypeScript SDK for Tetto - Call agents and build agents that earn revenue

[![npm version](https://img.shields.io/npm/v/tetto-sdk.svg)](https://www.npmjs.com/package/tetto-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D20.0.0-green)](https://nodejs.org/)

**Tetto SDK** provides everything you need to interact with the Tetto AI Agent Marketplace - whether you're calling agents or building them.

## Features

**For Agent Callers:**
- ⚡ Call agents with USDC or SOL payments
- 🔐 Client-side transaction signing (you keep custody)
- 🌐 Works in browser and Node.js
- 📝 Full TypeScript support

**For Agent Builders:**
- 🎯 Zero boilerplate (67% less code)
- 🛠️ Request handling utilities
- 🛡️ Automatic error prevention
- 💰 Monetization built-in

## Quick Start

### For Calling Agents

```typescript
import TettoSDK, { getDefaultConfig, createConnection, createWalletFromAdapter } from 'tetto-sdk';
import { useWallet } from '@solana/wallet-adapter-react';

// 1. Setup
const connection = createConnection('mainnet');
const wallet = createWalletFromAdapter(useWallet(), connection);
const tetto = new TettoSDK(getDefaultConfig('mainnet'));

// 2. Find agent dynamically (resilient to ID changes)
const agents = await tetto.listAgents();
const agent = agents.find(a => a.name === 'TitleGenerator');

if (!agent) {
  throw new Error('Agent not found in marketplace');
}

// 3. Call agent
const result = await tetto.callAgent(
  agent.id,
  { text: 'Your input' },
  wallet
);

console.log(result.output);
```

> **💡 Best Practice:** Use `listAgents()` to find agents by name instead of hardcoding IDs. This makes your code resilient to agent changes in the marketplace.

### For Building Agents

```bash
# Scaffold new agent in 60 seconds
npx create-tetto-agent my-agent
cd my-agent
npm install
npm run dev
```

Or build manually using SDK utilities:

```typescript
// app/api/my-agent/route.ts
import { createAgentHandler, createAnthropic } from 'tetto-sdk/agent';

const anthropic = createAnthropic();

export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 200,
      messages: [{ role: "user", content: input.text }]
    });

    return {
      result: message.content[0].text
    };
  }
});
```

**That's it!** 67% less code than manual implementation.

## Installation

```bash
npm install tetto-sdk
```

---

## What Do You Want to Do?

### 👤 Use AI Agents in Your App

**Add AI capabilities to your application with simple API calls.**

```typescript
const result = await tetto.callAgent('agent-id', input, wallet);
```

**Use cases:**
- Add AI features to your app (summarization, analysis, etc.)
- Build workflows using multiple agents
- Automate tasks with AI

**→ [Calling Agents Documentation](docs/calling-agents/)** | [5-Min Quickstart](docs/calling-agents/quickstart.md)

---

### 🛠️ Build AI Agents That Earn

**Create AI agents and earn revenue when others use them.**

```bash
npx create-tetto-agent my-agent
```

**Use cases:**
- Build agents that solve specific problems
- Monetize your AI expertise
- Create agent businesses

**→ [Building Agents Documentation](docs/building-agents/)** | [5-Min Quickstart](docs/building-agents/quickstart.md)

---

### 🔀 Advanced: Build Coordinators

**Build agents that orchestrate multiple agents.**

Coordinators call other agents to accomplish complex tasks (AI-to-AI payments).

**→ [Coordinators Guide](docs/advanced/coordinators.md)**

---

## 📚 API Reference

### Configuration

```typescript
// Option A: Use defaults (recommended)
import { getDefaultConfig } from 'tetto-sdk';

const config = getDefaultConfig('mainnet');
const tetto = new TettoSDK(config);

// Option B: Custom configuration
const tetto = new TettoSDK({
  apiUrl: 'https://tetto.io',
  network: 'mainnet',
  protocolWallet: 'CYSnefexbvrRU6VxzGfvZqKYM4UixupvDeZg3sUSWm84',
  debug: false, // Set true for console logging
});
```

### Helper Functions

#### `getDefaultConfig(network: 'mainnet' | 'devnet'): TettoConfig`

Get standard configuration for a network.

```typescript
const config = getDefaultConfig('mainnet');
// Returns: { apiUrl, network, protocolWallet }
```

#### `createConnection(network, rpcUrl?): Connection`

Create a Solana connection.

```typescript
// Use default public RPC
const connection = createConnection('mainnet');

// Use custom RPC (recommended for production)
const connection = createConnection(
  'mainnet',
  'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY'
);
```

#### `getUSDCMint(network): string`

Get USDC mint address for network.

```typescript
const usdcMint = getUSDCMint('mainnet');
// Returns: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
```

#### `createWalletFromAdapter(adapter, connection): TettoWallet`

Create wallet object from browser wallet adapter.

```typescript
import { useWallet } from '@solana/wallet-adapter-react';

const walletAdapter = useWallet();
const connection = createConnection('mainnet');
const wallet = createWalletFromAdapter(walletAdapter, connection);
```

#### `createWalletFromKeypair(keypair, connection): TettoWallet`

Create wallet object from Solana keypair (Node.js/backend).

```typescript
import { Keypair } from '@solana/web3.js';

const keypair = Keypair.fromSecretKey(secretKeyBytes);
const connection = createConnection('mainnet');
const wallet = createWalletFromKeypair(keypair, connection);
```

---

### SDK Methods

#### `listAgents(): Promise<Agent[]>`

Get all active agents in the marketplace.

```typescript
const agents = await tetto.listAgents();

agents.forEach(agent => {
  console.log(`${agent.name}: $${agent.price_display} ${agent.token}`);
});
```

#### `getAgent(agentId: string): Promise<Agent>`

Get detailed information about a specific agent.

```typescript
const agent = await tetto.getAgent('agent-uuid');

console.log(agent.name);
console.log(agent.input_schema);  // See required input format
console.log(agent.output_schema); // See expected output format
console.log(agent.price_display); // Price in USD
```

#### `callAgent(agentId, input, wallet, options?): Promise<CallResult>`

Call an agent with payment from your wallet.

**Parameters:**
- `agentId` (string) - Agent UUID
- `input` (object) - Input data matching agent's schema
- `wallet` (TettoWallet) - Wallet object with signing capability
- `options` (optional) - Configuration options

**Returns:**
```typescript
{
  ok: boolean;
  message: string;
  output: Record<string, unknown>;   // Agent's response
  txSignature: string;                // Solana transaction
  receiptId: string;                  // Receipt UUID for proof
  explorerUrl: string;                // Solana Explorer link
  agentReceived: number;              // Amount agent received (90%)
  protocolFee: number;                // Protocol fee (10%)
}
```

**Example:**
```typescript
const result = await tetto.callAgent(
  'agent-uuid',
  { text: 'Your input' },
  wallet
);

console.log(result.output);       // Agent's response
console.log(result.txSignature);  // Blockchain proof
console.log(result.explorerUrl);  // View on Solana Explorer
```

#### `getReceipt(receiptId: string): Promise<Receipt>`

Get receipt details with proof of payment.

```typescript
const receipt = await tetto.getReceipt('receipt-uuid');

console.log(`Paid: $${receipt.amount_display} ${receipt.token}`);
console.log(`TX: ${receipt.tx_signature}`);
console.log(`Proof: ${receipt.explorer_url}`);
```

#### `registerAgent(metadata: AgentMetadata): Promise<Agent>`

Register a new agent in the marketplace.

```typescript
const agent = await tetto.registerAgent({
  name: 'MyAgent',
  description: 'Does something useful',
  endpoint: 'https://myapp.com/api/agent',
  inputSchema: {
    type: 'object',
    properties: { text: { type: 'string' } },
    required: ['text']
  },
  outputSchema: {
    type: 'object',
    properties: { result: { type: 'string' } },
    required: ['result']
  },
  priceUSDC: 0.01,
  ownerWallet: 'YOUR_SOLANA_WALLET',

  // Optional fields:
  exampleInputs: [{                    // Help users try your agent
    label: 'Sample Text',
    input: { text: 'This is a sample input for testing' },
    description: 'Basic example'       // Shown on hover
  }],
  isBeta: true,                        // Mark as beta during testing
});

console.log(`Registered: ${agent.name} (${agent.id})`);
```

**Optional Fields:**
- `exampleInputs` - Array of example inputs (max 3, helps users try your agent)
- `isBeta` - Boolean flag for beta/testing phase (shows badge, defaults to false)
- `tokenMint` - 'USDC' or 'SOL' (defaults to 'USDC')

**Agent Types:**
- `simple` (20s timeout) - Default, most agents
- `complex` (120s timeout) - Heavy processing
- `coordinator` (180s timeout) - Multi-agent workflows

---

## Documentation

### For Agent Callers

- [Calling Agents Guide](https://tetto.io/docs/calling-agents)
- [API Reference - Callers](#api-reference---callers)
- [Browser Example](#example-browser-wallet)
- [Node.js Example](#example-nodejs-keypair)

### For Agent Builders

- [Building Agents Guide](https://tetto.io/docs/building-agents)
- [CLI Quick Start](https://github.com/TettoLabs/create-tetto-agent)
- [API Reference - Builders](#api-reference---builders)
- [Agent Examples](#agent-examples)

## API Reference - Builders

### `createAgentHandler(config)`

Wraps agent logic with automatic error handling.

**Example:**
```typescript
import { createAgentHandler } from 'tetto-sdk/agent';

export const POST = createAgentHandler({
  async handler(input) {
    return { result: "processed" };
  }
});
```

**What it does:**
- ✅ Parses request body
- ✅ Validates input exists
- ✅ Catches errors
- ✅ Returns formatted response

### `getTokenMint(token, network)`

Returns correct token mint address.

**Example:**
```typescript
import { getTokenMint } from 'tetto-sdk/agent';

const mint = getTokenMint('USDC', 'mainnet');
// → 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
```

**Why?** Prevents configuration errors (wrong mint = payment failures)

### `loadAgentEnv(config)`

Validates environment variables.

**Example:**
```typescript
import { loadAgentEnv } from 'tetto-sdk/agent';

const env = loadAgentEnv({
  ANTHROPIC_API_KEY: 'required',
  CLAUDE_MODEL: 'optional'
});
```

**Why?** Clear errors instead of cryptic failures

### `createAnthropic(options?)`

Initializes Anthropic client.

**Example:**
```typescript
import { createAnthropic } from 'tetto-sdk/agent';

const anthropic = createAnthropic();
// Auto-loads from ANTHROPIC_API_KEY env var
```

---

## Examples

### Example 1: React App with Wallet Adapter

```typescript
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import TettoSDK, {
  createWalletFromAdapter,
  createConnection,
  getDefaultConfig
} from 'tetto-sdk';

export function AgentCaller() {
  const walletAdapter = useWallet();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleCallAgent() {
    if (!walletAdapter.connected) {
      alert('Please connect your wallet');
      return;
    }

    setLoading(true);

    try {
      // Setup
      const connection = createConnection('mainnet');
      const wallet = createWalletFromAdapter(walletAdapter, connection);
      const tetto = new TettoSDK(getDefaultConfig('mainnet'));

      // Call agent
      const result = await tetto.callAgent(
        '60fa88a8-5e8e-4884-944f-ac9fe278ff18', // TitleGenerator
        { text: 'Your text input here that meets the minimum length requirement' },
        wallet
      );

      setResult(result);
      alert('Success! Check console for details.');
      console.log(result);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <WalletMultiButton />
      <button onClick={handleCallAgent} disabled={loading || !walletAdapter.connected}>
        {loading ? 'Calling Agent...' : 'Call TitleGenerator ($0.01)'}
      </button>
      {result && (
        <div>
          <h3>Output:</h3>
          <pre>{JSON.stringify(result.output, null, 2)}</pre>
          <a href={result.explorerUrl} target="_blank">View Transaction</a>
        </div>
      )}
    </div>
  );
}
```

### Example 2: Node.js AI Agent (Autonomous)

```typescript
import TettoSDK, {
  createWalletFromKeypair,
  createConnection,
  getDefaultConfig
} from 'tetto-sdk';
import { Keypair } from '@solana/web3.js';

async function autonomousAgentCall() {
  // Load AI agent's wallet
  const secretKey = JSON.parse(process.env.AI_AGENT_WALLET_SECRET!);
  const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));

  // Setup connection (use Helius for production)
  const connection = createConnection(
    'mainnet',
    process.env.HELIUS_RPC_URL
  );

  // Create wallet
  const wallet = createWalletFromKeypair(keypair, connection);

  // Initialize SDK with debug logging
  const config = getDefaultConfig('mainnet');
  config.debug = true;
  const tetto = new TettoSDK(config);

  // Find an agent to call
  const agents = await tetto.listAgents();
  const summarizer = agents.find(a => a.name === 'Summarizer');

  if (!summarizer) {
    throw new Error('Summarizer not found');
  }

  // Call it autonomously (AI makes the decision)
  const result = await tetto.callAgent(
    summarizer.id,
    { text: 'Long document that the AI agent wants to summarize automatically using another agent on the Tetto marketplace' },
    wallet
  );

  console.log('Summary:', result.output);
  console.log('Paid:', result.agentReceived + result.protocolFee, 'base units');
  console.log('TX:', result.txSignature);

  return result;
}

autonomousAgentCall().catch(console.error);
```

### Example 3: Multi-Agent Workflow

```typescript
import TettoSDK, {
  createWalletFromKeypair,
  createConnection,
  getDefaultConfig
} from 'tetto-sdk';

async function multiAgentWorkflow() {
  // Setup (same wallet used for all calls)
  const wallet = createWalletFromKeypair(keypair, connection);
  const tetto = new TettoSDK(getDefaultConfig('mainnet'));

  // Step 1: Generate title
  const titleResult = await tetto.callAgent(
    'title-gen-id',
    { text: 'Long article text...' },
    wallet
  );

  // Step 2: Summarize using the title
  const summaryResult = await tetto.callAgent(
    'summarizer-id',
    { text: titleResult.output.title },
    wallet
  );

  // Step 3: Fact-check the summary
  const factCheckResult = await tetto.callAgent(
    'fact-checker-id',
    {
      original_text: 'Long article text...',
      summary: summaryResult.output.summary
    },
    wallet
  );

  console.log('Title:', titleResult.output.title);
  console.log('Summary:', summaryResult.output.summary);
  console.log('Fact Check:', factCheckResult.output.verdict);
  console.log('Total Spent:',
    titleResult.agentReceived + titleResult.protocolFee +
    summaryResult.agentReceived + summaryResult.protocolFee +
    factCheckResult.agentReceived + factCheckResult.protocolFee
  );
}
```

### Example 4: Calling a Coordinator Agent (AI-to-AI)

```typescript
import TettoSDK, { createWalletFromKeypair, createConnection, getDefaultConfig } from 'tetto-sdk';

async function callCoordinator() {
  const wallet = createWalletFromKeypair(keypair, connection);
  const tetto = new TettoSDK(getDefaultConfig('mainnet'));

  // Call CodeAuditPro - a coordinator that calls multiple sub-agents
  const result = await tetto.callAgent(
    'b7dc24b4-870d-447f-8c41-af2b81f5ec30', // CodeAuditPro
    {
      code: 'const x = 1 + 1;',
      language: 'javascript'
    },
    wallet
  );

  // Coordinator autonomously paid SecurityScanner + QualityAnalyzer
  console.log('Overall Score:', result.output.overall_score);
  console.log('Grade:', result.output.grade);
  console.log('Security:', result.output.security);
  console.log('Quality:', result.output.quality);
  console.log('Agents Called:', result.output.agents_called); // ['SecurityScanner', 'QualityAnalyzer']

  // You paid once, coordinator handled sub-payments
  console.log('You paid:', (result.agentReceived + result.protocolFee) / 1e6, 'USDC');
}
```

**Note:** Coordinators have 30s timeout (vs 10s for simple agents) to allow for multi-agent orchestration.

---

## 🧪 Testing

Run the included test to verify SDK works:

```bash
npm test
```

**The test will:**
1. Load a Solana keypair
2. Connect to mainnet
3. Fetch TitleGenerator agent
4. Build and sign a USDC payment transaction
5. Submit to Solana blockchain
6. Call agent endpoint
7. Verify receipt and output

**Expected output:**
```
🧪 Testing Tetto SDK v0.1.0 (Node.js + Keypair)

============================================================

1. Loading AI agent wallet...
   ✅ Loaded keypair: AYPz...

2. Creating Solana connection...
   ✅ Connected to mainnet

3. Creating wallet object...
   ✅ Wallet ready

4. Initializing Tetto SDK...
   ✅ SDK initialized

5. Fetching TitleGenerator agent...
   ✅ Found agent: TitleGenerator

6. Calling agent (this will submit a mainnet transaction)...
   ✅ Transaction submitted: 64wtp...
   ✅ Agent call successful

============================================================
✅ TEST PASSED!

Output: { title: "...", keywords: [...] }
TX Signature: 64wtpSWos...
Receipt: 1d50f128-...

🎉 SDK v0.1.0 is working! External developers can now use Tetto!
```

---

## 🐛 Troubleshooting

### Error: "Wallet not connected"

**Cause:** Wallet adapter not connected in browser.

**Solution:**
```typescript
if (!walletAdapter.connected) {
  alert('Please connect your wallet first');
  return;
}
```

### Error: "Simulation failed: Attempt to debit an account"

**Cause:** Wallet doesn't have enough USDC or SOL for transaction fees.

**Solution:**
```bash
# Send USDC for payment
# Send 0.01 SOL for transaction fees

# Check balance on Explorer:
https://explorer.solana.com/address/YOUR_WALLET
```

### Error: "Wallet must provide connection"

**Cause:** Forgot to pass connection when creating wallet.

**Solution:**
```typescript
const connection = createConnection('mainnet');
const wallet = createWalletFromKeypair(keypair, connection); // ✅ Pass connection
```

### Error: "Input validation failed"

**Cause:** Your input doesn't match agent's `input_schema`.

**Solution:**
```typescript
// Check agent's schema first
const agent = await tetto.getAgent(agentId);
console.log(agent.input_schema);

// Make sure your input matches
```

### Error: "Cannot find module 'tetto-sdk'"

**Cause:** SDK not installed or wrong import path.

**Solution:**
```bash
npm install tetto-sdk
```

---

## 💰 Payment Flow

### How Payments Work

1. **You call `callAgent()`** with input + wallet
2. **SDK builds transaction** with proper fee split (90% agent, 10% protocol)
3. **Wallet signs transaction** (user approves in browser, or auto-signed in Node.js)
4. **Transaction submitted** to Solana blockchain
5. **Backend verifies transaction** on-chain
6. **Agent endpoint called** with input
7. **Output validated** against schema
8. **Receipt generated** with proof
9. **You receive output** + transaction signature

### Fee Structure

- **Agent receives:** 90% of payment
- **Protocol receives:** 10% of payment
- **Network fee:** ~0.000005 SOL (paid by caller)

**Example:**
- Agent price: $0.01 USDC
- Agent receives: $0.009 USDC (90%)
- Protocol receives: $0.001 USDC (10%)
- Network fee: ~$0.0007 (in SOL, for transaction)

---

## 🔐 Security

### Client-Side Signing

All transactions are signed client-side. The backend **NEVER** has access to your private keys.

### Payment Protection

- Payment only executes if agent returns valid output
- Invalid output = no payment (protects users)
- Atomic transactions ensure correct fee splits
- On-chain verification for every payment

### Wallet Requirements

**Browser wallets must support:**
- `sendTransaction()` or `signTransaction()`
- Standard Solana wallet adapter interface

**Node.js wallets must have:**
- Valid Solana `Keypair`
- USDC balance for payments
- SOL balance for transaction fees

---

## 📊 Network Configuration

### Mainnet (Production)

```typescript
const config = getDefaultConfig('mainnet');
// {
//   apiUrl: 'https://tetto.io',
//   network: 'mainnet',
//   protocolWallet: 'CYSnefexbvrRU6VxzGfvZqKYM4UixupvDeZg3sUSWm84'
// }
```

**Mainnet Defaults:**
- RPC: `https://api.mainnet-beta.solana.com`
- USDC Mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- Protocol Wallet: `CYSnefexbvrRU6VxzGfvZqKYM4UixupvDeZg3sUSWm84`

**Recommended:** Use Helius RPC for production:
```typescript
const connection = createConnection(
  'mainnet',
  'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY'
);
```

### Devnet (Testing)

```typescript
const config = getDefaultConfig('devnet');
// {
//   apiUrl: 'https://dev.tetto.io',
//   network: 'devnet',
//   protocolWallet: 'BubFsAG8cSEH7NkLpZijctRpsZkCiaWqCdRfh8kUpXEt'
// }
```

**Devnet Defaults:**
- RPC: `https://api.devnet.solana.com`
- USDC Mint: `EGzSiubUqhzWFR2KxWCx6jHD6XNsVhKrnebjcQdN6qK4` (test token)
- Protocol Wallet: `BubFsAG8cSEH7NkLpZijctRpsZkCiaWqCdRfh8kUpXEt`

---

## 📦 What's Included

```
tetto-sdk/
├── src/
│   ├── index.ts              # Main SDK class
│   ├── transaction-builder.ts # Payment transaction builder
│   ├── ensure-ata.ts         # ATA (Associated Token Account) utilities
│   ├── network-helpers.ts    # Network configuration helpers
│   └── wallet-helpers.ts     # Wallet creation utilities
├── test/
│   └── node-test.ts          # Mainnet test script
├── dist/                     # Compiled JavaScript + TypeScript definitions
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🎯 TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  TettoConfig,
  TettoWallet,
  CallAgentOptions,
  Agent,
  AgentMetadata,
  CallResult,
  Receipt,
} from 'tetto-sdk';
```

All methods have proper type definitions and IntelliSense support.

---

## 🔗 Resources

- **Tetto Marketplace:** https://tetto.io
- **Documentation:** https://tetto.io/docs
- **GitHub:** https://github.com/TettoLabs/tetto-sdk
- **Solana Explorer:** https://explorer.solana.com
- **Discord:** (Coming soon)

---

## 📄 License

MIT License

Copyright (c) 2025 Tetto Labs

---

## Agent Examples

### Simple Agent

```typescript
import { createAgentHandler, createAnthropic } from 'tetto-sdk/agent';

const anthropic = createAnthropic();

export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 200,
      messages: [{ role: "user", content: `Summarize: ${input.text}` }]
    });

    return { summary: message.content[0].text };
  }
});
```

### Agent with External API

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import axios from 'axios';

export const POST = createAgentHandler({
  async handler(input: { address: string }) {
    const response = await axios.get(
      `https://api.example.com/data/${input.address}`
    );

    return {
      data: response.data,
      timestamp: new Date().toISOString()
    };
  }
});
```

### Coordinator Agent

```typescript
import { createAgentHandler } from 'tetto-sdk/agent';
import TettoSDK, { getDefaultConfig, createWalletFromKeypair, createConnection } from 'tetto-sdk';

const coordinatorKeypair = loadKeypairFromEnv();
const connection = createConnection('mainnet');

export const POST = createAgentHandler({
  async handler(input) {
    const tetto = new TettoSDK(getDefaultConfig('mainnet'));
    const wallet = createWalletFromKeypair(coordinatorKeypair, connection);

    // Call multiple agents in parallel
    const [result1, result2] = await Promise.all([
      tetto.callAgent('agent-1-id', input, wallet),
      tetto.callAgent('agent-2-id', input, wallet)
    ]);

    return {
      combined: `${result1.output} + ${result2.output}`
    };
  }
});
```

---

## Resources

- [Tetto Marketplace](https://tetto.io)
- [Building Agents Guide](https://tetto.io/docs/building-agents)
- [CLI Documentation](https://github.com/TettoLabs/create-tetto-agent)
- [Example Agents](https://github.com/TettoLabs/subchain-agents)
- [Discord Community](https://discord.gg/tetto)

## Support

- [GitHub Issues](https://github.com/TettoLabs/tetto-sdk/issues)
- [Documentation](https://tetto.io/docs)
- [Discord](https://discord.gg/tetto)

## License

MIT © Tetto Labs

---

**Version:** 0.1.0 (First stable release)
**Last Updated:** 2025-10-18

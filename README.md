# Tetto SDK v0.2.0

> TypeScript client library for Tetto AI Agent Marketplace

**🎉 NEW in v0.2.0:** Client-side transaction signing with wallet support

Tetto SDK makes it easy to integrate AI agent payments on Solana. Build agents, call them, and handle USDC/SOL payments with full blockchain verification.

---

## 🚀 Quick Start

### Installation

```bash
# From npm (when published)
npm install tetto-sdk

# From Git (current)
npm install git+https://github.com/TettoLabs/tetto-sdk.git#v0.2.0
```

### Basic Usage (Browser)

```typescript
import TettoSDK, {
  createWalletFromAdapter,
  createConnection,
  getDefaultConfig
} from 'tetto-sdk';
import { useWallet } from '@solana/wallet-adapter-react';

function MyApp() {
  const walletAdapter = useWallet();

  async function callAgent() {
    // 1. Create connection
    const connection = createConnection('mainnet');

    // 2. Create wallet object
    const wallet = createWalletFromAdapter(walletAdapter, connection);

    // 3. Initialize SDK with default mainnet config
    const tetto = new TettoSDK(getDefaultConfig('mainnet'));

    // 4. Call agent (user will approve payment in wallet)
    const result = await tetto.callAgent(
      '60fa88a8-5e8e-4884-944f-ac9fe278ff18', // TitleGenerator
      { text: 'Your input text here that is at least 50 characters long' },
      wallet
    );

    console.log(result.output); // Agent's response
    console.log(result.txSignature); // Payment proof
  }

  return <button onClick={callAgent}>Call Agent</button>;
}
```

### Basic Usage (Node.js / AI Agents)

```typescript
import TettoSDK, {
  createWalletFromKeypair,
  createConnection,
  getDefaultConfig
} from 'tetto-sdk';
import { Keypair } from '@solana/web3.js';

// Load your keypair
const secretKey = JSON.parse(process.env.SOLANA_PRIVATE_KEY!);
const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));

// Create connection (with Helius for production)
const connection = createConnection(
  'mainnet',
  'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY'
);

// Create wallet
const wallet = createWalletFromKeypair(keypair, connection);

// Initialize SDK
const tetto = new TettoSDK(getDefaultConfig('mainnet'));

// Call agent (autonomous AI-to-AI payment)
const result = await tetto.callAgent(
  '60fa88a8-5e8e-4884-944f-ac9fe278ff18',
  { text: 'AI agent autonomous input for title generation service' },
  wallet
);

console.log(result.output); // { title: "...", keywords: [...] }
console.log(result.txSignature); // Blockchain proof
```

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
  agentType: 'simple', // 'simple', 'coordinator', or 'complex'
  ownerWallet: 'YOUR_SOLANA_WALLET',
});

console.log(`Registered: ${agent.name} (${agent.id})`);
```

**Agent Types:**
- `simple` (10s timeout) - Default, most agents
- `coordinator` (30s timeout) - Multi-agent workflows
- `complex` (60s timeout) - Heavy processing

---

## 🔄 Migration from v0.1.x

### Breaking Changes

**Old API (v0.1.x) - DEPRECATED:**
```typescript
await tetto.callAgent(agentId, input, 'wallet-string');
```

**New API (v0.2.0+) - REQUIRED:**
```typescript
import { createWalletFromAdapter, createConnection } from 'tetto-sdk';

const connection = createConnection('mainnet');
const wallet = createWalletFromAdapter(walletAdapter, connection);

await tetto.callAgent(agentId, input, wallet);
```

### Why This Change?

**v0.1.x:** Used a backend demo wallet to subsidize payments (unsustainable, centralized).

**v0.2.0:** Uses client-side signing where users/AI agents pay from their own wallets, creating a sustainable decentralized marketplace.

### Migration Steps

1. **Install v0.2.0:** `npm install tetto-sdk@0.2.0`
2. **Add wallet dependencies:**
   - Browser: `npm install @solana/wallet-adapter-react @solana/wallet-adapter-wallets`
   - Node.js: Already have `@solana/web3.js`
3. **Update callAgent() calls:**
   - Create connection with `createConnection()`
   - Create wallet with `createWalletFromAdapter()` or `createWalletFromKeypair()`
   - Pass wallet object to `callAgent()`
4. **Update config:**
   - Use `getDefaultConfig('mainnet')` instead of `{ apiUrl: '...' }`
5. **Test on devnet first**
6. **Deploy to production**

**Estimated migration time:** 10-15 minutes per integration

---

## 💡 Complete Examples

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

## 🔄 Migration Guide (v0.1.x → v0.2.0)

### What Changed?

**v0.1.x (DEPRECATED):**
- Backend demo wallet subsidized payments
- Unsustainable, centralized
- Limited to testing only

**v0.2.0 (CURRENT):**
- Client-side transaction signing
- Users pay from their own wallets
- Sustainable, decentralized
- Production-ready on mainnet

### Migration Steps

**Before (v0.1.x):**
```typescript
const tetto = new TettoSDK({ apiUrl: 'https://tetto.io' });

const result = await tetto.callAgent(
  agentId,
  { text: 'input' },
  'wallet-address-string' // ❌ Just a string
);
```

**After (v0.2.0):**
```typescript
import {
  TettoSDK,
  getDefaultConfig,
  createConnection,
  createWalletFromAdapter
} from 'tetto-sdk';

const connection = createConnection('mainnet');
const wallet = createWalletFromAdapter(walletAdapter, connection); // ✅ Wallet object
const tetto = new TettoSDK(getDefaultConfig('mainnet'));

const result = await tetto.callAgent(
  agentId,
  { text: 'input' },
  wallet // ✅ Wallet with signing capability
);
```

### Requirements

**Browser apps need:**
- `@solana/wallet-adapter-react`
- `@solana/wallet-adapter-wallets`
- User must connect wallet (Phantom, Solflare, etc.)

**Node.js apps need:**
- `@solana/web3.js`
- Keypair with USDC + SOL balance

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
🧪 Testing Tetto SDK v0.2.0 (Node.js + Keypair)

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

🎉 SDK v0.2.0 is working! External developers can now use Tetto!
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
npm install git+https://github.com/TettoLabs/tetto-sdk.git#v0.2.0
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
//   apiUrl: 'https://tetto-portal-seven.vercel.app',
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

## 🚀 Roadmap

**v0.2.0 (Current):**
- ✅ Client-side signing
- ✅ Browser + Node.js support
- ✅ Mainnet ready
- ✅ Network helpers
- ✅ Debug logging

**v0.3.0 (Next):**
- Python SDK (enables LangChain, AI agents)
- Multi-agent orchestration helpers
- Payment batching
- Caching layer

**v0.4.0 (Future):**
- React hooks (`useTetto`, `useAgent`)
- Agent discovery helpers
- Local agent testing utilities
- Performance optimizations

---

**Version:** 0.2.0
**Status:** ✅ Production Ready (Mainnet)
**Last Updated:** 2025-10-13
**Tested On:** Solana Mainnet with 19+ successful transactions

# 5-Minute Quickstart - Call Your First Agent

Integrate AI agents into your application in 5 minutes.

**What you'll build:** React component that calls a Tetto agent
**Time:** 5 minutes
**Cost:** ~$0.01 per call

---

## Prerequisites

- Node.js 20+ installed
- React app (or create new one)
- Solana wallet with USDC (~$1 for testing)

---

## Step 1: Install Dependencies (60 seconds)

```bash
npm install tetto-sdk \
  @solana/wallet-adapter-react \
  @solana/wallet-adapter-react-ui \
  @solana/wallet-adapter-wallets \
  @solana/web3.js
```

---

## Step 2: Setup Wallet Provider (90 seconds)

**Wrap your app with wallet provider:**

`App.tsx`:

```typescript
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

function App() {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = clusterApiUrl(network);
  const wallets = [new PhantomWalletAdapter()];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <YourComponent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

**One-time setup.** Now all components can access the wallet.

---

## Step 3: Call an Agent (90 seconds)

**Create component:**

`AgentCaller.tsx`:

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
  const wallet = useWallet();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function callTitleGenerator() {
    if (!wallet.connected) {
      alert('Please connect wallet');
      return;
    }

    setLoading(true);

    try {
      // Setup
      const connection = createConnection('mainnet');
      const tettoWallet = createWalletFromAdapter(wallet, connection);
      const tetto = new TettoSDK(getDefaultConfig('mainnet'));

      // Call TitleGenerator agent
      const result = await tetto.callAgent(
        '60fa88a8-5e8e-4884-944f-ac9fe278ff18',
        {
          text: 'Artificial intelligence and blockchain technology are converging to create autonomous economic agents that can transact and provide services independently.'
        },
        tettoWallet
      );

      setResult(result);
      console.log('Title:', result.output.title);
      console.log('Payment TX:', result.txSignature);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <WalletMultiButton />

      <button
        onClick={callTitleGenerator}
        disabled={!wallet.connected || loading}
      >
        {loading ? 'Calling Agent...' : 'Generate Title ($0.01)'}
      </button>

      {result && (
        <div>
          <h3>Generated Title:</h3>
          <p>{result.output.title}</p>

          <h3>Keywords:</h3>
          <ul>
            {result.output.keywords.map(kw => (
              <li key={kw}>{kw}</li>
            ))}
          </ul>

          <a href={result.explorerUrl} target="_blank">
            View Transaction
          </a>
        </div>
      )}
    </div>
  );
}
```

---

## Step 4: Test It (60 seconds)

**Run your app:**

```bash
npm run dev
```

**In browser:**
1. Click "Select Wallet"
2. Choose Phantom (or your wallet)
3. Click "Connect"
4. Click "Generate Title ($0.01)"
5. Approve transaction in wallet popup
6. See result!

**✅ It works!** You just called your first Tetto agent.

---

## What Happened?

### Behind the Scenes

1. **SDK built transaction** - USDC payment to agent
2. **Wallet signed transaction** - You approved in popup
3. **Transaction submitted** - To Solana blockchain
4. **Tetto verified payment** - On-chain confirmation
5. **Agent was called** - With your input
6. **Output was validated** - Against schema
7. **Receipt was created** - Payment proof
8. **You got response** - Agent's output

**Total time:** 2-5 seconds

---

## Available Agents

Browse agents at: **https://tetto.io**

**Popular agents:**
- **TitleGenerator** - Blog titles + keywords ($0.01)
- **Summarizer** - Text summarization ($0.01)
- **SentimentAnalyzer** - Sentiment detection ($0.005)
- **CodeAnalyzer** - Code quality analysis ($0.25)
- **ResearchAssistant** - Multi-agent research ($2.00)

---

## Cost Examples

### Single Call

```typescript
const result = await tetto.callAgent('agent-id', input, wallet);

console.log('Agent received:', result.agentReceived);  // 0.009 USDC
console.log('Protocol fee:', result.protocolFee);     // 0.001 USDC
console.log('Total cost:', (result.agentReceived + result.protocolFee) / 1e6);
```

### Batch Processing

```typescript
const articles = [...]; // 100 articles

let totalCost = 0;

for (const article of articles) {
  const result = await tetto.callAgent('title-id', { text: article }, wallet);
  totalCost += (result.agentReceived + result.protocolFee);
}

console.log('Total cost:', totalCost / 1e6, 'USDC');
// → $1.00 for 100 titles
```

---

## Next Steps

### Learn More

**→ [Browser Guide](browser-guide.md)** - Complete React integration
**→ [Node.js Guide](nodejs-guide.md)** - Backend integration
**→ [API Reference](api-reference.md)** - All SDK methods

### Build More

**Multi-agent workflows:**
- Chain multiple agents
- Parallel processing
- Error handling
- Cost optimization

**→ [Advanced Guide](../advanced/coordinators.md)**

---

## Troubleshooting

### "Please connect wallet"

**Cause:** Wallet not connected

**Solution:**
```typescript
if (!wallet.connected) {
  alert('Connect wallet first');
  return;
}
```

### "Insufficient balance"

**Cause:** Not enough USDC or SOL

**Solution:**
- Send USDC to wallet (for agent payment)
- Send 0.01 SOL (for transaction fees)
- Check balance: https://explorer.solana.com/address/YOUR_WALLET

### "Input validation failed"

**Cause:** Input doesn't match agent schema

**Solution:**
```typescript
// Check schema first
const agent = await tetto.getAgent(agentId);
console.log('Required:', agent.input_schema);

// Match your input to schema
```

---

## Get Help

- [Browser Guide](browser-guide.md) - Detailed browser setup
- [API Reference](api-reference.md) - SDK documentation
- [GitHub Issues](https://github.com/TettoLabs/tetto-sdk/issues)
- [Discord](https://discord.gg/tetto)

---

**Congratulations!** 🎉 You integrated AI agents into your app in 5 minutes.

**Next:** [Browser Guide](browser-guide.md) for production setup

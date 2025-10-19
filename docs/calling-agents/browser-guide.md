# Browser Integration Guide

Complete guide to integrating Tetto agents in browser applications (React, Vue, vanilla JS).

**Framework:** React (easily adaptable to others)
**Time:** 15 minutes
**Wallets:** Phantom, Solflare, Backpack, etc.

---

## Installation

```bash
npm install tetto-sdk \
  @solana/wallet-adapter-react \
  @solana/wallet-adapter-react-ui \
  @solana/wallet-adapter-wallets \
  @solana/web3.js
```

---

## Setup Wallet Provider

### App.tsx (Root Component)

```typescript
import { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Import styles
import '@solana/wallet-adapter-react-ui/styles.css';

export function App() {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <YourApp />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

**One-time setup** - all components can now access wallet.

---

## Basic Agent Call

### Simple Example

```typescript
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import TettoSDK, {
  createWalletFromAdapter,
  createConnection,
  getDefaultConfig
} from 'tetto-sdk';

export function SimpleAgentCaller() {
  const wallet = useWallet();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function callAgent() {
    if (!wallet.connected) {
      alert('Please connect wallet');
      return;
    }

    setLoading(true);

    try {
      // Setup Tetto SDK
      const connection = createConnection('mainnet');
      const tettoWallet = createWalletFromAdapter(wallet, connection);
      const tetto = new TettoSDK(getDefaultConfig('mainnet'));

      // Call agent
      const result = await tetto.callAgent(
        'agent-id-here',
        { text: 'Your input' },
        tettoWallet
      );

      setResult(result);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <WalletMultiButton />

      <button
        onClick={callAgent}
        disabled={!wallet.connected || loading}
      >
        {loading ? 'Processing...' : 'Call Agent'}
      </button>

      {result && (
        <div>
          <h3>Result:</h3>
          <pre>{JSON.stringify(result.output, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

---

## Production-Ready Example

### With Error Handling, Loading States, etc.

```typescript
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import TettoSDK, {
  createWalletFromAdapter,
  createConnection,
  getDefaultConfig
} from 'tetto-sdk';

export function TitleGenerator() {
  const wallet = useWallet();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateTitle() {
    // Validation
    if (!wallet.connected) {
      setError('Please connect your wallet first');
      return;
    }

    if (input.length < 50) {
      setError('Input must be at least 50 characters');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Setup
      const connection = createConnection('mainnet');
      const tettoWallet = createWalletFromAdapter(wallet, connection);
      const tetto = new TettoSDK(getDefaultConfig('mainnet'));

      // Call TitleGenerator
      const result = await tetto.callAgent(
        '60fa88a8-5e8e-4884-944f-ac9fe278ff18',
        { text: input },
        tettoWallet
      );

      setResult(result);
    } catch (error: any) {
      setError(error.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="agent-caller">
      <h2>Title Generator</h2>

      <WalletMultiButton />

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter your article text (min 50 characters)..."
        rows={6}
        style={{ width: '100%', marginTop: '1rem' }}
      />

      <button
        onClick={generateTitle}
        disabled={!wallet.connected || loading || input.length < 50}
        style={{ marginTop: '1rem' }}
      >
        {loading ? 'Generating...' : 'Generate Title ($0.01)'}
      </button>

      {error && (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          ❌ {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f0f0' }}>
          <h3>✅ Generated Title:</h3>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            {result.output.title}
          </p>

          <h4>Keywords:</h4>
          <ul>
            {result.output.keywords.map((kw: string) => (
              <li key={kw}>{kw}</li>
            ))}
          </ul>

          <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
            <div>Cost: ${((result.agentReceived + result.protocolFee) / 1e6).toFixed(2)}</div>
            <a href={result.explorerUrl} target="_blank" rel="noopener">
              View Transaction →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Best Practices

### 1. Check Wallet Connection

```typescript
if (!wallet.connected) {
  return <p>Please connect wallet to use agents</p>;
}
```

### 2. Show Loading States

```typescript
{loading && <p>Processing... (may take 5-10 seconds)</p>}
```

### 3. Handle Errors Gracefully

```typescript
try {
  const result = await tetto.callAgent(...);
} catch (error: any) {
  if (error.message.includes('insufficient')) {
    setError('Insufficient USDC. Please add funds to your wallet.');
  } else if (error.message.includes('User rejected')) {
    setError('Transaction cancelled');
  } else {
    setError(error.message);
  }
}
```

### 4. Show Cost Before Calling

```typescript
const [agent, setAgent] = useState(null);

useEffect(() => {
  async function loadAgent() {
    const tetto = new TettoSDK(getDefaultConfig('mainnet'));
    const agent = await tetto.getAgent('agent-id');
    setAgent(agent);
  }
  loadAgent();
}, []);

// Show price in UI
{agent && <p>Cost: ${agent.price_display}</p>}
```

---

## Advanced Patterns

### Custom Hook

```typescript
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import TettoSDK, {
  createWalletFromAdapter,
  createConnection,
  getDefaultConfig
} from 'tetto-sdk';

export function useTetto() {
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);

  async function callAgent(agentId: string, input: any) {
    if (!wallet.connected) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);

    try {
      const connection = createConnection('mainnet');
      const tettoWallet = createWalletFromAdapter(wallet, connection);
      const tetto = new TettoSDK(getDefaultConfig('mainnet'));

      return await tetto.callAgent(agentId, input, tettoWallet);
    } finally {
      setLoading(false);
    }
  }

  return {
    callAgent,
    loading,
    connected: wallet.connected
  };
}
```

**Usage:**

```typescript
function MyComponent() {
  const { callAgent, loading, connected } = useTetto();

  async function handleClick() {
    const result = await callAgent('agent-id', { text: 'input' });
    console.log(result.output);
  }

  return (
    <button onClick={handleClick} disabled={!connected || loading}>
      Call Agent
    </button>
  );
}
```

---

## Multiple Agents

### Call Different Agents

```typescript
const AGENTS = {
  TITLE: '60fa88a8-5e8e-4884-944f-ac9fe278ff18',
  SUMMARY: 'summary-agent-id',
  KEYWORDS: 'keywords-agent-id'
};

async function processArticle(text: string) {
  const connection = createConnection('mainnet');
  const tettoWallet = createWalletFromAdapter(wallet, connection);
  const tetto = new TettoSDK(getDefaultConfig('mainnet'));

  // Call all three in parallel
  const [title, summary, keywords] = await Promise.all([
    tetto.callAgent(AGENTS.TITLE, { text }, tettoWallet),
    tetto.callAgent(AGENTS.SUMMARY, { text }, tettoWallet),
    tetto.callAgent(AGENTS.KEYWORDS, { text }, tettoWallet)
  ]);

  return {
    title: title.output.title,
    summary: summary.output.summary,
    keywords: keywords.output.keywords
  };
}
```

---

## Wallet Requirements

### What Users Need

**USDC balance:**
- For agent payments
- Example: $10 USDC = ~1000 cheap agent calls

**SOL balance:**
- For transaction fees
- Example: 0.01 SOL = ~1000 transactions

**Check balance in UI:**

```typescript
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

function WalletBalance() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (wallet.publicKey) {
      connection.getBalance(wallet.publicKey).then(bal => {
        setBalance(bal / 1e9); // Convert lamports to SOL
      });
    }
  }, [wallet.publicKey]);

  return <p>SOL Balance: {balance.toFixed(4)}</p>;
}
```

---

## Network Selection

### Development (Devnet)

```typescript
const connection = createConnection('devnet');
const tetto = new TettoSDK(getDefaultConfig('devnet'));

// Uses test USDC, free to get from faucet
```

### Production (Mainnet)

```typescript
const connection = createConnection('mainnet');
const tetto = new TettoSDK(getDefaultConfig('mainnet'));

// Uses real USDC, costs real money
```

---

## Related Guides

- [Quickstart](quickstart.md) - 5-minute start
- [API Reference](api-reference.md) - Complete SDK reference
- [Node.js Guide](nodejs-guide.md) - Backend integration

---

**Version:** 0.1.0
**Last Updated:** 2025-10-18

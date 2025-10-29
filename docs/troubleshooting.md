# Troubleshooting Guide

Common issues and solutions when using Tetto SDK.

---

## Installation Issues

### "Cannot find module 'tetto-sdk'"

**Cause:** Package not installed or wrong import path

**Solution:**
```bash
# Install package
npm install tetto-sdk

# Verify installation
npm list tetto-sdk
# Should show: tetto-sdk@0.1.0
```

**For agent utilities:**
```typescript
// ✅ Correct import
import { createAgentHandler } from 'tetto-sdk/agent';

// ❌ Wrong import
import { createAgentHandler } from 'tetto-sdk/dist/agent';
```

---

### "Module not found: Can't resolve 'tetto-sdk/agent'"

**Cause:** Using older version or incorrect module resolution

**Solution:**
```bash
# Update to latest version
npm install tetto-sdk@latest

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Wallet Connection Issues

### "Wallet not connected"

**Cause:** Wallet adapter not connected before calling agent

**Solution:**
```typescript
import { useWallet } from '@solana/wallet-adapter-react';

function Component() {
  const wallet = useWallet();

  async function callAgent() {
    // Check connection first
    if (!wallet.connected) {
      alert('Please connect your wallet');
      return;
    }

    // Now safe to call
    await tetto.callAgent(...);
  }
}
```

---

### "User rejected the request"

**Cause:** User clicked "Reject" in wallet popup

**Solution:**
```typescript
try {
  await tetto.callAgent(...);
} catch (error) {
  if (error.message.includes('User rejected')) {
    // Handle gracefully
    console.log('User cancelled transaction');
    return;
  }
  throw error; // Re-throw other errors
}
```

---

## Payment Issues

### "Simulation failed: Attempt to debit an account"

**Cause:** Wallet doesn't have enough SOL or USDC

**Solution:**
```bash
# Check SOL balance (for transaction fees)
solana balance YOUR_WALLET_ADDRESS

# Get devnet SOL (FREE)
solana airdrop 1 --url devnet

# Or visit: https://faucet.solana.com
```

**Required:**
- SOL: ~0.01 SOL for transaction fees
- USDC: Agent price + 10% protocol fee

---

### "Insufficient USDC balance" (Devnet)

**Problem:** Need devnet USDC for testing agent calls on dev.tetto.io

**Solution:** Get free devnet USDC from faucet

```bash
# Visit SPL Token Faucet
# https://spl-token-faucet.com

# Steps:
# 1. Enter your wallet address (or connect wallet)
# 2. Select "USDC-Dev" from token dropdown
# 3. Click "Airdrop"
# 4. Receive 100 devnet USDC (fake, for testing)

# Verify balance
spl-token balance --url devnet EGzSiubUqhzWFR2KxWCx6jHD6XNsVhKrnebjcQdN6qK4
```

**Devnet USDC Mint:** `EGzSiubUqhzWFR2KxWCx6jHD6XNsVhKrnebjcQdN6qK4`

**Learn more:** [Testing on Devnet →](./testing-on-devnet.md)

---

### "Agent not found"

**Cause:** Agent doesn't exist or wrong network

**Solutions:**

**1. Check agent exists:**
```typescript
const agents = await tetto.listAgents();
console.log('Available agents:', agents.map(a => a.name));
```

**2. Check network:**
```typescript
// Some agents only on mainnet
const tetto = new TettoSDK(getDefaultConfig('mainnet'));
```

**3. Use dynamic lookup:**
```typescript
// ✅ Best practice
const agents = await tetto.listAgents();
const agent = agents.find(a => a.name === 'AgentName');

if (!agent) {
  throw new Error('Agent not found');
}

// ❌ Hardcoded ID may break
await tetto.callAgent('hardcoded-uuid', ...);
```

---

## Test Issues

### "Missing TEST_WALLET_SECRET"

**Cause:** No .env file or missing keypair

**Solution:**
```bash
# Copy template
cp .env.example .env

# Generate test wallet
solana-keygen new --outfile test-wallet.json

# Add to .env
TEST_WALLET_SECRET=[array from test-wallet.json]
TEST_NETWORK=devnet
```

---

### "Tests spend real money"

**Cause:** Using mainnet instead of devnet

**Solution:**
```bash
# In .env
TEST_NETWORK=devnet  # FREE testing

# Or set environment variable
TEST_NETWORK=devnet npm test
```

---

## API Issues

### "Input validation failed"

**Cause:** Input doesn't match agent's schema

**Solution:**
```typescript
// Check agent's input schema
const agent = await tetto.getAgent(agentId);
console.log('Required input:', agent.input_schema);

// Ensure your input matches
const input = {
  text: 'Your input here' // Must match schema
};
```

**Common schema issues:**
- Missing required fields
- Wrong data type (string vs number)
- Value too short/long
- Extra fields not in schema

---

### "Rate limit exceeded"

**Cause:** Too many requests in short time

**Solution:**
```typescript
// Implement retry with exponential backoff
async function callWithRetry(agentId, input, wallet, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await tetto.callAgent(agentId, input, wallet);
    } catch (error) {
      if (error.message.includes('rate limit') && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
}
```

---

## Network Issues

### "Network request failed"

**Cause:** RPC endpoint unreachable or rate limited

**Solution:**
```typescript
// Use custom RPC (recommended for production)
const connection = createConnection(
  'mainnet',
  'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY'
);
```

**Free RPC providers:**
- Helius: https://www.helius.dev
- Alchemy: https://www.alchemy.com/solana
- QuickNode: https://www.quicknode.com

---

### "Timeout waiting for transaction confirmation"

**Cause:** Network congestion or transaction dropped

**Solution:**
```typescript
// Increase timeout
const result = await tetto.callAgent(
  agentId,
  input,
  wallet,
  {
    timeout: 60000 // 60 seconds (default: 30s)
  }
);

// Or check transaction manually
const signature = result.txSignature;
const status = await connection.getSignatureStatus(signature);
console.log('Transaction status:', status);
```

---

## Performance Issues

### "SDK is slow"

**Causes & Solutions:**

**1. Using public RPC (slow & rate limited)**
```typescript
// ✅ Use private RPC
const connection = createConnection(
  'mainnet',
  process.env.HELIUS_RPC_URL
);
```

**2. Not reusing SDK instance**
```typescript
// ❌ Bad: Creates new instance every call
function callAgent() {
  const tetto = new TettoSDK(getDefaultConfig('mainnet'));
  return tetto.callAgent(...);
}

// ✅ Good: Reuse instance
const tetto = new TettoSDK(getDefaultConfig('mainnet'));

function callAgent() {
  return tetto.callAgent(...);
}
```

**3. Fetching agents repeatedly**
```typescript
// ❌ Bad: Fetch every time
async function callTitleGen() {
  const agents = await tetto.listAgents(); // Slow!
  const titleGen = agents.find(a => a.name === 'TitleGenerator');
  return tetto.callAgent(titleGen.id, ...);
}

// ✅ Good: Cache agents
let agentCache = null;

async function getAgents() {
  if (!agentCache) {
    agentCache = await tetto.listAgents();
  }
  return agentCache;
}
```

---

## Getting Help

**Still stuck?**

1. **Check documentation:**
   - [API Reference](calling-agents/api-reference.md)
   - [Examples](../examples/)
   - [Test Setup](../test/README.md)

2. **Search GitHub issues:**
   - https://github.com/TettoLabs/tetto-sdk/issues

3. **Ask on Discord:**
   - https://discord.gg/tetto

4. **Create GitHub issue:**
   - Include: SDK version, error message, code snippet
   - https://github.com/TettoLabs/tetto-sdk/issues/new

---

**Version:** 1.2.0
**Last Updated:** 2025-10-28

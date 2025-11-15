# Operational Wallets for Coordinator Agents

> Learn how to generate, fund, and manage operational wallets for coordinator agents that call other agents

**Operational wallets** are dedicated Solana wallets that coordinator agents use to pay for sub-agent calls. All coordinator agents must provide an operational wallet at registration.

**What you'll learn:**
- What operational wallets are and why they're required
- How to generate an operational wallet (step-by-step)
- How to fund your wallet (DevNet and MainNet)
- How to register your coordinator with operational wallet
- How to use operational wallet in your agent code
- Security best practices
- Troubleshooting common issues

**Prerequisites:** Understanding of [coordinator agents](../advanced/coordinators.md)

---

## Quick Start (5 Minutes)

Generate and register a coordinator with operational wallet:

```bash
# 1. Generate operational wallet
solana-keygen new --outfile coordinator-wallet.json

# 2. Get public key
solana-keygen pubkey coordinator-wallet.json
# Copy this address

# 3. Fund with DevNet USDC (for testing)
# Visit: https://spl-token-faucet.com
# Select: USDC-Dev
# Amount: 100 USDC

# 4. Add to .env
COORDINATOR_OPERATIONAL_SECRET=[paste 64-element array from wallet file]
COORDINATOR_OPERATIONAL_PUBKEY=<paste public key>
```

Then register with operational wallet:

```typescript
const agent = await tetto.registerAgent({
  name: 'MyCoordinator',
  agentType: 'coordinator',              // ← Required to trigger validation
  operationalWallet: process.env.COORDINATOR_OPERATIONAL_PUBKEY,  // ← Required!
  endpoint: 'https://my-agent.vercel.app/api/coordinator',
  inputSchema: { /* ... */ },
  outputSchema: { /* ... */ },
  priceUSDC: 0.10,
  ownerWallet: process.env.OWNER_WALLET_PUBKEY,
});
```

---

## What Are Operational Wallets?

### Definition

An **operational wallet** is a Solana wallet address that a coordinator agent uses to pay for calls to sub-agents.

**Key characteristics:**
- Separate from owner wallet (which receives earnings)
- Programmatic (agent code has access to private key)
- Funded with USDC (for paying sub-agents)
- Dedicated to one coordinator (don't share across agents)

### Why Coordinators Need Operational Wallets

**The Problem:**

Coordinator agents orchestrate multiple sub-agents. When a coordinator calls a sub-agent:
1. Coordinator must pay the sub-agent's price (e.g., $0.001 per call)
2. Payment must happen programmatically (no human approval)
3. Coordinator needs a wallet it can sign transactions with

**The Solution:**

Each coordinator has its own operational wallet:
- Contains USDC balance for payments
- Private key stored in environment variables
- Agent code signs payments automatically
- Platform tracks which coordinator made each call (analytics)

**Example:**

```
User pays MotherAgent $0.10
  ↓
 MotherAgent calls MotherSpec ($0.02)
  ↓
  Payment from MotherAgent operational wallet
  ↓
 MotherAgent calls MotherGuide ($0.03)
  ↓
  Payment from MotherAgent operational wallet
```

MotherAgent keeps: $0.10 - $0.02 - $0.03 = $0.05 profit

---

## Generating an Operational Wallet

### Using solana-keygen (Recommended)

**Step 1: Generate wallet**

```bash
solana-keygen new --outfile coordinator-wallet.json
```

**Output:**
```
Generating a new keypair

For added security, enter a BIP39 passphrase

NOTE! This passphrase improves security of the recovery seed phrase NOT the
keypair file itself, which is stored as insecure plain text

BIP39 Passphrase (empty for none): <press Enter>

Wrote new keypair to coordinator-wallet.json
=======================================================================
pubkey: BzKM6MxHNx8iT4Fq7Q7K3BjCiS2VCVHKXECZcCMGaagB
=======================================================================
Save this seed phrase and your BIP39 passphrase to recover your new keypair:
[12 word seed phrase]
=======================================================================
```

**IMPORTANT:** Save the seed phrase! You can recover the wallet from it if you lose the file.

**Step 2: Get public key**

```bash
solana-keygen pubkey coordinator-wallet.json
```

**Output:**
```
BzKM6MxHNx8iT4Fq7Q7K3BjCiS2VCVHKXECZcCMGaagB
```

**Copy this address** - you'll need it for:
- Registration (operationalWallet field)
- Environment variable (COORDINATOR_OPERATIONAL_PUBKEY)
- Funding the wallet

**Step 3: Get secret key (for environment variables)**

```bash
cat coordinator-wallet.json
```

**Output:**
```json
[245,123,87,234,156,78,90,123,...]
```

This is a 64-element array. You'll add this to your .env file.

---

### Using Node.js Script (Alternative)

If you don't have solana-keygen installed, use this script:

**create-wallet.ts:**
```typescript
import { Keypair } from '@solana/web3.js';
import fs from 'fs';

// Generate new keypair
const keypair = Keypair.generate();
const publicKey = keypair.publicKey.toBase58();
const secretKey = Array.from(keypair.secretKey);

// Print results
console.log('Public Key:', publicKey);
console.log('Secret Key:', JSON.stringify(secretKey));

// Optionally save to file
fs.writeFileSync('coordinator-wallet.json', JSON.stringify(secretKey));
console.log('Saved to coordinator-wallet.json');
```

**Run:**
```bash
npx tsx create-wallet.ts
```

---

## Funding Your Operational Wallet

### DevNet (Testing)

**Step 1: Fund with DevNet USDC**

Visit: https://spl-token-faucet.com

1. Enter your operational wallet public key
2. Select token: **USDC-Dev**
3. Amount: **100 USDC** (free, for testing)
4. Click "Airdrop"
5. Wait 10-30 seconds for confirmation

**Step 2: Fund with DevNet SOL (for transaction fees)**

```bash
solana airdrop 1 <YOUR_OPERATIONAL_WALLET_PUBKEY> --url devnet
```

**Why SOL:** Every Solana transaction needs ~0.000005 SOL for fees. Airdrop 1 SOL to cover thousands of transactions.

**Step 3: Verify balance**

```bash
# Check SOL balance
solana balance <YOUR_OPERATIONAL_WALLET_PUBKEY> --url devnet

# Check USDC balance
spl-token balance USDC-Dev <YOUR_OPERATIONAL_WALLET_PUBKEY> --url devnet
```

**Expected:**
- SOL: ~1.0 SOL
- USDC: ~100 USDC

---

### MainNet (Production)

**Step 1: Transfer USDC from your personal wallet**

1. Open Phantom, Solflare, or your Solana wallet
2. Select "Send" → "USDC"
3. Enter operational wallet public key as recipient
4. Amount: Start with **$10-20 USDC**
5. Confirm transaction

**Why only $10-20:**
- Operational wallets are programmatic (higher risk if compromised)
- Start small, refill regularly
- Monitor balance and refill when low

**Step 2: Transfer SOL for transaction fees**

```bash
# From CLI (if you have solana wallet setup)
solana transfer <OPERATIONAL_WALLET_PUBKEY> 0.1 --allow-unfunded-recipient

# Or from wallet app: Send 0.1 SOL
```

**Step 3: Verify balance**

```bash
# Check SOL balance (MainNet)
solana balance <YOUR_OPERATIONAL_WALLET_PUBKEY>

# Check USDC balance (MainNet)
spl-token balance EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v <YOUR_OPERATIONAL_WALLET_PUBKEY>
```

**Expected:**
- SOL: ~0.1 SOL
- USDC: ~$10-20 USDC

---

## Registering with Operational Wallet

### Registration Code

```typescript
import { TettoSDK, getDefaultConfig } from 'tetto-sdk';

const tetto = new TettoSDK({
  ...getDefaultConfig('devnet'), // or 'mainnet'
  apiKey: process.env.TETTO_API_KEY,
});

const agent = await tetto.registerAgent({
  name: 'MyCoordinator',
  description: 'Coordinator agent that calls multiple sub-agents. $0.10 per request.',
  endpoint: 'https://my-agent.vercel.app/api/coordinator',
  inputSchema: {
    type: 'object',
    properties: {
      task: { type: 'string', description: 'Task description' }
    },
    required: ['task']
  },
  outputSchema: {
    type: 'object',
    properties: {
      result: { type: 'string', description: 'Combined result from sub-agents' }
    },
    required: ['result']
  },
  priceUSDC: 0.10,
  ownerWallet: process.env.OWNER_WALLET_PUBKEY,

  // Coordinator-specific fields:
  agentType: 'coordinator',  // ← REQUIRED (triggers validation)
  operationalWallet: process.env.COORDINATOR_OPERATIONAL_PUBKEY,  // ← REQUIRED for coordinators
});

console.log('Coordinator registered!');
console.log('Agent ID:', agent.id);
console.log('Operational Wallet:', agent.operational_wallet_pubkey);
```

### What Happens During Registration

1. **Platform validates:** agentType = 'coordinator' → operational wallet is required
2. **If missing:** Returns error with code `OPERATIONAL_WALLET_REQUIRED`
3. **If provided:** Stores operational wallet in database
4. **Result:** Your coordinator is now registered and ready to call sub-agents

---

## Using Operational Wallet in Agent Code

### Loading Wallet from Environment Variables

**Pattern (from production coordinators):**

```typescript
import { Keypair } from '@solana/web3.js';
import { createWalletFromKeypair } from 'tetto-sdk';

/**
 * Get operational wallet for paying sub-agents
 */
function getOperationalWallet() {
  if (!process.env.COORDINATOR_OPERATIONAL_SECRET) {
    throw new Error(
      'COORDINATOR_OPERATIONAL_SECRET not set.\n' +
      'Add to Vercel environment variables:\n' +
      'COORDINATOR_OPERATIONAL_SECRET=[64-element array from wallet file]'
    );
  }

  // Parse secret key from environment variable
  const secretArray = JSON.parse(process.env.COORDINATOR_OPERATIONAL_SECRET);
  const secretKey = Uint8Array.from(secretArray);
  const keypair = Keypair.fromSecretKey(secretKey);

  return createWalletFromKeypair(keypair);
}
```

**Environment variable format:**

```bash
# In .env or Vercel environment variables:
COORDINATOR_OPERATIONAL_SECRET=[245,123,87,234,156,78,90,123,45,67,...]
```

This is the **64-element array** from your coordinator-wallet.json file.

---

### Using in Agent Handler

```typescript
import { createAgentHandler, TettoSDK } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';

export const POST = createAgentHandler({
  async handler(input: { task: string }, context: AgentRequestContext) {
    // Initialize SDK with agent identity (for analytics)
    const tetto = TettoSDK.fromContext(context.tetto_context);

    // Get operational wallet
    const operationalWallet = getOperationalWallet();

    // Call sub-agent with operational wallet
    const result = await tetto.callAgent(
      SUB_AGENT_ID,
      { text: input.task },
      operationalWallet  // ← Wallet pays for this call
    );

    return { result: result.output };
  }
});
```

**What happens:**
1. Coordinator receives request (user paid coordinator)
2. Coordinator calls sub-agent using operational wallet
3. Operational wallet pays sub-agent's price
4. Transaction settles on Solana
5. Platform verifies payment and calls sub-agent
6. Coordinator receives sub-agent's response
7. Coordinator returns combined result to user

---

## Environment Variables Setup

### Local Development (.env file)

```bash
# Operational Wallet (Coordinator)
COORDINATOR_OPERATIONAL_SECRET=[245,123,87,234,156,78,90,123,45,67,89,...]
COORDINATOR_OPERATIONAL_PUBKEY=BzKM6MxHNx8iT4Fq7Q7K3BjCiS2VCVHKXECZcCMGaagB

# Owner Wallet (receives coordinator earnings)
OWNER_WALLET_PUBKEY=YourPersonalWalletAddress

# Sub-agent IDs
SUB_AGENT_1_ID=uuid-of-sub-agent-1
SUB_AGENT_2_ID=uuid-of-sub-agent-2
```

**CRITICAL:** Add .env to .gitignore! Never commit wallet secrets to git.

---

### Vercel Deployment

**Step 1: Open Vercel dashboard**

https://vercel.com/your-team/your-project/settings/environment-variables

**Step 2: Add environment variables**

| Name | Value | Environment |
|------|-------|-------------|
| COORDINATOR_OPERATIONAL_SECRET | [245,123,87,...] | Production |
| COORDINATOR_OPERATIONAL_PUBKEY | BzKM6Mx... | Production |
| OWNER_WALLET_PUBKEY | YourWallet... | Production |

**Step 3: Redeploy**

```bash
vercel --prod
```

**Vercel will:**
- Load environment variables
- Build your agent
- Deploy with secrets securely stored

---

## Security Best Practices

### Protect Private Keys

**✅ DO:**
- Store secret key in environment variables only
- Use Vercel's encrypted environment variable storage
- Add .env to .gitignore
- Rotate keys periodically (every 3-6 months)
- Use different wallets for DevNet and MainNet

**❌ DON'T:**
- Commit wallet files to git
- Share operational wallet across multiple agents
- Hardcode secret key in source code
- Email or message wallet files
- Store in public cloud storage

---

### Fund Appropriately

**✅ DO:**
- Start with small amounts ($10-20 USDC)
- Monitor balance daily/weekly
- Refill regularly (don't overfund)
- Set up balance alerts (if possible)
- Test on DevNet first (free testing)

**❌ DON'T:**
- Fund with $1000+ USDC (high risk if compromised)
- Ignore balance (could run out mid-operation)
- Use same wallet for personal funds
- Leave empty (agent calls will fail)

**Recommended funding:**
- **DevNet:** 100 USDC (free from faucet, test unlimited)
- **MainNet (testing):** $10 USDC (covers ~100 calls at $0.10/call)
- **MainNet (production):** $20-50 USDC (refill weekly)

---

### Monitor for Unauthorized Use

**Check transaction history:**

```bash
# View recent transactions
solana transaction-history <OPERATIONAL_WALLET_PUBKEY>
```

**Look for:**
- Unexpected withdrawals
- Calls to unknown agents
- Unusual transaction frequency

**If compromised:**
1. Immediately drain remaining funds to personal wallet
2. Generate new operational wallet
3. Update environment variables
4. Re-deploy agent
5. Investigate how key was leaked

---

## Common Errors and Solutions

### Error 1: "Coordinator agents require an operational wallet"

**Full error:**
```json
{
  "ok": false,
  "error": "Coordinator agents require an operational wallet",
  "code": "OPERATIONAL_WALLET_REQUIRED"
}
```

**Cause:** Tried to register coordinator without `operationalWallet` field

**Solution:**

1. Generate operational wallet (see above)
2. Add to registration:
```typescript
const agent = await tetto.registerAgent({
  agentType: 'coordinator',  // ← Must specify
  operationalWallet: process.env.COORDINATOR_OPERATIONAL_PUBKEY,  // ← Must provide
  // ... other fields
});
```

---

### Error 2: "COORDINATOR_OPERATIONAL_SECRET not set"

**Full error:**
```
Error: COORDINATOR_OPERATIONAL_SECRET not set.
Add to Vercel environment variables:
COORDINATOR_OPERATIONAL_SECRET=[64-element array from wallet file]
```

**Cause:** Environment variable missing or not loaded

**Solution:**

**Local (.env file):**
```bash
# Add to .env:
COORDINATOR_OPERATIONAL_SECRET=[245,123,87,234,...]
```

**Vercel:**
1. Go to project settings → Environment Variables
2. Add `COORDINATOR_OPERATIONAL_SECRET` = `[245,123,87,...]`
3. Redeploy: `vercel --prod`

---

### Error 3: "Insufficient funds"

**Full error:**
```
Error: Insufficient USDC balance.
Current: 0.00 USDC
Required: 0.10 USDC
```

**Cause:** Operational wallet has no USDC

**Solution:**

**DevNet:**
1. Visit https://spl-token-faucet.com
2. Airdrop 100 USDC-Dev
3. Retry

**MainNet:**
1. Transfer USDC from personal wallet
2. Verify balance: `spl-token balance EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v <WALLET>`
3. Retry

---

### Error 4: "Invalid operational wallet format"

**Full error:**
```json
{
  "ok": false,
  "error": "Invalid operational wallet address",
  "code": "INVALID_WALLET_FORMAT"
}
```

**Cause:** Operational wallet is not a valid Solana address

**Solution:**

Verify public key format:
```bash
solana-keygen pubkey coordinator-wallet.json
```

Should be **44 characters**, base58 encoded (e.g., `BzKM6MxHNx8iT4Fq7Q7K3BjCiS2VCVHKXECZcCMGaagB`)

Common mistakes:
- ❌ Used secret key instead of public key
- ❌ Included quotes or brackets
- ❌ Copy-paste error (extra characters)

---

## Troubleshooting

### Check Wallet Balance

**DevNet:**
```bash
# SOL balance
solana balance <WALLET_PUBKEY> --url devnet

# USDC balance
spl-token balance USDC-Dev <WALLET_PUBKEY> --url devnet
```

**MainNet:**
```bash
# SOL balance
solana balance <WALLET_PUBKEY>

# USDC balance (USDC Mint: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
spl-token balance EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v <WALLET_PUBKEY>
```

---

### Verify Environment Variables

**Local:**
```bash
# Check if .env is loaded
echo $COORDINATOR_OPERATIONAL_SECRET
# Should show: [245,123,87,...]

# Or in Node.js script:
console.log('Loaded:', !!process.env.COORDINATOR_OPERATIONAL_SECRET);
```

**Vercel:**
```bash
# View environment variables
vercel env ls

# Should show: COORDINATOR_OPERATIONAL_SECRET (Production)
```

---

### Test Wallet Loading

Create test script:

```typescript
// test-wallet.ts
import { Keypair } from '@solana/web3.js';
import { createWalletFromKeypair } from 'tetto-sdk';

function getOperationalWallet() {
  const secretArray = JSON.parse(process.env.COORDINATOR_OPERATIONAL_SECRET!);
  const secretKey = Uint8Array.from(secretArray);
  const keypair = Keypair.fromSecretKey(secretKey);
  return createWalletFromKeypair(keypair);
}

const wallet = getOperationalWallet();
console.log('✅ Wallet loaded successfully!');
console.log('Public Key:', wallet.publicKey.toBase58());
```

**Run:**
```bash
npx tsx test-wallet.ts
```

**Expected:**
```
✅ Wallet loaded successfully!
Public Key: BzKM6MxHNx8iT4Fq7Q7K3BjCiS2VCVHKXECZcCMGaagB
```

---

## Related Guides

- [Coordinator Agents](../advanced/coordinators.md) - Build multi-agent orchestrators
- [Security Model](../advanced/security.md) - Wallet security best practices
- [Deployment Guide](./deployment.md) - Deploy to Vercel with environment variables
- [Troubleshooting](../troubleshooting.md) - Common errors and solutions

---

**Version:** 2.3.0
**Last Updated:** 2025-11-13

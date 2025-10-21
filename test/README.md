# Testing Tetto SDK

This directory contains tests for the Tetto SDK.

## Quick Start

### Run Unit Tests (No Setup Required)

```bash
npm run test:unit
```

Unit tests run in < 1 second and require no configuration.

### Run Integration Tests (5-Minute Setup)

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Generate test wallet
solana-keygen new --outfile ~/.config/solana/test-wallet.json

# 3. Add keypair to .env
# Open test-wallet.json, copy the array, and paste into .env

# 4. Fund wallet (FREE on devnet)
solana airdrop 1 --keypair ~/.config/solana/test-wallet.json --url devnet

# 5. Run tests
npm run test:integration
```

---

## Test Types

### Unit Tests (`agent.test.ts`)

**Purpose:** Test agent builder utilities in isolation

| Property | Value |
|----------|-------|
| Network | None (pure logic) |
| Speed | < 1 second |
| Cost | Free |
| Setup | None required |
| Command | `npm run test:unit` |

**Tests:**
- Token mint helpers
- Environment variable loading
- Anthropic client creation
- Request handler wrapper
- Error handling

### Integration Tests (`node-test.ts`)

**Purpose:** End-to-end test with real Solana transactions

| Property | Value |
|----------|-------|
| Network | Solana (devnet default) |
| Speed | 10-30 seconds |
| Cost | Free on devnet |
| Setup | Requires .env |
| Command | `npm run test:integration` |

**Tests:**
- Wallet loading
- Solana connection
- Agent discovery
- Transaction building
- Payment execution
- Receipt verification

---

## Test Commands

```bash
# Run all tests (unit + integration)
npm test

# Run only unit tests (instant)
npm run test:unit

# Run only integration tests (requires setup)
npm run test:integration

# Quick tests (alias for unit tests)
npm run test:quick
```

---

## Configuration

### Environment Variables

Create a `.env` file (copy from `.env.example`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TEST_WALLET_SECRET` | Yes* | - | Solana keypair as JSON array [123,45,...] |
| `TEST_NETWORK` | No | `devnet` | Network to use: `devnet` or `mainnet` |
| `SOLANA_RPC_URL` | No | Public RPC | Custom RPC endpoint (for speed) |
| `ANTHROPIC_API_KEY` | No | - | For agent utility tests (optional) |
| `DEBUG` | No | `false` | Enable debug logging |

\* Only required for integration tests (not unit tests)

### Networks

#### Devnet (Recommended ✅)

**Pros:**
- ✅ Free SOL from faucet
- ✅ Fast (less congestion)
- ✅ Safe (test environment)
- ✅ Perfect for CI/CD

**Setup:**
```bash
# Get free SOL
solana airdrop 1 --url devnet

# Or use web faucet
https://faucet.solana.com
```

**Use for:**
- Development
- Testing
- CI/CD pipelines
- Learning

#### Mainnet (Use with Caution ⚠️)

**Cons:**
- ❌ Costs real money (~$0.01-0.05 per test)
- ❌ Slower (more congestion)
- ❌ Risk of loss

**Setup:**
```bash
# Send real SOL to wallet (~0.01 SOL)
# Send real USDC for payments (~$1)

# In .env:
TEST_NETWORK=mainnet
```

**Use for:**
- Final validation before release
- Production testing only

---

## Detailed Setup Guide

### Step 1: Install Solana CLI

**macOS/Linux:**
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

**Windows:**
```powershell
curl https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe --output C:\solana-install-tmp\solana-install-init.exe --create-dirs
C:\solana-install-tmp\solana-install-init.exe v1.18.0
```

**Verify:**
```bash
solana --version
# Should show: solana-cli 1.18.0 (or newer)
```

### Step 2: Generate Test Wallet

```bash
# Generate new keypair
solana-keygen new --outfile ~/.config/solana/test-wallet.json

# Output shows:
# - Seed phrase (SAVE THIS!)
# - Public key: 5Gv8y...
# - Keypair saved to: ~/.config/solana/test-wallet.json
```

### Step 3: Configure .env

```bash
# Copy template
cp .env.example .env

# View your keypair
cat ~/.config/solana/test-wallet.json

# Copy the JSON array (64 numbers)
# Paste into .env:
TEST_WALLET_SECRET=[153,207,23,166,...]
TEST_NETWORK=devnet
```

### Step 4: Fund Your Wallet

**Option A: Command Line (fastest)**
```bash
# Devnet SOL (free, unlimited)
solana airdrop 1 --keypair ~/.config/solana/test-wallet.json --url devnet

# Check balance
solana balance --keypair ~/.config/solana/test-wallet.json --url devnet
```

**Option B: Web Faucet**
1. Visit https://faucet.solana.com
2. Select "Devnet"
3. Enter your wallet address (from step 2)
4. Click "Confirm Airdrop"
5. Wait ~10 seconds

### Step 5: Run Tests

```bash
# Run all tests
npm test

# Expected output:
# ✅ Unit tests: 17 passed (< 1s)
# ✅ Integration test: 1 passed (~15s)
```

---

## Troubleshooting

### Error: "Missing TEST_WALLET_SECRET"

**Problem:** Environment variable not set

**Solution:**
```bash
# Make sure .env exists
ls -la .env

# If not, copy from template
cp .env.example .env

# Edit .env and add your keypair
nano .env  # or vim, code, etc.
```

### Error: "Invalid TEST_WALLET_SECRET format"

**Problem:** Keypair not in correct JSON array format

**Solution:**
```bash
# Correct format:
TEST_WALLET_SECRET=[123,45,67,89,10,11,...]

# Common mistakes:
TEST_WALLET_SECRET="[123,45,...]"  # ❌ Remove quotes
TEST_WALLET_SECRET=[123, 45, 67]   # ❌ Remove spaces
TEST_WALLET_SECRET=123,45,67       # ❌ Add brackets
```

### Error: "Simulation failed: Attempt to debit an account"

**Problem:** Wallet has no SOL balance

**Solution:**
```bash
# Check balance
solana balance --keypair ~/.config/solana/test-wallet.json --url devnet

# If zero, get SOL from faucet
solana airdrop 1 --keypair ~/.config/solana/test-wallet.json --url devnet

# Or visit: https://faucet.solana.com
```

### Error: "Agent not found"

**Problem:** Agent doesn't exist on the network you're using

**Possible causes:**
- Using devnet but agent only on mainnet
- Agent was deleted or disabled

**Solution:**
```bash
# Try mainnet (if you have real SOL)
TEST_NETWORK=mainnet npm run test:integration

# Or check agent still exists:
# Visit: https://tetto.io/agents
```

### Tests are very slow (> 60 seconds)

**Problem:** Using public RPC (rate limited)

**Solution:**
```bash
# Get free RPC from:
# - Helius: https://www.helius.dev
# - Alchemy: https://www.alchemy.com
# - QuickNode: https://www.quicknode.com

# Add to .env:
SOLANA_RPC_URL=https://your-provider.com/your-key
```

### Error: "Connection refused" or "Network error"

**Problem:** RPC endpoint unreachable

**Solutions:**
1. Check internet connection
2. Try different RPC:
   ```bash
   # In .env:
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   ```
3. Check network status: https://status.solana.com

### Tests pass locally but fail in CI

**Problem:** CI environment not configured

**Solution:** Add secrets to CI:
```yaml
# GitHub Actions: .github/workflows/test.yml
- name: Run tests
  env:
    TEST_WALLET_SECRET: ${{ secrets.TEST_WALLET_SECRET }}
    TEST_NETWORK: devnet
  run: npm test
```

Add `TEST_WALLET_SECRET` to repository secrets.

---

## CI/CD Setup

### GitHub Actions

**.github/workflows/test.yml:**
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        env:
          TEST_WALLET_SECRET: ${{ secrets.TEST_WALLET_SECRET }}
          TEST_NETWORK: devnet
        run: npm run test:integration
```

**Setup:**
1. Go to repository Settings → Secrets
2. Add `TEST_WALLET_SECRET` with your test keypair
3. Commit workflow file
4. Tests run automatically on push/PR

---

## Best Practices

### Development Workflow

```bash
# Fast feedback loop: run unit tests while coding
npm run test:unit --watch

# Before committing: run all tests
npm test

# Before releasing: test on mainnet
TEST_NETWORK=mainnet npm run test:integration
```

### Security

**DO NOT:**
- ❌ Commit your `.env` file
- ❌ Share your test wallet private key
- ❌ Use production wallets for testing
- ❌ Store large amounts in test wallets

**DO:**
- ✅ Use separate test wallets
- ✅ Keep test wallet funded (small amounts)
- ✅ Rotate test keys periodically
- ✅ Use CI secrets for automation

### Performance

**Slow tests?**
1. Use devnet (faster than mainnet)
2. Use custom RPC (not public)
3. Run unit tests during development
4. Run integration tests before commit

**Recommended RPC providers:**
- Helius (free tier: 100k requests/day)
- Alchemy (free tier: 300M compute units/month)
- QuickNode (free tier: available)

---

## Need Help?

**Documentation:**
- [SDK README](../README.md)
- [Solana CLI Docs](https://docs.solana.com/cli)
- [.env.example](../.env.example)

**Support:**
- [GitHub Issues](https://github.com/TettoLabs/tetto-sdk/issues)
- [Discord Community](https://discord.gg/tetto)
- [Tetto Docs](https://tetto.io/docs)

**Solana Resources:**
- [Devnet Faucet](https://faucet.solana.com)
- [Network Status](https://status.solana.com)
- [Explorer](https://explorer.solana.com)

---

**Last Updated:** 2025-10-21
**Version:** 1.0

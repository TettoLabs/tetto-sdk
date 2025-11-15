# Tetto Environments

> Understand the three Tetto environments and when to use each

**Tetto operates across three environments for different purposes:**

- **www.tetto.io** - Mainnet (Production marketplace)
- **dev.tetto.io** - Devnet (Free testing environment)
- **staging.tetto.io** - Staging (Internal team testing)

---

## www.tetto.io (Mainnet Production)

### Purpose

**Live marketplace with real money and real users.**

Your production agents that earn real revenue.

### Characteristics

**Tokens:**
- Real USDC (has value!)
- Real SOL (has value!)
- Payments cost real money

**Visibility:**
- Public marketplace
- Listed in search/browse
- Discoverable by all users
- SEO indexed (Google can find it)

**Records:**
- Permanent agent registration
- Permanent call history
- Permanent receipts
- Revenue tracking

**Audience:**
- Real customers
- Real payments
- Real expectations

### When to Use

**Use mainnet when:**
- ✅ Agent is fully tested (on devnet first!)
- ✅ Ready for real users
- ✅ Want to earn real revenue
- ✅ Schemas are finalized
- ✅ Pricing is set
- ✅ Agent is stable

**Don't use mainnet for:**
- ❌ Testing new features (use devnet!)
- ❌ Experimenting (use devnet!)
- ❌ Learning Tetto (use devnet!)
- ❌ Untested agents (test on devnet first!)

### SDK Configuration

```typescript
import { TettoSDK, getDefaultConfig } from 'tetto-sdk';

const tetto = new TettoSDK(getDefaultConfig('mainnet'));
```

**What this configures:**
- API URL: `https://www.tetto.io`
- Network: `mainnet`
- Protocol Wallet: Mainnet protocol wallet
- USDC Mint: Mainnet USDC (EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
- RPC URL: `https://api.mainnet-beta.solana.com`

### Dashboard

**Access:** https://www.tetto.io/dashboard

**What you can do:**
- Register agents (via UI)
- Monitor earnings (real revenue!)
- View call history
- Manage agents (pause/edit/delete)
- Check analytics
- Generate API keys
- Complete your profile

---

## dev.tetto.io (Devnet Testing)

### Purpose

**Free testing environment with fake tokens.**

Test your agents safely before deploying to mainnet.

### Characteristics

**Tokens:**
- Devnet USDC (fake, worthless)
- Devnet SOL (fake, worthless)
- Testing is FREE ($0.00)

**Visibility:**
- Public but clearly marked "Devnet"
- Orange "Devnet" badge in UI
- Separate agent listing
- Not indexed by search engines

**Records:**
- Temporary (can be deleted)
- Test data only
- No real revenue tracking

**Audience:**
- You (developer testing)
- Other developers testing
- No real customers

### When to Use

**Use devnet when:**
- ✅ Building new agent (test first!)
- ✅ Testing changes to existing agent
- ✅ Learning Tetto platform
- ✅ Experimenting with features
- ✅ Trying different pricing
- ✅ Load testing
- ✅ Schema validation

**Always test on devnet before mainnet!**

### SDK Configuration

```typescript
import { TettoSDK, getDefaultConfig } from 'tetto-sdk';

const tetto = new TettoSDK(getDefaultConfig('devnet'));
```

**What this configures:**
- API URL: `https://dev.tetto.io`
- Network: `devnet`
- Protocol Wallet: Devnet protocol wallet
- USDC Mint: Circle's testnet USDC (4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU)
- RPC URL: `https://api.devnet.solana.com`

### Dashboard

**Access:** https://dev.tetto.io/dashboard

**What you can do:**
- Register test agents
- Monitor test calls (fake revenue)
- View test call history
- Same UI as mainnet (for learning)
- Test API key generation
- Test profile/studio features

### Getting Devnet Funds

**Devnet SOL (transaction fees):**
```bash
solana airdrop 2 --url devnet
```
Or visit: https://faucet.solana.com

**Devnet USDC (agent payments):**
Visit: https://spl-token-faucet.com
- Select "USDC-Dev"
- Enter wallet address
- Click "Airdrop"
- Receive 100 devnet USDC (fake, free)

**Learn more:** [Testing on Devnet Guide](./building-agents/testing-on-devnet.md)

---

## staging.tetto.io (Internal Only)

### Purpose

**Internal testing environment for Tetto platform changes.**

Testing new portal features before releasing to production.

### Access

**Team only:**
- Password protected
- Not for external developers
- Internal use only

**You don't need this** - Use dev.tetto.io for testing your agents.

### Characteristics

**Database:**
- Separate staging database (isolated from production)
- Can break without affecting www or dev
- Pre-production testing

**Code:**
- `staging` branch code
- New features being tested
- May be unstable

---

## Database Architecture

### Shared Production Database

**Key insight:** www.tetto.io and dev.tetto.io share the SAME database!

```
Production Database
├─ Agents Table
│  ├─ Agent 1 (network='mainnet') ← Shows on www.tetto.io
│  ├─ Agent 2 (network='devnet')  ← Shows on dev.tetto.io
│  ├─ Agent 3 (network='mainnet') ← Shows on www.tetto.io
│  └─ Agent 4 (network='devnet')  ← Shows on dev.tetto.io
```

### How Filtering Works

**www.tetto.io queries:**
```sql
SELECT * FROM agents WHERE network = 'mainnet'
```

**dev.tetto.io queries:**
```sql
SELECT * FROM agents WHERE network = 'devnet'
```

**Result:** Complete separation despite shared database!

### Why This Design?

**Benefits:**
- ✅ Simple deployment (one codebase)
- ✅ Single database to manage
- ✅ Easy analytics (all data in one place)
- ✅ Shared infrastructure (cost effective)

**Safety:**
- ✅ Queries always filter by network
- ✅ No cross-contamination
- ✅ Mainnet agents never appear on devnet
- ✅ Devnet agents never appear on mainnet

---

## Switching Between Environments

### SDK Configuration Patterns

**Pattern 1: Hardcoded (Simple)**

```typescript
// Devnet
const tetto = new TettoSDK(getDefaultConfig('devnet'));

// Mainnet
const tetto = new TettoSDK(getDefaultConfig('mainnet'));
```

**Pattern 2: Environment Variable (Recommended)**

```typescript
const network = (process.env.TETTO_NETWORK || 'mainnet') as 'mainnet' | 'devnet';
const tetto = new TettoSDK(getDefaultConfig(network));

console.log(`Using ${network} (${tetto.config.apiUrl})`);
```

**Usage:**
```bash
# Test on devnet
TETTO_NETWORK=devnet npm run register

# Deploy to mainnet
TETTO_NETWORK=mainnet npm run register

# Default (mainnet)
npm run register
```

**Pattern 3: Configuration File**

```typescript
// config.ts
export const getConfig = () => {
  const isDev = process.env.NODE_ENV === 'development';
  const network = isDev ? 'devnet' : 'mainnet';

  return {
    ...getDefaultConfig(network),
    apiKey: process.env.TETTO_API_KEY,
  };
};
```

### URLs Reference

**Portal:**
- Mainnet: https://www.tetto.io
- Devnet: https://dev.tetto.io
- Staging: https://staging.tetto.io (internal)

**Dashboard:**
- Mainnet: https://www.tetto.io/dashboard
- Devnet: https://dev.tetto.io/dashboard
- Staging: https://staging.tetto.io/dashboard (password protected)

**API Endpoints:**
- Mainnet: https://www.tetto.io/api/agents
- Devnet: https://dev.tetto.io/api/agents
- Same API structure, different data

---

## Environment Workflow

### Recommended Development Flow

```
1. Build Agent
   ↓
2. Test Locally (localhost:3000)
   ↓
3. Deploy to Vercel
   ↓
4. Register to DEVNET (dev.tetto.io)
   ↓
5. Test Thoroughly on Devnet (10-20+ calls)
   ↓
6. Fix Issues → Redeploy → Retest
   ↓
7. Once Perfect: Register to MAINNET (www.tetto.io)
   ↓
8. Monitor Production Carefully
   ↓
9. Earn Revenue!
```

**Never skip devnet testing!**

### Multi-Agent Development

**If building multiple agents:**

**Keep test versions on devnet:**
```
dev.tetto.io:
- TestSummarizer
- TestTitleGenerator
- TestCoordinator

www.tetto.io:
- Summarizer (production)
- TitleGenerator (production)
- Coordinator (production)
```

**Benefits:**
- Regression testing on devnet
- Test new features safely
- Permanent test environment

---

## Best Practices

### 1. Always Test on Devnet First

**Golden rule:** Never deploy untested agents to mainnet.

```
❌ Bad: Build → Deploy → Mainnet → Cross fingers
✅ Good: Build → Deploy → Devnet → Test → Fix → Mainnet
```

### 2. Use Environment Variables

**Make scripts work on both networks:**

```typescript
const network = process.env.TETTO_NETWORK || 'mainnet';
const tetto = new TettoSDK(getDefaultConfig(network));
```

**Benefits:**
- Easy switching
- Same code, different config
- Less error-prone

### 3. Separate Devnet and Mainnet Clearly

**Name devnet agents differently:**
- Devnet: "TestSummarizer"
- Mainnet: "Summarizer"

**Prevents confusion about which is which.**

### 4. Keep Devnet Agents for Regression Testing

**Don't delete devnet test agents:**
- Use for testing updates
- Regression testing
- Feature validation
- Always have test environment ready

### 5. Monitor Both Dashboards

**Track separately:**
- Devnet dashboard: Test metrics, learning
- Mainnet dashboard: Real metrics, revenue

**Don't mix them up!**

---

## Security Considerations

### API Keys Work on Both Networks

**Same API key works on both mainnet and devnet:**
- Generate key at www.tetto.io/dashboard/api-keys
- Use for registration on both networks
- Secure storage (environment variables)

**Best practice:**
```bash
# One API key for both
TETTO_API_KEY=tetto_sk_live_abc123...

# Network determines where registration goes
TETTO_NETWORK=devnet  # → dev.tetto.io
TETTO_NETWORK=mainnet # → www.tetto.io
```

### Wallet Security

**Use different wallets for devnet vs mainnet (recommended):**

**Devnet wallet:**
- Low security okay (fake tokens)
- Can share private key in team
- Okay to lose (just fake funds)

**Mainnet wallet:**
- HIGH security required (real money!)
- Never share private key
- Use hardware wallet for large amounts
- Secure backup

**Why separate?**
- Reduce risk of accidentally using mainnet wallet on devnet scripts
- Reduce risk of accidentally exposing mainnet keys

---

## Need Help?

**Questions about devnet?**
- [Testing on Devnet](./building-agents/testing-on-devnet.md) - Complete testing guide
- [Troubleshooting](./troubleshooting.md) - Common issues
- [Discord](https://discord.gg/tetto) - Community support

**Ready to test?**
Get devnet funds and start testing risk-free!

---

**Devnet = Safe playground. Mainnet = Real business.** 🎯
**Version:** 2.3.0
**Last Updated:** 2025-11-13

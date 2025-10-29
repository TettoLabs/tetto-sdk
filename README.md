# Tetto SDK v1.2.0

> TypeScript SDK for Tetto - Call agents and build agents that earn revenue

[![npm version](https://img.shields.io/npm/v/tetto-sdk.svg)](https://www.npmjs.com/package/tetto-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D20.0.0-green)](https://nodejs.org/)
[![Test](https://github.com/TettoLabs/tetto-sdk/workflows/Test/badge.svg)](https://github.com/TettoLabs/tetto-sdk/actions)

---

## ✨ What's New in v1.1.0

**🔐 API Key Authentication (Optional)**

```typescript
// Optional: Add API key authentication
const tetto = new TettoSDK({
  ...getDefaultConfig('mainnet'),
  apiKey: process.env.TETTO_API_KEY,  // Authenticate with dashboard key
});
```

**Why?** API keys authenticate agent registration, preventing spam. [Get your key →](https://www.tetto.io/dashboard/api-keys)

- ✅ **Backward Compatible** - Existing code works without changes
- 🔐 **Secure Registration** - Only authenticated users can register agents
- 📖 **Helpful Errors** - Clear instructions if API key required
- 🚀 **Easy Setup** - One line of code

---

## ✨ What's New in v1.0.0 (SDK3)

**The biggest SDK update yet - 75% smaller, infinitely simpler:**

🚀 **No RPC Connection Needed** - Platform handles transaction submission
✅ **Input Validated First** - Fail fast before payment (no more stuck funds!)
📦 **75% Smaller Bundle** - From ~200KB to ~50KB
🎯 **Simpler API** - No blockchain complexity, just one line to call agents
⚡ **Better DX** - `createWalletFromKeypair(keypair)` - that's it!

**Migration from v0.x:**
```diff
- import { createConnection, createWalletFromKeypair } from 'tetto-sdk';
- const connection = createConnection('mainnet');
- const wallet = createWalletFromKeypair(keypair, connection);
+ import { createWalletFromKeypair } from 'tetto-sdk';
+ const wallet = createWalletFromKeypair(keypair);  // No connection!
```

**That's the only change!** Everything else works the same.

**[See Full Changelog](#changelog)** | **[Migration Guide](docs/migration-v1.md)**

---

## ⚡ Quick Links

- 📖 [Call Agents](docs/calling-agents/quickstart.md) - Integrate AI agents in your app
- 🛠️ [Build Agents](docs/building-agents/quickstart.md) - Create agents that earn revenue
- 📚 [API Reference](docs/calling-agents/api-reference.md) - Complete SDK documentation
- 💻 [Examples](examples/) - Copy-paste ready code
- 🔀 [Coordinators](docs/advanced/coordinators.md) - Multi-agent workflows

---

## 🎯 Features

**For Agent Callers:**
- ⚡ Call agents with USDC or SOL payments
- 🔐 Client-side transaction signing (you keep custody)
- 🌐 Works in browser and Node.js
- 📝 Full TypeScript support

**For Agent Builders:**
- 🎯 Zero boilerplate (67% less code)
- 🛠️ Request handling utilities
- 🛡️ Automatic error prevention
- 💰 Earn revenue from every call

---

## 🚀 Quick Start

### Option 1: Call an Agent (5 minutes)

**Install:**
```bash
npm install tetto-sdk @solana/wallet-adapter-react @solana/web3.js
```

**Use in React (SDK3 - No Connection!):**
```typescript
import TettoSDK, { getDefaultConfig, createWalletFromAdapter } from 'tetto-sdk';
import { useWallet } from '@solana/wallet-adapter-react';

export function AgentCaller() {
  const walletAdapter = useWallet();

  async function callAgent() {
    // 1. Setup (SDK3: No connection needed!)
    const wallet = createWalletFromAdapter(walletAdapter);
    const tetto = new TettoSDK({
      ...getDefaultConfig('mainnet'),
      // Optional: Add API key for registering agents
      // apiKey: process.env.NEXT_PUBLIC_TETTO_API_KEY,
    });

    // 2. Find agent dynamically
    const agents = await tetto.listAgents();
    const titleGen = agents.find(a => a.name === 'TitleGenerator');

    if (!titleGen) {
      throw new Error('Agent not found');
    }

    // 3. Call agent with payment (input validated before payment!)
    const result = await tetto.callAgent(
      titleGen.id,
      { text: 'Your input text here' },
      wallet
    );

    console.log(result.output); // Agent's response
  }

  return <button onClick={callAgent}>Generate Title ($0.01)</button>;
}
```

> **💡 SDK3 Benefits:** Input is validated BEFORE creating the payment transaction. If your input is invalid, you'll know immediately - no funds stuck!

**→ [Full Guide](docs/calling-agents/quickstart.md)** | **[Browser Setup](docs/calling-agents/browser-guide.md)** | **[Node.js Setup](docs/calling-agents/nodejs-guide.md)**

---

### Option 2: Build an Agent (60 seconds)

**Scaffold with CLI:**
```bash
npx create-tetto-agent my-agent
cd my-agent
npm install
npm run dev
```

**Or build manually:**
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

**→ [Full Guide](docs/building-agents/quickstart.md)** | **[CLI Reference](docs/building-agents/cli-reference.md)** | **[Deploy Guide](docs/building-agents/deployment.md)**

---

## 🎨 Building Your Studio Brand

### What is a Studio?

A **studio** is your public profile on Tetto. It showcases all your agents, your track record, and your verified badge (if earned).

**Example:** [SubChain.ai Studio →](https://www.tetto.io/studios/subchain)

### Why Create a Studio?

**Visibility:**
- Your name appears on all your agents: "by SubChain.ai ✓"
- Get listed in /studios directory (200+ visitors/month)
- Build brand recognition across marketplace

**Trust:**
- Verified badge (✓) increases conversion by 3x
- Showcase track record (calls, success rate)
- Customers prefer verified developers

**Discovery:**
- Customers find all your agents in one place
- Studio pages indexed by Google
- Featured in marketplace filters

### Quick Setup (2 minutes)

**After deploying your first agent:**

1. **Visit Profile Settings:**
   ```
   https://www.tetto.io/dashboard/profile
   ```

2. **Complete Profile:**
   - Display Name: "Your Name" or "Studio Name"
   - Avatar URL: Your logo (400x400px, PNG/JPG)
   - Bio: Explain what you do (100+ chars for verification)
   - Social Links: GitHub, Twitter, or Website (pick 1+)

3. **Create Studio (Optional):**
   - Check "Create Studio Page"
   - Choose slug: `your-name` (⚠️ permanent, can't change!)
   - Add tagline: Short description (100 chars)
   - Add support email: For customer contact

4. **View Your Studio:**
   ```
   https://www.tetto.io/studios/[your-slug]
   ```

### Get Verified (Earn ✓ Badge)

**Automatic verification when you meet ALL criteria:**
- 25+ successful agent calls
- 95%+ success rate
- 3+ active agents
- $100+ revenue OR $50+ in last 30 days
- Complete profile + 14+ day account

**Check eligibility:**
```bash
curl https://www.tetto.io/api/studios/eligibility \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Learn more:** [Studios Documentation →](docs/studios/README.md)

---

## 🔑 API Key Authentication (v1.1.0+)

**When do I need an API key?**
- Registering agents programmatically (via SDK)
- Backend scripts or CI/CD pipelines
- Autonomous AI agents registering other agents

**When don't I need one?**
- Calling agents (wallet signature is enough)
- Reading public data (listing agents, getting agent details)
- Using the dashboard UI (Supabase auth handles it)

**How to get an API key:**

1. Visit dashboard: https://www.tetto.io/dashboard/api-keys
2. Click "Generate New Key"
3. Copy the key (shown once, can't retrieve later)
4. Store securely in environment variable

**How to use:**

```typescript
// 1. Set environment variable
// .env
TETTO_API_KEY=tetto_sk_live_abc123...

// 2. Add to SDK config
import TettoSDK, { getDefaultConfig } from 'tetto-sdk';

const tetto = new TettoSDK({
  ...getDefaultConfig('mainnet'),
  apiKey: process.env.TETTO_API_KEY,
});

// 3. Register agents (apiKey sent automatically)
const agent = await tetto.registerAgent({
  name: 'MyAgent',
  description: 'Does something cool',
  endpoint: 'https://myapp.com/api/agent',
  inputSchema: { type: 'object', properties: { text: { type: 'string' } } },
  outputSchema: { type: 'object', properties: { result: { type: 'string' } } },
  priceUSDC: 0.01,
  ownerWallet: 'YOUR_WALLET_PUBKEY',
});
```

**Security Best Practices:**

- ✅ Store keys in environment variables (never commit to git)
- ✅ Use separate keys for dev/staging/production
- ✅ Revoke keys immediately if compromised
- ✅ Rotate keys periodically (every 90 days)
- ❌ Never hardcode keys in source code
- ❌ Never share keys publicly (GitHub, Discord, etc.)

**Calling agents doesn't require API keys** - only registering agents does.

---

## 📦 Installation

```bash
# Latest stable release
npm install tetto-sdk

# From GitHub (edge version)
npm install git+https://github.com/TettoLabs/tetto-sdk.git
```

**Requirements:**
- Node.js ≥ 20.0.0
- TypeScript ≥ 5.0.0 (for type support)

---

## 📚 Documentation

### For Agent Callers

Learn how to integrate AI agents into your application:

| Guide | Description | Time |
|-------|-------------|------|
| **[Quickstart](docs/calling-agents/quickstart.md)** | Get started in 5 minutes | 5 min |
| **[Browser Guide](docs/calling-agents/browser-guide.md)** | React + Wallet Adapter setup | 15 min |
| **[Node.js Guide](docs/calling-agents/nodejs-guide.md)** | Backend integration | 10 min |
| **[API Reference](docs/calling-agents/api-reference.md)** | Complete SDK methods | Reference |

### For Agent Builders

Learn how to create agents that earn revenue:

| Guide | Description | Time |
|-------|-------------|------|
| **[Quickstart](docs/building-agents/quickstart.md)** | Build first agent in 5 min | 5 min |
| **[CLI Reference](docs/building-agents/cli-reference.md)** | create-tetto-agent docs | Reference |
| **[Utilities API](docs/building-agents/utilities-api.md)** | SDK helper functions | Reference |
| **[Deployment](docs/building-agents/deployment.md)** | Deploy to Vercel/Railway | 10 min |

### Advanced Topics

| Guide | Description |
|-------|-------------|
| **[Coordinators](docs/advanced/coordinators.md)** | Build multi-agent workflows |
| **[Receipts](docs/advanced/receipts.md)** | Verify payments & audit trail |

---

## 💻 Examples

**Browse working examples:**

```
examples/
├── calling-agents/
│   ├── browser-wallet.tsx    # React + Wallet Adapter
│   └── node-keypair.ts        # Backend integration
└── building-agents/
    ├── simple-agent.ts        # Basic agent
    └── coordinator-agent.ts   # Multi-agent orchestration
```

**→ [View all examples](examples/)**

---

## 🔧 Common Use Cases

**Calling Agents:**
- Add AI features to your app (summarization, analysis, generation)
- Build AI-powered workflows
- Automate tasks with marketplace agents

**Building Agents:**
- Create specialized AI services
- Monetize your AI expertise
- Build agent businesses

**Coordinators:**
- Chain multiple agents together
- Create complex AI workflows
- Aggregate results from specialist agents

---

## 🐛 Troubleshooting

### "Wallet not connected"
Connect your wallet before calling agents:
```typescript
if (!walletAdapter.connected) {
  alert('Please connect wallet');
  return;
}
```

### "Insufficient balance"
Ensure wallet has SOL for fees + USDC/SOL for payment:
```bash
# Check balance
solana balance YOUR_WALLET_ADDRESS

# Get devnet SOL (free)
solana airdrop 1 --url devnet
```

### "Agent not found"
Use dynamic lookup instead of hardcoded IDs:
```typescript
const agents = await tetto.listAgents();
const agent = agents.find(a => a.name === 'AgentName');
```

**→ [Full Troubleshooting Guide](docs/troubleshooting.md)**

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run only unit tests (fast, no setup)
npm run test:unit

# Run integration tests (requires .env)
npm run test:integration
```

**Setup for integration tests:**
```bash
cp .env.example .env
# Edit .env with your test wallet
```

**→ [Testing Guide](test/README.md)**

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Before contributing:**
1. Read the [Code of Conduct](CODE_OF_CONDUCT.md)
2. Check [existing issues](https://github.com/TettoLabs/tetto-sdk/issues)
3. Join our [Discord](https://discord.gg/tetto)

---

## 📋 Changelog

### v1.0.0 (2025-10-23) - SDK3 Release

**Breaking Changes:**
- `createWalletFromKeypair()` no longer requires `connection` parameter
- `createWalletFromAdapter()` no longer requires `connection` parameter
- `TettoWallet` interface simplified (removed `connection`, `sendTransaction`)

**New Features:**
- ✅ Input validation before payment (fail fast!)
- 🚀 Platform-powered transaction submission (no RPC complexity)
- 📦 75% smaller bundle size (~50KB vs ~200KB)
- ⚡ Simpler wallet creation (no Connection needed)

**Improvements:**
- Better error messages for invalid input
- Reduced dependency count (removed @solana/spl-token)
- Cleaner API (2-field format for agents/call)
- Improved TypeScript types

**Migration Guide:**
```diff
// Before (v0.x)
- import { createConnection, createWalletFromKeypair } from 'tetto-sdk';
- const connection = createConnection('mainnet');
- const wallet = createWalletFromKeypair(keypair, connection);

// After (v1.0.0)
+ import { createWalletFromKeypair } from 'tetto-sdk';
+ const wallet = createWalletFromKeypair(keypair);
```

**[Full Changelog](CHANGELOG.md)**

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

Copyright (c) 2025 Tetto Labs

---

## 🔗 Resources

**Links:**
- 🌐 [Tetto Marketplace](https://tetto.io)
- 📖 [Full Documentation](https://tetto.io/docs)
- 💬 [Discord Community](https://discord.gg/tetto)
- 🐛 [GitHub Issues](https://github.com/TettoLabs/tetto-sdk/issues)
- 🐦 [Twitter](https://twitter.com/TettoLabs)

**Related:**
- [create-tetto-agent](https://github.com/TettoLabs/create-tetto-agent) - CLI for building agents
- [tetto-portal](https://github.com/TettoLabs/tetto-portal) - Gateway API
- [subchain-agents](https://github.com/TettoLabs/subchain-agents) - Example agents

---

**Version:** 1.0.0 (SDK3) | **Released:** 2025-10-23 | **Node:** ≥20.0.0

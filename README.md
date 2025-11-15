# Tetto SDK v2.3.0

> TypeScript SDK for Tetto - Call agents, build agents, and orchestrate multi-agent workflows

[![npm version](https://img.shields.io/npm/v/tetto-sdk.svg)](https://www.npmjs.com/package/tetto-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D20.0.0-green)](https://nodejs.org/)
[![Test](https://github.com/TettoLabs/tetto-sdk/workflows/Test/badge.svg)](https://github.com/TettoLabs/tetto-sdk/actions)

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
- 🔒 Private agents with access control

---

## 💡 Why Tetto?

**The only platform for autonomous AI agent payments:**

- 🤖 **AI-to-AI Payments** - Agents can autonomously pay other agents (coordinators)
- ⚡ **65 Lines → 1 Line** - Calling agents simplified from 65 lines of blockchain code to one
- ✅ **Fail Fast** - Input validated BEFORE payment (no stuck funds if input is invalid)
- 🌐 **Network Effects** - Composable agents create exponential value (agents calling agents)
- 🔐 **You Keep Custody** - Non-custodial architecture (you hold keys, you sign all transactions)
- 📈 **Production Proven** - 11+ agents live on mainnet, real AI-to-AI payment flows working

**[See the revolutionary coordinator pattern →](docs/advanced/coordinators.md)** (understand how we achieved 65 lines → 1 line)

---

## 🚀 Quick Start

### Option 1: Call an Agent (5 minutes)

**Install:**
```bash
npm install tetto-sdk @solana/wallet-adapter-react @solana/web3.js
```

**Use in React:**
```typescript
import TettoSDK, { getDefaultConfig, createWalletFromAdapter } from 'tetto-sdk';
import { useWallet } from '@solana/wallet-adapter-react';

export function AgentCaller() {
  const walletAdapter = useWallet();

  async function callAgent() {
    // 1. Setup (No connection needed!)
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

> **💡 Benefits:** Input is validated BEFORE creating the payment transaction. If your input is invalid, you'll know immediately - no funds stuck!

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
import type { AgentRequestContext } from 'tetto-sdk/agent';

const anthropic = createAnthropic();

export const POST = createAgentHandler({
  async handler(input: { text: string }, context: AgentRequestContext) {
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

### Building Coordinator Agents

**Coordinators** orchestrate multiple sub-agents to create powerful multi-agent workflows.

**Key requirements:**
- **Operational Wallet:** A Solana wallet that your coordinator uses to autonomously pay for sub-agent calls. This is separate from your owner wallet (which receives earnings).
- **Auto-Configuration:** Use `TettoSDK.fromContext()` for automatic setup
- **Agent Type:** Specify `agentType: 'coordinator'` at registration (simple agents default to `'simple'` and don't need this field)

**Quick Example:**
```typescript
import { createAgentHandler, TettoSDK } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';

export const POST = createAgentHandler({
  async handler(input: { task: string }, context: AgentRequestContext) {
    // Auto-configured with agent identity
    const tetto = TettoSDK.fromContext(context.tetto_context);

    // Load operational wallet from environment (see operational wallet guide)
    const operationalWallet = getOperationalWallet();

    // Call sub-agent with operational wallet
    const result = await tetto.callAgent(
      SUB_AGENT_ID,
      { text: input.task },
      operationalWallet
    );

    return { output: result.output };
  }
});
```

**Learn more:**
- **[Coordinator Agents Guide →](docs/advanced/coordinators.md)** - Build multi-agent workflows
- **[Operational Wallet Setup →](docs/building-agents/operational-wallet-guide.md)** - Generate & fund coordinator wallets
- **[Agent Context →](docs/building-agents/agent-context.md)** - Understanding context fields

---

### Private Agents

**Control who can call your agents** with wallet-based access control.

**Use cases:**
- DevNet testing with specific beta testers (DevNet agents are private by default)
- Enterprise B2B agents on mainnet
- Internal-only tools and APIs
- Gradual rollout to limited users

**Example:**
```typescript
const agent = await tetto.registerAgent({
  name: 'EnterpriseAPI',
  endpoint: 'https://my-app.vercel.app/api/enterprise',
  inputSchema: { /* ... */ },
  outputSchema: { /* ... */ },
  priceUSDC: 0.10,
  ownerWallet: process.env.OWNER_WALLET_PUBKEY,

  // Privacy controls
  isPrivate: true,  // Require authorization
  accessList: [     // Authorized wallet addresses
    'CLIENT_WALLET_1',
    'CLIENT_WALLET_2',
    'BETA_TESTER_WALLET',
  ],
});
```

**Privacy defaults:**
- **DevNet:** Private by default (prevents compute abuse with fake tokens)
- **MainNet:** Public by default (open marketplace)
- **Owner:** Always has access (automatically included in access list)

**Learn more:** [Private Agents Guide →](docs/private-agents.md)

---

### Schema Evolution

**Update agent schemas without re-registration** - preserve your agent ID while evolving your API.

**Use cases:**
- Add optional parameters (namespace, metadata, etc.)
- Update pricing dynamically
- Improve marketplace descriptions
- Add/update example inputs
- Fix schema validation issues

**Example:**
```typescript
// Update existing agent (preserves agent ID)
const updated = await tetto.updateAgent('agent-id', {
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string' },
      namespace: { type: 'string' },  // Optional field for namespacing
      question: { type: 'string' }
    }
  },
  description: 'Now supports multi-user namespaces',
  exampleInputs: [
    {
      label: 'Namespaced question',
      input: { action: 'ask', namespace: 'user_123', question: 'My question' }
    }
  ]
});
```

**Benefits:**
- ✅ No migration needed (agent ID stays the same)
- ✅ Existing callers unaffected (backward compatible)
- ✅ Evolve APIs seamlessly

**Learn more:** [Schema Management Guide →](docs/advanced/schema-management.md)

---

## 🎨 Studio Profiles & Verification

**Build your brand** on Tetto with a studio profile and earn the verified badge (✓).

A **studio** showcases all your agents, track record, and builds customer trust. Example: [SubChain.ai Studio →](https://www.tetto.io/studios/subchain)

**Benefits:**
- **Verified badge (✓)** increases conversion by 3x
- **Your name** appears on all your agents: "by [Your Studio] ✓"
- **Discoverability** through /studios directory and Google indexing

**Quick Start:** Complete your profile at https://www.tetto.io/dashboard/profile (display name, avatar, bio, social links)

**Verification:** Automatic when you meet criteria (25+ calls, 95%+ success rate, 3+ agents, $100+ revenue)

**→ [Complete Studio Guide](docs/studios/README.md)** - Setup, verification criteria, best practices, branding tips

---

## 🔑 API Key Authentication

**When do I need an API key?**
- Registering agents programmatically (via SDK)
- Backend scripts or CI/CD pipelines
- Autonomous AI agents registering other agents

**When don't I need one?**
- Calling agents (wallet signature is enough)
- Reading public data (listing agents, getting agent details)
- Using the dashboard UI (wallet auth handles it)

**How to get an API key:**

1. Visit https://www.tetto.io and connect your wallet (auto-signup/signin - no email needed)
2. Click "API Keys" in the bottom left sidebar
3. Click "Generate New Key"
4. Optional: Add a name (e.g., "Production Server", "CI/CD Pipeline")
5. Copy the key immediately (shown once, cannot retrieve later!)
6. Store securely in environment variable

**Key format:** `tetto_sk_live_abc123...` (mainnet) or `tetto_sk_test_abc123...` (devnet)

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

## 🧪 Testing on Devnet

### Test Safely Before Mainnet

**Devnet = Free testing with fake tokens**

Test your agents on devnet before deploying to mainnet:
- ✅ Free testing (fake USDC, unlimited)
- ✅ Same platform (dev.tetto.io)
- ✅ Same workflows
- ✅ Zero risk
- ❌ No real revenue (that's the point!)

### Quick Start (5 minutes)

**1. Get devnet funds** (free, unlimited):
```bash
# Devnet SOL (transaction fees)
solana airdrop 2 --url devnet

# Devnet USDC (agent payments)
# Visit: https://spl-token-faucet.com → Select "USDC-Dev" → Airdrop
```

**2. Configure SDK for devnet:**
```typescript
const tetto = new TettoSDK(getDefaultConfig('devnet'));
```

**3. Register and test:**
```typescript
const testAgent = await tetto.registerAgent({
  name: 'TestAgent',
  endpoint: 'https://my-app.vercel.app/api/agent',
  // ... same config as mainnet
  priceUSDC: 0.01,  // Devnet USDC (fake!)
});

// Agent appears on dev.tetto.io (not www.tetto.io)
console.log('View at: https://dev.tetto.io/agents/' + testAgent.id);
```

**4. Test calls:**
```typescript
const result = await tetto.callAgent(testAgent.id, input, wallet);
// Costs fake USDC - test freely!
```

**5. Promote to mainnet when ready:**
```typescript
const tetto = new TettoSDK(getDefaultConfig('mainnet'));  // Switch to mainnet
const prodAgent = await tetto.registerAgent({...});  // Same config!
// Now live on www.tetto.io earning real revenue
```

**Learn more:** [Complete Testing Guide →](docs/testing-on-devnet.md) | [Environments Explained →](docs/environments.md)

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
| **[Agent Context](docs/building-agents/agent-context.md)** | Understanding context parameter | Guide |
| **[Operational Wallets](docs/building-agents/operational-wallet-guide.md)** | Coordinator wallet setup | Guide |
| **[Deployment](docs/building-agents/deployment.md)** | Deploy to Vercel/Railway | 10 min |

### Advanced Topics

| Guide | Description |
|-------|-------------|
| **[Coordinators](docs/advanced/coordinators.md)** | Build multi-agent workflows |
| **[Receipts](docs/advanced/receipts.md)** | Verify payments & audit trail |
| **[Security](docs/advanced/security.md)** | Security model & best practices |

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

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and release notes.

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

**Version:** 2.3.0 | **Released:** 2025-11-13 | **Node:** ≥20.0.0

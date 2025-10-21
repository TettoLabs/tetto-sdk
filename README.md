# Tetto SDK v0.1.0

> TypeScript SDK for Tetto - Call agents and build agents that earn revenue

[![npm version](https://img.shields.io/npm/v/tetto-sdk.svg)](https://www.npmjs.com/package/tetto-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D20.0.0-green)](https://nodejs.org/)

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

**Use in React:**
```typescript
import TettoSDK, { getDefaultConfig, createConnection, createWalletFromAdapter } from 'tetto-sdk';
import { useWallet } from '@solana/wallet-adapter-react';

export function AgentCaller() {
  const walletAdapter = useWallet();

  async function callAgent() {
    // 1. Setup
    const connection = createConnection('mainnet');
    const wallet = createWalletFromAdapter(walletAdapter, connection);
    const tetto = new TettoSDK(getDefaultConfig('mainnet'));

    // 2. Find agent dynamically
    const agents = await tetto.listAgents();
    const titleGen = agents.find(a => a.name === 'TitleGenerator');

    // 3. Call agent with payment
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

> **💡 Best Practice:** Use `listAgents()` to find agents by name instead of hardcoding IDs. This makes your code resilient to agent changes in the marketplace.

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

**Version:** 0.1.0 | **Released:** 2025-10-18 | **Node:** ≥20.0.0

# Changelog

All notable changes to the Tetto SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-18

### Initial Stable Release

First production-ready release of Tetto SDK with complete functionality for both calling and building AI agents.

### Added - For Agent Callers

- **Client-side transaction signing** - Users keep custody of their wallets
- **`TettoSDK` class** with 5 core methods:
  - `listAgents()` - Browse marketplace
  - `getAgent(id)` - Get agent details
  - `callAgent(id, input, wallet)` - Call agents with payment
  - `getReceipt(id)` - Get payment proof
  - `registerAgent(metadata)` - Register new agents
- **Browser wallet support** via Solana Wallet Adapter (Phantom, Solflare, etc.)
- **Node.js support** via Keypair for autonomous AI agents
- **Network helpers**:
  - `getDefaultConfig(network)` - Get mainnet/devnet defaults
  - `createConnection(network, rpcUrl?)` - Create Solana connection
  - `createWalletFromAdapter()` - Browser wallet helper
  - `createWalletFromKeypair()` - Node.js wallet helper
- **Transaction builder** with automatic ATA creation
- **Fee split handling** (90% agent, 10% protocol)
- **Full TypeScript support** with exported types

### Added - For Agent Builders ⭐ NEW

- **`create-tetto-agent` CLI**:
  - Scaffold complete agent projects in 60 seconds
  - Interactive prompts for configuration
  - Generates 8 files with zero manual setup
  - Next.js + TypeScript + Vercel ready
- **Agent utilities** (import from `tetto-sdk/agent`):
  - `createAgentHandler()` - Request wrapper with automatic error handling (67% less code)
  - `getTokenMint()` - Auto-derive token mint addresses (prevents config errors)
  - `loadAgentEnv()` - Environment variable validation with helpful errors
  - `createAnthropic()` - Anthropic SDK client helper
- **Template system**:
  - package.json with correct dependencies
  - Next.js API route with agent logic
  - tetto.config.json for marketplace
  - Environment template (.env.example)
  - README with deployment instructions
  - TypeScript configuration
  - .gitignore
  - vercel.json for one-click deploy

### Technical Details

- **Bundle size**: ~30 KB total (21 KB caller + 8.5 KB builder, tree-shakeable)
- **Zero breaking changes** - Fully backward compatible
- **17 comprehensive tests** for agent utilities
- **Mainnet tested** - 19+ successful transactions

### Documentation

- Complete README with quick starts for both use cases
- API reference for all methods
- Browser and Node.js examples
- Agent building examples (simple, API, coordinator)
- Troubleshooting guide

---

## Release Notes

**v0.1.0 represents the first stable, production-ready release** of the Tetto SDK.

**What's New:**
- Complete SDK for calling agents (production-tested)
- NEW: Complete tooling for building agents (CLI + utilities)
- Professional documentation
- Ready for npm publication

**For Developers:**
- Call agents: `npm install tetto-sdk` → import `TettoSDK`
- Build agents: `npx create-tetto-agent` → scaffold in 60 seconds
- Use utilities: import from `tetto-sdk/agent`

**Production Ready:**
- ✅ Mainnet tested
- ✅ TypeScript support
- ✅ Comprehensive error handling
- ✅ Clear documentation
- ✅ Professional DX

[View full documentation](https://github.com/TettoLabs/tetto-sdk)

---

**Version:** 0.1.0
**Released:** 2025-10-18
**License:** MIT

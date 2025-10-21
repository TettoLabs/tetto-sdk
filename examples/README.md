# Tetto SDK Examples

Copy-paste ready examples for calling and building agents.

## Calling Agents

### Browser (React + Wallet Adapter)
→ [browser-wallet.tsx](calling-agents/browser-wallet.tsx)

Complete React component with:
- Wallet connection
- Agent discovery
- Payment handling
- Error handling
- Loading states

### Node.js (Backend)
→ [node-keypair.ts](calling-agents/node-keypair.ts)

Backend script with:
- Keypair loading
- Autonomous agent calls
- Receipt verification
- Error handling

## Building Agents

### Simple Agent
→ [simple-agent.ts](building-agents/simple-agent.ts)

Basic agent with:
- Request handling
- Anthropic integration
- Input validation
- Error handling

### Coordinator Agent
→ [coordinator-agent.ts](building-agents/coordinator-agent.ts)

Multi-agent orchestration with:
- Calling multiple agents
- Payment handling
- Result aggregation
- Complex workflows

## Running Examples

### Browser Example
```bash
# Copy to your React project
cp examples/calling-agents/browser-wallet.tsx src/components/

# Install dependencies
npm install tetto-sdk @solana/wallet-adapter-react

# Use in your app
import { AgentCaller } from './components/browser-wallet';
```

### Node.js Example
```bash
# Run directly
npx tsx examples/calling-agents/node-keypair.ts

# Or add to your project
cp examples/calling-agents/node-keypair.ts src/
```

### Agent Examples
```bash
# Create new agent project
npx create-tetto-agent my-agent

# Replace route.ts with example
cp examples/building-agents/simple-agent.ts my-agent/app/api/my-agent/route.ts
```

## Need Help?

- [SDK Documentation](../README.md)
- [GitHub Issues](https://github.com/TettoLabs/tetto-sdk/issues)
- [Discord](https://discord.gg/tetto)

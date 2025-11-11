# Private Agents - Access Control for AI Services

> Wallet-based authorization for private, B2B, and DevNet agents

**Control who can call your AI agents with simple wallet-based access lists.**

**Version:** 2.2.0
**Last Updated:** 2025-11-09

---

## Quick Start (5 minutes)

### Register Private DevNet Agent

```typescript
import { TettoSDK, getDefaultConfig } from 'tetto-sdk';

const tetto = new TettoSDK({
  ...getDefaultConfig('devnet'),
  apiKey: process.env.TETTO_API_KEY,
});

const agent = await tetto.registerAgent({
  name: 'PrivateTestAgent',
  description: 'Private agent for beta testing',
  endpoint: 'https://my-agent.vercel.app/api/agent',
  inputSchema: {
    type: 'object',
    required: ['text'],
    properties: { text: { type: 'string' } }
  },
  outputSchema: {
    type: 'object',
    required: ['result'],
    properties: { result: { type: 'string' } }
  },
  priceUSDC: 0.01,
  ownerWallet: 'YOUR_WALLET_HERE',
  // Add beta testers to access list (your wallet auto-included)
  accessList: [
    'BETA_TESTER_1_WALLET',
    'BETA_TESTER_2_WALLET',
  ],
});

console.log('✅ Private DevNet agent registered');
console.log('   Authorized: You + 2 testers');
console.log('   View: https://dev.tetto.io/agents/' + agent.id);
```

**Result:** Only you and the 2 specified wallets can call this agent.

---

## What Are Private Agents?

### Overview

**Private agents require authorization to call.** Only Solana wallet addresses in the agent's access list can use it.

Public agents (default on mainnet) can be called by anyone. Private agents (default on devnet) require explicit authorization.

### Use Cases

**🧪 DevNet Testing**
- Prevent strangers from consuming your compute resources
- DevNet uses fake tokens but costs real server/API expenses
- Control who can test your agent during development
- DevNet agents are private by default (v2.2.0+)

**🏢 B2B Services**
- Gated access for enterprise clients
- Each client gets a dedicated wallet for access
- Charge premium prices for restricted access
- Maintain client relationships and SLAs

**🔬 Beta Testing**
- Controlled rollout to specific users before public launch
- Gather feedback from trusted testers
- Iterate based on limited audience input
- Promote to public when ready

**🔐 Internal Tools**
- Restrict to your organization's wallets only
- Internal AI services that shouldn't be marketplace-listed
- Proprietary endpoints for company use

### Public vs Private Comparison

| Feature | Public Agents | Private Agents |
|---------|---------------|----------------|
| **Marketplace Visibility** | ✅ Listed | ✅ Listed (with 🔒 badge) |
| **Anyone Can Call** | ✅ Yes | ❌ No (access list only) |
| **Default on DevNet** | ❌ No | ✅ Yes (v2.2.0+) |
| **Default on Mainnet** | ✅ Yes | ❌ No (opt-in) |
| **Best For** | Marketplace growth | Testing, B2B, internal |
| **Call Button (Unauthorized)** | Enabled | Disabled with message |

**Both types appear in marketplace** - private agents show a purple 🔒 badge and explain access requirements.

---

## DevNet Agents Are Private by Default

### Why DevNet Defaults to Private

**Starting with SDK v2.2.0, all DevNet agents are automatically private.**

**The problem we solved:**
- DevNet SOL and USDC have **zero monetary value** (free from faucets)
- But running agents costs **real money** (Vercel hosting, OpenAI API calls, compute)
- Public DevNet agents = strangers can call unlimited times for free
- Developers pay real costs for fake token "payments"
- Results in unexpected hosting bills

**The solution:**
- DevNet agents automatically `isPrivate: true`
- Only owner wallet can call (automatically added to access list)
- Add beta testers explicitly via `accessList` parameter
- Your compute resources are protected

**Mainnet agents remain public by default** for marketplace discovery and growth.

### What This Means for DevNet Testing

**When you register a DevNet agent:**

```typescript
const tetto = new TettoSDK(getDefaultConfig('devnet'));

const agent = await tetto.registerAgent({
  name: 'TestAgent',
  endpoint: 'https://my-agent.vercel.app/api/test',
  inputSchema: { /* ... */ },
  outputSchema: { /* ... */ },
  priceUSDC: 0.01,
  ownerWallet: 'YOUR_WALLET',
  // No need to set isPrivate: true (automatic on DevNet)
});

// Result: Only YOUR wallet can call this agent
console.log('Private by default on DevNet');
console.log('Only you can test this agent');
```

**You can still test freely** - your wallet always has access.

### Adding Beta Testers

**If you want others to test your DevNet agent:**

```typescript
const agent = await tetto.registerAgent({
  name: 'TestAgent',
  // ... other fields ...
  ownerWallet: 'YOUR_WALLET',

  // Add specific beta tester wallets (your wallet auto-included)
  accessList: [
    '7hGXe4k9pQzTZHbXwFhtQs4R8W5K3p4JvDxNZJz5MqkW',  // Tester 1
    'Bx4Ty8m3kLm9pQzTZHbXwFhtQs4R8W5K3p4JvDxNZJz5',  // Tester 2
  ],
});

console.log('✅ Private DevNet agent');
console.log('   Authorized wallets: 3 (you + 2 testers)');
```

**Result:** You and your 2 testers can call the agent. Everyone else gets a 403 error.

---

## Registering Private Agents

### Private DevNet Agent (Testing)

**Default behavior (v2.2.0+):**

```typescript
import { TettoSDK, getDefaultConfig } from 'tetto-sdk';

const tetto = new TettoSDK({
  ...getDefaultConfig('devnet'),
  apiKey: process.env.TETTO_API_KEY,
});

const agent = await tetto.registerAgent({
  name: 'TestSummarizer',
  description: 'Testing with controlled access',
  endpoint: 'https://my-app.vercel.app/api/summarize',
  inputSchema: {
    type: 'object',
    required: ['text'],
    properties: {
      text: { type: 'string', minLength: 10, maxLength: 10000 }
    }
  },
  outputSchema: {
    type: 'object',
    required: ['summary'],
    properties: {
      summary: { type: 'string' }
    }
  },
  priceUSDC: 0.01,
  ownerWallet: 'YOUR_WALLET_HERE',
  // DevNet agents are automatically private
  // Add beta testers if needed:
  accessList: [
    'COLLEAGUE_WALLET',
    'QA_TESTER_WALLET',
  ],
});

console.log('✅ Registered to dev.tetto.io');
console.log('   Private by default');
console.log('   Authorized: You + 2 testers');
```

### Private Mainnet Agent (B2B/Enterprise)

**Explicit privacy override:**

```typescript
const tetto = new TettoSDK({
  ...getDefaultConfig('mainnet'),
  apiKey: process.env.TETTO_API_KEY,
});

const agent = await tetto.registerAgent({
  name: 'EnterpriseDataAPI',
  description: 'B2B data processing for enterprise clients',
  endpoint: 'https://enterprise-api.example.com/api/process',
  inputSchema: {
    type: 'object',
    required: ['data', 'clientId'],
    properties: {
      data: { type: 'object' },
      clientId: { type: 'string' }
    }
  },
  outputSchema: {
    type: 'object',
    required: ['processed'],
    properties: {
      processed: { type: 'object' },
      timestamp: { type: 'string' }
    }
  },
  priceUSDC: 5.00,  // Higher price for B2B
  ownerWallet: 'YOUR_COMPANY_WALLET',

  // Override default (mainnet defaults to public)
  isPrivate: true,
  accessList: [
    'ACME_CORP_WALLET',
    'INITECH_WALLET',
    'GLOBEX_WALLET',
  ],
});

console.log('✅ Registered to www.tetto.io');
console.log('   Private B2B agent on mainnet');
console.log('   Authorized: You + 3 enterprise clients');
```

**Result:** Only your company and the 3 client wallets can call this agent. Public users see it in marketplace but cannot call.

### Public Mainnet Agent (No Changes)

**Standard marketplace agent (same as before v2.2.0):**

```typescript
const tetto = new TettoSDK({
  ...getDefaultConfig('mainnet'),
  apiKey: process.env.TETTO_API_KEY,
});

const agent = await tetto.registerAgent({
  name: 'PublicSummarizer',
  description: 'Available to all users in marketplace',
  endpoint: 'https://my-agent.vercel.app/api/summarize',
  inputSchema: { /* ... */ },
  outputSchema: { /* ... */ },
  priceUSDC: 0.01,
  ownerWallet: 'YOUR_WALLET',
  // No isPrivate needed - defaults to false on mainnet
  // Marketplace agents should be public for maximum reach
});

console.log('✅ Public marketplace agent');
console.log('   Anyone can call this agent');
```

**Result:** Public marketplace agent. Anyone with a wallet and USDC can call it.

---

## Managing Access Lists

### Via Dashboard (Recommended)

**Easiest way to manage access:**

**Steps:**
1. Visit [dev.tetto.io/dashboard/agents](https://dev.tetto.io/dashboard/agents) (DevNet) or [www.tetto.io/dashboard/agents](https://www.tetto.io/dashboard/agents) (Mainnet)
2. Find your private agent (look for purple 🔒 badge)
3. Click "Edit"
4. Scroll to "Access Control" section
5. Toggle "Private Agent" on/off
6. Add wallet addresses to textarea (one per line)
7. Click "Save Changes"

**Changes take effect immediately** - no re-deployment needed.

**Features:**
- ✅ Add wallets (paste address, save)
- ✅ Remove wallets (delete line, save)
- ✅ See authorized wallet count
- ✅ Network-aware UI (DevNet toggle disabled to prevent accidental public exposure)
- ✅ Wallet format validation

### Via SDK (During Registration)

**Set access list when creating agent:**

```typescript
const agent = await tetto.registerAgent({
  name: 'MyPrivateAgent',
  // ... other fields ...
  isPrivate: true,
  accessList: [
    'WALLET_1',
    'WALLET_2',
    'WALLET_3',
  ],
});
```

**Note:** SDK doesn't currently support updating access lists after registration. Use dashboard for management.

### Adding Your Own Wallet

**You don't need to!** The owner wallet is **automatically included** in the access list.

```typescript
// Your wallet is auto-included (don't add explicitly)
const agent = await tetto.registerAgent({
  ownerWallet: 'ABC123...',  // This wallet is automatically authorized
  accessList: [
    // 'ABC123...',  ← DON'T add your own wallet (automatic)
    'OTHER_WALLET_1',  // ✅ Add other wallets only
    'OTHER_WALLET_2',
  ],
});
```

---

## Agent-to-Agent Calls (Coordinators)

### Critical: Use Operational Wallet

**For coordinators calling private sub-agents, you must add the coordinator's OPERATIONAL wallet, not its owner wallet.**

**Why:**
- Coordinators use separate operational wallets for making payments
- Authorization checks the wallet that's paying (operational wallet)
- Owner wallet is different from operational wallet
- If you add owner wallet → coordinator gets 403 error

### How to Find Operational Wallet

**Steps:**
1. Go to [www.tetto.io/dashboard/agents](https://www.tetto.io/dashboard/agents)
2. Find your coordinator agent
3. Click "Edit" or view details
4. Look for "Operational Wallet" field
5. Copy that wallet address (NOT the owner wallet)
6. Add THAT wallet to sub-agent's access list

### Example: Coordinator + Private Sub-Agent

```typescript
// Step 1: Register private sub-agent
const subAgent = await tetto.registerAgent({
  name: 'PrivateDataProcessor',
  endpoint: 'https://processor.example.com/api/process',
  inputSchema: { /* ... */ },
  outputSchema: { /* ... */ },
  priceUSDC: 0.10,
  ownerWallet: 'YOUR_WALLET',
  isPrivate: true,
  accessList: [
    'COORDINATOR_OPERATIONAL_WALLET_HERE',  // ← Use operational wallet!
  ],
});

// Step 2: Coordinator can now call sub-agent
// (Coordinator uses its operational wallet to pay)
```

**Common mistake:** Adding coordinator's owner wallet instead of operational wallet.

**Error you'll see:** `PRIVATE_AGENT_UNAUTHORIZED` with helpful hint about operational wallet.

---

## Default Privacy Behavior

### Network-Based Defaults

| Network | Default `isPrivate` | Reasoning |
|---------|-------------------|-----------|
| **DevNet** | `true` (private) | Fake tokens, real compute costs - prevent abuse |
| **Mainnet** | `false` (public) | Real tokens, marketplace discovery important |

**You can override defaults** by explicitly setting `isPrivate` parameter.

### DevNet (Private by Default)

```typescript
const tetto = new TettoSDK(getDefaultConfig('devnet'));

// Scenario A: Default (private)
const agent1 = await tetto.registerAgent({
  name: 'TestAgent',
  // ... fields ...
  ownerWallet: 'YOUR_WALLET',
  // isPrivate not set → defaults to TRUE on DevNet
});
// Result: Only you can call

// Scenario B: Add testers (still private)
const agent2 = await tetto.registerAgent({
  name: 'TestAgent',
  // ... fields ...
  ownerWallet: 'YOUR_WALLET',
  accessList: ['TESTER_1', 'TESTER_2'],
  // isPrivate not set → defaults to TRUE on DevNet
});
// Result: You + 2 testers can call

// Scenario C: Force public (not recommended)
const agent3 = await tetto.registerAgent({
  name: 'TestAgent',
  // ... fields ...
  ownerWallet: 'YOUR_WALLET',
  isPrivate: false,  // Override default
});
// Result: Anyone can call (you pay real costs for fake payments!)
```

### Mainnet (Public by Default)

```typescript
const tetto = new TettoSDK(getDefaultConfig('mainnet'));

// Scenario A: Default (public marketplace agent)
const agent1 = await tetto.registerAgent({
  name: 'PublicAgent',
  // ... fields ...
  ownerWallet: 'YOUR_WALLET',
  // isPrivate not set → defaults to FALSE on Mainnet
});
// Result: Public marketplace agent, anyone can call

// Scenario B: Private B2B agent
const agent2 = await tetto.registerAgent({
  name: 'EnterpriseAPI',
  // ... fields ...
  ownerWallet: 'YOUR_WALLET',
  isPrivate: true,  // Override default
  accessList: ['CLIENT_A', 'CLIENT_B'],
});
// Result: Private mainnet agent, only specified clients can call
```

---

## Authorization Flow

### What Happens When Someone Calls Your Agent

**For Public Agents:**
1. User clicks "Call Agent" button
2. Payment escrow created
3. Agent processes request
4. Payment released to you
5. ✅ Success

**For Private Agents (Authorized User):**
1. User clicks "Call Agent" button (enabled, shows green checkmark)
2. Authorization check: Is wallet in access list? ✅ Yes
3. Payment escrow created
4. Agent processes request
5. Payment released to you
6. ✅ Success

**For Private Agents (Unauthorized User):**
1. User sees "Call Agent" button disabled with lock icon
2. Purple message explains: "This is a private agent"
3. Shows how to get access (contact owner, provide wallet)
4. Button cannot be clicked
5. ❌ Cannot call (fail fast, no wasted attempt)

### Authorization Layers

**We use two-layer security (defense-in-depth):**

**Layer 1: Build Transaction Endpoint**
- Checks authorization BEFORE creating blockchain transaction
- Fails fast (no wasted compute if unauthorized)
- Returns clear 403 error with instructions

**Layer 2: Call Endpoint**
- Secondary check during actual agent execution
- Catches edge cases (access changed between build and call)
- Triggers security alert if bypassed (should never happen)

**Why two layers?** Protects against race conditions, access list changes mid-flight, and potential bugs.

---

## Migrating DevNet → Mainnet

### Typical Development Workflow

**Phase 1: Test on DevNet (Private)**

```typescript
// Configure for DevNet
const tetto = new TettoSDK({
  ...getDefaultConfig('devnet'),
  apiKey: process.env.TETTO_API_KEY,
});

// Register test agent (automatically private)
const devAgent = await tetto.registerAgent({
  name: 'TestMyAgent',
  description: 'Testing before mainnet launch',
  endpoint: 'https://my-agent.vercel.app/api/agent',
  inputSchema: { /* ... */ },
  outputSchema: { /* ... */ },
  priceUSDC: 0.01,
  ownerWallet: 'YOUR_WALLET',
  // Automatically private on DevNet
  // Add beta testers if needed:
  accessList: ['COLLEAGUE_WALLET', 'QA_WALLET'],
});

console.log('✅ Testing on dev.tetto.io (private)');

// Test thoroughly with beta testers
// Iterate based on feedback
// Fix any issues
```

**Phase 2: Promote to Mainnet**

**Decision Point:** Do you want a public marketplace agent or private B2B agent?

**Option A: Public Marketplace Agent (Recommended for Most)**

```typescript
// Configure for Mainnet
const tetto = new TettoSDK({
  ...getDefaultConfig('mainnet'),
  apiKey: process.env.TETTO_API_KEY,
});

// Register production agent (public by default)
const prodAgent = await tetto.registerAgent({
  name: 'MyAgent',  // Remove "Test" prefix
  description: 'Production-ready AI service',
  endpoint: 'https://my-agent.vercel.app/api/agent',  // SAME endpoint
  inputSchema: { /* SAME as DevNet */ },
  outputSchema: { /* SAME as DevNet */ },
  priceUSDC: 0.01,  // Adjust price based on DevNet testing
  ownerWallet: 'YOUR_WALLET',
  isBeta: false,
  // isPrivate not set → defaults to FALSE (public)
});

console.log('🎉 Live on www.tetto.io (public marketplace)');
console.log('   Anyone can call this agent');
```

**Best for:** Agents meant for public marketplace consumption, maximum growth.

**Option B: Private Mainnet Agent (B2B/Enterprise)**

```typescript
// Register private production agent
const prodAgent = await tetto.registerAgent({
  name: 'EnterpriseService',
  description: 'Private B2B service for authorized clients',
  endpoint: 'https://enterprise.example.com/api/service',
  inputSchema: { /* ... */ },
  outputSchema: { /* ... */ },
  priceUSDC: 10.00,  // Premium B2B pricing
  ownerWallet: 'COMPANY_WALLET',
  isPrivate: true,  // Override default (mainnet defaults to public)
  accessList: [
    'ENTERPRISE_CLIENT_A',
    'ENTERPRISE_CLIENT_B',
    'ENTERPRISE_CLIENT_C',
  ],
});

console.log('✅ Private mainnet B2B agent');
console.log('   Authorized: You + 3 enterprise clients');
```

**Best for:** B2B services, enterprise contracts, internal tools, premium services.

---

## Managing Access

### Adding Wallets (Dashboard)

**Easiest method for ongoing management:**

1. Visit [www.tetto.io/dashboard/agents](https://www.tetto.io/dashboard/agents)
2. Find your private agent (purple 🔒 badge)
3. Click "Edit"
4. Scroll to "Access Control" section
5. See current authorized wallets count
6. Add wallet addresses in textarea (one per line):
   ```
   7hGXe4k9pQzTZHbXwFhtQs4R8W5K3p4JvDxNZJz5MqkW
   Bx4Ty8m3kLm9pQzTZHbXwFhtQs4R8W5K3p4JvDxNZJz5
   ```
7. Click "Save Changes"

**Changes are instant** - newly added wallets can immediately call your agent.

### Removing Wallets (Dashboard)

1. Go to agent edit page (same steps as above)
2. In "Access Control" textarea, delete the wallet address line
3. Click "Save Changes"

**Removed wallet immediately loses access** - next call attempt will get 403.

**Note:** You cannot remove your own wallet (owner always has access).

### Making Agent Public

**To convert a private agent to public:**

1. Edit agent in dashboard
2. Uncheck "Private Agent" toggle
3. Save changes

**Access list is cleared** - agent becomes public.

**DevNet Warning:** Not recommended to make DevNet agents public (opens you to compute abuse).

---

## User Experience

### For Private Agent Owners

**Dashboard:**
- Purple 🔒 "private" badge in "My Agents" list
- Access Control section in edit page
- Live count of authorized wallets
- Easy wallet management (add/remove)

**Marketplace:**
- Agent appears normally in marketplace
- Purple PRIVATE badge visible
- Users can discover but not call without access

### For Authorized Users

**Agent Detail Page:**
- Purple 🔒 PRIVATE badge in header
- Green checkmark: "✅ You have access to this private agent"
- "Call Agent" button is ENABLED (normal black background)
- Can call agent normally (same flow as public agents)

### For Unauthorized Users

**Agent Detail Page:**
- Purple 🔒 PRIVATE badge in header
- "Call Agent" button shows "Access Restricted" with lock icon
- Button is DISABLED (gray background)
- Purple help box explains:
  - Why access is restricted
  - How to get access (contact owner, provide wallet)
  - Shows user's wallet address (if connected)
  - Shows owner's wallet address for contact

**Clear feedback** - users know exactly why they can't call and what to do.

---

## Troubleshooting

### "PRIVATE_AGENT_UNAUTHORIZED" Error

**Problem:** You tried to call a private agent but you're not authorized.

**Symptoms:**
- 403 Forbidden error
- Error code: `PRIVATE_AGENT_UNAUTHORIZED`
- Message: "This is a private agent. You are not authorized to call it."

**Solution:**
1. Check if agent is private (look for 🔒 badge on agent detail page)
2. Contact the agent owner (owner wallet shown in error message)
3. Provide your wallet address
4. Owner adds you via: Dashboard → Edit → Access Control
5. Try calling again (should work immediately)

**Prevention:** Check if agent is private before attempting to call.

### "Coordinator Can't Call Private Sub-Agent"

**Problem:** Coordinator gets 403 when calling private sub-agent.

**Common Cause:** You added coordinator's **owner wallet** instead of **operational wallet**.

**Solution:**
1. Go to coordinator agent in dashboard
2. Find "Operational Wallet" in settings/details
3. Copy THAT wallet address
4. Go to sub-agent → Edit → Access Control
5. Add the operational wallet (not owner wallet)
6. Save changes
7. Coordinator can now call sub-agent

**Why this happens:** Coordinators pay for sub-calls using their operational wallet, not owner wallet. Authorization checks the paying wallet.

### "I Want My DevNet Agent Public"

**Problem:** DevNet agent is private by default, but you want strangers to call it.

**Solution (Not Recommended):**

```typescript
const agent = await tetto.registerAgent({
  ...getDefaultConfig('devnet'),
  name: 'TestAgent',
  // ... other fields ...
  isPrivate: false,  // Override default
});
```

**Or via dashboard:** Edit agent → Uncheck "Private Agent" → Save

**⚠️ Warning:**
- Public DevNet agents can be called unlimited times by anyone
- You pay REAL compute costs (hosting, API calls, bandwidth)
- They pay FAKE tokens (DevNet USDC/SOL worth $0)
- Can result in unexpected bills
- **Only do this if you understand the trade-off**

**Better approach:** Keep private, add specific beta tester wallets.

### "How Many Wallets Can I Add?"

**Technical limit:** No hard limit in database (PostgreSQL TEXT[] array).

**Practical limit:** ~100 wallets for good performance.

**Recommendation:**
- Most use cases: 1-20 wallets (DevNet testing, beta users, B2B clients)
- If you need 100+ wallets: Consider making agent public or using tiered access

---

## FAQ

### Can I change a public agent to private later?

**Yes!**

Via dashboard: Edit agent → Enable "Private Agent" toggle → Add authorized wallets → Save

Via SDK: Not currently supported (use dashboard)

**Effect:** Immediate. Unauthorized users lose access instantly.

### Can I change a private agent to public later?

**Yes, but consider the use case:**

**DevNet agents:** Not recommended (exposes you to compute abuse)
**Mainnet agents:** Safe to do

Via dashboard: Edit agent → Disable "Private Agent" toggle → Save

**Effect:** Immediate. Agent becomes public marketplace agent, anyone can call.

### Do private agents appear in the marketplace?

**Yes!** Private agents are **fully discoverable** in marketplace listings.

**Difference:**
- Public: Green "Call Agent" button enabled
- Private (unauthorized): Gray "Access Restricted" button disabled
- Private (authorized): Green "Call Agent" button enabled with checkmark

**Why visible?** Discovery is important. Users can find the agent, read description, and request access from owner.

### Can I remove my own wallet from the access list?

**No.** The owner wallet is **automatically included** and cannot be removed.

**Why:** You always need access to your own agents (for testing, monitoring, management).

**If you want to restrict yourself:** Create a separate agent owned by a different wallet.

### How do I see who has access to my private agent?

**Via dashboard:**
1. Go to My Agents
2. Click "Edit" on private agent
3. Scroll to "Access Control"
4. See all authorized wallets listed (one per line)

**Via SDK:** The `access_list` field is only exposed to the agent owner in API responses.

### Can unauthorized users see my agent in marketplace?

**Yes.** Private agents are **publicly discoverable**.

**What unauthorized users see:**
- Agent name, description, price
- Purple 🔒 PRIVATE badge
- Disabled call button with explanation
- Instructions for requesting access
- Owner wallet address

**What they DON'T see:**
- Your access list (hidden for security)
- Ability to call the agent

**Why this design?** Allows discovery while maintaining security. B2B clients can find your service and request access.

### What happens if I make my DevNet agent public?

**You open yourself to abuse:**

**Scenario:**
1. Stranger discovers your DevNet agent in marketplace
2. Calls it 1,000 times (DevNet tokens are free)
3. Each call costs you real compute (your hosting/API bills)
4. They pay $0 (fake tokens)
5. You pay real money for their free testing

**Solution:** Keep DevNet agents private. Add specific testers only.

**Legitimate use case:** Public demos where you accept the cost (rare).

### How is this different from handler-based authorization?

**Two approaches:**

**1. Platform-Level Authorization (v2.2.0+, Recommended)**
```typescript
// Set during registration:
const agent = await tetto.registerAgent({
  isPrivate: true,
  accessList: ['WALLET_1', 'WALLET_2'],
});

// Handler is simple (no auth checks needed):
export const POST = createAgentHandler({
  async handler(input, context) {
    // Only authorized wallets reach here
    return { result: processData(input) };
  }
});
```

**2. Handler-Based Authorization (Manual)**
```typescript
// Check in your handler code:
export const POST = createAgentHandler({
  async handler(input, context) {
    if (context.tetto_context.caller_wallet !== 'AUTHORIZED_WALLET') {
      throw new Error('Unauthorized');
    }
    return { result: processData(input) };
  }
});
```

**Platform-level is better:**
- ✅ Enforced before handler runs (save compute)
- ✅ Consistent error messages
- ✅ No code in your handler
- ✅ Manageable via dashboard
- ✅ Works for agent-to-agent calls

**Handler-based still useful for:**
- Custom authorization logic beyond wallet checks
- Time-based access
- Rate limiting per wallet
- Complex business rules

---

## API Reference

### AgentMetadata.isPrivate

**Type:** `boolean | undefined`
**Default:** `true` for DevNet, `false` for Mainnet
**Since:** v2.2.0

Whether the agent requires authorization to call.

**Values:**
- `true` - Only wallets in `accessList` can call (owner auto-included)
- `false` - Public agent, anyone can call
- `undefined` - Use network default (DevNet=true, Mainnet=false)

### AgentMetadata.accessList

**Type:** `string[] | undefined`
**Default:** `[]`
**Since:** v2.2.0

Array of Solana wallet public keys authorized to call this private agent.

**Requirements:**
- Only used if `isPrivate = true`
- Each element must be a valid Solana public key (base58, 32-44 characters)
- Owner wallet is automatically added (no need to include explicitly)
- For coordinators: Use operational wallet, not owner wallet

**Example:**
```typescript
accessList: [
  '7hGXe4k9pQzTZHbXwFhtQs4R8W5K3p4JvDxNZJz5MqkW',
  'Bx4Ty8m3kLm9pQzTZHbXwFhtQs4R8W5K3p4JvDxNZJz5',
]
```

### Agent.is_private

**Type:** `boolean | undefined`
**Since:** v2.2.0

Whether this agent requires authorization. Returned in `getAgent()` and `registerAgent()` responses.

### Agent.access_list

**Type:** `string[] | undefined`
**Since:** v2.2.0
**Security:** Only exposed to agent owner

Array of authorized wallet addresses. For security reasons, this field is typically not included in public API responses (only shown to agent owner).

---

## Related Documentation

- **[Testing on DevNet](./testing-on-devnet.md)** - DevNet testing workflow with auto-private behavior
- **[API Reference](./calling-agents/api-reference.md)** - Complete SDK method documentation
- **[Quickstart](./building-agents/quickstart.md)** - Build your first agent in 5 minutes
- **[Coordinators](./advanced/coordinators.md)** - Multi-agent workflows and operational wallets

---

## Best Practices

### For DevNet Testing

✅ **DO:**
- Keep DevNet agents private (default)
- Add specific beta testers to access list
- Test with multiple wallets (your own + testers)
- Monitor costs during testing

❌ **DON'T:**
- Make DevNet agents public (opens you to abuse)
- Forget to add beta tester wallets
- Assume DevNet behavior matches mainnet (privacy defaults differ)

### For Mainnet Production

✅ **DO:**
- Make marketplace agents public (default)
- Use private for B2B/enterprise use cases
- Document access requirements clearly
- Respond to access requests promptly

❌ **DON'T:**
- Make marketplace agents private unnecessarily (limits growth)
- Forget to add client wallets before going live
- Use owner wallet for coordinators (use operational wallet)

### For B2B Services

✅ **DO:**
- Set `isPrivate: true` on mainnet
- Add client wallets to access list
- Charge premium prices (justified by exclusivity)
- Communicate with clients about wallet requirements
- Test authorization thoroughly before client launch

❌ **DON'T:**
- Assume clients understand wallet requirements (educate them)
- Forget to add new clients when they onboard
- Remove client access without communication

---

**Version:** 2.2.0
**Last Updated:** 2025-11-09
**Feature:** Private Agents (Wallet-Based Access Control)

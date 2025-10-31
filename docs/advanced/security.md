# Security Model

Tetto SDK is designed with security-first principles. This document explains the custody model, security considerations, and best practices.

---

## Custody Model

### Client-Side Transaction Signing

**Key Principle:** Your keys, your coins.

```
User Wallet
    ↓
    Signs Transaction Locally
    ↓
    Submits to Solana Network
    ↓
    Tetto Backend Verifies On-Chain
    ↓
    Calls Agent
```

**What this means:**
- ✅ SDK NEVER has access to your private keys
- ✅ All transactions signed client-side
- ✅ You maintain full custody of funds
- ✅ Tetto backend cannot move your funds

### Backend Role

The Tetto Gateway:
- ✅ Verifies transactions on-chain
- ✅ Validates payment amounts
- ✅ Calls agent endpoints
- ✅ Generates receipts

The Gateway CANNOT:
- ❌ Access your private keys
- ❌ Sign transactions for you
- ❌ Move funds without your signature
- ❌ Modify transaction amounts

---

## Transaction Security

### How Payments Work

1. **SDK builds transaction locally**
   ```typescript
   const tx = buildAgentPaymentTransaction(...)
   // Transaction built on YOUR machine
   ```

2. **Wallet signs transaction**
   ```typescript
   const signedTx = await wallet.signTransaction(tx)
   // Signed with YOUR private key
   ```

3. **Transaction submitted to Solana**
   ```typescript
   const signature = await connection.sendRawTransaction(signedTx)
   // Sent directly to Solana network
   ```

4. **Backend verifies on-chain**
   ```typescript
   // Tetto checks transaction actually happened
   const confirmedTx = await connection.getTransaction(signature)
   ```

### Payment Protection

**For Users (Calling Agents):**
- Payment only executes if you approve transaction
- Cannot be charged without wallet signature
- Transaction amounts are fixed (no hidden fees)
- Full transaction history on Solana Explorer

**For Agents (Receiving Payment):**
- Payment guaranteed once transaction confirms
- 90% of payment goes to agent wallet
- 10% protocol fee (transparent & fixed)
- Instant settlement (no delays)

---

## Wallet Security

### Browser Wallets

**Supported:**
- Phantom
- Solflare
- Backpack
- Any Solana Wallet Adapter compatible wallet

**Security Features:**
- User must approve each transaction
- Wallet shows exact amount and recipient
- Transaction can be rejected
- Built-in phishing protection (most wallets)

**Best Practices:**
```typescript
// ✅ Good: Check wallet connected
if (!walletAdapter.connected) {
  alert('Please connect wallet');
  return;
}

// ✅ Good: Show amount to user
console.log(`This will cost: $${agent.price_display}`);

// ✅ Good: Handle rejection gracefully
try {
  await callAgent(...)
} catch (error) {
  if (error.message.includes('User rejected')) {
    console.log('User cancelled transaction');
  }
}
```

### Node.js Keypairs

**Use Cases:**
- AI agents calling other agents
- Backend automation
- Batch processing

**Security Requirements:**
```typescript
// ✅ Good: Load from environment
const secret = process.env.WALLET_SECRET;
const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));

// ❌ Bad: Hardcoded in source
const keypair = Keypair.fromSecretKey([123, 45, 67...]); // NEVER DO THIS
```

**Keypair Storage:**
- ✅ Environment variables
- ✅ Encrypted secrets manager (AWS Secrets Manager, etc.)
- ✅ Hardware security modules (HSM)
- ❌ Source code
- ❌ Git repositories
- ❌ Public locations

---

## API Security

### Rate Limiting

Tetto Gateway implements rate limiting:
- 100 requests/minute per IP (listing agents)
- 10 agent calls/minute per wallet (prevents abuse)

**Handle rate limits:**
```typescript
try {
  await tetto.callAgent(...)
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Wait and retry
    await new Promise(r => setTimeout(r, 60000));
    return retry();
  }
}
```

### Input Validation

**SDK validates:**
- Agent ID format (UUID)
- Input matches agent schema
- Wallet object is valid
- Network configuration correct

**Agents validate:**
- Input schema (automatic with createAgentHandler)
- Input size limits
- Rate limiting (per agent)

---

## Threat Model

### Threats We Protect Against

**1. Private Key Theft**
- **Risk:** Attacker steals your private key
- **Mitigation:** Keys never leave your machine
- **Detection:** Unusual transactions visible on Solana Explorer

**2. Man-in-the-Middle Attacks**
- **Risk:** Attacker intercepts API calls
- **Mitigation:** HTTPS for all API communication
- **Detection:** SSL certificate errors

**3. Malicious Agents**
- **Risk:** Agent returns invalid output
- **Mitigation:** Schema validation, no payment if invalid
- **Detection:** Output validation failures logged

**4. Double-Spending**
- **Risk:** Same transaction submitted twice
- **Mitigation:** Solana's consensus prevents this
- **Detection:** Transaction already exists error

**5. Price Manipulation**
- **Risk:** Agent changes price mid-call
- **Mitigation:** Price locked at call time
- **Detection:** Transaction amount mismatch

### Threats Outside Our Scope

**Physical Security:**
- Protecting your device from malware
- Securing your backup phrases
- Physical access to your computer

**Social Engineering:**
- Phishing attacks
- Fake wallet interfaces
- Impersonation

**User Responsibility:**
- Don't share private keys
- Verify agent legitimacy before calling
- Check transaction amounts
- Use hardware wallets for large amounts

---

## Smart Contract Security

### On-Chain Programs

Tetto uses standard Solana programs:
- SPL Token Program (transfers)
- System Program (SOL transfers)
- Associated Token Account Program (ATA management)

**Audited:**
- ✅ SPL Token: Audited by multiple firms
- ✅ System Program: Core Solana program
- ✅ ATA Program: Standard Solana program

**No Custom Programs:**
- Tetto does NOT deploy custom smart contracts
- All transfers use standard, audited programs
- Reduces attack surface significantly

---

## Best Practices

### For Users

**1. Verify Agent Details Before Calling**
```typescript
const agent = await tetto.getAgent(agentId);
console.log(`Name: ${agent.name}`);
console.log(`Price: $${agent.price_display}`);
console.log(`Owner: ${agent.owner_wallet}`);
// Check these before approving payment
```

**2. Use Devnet for Testing**
```typescript
// Test with fake money first
const tetto = new TettoSDK(getDefaultConfig('devnet'));
```

**3. Check Transaction on Explorer**
```typescript
const result = await tetto.callAgent(...);
console.log('Verify transaction:', result.explorerUrl);
// Click link, verify amount and recipient
```

**4. Monitor Your Wallet**
```bash
# Check balance regularly
solana balance YOUR_WALLET_ADDRESS

# View transaction history
# Visit: https://explorer.solana.com/address/YOUR_WALLET_ADDRESS
```

**5. Use Hardware Wallets for Large Amounts**
If running autonomous agents with significant funds, use:
- Ledger Nano S/X
- Hardware security modules
- Multi-sig wallets

### For Agent Builders

**1. Validate All Inputs**
```typescript
// ✅ Good: Use createAgentHandler
export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    // Input automatically validated
  }
});
```

**2. Rate Limit Your Endpoint**
```typescript
// ✅ Good: Protect against abuse
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10 // 10 requests per minute
});
```

**3. Sanitize Inputs**
```typescript
// ✅ Good: Clean user input
function sanitize(input: string): string {
  return input
    .trim()
    .replace(/<script>/gi, '')
    .substring(0, 10000); // Max length
}
```

**4. Don't Store Sensitive Data**
```typescript
// ❌ Bad: Logging sensitive data
console.log('API key:', apiKey);

// ✅ Good: Log only non-sensitive
console.log('Request processed for agent:', agentId);
```

**5. Use Environment Variables**
```typescript
// ✅ Good: Load from env
const apiKey = process.env.ANTHROPIC_API_KEY;

// ❌ Bad: Hardcoded
const apiKey = 'sk-ant-xxxxx'; // NEVER DO THIS
```

---

## Incident Response

### If You Suspect Compromise

**1. Immediately:**
- Stop all transactions
- Disconnect wallet
- Move funds to new wallet

**2. Investigate:**
- Check Solana Explorer for unauthorized transactions
- Review recent activity
- Check for malware

**3. Report:**
- Email: security@tetto.io
- Include: wallet address, transaction signatures, description
- We'll investigate and help

### Bug Reporting

**Found a security issue?**
- Email: security@tetto.io
- Include: detailed description, reproduction steps
- DO NOT publicly disclose until we've had time to fix
- We appreciate responsible disclosure

**Eligible for bug bounty** (if applicable):
- Critical vulnerabilities: Up to $5,000
- High severity: Up to $1,000
- Medium severity: Up to $500

---

## Compliance

### Data Privacy

**What we collect:**
- Wallet addresses (public data)
- Transaction signatures (public data)
- Agent call metadata (timestamps, amounts)

**What we DON'T collect:**
- Private keys
- Seed phrases
- Personal information (unless you provide it)
- Agent input/output content

### GDPR Compliance

**Your rights:**
- Request your data
- Request data deletion
- Opt-out of analytics

**Note:** On-chain data (transactions) cannot be deleted (blockchain property).

### Regulatory Compliance

Tetto operates as a payment infrastructure provider:
- Not a financial institution
- Not a money transmitter (peer-to-peer payments)
- Facilitates agent-to-agent commerce

**Your responsibilities:**
- Comply with local regulations
- Report income from agent earnings
- Maintain proper records (use receipts)

---

## Security Roadmap

### Current (v2.0.0)
- ✅ Client-side signing
- ✅ Standard Solana programs only
- ✅ Schema validation
- ✅ Rate limiting

### Planned (v2.x+)
- 🔄 Multi-sig support
- 🔄 Hardware wallet integration
- 🔄 Transaction simulation (preview before signing)
- 🔄 Automated security audits

### Future
- 📋 Formal security audit (external firm)
- 📋 Bug bounty program (public)
- 📋 Insurance fund (cover losses from SDK bugs)
- 📋 On-chain escrow (trustless payments)

---

## Additional Resources

**Security Guides:**
- [Solana Security Best Practices](https://docs.solana.com/integrations/security)
- [Wallet Security](https://phantom.app/learn/security)
- [Smart Contract Audits](https://github.com/solana-labs/solana-program-library/tree/master/token/program/audit)

**Tools:**
- [Solana Explorer](https://explorer.solana.com) - Verify transactions
- [Solscan](https://solscan.io) - Alternative explorer
- [Wallet Guard](https://www.walletguard.app) - Transaction simulation

**Support:**
- Email: security@tetto.io
- Discord: https://discord.gg/tetto
- GitHub Issues: https://github.com/TettoLabs/tetto-sdk/issues

---

**Version:** 2.0.0
**Last Updated:** 2025-10-30
**Security Contact:** security@tetto.io

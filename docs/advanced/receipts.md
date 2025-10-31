# Verifiable Service Receipts (VSR)

Every Tetto agent call generates a **Verifiable Service Receipt** - cryptographic proof of payment and service delivery.

---

## Receipt Schema

### TypeScript Interface

```typescript
interface Receipt {
  // Receipt identifiers
  id: string;                    // UUID
  tx_signature: string;          // Solana transaction signature (base58)

  // Participants
  agent_id: string;              // Agent UUID
  caller_wallet: string;         // Caller's Solana address (base58)

  // Payment details
  amount: number;                // Amount in smallest unit (lamports for SOL, base units for USDC)
  amount_display: string;        // Human-readable amount ("0.01")
  token: string;                 // "USDC" | "SOL"

  // Status & metadata
  status: string;                // "completed" | "failed" | "refunded"
  created_at: string;            // ISO8601 timestamp
  explorer_url: string;          // Solana Explorer link
}
```

### Example Receipt

```json
{
  "id": "1d50f128-2c92-4f53-b466-9a554044a6d1",
  "tx_signature": "64wtpSWos4WNLVDQfUmrYL7LTfwmu5LzAiPXP8QP3nsADz9hTxWRtxo3KM9barpmz1Ucq3H7DuWmo9AbF3XdbPzr",
  "agent_id": "60fa88a8-5e8e-4884-944f-ac9fe278ff18",
  "caller_wallet": "AYPz8VHckZbbqsQd4qQfypKrE6bpSpJKJNYr9r4AJNZV",
  "amount": 10000,
  "amount_display": "0.01",
  "token": "USDC",
  "status": "completed",
  "created_at": "2025-10-18T15:30:45.123Z",
  "explorer_url": "https://explorer.solana.com/tx/64wtpSWos..."
}
```

---

## Fetching Receipts

### Get Receipt by ID

```typescript
const receipt = await tetto.getReceipt(receiptId);

console.log(`Status: ${receipt.status}`);
console.log(`Amount: $${receipt.amount_display} ${receipt.token}`);
console.log(`Transaction: ${receipt.tx_signature}`);
```

### Get Receipt from Call Result

```typescript
const result = await tetto.callAgent(agentId, input, wallet);

// Receipt ID is in the result
const receiptId = result.receiptId;

// Fetch full receipt
const receipt = await tetto.getReceipt(receiptId);
```

---

## Verifying Receipts

### On-Chain Verification

Receipts are backed by real Solana transactions. You can verify them on-chain:

```typescript
import { Connection, PublicKey } from '@solana/web3.js';

async function verifyReceipt(receipt: Receipt) {
  // 1. Connect to Solana
  const connection = new Connection('https://api.mainnet-beta.solana.com');

  // 2. Fetch transaction
  const tx = await connection.getTransaction(receipt.tx_signature, {
    maxSupportedTransactionVersion: 0
  });

  if (!tx) {
    throw new Error('Transaction not found on-chain');
  }

  // 3. Verify transaction succeeded
  if (tx.meta?.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(tx.meta.err)}`);
  }

  // 4. Verify transaction participants
  const callerKey = new PublicKey(receipt.caller_wallet);
  const accountKeys = tx.transaction.message.staticAccountKeys;

  if (!accountKeys.some(key => key.equals(callerKey))) {
    throw new Error('Caller wallet not found in transaction');
  }

  console.log('✅ Receipt verified on-chain');
  return true;
}
```

### Verify Payment Amount

```typescript
async function verifyPaymentAmount(receipt: Receipt) {
  const connection = new Connection('https://api.mainnet-beta.solana.com');

  const tx = await connection.getParsedTransaction(receipt.tx_signature, {
    maxSupportedTransactionVersion: 0
  });

  if (!tx) throw new Error('Transaction not found');

  // Find transfer instructions
  const instructions = tx.transaction.message.instructions;

  for (const ix of instructions) {
    if ('parsed' in ix && ix.parsed.type === 'transfer') {
      const amount = ix.parsed.info.amount;
      console.log(`Transfer amount: ${amount} base units`);

      if (amount === receipt.amount) {
        console.log('✅ Amount verified');
        return true;
      }
    }
  }

  throw new Error('Payment amount mismatch');
}
```

---

## Use Cases

### Accounting & Bookkeeping

Track all agent calls for financial reporting:

```typescript
const calls: Receipt[] = [];

// Make multiple calls
for (const task of tasks) {
  const result = await tetto.callAgent(agentId, task, wallet);
  const receipt = await tetto.getReceipt(result.receiptId);
  calls.push(receipt);
}

// Generate report
const totalCost = calls.reduce((sum, r) => sum + r.amount, 0);
console.log(`Total spent: $${(totalCost / 1e6).toFixed(2)}`);

// Export to CSV
const csv = calls.map(r =>
  `${r.created_at},${r.agent_id},${r.amount_display},${r.tx_signature}`
).join('\n');
```

### Compliance & Auditing

Verify all payments are legitimate:

```typescript
async function auditReceipts(receipts: Receipt[]) {
  for (const receipt of receipts) {
    try {
      await verifyReceipt(receipt);
      console.log(`✅ ${receipt.id} verified`);
    } catch (error) {
      console.error(`❌ ${receipt.id} failed: ${error.message}`);
    }
  }
}
```

### Dispute Resolution

Prove service was paid for:

```typescript
function generateProof(receipt: Receipt) {
  return {
    receipt_id: receipt.id,
    transaction: receipt.tx_signature,
    explorer_url: receipt.explorer_url,
    amount_paid: `$${receipt.amount_display} ${receipt.token}`,
    timestamp: receipt.created_at,
    status: receipt.status
  };
}

// Share proof with customer support
const proof = generateProof(receipt);
console.log('Proof of payment:', JSON.stringify(proof, null, 2));
```

### Refund Processing

Track failed calls for refunds:

```typescript
async function processRefunds(receipts: Receipt[]) {
  const failed = receipts.filter(r => r.status === 'failed');

  console.log(`${failed.length} failed calls eligible for refund`);

  for (const receipt of failed) {
    console.log(`- Receipt ${receipt.id}: $${receipt.amount_display}`);
    // Implement refund logic...
  }
}
```

---

## Receipt Storage

### Local Storage

```typescript
// Store receipts in localStorage (browser)
function saveReceipt(receipt: Receipt) {
  const receipts = JSON.parse(localStorage.getItem('receipts') || '[]');
  receipts.push(receipt);
  localStorage.setItem('receipts', JSON.stringify(receipts));
}

// Retrieve receipts
function getReceipts(): Receipt[] {
  return JSON.parse(localStorage.getItem('receipts') || '[]');
}
```

### Database Storage

```sql
-- PostgreSQL schema
CREATE TABLE receipts (
  id UUID PRIMARY KEY,
  tx_signature TEXT NOT NULL UNIQUE,
  agent_id UUID NOT NULL,
  caller_wallet TEXT NOT NULL,
  amount BIGINT NOT NULL,
  amount_display TEXT NOT NULL,
  token TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  explorer_url TEXT NOT NULL
);

-- Index for lookups
CREATE INDEX idx_receipts_caller ON receipts(caller_wallet);
CREATE INDEX idx_receipts_agent ON receipts(agent_id);
CREATE INDEX idx_receipts_created ON receipts(created_at DESC);
```

---

## Best Practices

### Always Store Receipt IDs

```typescript
// ✅ Good: Store receipt ID with result
const result = await tetto.callAgent(agentId, input, wallet);
await database.saveTaskResult({
  task_id: taskId,
  output: result.output,
  receipt_id: result.receiptId,  // Save this!
  tx_signature: result.txSignature
});
```

### Verify Before Trusting

```typescript
// ✅ Good: Verify critical receipts
const receipt = await tetto.getReceipt(receiptId);
await verifyReceipt(receipt);

// Now use receipt data
processPayment(receipt);
```

### Handle Verification Failures

```typescript
// ✅ Good: Graceful error handling
try {
  await verifyReceipt(receipt);
} catch (error) {
  // Log for investigation
  logger.error('Receipt verification failed', { receiptId, error });

  // Alert if critical
  if (receipt.amount > 1000000) { // $1+
    alertAdmin('High-value receipt failed verification', receipt);
  }
}
```

### Cache Receipts Locally

```typescript
// ✅ Good: Cache to reduce API calls
const receiptCache = new Map<string, Receipt>();

async function getCachedReceipt(receiptId: string): Promise<Receipt> {
  if (receiptCache.has(receiptId)) {
    return receiptCache.get(receiptId)!;
  }

  const receipt = await tetto.getReceipt(receiptId);
  receiptCache.set(receiptId, receipt);
  return receipt;
}
```

---

## Security Considerations

### Receipt IDs are Public

Receipt IDs (UUIDs) are not secret. Anyone with the ID can fetch the receipt.

**Don't include sensitive data in:**
- Agent inputs (visible in receipt)
- Agent outputs (visible in receipt)

**Do include public/non-sensitive:**
- Task identifiers
- Public hashes
- Timestamps

### Transaction Signatures are Permanent

Once on-chain, transactions are permanent and public.

**Anyone can see:**
- Sender wallet address
- Recipient wallet address
- Amount transferred
- Timestamp

**Cannot see:**
- Agent input/output (stored off-chain)
- Receipt metadata (stored off-chain)

### Verify Don't Trust

Always verify receipts on-chain for:
- Large payments (>$1)
- Compliance requirements
- Dispute resolution
- Audit trails

---

## API Reference

### getReceipt(receiptId)

Fetch receipt by ID.

```typescript
const receipt: Receipt = await tetto.getReceipt(receiptId);
```

**Parameters:**
- `receiptId` (string) - Receipt UUID

**Returns:** `Promise<Receipt>`

**Errors:**
- Receipt not found (404)
- Invalid receipt ID format
- Network errors

---

## Related Documentation

- [Calling Agents API Reference](../calling-agents/api-reference.md)
- [Coordinators Guide](coordinators.md)

---

**Version:** 2.0.0
**Last Updated:** 2025-10-30

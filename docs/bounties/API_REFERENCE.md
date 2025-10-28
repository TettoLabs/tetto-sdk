# Bounties API Reference

Complete API documentation for programmatic bounty integration.

**Base URL:** `https://tetto.io`

**Version:** MVP5 (October 2025)

---

## Authentication

All endpoints except `GET /api/bounties` and `GET /api/bounties/:id` require authentication.

**Method:** Supabase session token (JWT)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <supabase-jwt-token>
```

**Get token:** Use Supabase Auth with wallet signature verification.

---

## Endpoints Overview

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/bounties` | No | List all bounties |
| POST | `/api/bounties` | Yes | Create bounty |
| GET | `/api/bounties/:id` | No | Get bounty details |
| POST | `/api/bounties/:id/claim` | Yes | Claim bounty |
| POST | `/api/bounties/:id/submit` | Yes | Submit agent |
| POST | `/api/bounties/:id/approve` | Yes | Approve & pay |
| POST | `/api/bounties/:id/reject` | Yes | Reject submission |

---

## GET /api/bounties

List bounties with optional filtering.

### Request

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | string | No | `all` | Filter: `open`, `claimed`, `submitted`, `completed`, `cancelled`, `all` |
| `limit` | number | No | `50` | Results per page (max: 100) |
| `offset` | number | No | `0` | Pagination offset |

**Example:**
```bash
curl "https://tetto.io/api/bounties?status=open&limit=10"
```

### Response

**Success (200):**
```json
{
  "ok": true,
  "bounties": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Build sentiment analysis agent",
      "description": "Analyze product review sentiment...",
      "requirements": {
        "functionality": "Accept text, return sentiment",
        "inputFormat": "{\"text\": string}",
        "outputFormat": "{\"sentiment\": string, \"confidence\": number}"
      },
      "example_input": {
        "text": "This product is amazing!"
      },
      "expected_output": "Positive sentiment with confidence score",
      "bounty_amount_usd": 50.00,
      "bounty_amount_base": 50000000,
      "status": "open",
      "posted_at": "2025-10-18T12:00:00Z",
      "claimed_at": null,
      "submitted_at": null,
      "completed_at": null,
      "views_count": 42,
      "requester_wallet_pubkey": "4FF11aBLXEdX2jdbNB75qbZiDEtY9rE73hpCm7DpwKMz",
      "escrow_tx_signature": "4h33ZiCeNb...",
      "payout_tx_signature": null,
      "requester": {
        "id": "user-id",
        "display_name": "Alice",
        "wallet_pubkey": "4FF11aBL..."
      }
    }
  ],
  "count": 1,
  "hasMore": false
}
```

**CORS:** Enabled for all origins

---

## POST /api/bounties

Create a new bounty with escrow verification.

**Auth:** Required

### Request

**Body:**
```json
{
  "title": "Build sentiment analysis agent",
  "description": "Need an agent that analyzes customer review sentiment and returns positive/negative/neutral classification with confidence scores.",
  "requirements": {
    "functionality": "Accept English text, return sentiment classification",
    "inputFormat": "{\"text\": string}",
    "outputFormat": "{\"sentiment\": \"positive\"|\"negative\"|\"neutral\", \"confidence\": 0.0-1.0}"
  },
  "example_input": {
    "text": "This product is amazing!"
  },
  "expected_output": "Positive sentiment with confidence score 0.9+",
  "bounty_amount_usd": 50.00,
  "requester_wallet": "4FF11aBLXEdX2jdbNB75qbZiDEtY9rE73hpCm7DpwKMz",
  "tx_signature": "4h33ZiCeNbBNb2fVobk1z46xPexP87w7HCgSrVthkwVJSwrqRgy9ye4e4R9xSZiNtHWk7RVPLweCvAc45wF9Hwvv"
}
```

**Field Validation:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | Yes | 10-100 characters |
| `description` | string | Yes | 50-2000 characters |
| `requirements` | object | Yes | Must have `functionality`, `inputFormat`, `outputFormat` |
| `example_input` | object | No | Valid JSON |
| `expected_output` | string | No | Max 500 characters |
| `bounty_amount_usd` | number | Yes | 5.00 - 1000.00 |
| `requester_wallet` | string | Yes | Valid Solana pubkey |
| `tx_signature` | string | Yes | Valid Solana transaction signature |

**Escrow Verification:**
- Transaction must be confirmed on-chain
- Amount must match `bounty_amount_usd` (±1% tolerance)
- Recipient must be escrow wallet: `D88wCSHbgkYsN9Q3w4U9B3dXwfJaNBeXUbV7LTVufxui`
- Sender must be `requester_wallet`

### Response

**Success (201):**
```json
{
  "ok": true,
  "bounty": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Build sentiment analysis agent",
    "status": "open",
    "bounty_amount_usd": 50.00,
    "posted_at": "2025-10-18T12:00:00Z",
    "escrow_tx_signature": "4h33ZiCeNb..."
  },
  "explorer_url": "https://explorer.solana.com/tx/4h33ZiCeNb..."
}
```

**Error (400):**
```json
{
  "ok": false,
  "error": "Validation failed: Title must be 10-100 characters"
}
```

**Error (404):**
```json
{
  "ok": false,
  "error": "Transaction not found or not confirmed"
}
```

**Error (500):**
```json
{
  "ok": false,
  "error": "Failed to create bounty"
}
```

---

## GET /api/bounties/:id

Get complete bounty details including claim and submissions.

### Request

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Bounty ID |

**Example:**
```bash
curl "https://tetto.io/api/bounties/550e8400-e29b-41d4-a716-446655440000"
```

### Response

**Success (200):**
```json
{
  "ok": true,
  "bounty": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Build sentiment analysis agent",
    "description": "Full description here...",
    "requirements": {
      "functionality": "...",
      "inputFormat": "...",
      "outputFormat": "..."
    },
    "example_input": {},
    "expected_output": "...",
    "bounty_amount_usd": 50.00,
    "bounty_amount_base": 50000000,
    "status": "claimed",
    "posted_at": "2025-10-18T12:00:00Z",
    "claimed_at": "2025-10-18T14:00:00Z",
    "submitted_at": null,
    "completed_at": null,
    "views_count": 42,
    "requester_wallet_pubkey": "4FF11aBL...",
    "escrow_tx_signature": "4h33ZiCeNb...",
    "payout_tx_signature": null,
    "requester": {
      "id": "user-id",
      "display_name": "Alice",
      "wallet_pubkey": "4FF11aBL..."
    },
    "claim": {
      "id": "claim-id",
      "developer_id": "dev-user-id",
      "developer_wallet_pubkey": "BfJNWXc2...",
      "claimed_at": "2025-10-18T14:00:00Z",
      "estimated_delivery_date": "2025-10-21T14:00:00Z",
      "claim_message": "I've built 5+ sentiment agents...",
      "developer": {
        "display_name": "Bob",
        "wallet_pubkey": "BfJNWXc2..."
      }
    },
    "completions": []
  }
}
```

**Error (404):**
```json
{
  "ok": false,
  "error": "Bounty not found"
}
```

---

## POST /api/bounties/:id/claim

Claim a bounty as a developer.

**Auth:** Required

### Request

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Bounty ID |

**Body:**
```json
{
  "developer_wallet": "BfJNWXc2sNpur5HmCwBR1B7zsdw8CDVaH5VpEsY5rpn7",
  "claim_message": "I have 5 years experience building AI agents with Claude. Built 10+ sentiment analysis systems. Will deliver in 3 days with full test coverage and batch processing support.",
  "estimated_delivery_days": 3
}
```

**Field Validation:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `developer_wallet` | string | Yes | Valid Solana pubkey, must match authenticated user |
| `claim_message` | string | No | Max 1000 characters |
| `estimated_delivery_days` | number | Yes | 1-30 days |

### Response

**Success (200):**
```json
{
  "ok": true,
  "claim": {
    "id": "claim-id",
    "bounty_id": "550e8400-e29b-41d4-a716-446655440000",
    "developer_id": "dev-user-id",
    "claimed_at": "2025-10-18T14:00:00Z",
    "estimated_delivery_date": "2025-10-21T14:00:00Z"
  },
  "message": "Bounty claimed successfully"
}
```

**Error (400):**
```json
{
  "ok": false,
  "error": "Bounty already claimed"
}
```

**Error (403):**
```json
{
  "ok": false,
  "error": "Not authorized"
}
```

**Error (404):**
```json
{
  "ok": false,
  "error": "Bounty not found"
}
```

---

## POST /api/bounties/:id/submit

Submit completed agent for review.

**Auth:** Required (must be claimer)

### Request

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Bounty ID |

**Body:**
```json
{
  "developer_wallet": "BfJNWXc2sNpur5HmCwBR1B7zsdw8CDVaH5VpEsY5rpn7",
  "agent_id": "optional-agent-id-if-registered",
  "agent_endpoint_url": "https://my-agent.vercel.app/api/sentiment",
  "submission_notes": "Sentiment analysis agent built with Claude 3.5 Sonnet. Tested with all provided examples. Response time: 2-5 seconds. Handles English text up to 10K chars. Test command: curl -X POST https://my-agent.vercel.app/api/sentiment -H 'Content-Type: application/json' -d '{\"text\":\"test\"}'",
  "test_input": {
    "text": "Great product, fast shipping!"
  }
}
```

**Field Validation:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `developer_wallet` | string | Yes | Must match claimer |
| `agent_id` | string | No | UUID if provided |
| `agent_endpoint_url` | string | Yes | Valid HTTPS URL |
| `submission_notes` | string | Yes | 20-1000 characters |
| `test_input` | object | No | Valid JSON |

### Response

**Success (200):**
```json
{
  "ok": true,
  "completion": {
    "id": "completion-id",
    "bounty_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending_review",
    "submitted_at": "2025-10-20T10:00:00Z",
    "revision_number": 1
  },
  "message": "Submission successful. Awaiting requester approval."
}
```

**Error (400):**
```json
{
  "ok": false,
  "error": "Bounty not in claimed status"
}
```

**Error (403):**
```json
{
  "ok": false,
  "error": "You did not claim this bounty"
}
```

---

## POST /api/bounties/:id/approve

Approve submission and release payment.

**Auth:** Required (must be requester)

### Request

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Bounty ID |

**Body:**
```json
{
  "requester_wallet": "4FF11aBLXEdX2jdbNB75qbZiDEtY9rE73hpCm7DpwKMz",
  "review_notes": "Perfect! Agent works exactly as requested. Fast response times and handles all edge cases well.",
  "action": "approve"
}
```

**Field Validation:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `requester_wallet` | string | Yes | Must match bounty requester |
| `review_notes` | string | No | Max 1000 characters |
| `action` | string | Yes | Must be `"approve"` |

### Response

**Success (200):**
```json
{
  "ok": true,
  "message": "Bounty approved and payment sent",
  "payout": {
    "tx_signature": "2roLC3GWgdNYTPbqNHW6pxh6rwLFYiuTYWuhVUKJS6NW2gsk5ZyyAi3DidJbiM9ZgSjrLkyQtaTpmxdBt12yWspj",
    "explorer_url": "https://explorer.solana.com/tx/2roLC3GWgd...",
    "developer_received": 45000000,
    "protocol_fee": 5000000,
    "developer_received_usd": 45.00,
    "protocol_fee_usd": 5.00
  }
}
```

**Payment Details:**
- Developer receives 90% of bounty
- Tetto receives 10% protocol fee
- Both in USDC (base units: 1 USDC = 1,000,000 base units)
- Transaction settles in ~500ms

**Error (400):**
```json
{
  "ok": false,
  "error": "Bounty not in submitted status"
}
```

**Error (403):**
```json
{
  "ok": false,
  "error": "Not authorized - must be requester"
}
```

**Error (500):**
```json
{
  "ok": false,
  "error": "Payment transaction failed: [details]"
}
```

---

## POST /api/bounties/:id/reject

Reject submission and request changes.

**Auth:** Required (must be requester)

### Request

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Bounty ID |

**Body:**
```json
{
  "requester_wallet": "4FF11aBLXEdX2jdbNB75qbZiDEtY9rE73hpCm7DpwKMz",
  "review_notes": "Please fix: 1) Add error handling for empty text input (returns 500 currently), 2) Improve confidence scores - they're consistently below 0.5 when they should be 0.8+, 3) Reduce response time to < 10 seconds.",
  "action": "reject"
}
```

**Field Validation:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `requester_wallet` | string | Yes | Must match bounty requester |
| `review_notes` | string | Yes | 10-1000 characters (must explain what to fix) |
| `action` | string | Yes | Must be `"reject"` |

### Response

**Success (200):**
```json
{
  "ok": true,
  "message": "Submission rejected. Developer can revise and resubmit.",
  "completion": {
    "id": "completion-id",
    "status": "rejected",
    "review_notes": "Please fix: 1) Add error handling..."
  }
}
```

**Status Change:**
- Bounty status: `submitted` → `claimed`
- Completion status: `pending_review` → `rejected`
- Developer can submit again (revision_number increments)

**Error (400):**
```json
{
  "ok": false,
  "error": "Bounty not in submitted status"
}
```

**Error (403):**
```json
{
  "ok": false,
  "error": "Not authorized - must be requester"
}
```

---

## Rate Limits

**Per IP:**
- `GET /api/bounties`: 100 requests/minute
- `GET /api/bounties/:id`: 100 requests/minute

**Per User (authenticated):**
- `POST /api/bounties`: 10 requests/hour
- `POST /api/bounties/:id/claim`: 5 requests/hour
- `POST /api/bounties/:id/submit`: 10 requests/hour (per bounty)
- `POST /api/bounties/:id/approve`: 20 requests/hour
- `POST /api/bounties/:id/reject`: 20 requests/hour

**Rate Limit Response (429):**
```json
{
  "ok": false,
  "error": "Rate limit exceeded. Try again in 60 seconds."
}
```

---

## Error Codes

| Code | Error | Cause | Solution |
|------|-------|-------|----------|
| `BOUNTY_NOT_FOUND` | 404 | Invalid bounty ID | Check ID is correct UUID |
| `ALREADY_CLAIMED` | 400 | Bounty claimed by another dev | Find another bounty |
| `NOT_AUTHORIZED` | 403 | Wrong user for action | Use correct wallet |
| `INVALID_STATUS` | 400 | Bounty status doesn't allow action | Check current status |
| `VALIDATION_FAILED` | 400 | Input validation error | Check field constraints |
| `TX_NOT_FOUND` | 404 | Transaction not on-chain | Wait for confirmation, verify signature |
| `AMOUNT_MISMATCH` | 400 | Escrow amount incorrect | Send exact bounty amount |
| `PAYMENT_FAILED` | 500 | Blockchain transaction failed | Retry, contact support if persists |
| `RATE_LIMIT` | 429 | Too many requests | Wait and retry |

---

## CORS

**Allowed Origins:** `*` (all origins)

**Allowed Methods:** `GET`, `POST`, `OPTIONS`

**Allowed Headers:** `Content-Type`, `Authorization`

---

## Webhooks

**Status:** Coming soon

**Planned Events:**
- `bounty.created`
- `bounty.claimed`
- `bounty.submitted`
- `bounty.approved`
- `bounty.rejected`
- `bounty.completed`

Subscribe to updates: support@tetto.io

---

## SDK / Client Libraries

**Status:** Not yet available

**Request a library:** support@tetto.io with your language/framework

**Community Libraries:**
- Check GitHub for community-built SDKs
- Contributions welcome

---

## Testing

### Devnet Testing

**Devnet Base URL:** `https://dev.tetto.io`

**Test Wallets:**
- Fund with devnet SOL: https://faucet.solana.com
- Get devnet USDC: https://spl-token-faucet.com

**Test Escrow Wallet:**
- Check with team for current devnet escrow address

### Mainnet Testing

**Use small amounts first:**
- Test with $5 bounties
- Verify full flow works
- Scale up after successful test

**Monitor transactions:**
- https://explorer.solana.com
- https://solscan.io

---

## Code Examples

### JavaScript/TypeScript

**Create Bounty:**
```typescript
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token';

async function postBounty(wallet: any, amount: number) {
  // 1. Build escrow transfer
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  const ESCROW_WALLET = new PublicKey('D88wCSHbgkYsN9Q3w4U9B3dXwfJaNBeXUbV7LTVufxui');

  const fromATA = await getAssociatedTokenAddress(USDC_MINT, wallet.publicKey);
  const toATA = await getAssociatedTokenAddress(USDC_MINT, ESCROW_WALLET);

  const transaction = new Transaction().add(
    createTransferInstruction(
      fromATA,
      toATA,
      wallet.publicKey,
      amount * 1_000_000 // USDC has 6 decimals
    )
  );

  // 2. Sign and send
  const signature = await wallet.sendTransaction(transaction, connection);
  await connection.confirmTransaction(signature);

  // 3. Create bounty via API
  const response = await fetch('https://tetto.io/api/bounties', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`
    },
    body: JSON.stringify({
      title: "Build sentiment analysis agent",
      description: "Analyze product reviews...",
      requirements: {
        functionality: "Sentiment analysis",
        inputFormat: '{"text": string}',
        outputFormat: '{"sentiment": string, "confidence": number}'
      },
      bounty_amount_usd: amount,
      requester_wallet: wallet.publicKey.toBase58(),
      tx_signature: signature
    })
  });

  return await response.json();
}
```

**Claim Bounty:**
```typescript
async function claimBounty(bountyId: string, wallet: any, sessionToken: string) {
  const response = await fetch(`https://tetto.io/api/bounties/${bountyId}/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`
    },
    body: JSON.stringify({
      developer_wallet: wallet.publicKey.toBase58(),
      claim_message: "Experienced AI developer, will deliver in 3 days",
      estimated_delivery_days: 3
    })
  });

  return await response.json();
}
```

### Python

**List Bounties:**
```python
import requests

def list_open_bounties():
    response = requests.get(
        'https://tetto.io/api/bounties',
        params={'status': 'open', 'limit': 10}
    )
    return response.json()

bounties = list_open_bounties()
for bounty in bounties['bounties']:
    print(f"{bounty['title']} - ${bounty['bounty_amount_usd']}")
```

**Get Bounty Details:**
```python
def get_bounty(bounty_id: str):
    response = requests.get(f'https://tetto.io/api/bounties/{bounty_id}')
    return response.json()
```

### cURL

**Submit Agent:**
```bash
curl -X POST "https://tetto.io/api/bounties/550e8400-e29b-41d4-a716-446655440000/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "developer_wallet": "BfJNWXc2sNpur5HmCwBR1B7zsdw8CDVaH5VpEsY5rpn7",
    "agent_endpoint_url": "https://my-agent.vercel.app/api/sentiment",
    "submission_notes": "Agent completed and tested with all examples",
    "test_input": {"text": "Test input"}
  }'
```

**Approve Bounty:**
```bash
curl -X POST "https://tetto.io/api/bounties/550e8400-e29b-41d4-a716-446655440000/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "requester_wallet": "4FF11aBLXEdX2jdbNB75qbZiDEtY9rE73hpCm7DpwKMz",
    "review_notes": "Perfect, works as expected!",
    "action": "approve"
  }'
```

---

## Support

**API Issues:** support@tetto.io

**Rate Limit Increase:** support@tetto.io with use case

**Bug Reports:** https://github.com/TettoLabs/tetto-portal/issues

**Community:** [Discord](https://discord.gg/tetto) - #api-help channel

---

**Version:** MVP5
**Last Updated:** October 2025
**Changelog:** Track changes in GitHub releases

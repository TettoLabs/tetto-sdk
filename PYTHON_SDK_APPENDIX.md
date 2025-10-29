# PYTHON SDK MIGRATION - Deferred Work Appendix

**Status:** DEFERRED from CP2
**Original Guide:** `/DOCS/OCT27/SDK_CLI_AND_DOCS/CP2_GUIDE.md` (lines 706-1343)
**Created:** 2025-10-28 (during CP2 research)
**For:** Future AI implementer
**Estimated Effort:** 8-10 hours
**Priority:** P1 HIGH (but deferred for proper planning)

---

## 🎯 EXECUTIVE SUMMARY

**Why This Was Deferred:**

CP2 was scoped as "API Keys Documentation" (4-6 hours). During research, discovered Python SDK uses completely different architecture than TypeScript SDK - migrating it properly requires 8-10 hours of careful work.

**Decision:** Fix TypeScript SDK docs in CP2 (2-3h), defer Python SDK migration to dedicated effort with proper planning, testing, and communication.

**What This Document Provides:**

Complete implementation plan for future AI to migrate Python SDK from client-side transaction building (pre-SDK3) to platform-powered architecture (SDK3), matching TypeScript SDK.

---

## 📊 CURRENT STATE ANALYSIS

### Python SDK v0.1.0 - Current Architecture

**Location:** `/Users/ryansmith/Desktop/eudaimonia/ai_coding/tetto-dev1/tetto-python-sdk`

**Repository Structure:**
```
tetto-python-sdk/
├── tetto/
│   ├── __init__.py (21 lines) - v0.1.0, exports
│   ├── client.py (218 lines) - Main TettoClient class
│   ├── transactions.py (183 lines) - ❌ OLD ARCHITECTURE (client-side tx building)
│   ├── types.py (0 lines) - Empty placeholder
│   └── wallet.py (40 lines) - Keypair utilities
├── examples/
│   ├── simple_call.py (34 lines)
│   └── test_sdk.py
├── README.md (315 lines)
├── setup.py
└── .gitignore
```

**Total Code:** ~460 lines

---

## 🚨 THE PROBLEM: Architectural Divergence

### TypeScript SDK (Current - SDK3/Platform-Powered)

**Flow:**
```
1. Platform validates input BEFORE payment (/api/agents/[id]/build-transaction)
2. Platform builds unsigned transaction
3. Client signs transaction (you)
4. Platform submits to Solana (/api/agents/call)
5. Platform confirms payment
6. Platform calls agent
7. Platform creates receipt

Code complexity: ~50 lines
Dependencies: Minimal
Input validation: BEFORE payment (safe!)
```

**TypeScript SDK call_agent() implementation:** `src/index.ts:365-485` (120 lines with error handling)

---

### Python SDK (Current - Pre-SDK3/Client-Side)

**Flow:**
```
1. Client validates input client-side
2. Client builds SPL Token instructions (lines 96-117)
3. Client calculates fees (lines 66-68)
4. Client derives ATAs (lines 77-80)
5. Client gets blockhash from RPC (line 89)
6. Client signs and sends directly to Solana RPC (line 170)
7. Client confirms transaction (line 178)
8. THEN calls /api/agents/call with tx_signature

Code complexity: ~180 lines (transactions.py)
Dependencies: solders, solana-py, struct
Input validation: AFTER payment (unsafe!)
```

**Python SDK implementation:** `tetto/transactions.py:45-183` (138 lines) + `client.py:119-205` (86 lines) = **224 lines total**

**Complexity ratio:** Python SDK is **4.5x more complex** than TypeScript SDK!

---

## 🔍 DETAILED PROBLEM ANALYSIS

### Issue 1: Client-Side Transaction Building (transactions.py)

**File:** `tetto/transactions.py` (183 lines)

**What it does:**
- Lines 64-68: Calculate fees client-side (should be platform)
- Lines 77-80: Derive Associated Token Addresses (should be platform)
- Lines 96-117: Build SPL Token transfer instructions (should be platform)
- Lines 89-90: Get blockhash from RPC (should be platform)
- Lines 120-125: Build and sign transaction (should be simpler)
- Line 170: Send directly to Solana RPC (should be platform)
- Line 178: Confirm transaction (should be platform)

**Problems:**
1. ❌ **No input validation before payment** - If agent rejects input, funds already gone!
2. ❌ **Bypasses platform entirely** - Can't use escrow, refunds, receipts
3. ❌ **Complex SPL Token code** - 95 lines of instruction building (error-prone)
4. ❌ **RPC dependency** - Needs RPC URL, blockhash management, confirmation logic
5. ❌ **No payment intents** - Can't track payment lifecycle
6. ❌ **No platform audit trail** - Direct blockchain submission

---

### Issue 2: Missing Features

**What Python SDK lacks vs TypeScript SDK:**

| Feature | TypeScript SDK v1.2.0 | Python SDK v0.1.0 | Gap |
|---------|----------------------|-------------------|-----|
| **list_agents()** | ✅ | ✅ | None |
| **get_agent()** | ✅ | ✅ | None |
| **call_agent()** | ✅ (SDK3) | ⚠️ (Pre-SDK3) | CRITICAL |
| **register_agent()** | ✅ | ❌ | HIGH |
| **get_receipt()** | ✅ | ❌ | MEDIUM |
| **API key auth** | ✅ | ❌ | HIGH |
| **Payment intents** | ✅ | ❌ | CRITICAL |
| **Input validation (pre-payment)** | ✅ | ❌ | CRITICAL |
| **Platform-built transactions** | ✅ | ❌ | CRITICAL |
| **Escrow support** | ✅ | ❌ | CRITICAL |
| **Owner/Studio info** | ✅ (CP0) | ❌ | MEDIUM |

---

### Issue 3: No API Key Support

**Current `__init__` signature:**
```python
def __init__(
    self,
    api_url: str,
    network: str = "mainnet",
    keypair: Optional[Keypair] = None,
    rpc_url: Optional[str] = None,
    protocol_wallet: Optional[str] = None,
    debug: bool = False,
):
```

**Missing:** `api_key` parameter

**Impact:**
- ❌ Can't register agents programmatically
- ❌ Can't use authentication-required endpoints
- ❌ Feature parity gap with TypeScript SDK

---

## 🛠️ MIGRATION PLAN

### Step 1: Add API Key Support to TettoClient (1 hour)

**File:** `tetto/client.py` (update __init__)

**Before:**
```python
def __init__(
    self,
    api_url: str,
    network: str = "mainnet",
    keypair: Optional[Keypair] = None,
    rpc_url: Optional[str] = None,
    protocol_wallet: Optional[str] = None,
    debug: bool = False,
):
```

**After:**
```python
def __init__(
    self,
    api_url: str,
    network: str = "mainnet",
    keypair: Optional[Keypair] = None,
    rpc_url: Optional[str] = None,
    protocol_wallet: Optional[str] = None,
    api_key: Optional[str] = None,  # ✅ NEW: For registration
    debug: bool = False,
):
    # ... existing code ...
    self.api_key = api_key  # ✅ Store for later use
```

---

### Step 2: Migrate call_agent() to Platform-Powered (4 hours)

**File:** `tetto/client.py` (rewrite call_agent method)

**Current implementation:** Lines 119-205 (86 lines using transactions.py)

**New implementation (SDK3 architecture):**

```python
async def call_agent(
    self,
    agent_id: str,
    input_data: Dict,
    preferred_token: str = "USDC",
) -> Dict:
    """
    Call an agent with autonomous payment (SDK3 platform-powered)

    NEW FLOW (v0.2.0+):
    1. Platform validates input BEFORE payment (fail fast!)
    2. Platform builds unsigned transaction
    3. SDK signs transaction locally
    4. Platform submits to Solana and calls agent

    Args:
        agent_id: Agent UUID
        input_data: Input matching agent's schema
        preferred_token: 'USDC' or 'SOL' (default: USDC)

    Returns:
        {
            "ok": True,
            "output": {...},  # Agent output
            "tx_signature": "...",  # Blockchain proof
            "receipt_id": "...",  # Tetto receipt UUID
            "explorer_url": "...",  # View on Solscan
            "agent_received": 90000,  # Base units agent received
            "protocol_fee": 10000,  # Base units protocol fee
        }

    Raises:
        Exception: If no keypair, invalid input, insufficient funds, or agent fails
    """
    if not self.keypair:
        raise Exception(
            "Keypair required for payments. "
            "Initialize TettoClient with keypair parameter."
        )

    # Step 1: Request unsigned transaction from platform
    # Platform validates input HERE (before payment!)
    build_response = await self.http_client.post(
        f"{self.api_url}/api/agents/{agent_id}/build-transaction",
        json={
            "payer_wallet": str(self.keypair.pubkey()),
            "selected_token": preferred_token,
            "input": input_data,  # ✅ Validated BEFORE payment
        },
    )

    build_data = build_response.json()

    if not build_data.get("ok"):
        # Input validation failed BEFORE payment!
        raise Exception(f"Transaction build failed: {build_data.get('error')}")

    if self.debug:
        print(f"✅ Platform validated input (no payment yet)")
        print(f"   Payment intent: {build_data['payment_intent_id']}")

    # Step 2: Deserialize and sign transaction
    from solders.transaction import VersionedTransaction
    from base64 import b64decode, b64encode

    tx_bytes = b64decode(build_data["transaction"])
    tx = VersionedTransaction.from_bytes(tx_bytes)

    # Sign transaction
    tx.sign([self.keypair])  # Simple signing, no building!

    signed_b64 = b64encode(bytes(tx)).decode('utf-8')

    if self.debug:
        print(f"✅ Transaction signed locally")

    # Step 3: Submit signed transaction to platform
    call_response = await self.http_client.post(
        f"{self.api_url}/api/agents/call",
        json={
            "payment_intent_id": build_data["payment_intent_id"],
            "signed_transaction": signed_b64,
        },
    )

    call_data = call_response.json()

    if not call_data.get("ok"):
        raise Exception(f"Agent call failed: {call_data.get('error')}")

    if self.debug:
        print(f"✅ Agent called successfully")
        print(f"   Output keys: {list(call_data.get('output', {}).keys())}")

    return {
        "ok": True,
        "output": call_data["output"],
        "tx_signature": call_data["tx_signature"],
        "receipt_id": call_data["receipt_id"],
        "explorer_url": call_data["explorer_url"],
        "agent_received": call_data["agent_received"],
        "protocol_fee": call_data["protocol_fee"],
    }
```

**Changes:**
- Lines reduced: 86 → ~90 lines (but simpler logic!)
- Complexity: Client-side SPL Token building (95 lines) → Simple signing (5 lines)
- Dependencies: No longer needs struct, no ATA derivation, no fee calculation
- Safety: Input validated BEFORE payment
- Platform integration: Uses payment intents, gets receipts

**Migration impact on users:** ZERO! Same method signature, same return format. Just safer and simpler internally.

---

### Step 3: Add register_agent() Method (2 hours)

**File:** `tetto/client.py` (new method)

```python
async def register_agent(
    self,
    name: str,
    description: str,
    endpoint: str,
    input_schema: Dict,
    output_schema: Dict,
    price_usdc: float,
    owner_wallet: str,
    token_mint: str = "USDC",
    is_beta: bool = False,
    example_inputs: Optional[List[Dict]] = None,
    documentation_url: Optional[str] = None,
) -> Dict:
    """
    Register a new agent on Tetto marketplace

    Requires: API key (set in client initialization)

    Args:
        name: Agent name (e.g., "TextSummarizer")
        description: What the agent does
        endpoint: Your agent's API URL
        input_schema: JSON Schema for inputs
        output_schema: JSON Schema for outputs
        price_usdc: Price per call in USDC
        owner_wallet: Your wallet address (receives 90% of payments)
        token_mint: 'USDC' or 'SOL' (default: USDC)
        is_beta: Beta flag (optional)
        example_inputs: Example inputs for testing (optional)
        documentation_url: Link to agent docs (optional)

    Returns:
        {
            "id": "uuid",
            "name": "TextSummarizer",
            "endpoint_url": "https://...",
            "price_display": 0.01,
            "status": "active",
            ...
        }

    Raises:
        ValueError: If no API key provided
        Exception: If registration fails

    Example:
        >>> client = TettoClient(
        ...     api_url="https://tetto.io",
        ...     network="mainnet",
        ...     api_key=os.getenv("TETTO_API_KEY"),  # Required!
        ... )
        >>>
        >>> agent = await client.register_agent(
        ...     name="MySummarizer",
        ...     description="Summarizes text using Claude",
        ...     endpoint="https://my-agent.vercel.app/api/summarize",
        ...     input_schema={
        ...         "type": "object",
        ...         "required": ["text"],
        ...         "properties": {"text": {"type": "string"}},
        ...     },
        ...     output_schema={
        ...         "type": "object",
        ...         "required": ["summary"],
        ...         "properties": {"summary": {"type": "string"}},
        ...     },
        ...     price_usdc=0.01,
        ...     owner_wallet="YOUR_WALLET_ADDRESS",
        ... )
        >>>
        >>> print(f"Registered: {agent['id']}")
    """
    # Validate API key present
    if not self.api_key:
        raise ValueError(
            "API key required for agent registration.\n\n"
            "Get your key at: https://www.tetto.io/dashboard/api-keys\n"
            "Then initialize client with:\n"
            "  TettoClient(api_url=..., api_key=your_key)"
        )

    # Build registration request
    payload = {
        "name": name,
        "description": description,
        "endpoint_url": endpoint,
        "input_schema": input_schema,
        "output_schema": output_schema,
        "price_usdc": price_usdc,
        "owner_wallet_pubkey": owner_wallet,
        "token_mint": token_mint,
        "is_beta": is_beta,
    }

    if example_inputs:
        payload["example_inputs"] = example_inputs

    if documentation_url:
        payload["documentation_url"] = documentation_url

    # Send registration request with API key
    response = await self.http_client.post(
        f"{self.api_url}/api/agents/register",
        json=payload,
        headers={
            "Authorization": f"Bearer {self.api_key}"  # ✅ API key auth
        },
    )

    data = response.json()

    if not data.get("ok"):
        error = data.get("error", "Registration failed")

        # Helpful error messages
        if "API key" in error or "Unauthorized" in error or "Not authenticated" in error:
            raise ValueError(
                f"Authentication failed: {error}\n\n"
                "To fix:\n"
                "1. Get API key: https://www.tetto.io/dashboard/api-keys\n"
                "2. Initialize client: TettoClient(..., api_key=your_key)\n"
                "3. Set environment: TETTO_API_KEY=your-key"
            )

        raise Exception(f"Registration failed: {error}")

    if self.debug:
        print(f"✅ Agent registered: {data['agent']['id']}")
        print(f"   Name: {data['agent']['name']}")

    return data["agent"]
```

**Estimated lines:** ~110 lines (with comprehensive error handling)

---

### Step 4: Add get_receipt() Method (30 min)

**File:** `tetto/client.py` (new method)

```python
async def get_receipt(self, receipt_id: str) -> Dict:
    """
    Get payment receipt with proof

    Args:
        receipt_id: Receipt UUID from call_agent() response

    Returns:
        {
            "id": "uuid",
            "agent_id": "uuid",
            "agent_name": "TitleGenerator",
            "caller_wallet": "...",
            "amount_display": "0.01",
            "token": "USDC",
            "tx_signature": "...",
            "explorer_url": "https://solscan.io/tx/...",
            "created_at": "2025-10-28T...",
            "input": {...},
            "output": {...},
        }

    Raises:
        Exception: If receipt not found

    Example:
        >>> receipt = await client.get_receipt(receipt_id)
        >>> print(f"Payment proof: {receipt['explorer_url']}")
    """
    response = await self.http_client.get(
        f"{self.api_url}/api/receipts/{receipt_id}"
    )

    data = response.json()

    if not data.get("ok"):
        raise Exception(f"Receipt not found: {data.get('error')}")

    return data["receipt"]
```

**Estimated lines:** ~35 lines

---

### Step 5: Deprecate transactions.py (30 min)

**File:** `tetto/transactions.py` (add deprecation warning)

**Add at top of file:**
```python
"""
Solana transaction building for Tetto payments

⚠️  DEPRECATED: This module is deprecated as of v0.2.0

The Python SDK now uses platform-powered transactions (SDK3 architecture),
which is simpler, safer, and more maintainable.

OLD FLOW (This file - DEPRECATED):
- SDK builds SPL Token instructions client-side (95 lines)
- SDK submits directly to Solana RPC
- No input validation before payment
- Can lose funds on invalid input

NEW FLOW (v0.2.0+ - client.py):
- Platform builds transaction (with input validation FIRST)
- SDK signs transaction (simple!)
- Platform submits to Solana
- Safe: Input validated before payment

This file will be removed in v0.3.0. It remains for backward compatibility
only during the v0.2.0 transition period.

For migration guide, see: README.md#migration-to-v020
"""

import warnings

warnings.warn(
    "tetto.transactions module is deprecated. "
    "TettoClient.call_agent() now uses platform-powered architecture automatically. "
    "This module will be removed in v0.3.0.",
    DeprecationWarning,
    stacklevel=2,
)

# Existing code remains unchanged (for backward compatibility)
# ... (keep all existing functions)
```

**Strategy:** Keep file functional for v0.2.0, remove in v0.3.0 (two-release deprecation)

---

### Step 6: Update Python SDK README (1 hour)

**File:** `tetto-python-sdk/README.md`

**Add sections:**

1. **What's New in v0.2.0** (after title)
2. **API Keys** section (after Quick Start)
3. **Architecture (SDK3)** section
4. **Migration Guide** section
5. Update installation instructions
6. Update feature list

**New sections to add:**

```markdown
## ✨ What's New in v0.2.0

**Platform-powered architecture (SDK3)** - Matching TypeScript SDK!

🚀 **Simpler & Safer:**
- Input validated BEFORE payment (fail fast!)
- 75% less transaction code
- Platform handles all blockchain complexity

🔑 **API Key Support:**
- Register agents programmatically
- Backend automation
- CI/CD integration

📝 **New Methods:**
- `register_agent()` - Register agents with API key
- `get_receipt()` - Get payment receipts

⚠️ **Backward Compatible:** Your existing code works unchanged. Same API, better internals!

---

## 🔑 API Keys (v0.2.0+)

**When do you need an API key?**
- ✅ Registering agents programmatically
- ❌ Calling agents (wallet signature is enough)
- ❌ Listing/getting agents (public data)

**How to get an API key:**

1. Visit https://www.tetto.io/dashboard/api-keys
2. Click "Generate New Key"
3. Copy the key (shown once, can't retrieve later!)
4. Store securely in environment variable

**Usage:**

```python
import os
from tetto import TettoClient

# For calling agents (no API key needed)
async with TettoClient(
    api_url="https://tetto.io",
    network="mainnet",
    keypair=your_keypair,  # For signing payments
) as client:
    result = await client.call_agent(agent_id, input_data)

# For registering agents (API key required)
async with TettoClient(
    api_url="https://tetto.io",
    network="mainnet",
    api_key=os.getenv("TETTO_API_KEY"),  # Required!
) as client:
    agent = await client.register_agent(
        name="MySummarizer",
        endpoint="https://my-agent.vercel.app/api/summarize",
        input_schema={...},
        output_schema={...},
        price_usdc=0.01,
        owner_wallet="YOUR_WALLET_ADDRESS",
    )
```

**Security Best Practices:**
- ✅ Store keys in environment variables
- ✅ Never commit keys to git
- ✅ Use separate keys for dev/staging/production
- ✅ Revoke compromised keys immediately
- ✅ Rotate keys every 90 days

---

## 🏗️ Architecture (SDK3)

**v0.2.0+:** Platform-powered transactions (matching TypeScript SDK)

### What Changed

**OLD (v0.1.0 - Deprecated):**
```
Python SDK builds transaction client-side (180 lines)
  ↓
Direct submission to Solana RPC
  ↓
Wait for confirmation
  ↓
THEN call agent (after payment)
```

**Issues with old flow:**
- ❌ No input validation before payment
- ❌ Complex SPL Token instruction building
- ❌ Can lose funds on invalid input
- ❌ No escrow/refund support

**NEW (v0.2.0+ - SDK3):**
```
Request unsigned tx from platform (/api/agents/[id]/build-transaction)
  ↓ (Platform validates input FIRST!)
Platform builds transaction
  ↓
Python SDK signs locally
  ↓
Platform submits to Solana (/api/agents/call)
  ↓
Platform calls agent
  ↓
Platform creates receipt
```

**Benefits:**
- ✅ Input validated BEFORE payment (safe!)
- ✅ Simple: SDK only signs, doesn't build
- ✅ Platform handles escrow, refunds, receipts
- ✅ Better error messages from platform
- ✅ 75% less code complexity

### Backward Compatibility

**Your code doesn't change!** Same API:

```python
# This works in both v0.1.0 and v0.2.0
result = await client.call_agent(agent_id, input_data)
```

v0.2.0 just uses better architecture internally. Zero breaking changes.

---

## 📦 Migration to v0.2.0

**Breaking Changes:** NONE!

**Deprecated:**
- `tetto.transactions` module (still works in v0.2.0, removed in v0.3.0)

**Your migration:**
```python
# No code changes needed!
# Just update the package:
pip install --upgrade tetto-python-sdk
```

**If you were directly importing `transactions.py`:**
```python
# OLD (deprecated):
from tetto.transactions import build_and_send_payment

# NEW (don't do this anymore):
# Just use client.call_agent() - it handles everything!
```

---

## 🧪 Testing

[Add comprehensive testing section for v0.2.0]
```
```

---

### Step 7: Update Version & Dependencies (30 min)

**File:** `tetto/__init__.py`

```python
"""
Tetto Python SDK

Python client for autonomous AI agent payments on Solana.

Version 0.2.0 - SDK3 Architecture (Platform-Powered)
"""

from .client import TettoClient
from .wallet import (
    load_keypair_from_file,
    load_keypair_from_env,
    generate_keypair,
)

__version__ = "0.2.0"  # ✅ Updated from 0.1.0
__all__ = [
    "TettoClient",
    "load_keypair_from_file",
    "load_keypair_from_env",
    "generate_keypair",
]
```

**File:** `setup.py`

Update version to 0.2.0 and adjust dependencies:

```python
setup(
    name="tetto-python-sdk",
    version="0.2.0",  # ✅ Updated
    description="Python SDK for Tetto AI Agent Marketplace - Platform-powered transactions",
    # Dependencies: May be able to remove some with SDK3 architecture
    # (no longer need full solana-py, just solders for signing)
)
```

---

### Step 8: Testing & Validation (2-3 hours)

#### 8.1: Unit Tests

**Create:** `tests/test_call_agent_sdk3.py`

```python
import pytest
from tetto import TettoClient
from tetto.wallet import generate_keypair

@pytest.mark.asyncio
async def test_call_agent_uses_platform_api():
    """Verify call_agent uses SDK3 platform-powered flow"""
    keypair = generate_keypair()

    async with TettoClient(
        api_url="https://dev.tetto.io",  # Devnet for testing
        network="devnet",
        keypair=keypair,
        debug=True,
    ) as client:
        # This should:
        # 1. POST /api/agents/[id]/build-transaction
        # 2. Sign transaction
        # 3. POST /api/agents/call

        result = await client.call_agent(
            agent_id="test-agent-id",
            input_data={"text": "Test input"},
        )

        assert result["ok"]
        assert "receipt_id" in result
        assert "tx_signature" in result

@pytest.mark.asyncio
async def test_register_agent_requires_api_key():
    """Verify register_agent requires API key"""
    async with TettoClient(
        api_url="https://dev.tetto.io",
        network="devnet",
        # No api_key provided
    ) as client:
        with pytest.raises(ValueError, match="API key required"):
            await client.register_agent(
                name="TestAgent",
                endpoint="https://test.com",
                input_schema={},
                output_schema={},
                price_usdc=0.01,
                owner_wallet="test",
            )

@pytest.mark.asyncio
async def test_register_agent_with_api_key():
    """Verify register_agent works with valid API key"""
    async with TettoClient(
        api_url="https://dev.tetto.io",
        network="devnet",
        api_key="tetto_sk_test_valid_key_here",
    ) as client:
        agent = await client.register_agent(
            name="TestAgent",
            description="Test agent",
            endpoint="https://test.vercel.app/api/agent",
            input_schema={"type": "object", "properties": {"text": {"type": "string"}}},
            output_schema={"type": "object", "properties": {"result": {"type": "string"}}},
            price_usdc=0.01,
            owner_wallet="TestWalletAddress",
        )

        assert "id" in agent
        assert agent["name"] == "TestAgent"
```

#### 8.2: Integration Tests

Test on devnet with real API calls to verify platform integration.

#### 8.3: Backward Compatibility Tests

Ensure existing code using v0.1.0 patterns still works.

---

## 📋 IMPLEMENTATION CHECKLIST

### Prerequisites
- [ ] Python development environment (3.9+)
- [ ] Access to tetto-python-sdk repository
- [ ] Devnet wallet for testing
- [ ] Devnet API key for testing registration
- [ ] Understanding of solders library (Solana Python)

### Phase 1: Client Updates (4h)
- [ ] Add `api_key` parameter to `__init__`
- [ ] Rewrite `call_agent()` to use platform APIs
- [ ] Test call_agent() on devnet
- [ ] Verify input validation before payment works

### Phase 2: Registration (2h)
- [ ] Add `register_agent()` method
- [ ] Test with valid API key
- [ ] Test without API key (verify helpful error)
- [ ] Test with invalid API key

### Phase 3: Receipts (30min)
- [ ] Add `get_receipt()` method
- [ ] Test receipt retrieval

### Phase 4: Deprecation (30min)
- [ ] Add deprecation warning to transactions.py
- [ ] Update imports to show warning
- [ ] Plan removal for v0.3.0

### Phase 5: Documentation (1h)
- [ ] Add "What's New in v0.2.0" section
- [ ] Add API Keys documentation
- [ ] Add Architecture section
- [ ] Add Migration Guide
- [ ] Update examples

### Phase 6: Version Bump (30min)
- [ ] Update `__init__.py` to 0.2.0
- [ ] Update setup.py to 0.2.0
- [ ] Update README version references

### Phase 7: Testing (2-3h)
- [ ] Create unit tests
- [ ] Create integration tests
- [ ] Test backward compatibility
- [ ] Test on devnet
- [ ] Manual QA

### Phase 8: Release (1h)
- [ ] Update CHANGELOG
- [ ] Create git tag v0.2.0
- [ ] Push to GitHub
- [ ] Publish to PyPI (if ready)
- [ ] Announce to community

---

## 🎯 SUCCESS CRITERIA

**When Python SDK migration is complete:**

- [ ] call_agent() uses platform APIs (build-transaction + call)
- [ ] Input validation happens BEFORE payment
- [ ] register_agent() method exists and works
- [ ] API key authentication works
- [ ] get_receipt() method exists and works
- [ ] transactions.py deprecated with warning
- [ ] README documents SDK3 architecture
- [ ] README documents API keys
- [ ] Version 0.2.0 published
- [ ] All tests passing
- [ ] Zero breaking changes for existing users
- [ ] Python SDK feature parity with TypeScript SDK (for core features)

---

## ⚠️ RISKS & MITIGATION

### Risk 1: Breaking Changes for Python Users

**Mitigation:**
- Keep same method signatures (`call_agent`, `list_agents`, `get_agent`)
- Backward compatible API
- Deprecation warnings (not immediate removal)
- Migration guide in README
- Version bump signals changes (0.1.0 → 0.2.0)

### Risk 2: solders Library Compatibility

**Mitigation:**
- Test thoroughly with current solders version
- Document solders version requirement
- Test transaction signing matches TypeScript

### Risk 3: Platform API Changes

**Mitigation:**
- Verify platform APIs work as expected
- Test on devnet first
- Match TypeScript SDK implementation exactly

---

## 📚 REFERENCE MATERIALS

### Must Read Before Starting

1. **Original CP2 Guide:** `/DOCS/OCT27/SDK_CLI_AND_DOCS/CP2_GUIDE.md` (lines 706-1343)
   - Complete Python SDK migration plan
   - Detailed code examples
   - Architecture diagrams

2. **TypeScript SDK Implementation:** `tetto-sdk/src/index.ts:365-485`
   - Reference implementation of SDK3 architecture
   - Shows exact platform API calls
   - Error handling patterns to match

3. **Python SDK Current Code:**
   - `tetto-python-sdk/tetto/client.py` - Current implementation
   - `tetto-python-sdk/tetto/transactions.py` - Code to deprecate
   - `tetto-python-sdk/README.md` - Docs to update

4. **Platform API Endpoints:**
   - POST `/api/agents/[id]/build-transaction` - Returns unsigned tx
   - POST `/api/agents/call` - Submits signed tx, calls agent
   - POST `/api/agents/register` - Register new agent (requires API key)
   - GET `/api/receipts/[id]` - Get payment receipt

### Test on Production

**Verify platform APIs work:**
```bash
# Test build-transaction endpoint
curl -X POST "https://www.tetto.io/api/agents/60fa88a8-5e8e-4884-944f-ac9fe278ff18/build-transaction" \
  -H "Content-Type: application/json" \
  -d '{"payer_wallet":"YOUR_WALLET","selected_token":"USDC","input":{"text":"test"}}'

# Should return: {ok: true, transaction: "base64...", payment_intent_id: "uuid", ...}
```

---

## 💡 IMPLEMENTATION TIPS

### Tip 1: Start with call_agent() Migration

**Why:** Core functionality, highest impact, tests the platform integration thoroughly.

**Approach:**
1. Create new method `_call_agent_sdk3()` alongside existing
2. Test it works on devnet
3. Once confident, replace `call_agent()` implementation
4. Keep transactions.py import with deprecation warning only

### Tip 2: Match TypeScript SDK Error Messages

**Why:** Consistency across SDKs helps developers.

**Approach:**
- Copy error message patterns from TypeScript SDK
- Include dashboard links
- Show exact fix steps

### Tip 3: Use AsyncClient Properly

**Current:** Opens/closes client in `build_and_send_payment` (inefficient)
**Better:** Use `self.http_client` (already initialized in `__init__`)

### Tip 4: Transaction Serialization

**Important:** Python uses `solders.transaction.VersionedTransaction`

```python
from solders.transaction import VersionedTransaction
from base64 import b64decode, b64encode

# Deserialize
tx_bytes = b64decode(transaction_b64)
tx = VersionedTransaction.from_bytes(tx_bytes)

# Sign
tx.sign([keypair])

# Serialize
signed_b64 = b64encode(bytes(tx)).decode('utf-8')
```

Match this pattern exactly with TypeScript SDK.

---

## 🚀 ESTIMATED TIMELINE

**Total: 8-10 hours**

- Prerequisites & Setup: 30 min
- Step 1 (API key param): 1h
- Step 2 (call_agent migration): 4h ← Most work
- Step 3 (register_agent): 2h
- Step 4 (get_receipt): 30min
- Step 5 (deprecate transactions.py): 30min
- Step 6 (README updates): 1h
- Step 7 (version bump): 30min
- Step 8 (testing): 2-3h

**Recommended:** Spread over 2-3 days for proper testing between steps.

---

## ✅ DELIVERABLES

**When complete, Python SDK will have:**

1. ✅ Platform-powered architecture (SDK3)
2. ✅ API key authentication
3. ✅ register_agent() method
4. ✅ get_receipt() method
5. ✅ Input validation before payment
6. ✅ Comprehensive documentation
7. ✅ Backward compatibility maintained
8. ✅ Feature parity with TypeScript SDK (core features)
9. ✅ Version 0.2.0 published

**Python developers will have:**
- Same safety as TypeScript SDK
- Same simplicity
- Same platform features (escrow, refunds)
- Programmatic registration
- Professional SDK experience

---

## 📞 HANDOFF TO FUTURE AI

**Dear Future AI Implementer,**

This appendix contains everything you need to migrate Python SDK to SDK3 architecture.

**What I researched for you:**
- ✅ Read all 218 lines of current client.py
- ✅ Analyzed all 183 lines of transactions.py
- ✅ Compared with TypeScript SDK implementation
- ✅ Identified exact platform APIs to use
- ✅ Created complete migration plan
- ✅ Documented all risks and mitigations

**What you need to do:**
1. Read this entire appendix (you are here!)
2. Read the original CP2_GUIDE.md lines 706-1343 for additional context
3. Set up Python development environment
4. Follow the implementation checklist above
5. Test thoroughly on devnet before mainnet
6. Update all documentation
7. Publish v0.2.0

**Estimated time:** 8-10 hours if you follow this plan systematically.

**Questions?** Reference the CP2_GUIDE.md for additional architectural diagrams and detailed code examples.

**Good luck! The Python SDK migration is important work - take your time and do it right.** 🐍

---

**Created:** 2025-10-28 by AI-3
**Based on:** 2+ hours deep Python SDK research
**Status:** ✅ READY FOR FUTURE IMPLEMENTATION
**Priority:** P1 HIGH (but properly deferred)

# Schema Evolution - Update Agents Without Breaking Changes

> Learn how to evolve your agent's API over time while maintaining backward compatibility

**Last Updated:** 2025-11-13

---

## Quick Start (5 minutes)

Update your agent's schema to add an optional field:

```typescript
import { TettoSDK, getDefaultConfig } from 'tetto-sdk';

const tetto = new TettoSDK({
  ...getDefaultConfig('mainnet'),
  apiKey: process.env.TETTO_API_KEY  // Required!
});

// Add optional namespace field for multi-user support
const updated = await tetto.updateAgent('your-agent-id', {
  inputSchema: {
    type: 'object',
    required: ['action', 'question'],  // Keep existing required fields
    properties: {
      action: { type: 'string', enum: ['teach', 'ask'] },
      namespace: {  // Optional field
        type: 'string',
        description: 'Optional namespace for multi-user isolation'
      },
      question: { type: 'string' }
    },
    additionalProperties: false
  }
});

console.log('✅ Schema updated! Agent ID:', updated.id);
```

**What just happened:**
- ✅ Added optional `namespace` field
- ✅ Agent ID unchanged (no breaking changes)
- ✅ Old callers still work (field is optional)
- ✅ New callers can use namespace feature

---

## Why Schema Evolution Matters

### The Problem Without updateAgent()

**Previously, when you needed to change an agent's schema:**

```typescript
// ❌ The old way: Re-register agent
const newAgent = await tetto.registerAgent({
  name: 'MyAgent v2',  // New name
  endpoint: 'https://api.example.com/v2',  // Same endpoint
  inputSchema: { /* updated schema */ },
  // ... all other fields must be provided again
  // Note: Also supports isPrivate, accessList
});

// Problems:
// 1. NEW agent ID → breaks existing integrations
// 2. Old agent ID still active → confusion
// 3. Lose call history and analytics
// 4. Lose marketplace position/ratings
// 5. Must notify all callers to update agent ID
```

**Impact on callers:**
```typescript
// Every caller must update their code:
// BEFORE: await tetto.callAgent('old-agent-id', input);
// AFTER:  await tetto.callAgent('new-agent-id', input);  // 💥 Breaking change!
```

### The Solution: In-Place Updates

**With updateAgent():**

```typescript
// ✅ The new way: Update in-place
const updated = await tetto.updateAgent('agent-id', {
  inputSchema: { /* updated schema */ }
});

// Benefits:
// 1. SAME agent ID → existing integrations work
// 2. Single source of truth
// 3. Preserves call history and analytics
// 4. Maintains marketplace position
// 5. No caller notification needed (if backward compatible)
```

**Impact on callers:**
```typescript
// Callers don't need to change anything:
await tetto.callAgent('agent-id', input);  // ✅ Still works!

// Optional: They can use new features when ready
await tetto.callAgent('agent-id', { ...input, namespace: 'user_123' });
```

---

## Understanding Schema Updates

### What Can Be Updated

Using `updateAgent()`, you can modify:

| Field | Description | Validation |
|-------|-------------|------------|
| `inputSchema` | Agent input JSON Schema | Must be valid JSON Schema |
| `outputSchema` | Agent output JSON Schema | Must be valid JSON Schema |
| `description` | Marketplace description | String, any length |
| `priceUSDC` | Price in USD | Number, 0.001-100 |
| `exampleInputs` | Example inputs (max 3) | Must validate against input schema |

**All fields are optional** - only provide what you want to update.

### What Cannot Be Updated

These fields are immutable for security/technical reasons:

| Field | Reason | Workaround |
|-------|--------|------------|
| `id` | Immutable (primary key) | N/A - this is the point! |
| `ownerWallet` | Security (prevents ownership transfer) | Create new agent |
| `endpoint` | Not yet implemented | Coming soon |
| `name` | Not yet implemented | Coming soon |
| `tokenMint` | Not yet implemented | Coming soon |

---

## Basic Usage

### Example 1: Add Optional Field

**Scenario:** Add namespace field for multi-user isolation

```typescript
import { TettoSDK, getDefaultConfig } from 'tetto-sdk';

const tetto = new TettoSDK({
  ...getDefaultConfig('mainnet'),
  apiKey: process.env.TETTO_API_KEY
});

// Original schema (before update)
const originalSchema = {
  type: 'object',
  required: ['action', 'question'],
  properties: {
    action: { type: 'string', enum: ['teach', 'ask'] },
    question: { type: 'string' }
  }
};

// Updated schema (adds optional namespace)
const updatedSchema = {
  type: 'object',
  required: ['action', 'question'],  // Same required fields
  properties: {
    action: { type: 'string', enum: ['teach', 'ask'] },
    namespace: {  // Optional field
      type: 'string',
      description: 'Namespace for multi-user isolation'
    },
    question: { type: 'string' }
  }
};

const updated = await tetto.updateAgent('agent-id', {
  inputSchema: updatedSchema,
  description: 'Q&A agent with multi-user namespace support'
});

console.log('✅ Updated:', updated.name);
console.log('   Agent ID unchanged:', updated.id);
```

**Backward compatibility:**
```typescript
// Old input still works (namespace optional)
await tetto.callAgent('agent-id', {
  action: 'ask',
  question: 'What is 2+2?'
});

// New input with namespace
await tetto.callAgent('agent-id', {
  action: 'ask',
  namespace: 'user_alice',
  question: 'What did I teach you?'
});
```

### Example 2: Fix Schema Bug

**Scenario:** Schema was too restrictive, need to allow more actions

```typescript
// Original schema (buggy - missing 'update' action)
const buggySchema = {
  type: 'object',
  required: ['action', 'question'],
  properties: {
    action: {
      type: 'string',
      enum: ['teach', 'ask']  // Missing 'update'!
    },
    question: { type: 'string' }
  }
};

// Fixed schema (adds 'update' action)
const fixedSchema = {
  type: 'object',
  required: ['action', 'question'],
  properties: {
    action: {
      type: 'string',
      enum: ['teach', 'ask', 'update']  // Added 'update'
    },
    question: { type: 'string' },
    answer: {  // Also add answer field for update
      type: 'string',
      description: 'New answer for update action'
    }
  }
};

const fixed = await tetto.updateAgent('agent-id', {
  inputSchema: fixedSchema
});

console.log('✅ Bug fixed! Update action now available');
```

### Example 3: Update Examples

**Scenario:** Add examples showing new features

```typescript
const updated = await tetto.updateAgent('agent-id', {
  exampleInputs: [
    {
      label: 'Basic question',
      input: { action: 'ask', question: 'What is 2+2?' },
      description: 'Simple question without namespace'
    },
    {
      label: 'Namespaced question',
      input: {
        action: 'ask',
        namespace: 'user_alice',
        question: 'What did I teach you?'
      },
      description: 'Question scoped to specific user'
    },
    {
      label: 'Update existing fact',
      input: {
        action: 'update',
        namespace: 'user_alice',
        question: 'What is the capital of France?',
        answer: 'Paris'
      },
      description: 'Update an existing fact in namespace'
    }
  ]
});

console.log('✅ Examples updated! New features documented');
```

### Example 4: Adjust Pricing

**Scenario:** Test different price points to optimize revenue

```typescript
// Start with low price
await tetto.updateAgent('agent-id', {
  priceUSDC: 0.01  // 1 cent
});

console.log('Testing price: $0.01');
// Monitor call volume for 1 week...

// Increase price if demand is high
await tetto.updateAgent('agent-id', {
  priceUSDC: 0.02  // 2 cents
});

console.log('Updated price: $0.02');
// Monitor revenue...

// Find optimal price point
await tetto.updateAgent('agent-id', {
  priceUSDC: 0.015  // 1.5 cents (optimal)
});

console.log('✅ Optimal price found: $0.015');
```

---

## Advanced Patterns

### Backward Compatible Changes

**Safe changes that won't break existing callers:**

#### ✅ Adding Optional Fields
```typescript
// BEFORE
properties: {
  action: { type: 'string' },
  question: { type: 'string' }
}

// AFTER (safe - new field is optional)
properties: {
  action: { type: 'string' },
  namespace: { type: 'string' },  // Optional field
  question: { type: 'string' }
}
```

#### ✅ Relaxing Validation
```typescript
// BEFORE (strict)
properties: {
  action: {
    type: 'string',
    enum: ['teach', 'ask']
  }
}

// AFTER (safe - more options allowed)
properties: {
  action: {
    type: 'string',
    enum: ['teach', 'ask', 'update', 'forget']  // Added more options
  }
}
```

#### ✅ Making Required Fields Optional
```typescript
// BEFORE
{
  required: ['action', 'question', 'answer'],
  properties: { /* ... */ }
}

// AFTER (safe - less strict)
{
  required: ['action', 'question'],  // 'answer' now optional
  properties: { /* ... */ }
}
```

#### ✅ Removing Field Constraints
```typescript
// BEFORE (restrictive)
properties: {
  question: {
    type: 'string',
    maxLength: 100  // Limit of 100 chars
  }
}

// AFTER (safe - more flexible)
properties: {
  question: {
    type: 'string'  // No length limit
  }
}
```

### Breaking vs Non-Breaking Changes

**⚠️ Changes that WILL break existing callers:**

#### ❌ Adding Required Fields
```typescript
// BEFORE
{
  required: ['action', 'question'],
  properties: { /* ... */ }
}

// AFTER (BREAKING!)
{
  required: ['action', 'question', 'namespace'],  // NEW required field
  properties: { /* ... */ }
}
// Problem: Old callers don't provide 'namespace' → validation fails
```

#### ❌ Removing Fields
```typescript
// BEFORE
properties: {
  action: { type: 'string' },
  question: { type: 'string' },
  tags: { type: 'array' }
}

// AFTER (BREAKING!)
properties: {
  action: { type: 'string' },
  question: { type: 'string' }
  // 'tags' removed!
}
// Problem: Callers sending 'tags' will get validation errors
```

#### ❌ Changing Field Types
```typescript
// BEFORE
properties: {
  metadata: {
    type: 'string'  // Was string
  }
}

// AFTER (BREAKING!)
properties: {
  metadata: {
    type: 'object'  // Now object
  }
}
// Problem: Callers sending strings will fail validation
```

#### ❌ Restricting Enums
```typescript
// BEFORE
properties: {
  action: {
    type: 'string',
    enum: ['teach', 'ask', 'update', 'forget']
  }
}

// AFTER (BREAKING!)
properties: {
  action: {
    type: 'string',
    enum: ['teach', 'ask']  // Removed 'update' and 'forget'
  }
}
// Problem: Callers using 'update' or 'forget' will fail
```

### Testing Schema Changes

**Best practice: Test on devnet before updating mainnet**

```typescript
import { TettoSDK, getDefaultConfig } from 'tetto-sdk';

// Step 1: Update devnet agent
const devnetSDK = new TettoSDK({
  ...getDefaultConfig('devnet'),
  apiKey: process.env.TETTO_API_KEY
});

const devnetUpdated = await devnetSDK.updateAgent('devnet-agent-id', {
  inputSchema: newSchema
});

console.log('✅ Devnet updated');

// Step 2: Test with old input
try {
  const oldInputResult = await devnetSDK.callAgent(
    'devnet-agent-id',
    { action: 'ask', question: 'Test' },  // Old format
    devnetWallet
  );
  console.log('✅ Old input works');
} catch (error) {
  console.error('❌ Old input broken!', error);
  throw new Error('Schema change breaks backward compatibility');
}

// Step 3: Test with new input
try {
  const newInputResult = await devnetSDK.callAgent(
    'devnet-agent-id',
    { action: 'ask', namespace: 'test', question: 'Test' },  // New format
    devnetWallet
  );
  console.log('✅ New input works');
} catch (error) {
  console.error('❌ New input broken!', error);
  throw new Error('Schema validation failed');
}

// Step 4: If tests pass, update mainnet
const mainnetSDK = new TettoSDK({
  ...getDefaultConfig('mainnet'),
  apiKey: process.env.TETTO_API_KEY
});

const mainnetUpdated = await mainnetSDK.updateAgent('mainnet-agent-id', {
  inputSchema: newSchema
});

console.log('✅ Mainnet updated safely');
```

---

## Real-World Example: WarmAnswers

**Production update: Adding namespace field for multi-user isolation**

### Before Update

**Original WarmAnswers schema:**
```typescript
{
  type: 'object',
  required: ['action', 'question'],
  properties: {
    action: {
      type: 'string',
      enum: ['teach', 'ask', 'update', 'forget']
    },
    wallet: {
      type: 'string',
      description: 'Target wallet (optional, defaults to caller)'
    },
    question: { type: 'string' },
    answer: { type: 'string' },
    tags: {
      type: 'array',
      items: { type: 'string' }
    }
  }
}
```

**Problem:** Each user's data was isolated by wallet address. But what if one user (wallet) wants to manage multiple isolated contexts (e.g., different projects)?

### The Update

```typescript
import { TettoSDK, getDefaultConfig } from 'tetto-sdk';

const tetto = new TettoSDK({
  ...getDefaultConfig('mainnet'),
  apiKey: process.env.TETTO_API_KEY
});

// Update mainnet WarmAnswers
const updated = await tetto.updateAgent('a4ebc22d-388a-4687-964f-7e27c428ddb9', {
  inputSchema: {
    type: 'object',
    required: ['action', 'question'],  // Same required fields
    properties: {
      action: {
        type: 'string',
        enum: ['teach', 'ask', 'update', 'forget']
      },
      namespace: {  // Optional namespace field
        type: 'string',
        description: 'Namespace for multi-user isolation (optional - defaults to wallet for backward compatibility)'
      },
      wallet: {
        type: 'string',
        description: 'Target wallet (optional, defaults to caller)'
      },
      question: { type: 'string' },
      answer: { type: 'string' },
      tags: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    additionalProperties: false
  },
  description: 'Intelligent Q&A agent with memory and multi-user namespace support. Teach it anything, ask it later.',
  exampleInputs: [
    {
      label: 'Basic question',
      input: { action: 'ask', question: 'What is 2+2?' },
      description: 'Simple question without namespace (uses caller wallet)'
    },
    {
      label: 'Namespaced question',
      input: {
        action: 'ask',
        namespace: 'project_alpha',
        question: 'What did I teach you about the API?'
      },
      description: 'Question scoped to specific project namespace'
    }
  ]
});

console.log('✅ WarmAnswers updated on mainnet');
console.log('   Agent ID unchanged:', updated.id);
```

### After Update

**Backward compatibility verified:**
```typescript
// Old callers (no namespace) still work
const oldResult = await tetto.callAgent('a4ebc22d-388a-4687-964f-7e27c428ddb9', {
  action: 'ask',
  question: 'What is the capital of France?'
}, wallet);
// ✅ Works! Uses caller wallet as namespace (default behavior)

// New callers can use namespace
const newResult = await tetto.callAgent('a4ebc22d-388a-4687-964f-7e27c428ddb9', {
  action: 'ask',
  namespace: 'project_alpha',
  question: 'What is the capital of France?'
}, wallet);
// ✅ Works! Uses 'project_alpha' namespace for isolation
```

**Impact:**
- ✅ 0 breaking changes (old callers unaffected)
- ✅ New feature available immediately
- ✅ Agent ID preserved (a4ebc22d-388a-4687-964f-7e27c428ddb9)
- ✅ Call history and analytics intact
- ✅ Marketplace position maintained

---

## Troubleshooting

### Common Errors and Solutions

#### Error: "API key required"

**Problem:**
```typescript
const updated = await tetto.updateAgent('agent-id', { /* ... */ });
// Error: API key required for updateAgent
```

**Solution:**
```typescript
const tetto = new TettoSDK({
  ...getDefaultConfig('mainnet'),
  apiKey: process.env.TETTO_API_KEY  // Add API key!
});
```

Generate API key at: https://www.tetto.io/dashboard/api-keys

#### Error: "Permission denied"

**Problem:**
```typescript
const updated = await tetto.updateAgent('agent-id', { /* ... */ });
// Error: Permission denied: You do not own this agent
```

**Solution:** You can only update agents you own. Check:
1. Agent ID is correct
2. API key belongs to the agent owner
3. You're using the correct API key (not someone else's)

#### Error: "Validation failed"

**Problem:**
```typescript
const updated = await tetto.updateAgent('agent-id', {
  inputSchema: {
    type: 'invalid'  // Invalid JSON Schema
  }
});
// Error: Validation failed: Invalid input_schema format
```

**Solution:** Ensure your schema is valid JSON Schema:
```typescript
const updated = await tetto.updateAgent('agent-id', {
  inputSchema: {
    type: 'object',  // Valid JSON Schema
    properties: {
      field: { type: 'string' }
    }
  }
});
```

Test your schema at: https://www.jsonschemavalidator.net/

#### Error: "example_inputs[0].input does not match input_schema"

**Problem:**
```typescript
const updated = await tetto.updateAgent('agent-id', {
  inputSchema: {
    type: 'object',
    required: ['action'],
    properties: {
      action: { type: 'string' }
    }
  },
  exampleInputs: [
    {
      label: 'Example',
      input: { wrong_field: 'value' }  // Doesn't match schema!
    }
  ]
});
// Error: example_inputs[0].input does not match input_schema
```

**Solution:** Ensure examples match your schema:
```typescript
const updated = await tetto.updateAgent('agent-id', {
  inputSchema: {
    type: 'object',
    required: ['action'],
    properties: {
      action: { type: 'string' }
    }
  },
  exampleInputs: [
    {
      label: 'Example',
      input: { action: 'test' }  // Matches schema ✅
    }
  ]
});
```

#### Error: "No updates provided"

**Problem:**
```typescript
const updated = await tetto.updateAgent('agent-id', {});
// Error: No updates provided
```

**Solution:** Provide at least one field to update:
```typescript
const updated = await tetto.updateAgent('agent-id', {
  description: 'Updated description'  // At least one field
});
```

---

## Best Practices

### 1. Always Add Optional Fields (Not Required)

**❌ Don't:**
```typescript
const updated = await tetto.updateAgent('agent-id', {
  inputSchema: {
    type: 'object',
    required: ['action', 'question', 'namespace'],  // Now required
    properties: { /* ... */ }
  }
});
// Breaks existing callers who don't provide 'namespace'
```

**✅ Do:**
```typescript
const updated = await tetto.updateAgent('agent-id', {
  inputSchema: {
    type: 'object',
    required: ['action', 'question'],  // Keep existing required fields
    properties: {
      action: { type: 'string' },
      question: { type: 'string' },
      namespace: { type: 'string' }  // Add as optional
    }
  }
});
// Old callers still work, new callers can use 'namespace'
```

### 2. Test with Old Input First

**Before updating production:**
```typescript
// Step 1: Update devnet
const devnetUpdated = await devnetSDK.updateAgent('devnet-id', {
  inputSchema: newSchema
});

// Step 2: Test with OLD input format
const oldInputWorks = await devnetSDK.callAgent(
  'devnet-id',
  { action: 'ask', question: 'Test' },  // Old format (no namespace)
  wallet
);

// Step 3: Only update mainnet if old input works
if (oldInputWorks) {
  await mainnetSDK.updateAgent('mainnet-id', {
    inputSchema: newSchema
  });
}
```

### 3. Update Examples to Show New Features

**❌ Don't leave examples outdated:**
```typescript
await tetto.updateAgent('agent-id', {
  inputSchema: {
    // ... added namespace field ...
  }
  // Examples still show old usage (no namespace)
});
```

**✅ Update examples:**
```typescript
await tetto.updateAgent('agent-id', {
  inputSchema: {
    // ... added namespace field ...
  },
  exampleInputs: [
    {
      label: 'Without namespace (backward compatible)',
      input: { action: 'ask', question: 'Test' }
    },
    {
      label: 'With namespace (new feature)',
      input: { action: 'ask', namespace: 'user_123', question: 'Test' }
    }
  ]
});
```

### 4. Document Changes in Description

**❌ Don't leave description outdated:**
```typescript
await tetto.updateAgent('agent-id', {
  inputSchema: {
    // ... added namespace field ...
  },
  description: 'Q&A agent with memory'  // Old description
});
```

**✅ Update description:**
```typescript
await tetto.updateAgent('agent-id', {
  inputSchema: {
    // ... added namespace field ...
  },
  description: 'Q&A agent with memory and multi-user namespace support'  // Updated!
});
```

### 5. Consider Staged Rollout (Devnet → Mainnet)

**Best practice workflow:**

```typescript
// Phase 1: Update devnet (test environment)
console.log('Phase 1: Updating devnet...');
const devnetUpdated = await devnetSDK.updateAgent('devnet-id', {
  inputSchema: newSchema
});

// Phase 2: Test thoroughly on devnet
console.log('Phase 2: Testing on devnet...');
await runIntegrationTests(devnetSDK, 'devnet-id');

// Phase 3: Update mainnet (production)
console.log('Phase 3: Updating mainnet...');
const mainnetUpdated = await mainnetSDK.updateAgent('mainnet-id', {
  inputSchema: newSchema
});

console.log('✅ Rollout complete!');
```

---

**Version:** 2.3.0
**Last Updated:** 2025-11-13

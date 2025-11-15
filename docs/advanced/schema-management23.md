# Schema Management with Tetto SDK

**Guide:** Advanced usage of `updateAgent()` method
**Last Updated:** 2025-11-13
**Audience:** Agent developers who need to evolve their APIs

---

## Overview

The Tetto SDK allows you to update agent schemas **without re-registering**, preserving your agent ID and all historical data. This guide covers best practices for schema evolution.

---

## The updateAgent() Method

### Basic Usage

```typescript
import { TettoSDK, getDefaultConfig } from 'tetto-sdk';

const tetto = new TettoSDK({
  ...getDefaultConfig('mainnet'),
  apiKey: process.env.TETTO_API_KEY  // Required for updates
});

const updated = await tetto.updateAgent('agent-uuid', {
  inputSchema: { /* new schema */ },
  outputSchema: { /* new schema */ },
  description: 'Updated description',
  priceUSDC: 0.02,
  exampleInputs: [ /* new examples */ ]
});

console.log('Updated:', updated.name);
```

### What Can Be Updated

| Field | Type | Description |
|-------|------|-------------|
| `inputSchema` | `Record<string, unknown>` | JSON Schema for input validation |
| `outputSchema` | `Record<string, unknown>` | JSON Schema for output validation |
| `description` | `string` | Marketplace description |
| `priceUSDC` | `number` | Price per call in USD |
| `exampleInputs` | `Array<{ label, input, description? }>` | Example inputs for users |

All fields are **optional** - update only what you need.

---

## Schema Evolution Patterns

### Pattern 1: Adding Optional Fields (Safe)

**Scenario:** Your agent needs a new optional parameter

**Example:** Adding user namespace support

```typescript
// Original schema
{
  type: 'object',
  required: ['question'],
  properties: {
    question: { type: 'string' }
  }
}

// New schema (backward compatible!)
{
  type: 'object',
  required: ['question'],  // ✅ Still only requires 'question'
  properties: {
    question: { type: 'string' },
    namespace: { type: 'string' }  // Optional field
  }
}
```

**Implementation:**

```typescript
const updated = await tetto.updateAgent('agent-uuid', {
  inputSchema: {
    type: 'object',
    required: ['question'],
    properties: {
      question: { type: 'string' },
      namespace: { type: 'string', description: 'User isolation namespace' }
    }
  },
  description: 'Now supports multi-user namespaces for data isolation',
  exampleInputs: [
    {
      label: 'Question with namespace',
      input: { question: 'What is my password?', namespace: 'user_123' }
    },
    {
      label: 'Question without namespace (backward compatible)',
      input: { question: 'What is 2+2?' }
    }
  ]
});
```

**Why This is Safe:**
- ✅ Existing callers still work (they don't send `namespace`)
- ✅ New callers can use new feature
- ✅ No breaking changes

---

### Pattern 2: Changing Required Fields (Breaking!)

**Scenario:** You need to add a required field

⚠️ **Warning:** This WILL break existing integrations!

**Example:** Making `namespace` required

```typescript
// Old schema
{
  required: ['question'],
  properties: {
    question: { type: 'string' },
    namespace: { type: 'string' }  // optional
  }
}

// New schema (BREAKING CHANGE!)
{
  required: ['question', 'namespace'],  // ❌ Now requires namespace
  properties: {
    question: { type: 'string' },
    namespace: { type: 'string' }
  }
}
```

**If You Must Do This:**

1. **Communicate with users** - Email, Discord, docs
2. **Give warning period** - "Schema change in 2 weeks"
3. **Update examples first:**

```typescript
// Step 1: Update examples (warn users)
await tetto.updateAgent('agent-uuid', {
  description: '⚠️ IMPORTANT: `namespace` will be required starting Jan 1, 2025. Update your code!',
  exampleInputs: [
    {
      label: 'Required format (starting Jan 1)',
      input: { question: 'What is my password?', namespace: 'user_123' }
    }
  ]
});

// Step 2: After warning period, update schema
await tetto.updateAgent('agent-uuid', {
  inputSchema: {
    type: 'object',
    required: ['question', 'namespace'],
    properties: {
      question: { type: 'string' },
      namespace: { type: 'string' }
    }
  },
  description: 'Multi-user question answering with required namespaces'
});
```

**Better Alternative: Create New Agent**
- Register new agent with required field
- Deprecate old agent gradually
- No breaking changes

---

### Pattern 3: Expanding Output Schema (Safe)

**Scenario:** You want to return more data

**Example:** Adding confidence scores

```typescript
// Old output schema
{
  type: 'object',
  required: ['answer'],
  properties: {
    answer: { type: 'string' }
  }
}

// New output schema (backward compatible!)
{
  type: 'object',
  required: ['answer'],  // ✅ Still only requires 'answer'
  properties: {
    answer: { type: 'string' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    sources: { type: 'array', items: { type: 'string' } }   
  }
}
```

**Implementation:**

```typescript
await tetto.updateAgent('agent-uuid', {
  outputSchema: {
    type: 'object',
    required: ['answer'],
    properties: {
      answer: { type: 'string' },
      confidence: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Confidence score (0-1)'
      },
      sources: {
        type: 'array',
        items: { type: 'string' },
        description: 'Source URLs used'
      }
    }
  },
  description: 'Now includes confidence scores and source citations'
});
```

**Why This is Safe:**
- ✅ Output schema additions don't break callers
- ✅ Callers can ignore new fields
- ✅ Modern callers can use new data

---

### Pattern 4: Narrowing Input Types (Breaking!)

**Scenario:** You want to restrict input values

⚠️ **Warning:** This WILL break existing integrations!

**Example:** Restricting enum values

```typescript
// Old schema (accepts any action)
{
  properties: {
    action: { type: 'string' }
  }
}

// New schema (BREAKING!)
{
  properties: {
    action: {
      type: 'string',
      enum: ['teach', 'ask', 'forget']  // ❌ Restricts to 3 values
    }
  }
}
```

**If You Must Do This:**

1. **Analyze existing calls** - What values are being sent?
2. **Warn users** - Update description with deprecation notice
3. **Handle gracefully** - Agent should return helpful error for invalid actions

---

## Example Inputs & Validation

### Why Update Example Inputs?

- ✅ Help users understand new schema
- ✅ Provide copy-paste examples
- ✅ Validate that new schema works

### How Backend Validates

When you update schemas, Tetto backend:
1. Validates input_schema with AJV
2. Validates output_schema with AJV
3. **Re-validates ALL example inputs against new input_schema**
4. Fails if any example becomes invalid

**Example:**

```typescript
// This will FAIL if any example doesn't match new schema
await tetto.updateAgent('agent-uuid', {
  inputSchema: {
    required: ['question', 'namespace'],  // Made namespace required
    properties: {
      question: { type: 'string' },
      namespace: { type: 'string' }
    }
  },
  exampleInputs: [
    {
      label: 'Valid example',
      input: { question: 'Test?', namespace: 'user_1' }  // ✅ Valid
    },
    {
      label: 'Invalid example',
      input: { question: 'Test?' }  // ❌ Missing namespace - FAILS!
    }
  ]
});
// Error: example_inputs[1].input does not match input_schema
```

**Best Practice:** Update examples when updating schemas!

---

## Error Handling

### Common Errors

**1. Invalid Schema Format**
```
Error: Invalid input_schema format
Details: schema must be object
```
**Fix:** Ensure schema is valid JSON Schema format

**2. Example Validation Failed**
```
Error: example_inputs[0].input does not match input_schema
Validation errors: [...]
```
**Fix:** Update examples to match new schema

**3. Permission Denied**
```
Error: Permission denied: You do not own this agent
```
**Fix:** Verify API key is correct, check agent ownership

**4. Authentication Failed**
```
Error: API key required for updateAgent
```
**Fix:** Add API key to SDK config

### Handling Errors in Code

```typescript
try {
  const updated = await tetto.updateAgent('agent-uuid', {
    inputSchema: newSchema,
    exampleInputs: newExamples
  });

  console.log('✅ Schema updated:', updated.name);
  console.log('   Updated at:', updated.updated_at);

} catch (error) {
  if (error.message.includes('example_inputs')) {
    console.error('❌ Example validation failed');
    console.error('   Fix examples to match new schema');
  } else if (error.message.includes('Invalid')) {
    console.error('❌ Schema format invalid');
    console.error('   Check JSON Schema syntax');
  } else if (error.message.includes('Permission')) {
    console.error('❌ Not authorized');
    console.error('   Verify API key and ownership');
  } else {
    console.error('❌ Update failed:', error.message);
  }
}
```

---

## Best Practices

### ✅ DO:

1. **Add optional fields** instead of required fields
2. **Expand output schemas** with new optional properties
3. **Update example inputs** when changing schemas
4. **Test schema updates** on DevNet first
5. **Document breaking changes** in description
6. **Communicate with users** before breaking changes
7. **Version your schemas** (in description/docs)

### ❌ DON'T:

1. **Add required fields** without user warning
2. **Remove existing fields** (causes errors)
3. **Narrow enum values** without deprecation period
4. **Change field types** (string → number breaks callers)
5. **Update schemas** without testing first
6. **Forget to update examples** (they'll fail validation)

---

## Testing Schema Updates

### Test on DevNet First

```typescript
// 1. Configure for DevNet
const tetto = new TettoSDK({
  ...getDefaultConfig('devnet'),
  apiKey: process.env.TETTO_DEVNET_API_KEY
});

// 2. Create test agent with old schema
const testAgent = await tetto.registerAgent({
  name: 'SchemaTestAgent',
  description: 'Testing schema evolution',
  endpoint_url: 'https://your-test-agent.com/api',
  input_schema: oldSchema,
  output_schema: oldOutputSchema,
  // ...
});

// 3. Update schema
const updated = await tetto.updateAgent(testAgent.id, {
  inputSchema: newSchema,
  outputSchema: newOutputSchema,
  exampleInputs: newExamples
});

// 4. Test calling with old format (backward compat check)
const result1 = await tetto.callAgent(testAgent.id, {
  input: { /* old format */ }
});

// 5. Test calling with new format
const result2 = await tetto.callAgent(testAgent.id, {
  input: { /* new format */ }
});

console.log('✅ Schema evolution test passed');
```

---

## UI vs SDK

Both UI and SDK support schema updates:

| Method | Pros | Cons |
|--------|------|------|
| **Dashboard UI** | • Visual editor<br>• Real-time validation<br>• No code needed | • Requires browser<br>• Manual process |
| **SDK (updateAgent)** | • Scriptable<br>• CI/CD integration<br>• Batch updates | • Requires programming<br>• Need API key |

**Use Dashboard UI for:** One-off updates, visual editing, beginners

**Use SDK for:** Automated updates, version control, CI/CD pipelines

---

## API Reference

### updateAgent(agentId, updates)

Updates agent schemas and metadata without re-registering.

**Parameters:**
- `agentId` (string): Agent UUID
- `updates` (UpdateAgentMetadata): Fields to update (all optional)

**UpdateAgentMetadata Interface:**
```typescript
interface UpdateAgentMetadata {
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  description?: string;
  priceUSDC?: number;
  exampleInputs?: Array<{
    label: string;
    input: Record<string, unknown>;
    description?: string;
  }>;
}
```

**Returns:** Promise<Agent>

**Throws:**
- Error if not authenticated
- Error if not owner
- Error if validation fails
- Error if example inputs don't match schema


---

## Related Resources

- [Agent Registration Guide](../building-agents/quickstart.md)
- [JSON Schema Documentation](https://json-schema.org/)
- [Tetto API Reference](../api-reference.md)
- [DevNet Testing Guide](../testing-on-devnet.md)

---

**Version:** 2.3.0
**Last Updated:** 2025-11-13
**Questions?** [Discord](https://discord.gg/tetto) | [GitHub Issues](https://github.com/tetto/tetto-sdk/issues)

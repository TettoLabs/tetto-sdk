# SDK Documentation Cleanup - Coordinator Pattern

**Purpose:** Ensure all SDK documentation shows the correct `fromContext()` pattern for coordinator agents.

**Date:** 2025-11-13
**Priority:** HIGH (incorrect docs teach bad patterns)

---

## 🎯 What Needs Fixing

### The Pattern Change:

**OLD (Incorrect/Manual):**
```typescript
const tetto = new TettoSDK(getDefaultConfig('mainnet'));
// Missing agentId - analytics broken!

// Or:
const tetto = new TettoSDK({
  ...getDefaultConfig('mainnet'),
  agentId: process.env.MY_AGENT_ID  // Manual, error-prone
});
```

**NEW (Correct/Auto):**
```typescript
const tetto = TettoSDK.fromContext(context.tetto_context);
// Auto-configures agentId and network!
```

---

## 📋 Files to Review & Update

### ✅ Already Fixed:
1. **README.md** - Updated example on line 45-50
2. **docs/advanced/coordinators.md** - All 7 examples updated

### 🔍 Need Review:

#### High Priority (User-Facing):
1. **docs/calling-agents/quickstart.md**
2. **docs/calling-agents/nodejs-guide.md**
3. **docs/calling-agents/api-reference.md**
4. **docs/building-agents/quickstart.md**
5. **docs/building-agents/README.md**
6. **examples/README.md**

#### Medium Priority (Advanced):
7. **docs/advanced/receipts.md**
8. **docs/advanced/schema-management.md**
9. **docs/advanced/security.md**
10. **docs/building-agents/agent-context.md**
11. **docs/building-agents/utilities-api.md**
12. **docs/building-agents/customization.md**

#### Low Priority (Internal/Reference):
13. **docs/TDK/*.md** (internal research docs)
14. **test/README.md**
15. **docs/troubleshooting.md**

---

## 🔍 Search Patterns

Use these to find problematic code:

```bash
# Pattern 1: SDK init without agentId in coordinator context
grep -n "new TettoSDK(getDefaultConfig" docs/**/*.md

# Pattern 2: Manual agentId config (might be OK, review context)
grep -n "agentId.*process.env" docs/**/*.md

# Pattern 3: Missing fromContext in coordinator examples
grep -n "async handler.*context.*AgentRequestContext" docs/**/*.md -A 10 | grep -v "fromContext"

# Pattern 4: callAgent examples (check if coordinator or user)
grep -n "tetto.callAgent\|await.*callAgent" docs/**/*.md -B 5
```

---

## 📝 Review Checklist for Each File

For each doc file, check:

### 1. **Is this showing a coordinator agent?**

**Indicators:**
- Agent calls other agents via `tetto.callAgent()`
- Has operational wallet
- Orchestrates multiple agents
- File/section mentions "coordinator"

**If YES:** Must use `fromContext()` pattern

**If NO:** Can use simple init (user calling agents is fine)

---

### 2. **Is SDK initialization shown?**

**If showing coordinator:**
```typescript
// ✅ CORRECT:
const tetto = TettoSDK.fromContext(context.tetto_context);

// ❌ WRONG:
const tetto = new TettoSDK(getDefaultConfig('mainnet'));

// ⚠️ ACCEPTABLE (if explained why):
const tetto = new TettoSDK({
  ...getDefaultConfig('mainnet'),
  agentId: process.env.AGENT_ID
});
```

**If showing user calling agents:**
```typescript
// ✅ CORRECT (users don't need agentId):
const tetto = new TettoSDK(getDefaultConfig('mainnet'));
```

---

### 3. **Is context parameter shown?**

**Coordinator handler signature:**
```typescript
// ✅ Must have context parameter:
async handler(input: any, context: AgentRequestContext) {
  const tetto = TettoSDK.fromContext(context.tetto_context);
  // ...
}

// ❌ Missing context:
async handler(input: any) {
  // Can't use fromContext!
}
```

---

### 4. **Is network detection shown?**

**OLD (error-prone):**
```typescript
const network = process.env.NODE_ENV === 'production' ? 'mainnet' : 'devnet';
const tetto = new TettoSDK(getDefaultConfig(network));
```

**NEW (automatic):**
```typescript
const tetto = TettoSDK.fromContext(context.tetto_context);
// Network auto-detected from context!
```

---

## 🎯 Specific File Instructions

### docs/calling-agents/quickstart.md

**Check for:**
- User examples (simple SDK init is OK)
- No coordinator examples should be here
- If any agent-to-agent examples, use `fromContext()`

---

### docs/calling-agents/nodejs-guide.md

**Check for:**
- Backend/server examples
- If showing coordinators, must use `fromContext()`
- If showing users, simple init is OK

---

### docs/building-agents/quickstart.md

**CRITICAL** - This teaches first-time agent builders!

**Must show:**
- Simple agents: Don't need fromContext
- Coordinator agents: **MUST show fromContext pattern**
- Clear distinction between the two

**Example structure:**
```markdown
## Simple Agent (No Sub-Agents)

\`\`\`typescript
export const POST = createAgentHandler({
  async handler(input) {
    // Simple agent doesn't call other agents
    return { result: doWork(input) };
  }
});
\`\`\`

## Coordinator Agent (Calls Sub-Agents)

\`\`\`typescript
export const POST = createAgentHandler({
  async handler(input, context) {
    const tetto = TettoSDK.fromContext(context.tetto_context);
    const result = await tetto.callAgent(subAgentId, input, wallet);
    return { output: result.output };
  }
});
\`\`\`
```

---

### docs/building-agents/agent-context.md

**Should explain:**
- What's in `tetto_context`
- `current_agent_id`, `current_agent_name`, `current_agent_network`
- How fromContext uses these
- Why coordinators need this

**Add section:**
```markdown
## Using Context for Coordinator Auto-Configuration

For coordinator agents, use `TettoSDK.fromContext()` to automatically
configure the SDK with your agent's identity:

\`\`\`typescript
const tetto = TettoSDK.fromContext(context.tetto_context);
\`\`\`

This automatically sets:
- Agent ID (for analytics tracking)
- Network (mainnet vs devnet)
- API URL (based on network)

No manual configuration needed!
```

---

### docs/advanced/security.md

**Check for:**
- Any coordinator examples
- Operational wallet patterns
- Should use `fromContext()` if showing coordinators

---

### examples/ directory

**Check if there are code examples:**

```bash
find examples/ -name "*.ts" -o -name "*.tsx" -o -name "*.js"
```

**Update any coordinator examples to use fromContext**

---

## ⚠️ Common Pitfalls to Watch For

### Pitfall 1: Mixing Patterns

**BAD:**
```markdown
You can initialize the SDK like this:

\`\`\`typescript
const tetto = new TettoSDK(getDefaultConfig('mainnet'));
\`\`\`

Or for coordinators:

\`\`\`typescript
const tetto = TettoSDK.fromContext(context.tetto_context);
\`\`\`
```

**GOOD:**
```markdown
For coordinators, use fromContext():

\`\`\`typescript
const tetto = TettoSDK.fromContext(context.tetto_context);
\`\`\`

For advanced use cases, manual configuration is available (see Advanced docs).
```

**Why:** Don't give equal weight to both patterns. fromContext is THE way.

---

### Pitfall 2: Incomplete Examples

**BAD:**
```typescript
const tetto = TettoSDK.fromContext(context.tetto_context);
const result = await tetto.callAgent(agentId, input, wallet);
```

**GOOD:**
```typescript
export const POST = createAgentHandler({
  async handler(input, context) {  // ← Show context parameter!
    const tetto = TettoSDK.fromContext(context.tetto_context);
    const result = await tetto.callAgent(agentId, input, wallet);
    return { output: result.output };
  }
});
```

**Why:** Devs need to see WHERE context comes from.

---

### Pitfall 3: Not Explaining Why

**BAD:**
```markdown
Use fromContext() to initialize the SDK.
```

**GOOD:**
```markdown
Use fromContext() to automatically configure your coordinator agent's
identity for proper analytics tracking. This ensures sub-agent calls
are properly attributed in the platform's observability metrics.
```

**Why:** Devs need to understand the value, not just the syntax.

---

## 📊 Quick Audit Commands

Run these to find all instances:

```bash
cd /Users/ryansmith/Desktop/eudaimonia/ai_coding/tetto/tetto-sdk

# Find all SDK initializations
grep -rn "new TettoSDK" docs/ --include="*.md" > /tmp/sdk-inits.txt

# Find all callAgent usages
grep -rn "callAgent" docs/ --include="*.md" > /tmp/call-agent.txt

# Find coordinator mentions
grep -rn "coordinator\|orchestrat" docs/ --include="*.md" -i > /tmp/coordinators.txt

# Review these files:
cat /tmp/sdk-inits.txt
cat /tmp/call-agent.txt
cat /tmp/coordinators.txt
```

---

## ✅ Validation Criteria

**A doc is correct if:**

1. **Simple agents** - Use basic SDK init (no fromContext needed)
2. **Coordinator agents** - Use `fromContext()` pattern
3. **Context parameter** - Shown in handler signature
4. **No manual agentId** - Unless explicitly teaching advanced config
5. **Explains why** - Says it's for analytics/tracking

**A doc needs fixing if:**

1. ❌ Coordinator example without `fromContext()`
2. ❌ Missing context parameter in handler
3. ❌ Shows `new TettoSDK(getDefaultConfig())` for coordinators
4. ❌ Doesn't explain analytics importance
5. ❌ Gives equal weight to manual vs auto patterns

---

## 🎓 Teaching Priorities

### What Devs MUST Learn:

**For Simple Agents:**
1. Use `createAgentHandler()`
2. Return output
3. That's it!

**For Coordinator Agents:**
1. Use `createAgentHandler()` with context parameter
2. Use `TettoSDK.fromContext(context.tetto_context)`
3. Use operational wallet for payments
4. Call sub-agents with `tetto.callAgent()`

**What's Optional/Advanced:**
- Manual SDK configuration
- Custom network selection
- Debug flags
- API keys for registration

---

## 📚 Documentation Structure Recommendations

### Suggested Doc Hierarchy:

```
docs/
├── quickstart.md                    (Simple agent only)
├── building-agents/
│   ├── simple-agents.md            (No fromContext)
│   └── coordinator-agents.md       (fromContext pattern!)
├── advanced/
│   ├── coordinators.md             ✅ Already fixed
│   ├── manual-configuration.md     (When/why to not use fromContext)
│   └── ...
```

---

## 🔧 Automated Fixes

**Safe replacements (in coordinator contexts only):**

```bash
# In files that mention "coordinator":
# Replace:
const tetto = new TettoSDK(getDefaultConfig('mainnet'));

# With:
const tetto = TettoSDK.fromContext(context.tetto_context);
```

**CAUTION:** Only do this where:
- Context is available (inside handler)
- It's a coordinator agent (not a user example)
- The code shows calling other agents

---

## 🎯 Critical Docs to Prioritize

### Must Review Immediately:

**1. docs/building-agents/quickstart.md**
- First thing new devs read
- Sets expectations
- If wrong here, everyone gets it wrong

**2. docs/advanced/coordinators.md**
- ✅ Already fixed!
- Verify fix is comprehensive

**3. README.md**
- ✅ Already fixed!
- Main entry point

**4. examples/ directory**
- Code examples are copied/pasted
- Must be perfect

---

## ⚠️ Breaking Change Considerations

**This is NOT a breaking change!**

**Old code still works:**
```typescript
const tetto = new TettoSDK({
  agentId: process.env.AGENT_ID
});
// ✅ Still works, just manual
```

**New code is better:**
```typescript
const tetto = TettoSDK.fromContext(context.tetto_context);
// ✅ Auto-configured, recommended
```

**So docs should:**
- Show `fromContext()` as THE way
- Mention manual config as "Advanced"
- Not imply they're equal choices

---

## 📊 Success Metrics

**Documentation is clean when:**

1. ✅ 0 coordinator examples without `fromContext()`
2. ✅ All examples show context parameter
3. ✅ `fromContext()` mentioned in quickstart
4. ✅ Analytics importance explained
5. ✅ Manual config in "Advanced" section only

**How to verify:**

```bash
# Should return 0 results:
grep -r "coordinator\|orchestrat" docs/ -i | grep -v "fromContext" | grep "new TettoSDK"

# Should return multiple results:
grep -r "fromContext" docs/ --include="*.md"
```

---

## 🎯 Recommended Approach

### Phase 1: Critical Paths (30 min)
1. Review `docs/building-agents/quickstart.md`
2. Review `docs/calling-agents/quickstart.md`
3. Check `examples/` directory
4. Fix any coordinator examples without `fromContext()`

### Phase 2: Comprehensive Audit (1-2 hours)
1. Run grep commands to find all SDK inits
2. Review each in context (coordinator vs user)
3. Update coordinator examples to use `fromContext()`
4. Leave user examples as-is (simple init OK)

### Phase 3: Validation (30 min)
1. Build SDK (`npm run build`)
2. Check for broken links
3. Verify examples compile
4. Test one example end-to-end

---

## 💡 Key Principles

**When reviewing docs:**

1. **Context is king** - If example shows agent handler with context, it's a coordinator candidate
2. **Calling agents = coordinator** - If example shows `tetto.callAgent()`, use `fromContext()`
3. **Simple init for users** - Users calling agents don't need `fromContext()`
4. **Consistency matters** - All coordinator examples should look the same

---

## 🚨 Red Flags

**If you see these, fix them:**

1. ❌ Coordinator example with `new TettoSDK(getDefaultConfig())`
2. ❌ `callAgent()` without showing where `tetto` came from
3. ❌ Handler missing `context` parameter but using SDK
4. ❌ Docs say "you can do X or Y" when showing coordinator pattern
5. ❌ No mention of analytics/tracking importance

---

## ✅ Green Flags

**Good examples look like:**

```typescript
import { createAgentHandler, TettoSDK } from 'tetto-sdk';
import { createWalletFromKeypair } from 'tetto-sdk';

export const POST = createAgentHandler({
  async handler(input, context) {
    const tetto = TettoSDK.fromContext(context.tetto_context);
    const wallet = getOperationalWallet();

    const result = await tetto.callAgent(SUB_AGENT_ID, input, wallet);

    return { output: result.output };
  }
});
```

**Why this is perfect:**
- ✅ Shows imports
- ✅ Shows context parameter
- ✅ Uses fromContext()
- ✅ Shows callAgent usage
- ✅ Complete, copyable example

---

## 📋 File-by-File Quick Reference

### docs/calling-agents/quickstart.md
**Expected content:** Users calling agents from apps/websites
**Should use:** Simple SDK init (`new TettoSDK(getDefaultConfig())`)
**Action:** Verify no coordinator examples, if any, fix them

### docs/calling-agents/nodejs-guide.md
**Expected content:** Backend/server calling agents
**Should use:** Simple SDK init (unless showing coordinator pattern)
**Action:** Check for coordinator examples, update if found

### docs/building-agents/quickstart.md
**Expected content:** How to build your first agent
**Should use:** Both patterns (simple agent + coordinator agent sections)
**Action:** Ensure coordinator section uses `fromContext()`

### docs/building-agents/agent-context.md
**Expected content:** Explaining tetto_context
**Should use:** fromContext() as the primary use case
**Action:** Add section explaining `current_agent_id` fields

### docs/advanced/coordinators.md
**Expected content:** Deep dive on coordinator patterns
**Should use:** fromContext() everywhere
**Action:** ✅ Already fixed! Verify no missed examples

### examples/
**Expected content:** Real, working code examples
**Should use:** Correct patterns for each type
**Action:** Test compilation, verify fromContext in coordinators

---

## 🔬 Deep Dive Script

**For thorough review, run:**

```bash
#!/bin/bash

echo "=== SDK Documentation Audit ==="
echo ""

echo "1. Finding all SDK initializations..."
grep -rn "new TettoSDK" docs/ --include="*.md" | tee /tmp/all-sdk-inits.txt
echo "   Found: $(wc -l < /tmp/all-sdk-inits.txt) instances"
echo ""

echo "2. Finding fromContext usage..."
grep -rn "fromContext" docs/ --include="*.md" | tee /tmp/from-context-usage.txt
echo "   Found: $(wc -l < /tmp/from-context-usage.txt) instances"
echo ""

echo "3. Finding coordinator mentions..."
grep -rn "coordinator" docs/ --include="*.md" -i | tee /tmp/coordinator-mentions.txt
echo "   Found: $(wc -l < /tmp/coordinator-mentions.txt) instances"
echo ""

echo "4. Finding callAgent usages..."
grep -rn "\.callAgent\|await callAgent" docs/ --include="*.md" | tee /tmp/call-agent-usage.txt
echo "   Found: $(wc -l < /tmp/call-agent-usage.txt) instances"
echo ""

echo "=== Review these files for incorrect patterns: ==="
echo ""

# Find coordinator examples without fromContext
echo "Potential issues (coordinator context without fromContext):"
grep -l "coordinator" docs/**/*.md -i | while read file; do
  if grep -q "new TettoSDK(getDefaultConfig" "$file"; then
    if ! grep -q "fromContext" "$file"; then
      echo "  ⚠️  $file - Has coordinator but no fromContext"
    fi
  fi
done
echo ""

echo "=== Manual review needed: ==="
cat /tmp/all-sdk-inits.txt
```

---

## 🎯 Acceptance Criteria

**Docs are clean when:**

1. **All coordinator examples use `fromContext()`** ✅
2. **User examples use simple init** ✅
3. **Context parameter always shown for coordinators** ✅
4. **Analytics importance explained** ✅
5. **No conflicting patterns** ✅
6. **Examples are complete and copyable** ✅

**Test:**
- New dev reads quickstart → Builds correct agent
- New dev reads coordinator docs → Uses fromContext
- No confusion about which pattern to use

---

## 📝 Sample Fixes

### Before:
```markdown
## Building a Coordinator

\`\`\`typescript
const tetto = new TettoSDK(getDefaultConfig('mainnet'));
const result = await tetto.callAgent(subAgentId, input, wallet);
\`\`\`
```

### After:
```markdown
## Building a Coordinator

\`\`\`typescript
export const POST = createAgentHandler({
  async handler(input, context) {
    const tetto = TettoSDK.fromContext(context.tetto_context);
    const wallet = getOperationalWallet();
    const result = await tetto.callAgent(subAgentId, input, wallet);
    return { output: result.output };
  }
});
\`\`\`

The `fromContext()` method automatically configures your agent's identity
and network, ensuring sub-agent calls are properly tracked in analytics.
```

---

## 🚀 Deliverable

**After cleanup, create:**

`SDK_DOC_CLEANUP_COMPLETE.md` with:
1. List of files reviewed
2. List of files updated
3. Pattern consistency verification
4. Any remaining issues/questions
5. Sign-off that docs are clean

---

**Priority:** HIGH
**Effort:** 2-3 hours for thorough review
**Impact:** Prevents all future agents from having analytics bugs

**This cleanup is CRITICAL before external devs use the SDK!** 🎯

---

**Next person: Start with Phase 1 (critical paths), then do comprehensive audit.** ✅

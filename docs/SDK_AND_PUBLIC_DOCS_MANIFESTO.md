# SDK & Public Documentation Manifesto

**Purpose:** Guidelines for maintaining world-class SDK and documentation quality
**Audience:** All developers working on tetto-sdk, tetto-cli, tetto-python-sdk, and public-facing documentation
**Created:** 2025-10-28
**Status:** MANDATORY - Read before touching any public-facing code or docs

---

## 🎯 THE CORE PRINCIPLE

**These repositories could be seen by millions of developers.**

Every comment, every example, every tutorial, every README will be read by external developers evaluating Tetto. They will judge:
- Our professionalism
- Our attention to detail
- Our respect for developers
- Our product quality

**Internal development markers, effort names, and sloppy comments make us look unprofessional and confuse developers.**

---

## ⚠️ THE GOLDEN RULE

**NEVER use internal effort names, checkpoint references, or development phase markers in any public-facing code or documentation.**

### What is Public-Facing?

**Public-Facing (Strict Rules Apply):**
- ✅ All SDK source code (`src/*.ts`)
- ✅ All SDK documentation (`docs/**/*.md`)
- ✅ All README files
- ✅ All examples (`examples/**/*`)
- ✅ All tutorials and guides
- ✅ All Portal API routes (`app/api/**/*.ts`)
- ✅ All Portal library code (`lib/**/*.ts`)
- ✅ All exported types (`types/**/*.ts`)
- ✅ All public interfaces
- ✅ CHANGELOG.md
- ✅ package.json descriptions
- ✅ Error messages users see
- ✅ Console logs in SDK
- ✅ JSDoc comments

**Internal-Only (Relaxed Rules):**
- ⚠️ Test scripts (`scripts/*.ts`) - but still prefer descriptive names
- ⚠️ Internal documentation (`docs/internal/*.md`)
- ⚠️ Development notes (never committed to main/staging)

**When in doubt:** Treat it as public-facing. Better safe than unprofessional.

---

## 🚫 FORBIDDEN IN PUBLIC CODE

### Never Use These:

**Checkpoint References:**
- ❌ CP0, CP1, CP2, CP3, CP4, CP5, CP6, CP7, CP9
- ❌ "from CP2"
- ❌ "added in CP0"
- ❌ "CP3 fix"

**Project/Effort Names:**
- ❌ ENV_SETUP
- ❌ API_KEYS
- ❌ MARKETPLACE_IDENTITY
- ❌ QUICKWINS
- ❌ FATAL_FLAW
- ❌ Any internal project codename

**Architecture Versions:**
- ❌ SDK3, TETTO2, TETTO3
- ❌ "TETTO3 introduces..."
- ❌ "SDK3 benefits..."

**Development Markers:**
- ❌ "TODO from yesterday"
- ❌ "HACK for now"
- ❌ "FIX BUG from last week"
- ❌ "WIP - finishing later"

**Why Forbidden:**
External developers seeing "CP2" or "ENV_SETUP" will think:
- "What's CP2? Is there documentation I'm missing?"
- "Is this code unfinished?"
- "Do I need to know about ENV_SETUP to use this?"
- "This looks like internal development code leaked to production"

**Result:** Confusion, lack of trust, unprofessional appearance.

---

## ✅ USE INSTEAD

### Good Comment Patterns:

**❌ BAD:**
```typescript
// CP2: Get domain config for network filtering
const config = await getDomainConfig();
```

**✅ GOOD:**
```typescript
// Get domain configuration for network-based filtering
// Determines which network (mainnet/devnet) to query based on hostname
const config = await getDomainConfig();
```

---

**❌ BAD:**
```typescript
// ENV_SETUP - CP2: Connect to correct database
let dbUrl: string;
```

**✅ GOOD:**
```typescript
// Connect to appropriate database based on environment
// Staging uses separate database for isolation
let dbUrl: string;
```

---

**❌ BAD:**
```typescript
// MARKETPLACE_IDENTITY - CP1: Join with users table for owner profile
```

**✅ GOOD:**
```typescript
// Join with users table to include owner profile information
// Returns display name, avatar, verified badge, studio, and bio
```

---

**❌ BAD:**
```typescript
// TETTO3 - CP3: Only payment_intent_id required
```

**✅ GOOD:**
```typescript
// Payment parameters extracted from payment_intent record
// Only payment_intent_id and signed_transaction are required in request body
```

---

**❌ BAD:**
```typescript
// SDK3: No connection needed!
const wallet = createWalletFromKeypair(keypair);
```

**✅ GOOD:**
```typescript
// No RPC connection needed (platform handles transaction submission)
const wallet = createWalletFromKeypair(keypair);
```

---

### Comment Quality Standards:

**Good comments explain:**
- ✅ WHAT the code does
- ✅ WHY it's done this way
- ✅ HOW it works (if complex)
- ✅ WHEN to use it (if not obvious)

**Good comments DON'T explain:**
- ❌ WHEN it was added
- ❌ WHICH effort added it
- ❌ WHO added it (that's what git history is for)
- ❌ WHAT was fixed (that's what commit messages are for)

---

## 📅 VERSIONING STRATEGY

### Pre-Launch (Current State)

**Philosophy:** Act like we nailed it from the first iteration.

**Rules:**
- ✅ No "What's New" entries for every change
- ✅ No version bumps for small fixes
- ✅ Update existing docs without version markers
- ✅ CHANGELOG.md can track changes, but keep it clean

**Example:**
```markdown
❌ BAD:
## What's New in v1.2.1
- Fixed typo in quickstart
- Updated example to use correct endpoint

✅ GOOD:
(Just fix the typo and update the example - no announcement needed)
```

**When to bump version pre-launch:**
- New features (v1.x.0)
- Breaking changes (v2.0.0)
- Critical bug fixes (v1.x.y)

**When NOT to bump version:**
- Documentation fixes
- Comment improvements
- Example updates
- Typo corrections

---

### Post-Launch (After Public Release)

**Philosophy:** Transparent about changes, but don't over-version.

**Sweeping Changes (Major/Minor Version Bump):**

**Major (v2.0.0):**
- Breaking API changes
- Removing deprecated methods
- Changing method signatures
- New required parameters

**Minor (v1.x.0):**
- New methods added
- New features
- New capabilities
- Significant enhancements

**Examples of Sweeping Changes:**
```typescript
// Add new method → v1.3.0
async updateAgent(agentId: string, updates: Partial<AgentMetadata>): Promise<Agent>

// Add new interface → v1.3.0
export interface AgentAnalytics {
  total_calls: number;
  success_rate: number;
  revenue: number;
}

// New feature → v1.4.0
async callAgentWithRetry(agentId: string, input: any, wallet: TettoWallet, retries: number): Promise<CallResult>
```

---

**Minor Changes (Patch Version or No Bump):**

**Patch (v1.x.y):**
- Bug fixes
- Error message improvements
- Performance optimizations (no API changes)
- Internal refactoring (no user-facing changes)

**No Version Bump:**
- Documentation fixes
- Comment improvements
- Typo corrections
- Example updates
- README edits

**Examples of Minor Changes:**
```typescript
// Better error message → v1.2.1 (or no bump if doc-only)
throw new Error('Agent not found: ' + agentId + '\nBrowse agents at...');

// Fix typo in comment → NO VERSION BUMP
// Before: "Recieve response"
// After: "Receive response"

// Update example → NO VERSION BUMP
// Fix outdated agent ID in example code
```

---

**How to Handle Each:**

**Major/Minor (Sweeping Changes):**
```markdown
1. Bump version in package.json
2. Add to CHANGELOG.md with detailed description
3. Update "What's New" section in README (if significant)
4. Add migration guide if breaking
5. Update version in all doc footers
6. Announce to community (Discord, Twitter)
```

**Patch (Minor Changes):**
```markdown
1. Bump patch version in package.json
2. Add one-line entry to CHANGELOG.md
3. No README announcement needed
4. Push quietly
```

**No Version Bump:**
```markdown
1. Make the fix
2. Commit with clear message
3. Push to staging/main
4. No changelog entry needed
```

---

## 📝 DOCUMENTATION CONSISTENCY RULES

### The Four Questions (Ask Before Every Change)

Before changing ANY public-facing code or documentation, ask yourself:

**1. Would this confuse a new onlooker?**
```typescript
❌ BAD: "ENV_SETUP - CP2: Get domain config"
   A new developer sees "ENV_SETUP" and thinks "What's that? Do I need to know about it?"

✅ GOOD: "Get domain configuration for environment detection"
   Clear, self-explanatory, professional
```

**2. Who is this comment for?**
```typescript
❌ BAD: "// Fixed the bug from last Tuesday"
   For: Internal team (assumes context)

✅ GOOD: "// Validate UUID format before API call to prevent invalid requests"
   For: Any developer reading the code (explains purpose)
```

**3. Does this change match the consistency of the docs?**
```typescript
❌ BAD: Adding one file with version "1.1.0" when all others say "1.2.0"

✅ GOOD: Check what version other docs use, match it
```

**4. Are there mistakes from previous developers I should fix?**
```typescript
While editing file, scan for:
- Old version numbers
- Effort markers (CP#, project names)
- Broken links
- Inconsistent formatting
- Typos

Fix them in the same commit!
```

---

## 🎨 CODE QUALITY STANDARDS

### Comments in Source Code

**File Headers:**
```typescript
❌ BAD:
/**
 * CP3 Payment Intent Flow
 * Added 2025-10-23 for SDK3
 */

✅ GOOD:
/**
 * Payment Intent Management
 *
 * Handles payment intent creation, validation, and lifecycle tracking.
 * Payment intents ensure input is validated before payment occurs.
 */
```

**Inline Comments:**
```typescript
❌ BAD:
// TETTO3 - CP3: Only these fields required
const { payment_intent_id, signed_transaction } = body;

✅ GOOD:
// Payment parameters extracted from payment_intent record
// Only payment_intent_id and signed_transaction are required in request
const { payment_intent_id, signed_transaction } = body;
```

**Function Comments (JSDoc):**
```typescript
❌ BAD:
/**
 * Call agent (SDK3 platform-powered)
 */

✅ GOOD:
/**
 * Call an agent with payment from user's wallet
 *
 * Platform validates input BEFORE payment (fail fast!)
 * Platform builds and submits transaction (you only sign)
 *
 * @param agentId - Agent UUID
 * @param input - Input matching agent's schema
 * @returns Agent output + payment proof
 */
```

---

### Error Messages

**User-Facing Errors (High Standards):**

```typescript
❌ BAD:
throw new Error('Auth failed');

✅ GOOD:
throw new Error(
  'Authentication failed: API key required\n\n' +
  'To fix this:\n' +
  '1. Generate an API key at https://www.tetto.io/dashboard/api-keys\n' +
  '2. Add to your config: { apiKey: process.env.TETTO_API_KEY }\n' +
  '3. Set environment variable: TETTO_API_KEY=your-key-here'
);
```

**Error Message Checklist:**
- ✅ What went wrong?
- ✅ Why might this have happened?
- ✅ How can user fix it?
- ✅ Link to docs/dashboard if helpful
- ✅ Professional, friendly tone

---

### Examples

**Example Files Should:**
- ✅ Have clear, descriptive filenames
- ✅ Include comprehensive header comments
- ✅ Show complete working code
- ✅ Include error handling
- ✅ Work on devnet or mainnet
- ✅ Have instructions for running
- ✅ Be tested and verified to work

**Example Files Should NOT:**
- ❌ Reference internal effort names
- ❌ Hardcode specific agent IDs without explanation
- ❌ Use outdated patterns
- ❌ Have incomplete code
- ❌ Assume specific agents exist

---

## 📋 PRE-COMMIT CHECKLIST

**Before committing ANY change to SDK/docs, verify:**

### Scan for Forbidden Markers:
```bash
# Run these searches on files you changed:
grep -i "CP[0-9]" your-file.ts
grep -i "SDK3\|TETTO[0-9]" your-file.ts
grep -i "ENV_SETUP\|API_KEYS\|MARKETPLACE_IDENTITY" your-file.ts

# Should return: 0 results
```

### Check Version Consistency:
```bash
# If you changed version anywhere, update everywhere:
grep -r "version.*1\.[0-9]" README.md package.json docs/
# All should match (currently 1.2.0)
```

### Check Date Consistency:
```bash
# If you updated "Last Updated" in one doc, update in related docs:
grep "Last Updated" docs/**/*.md
# Related docs should have same date
```

### Verify Examples Compile:
```bash
# If you changed SDK code, test examples still work:
npx tsc --noEmit examples/**/*.ts
```

### Read Your Own Changes:
- Does this make sense to someone seeing the codebase for the first time?
- Would this confuse an external developer?
- Is this professional and polished?

---

## 🔍 CODE REVIEW GUIDELINES

### When Reviewing Code (Or Your Own Changes)

**Look For:**

**1. Internal Markers:**
```typescript
❌ "CP2: Fixed this issue"
❌ "ENV_SETUP - Get config"
❌ "SDK3 benefit:"
```

**2. Unclear Comments:**
```typescript
❌ "// Fix from yesterday"
❌ "// TODO: Ask Ryan about this"
❌ "// Weird edge case"
```

**3. Version Inconsistencies:**
```typescript
❌ README says v1.2.0 but doc says v1.1.0
❌ One file dated 2025-10-18, another 2025-10-28
```

**4. Broken Patterns:**
```typescript
❌ One example uses getDefaultConfig(), another hardcodes config
❌ One doc has "Learn more →", another has "Read more:"
❌ Inconsistent code style
```

**Fix Immediately:**
- If you see mistakes from previous developers, fix them
- Don't wait for "cleanup effort" - fix as you go
- Include fixes in your commit

---

## 📚 DOCUMENTATION STANDARDS

### README Files

**Must Have:**
- Clear title and description
- Current version number
- Up-to-date examples
- No internal markers
- Professional tone
- Links that work

**Don't Have:**
- Historical context ("we used to do it this way")
- Internal effort names
- Outdated information
- Broken links

---

### Tutorial Files

**Structure:**
```markdown
# Tutorial Title

> One-line description

**What you'll learn:**
- Bullet points
- Clear outcomes
- No internal jargon

## Section 1: Clear Heading

Clear explanation...

**Example:**
```typescript
// Working code
```

**Why this works:**
Explanation of benefits/architecture

---

**Version:** 1.2.0
**Last Updated:** YYYY-MM-DD
```

**Every tutorial should:**
- ✅ Be up-to-date
- ✅ Have working code examples
- ✅ Explain WHY, not just WHAT
- ✅ Link to related docs
- ✅ Be beginner-friendly
- ✅ Be tested and verified

---

### Code Examples

**Example File Template:**
```typescript
/**
 * Example Title - Clear Description
 *
 * This example shows how to [specific task].
 *
 * Prerequisites:
 * - Requirement 1
 * - Requirement 2
 *
 * Run:
 * npm install
 * npx ts-node examples/path/to/example.ts
 *
 * Learn more: docs/guide.md
 */

import { /* imports */ } from 'tetto-sdk';

async function main() {
  console.log('Clear description of what example does\n');

  // Step 1: Clear step description
  const result1 = await doSomething();
  console.log('✅ Step 1 complete');

  // Step 2: Another clear step
  const result2 = await doSomethingElse();
  console.log('✅ Step 2 complete');

  console.log('\n🎉 Example complete!');
  console.log('Next steps: [what user should do next]');
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
```

---

## 🚀 VERSION BUMP DECISION TREE

```
Is this change user-facing?
├─ NO → No version bump (internal refactoring, private methods)
└─ YES → Continue...

Does it break existing code?
├─ YES → MAJOR version (v2.0.0)
│         - Update migration guide
│         - Announce to community
│         - Document breaking changes
└─ NO → Continue...

Does it add new functionality?
├─ YES → MINOR version (v1.x.0)
│         - Update CHANGELOG
│         - Update README "What's New"
│         - Announce if significant
└─ NO → Continue...

Is it a bug fix or improvement?
├─ YES (user-visible) → PATCH version (v1.x.y)
│                       - Update CHANGELOG
│                       - Quiet release
└─ NO (docs only) → NO VERSION BUMP
                    - Just fix and commit
                    - Update "Last Updated" date
```

---

## 📖 SPECIFIC SCENARIOS

### Scenario 1: Fixing Typo in Documentation

**Action:**
```bash
# Fix typo
# Update "Last Updated" date to today
# Commit: "docs: Fix typo in quickstart guide"
# NO version bump
```

---

### Scenario 2: Adding New SDK Method

**Action:**
```bash
# Add method to src/index.ts
# Add JSDoc documentation
# Update docs/calling-agents/api-reference.md
# Add example usage
# Update CHANGELOG.md
# Bump version: v1.2.0 → v1.3.0
# Commit: "feat: Add getMyAgents() method"
# Announce in Discord/Twitter
```

---

### Scenario 3: Improving Error Message

**Action:**
```bash
# Improve error message in src/index.ts
# Update tests if needed
# Bump version: v1.2.0 → v1.2.1 (patch)
# Update CHANGELOG: "Improved error message in getAgent()"
# Commit: "fix: Improve getAgent error message"
# Quiet release (no announcement)
```

---

### Scenario 4: Found Old "CP2" Marker While Adding Feature

**Action:**
```bash
# Remove CP2 marker FIRST
# Then add your feature
# Include both in same commit
# Commit message mentions both:
# "feat: Add caching to getAgent + remove CP2 marker"
```

---

## 🛡️ QUALITY GATES

### Before Merging to Staging/Main:

**Required Checks:**

1. **Scan for markers:**
   ```bash
   grep -r "CP[0-9]\|SDK3\|TETTO[0-9]\|ENV_SETUP\|API_KEYS\|MARKETPLACE_IDENTITY" \
     src/ docs/ examples/ README.md --include="*.ts" --include="*.md"
   # Should return: 0 results (or only acceptable internal references)
   ```

2. **Version consistency:**
   ```bash
   # All public docs should have same version
   grep "Version:" docs/**/*.md README.md | sort -u
   # Should show only one version
   ```

3. **Build succeeds:**
   ```bash
   npm run build
   # Should complete with no errors
   ```

4. **Examples compile:**
   ```bash
   npx tsc --noEmit examples/**/*.ts
   # Should complete with no errors
   ```

5. **Links work:**
   - Check internal markdown links
   - Check external URLs (dashboard, faucets, etc.)
   - Fix broken links immediately

---

## 🎓 EDUCATION FOR NEW DEVELOPERS

### Onboarding Checklist

**New developer joins team and will work on SDK/docs:**

**Must Read:**
1. ✅ This manifesto (SDK_AND_PUBLIC_DOCS_MANIFESTO.md)
2. ✅ README.md (understand the project)
3. ✅ CHANGELOG.md (understand recent changes)
4. ✅ docs/studios/README.md (understand key features)

**Must Understand:**
- Why we don't use internal markers
- How to write professional comments
- When to bump versions
- The four questions (confuse? who for? consistency? mistakes?)

**First Task:**
Have them review a file and identify:
- Any effort markers
- Any unclear comments
- Any version inconsistencies
- Any improvements needed

This trains them to think with quality mindset.

---

## 🔨 FIXING MISTAKES

### If You Find Internal Markers:

**Don't wait - fix immediately:**

```typescript
// You see this while adding a feature:
// ENV_SETUP - CP2: Get domain config
const config = await getDomainConfig();

// Fix it RIGHT NOW:
// Get domain configuration for environment detection
const config = await getDomainConfig();

// Include in your commit:
"feat: Add caching + remove ENV_SETUP marker"
```

**If you find many markers:**
- Fix a few in your commit (opportunistic cleanup)
- OR create a separate cleanup commit
- Don't let them accumulate

---

### If You Find Version Inconsistencies:

**Fix while you're there:**

```markdown
You're editing docs/quickstart.md and notice footer says:
**Version:** 1.1.0

But package.json says v1.2.0

→ Update quickstart.md footer to 1.2.0
→ Check other docs too
→ Include fix in your commit
```

---

## 📊 CURRENT STANDARDS (As of v1.2.0)

### Version Number: 1.2.0

**Where it appears:**
- package.json
- README.md header
- All doc footers
- CHANGELOG.md
- Examples that show version

**Keep consistent:** When version bumps, update ALL these files.

---

### Date Format: 2025-10-28

**Where dates appear:**
- Doc footers: "Last Updated: 2025-10-28"
- CHANGELOG entries: "## [1.2.0] - 2025-10-28"

**Update when:** Making significant changes to a doc (not for typos)

---

### Code Style

**TypeScript:**
- Use strict type checking
- No `: any` types in public methods
- Proper interfaces for all API responses
- JSDoc for all public methods
- Descriptive variable names

**Documentation:**
- Markdown with proper formatting
- Code blocks have language tags
- Links use relative paths for internal docs
- Examples are complete and runnable

---

## 🎯 EXAMPLES: GOOD VS BAD

### Example 1: API Route Comment

**❌ UNPROFESSIONAL:**
```typescript
export async function GET() {
  // ENV_SETUP - CP2: Get domain config for network filtering
  const config = await getDomainConfig();

  // MARKETPLACE_IDENTITY - CP1: Join with users
  let query = supabase.from("agents").select(`*, owner:users!owner_id(...)`);
}
```

**✅ PROFESSIONAL:**
```typescript
export async function GET() {
  // Get domain configuration for network-based filtering
  // Determines which network (mainnet/devnet) to query based on hostname
  const config = await getDomainConfig();

  // Join with users table to include owner profile information
  // Returns display name, avatar, verified badge, studio, and bio
  let query = supabase.from("agents").select(`*, owner:users!owner_id(...)`);
}
```

---

### Example 2: SDK Method

**❌ UNPROFESSIONAL:**
```typescript
/**
 * Get agent (SDK3 - no connection needed!)
 */
async getAgent(agentId: string): Promise<Agent> {
  const result: any = await response.json();
  throw new Error("Not found"); // Bad error
}
```

**✅ PROFESSIONAL:**
```typescript
/**
 * Get agent details by ID
 *
 * @param agentId - Agent UUID
 * @returns Full agent details including schemas
 *
 * @example
 * ```typescript
 * const agent = await tetto.getAgent('agent-uuid');
 * console.log(agent.name);
 * ```
 */
async getAgent(agentId: string): Promise<Agent> {
  this._validateUUID(agentId, 'agent ID');

  const result = await response.json() as AgentResponse;

  if (!result.ok) {
    throw new Error(
      result.error || `Agent not found: ${agentId}\n\n` +
      `This agent may not exist or has been removed.\n` +
      `Browse available agents: ${this.apiUrl}/agents`
    );
  }

  return result.agent;
}
```

---

### Example 3: Documentation

**❌ UNPROFESSIONAL:**
```markdown
# SDK3 Quickstart

This guide shows the new SDK3 features added in CP0-CP3.

## Setup (SDK3)

SDK3 doesn't need connection! (TETTO3 improvement)

**Version:** 0.1.0
**Last Updated:** 2025-10-18
```

**✅ PROFESSIONAL:**
```markdown
# Quickstart Guide

> Build your first Tetto agent in 5 minutes

This guide shows how to call agents and build agents on Tetto.

## Setup

No RPC connection needed - platform handles transaction submission.

**Version:** 1.2.0
**Last Updated:** 2025-10-28
```

---

## 🚨 ENFORCEMENT

### Review Process

**All PRs touching SDK/docs must:**
1. Pass automated marker scan (CI check)
2. Pass version consistency check
3. Pass build/compile check
4. Get code review from maintainer
5. Verify no internal markers introduced

**CI Check (Future):**
```bash
# In GitHub Actions:
name: Documentation Quality
on: [pull_request]
jobs:
  scan-markers:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Scan for internal markers
        run: |
          if grep -r "CP[0-9]\|SDK3\|TETTO[0-9]\|ENV_SETUP" src/ docs/ examples/ README.md; then
            echo "❌ Found internal markers in public code!"
            exit 1
          fi
```

---

## 💬 FOR THE TEAM

### Why This Matters

**Scenario 1: Second Studio Evaluating Tetto**

They read the SDK docs and see:
```typescript
// ENV_SETUP - CP2: Get domain config
```

**They think:**
- "What's ENV_SETUP?"
- "What's CP2?"
- "Is there documentation I'm missing?"
- "This looks like internal development code"
- "Maybe Tetto isn't production-ready"

**Result:** They choose a different platform.

---

**Scenario 2: Second Studio Evaluating Tetto**

They read the SDK docs and see:
```typescript
// Get domain configuration for environment detection
// Determines which network (mainnet/devnet) to query based on hostname
```

**They think:**
- "Clear explanation"
- "Professional code"
- "Well-documented"
- "These developers care about quality"

**Result:** They choose Tetto!

---

### The Bottom Line

**Every comment, every example, every doc is a marketing opportunity.**

Professional, clean, well-documented code = Trust = Customers = Revenue

Sloppy, internal-marker-filled code = Confusion = Lost customers

**We spent 35 hours polishing this SDK. Let's keep it polished.**

---

## 📖 QUICK REFERENCE

### When Changing SDK/Docs, Remember:

1. ✅ **No internal markers** (CP#, project names, architecture versions)
2. ✅ **Explain WHAT/WHY**, not WHEN
3. ✅ **Professional comments** (audience: external developers)
4. ✅ **Helpful error messages** (tell user how to fix)
5. ✅ **Version consistency** (same version everywhere)
6. ✅ **Working examples** (test before committing)
7. ✅ **Four questions** (confuse? who for? consistency? mistakes?)
8. ✅ **Fix mistakes** (don't accumulate technical debt)

---

## 🎯 THE GOAL

**When external developers read our SDK:**

"This is the most professional, well-documented SDK I've ever used. These developers really care about quality. I trust this platform with my business."

**That's the bar. That's what we maintain.**

---

**This manifesto is mandatory reading for all developers working on Tetto SDK and documentation.**

**Questions?** Ask before making changes. Quality is non-negotiable.

---

**Maintained by:** Tetto Team
**Last Updated:** 2025-10-28
**Status:** ACTIVE - Enforce on all PRs

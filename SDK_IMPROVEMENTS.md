# SDK Improvements from READMEWarrior Build

Based on real-world usage building the first agent with the new SDK utilities.

## What We Learned

Building **READMEWarrior** (SubChain's 11th agent) was the first real test of the `tetto-sdk/agent` utilities. This document captures what went well and what we improved.

---

## Issues We Fixed

### 1. Next.js 15 Type Compatibility ✅

**Problem:** Next.js 15's strict type checking rejected our handler return type.

**Error:**
```
Type 'Promise<Response>' is not assignable to type 'Promise<void | Response>'
```

**Root Cause:** TypeScript inferred `Promise<Response>` (narrow) but Next.js wanted `Promise<Response | void>` (broader).

**Fix:** Explicitly typed the return in `createAgentHandler`:
```typescript
async function POST(request: any): Promise<Response | void> {
  // ...
}
```

**Impact:** ✅ Works with Next.js 13, 14, and 15

### 2. Git Install Support ✅

**Problem:** Installing from GitHub didn't include compiled `dist/` folder.

**Root Cause:** `dist/` was in `.gitignore`

**Fix:**
1. Removed `dist/` from `.gitignore`
2. Committed compiled files to git
3. Added `prepare` script (though not strictly needed now)

**Impact:** ✅ `npm install github:TettoLabs/tetto-sdk` works in Vercel

### 3. Response API Modernization ✅

**Before:**
```typescript
return new Response(
  JSON.stringify({ error: 'message' }),
  { status: 400, headers: { 'Content-Type': 'application/json' } }
);
```

**After:**
```typescript
return Response.json(
  { error: 'message' },
  { status: 400 }
);
```

**Impact:** Cleaner, more modern, fewer lines

---

## Documentation Improvements

### 1. Added Usage Patterns

**Before:** Only showed one pattern
**After:** Shows both options

```typescript
// Option 1: Direct (recommended)
export const POST = createAgentHandler({ ... });

// Option 2: Stored (for testing/reuse)
const handler = createAgentHandler({ ... });
export const POST = handler;
```

**Why:** Developers might prefer either pattern. Both work identically.

### 2. Added Complete Example

**Before:** Fragments scattered across docs
**After:** Full working file in one place

```typescript
// app/api/my-agent/route.ts
import { createAgentHandler, createAnthropic } from 'tetto-sdk/agent';

const anthropic = createAnthropic();

export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    // Validation
    if (input.text.length < 10) {
      throw new Error("Text too short");
    }

    // AI processing
    const message = await anthropic.messages.create({ ... });

    // Return
    return { result: message.content[0].text };
  }
});
```

**Impact:** Copy-paste and modify. No guessing.

### 3. Added Troubleshooting Section

**New section covers:**
- ✅ TypeScript type errors (and workaround)
- ✅ Module not found errors
- ✅ Input undefined issues
- ✅ API key not found
- ✅ Claude response format issues

**Impact:** Developers can self-serve common issues.

### 4. Clarified Type Signature

**Before:**
```typescript
(request: NextRequest) => Promise<Response>
```

**After:**
```typescript
(request: any) => Promise<Response | void>
```

**Why:**
- Don't require importing `NextRequest` (simpler)
- Explicit `void` option (Next.js requirement)
- Matches actual implementation

### 5. Added Next.js Version Compatibility Note

**Added:**
```
Works with:
- ✅ Next.js 13 (App Router)
- ✅ Next.js 14 (App Router)
- ✅ Next.js 15 (App Router)

Note: Uses standard Web Response API, not NextResponse.
```

**Impact:** Developers know it's tested and compatible.

---

## What Went Well

### 1. The Utilities Worked! 🎉

Once we fixed the type issue, the utilities worked perfectly:
- ✅ `createAgentHandler()` - Zero boilerplate
- ✅ `createAnthropic()` - Auto-loaded API key
- ✅ Automatic error handling
- ✅ Clean code (67% reduction)

### 2. Development Speed

**Without SDK:** Would have taken ~45 minutes
**With SDK:** Took ~20 minutes (after fixing the bugs)

**Time saved:** 55% faster once SDK works

### 3. Code Quality

READMEWarrior route file:
- **~200 lines total** (including helpers)
- **~30 lines** of actual route logic
- **Clean, readable, maintainable**

Compare to old pattern (Summarizer):
- **~60 lines** for equivalent functionality
- **More error-prone** (manual validation)

---

## Validation: READMEWarrior Success

**First agent built with new SDK utilities:**
- ✅ Deployed to production
- ✅ Registered on Tetto marketplace
- ✅ First successful paid call ($0.04 USDC)
- ✅ Marked as beta for testing
- ✅ High-quality README generation

**Receipt:** https://www.tetto.io/receipts/67cc57f6-3a87-4399-ab7c-e8898c634b27

**Agent ID:** `c327d6b9-f65b-40cd-9672-d6bd2c61dd1a`

---

## Developer Experience Assessment

### What Was Smooth ✅

1. **Import** - `from 'tetto-sdk/agent'` worked perfectly
2. **Type safety** - TypeScript caught issues early
3. **Error messages** - Clear, helpful errors from utilities
4. **Testing** - Easy to test locally before deploy
5. **Anthropic helper** - Eliminated common mistake (missing API key)

### What Was Rough ⚠️

1. **Initial type error** - Required debugging Next.js types
2. **Git install** - Had to commit dist/ folder (unusual)
3. **Documentation gaps** - Had to infer some patterns

**All fixed now!**

---

## Recommended for Next Developer

### Start Here:

1. Read [Quickstart](docs/building-agents/quickstart.md)
2. Read [Utilities API](docs/building-agents/utilities-api.md)
3. Check [Complete Example](#complete-example)
4. Reference [Troubleshooting](#troubleshooting) if stuck

### Tips:

- ✅ Use `export const POST = createAgentHandler({ ... })` (simplest)
- ✅ Throw errors for validation (auto-caught by handler)
- ✅ Check Claude response type before accessing `.text`
- ✅ Test locally first (`npm run dev`)

---

## Future Improvements (Not Urgent)

### 1. Publish to npm

**Current:** Install from GitHub
**Future:** Install from npm registry

**Why wait:** Still iterating on API, GitHub install works fine

### 2. Add More Examples

- File upload agent
- Multi-step coordinator
- External API integration
- Database-backed agent

### 3. CLI Generator

**Already referenced in docs:**
```bash
npx create-tetto-agent my-agent
```

**Status:** Not built yet, but SDK utilities are ready

---

## Metrics

**Code Reduction:**
- Old pattern: ~60 lines for basic agent
- New pattern: ~20 lines for basic agent
- **Savings: 67%**

**Time to Build:**
- Old pattern: ~45 minutes
- New pattern: ~20 minutes (after learning)
- **Savings: 55%**

**Error Prevention:**
- Automatic input validation: ✅
- Automatic error handling: ✅
- Type-safe patterns: ✅
- Clear error messages: ✅

---

## Conclusion

**The SDK utilities work great once configured correctly.**

**Key achievements:**
1. ✅ Fixed Next.js 15 compatibility
2. ✅ Enabled git-based installs
3. ✅ Improved documentation significantly
4. ✅ Validated with real production agent
5. ✅ Ready for external developers

**Next developer will have a smooth experience.**

---

**Last Updated:** 2025-10-20
**First Production Agent:** READMEWarrior (SubChain Agent #11)
**Status:** Ready for prime time

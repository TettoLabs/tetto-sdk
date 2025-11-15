# Bounty Developer Guide

Earn USDC building custom AI agents. Get paid when clients approve your work.

---

## Quick Start

**Time: 30 minutes to first payment**

1. **Browse bounties** at [tetto.io/bounties](https://tetto.io/bounties)
2. **Claim one** you can deliver (connect wallet)
3. **Build the agent** matching requirements
4. **Submit for review** with endpoint URL
5. **Get paid** when approved (90% of bounty to you)

---

## Finding Bounties

### Browse Active Bounties

[tetto.io/bounties](https://tetto.io/bounties) - All open bounties

**Filter by:**
- **Status:** Open (claimable)
- **Amount:** High to low
- **Posted:** Newest first

### What to Look For

**Good Bounties:**
✅ Clear, specific requirements
✅ Example inputs/outputs provided
✅ Fair price for scope (see pricing below)
✅ Requester has approved past bounties

**Red Flags:**
❌ Vague requirements ("build something cool")
❌ Unrealistic scope for amount ($5 for ML pipeline)
❌ No examples or test cases
❌ Contradictory requirements

### Pricing Reality Check

**Your time is worth $50-100/hour.** Estimate hours, multiply, compare to bounty.

| Bounty | Hours | Hourly | Worth It? |
|--------|-------|--------|-----------|
| $20 bounty, 1 hour work | 1 | $20/hr | ✅ Quick win |
| $50 bounty, 2 hour work | 2 | $25/hr | ✅ Acceptable |
| $100 bounty, 4 hour work | 4 | $25/hr | ✅ Decent |
| $20 bounty, 4 hour work | 4 | $5/hr | ❌ Skip it |

Remember: You get **90%** of bounty. ($50 bounty = $45 to you)

---

## Claiming a Bounty

### Before Claiming

**Ask yourself:**
- Can I build this in the estimated time?
- Do I understand all requirements?
- Do I have necessary API keys/tools?
- Is the timeline realistic?

**Requirements unclear?** Post question in bounty comments (coming soon) or skip it.

### Claim Process

1. **Connect wallet** (Phantom/Solflare)
2. **Click "Claim This Bounty"**
3. **Write claim message:**

**Bad claim:**
❌ "I can do this"
❌ "Experienced developer here"

**Good claim:**
✅ "I've built 5+ sentiment analysis agents using Claude. Will deliver in 3 days with batch processing support."
✅ "Senior ML engineer, 10 years NLP. Plan to use Hugging Face transformers with custom fine-tuning. ETA: 5 days."

4. **Set estimated delivery** (1-30 days)
   - Be realistic
   - Requester sees this
   - Builds trust

### After Claiming

**You commit to:**
- Building the agent as specified
- Delivering by estimated date
- Responding to feedback
- Revising if needed

**You cannot:**
- Claim multiple bounties simultaneously (focus = quality)
- Cancel after claiming (funds locked)
- Transfer claim to someone else

---

## Building the Agent

### Technical Requirements

**Your agent must:**
1. Accept input in specified format (usually JSON)
2. Return output in specified format
3. Be deployed at public HTTPS endpoint
4. Respond within 10-20 seconds
5. Handle edge cases (empty input, errors)

### Recommended Stack

**AI Model:**
- [Claude 3.5 Sonnet](https://anthropic.com) (best price/performance)
- OpenAI GPT-4 (good for structured output)
- Open source via Replicate/Together

**Deployment:**
- [Vercel](https://vercel.com) (recommended - free tier works)
- Railway
- Render
- Any service with HTTPS endpoints

**Framework:**
- Next.js API routes (TypeScript)
- Express.js (Node)
- FastAPI (Python)

### Example: Sentiment Analysis Agent

**Bounty requirements:**
- Input: `{ "text": string }`
- Output: `{ "sentiment": "positive"|"negative"|"neutral", "confidence": number }`

**Implementation (Next.js):**

```typescript
// app/api/sentiment/route.ts

import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    // Validate input
    if (!text || typeof text !== 'string') {
      return Response.json(
        { error: 'Missing or invalid text field' },
        { status: 400 }
      );
    }

    // Call Claude
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Analyze the sentiment of this text and respond with ONLY a JSON object in this exact format: {"sentiment": "positive"|"negative"|"neutral", "confidence": 0.0-1.0}

Text: ${text}`
      }],
    });

    // Parse Claude's response
    const content = message.content[0].text;
    const result = JSON.parse(content);

    // Validate output format
    if (!result.sentiment || !result.confidence) {
      throw new Error('Invalid response format');
    }

    return Response.json(result);

  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return Response.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
```

**Deploy:**
```bash
npm install @anthropic-ai/sdk
vercel login
vercel deploy --prod
```

**Add environment variable in Vercel:**
- Name: `ANTHROPIC_API_KEY`
- Value: Your API key

**Your endpoint:** `https://your-project.vercel.app/api/sentiment`

### Testing Before Submission

**Test with bounty examples:**
```bash
curl -X POST https://your-project.vercel.app/api/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "This product is amazing!"}'
```

**Expected response:**
```json
{
  "sentiment": "positive",
  "confidence": 0.95
}
```

**Test edge cases:**
- Empty string: `{"text": ""}`
- Special characters: `{"text": "Test @#$%"}`
- Long text: 1000+ characters
- Invalid input: `{"nottext": "value"}`

**Performance check:**
- Response time < 10 seconds consistently
- No 500 errors under normal use
- Handles 10+ concurrent requests

---

## Submitting Your Agent

### Submission Checklist

Before clicking submit:

- ✅ Tested with all bounty example inputs
- ✅ Output format exactly matches requirements
- ✅ Endpoint is HTTPS and publicly accessible
- ✅ Response time < 20 seconds
- ✅ Error handling works
- ✅ No console.log/debug code in production

### Submit for Review

**On bounty page, click "Submit Agent"**

**Agent Endpoint URL:**
```
https://your-project.vercel.app/api/sentiment
```

**Submission Notes** (20-1000 characters):

**Bad notes:**
❌ "Done, please check"
❌ "Built as requested"

**Good notes:**
✅ "Sentiment analysis agent using Claude 3.5 Sonnet. Tested with all provided examples. Handles English text up to 10K characters. Response time: 2-5 seconds. Error handling for invalid inputs included. Test with: curl -X POST [url] -H 'Content-Type: application/json' -d '{\"text\":\"test\"}'"

**Include:**
- What you built
- Tech stack used
- How to test it (exact curl command)
- Performance characteristics
- Known limitations (if any)

**Test Input** (optional but recommended):
```json
{
  "text": "Great product, fast shipping!"
}
```

Shows you tested it yourself. Gives requester an easy test case.

### After Submission

**Requester will:**
1. Test your endpoint (usually within 24 hours)
2. Either approve or request changes

**Be available:**
- Check email/dashboard daily
- Respond to feedback within 24 hours
- Professional communication always

---

## Getting Paid

### Approval Process

When requester approves:

1. **Escrow releases automatically**
2. **You receive 90%** of bounty ($45 on $50 bounty)
3. **Tetto receives 10%** ($5 on $50 bounty)
4. **Transaction recorded** on Solana blockchain

**Example payment:**
- Bounty: $100 USDC
- You receive: $90 USDC
- Tetto fee: $10 USDC
- [View transaction](https://explorer.solana.com/tx/2roLC3GWgdNYTPbqNHW6pxh6rwLFYiuTYWuhVUKJS6NW2gsk5ZyyAi3DidJbiM9ZgSjrLkyQtaTpmxdBt12yWspj)

**Payment instant:** No waiting periods, no withdrawals. USDC hits your wallet immediately.

### Track Your Earnings

**Dashboard:** [tetto.io/dashboard/bounties/claims](https://tetto.io/dashboard/bounties/claims)

See:
- Total earned
- Active claims
- Completed bounties
- On-chain proof for each payment

---

## Handling Revisions

### If Requester Requests Changes

**Stay professional.** Feedback is normal. Most bounties need 1-2 revisions.

### Good Revision Process

1. **Read feedback carefully** - What exactly needs fixing?
2. **Ask clarifying questions** if feedback is vague
3. **Fix the issues** completely
4. **Test thoroughly** before resubmitting
5. **Explain changes** in new submission notes

**Example feedback:**
> "Returns 500 error on empty text. Confidence scores too low."

**Your revision:**
```typescript
// Add validation
if (!text || text.trim() === '') {
  return Response.json(
    { error: 'Text cannot be empty' },
    { status: 400 }
  );
}

// Adjust confidence threshold
const adjustedConfidence = Math.min(result.confidence * 1.2, 1.0);
```

**Resubmit with notes:**
> "Fixed: 1) Added empty text validation (returns 400 error with message), 2) Increased confidence scores by 20% to meet accuracy expectations. Retested all examples - working correctly now."

### Revision Limits

- **Up to 5 revisions** per bounty
- **No additional payment** for revisions (part of original bounty)
- **After 5 rejections:** Support mediation

**Pro tip:** Get it right the first time. Read requirements 3x before building.

---

## Best Practices

### Before Claiming

**Research the requester:**
- Have they approved past bounties?
- Do they provide clear feedback?
- Are they responsive?

**Estimate accurately:**
- 2x your initial time estimate (always takes longer)
- Account for revisions
- Include testing time

**Have the tools:**
- API keys ready
- Deployment account set up
- Testing environment configured

### While Building

**Communicate proactively:**
- Post updates if you'll be late
- Ask questions early if confused
- Show progress if requester asks

**Match requirements exactly:**
- Don't add extra features (scope creep)
- Don't skip edge cases
- Format output precisely as requested

**Code quality matters:**
- Clean, readable code
- Proper error handling
- Comments for complex logic
- No debug logs in production

### When Submitting

**Make testing easy:**
- Provide curl command
- Include example inputs
- Document any setup needed
- Explain how it works

**Be honest about limitations:**
- "Supports English only" (if true)
- "Optimized for texts < 5000 chars"
- "Requires 5-10 seconds for complex inputs"

**Respond quickly:**
- Check dashboard daily
- Reply to feedback within 24 hours
- Fast revisions = happy requesters = tips

---

## Advanced Tips

### Maximize Earnings

**Claim selectively:**
- 1 great bounty > 3 mediocre ones
- Focus on your strengths
- Build reputation with quality

**Speed matters:**
- Fast, quality delivery = more claims
- Requesters remember good developers
- Reputation unlocks higher bounties

**Document well:**
- Clear submission notes = fewer revisions
- Good revisions = future claims
- Professional communication = repeat customers

### Build Reusable Components

**Create templates:**
```typescript
// Reusable API wrapper
export async function buildAgent(
  systemPrompt: string,
  inputSchema: any,
  outputSchema: any
) {
  // Your abstraction here
}
```

**Common patterns:**
- Input validation
- Error handling
- Claude API calls
- Response formatting

**Reduce build time:**
- First bounty: 4 hours
- Using templates: 1 hour
- More hourly earnings

### Scale Up

**After 5+ completed bounties:**
- Claim higher-value bounties ($200-500)
- Specialize in a niche (NLP, image processing)
- Build reputation as "the X agent expert"
- Requesters seek you out

**After 20+ completed bounties:**
- Qualify for "Verified Developer" badge (coming soon)
- Get early access to premium bounties
- Negotiate custom rates for complex work
- Build an AI agent development business

---

## Troubleshooting

### "Can't claim - already have active claim"

You can only claim one bounty at a time. Complete or abandon your current claim first.

### "Requester not responding to submission"

- Wait 48 hours
- Send follow-up message
- After 7 days, contact support@tetto.io

### "Rejected but feedback is vague"

- Request specific feedback via bounty comments
- If no clarification after 48 hours, contact support
- Document all communication attempts

### "Agent works locally but fails in production"

Common issues:
- Missing environment variables in Vercel
- CORS headers not set
- Timeout limits too short
- Cold start delays

**Check:**
```bash
# Test production endpoint
curl -v https://your-agent.vercel.app/api/endpoint

# Check Vercel logs
vercel logs
```

### "Requester testing wrong endpoint"

- Double-check URL in submission notes
- Provide exact curl command
- Test the exact URL you submitted
- Send screenshot of working test

---

## FAQ

**Q: How many bounties can I claim?**

A: One at a time. Ensures focus and quality.

**Q: Can I cancel a claim?**

A: No. Funds are locked when you claim. Deliver or lose reputation.

**Q: What if I can't deliver?**

A: Communicate ASAP. Offer to help find another developer. Repeated failures = blacklist.

**Q: Do I own the code?**

A: Yes, unless bounty specifies otherwise. You grant usage rights to requester.

**Q: Can I reuse code across bounties?**

A: Yes. Templates and abstractions are yours to reuse.

**Q: What about ongoing support?**

A: Bounty covers initial delivery + revisions. Ongoing support = separate agreement.

**Q: Can I register the agent on Tetto marketplace?**

A: Yes. Earn additional revenue from marketplace usage. Optional.

**Q: How do taxes work?**

A: You're an independent contractor. Track earnings, pay taxes in your jurisdiction. Tetto doesn't withhold.

**Q: Can I charge more for rush jobs?**

A: Not through bounties. Requester sets price. Negotiate custom work via Discord/email.

**Q: What if requester steals my code without approving?**

A: Don't submit full code - only deployed endpoint. Code stays on your server. Support mediates disputes.

---

## Support

**Questions:** support@tetto.io

**Disputes:** support@tetto.io with bounty ID and communication history

**Community:** [Discord](https://discord.gg/tetto) - #bounty-devs channel

**User Guide:** [USER_GUIDE.md](./USER_GUIDE.md)

**API Docs:** [API_REFERENCE.md](./API_REFERENCE.md)

---

**Ready to earn your first $50?** [Browse bounties →](https://tetto.io/bounties)

# Bounty User Guide

Get custom AI agents built for you. Pay only when satisfied.

---

## Quick Start

**Time: 5 minutes**

1. **Connect wallet** at [tetto.io/bounties/new](https://tetto.io/bounties/new)
2. **Describe your agent** (what it does, input/output format)
3. **Set bounty** ($5-$1000 USDC) and post

Your USDC moves to escrow. A developer claims, builds, and submits. You test and approve. Payment releases automatically (90% to developer, 10% to Tetto).

---

## Posting Your First Bounty

### 1. Prepare Your Wallet

**Requirements:**
- Solana wallet (Phantom or Solflare)
- USDC for bounty amount
- ~0.001 SOL for transaction fees

**Get USDC:**
- Buy on Coinbase/Binance, withdraw to Solana
- Use Phantom's built-in buy feature
- Bridge from Ethereum via [Portal Bridge](https://portalbridge.com)

### 2. Describe What You Need

**Title** (10-100 characters)
```
❌ "I need an agent"
✅ "Sentiment analysis agent for product reviews"
```

**Description** (50-2000 characters)

Include:
- **What problem it solves** - "Analyze customer reviews to identify sentiment"
- **Input format** - "JSON with text field"
- **Output format** - "JSON with sentiment (positive/negative/neutral) and confidence score"
- **Use case** - "Process 100+ daily reviews for my SaaS dashboard"

**Example:**
```
Build an agent that analyzes product review sentiment.

Input: { "text": "This product is amazing!", "language": "en" }
Output: { "sentiment": "positive", "confidence": 0.95 }

Must handle English reviews, return results in < 10 seconds, support batch processing.
```

### 3. Provide Test Examples

**Example Input:**
```json
{
  "text": "Great product, fast shipping!",
  "language": "en"
}
```

**Expected Output:**
```json
{
  "sentiment": "positive",
  "confidence": 0.92
}
```

These help developers understand your needs and give you test cases for approval.

### 4. Set Your Bounty Amount

**Pricing Guide:**

| Complexity | Amount | Examples |
|------------|--------|----------|
| **Simple** | $5-$20 | Text formatting, basic API calls, simple transformations |
| **Standard** | $20-$100 | Sentiment analysis, data extraction, single-model inference |
| **Complex** | $100-$500 | Multi-step workflows, custom training, complex logic |
| **Advanced** | $500-$1000 | Coordinator patterns, ML pipelines, production-grade systems |

**Pricing Tips:**
- Check similar completed bounties for reference
- Higher amounts attract experienced developers
- Include complexity in description to justify amount
- Can't change amount after posting

### 5. Post and Pay Escrow

Click **"Post Bounty & Pay Escrow"**

**What Happens:**
1. Wallet prompts for USDC transfer to escrow
2. You approve transaction (~$0.001 SOL fee)
3. Bounty goes live immediately
4. Developers can view and claim

**Escrow Address:** `D88wCSHbgkYsN9Q3w4U9B3dXwfJaNBeXUbV7LTVufxui`

Your funds are held securely until you approve the completed agent.

---

## After Posting

### Track Your Bounty

**Dashboard:** [tetto.io/dashboard/bounties](https://tetto.io/dashboard/bounties)

**Statuses:**

🟢 **Open** - Waiting for developer
- Visible to all developers
- Can cancel and refund if unclaimed

🔵 **Claimed** - Developer building
- See who claimed and their estimated delivery
- Cannot cancel (funds committed)
- Monitor progress

🟣 **Submitted** - Ready for review
- Test the agent endpoint
- Approve or request changes

⚪ **Completed** - Paid and done
- View transaction on Solana Explorer
- Agent is yours to use

---

## Reviewing Submissions

### When Notified

A developer submitted their agent. Time to test.

### Testing Checklist

**Access the endpoint:**
```bash
curl -X POST https://agent-url.vercel.app/api/agent \
  -H "Content-Type: application/json" \
  -d '{"text": "Test review here"}'
```

**Verify:**
- ✅ Accepts your input format?
- ✅ Returns expected output format?
- ✅ Handles edge cases (empty input, special characters)?
- ✅ Response time < 20 seconds?
- ✅ Results match requirements?

### Approve ✅

If satisfied:

1. Click **"Approve & Pay"**
2. Confirm payment release
3. Payment automatically splits:
   - **90%** to developer ($45 on $50 bounty)
   - **10%** to Tetto ($5 on $50 bounty)
4. Transaction records on blockchain

**Example transaction:** [View on Explorer](https://explorer.solana.com/tx/2roLC3GWgdNYTPbqNHW6pxh6rwLFYiuTYWuhVUKJS6NW2gsk5ZyyAi3DidJbiM9ZgSjrLkyQtaTpmxdBt12yWspj)

### Request Changes 🔄

If not satisfied:

1. Click **"Request Changes"**
2. Provide specific, actionable feedback:

**Bad feedback:**
❌ "Doesn't work"
❌ "Not what I wanted"

**Good feedback:**
✅ "Returns 500 error on empty text input. Please add error handling."
✅ "Confidence scores are too low. Please adjust threshold to 0.8+."
✅ "Response time is 30s. Please optimize to < 10s."

Developer can revise and resubmit. Funds stay in escrow.

---

## FAQ

**Q: Is my USDC safe?**

A: Yes. Held in Tetto's escrow wallet (same security model as agent payments). Only releases when you approve. View escrow wallet: [Solana Explorer](https://explorer.solana.com/address/D88wCSHbgkYsN9Q3w4U9B3dXwfJaNBeXUbV7LTVufxui)

**Q: What if no one claims my bounty?**

A: Increase the amount, improve the description, or share on Discord/Twitter. If unclaimed after 30 days, contact support for refund.

**Q: Can I cancel after posting?**

A: Only if unclaimed. Once claimed, funds are committed to that developer.

**Q: What if developer never delivers?**

A: Funds stay in escrow indefinitely until approval. After 30 days, contact support@tetto.io for mediation.

**Q: Can I post multiple bounties?**

A: Yes, unlimited bounties. Each held in separate escrow.

**Q: Who owns the agent code?**

A: Discuss ownership with developer. By default, they retain code rights but grant you usage rights. Include ownership requirements in description if needed.

**Q: Can I edit my bounty?**

A: No. Bounties are immutable after posting to prevent disputes. Cancel and repost if unclaimed.

**Q: What if I reject the submission?**

A: Developer can revise and resubmit up to 5 times. After 5 rejections, contact support for mediation.

**Q: How long until someone claims?**

A: Typically 1-24 hours for fair-priced bounties. Higher amounts and clear descriptions get claimed faster.

**Q: Can I tip extra for great work?**

A: Yes! Send directly to developer's wallet address (shown on bounty page).

---

## Best Practices

### Writing Great Bounties

**Be Specific**
- ❌ "Build me an AI agent"
- ✅ "Build sentiment analysis agent for English product reviews with batch processing support"

**Include Examples**
- Provide 3-5 example inputs with expected outputs
- Cover edge cases (empty, special chars, long text)

**Set Fair Prices**
- Research similar bounties
- Consider developer time (hours × $50-100/hr)
- Higher = faster, better quality

**Respond Quickly**
- Test submissions within 24 hours
- Provide feedback same-day
- Good requesters get priority from developers

### Maximizing Success

1. **Clear requirements** - Less ambiguity = fewer revisions
2. **Fair pricing** - Competitive bounties get claimed fast
3. **Responsive communication** - Quick feedback keeps momentum
4. **Detailed feedback** - Specific notes speed up revisions
5. **Reputation** - Good requesters attract better developers

---

## Support

**Questions?** support@tetto.io

**Disputes?** Support mediation available after good-faith revision attempts

**Community:** [Discord](https://discord.gg/tetto)

**Developer Guide:** See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)

**API Docs:** See [API_REFERENCE.md](./API_REFERENCE.md)

---

**Ready to post your first bounty?** [Get started →](https://tetto.io/bounties/new)

# Getting Verified on Tetto

> Earn the blue checkmark badge (✓) that builds trust with customers

**What You'll Learn:**
- [What Verification Means](#what-verification-means)
- [Why It Matters](#why-it-matters)
- [The Four Criteria (Detailed)](#the-four-criteria)
- [Checking Your Eligibility](#checking-your-eligibility)
- [Timeline & Process](#timeline--process)
- [Maintaining Verification](#maintaining-verification)
- [FAQ](#faq)

---

## What Verification Means

### The Blue Checkmark

The verified badge (✓) is a **trust signal** shown next to your studio name throughout Tetto.

**Where it appears:**
- On all your agent cards: "by SubChain.ai ✓"
- Your studio page header
- Studio directory listings
- Marketplace search results
- Anywhere your name is displayed

**What it signals:**
- You're a legitimate, active developer
- You have a proven track record
- You maintain high quality standards
- You're committed to customer success
- Customers can trust your agents

### How Verification Works

**Automatic, Merit-Based System:**
- No manual review process
- No application to submit
- No payment required
- Purely based on meeting criteria
- System checks daily
- Badge appears automatically when eligible

**Not a Paid Feature:**
Verification is earned, not bought. It proves your value through:
- Agent quality (success rate)
- Customer trust (successful calls)
- Business viability (revenue)
- Professional presence (complete profile)
- Commitment (account age)

---

## Why It Matters

### Statistical Impact

**Verified developers see measurably better results:**

**Conversion Rates:**
- Unverified: 2-3% of visitors call agents
- Verified: 6-9% of visitors call agents
- **3x improvement**

**Customer Behavior:**
- 2x more repeat customers
- Higher average transaction value
- More likely to try multiple agents
- More forgiving of occasional failures

**Marketplace Benefits:**
- Featured placement in search
- "Verified Studios" filter inclusion
- Higher click-through rates
- Better SEO rankings

### Trust Economics

**Why Customers Prefer Verified Studios:**

1. **Risk Reduction**
   - Proven track record visible
   - Other customers have used successfully
   - Higher success rates
   - Professional support available

2. **Quality Signal**
   - Verification = quality bar met
   - Maintained over time
   - Not just new/untested agents
   - Serious developer (not hobbyist)

3. **Accountability**
   - Real studio identity (not anonymous)
   - Support email available
   - Social presence (can be contacted)
   - Reputation at stake

**Bottom Line:** Verified badge = more revenue, faster growth, better reputation.

---

## The Four Criteria

You must meet **ALL four criteria** to get verified. Let's break down each one:

### 1. Track Record

**Requirements:**
- ✅ 25+ successful agent calls
- ✅ 95%+ success rate (across all agents)
- ✅ 3+ active agents

#### Why These Numbers?

**25+ Successful Calls:**
- Proves your agents provide value
- Shows customers are willing to pay
- Demonstrates agents work in production
- Filters out untested/new agents

**How to get there:**
- Deploy quality agents (test thoroughly)
- Market your agents (Twitter, Discord, website)
- Price appropriately (too high = no calls)
- Optimize for conversion (good descriptions, examples)

**95%+ Success Rate:**
- Proves reliability
- Shows quality engineering
- Indicates proper error handling
- Builds customer trust

**How success rate is calculated:**
```
Success Rate = (Successful Calls / Total Calls) * 100

Example:
- 127 successful calls
- 5 failed calls
- 132 total calls
- Success Rate = (127 / 132) * 100 = 96.2% ✅
```

**What counts as failure:**
- Agent returns error
- Agent times out (>30 seconds)
- Agent returns invalid output schema
- HTTP 500 errors

**What doesn't count as failure:**
- Customer provides invalid input (their mistake)
- Agent correctly rejects bad input
- Agent returns error with proper error handling

**How to maintain 95%+:**
- Test extensively before deploying
- Handle errors gracefully
- Monitor agent health
- Fix issues quickly
- Use proper input validation

**3+ Active Agents:**
- Proves commitment (not just one-off)
- Shows diverse capabilities
- Reduces verification gaming
- Demonstrates serious developer

**What counts as "active":**
- Agent is deployed
- Agent is registered on Tetto
- Agent is not paused/disabled
- Agent has been called at least once

#### Checking Your Track Record

**Via Dashboard:**
Visit: https://www.tetto.io/dashboard/analytics

Shows:
- Total calls across all agents
- Current success rate
- Number of active agents
- Breakdown by agent

**Via API:**
```bash
curl "https://www.tetto.io/api/studios/eligibility" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response includes:
```json
{
  "details": {
    "calls": 127,
    "successRate": 0.962,
    "agents": 5
  }
}
```

---

### 2. Revenue

**Requirements:**
- ✅ $100+ total revenue earned **OR**
- ✅ $50+ revenue in last 30 days

#### Why Revenue Matters?

**Proves Commercial Viability:**
- Customers willing to pay for your agents
- Agents provide real value
- Sustainable business model
- Not just free/test agents

**Why $100 OR $50/30d?**
- $100 total: Achievable milestone for new studios
- $50/30d: Proves ongoing revenue (not one-time)
- Flexible: Either threshold works
- Realistic: ~10-50 agent calls depending on pricing

#### How Revenue is Calculated

**What counts:**
- USDC payments received
- SOL payments received (converted to USD)
- Both mainnet currencies

**What doesn't count:**
- Test transactions on devnet
- Refunded payments
- Failed transactions
- Your own test calls

**Revenue Breakdown:**
```
Agent Price: $0.10 per call
Your Cut: 90% = $0.09
Platform Fee: 10% = $0.01

10 calls = $0.90 revenue
111 calls = $10.00 revenue
1,112 calls = $100.08 revenue ✅
```

#### Strategies to Meet Revenue Threshold

**Pricing Strategy:**
- Start lower to get volume ($0.01-0.05)
- Increase after building reputation
- Balance: too low = slow revenue, too high = no calls

**Marketing:**
- Share on Twitter, Discord
- Add agents to your website
- Demo in videos/tutorials
- Explain use cases clearly

**Quality:**
- Better agents = more calls
- Good descriptions = higher conversion
- Example inputs = easier to try
- Fast response times = better UX

---

### 3. Complete Profile

**Requirements:**
- ✅ Avatar uploaded
- ✅ Bio 100+ characters
- ✅ At least one social link (GitHub OR Twitter OR Website)

#### Why Complete Profile?

**Trust & Legitimacy:**
- Proves you're a real person/studio
- Shows professional commitment
- Enables customers to research you
- Builds confidence

#### Avatar Requirements

**Technical:**
- Image URL (hosted somewhere)
- PNG or JPG format
- 400x400px minimum
- <500KB file size

**Quality:**
- Professional appearance
- Clear at small sizes
- Recognizable
- Consistent with brand

**Where to Host:**
- Your website
- GitHub (raw.githubusercontent.com)
- Image hosting (Imgur, Cloudinary)

#### Bio Requirements

**Minimum 100 Characters:**
- Forces meaningful description
- Can't just say "I build agents"
- Must explain value proposition
- Shows seriousness

**What to Include:**
- What you do (agent types)
- Your specialty/expertise
- Why customers should trust you
- Your commitment to quality

**Example (142 chars):**
```
SubChain is a platform for building AI agents on Solana.
We specialize in fast, reliable agents with on-chain verification
and instant USDC payments.
```

#### Social Link Requirements

**Need at least ONE of:**
- GitHub username
- Twitter username
- Website URL

**Why?**
- Proves legitimacy (can verify identity)
- Shows your work history (GitHub)
- Enables customers to follow you
- Builds trust through transparency

---

### 4. Account Age

**Requirement:**
- ✅ Account 14+ days old

#### Why 14 Days?

**Prevents Spam & Gaming:**
- Stops bulk account creation
- Prevents verification farming
- Ensures serious commitment
- Time for customers to try agents

**Gives Time To:**
- Deploy quality agents
- Build track record naturally
- Test and improve agents
- Get real customer feedback

**No Workarounds:**
- Account age is strict
- Countdown starts from account creation
- Cannot be accelerated
- Must wait full 14 days

#### Checking Account Age

**Via Dashboard:**
Profile page shows: "Account created: Oct 1, 2025"

**Via API:**
```bash
curl "https://www.tetto.io/api/studios/eligibility" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response includes:
```json
{
  "accountAge": 45
}
```

---

## Checking Your Eligibility

### Via API (Detailed)

**Endpoint:**
```
GET https://www.tetto.io/api/studios/eligibility
```

**Authentication:** Required (Bearer token from dashboard)

**Request:**
```bash
curl "https://www.tetto.io/api/studios/eligibility" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (Eligible):**
```json
{
  "ok": true,
  "eligible": true,
  "criteria": {
    "trackRecord": true,
    "revenue": true,
    "profile": true,
    "account": true
  },
  "missingRequirements": [],
  "details": {
    "calls": 127,
    "successRate": 0.984,
    "agents": 5,
    "revenue": 247.50,
    "revenueLastThirtyDays": 89.25,
    "accountAge": 45
  }
}
```

**Response (Not Eligible):**
```json
{
  "ok": true,
  "eligible": false,
  "criteria": {
    "trackRecord": false,
    "revenue": false,
    "profile": true,
    "account": true
  },
  "missingRequirements": [
    "Need 12 more successful calls (currently 13/25)",
    "Need $67.50 more revenue (currently $32.50/$100)",
    "Current success rate: 92.8% (need 95%+)"
  ],
  "details": {
    "calls": 13,
    "successRate": 0.928,
    "agents": 2,
    "revenue": 32.50,
    "accountAge": 8
  }
}
```

### Via Dashboard

**Visit:** https://www.tetto.io/dashboard/profile

**Shows:**
- Current eligibility status
- Progress toward each criterion
- Missing requirements
- Estimated time to verification

---

## Timeline & Process

### How Long Does It Take?

**Depends on your activity:**

**Fast Track (4-6 weeks):**
- Deploy 3 quality agents immediately
- Price reasonably ($0.02-0.10)
- Market actively (Twitter, Discord)
- Get 25-50 calls in first month
- Hit revenue threshold quickly
- Complete profile day 1
- Wait 14 days for account age

**Typical (2-3 months):**
- Deploy agents gradually
- Build reputation organically
- Let marketplace discovery work
- Accumulate calls steadily
- Meet criteria naturally

**Slow (6+ months):**
- Niche agents (low volume)
- High pricing (fewer calls)
- Minimal marketing
- Natural/organic growth

### The Verification Process

**Step-by-Step:**

1. **You meet all criteria**
   - Track record: 25+ calls, 95%+ success, 3+ agents ✅
   - Revenue: $100+ total OR $50+ in 30d ✅
   - Profile: Complete with avatar, bio, social link ✅
   - Account: 14+ days old ✅

2. **System checks daily**
   - Automated verification check runs every 24 hours
   - Checks all studios for eligibility
   - No manual review needed

3. **Badge appears automatically**
   - Verified badge (✓) added to profile
   - Shows on all agents immediately
   - Appears in marketplace
   - No notification (check your studio page)

4. **You're verified!**
   - Blue checkmark visible everywhere
   - Featured in "Verified Studios"
   - Higher marketplace placement
   - Enjoy the benefits!

### No Manual Review

**Why fully automated?**
- Scalable (works for 1,000+ studios)
- Fair (same criteria for everyone)
- Fast (no waiting for review)
- Transparent (clear requirements)

**Means:**
- No application to submit
- No human judgment
- No favoritism
- No exceptions

---

## Maintaining Verification

### Verification is Ongoing

**Not a one-time achievement:**
- System checks daily
- Must maintain criteria
- Can lose badge if drop below thresholds
- Can regain by meeting criteria again

### What Causes Loss of Verification?

**Metric Decline (30-day grace period):**
- Success rate drops below 95%
- Agents become inactive
- No revenue for extended period
- Account paused

**Policy Violations (immediate removal):**
- Fraudulent activity
- Fake calls/reviews
- Abusive behavior
- Terms of service violations

### How to Maintain Verification

**1. Keep Success Rate High:**
- Monitor agent health
- Fix bugs quickly
- Update when APIs change
- Deprecate broken agents

**2. Stay Active:**
- Keep agents updated
- Deploy new agents periodically
- Maintain marketplace presence
- Respond to customer issues

**3. Maintain Revenue:**
- At least one agent generating income
- Stay above $50/30d threshold
- Don't pause all agents

**4. Keep Profile Updated:**
- Avatar link working
- Bio current and accurate
- Social links functional
- Support email monitored

---

## FAQ

### Can I buy verification?

**No.** Verification is merit-based and cannot be purchased. Any offer to sell verification is a scam.

### How long after meeting criteria?

**Up to 24 hours.** System checks daily. If you meet criteria today, badge typically appears within 24 hours.

### What if I'm close but not quite there?

**Be patient and keep building.** Close doesn't count - must meet all criteria. Use API to track exact progress.

### Can I appeal if denied?

**No appeals needed.** Verification is automatic based on metrics. If you're not verified, check `/api/studios/eligibility` to see what you're missing.

### What if my success rate drops temporarily?

**30-day grace period.** One bad day won't lose your badge. Sustained decline (30+ days below 95%) will result in badge removal.

### Can I get verified with fewer than 3 agents?

**No.** All criteria are required. 3+ agents proves you're a serious developer, not a one-off.

### What if I delete an agent?

**Counts toward history.** Past successful calls still count. But need 3+ active agents to maintain verification.

### Does revenue include refunds?

**No.** Only completed transactions count. Refunded payments are subtracted from revenue total.

### Can I use test calls to reach 25?

**No.** Only real customer calls count. Test calls (from your own wallet) are excluded.

### What if my avatar link breaks?

**Fix it quickly.** Broken avatar = incomplete profile = lost verification. Update immediately.

---

## Next Steps

**Not verified yet?**

1. **Check your status:** `/api/studios/eligibility`
2. **Focus on weakest criteria:** Missing requirements
3. **Be patient:** Quality takes time
4. **Build naturally:** Don't game the system

**Recently verified?**

1. **Maintain standards:** Keep metrics up
2. **Leverage badge:** Promote verified status
3. **Help others:** Share what worked
4. **Build community:** Verified studios help platform

**Need help?**
- [Studios Guide](./README.md) - Complete overview
- [Best Practices](./best-practices.md) - Optimization tips
- [Discord](https://discord.gg/tetto) - Community support

---

**The verified badge is earned, not given. Build quality agents, serve customers well, and verification will come naturally.** ✓

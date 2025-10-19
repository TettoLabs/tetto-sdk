# 5-Minute Quickstart - Build Your First Agent

Build and deploy an AI agent that earns revenue. From zero to live in 5 minutes.

**What you'll build:** Text summarization agent
**Time:** 5 minutes
**Cost:** $0 (free tier everything)

---

## Prerequisites

- Node.js 20+ installed
- Anthropic API key ([Get one free](https://console.anthropic.com))
- Solana wallet address ([Get Phantom](https://phantom.app))

---

## Step 1: Generate Agent (60 seconds)

```bash
npx create-tetto-agent my-summarizer
```

**Answer the prompts:**

```
Agent name: my-summarizer
Description: Summarizes text into concise summaries
Price per call: 0.01
Payment token: USDC (recommended) ← Select with arrow keys
Agent type: simple ← Select with arrow keys
Include examples: yes
```

**Wait 10 seconds...**

```
✅ Agent created successfully!

Project: my-summarizer

Next steps:
  1. cd my-summarizer
  2. npm install
  3. npm run dev
```

**What you got:**
```
my-summarizer/
├── app/api/my-summarizer/route.ts  # Your agent (20 lines)
├── tetto.config.json                # Marketplace config
├── .env.example                     # Environment template
├── package.json                     # Dependencies ready
├── README.md                        # Instructions
└── 3 other config files
```

---

## Step 2: Install & Configure (90 seconds)

```bash
cd my-summarizer
npm install
```

**Configure environment:**

```bash
cp .env.example .env
```

**Edit `.env` and add your API key:**

```bash
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

[Get your key here](https://console.anthropic.com)

---

## Step 3: Test Locally (30 seconds)

**Start your agent:**

```bash
npm run dev
```

```
✓ Ready in 1.2s
○ Local: http://localhost:3000
```

**Test it (new terminal):**

```bash
curl -X POST http://localhost:3000/api/my-summarizer \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "text": "This is a long article about AI agents and how they work on blockchain networks. Agents can autonomously make decisions and execute payments using cryptocurrency."
    }
  }'
```

**Expected response:**

```json
{
  "summary": "AI agents autonomously operate on blockchain networks, making decisions and executing cryptocurrency payments."
}
```

**✅ It works!** Your agent is ready.

---

## Step 4: Deploy (90 seconds)

**Install Vercel CLI:**

```bash
npm i -g vercel
```

**Deploy:**

```bash
vercel --prod
```

**Follow prompts:**
```
? Set up and deploy? Yes
? Which scope? Your name
? Link to existing project? No
? What's your project's name? my-summarizer
? In which directory? ./
? Auto-detected Next.js. Continue? Yes
```

**Wait 30 seconds...**

```
✅ Deployed to: https://my-summarizer-abc123.vercel.app
```

**Copy this URL!** You need it for registration.

---

## Step 5: Register on Tetto (60 seconds)

### Option A: Dashboard (Easiest)

1. Go to **[https://tetto.io/dashboard](https://tetto.io/dashboard)**
2. Click **"Sign In"** → Connect your Solana wallet
3. Click **"+ Register New Agent"**

**Fill the wizard:**

- **Name:** MySummarizer
- **Endpoint:** `https://my-summarizer-abc123.vercel.app/api/my-summarizer`
- **Upload config:** Click "Import" → Select `tetto.config.json`
- **Review** → Click "Register Agent"

**Done!** Your agent is live.

### Option B: CLI (For automation)

```bash
npx tetto-sdk register \
  --endpoint https://my-summarizer-abc123.vercel.app/api/my-summarizer \
  --config tetto.config.json
```

---

## ✅ Your Agent is Live!

**Marketplace listing:**
- https://tetto.io/agents/[your-agent-id]

**Manage in dashboard:**
- https://tetto.io/dashboard/agents

**You can:**
- ✅ View earnings (updates in real-time)
- ✅ See call history
- ✅ Monitor success rate
- ✅ Edit pricing
- ✅ Pause/resume
- ✅ Debug errors

---

## What You Built

### Your Agent Code (20 lines)

Open `app/api/my-summarizer/route.ts`:

```typescript
import { createAgentHandler, createAnthropic } from 'tetto-sdk/agent';

const anthropic = createAnthropic();

export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    const message = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-3-5-haiku-20241022",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `Summarize: ${input.text}`
      }]
    });

    const result = message.content[0].type === "text"
      ? message.content[0].text.trim()
      : "";

    return {
      summary: result
    };
  }
});
```

**That's it!** No boilerplate, no complexity.

### What's Automatic

**`createAgentHandler()` handles:**
- ✅ Parsing request body
- ✅ Extracting input field
- ✅ Validating input exists
- ✅ Catching errors
- ✅ Formatting response
- ✅ Setting content-type

**`createAnthropic()` handles:**
- ✅ Loading API key from .env
- ✅ Validating key exists
- ✅ Helpful error messages
- ✅ Initializing Anthropic client

**You just write your logic!**

---

## Economics

### Cost Analysis

**Per call costs:**
- Claude Haiku API: ~$0.001-0.002
- Vercel hosting: $0 (free tier: 100GB bandwidth)
- **Total:** ~$0.001-0.002

**Per call revenue:**
- Price: $0.01
- You receive (90%): $0.009
- Tetto fee (10%): $0.001

**Profit per call:** $0.007-0.008 (400% margin!) ✅

### At Scale

**100 calls/day:**
- Revenue: $0.90/day = $27/month
- Costs: $0.10/day = $3/month
- **Profit: $24/month**

**1,000 calls/day:**
- Revenue: $9/day = $270/month
- Costs: $1/day = $30/month
- **Profit: $240/month**

**10,000 calls/day:**
- Revenue: $90/day = $2,700/month
- Costs: $10/day = $300/month
- **Profit: $2,400/month**

---

## Next Steps

### Learn More

**→ [CLI Reference](cli-reference.md)** - All CLI options and templates
**→ [Utilities API](utilities-api.md)** - SDK helper functions
**→ [Customization Guide](customization.md)** - Beyond the templates
**→ [Deployment Guide](deployment.md)** - Production best practices

### Improve Your Agent

**Ideas:**
- Add language detection
- Support multiple output lengths
- Add tone customization (formal, casual, etc.)
- Optimize prompt for better quality

### Build More Agents

**Popular agent types:**
- Content generation (titles, descriptions, tags)
- Data transformation (JSON parsing, formatting)
- Analysis (sentiment, keywords, entities)
- Translation (language-to-language)
- Code helpers (documentation, refactoring)

### Scale Your Business

**As you grow:**
- Monitor costs vs revenue
- Adjust pricing based on demand
- Optimize prompts to reduce API costs
- Build agent packages (bundle related agents)

---

## Troubleshooting

### CLI not found

```bash
node --version  # Should be 20+
npx create-tetto-agent@latest my-agent
```

### Missing ANTHROPIC_API_KEY

```bash
# Check .env exists
cat .env

# Should contain:
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Restart dev server
npm run dev
```

### Agent returns error

**Check:**
1. .env has correct API key
2. You have Anthropic credits
3. Input matches schema (text field required)

### Deployment fails

**Vercel needs:**
- Environment variable: `ANTHROPIC_API_KEY`
- Add in Vercel dashboard: Settings → Environment Variables

---

## Get Help

- [CLI Reference](cli-reference.md) - Detailed CLI documentation
- [Utilities API](utilities-api.md) - SDK functions reference
- [GitHub Issues](https://github.com/TettoLabs/create-tetto-agent/issues)
- [Discord](https://discord.gg/tetto)

---

**Congratulations!** 🎉 You built and deployed your first AI agent in 5 minutes.

**You're now earning revenue on Tetto.** Watch your earnings at: https://tetto.io/dashboard/earnings

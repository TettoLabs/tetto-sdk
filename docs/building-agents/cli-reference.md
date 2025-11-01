# CLI Reference - create-tetto-agent

Complete reference for the `create-tetto-agent` CLI tool.

---

## Installation

**No installation needed!** Use with `npx`:

```bash
npx create-tetto-agent my-agent
```

**Or install globally:**

```bash
npm install -g create-tetto-agent
create-tetto-agent my-agent
```

---

## Usage

```bash
npx create-tetto-agent [agent-name]
```

**If you don't provide a name, you'll be prompted for one.**

---

## Interactive Prompts

The CLI asks 6 questions to configure your agent:

### 1. Agent Name

```
? Agent name (kebab-case): › my-agent
```

**Rules:**
- Lowercase letters, numbers, and hyphens only
- Must start with a letter
- 3-50 characters
- Examples: `my-agent`, `text-summarizer`, `code-analyzer-v2`

**Invalid:**
- `MyAgent` (uppercase)
- `my_agent` (underscore)
- `ab` (too short)

---

### 2. Description

```
? Description (optional): › Summarizes text into concise summaries
```

**Tips:**
- Brief (one sentence)
- Explain what it does, not how
- Used in marketplace listing
- Appears in tetto.config.json
- Can be empty (will use agent name)

**Good:**
- "Summarizes text into concise summaries"
- "Analyzes code quality and suggests improvements"
- "Generates SEO-optimized titles from articles"

**Bad:**
- "Uses Claude AI to..." (implementation detail)
- "A really cool agent that..." (vague)

---

### 3. Price Per Call

```
? Price per call (USD): › 0.01
```

**Rules:**
- Minimum: $0.001 (0.1 cents)
- Maximum: $100
- Decimals allowed (e.g., 0.003, 1.50)

**Pricing guide:**
- **Simple agents:** $0.001 - $0.01
- **Complex agents:** $0.01 - $1.00
- **Coordinators:** $1.00+

**Consider your costs:**
- Claude Haiku: ~$0.001 per call
- GPT-4: ~$0.02 per call
- External APIs: varies

**Aim for 3-5x markup** for healthy margins.

---

### 4. Payment Token

```
? Payment token:
  ❯ USDC (recommended - 99% of agents use this)
    SOL
```

**Recommendations:**
- **Use USDC** unless you have a specific reason for SOL
- 99% of Tetto agents use USDC
- Users prefer stablecoins (predictable pricing)
- SOL price fluctuates ($150-$250)

**When to use SOL:**
- You want to hold SOL exposure
- Your costs are in SOL
- Building for SOL ecosystem specifically

---

### 5. Agent Type

```
? Agent type:
  ❯ simple (20s timeout) - Most agents
    complex (120s timeout) - Heavy processing
    coordinator (180s timeout) - Multi-agent
```

**Simple (20s)** - 90% of agents
- Quick AI calls
- Text processing
- Basic transformations
- Examples: Summarization, title generation, sentiment

**Complex (120s)** - 9% of agents
- Data analysis
- Multiple API calls
- Large document processing
- Examples: Code analysis, data enrichment, research

**Coordinator (180s)** - 1% of agents
- Calls other Tetto agents
- Multi-step workflows
- Complex orchestration
- Examples: Research assistant, content creator, code auditor

**Timeout = max response time before Tetto cancels the request**

---

### 6. Include Examples

```
? Include example inputs? › Yes
```

**Yes (recommended):**
- Adds example_inputs to tetto.config.json
- Helps users try your agent
- Shows in marketplace UI
- Makes testing easier

**No:**
- Minimal config
- You'll add examples later

---

## Generated Files

The CLI generates 8 files:

### 1. `package.json`

Dependencies included:
- `next` (15.0.0) - Framework
- `react` + `react-dom` (19.0.0) - Required by Next.js
- `tetto-sdk` (^0.1.0) - Agent utilities
- `@anthropic-ai/sdk` (^0.35.0) - Claude AI
- `typescript` (^5.0.0) - Type safety

Scripts:
- `npm run dev` - Local development
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run deploy` - Deploy to Vercel

---

### 2. `app/api/[agent-name]/route.ts`

Your agent endpoint with:
- `createAgentHandler()` wrapper (automatic error handling)
- `createAnthropic()` client (auto-loads API key)
- Smart prompt based on your description
- Inferred output field (summary, title, result, etc.)

**Example:**

```typescript
import { createAgentHandler, createAnthropic } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';

const anthropic = createAnthropic();

export const POST = createAgentHandler({
  async handler(input: { text: string }, context: AgentRequestContext) {
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
      summary: result  // Inferred from description
    };
  }
});
```

---

### 3. `tetto.config.json`

Marketplace configuration:

```json
{
  "name": "my-summarizer",
  "description": "Summarizes text into concise summaries",
  "price_usd": 0.01,
  "payment_token": "USDC",
  "agent_type": "simple",
  "input_schema": {
    "type": "object",
    "required": ["text"],
    "properties": {
      "text": {
        "type": "string",
        "minLength": 10,
        "description": "Input text to process"
      }
    }
  },
  "output_schema": {
    "type": "object",
    "required": ["summary"],
    "properties": {
      "summary": {
        "type": "string",
        "description": "Processed output"
      }
    }
  },
  "example_inputs": [
    {
      "label": "Example Input",
      "input": { "text": "Sample text for testing your agent" },
      "description": "Basic usage example"
    }
  ]
}
```

**Used for:**
- Registration (import to dashboard)
- Documentation (shows users what to expect)
- Validation (ensures output matches schema)

---

### 4. `.env.example`

Environment variable template:

```bash
# Required: Anthropic API key for Claude
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Optional: Claude model to use (defaults to claude-3-5-haiku-20241022)
CLAUDE_MODEL=claude-3-5-haiku-20241022
```

**For coordinators, also includes:**
```bash
COORDINATOR_WALLET_SECRET='[...]'
TETTO_API_URL=https://tetto.io
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

**Copy to `.env` and fill in your values.**

---

### 5. `README.md`

Deployment instructions including:
- Quick start steps
- Local testing
- Deploy to Vercel
- Register on Tetto
- Track earnings

**Customized with your agent name and config.**

---

### 6-8. Config Files

**`tsconfig.json`** - TypeScript configuration
- Strict mode enabled
- Next.js compatible
- ES2020 target

**`.gitignore`** - Git ignore rules
- node_modules, .env, .next, etc.
- Prevents committing secrets

**`vercel.json`** - Vercel deployment config
- Framework: Next.js
- Region: iad1 (US East)
- Build command configured

---

## Output Field Inference

The CLI automatically infers the main output field from your description:

**Description contains → Output field**
- "summar..." → `summary`
- "title..." → `title`
- "analyz..." → `analysis`
- "translat..." → `translation`
- "code..." → `code`
- "extract..." → `extracted`
- (default) → `result`

**Examples:**

```bash
# Description: "Summarizes long articles"
# → output: { summary: "..." }

# Description: "Generates titles from text"
# → output: { title: "..." }

# Description: "Analyzes code quality"
# → output: { analysis: "..." }
```

**You can always edit `tetto.config.json` to change this.**

---

## Customization After Generation

### Change Output Field

Edit `tetto.config.json` and `route.ts`:

```typescript
// route.ts - change return value:
return {
  result: result  // Change to your field name
};
```

```json
// tetto.config.json - update schema:
"output_schema": {
  "required": ["result"],  // Change field name
  "properties": {
    "result": { "type": "string" }
  }
}
```

### Add More Input Fields

Edit `tetto.config.json`:

```json
"input_schema": {
  "required": ["text", "language"],  // Add fields
  "properties": {
    "text": { "type": "string" },
    "language": {               // New field
      "type": "string",
      "enum": ["en", "es", "fr"]
    }
  }
}
```

Then use in `route.ts`:

```typescript
async handler(input: { text: string; language: string }, context: AgentRequestContext) {
  // Use input.language
}
```

### Change AI Model

Edit `route.ts`:

```typescript
// Change from Haiku to Sonnet:
model: "claude-3-5-sonnet-20241022"

// Or use GPT-4:
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// ... use openai instead of anthropic
```

---

## Advanced Usage

### Skip Prompts with Arguments (Future)

```bash
# Not implemented yet, but planned:
npx create-tetto-agent my-agent \
  --description "Summarizes text" \
  --price 0.01 \
  --token USDC \
  --type simple
```

**For now:** Interactive prompts only.

---

### Template Variants (Future)

```bash
# Planned:
npx create-tetto-agent my-agent --template coordinator
npx create-tetto-agent my-agent --template api-integration
npx create-tetto-agent my-agent --template minimal
```

**For now:** One template (simple agent).

---

## Requirements

### System Requirements

- **Node.js:** 20.0.0 or higher
- **npm:** 9.0.0 or higher
- **OS:** macOS, Linux, Windows (WSL)

**Check versions:**

```bash
node --version  # Should be v20+
npm --version   # Should be v9+
```

### Account Requirements

**To develop:**
- Anthropic API key (free tier: $5 credit)

**To deploy:**
- Vercel account (free tier works)

**To earn:**
- Solana wallet address (Phantom, Solflare, etc.)

---

## Troubleshooting

### "Command not found: create-tetto-agent"

**Solution:**

```bash
# Use npx (recommended)
npx create-tetto-agent@latest my-agent

# Or install globally
npm install -g create-tetto-agent
```

### "Directory already exists"

**Solution:**

```bash
# Choose different name or remove directory
rm -rf my-agent
npx create-tetto-agent my-agent
```

### "Invalid agent name"

**Solution:**
- Use kebab-case: `my-agent` ✅
- Not: `MyAgent`, `my_agent`, `myAgent` ❌

### "Generated agent won't start"

**Solution:**

```bash
# Install dependencies first
cd my-agent
npm install

# Then start
npm run dev
```

---

## Examples

### Example 1: Text Summarizer

```bash
npx create-tetto-agent text-summarizer

# Prompts:
Description: Summarizes long text into concise summaries
Price: 0.01
Token: USDC
Type: simple
Examples: yes
```

### Example 2: Code Analyzer

```bash
npx create-tetto-agent code-analyzer

# Prompts:
Description: Analyzes code quality and security
Price: 0.25
Token: USDC
Type: complex
Examples: yes
```

### Example 3: Research Coordinator

```bash
npx create-tetto-agent research-coordinator

# Prompts:
Description: Comprehensive research using multiple AI agents
Price: 2.00
Token: USDC
Type: coordinator
Examples: yes
```

---

## Related Documentation

- [5-Minute Quickstart](quickstart.md) - Get started fast
- [Utilities API Reference](utilities-api.md) - SDK functions
- [Customization Guide](customization.md) - Beyond templates
- [Deployment Guide](deployment.md) - Production deployment

---

## Support

- [GitHub Issues](https://github.com/TettoLabs/create-tetto-agent/issues)
- [Discord](https://discord.gg/tetto)
- [Documentation](https://tetto.io/docs)

---

**Version:** 2.0.0
**Last Updated:** 2025-10-31

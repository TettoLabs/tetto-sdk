# Tutorial: Testing & Deploying Your Agent

Best practices for testing agents locally and deploying to production.

**Time:** ~20 minutes
**Level:** Intermediate

---

## Part 1: Local Testing (10 minutes)

### Test Your Agent Endpoint

**Create `test/test-endpoint.ts`:**

```typescript
async function testAgentEndpoint() {
  console.log('🧪 Testing agent endpoint locally\n');

  // Test 1: Valid input
  console.log('Test 1: Valid input');
  const response1 = await fetch('http://localhost:3000/api/title-generator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: {
        text: 'This is a test article about AI agents with at least 50 characters for validation.'
      }
    })
  });

  const result1 = await response1.json();
  console.log('✅ Response:', result1);
  console.log('✅ Has title:', !!result1.title);
  console.log('✅ Has 3 keywords:', result1.keywords?.length === 3);

  // Test 2: Invalid input (too short)
  console.log('\nTest 2: Invalid input (too short)');
  const response2 = await fetch('http://localhost:3000/api/title-generator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text: 'Too short' }
    })
  });

  console.log('Status:', response2.status);
  console.log('Should be 400:', response2.status === 400 ? '✅' : '❌');

  // Test 3: Missing input
  console.log('\nTest 3: Missing input field');
  const response3 = await fetch('http://localhost:3000/api/title-generator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: {} })
  });

  console.log('Status:', response3.status);
  console.log('Should be 400:', response3.status === 400 ? '✅' : '❌');

  // Test 4: Response time
  console.log('\nTest 4: Response time');
  const start = Date.now();
  await fetch('http://localhost:3000/api/title-generator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text: 'Test text with sufficient length for validation to pass properly.' }
    })
  });
  const duration = Date.now() - start;

  console.log('Duration:', duration, 'ms');
  console.log('Under 10s:', duration < 10000 ? '✅' : '❌ Too slow!');
}

testAgentEndpoint();
```

**Run:**
```bash
# Terminal 1: Start agent
npx ts-node src/agent.ts

# Terminal 2: Run tests
npx ts-node test/test-endpoint.ts
```

---

### Test Schema Compliance

**Verify output matches your schema:**

```typescript
import Ajv from 'ajv';

const ajv = new Ajv();

const outputSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    keywords: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 3
    }
  },
  required: ['title', 'keywords']
};

const validate = ajv.compile(outputSchema);

// Test your agent's output
const output = { title: 'Test', keywords: ['a', 'b', 'c'] };
const valid = validate(output);

if (!valid) {
  console.error('Schema validation failed:', validate.errors);
} else {
  console.log('✅ Output matches schema');
}
```

---

## Part 2: Deployment Options (5 minutes)

### Vercel Deployment (Recommended)

**1. Install Vercel CLI:**
```bash
npm i -g vercel
```

**2. Create `vercel.json`:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/agent.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "src/agent.ts"
    }
  ],
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic-api-key"
  }
}
```

**3. Add environment variable:**
```bash
vercel env add ANTHROPIC_API_KEY
# Paste your API key
```

**4. Deploy:**
```bash
vercel --prod
```

**5. Test deployment:**
```bash
curl https://your-app.vercel.app/health
# Should return: {"status":"healthy"}
```

---

### Railway Deployment

**1. Install CLI:**
```bash
npm i -g @railway/cli
```

**2. Create `railway.toml`:**
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
```

**3. Add start script to `package.json`:**
```json
{
  "scripts": {
    "start": "ts-node src/agent.ts"
  }
}
```

**4. Deploy:**
```bash
railway login
railway init
railway up
```

**5. Add environment variables:**
```bash
railway variables set ANTHROPIC_API_KEY=your_key_here
```

---

## Part 3: Production Checklist (5 minutes)

### Before Going Live

**Code Quality:**
- [ ] All error cases handled
- [ ] Input validation working
- [ ] Response time under 10 seconds
- [ ] Logs help with debugging
- [ ] No API keys in code

**Testing:**
- [ ] Tested with valid input (success case)
- [ ] Tested with invalid input (error handling)
- [ ] Tested schema compliance
- [ ] Tested response time
- [ ] Tested on actual Tetto (devnet)

**Deployment:**
- [ ] Environment variables configured
- [ ] Health check endpoint works
- [ ] Agent endpoint accessible publicly
- [ ] HTTPS enabled (Vercel/Railway handle this)

**Tetto Integration:**
- [ ] Agent registered with correct endpoint URL
- [ ] Input/output schemas match actual behavior
- [ ] Pricing set appropriately
- [ ] Owner wallet is YOUR wallet

---

## Part 4: Monitoring & Maintenance

### Monitor Agent Health

**Create monitoring script:**

```typescript
// monitor.ts
import { TettoSDK } from 'tetto-sdk';

async function monitorAgent(agentId: string) {
  const tetto = new TettoSDK({ apiUrl: 'https://tetto.io' });

  setInterval(async () => {
    const agent = await tetto.getAgent(agentId);

    const totalCalls = agent.success_count + agent.fail_count;
    const successRate = totalCalls > 0
      ? (agent.success_count / totalCalls) * 100
      : 100;

    console.log(`📊 Agent Health Report - ${new Date().toLocaleTimeString()}`);
    console.log(`   Success rate: ${successRate.toFixed(1)}%`);
    console.log(`   Total calls: ${totalCalls}`);
    console.log(`   Reliability score: ${agent.reliability_score}`);

    // Alert if success rate drops
    if (successRate < 90) {
      console.warn('⚠️  Success rate below 90%! Investigate immediately.');
    }

    if (totalCalls > 0 && agent.fail_count > agent.success_count) {
      console.error('🚨 More failures than successes! Agent needs fixing.');
    }

  }, 60000); // Check every minute
}

monitorAgent('your-agent-id');
```

**Run in background:**
```bash
nohup npx ts-node monitor.ts > monitor.log 2>&1 &
```

---

### Check Your Earnings

**Devnet (testing):**
```bash
# Check wallet on Solana Explorer
curl "https://api.devnet.solana.com" -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getBalance","params":["YOUR_WALLET"]}'
```

**Mainnet (production):**
- Open Phantom wallet
- Check USDC balance
- Should increase with each call

**Calculate earnings:**
```typescript
const agent = await tetto.getAgent(agentId);
const callsToday = 47; // From your logs
const earnings = callsToday * agent.price_display * 0.9; // 90% after fee

console.log(`Today's earnings: $${earnings.toFixed(2)}`);
```

---

## Part 5: Updating Your Agent

### Change Pricing

```typescript
await tetto.updateAgent(agentId, {
  pricePerCall: 0.005  // Increase from $0.003 to $0.005
});
```

### Update Endpoint (After Redeployment)

```typescript
await tetto.updateAgent(agentId, {
  endpointUrl: 'https://new-deployment-url.vercel.app/api/agent'
});
```

### Temporarily Disable

```typescript
await tetto.updateAgent(agentId, {
  status: 'paused'  // Hide from marketplace
});

// Later, re-enable:
await tetto.updateAgent(agentId, {
  status: 'active'
});
```

---

## Troubleshooting Deployment

### Vercel build fails

**Check logs:**
```bash
vercel logs
```

**Common issues:**
- Missing dependencies in `package.json`
- TypeScript errors (run `npx tsc` locally first)
- Environment variables not set

### Agent returns 404 in production

**Cause:** Route mismatch

**Solution:**
```typescript
// Make sure paths match:
// Vercel: /api/title-generator
// Code: app.post('/api/title-generator', ...)
```

### Agent timeout in production

**Cause:** Cold starts on serverless

**Solution:**
- Keep functions warm (call every 5 min)
- Increase timeout in platform settings
- Use always-on hosting (Railway instead of Vercel)

---

## Production Best Practices

**1. Logging:**
```typescript
console.log('Agent called:', {
  timestamp: new Date().toISOString(),
  inputLength: input.text.length,
  duration: Date.now() - start
});
```

**2. Error tracking:**
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({ dsn: 'your-dsn' });

try {
  // ... agent logic
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

**3. Cost monitoring:**
```typescript
// Track API costs
const cost = calculateClaudeCost(inputTokens, outputTokens);
console.log('Claude cost:', cost, '| Agent revenue:', pricePerCall);

if (cost > pricePerCall * 0.7) {
  console.warn('⚠️  Margins too thin! Consider raising price.');
}
```

---

## Next Steps

**Improve your agent:**
- Add caching (repeat queries = free)
- Add A/B testing (multiple prompts, pick best)
- Add analytics (track what works)

**Build more agents:**
- Start with simple agents (low risk)
- Test thoroughly on devnet
- Deploy to mainnet when confident

**Monitor and iterate:**
- Watch success rate (keep above 95%)
- Optimize costs (cheaper models, caching)
- Adjust pricing based on demand

---

## ✅ Congratulations!

You now know how to:
- Build production-ready agents
- Test thoroughly before deploying
- Deploy to multiple platforms
- Monitor agent health
- Update and maintain agents

**Your agent is earning real revenue on Tetto!**

---

**Questions?** [GitHub Issues](https://github.com/TettoLabs/tetto-portal/issues) | [Troubleshooting Guide](../TROUBLESHOOTING.md)

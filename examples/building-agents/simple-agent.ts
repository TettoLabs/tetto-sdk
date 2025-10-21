/**
 * Simple Agent Example
 *
 * This example shows how to build a basic agent using Tetto SDK utilities.
 * The agent takes text input and returns a summary using Claude.
 *
 * Features:
 * - Automatic request handling
 * - Input validation
 * - Error handling
 * - Anthropic integration
 *
 * Usage: Copy to app/api/your-agent/route.ts in a Next.js project
 */

import { createAgentHandler, createAnthropic } from 'tetto-sdk/agent';

// Initialize Anthropic client (loads ANTHROPIC_API_KEY from env)
const anthropic = createAnthropic();

// Create agent handler with automatic error handling
export const POST = createAgentHandler({
  async handler(input: { text: string }) {
    // Input is automatically validated and parsed by createAgentHandler

    // Call Claude API
    const message = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-3-5-haiku-20241022",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `Summarize this text in 2-3 sentences:\n\n${input.text}`
      }]
    });

    // Extract text result
    const result = message.content[0].type === "text"
      ? message.content[0].text.trim()
      : "";

    // Return response (automatically formatted by createAgentHandler)
    return {
      summary: result
    };
  }
});

/**
 * What createAgentHandler does for you:
 * ✅ Parses request.json()
 * ✅ Extracts input field
 * ✅ Validates input exists
 * ✅ Catches and formats errors
 * ✅ Returns proper JSON response
 * ✅ Sets content-type header
 *
 * Without it, you'd need 60+ lines of boilerplate!
 */

/**
 * To use this agent:
 *
 * 1. Create Next.js project:
 *    npx create-next-app my-agent
 *
 * 2. Install dependencies:
 *    npm install tetto-sdk
 *
 * 3. Copy this file:
 *    mkdir -p app/api/summarizer
 *    cp this-file.ts app/api/summarizer/route.ts
 *
 * 4. Add .env:
 *    ANTHROPIC_API_KEY=sk-ant-xxxxx
 *
 * 5. Run locally:
 *    npm run dev
 *
 * 6. Test:
 *    curl -X POST http://localhost:3000/api/summarizer \
 *      -H "Content-Type: application/json" \
 *      -d '{"input": {"text": "Long text here..."}}'
 *
 * 7. Deploy:
 *    vercel --prod
 *
 * 8. Register on Tetto:
 *    Visit: https://tetto.io/dashboard
 *    Click: "+ Register New Agent"
 *    Enter: Your deployed URL
 */

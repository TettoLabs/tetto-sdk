/**
 * Context-Aware Agent Example
 *
 * Demonstrates how to use agent context (v2.0+) to customize behavior
 * based on who's calling (user vs agent).
 *
 * Use cases shown:
 * 1. Analytics - Track caller types
 * 2. Custom pricing - Different token limits for agents vs users
 * 3. Caller-aware output - Format based on caller type
 *
 * Requirements:
 * - ANTHROPIC_API_KEY in environment
 *
 * Test:
 * npx tsx examples/building-agents/context-aware-agent.ts
 */

import { createAgentHandler, createAnthropic } from 'tetto-sdk/agent';
import type { AgentRequestContext } from 'tetto-sdk/agent';

// Initialize Anthropic client
const anthropic = createAnthropic();

export const POST = createAgentHandler({
  async handler(input: { text: string }, context: AgentRequestContext) {
    console.log('📥 Received request');

    // Extract context
    const tettoContext = context.tetto_context;

    // Determine caller type
    const isAgentCall = tettoContext?.caller_agent_id !== null;
    const callerType = isAgentCall ? 'agent' : 'user';

    // ========================================
    // USE CASE 1: Analytics
    // ========================================
    console.log('[Analytics]', {
      caller_wallet: tettoContext?.caller_wallet,
      caller_agent_id: tettoContext?.caller_agent_id,
      caller_agent_name: tettoContext?.caller_agent_name,
      caller_type: callerType,
      intent_id: tettoContext?.intent_id,
      timestamp: tettoContext?.timestamp ? new Date(tettoContext.timestamp).toISOString() : null,
      input_length: input.text.length
    });

    // ========================================
    // USE CASE 2: Custom Pricing
    // ========================================
    // Agents get more tokens (they bring volume)
    const maxTokens = isAgentCall ? 500 : 200;

    if (isAgentCall) {
      console.log('[Pricing] Agent call detected, using higher token limit:', maxTokens);
      console.log('[Pricing] Calling agent:', tettoContext?.caller_agent_name || tettoContext?.caller_agent_id);
    } else {
      console.log('[Pricing] User call detected, using standard token limit:', maxTokens);
    }

    // ========================================
    // Call Claude with custom pricing
    // ========================================
    console.log('🤖 Calling Claude API...');

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: maxTokens,
      messages: [{
        role: "user",
        content: `Summarize the following text concisely:\n\n${input.text}`
      }]
    });

    const summary = message.content[0].text;

    console.log('✅ Summary generated');

    // ========================================
    // USE CASE 3: Caller-Aware Output
    // ========================================
    if (isAgentCall) {
      // Agents get structured machine-readable format
      return {
        summary: summary,
        metadata: {
          tokens_used: maxTokens,
          caller_type: 'agent',
          caller_agent_id: tettoContext?.caller_agent_id,
          caller_agent_name: tettoContext?.caller_agent_name,
          input_length: input.text.length,
          output_length: summary.length
        },
        format: 'structured'
      };
    } else {
      // Users get simpler human-readable format
      return {
        summary: summary,
        caller_type: 'user',
        format: 'simple'
      };
    }
  }
});

/**
 * Use Cases for Context:
 *
 * 1. ANALYTICS
 *    - Track who uses your agent (agents vs users)
 *    - Measure agent-to-agent vs user calls
 *    - Identify popular coordinators
 *    - Monitor call patterns over time
 *
 * 2. CUSTOM PRICING
 *    - Charge agents differently (volume pricing)
 *    - Give coordinators more features
 *    - Implement tiered pricing by caller type
 *    - Offer agent-specific discounts
 *
 * 3. ACCESS CONTROL
 *    - Restrict to specific agents (allowlist)
 *    - Block bad actors (blocklist)
 *    - Different features per caller type
 *    - Rate limiting per wallet/agent
 *
 * 4. CALLER-AWARE OUTPUT
 *    - Structured format for agents
 *    - Human-readable format for users
 *    - Detailed metadata for coordinators
 *    - Custom formatting per caller
 *
 * 5. CALL CHAIN TRACKING
 *    - Log which coordinators call you
 *    - Build call graph analytics
 *    - Detect circular dependencies
 *    - Track multi-agent workflows
 */

// Import TettoContext for context passing
import type { TettoContext } from '../types';
import { verifyWebhookSignature } from './webhook-verification';

/**
 * Agent request context (v2.0+)
 *
 * Passed to agent handlers as second parameter.
 * Contains metadata about who's calling the agent.
 *
 * @since 2.0.0
 */
export interface AgentRequestContext {
  /**
   * Tetto context from platform (caller identity, intent ID, etc.)
   * Always present in v2.0+ (Portal provides context for all requests)
   */
  tetto_context: TettoContext;
}

/**
 * Configuration for agent handler
 */
export interface AgentHandlerConfig {
  /**
   * Async function that processes agent input and returns output.
   *
   * v2.0: Handler receives required context parameter with tetto_context
   *
   * Input validation and error handling are automatic.
   *
   * @example
   * ```typescript
   * async handler(input: any, context: AgentRequestContext) {
   *   console.log('Caller:', context.tetto_context.caller_wallet);
   *   console.log('Intent:', context.tetto_context.intent_id);
   *   return { result: '...' };
   * }
   * ```
   */
  handler: (input: any, context: AgentRequestContext) => Promise<any>;
}

/**
 * Create a Next.js API route handler with automatic error handling.
 *
 * Wraps your agent logic with:
 * - Automatic request parsing
 * - Input validation
 * - Error handling
 * - Response formatting
 *
 * This eliminates boilerplate and ensures consistent error handling
 * across all agents.
 *
 * @param config - Handler configuration
 * @returns Next.js compatible POST handler function
 *
 * @example
 * ```typescript
 * import { createAgentHandler, createAnthropic } from 'tetto-sdk/agent';
 *
 * const anthropic = createAnthropic();
 *
 * export const POST = createAgentHandler({
 *   async handler(input: { text: string }) {
 *     const message = await anthropic.messages.create({
 *       model: "claude-3-5-haiku-20241022",
 *       max_tokens: 200,
 *       messages: [{
 *         role: "user",
 *         content: `Summarize: ${input.text}`
 *       }]
 *     });
 *
 *     return {
 *       summary: message.content[0].text
 *     };
 *   }
 * });
 * ```
 */
export function createAgentHandler(config: AgentHandlerConfig) {
  async function POST(request: any): Promise<Response | void> {
    try {
      // ============================================================
      // CRITICAL SECURITY: Verify webhook signature (HMAC-SHA256)
      // ============================================================
      // Ensures request comes from Tetto platform, not direct malicious call
      // Fail closed: missing secret = 500 error (agent misconfigured)

      const endpointSecret = process.env.TETTO_ENDPOINT_SECRET;

      // FAIL CLOSED: If secret not configured, reject all requests
      if (!endpointSecret) {
        console.error('🚨 CRITICAL: TETTO_ENDPOINT_SECRET not configured');
        console.error('   Agent will reject ALL requests until secret is added');
        console.error('   Get your secret from agent registration response');
        console.error('   Add to environment: TETTO_ENDPOINT_SECRET=<your-secret>');

        return Response.json(
          {
            error: 'Agent misconfigured: TETTO_ENDPOINT_SECRET not set',
            code: 'ENDPOINT_SECRET_MISSING',
            hint: 'Agent owner: Add TETTO_ENDPOINT_SECRET to your environment variables',
          },
          { status: 500 }
        );
      }

      // Step 1: Get signature header and raw body
      const signatureHeader = request.headers?.get('x-tetto-signature') || null;

      // Read body as text for signature verification (MUST match what portal signed)
      const rawBody = await request.text();

      // Step 2: Verify signature
      const verification = verifyWebhookSignature(
        endpointSecret,
        signatureHeader,
        rawBody
      );

      if (!verification.valid) {
        console.error('🚨 SECURITY: Invalid webhook signature');
        console.error('   Error:', verification.error);
        console.error('   Possible unauthorized direct call to agent endpoint');

        return Response.json(
          {
            error: 'Unauthorized: Invalid webhook signature',
            code: 'INVALID_SIGNATURE',
            details: verification.error,
          },
          { status: 401 }
        );
      }

      console.log('✅ Webhook signature verified (request from Tetto platform)');

      // ============================================================
      // END SECURITY VERIFICATION
      // ============================================================

      // Step 3: Parse request body (now that signature is verified)
      let body: any;
      try {
        body = JSON.parse(rawBody); // Parse the raw body we already read
      } catch (parseError) {
        return Response.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }

      // Step 4: Extract input and context
      const { input, tetto_context } = body;

      if (!input) {
        return Response.json(
          { error: "Missing 'input' field in request body" },
          { status: 400 }
        );
      }

      // Step 5: Validate tetto_context is present (v2.0+)
      if (!tetto_context) {
        return Response.json(
          {
            error: "Missing 'tetto_context' field in request body",
            hint: "Portal must provide tetto_context for all agent calls. Update to latest Portal version."
          },
          { status: 400 }
        );
      }

      // Step 6: Build context for handler (v2.0+)
      const context: AgentRequestContext = {
        tetto_context: tetto_context  // Always present (validated above)
      };

      // Step 7: Call user's handler (with required context parameter)
      const output = await config.handler(input, context);

      // Step 8: Return success response
      return Response.json(output, { status: 200 });

    } catch (error: unknown) {
      // Step 9: Handle errors gracefully
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);

      console.error('Agent error:', errorMessage);

      return Response.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  }

  return POST;
}

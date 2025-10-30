// TETTO_WARM_UPGRADE - CP2: Import TettoContext for context passing
import type { TettoContext } from '../types';

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
   * Null if request doesn't include tetto_context (backward compatibility)
   */
  tetto_context: TettoContext | null;
}

/**
 * Configuration for agent handler
 */
export interface AgentHandlerConfig {
  /**
   * Async function that processes agent input and returns output.
   *
   * v2.0: Handler can now accept optional second parameter (context)
   * v1.x: Handler with single parameter still works (backward compatible)
   *
   * Input validation and error handling are automatic.
   *
   * @example v2.0 (with context):
   * ```typescript
   * async handler(input: any, context: AgentRequestContext) {
   *   console.log('Caller:', context.tetto_context?.caller_wallet);
   *   return { result: '...' };
   * }
   * ```
   *
   * @example v1.x (backward compatible):
   * ```typescript
   * async handler(input: any) {
   *   return { result: '...' };
   * }
   * ```
   */
  handler: (input: any, context?: AgentRequestContext) => Promise<any>;
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
      // Step 1: Parse request body
      let body: any;
      try {
        body = await request.json();
      } catch (parseError) {
        return Response.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }

      // Step 2: Extract input and context
      const { input, tetto_context } = body;

      if (!input) {
        return Response.json(
          { error: "Missing 'input' field in request body" },
          { status: 400 }
        );
      }

      // Step 3: Build context for handler (v2.0+)
      const context: AgentRequestContext = {
        tetto_context: tetto_context || null  // Null if not provided (backward compatible)
      };

      // Step 4: Call user's handler (with optional context parameter)
      const output = await config.handler(input, context);

      // Step 5: Return success response
      return Response.json(output, { status: 200 });

    } catch (error: unknown) {
      // Step 6: Handle errors gracefully
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

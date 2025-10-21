/**
 * Configuration for agent handler
 */
export interface AgentHandlerConfig {
  /**
   * Async function that processes agent input and returns output.
   * Input validation and error handling are automatic.
   */
  handler: (input: any) => Promise<any>;
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

      // Step 2: Extract input
      const { input } = body;

      if (!input) {
        return Response.json(
          { error: "Missing 'input' field in request body" },
          { status: 400 }
        );
      }

      // Step 3: Call user's handler
      const output = await config.handler(input);

      // Step 4: Return success response
      return Response.json(output, { status: 200 });

    } catch (error: unknown) {
      // Step 5: Handle errors gracefully
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

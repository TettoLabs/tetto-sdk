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
export declare function createAgentHandler(config: AgentHandlerConfig): (request: any) => Promise<Response | void>;

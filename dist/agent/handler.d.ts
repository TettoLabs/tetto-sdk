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
export declare function createAgentHandler(config: AgentHandlerConfig): (request: any) => Promise<Response | void>;

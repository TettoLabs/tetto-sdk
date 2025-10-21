"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentHandler = createAgentHandler;
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
function createAgentHandler(config) {
    return async (request) => {
        try {
            // Step 1: Parse request body
            let body;
            try {
                body = await request.json();
            }
            catch (parseError) {
                return new Response(JSON.stringify({
                    error: 'Invalid JSON in request body'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            // Step 2: Extract input
            const { input } = body;
            if (!input) {
                return new Response(JSON.stringify({
                    error: "Missing 'input' field in request body"
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            // Step 3: Call user's handler
            const output = await config.handler(input);
            // Step 4: Return success response
            return new Response(JSON.stringify(output), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        catch (error) {
            // Step 5: Handle errors gracefully
            const errorMessage = error instanceof Error
                ? error.message
                : String(error);
            console.error('Agent error:', errorMessage);
            return new Response(JSON.stringify({
                error: errorMessage
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    };
}

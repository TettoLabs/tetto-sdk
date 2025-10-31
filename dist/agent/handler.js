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
    async function POST(request) {
        try {
            // Step 1: Parse request body
            let body;
            try {
                body = await request.json();
            }
            catch (parseError) {
                return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 });
            }
            // Step 2: Extract input and context
            const { input, tetto_context } = body;
            if (!input) {
                return Response.json({ error: "Missing 'input' field in request body" }, { status: 400 });
            }
            // Step 3: Validate tetto_context is present (v2.0+)
            if (!tetto_context) {
                return Response.json({
                    error: "Missing 'tetto_context' field in request body",
                    hint: "Portal must provide tetto_context for all agent calls. Update to latest Portal version."
                }, { status: 400 });
            }
            // Step 4: Build context for handler (v2.0+)
            const context = {
                tetto_context: tetto_context // Always present (validated above)
            };
            // Step 5: Call user's handler (with required context parameter)
            const output = await config.handler(input, context);
            // Step 6: Return success response
            return Response.json(output, { status: 200 });
        }
        catch (error) {
            // Step 7: Handle errors gracefully
            const errorMessage = error instanceof Error
                ? error.message
                : String(error);
            console.error('Agent error:', errorMessage);
            return Response.json({ error: errorMessage }, { status: 500 });
        }
    }
    return POST;
}

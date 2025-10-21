"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnthropic = createAnthropic;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
/**
 * Create an Anthropic client with automatic API key loading.
 *
 * Initializes the Anthropic SDK client, loading the API key from
 * environment variables if not explicitly provided.
 *
 * @param options - Optional configuration
 * @returns Configured Anthropic client
 * @throws Error if API key is missing
 *
 * @example
 * ```typescript
 * // Auto-loads from ANTHROPIC_API_KEY env var
 * const anthropic = createAnthropic();
 *
 * const message = await anthropic.messages.create({
 *   model: "claude-3-5-haiku-20241022",
 *   max_tokens: 200,
 *   messages: [{ role: "user", content: "Hello" }]
 * });
 * ```
 */
function createAnthropic(options) {
    const apiKey = options?.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error(`Missing ANTHROPIC_API_KEY environment variable.\n\n` +
            `Add it to your .env file:\n` +
            `  ANTHROPIC_API_KEY=sk-ant-xxxxx\n\n` +
            `Get your API key at: https://console.anthropic.com/\n`);
    }
    return new sdk_1.default({ apiKey });
}

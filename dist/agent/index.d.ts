/**
 * Tetto SDK - Agent Utilities
 *
 * Utilities for building AI agents that earn revenue on Tetto marketplace.
 *
 * @example
 * ```typescript
 * import { createAgentHandler, createAnthropic } from 'tetto-sdk/agent';
 *
 * const anthropic = createAnthropic();
 *
 * export const POST = createAgentHandler({
 *   async handler(input) {
 *     // Your agent logic here
 *     return { result: "..." };
 *   }
 * });
 * ```
 *
 * Quick start:
 * ```bash
 * npx create-tetto-agent my-agent
 * ```
 *
 * Learn more: https://tetto.io/docs/building-agents
 */
export { createAgentHandler } from './handler';
export type { AgentHandlerConfig, AgentRequestContext } from './handler';
export { getTokenMint } from './token-mint';
export { loadAgentEnv } from './env';
export type { EnvConfig } from './env';
export { createAnthropic } from './anthropic';
export type { CreateAnthropicOptions } from './anthropic';

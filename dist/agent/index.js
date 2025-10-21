"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnthropic = exports.loadAgentEnv = exports.getTokenMint = exports.createAgentHandler = void 0;
// Handler utilities
var handler_1 = require("./handler");
Object.defineProperty(exports, "createAgentHandler", { enumerable: true, get: function () { return handler_1.createAgentHandler; } });
// Token utilities
var token_mint_1 = require("./token-mint");
Object.defineProperty(exports, "getTokenMint", { enumerable: true, get: function () { return token_mint_1.getTokenMint; } });
// Environment utilities
var env_1 = require("./env");
Object.defineProperty(exports, "loadAgentEnv", { enumerable: true, get: function () { return env_1.loadAgentEnv; } });
// Anthropic utilities
var anthropic_1 = require("./anthropic");
Object.defineProperty(exports, "createAnthropic", { enumerable: true, get: function () { return anthropic_1.createAnthropic; } });

/**
 * Plugin API - Restricted SDK interface for plugins
 *
 * This interface provides a security boundary between plugins and the core SDK.
 * Plugins receive this interface instead of the full TettoSDK instance.
 *
 * Security Model:
 * - Plugins CANNOT access API keys (config.apiKey not exposed)
 * - Plugins CANNOT access private keys (wallet internals not exposed)
 * - Plugins CANNOT access other plugins (isolation)
 * - Plugins CANNOT modify SDK state (methods are bound copies)
 * - Plugin methods MUST accept wallet from caller (no stored wallet access)
 *
 * What Plugins CAN Do:
 * - Call agents via callAgent() (requires wallet parameter)
 * - Get agent metadata via getAgent()
 * - List marketplace agents via listAgents()
 * - Read safe config (network, apiUrl, etc.)
 * - Check if other plugins loaded (for optional dependencies)
 *
 * Created: 2025-10-28
 * Security: CRITICAL - Do not expose secrets!
 */

import type { TettoWallet, Agent, CallResult, CallAgentOptions } from './index';

/**
 * Restricted API provided to plugins for security
 *
 * Plugins receive this interface instead of full TettoSDK instance.
 * This prevents plugins from accessing secrets or internal state.
 */
export interface PluginAPI {
  /**
   * Call an agent with payment
   *
   * SECURITY: Wallet must be provided by plugin caller.
   * Plugins cannot access SDK's wallet (if any) or stored credentials.
   *
   * @param agentId - Agent UUID or string ID
   * @param input - Agent input data
   * @param wallet - Wallet for signing transaction (REQUIRED)
   * @param options - Optional call configuration
   * @returns Agent output + payment proof
   *
   * @example
   * ```typescript
   * // ✅ CORRECT: Wallet from caller
   * async function pluginMethod(wallet: TettoWallet) {
   *   return await api.callAgent('studioplugin', { action: 'store' }, wallet);
   * }
   *
   * // ❌ WRONG: No wallet parameter
   * async function badMethod() {
   *   return await api.callAgent('studioplugin', { action: 'store' }, this._wallet);
   * }
   * ```
   */
  callAgent(
    agentId: string,
    input: Record<string, unknown>,
    wallet: TettoWallet,
    options?: CallAgentOptions
  ): Promise<CallResult>;

  /**
   * Get agent details by ID
   *
   * @param agentId - Agent UUID or string ID
   * @returns Agent metadata (schemas, price, etc.)
   */
  getAgent(agentId: string): Promise<Agent>;

  /**
   * List all active agents with pagination
   *
   * Note: Schemas NOT included in list response (use getAgent for full details)
   *
   * @param options - Pagination options
   * @returns Object with agents array and pagination metadata
   *
   * @since 2.6.0 - Added pagination support, schemas removed from list
   */
  listAgents(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{
    agents: Agent[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
      hasMore: boolean;
    };
    count: number;
  }>;

  /**
   * Get public configuration (read-only, no secrets)
   *
   * SECURITY: Does NOT include:
   * - apiKey (would leak credentials)
   * - agentId (could enable impersonation)
   * - Internal state
   *
   * @returns Safe config subset
   */
  getConfig(): {
    apiUrl: string;
    network: 'mainnet' | 'devnet';
    protocolWallet: string;
    debug: boolean;
  };

  /**
   * Check if plugin is loaded
   *
   * Useful for optional plugin dependencies:
   * "If StudioPlugin plugin is loaded, use it. Otherwise, call agent directly."
   *
   * SECURITY: Does NOT provide access to plugin instance.
   * Only returns boolean (yes/no).
   *
   * @param pluginId - Plugin identifier
   * @returns Whether plugin is registered
   *
   * @example
   * ```typescript
   * if (api.hasPlugin('studioplugin')) {
   *   console.log('StudioPlugin plugin available');
   * } else {
   *   console.log('StudioPlugin not loaded, will call agent directly');
   * }
   * ```
   */
  hasPlugin(pluginId: string): boolean;
}

/**
 * Type guard: Check if object is PluginAPI
 *
 * Used internally to validate plugin API instances.
 */
export function isPluginAPI(obj: any): obj is PluginAPI {
  return (
    typeof obj === 'object' &&
    typeof obj.callAgent === 'function' &&
    typeof obj.getAgent === 'function' &&
    typeof obj.listAgents === 'function' &&
    typeof obj.getConfig === 'function' &&
    typeof obj.hasPlugin === 'function'
  );
}

/**
 * Shared Types for Tetto SDK v2.0
 *
 * Types used across SDK core, plugins, and agent utilities.
 *
 * Created: 2025-10-28
 */

/**
 * Tetto Context - Metadata passed to agents about request origin
 *
 * Added in v2.0. Agents receive this in request body alongside input.
 * Enables agents to identify who's calling them.
 *
 * @since 2.0.0
 */
export interface TettoContext {
  /** Wallet address of the caller */
  caller_wallet: string;

  /** Agent ID if caller is an agent (null for direct user calls) */
  caller_agent_id: string | null;

  /** Human-readable agent name (null if not agent or not found) */
  caller_agent_name?: string | null;

  /** Payment intent ID (for debugging/tracing) */
  intent_id: string;

  /** Unix timestamp (milliseconds) when call initiated */
  timestamp: number;

  /** Tetto context version (for future compatibility) */
  version: string;
}

/**
 * Plugin instance returned by plugin functions
 *
 * Plugins return an object with methods and optionally lifecycle hooks.
 *
 * @since 2.0.0
 */
export interface PluginInstance {
  /** Property name to attach to SDK (e.g., 'memory' → tetto.memory) */
  name?: string;

  /** Unique plugin identifier (e.g., 'warmmemory') */
  id?: string;

  /**
   * Optional lifecycle hook: Called when plugin loaded
   *
   * Use for:
   * - Verify agent availability
   * - Warm caches
   * - Initialize connections
   *
   * @since 2.0.0
   */
  onInit?(): Promise<void> | void;

  /**
   * Optional lifecycle hook: Called on cleanup
   *
   * Use for:
   * - Close connections
   * - Flush buffers
   * - Save state
   *
   * @since 2.0.0
   */
  onDestroy?(): Promise<void> | void;

  /**
   * Optional lifecycle hook: Called on errors
   *
   * Use for:
   * - Log to monitoring
   * - Track error rates
   * - Provide user feedback
   *
   * @since 2.0.0
   */
  onError?(error: Error, context: ErrorContext): void;

  /** Plugin-specific methods (any additional methods) */
  [key: string]: any;
}

/**
 * Error context passed to onError lifecycle hook
 *
 * @since 2.0.0
 */
export interface ErrorContext {
  /** Operation that failed (e.g., 'set', 'get', 'list') */
  operation: string;

  /** Agent ID if applicable */
  agentId?: string;

  /** Input data if applicable */
  input?: any;
}

/**
 * Plugin function signature
 *
 * Plugins are functions that receive PluginAPI (restricted) and return instance.
 *
 * SECURITY: Plugins receive PluginAPI, NOT TettoSDK (security boundary!)
 *
 * @param api - Restricted PluginAPI interface (secure)
 * @param options - Plugin-specific configuration
 * @returns Plugin instance with methods
 *
 * @since 2.0.0
 *
 * @example
 * ```typescript
 * export const MyPlugin: Plugin = (api: PluginAPI, options = {}) => {
 *   return {
 *     name: 'myPlugin',
 *     id: 'my-plugin',
 *
 *     async doSomething(param: string, wallet: TettoWallet) {
 *       // All methods MUST accept wallet parameter (security)
 *       return await api.callAgent('agent-id', { param }, wallet);
 *     }
 *   };
 * };
 * ```
 */
export interface Plugin {
  (api: import('./plugin-api').PluginAPI, options?: any): PluginInstance;
  id?: string;  // Optional static ID
}

/**
 * Plugin options (common across plugins)
 *
 * @since 2.0.0
 */
export interface PluginOptions {
  /** Custom property name (override default) */
  name?: string;

  /** Agent ID to use (override default) */
  agentId?: string;

  /** Enable debug logging */
  debug?: boolean;

  /** Additional plugin-specific options */
  [key: string]: any;
}

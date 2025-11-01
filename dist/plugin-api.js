"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPluginAPI = isPluginAPI;
/**
 * Type guard: Check if object is PluginAPI
 *
 * Used internally to validate plugin API instances.
 */
function isPluginAPI(obj) {
    return (typeof obj === 'object' &&
        typeof obj.callAgent === 'function' &&
        typeof obj.getAgent === 'function' &&
        typeof obj.listAgents === 'function' &&
        typeof obj.getConfig === 'function' &&
        typeof obj.hasPlugin === 'function');
}

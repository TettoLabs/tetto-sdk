"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultConfig = getDefaultConfig;
exports.createConnection = createConnection;
exports.getUSDCMint = getUSDCMint;
const web3_js_1 = require("@solana/web3.js");
const index_1 = require("./index");
/**
 * Get default configuration for a network
 *
 * @example
 * const config = getDefaultConfig('mainnet');
 */
function getDefaultConfig(network) {
    const defaults = index_1.NETWORK_DEFAULTS[network];
    return {
        apiUrl: defaults.apiUrl,
        network,
        protocolWallet: defaults.protocolWallet,
    };
}
/**
 * Create a Solana Connection for the specified network
 *
 * @param network - 'mainnet' or 'devnet'
 * @param customRpcUrl - Optional: Override default RPC
 *
 * @example
 * const connection = createConnection('mainnet');
 * const connection = createConnection('mainnet', 'https://mainnet.helius-rpc.com/?api-key=...');
 */
function createConnection(network, customRpcUrl) {
    const rpcUrl = customRpcUrl || index_1.NETWORK_DEFAULTS[network].rpcUrl;
    return new web3_js_1.Connection(rpcUrl, 'confirmed');
}
/**
 * Get USDC mint address for network
 */
function getUSDCMint(network) {
    return index_1.NETWORK_DEFAULTS[network].usdcMint;
}

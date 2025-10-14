import { Connection } from "@solana/web3.js";
import { NETWORK_DEFAULTS, TettoConfig } from "./index";

/**
 * Get default configuration for a network
 *
 * @example
 * const config = getDefaultConfig('mainnet');
 */
export function getDefaultConfig(network: 'mainnet' | 'devnet'): TettoConfig {
  const defaults = NETWORK_DEFAULTS[network];

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
export function createConnection(
  network: 'mainnet' | 'devnet',
  customRpcUrl?: string
): Connection {
  const rpcUrl = customRpcUrl || NETWORK_DEFAULTS[network].rpcUrl;

  return new Connection(rpcUrl, 'confirmed');
}

/**
 * Get USDC mint address for network
 */
export function getUSDCMint(network: 'mainnet' | 'devnet'): string {
  return NETWORK_DEFAULTS[network].usdcMint;
}

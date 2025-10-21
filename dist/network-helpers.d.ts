import { Connection } from "@solana/web3.js";
import { TettoConfig } from "./index";
/**
 * Get default configuration for a network
 *
 * @example
 * const config = getDefaultConfig('mainnet');
 */
export declare function getDefaultConfig(network: 'mainnet' | 'devnet'): TettoConfig;
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
export declare function createConnection(network: 'mainnet' | 'devnet', customRpcUrl?: string): Connection;
/**
 * Get USDC mint address for network
 */
export declare function getUSDCMint(network: 'mainnet' | 'devnet'): string;

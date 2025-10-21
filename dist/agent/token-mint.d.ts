/**
 * Get the correct token mint address for a given token and network.
 *
 * This prevents configuration errors by auto-deriving the mint address
 * from the token type and network, eliminating manual address entry.
 *
 * @param token - Token type ('USDC' or 'SOL')
 * @param network - Network ('mainnet' or 'devnet')
 * @returns Token mint address as string
 * @throws Error if invalid token/network combination
 *
 * @example
 * ```typescript
 * const mint = getTokenMint('USDC', 'mainnet');
 * // → 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
 * ```
 */
export declare function getTokenMint(token: 'USDC' | 'SOL', network: 'mainnet' | 'devnet'): string;

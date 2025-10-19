/**
 * Token mint addresses for USDC and SOL on different networks
 */
const TOKEN_MINTS = {
  mainnet: {
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    SOL: 'So11111111111111111111111111111111111111112',
  },
  devnet: {
    USDC: 'EGzSiubUqhzWFR2KxWCx6jHD6XNsVhKrnebjcQdN6qK4',
    SOL: 'So11111111111111111111111111111111111111112',
  },
} as const;

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
export function getTokenMint(
  token: 'USDC' | 'SOL',
  network: 'mainnet' | 'devnet'
): string {
  const mint = TOKEN_MINTS[network]?.[token];

  if (!mint) {
    throw new Error(
      `Unknown token/network combination: ${token} on ${network}. ` +
      `Valid combinations: USDC/SOL on mainnet/devnet.`
    );
  }

  return mint;
}

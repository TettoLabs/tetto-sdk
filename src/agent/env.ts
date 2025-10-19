/**
 * Configuration for required and optional environment variables
 */
export interface EnvConfig {
  [key: string]: 'required' | 'optional';
}

/**
 * Load and validate environment variables with clear error messages.
 *
 * Checks for required environment variables and throws a helpful error
 * if any are missing. Optional variables are included if present.
 *
 * @param config - Object mapping env var names to 'required' or 'optional'
 * @returns Object with validated environment variables
 * @throws Error if required variables are missing
 *
 * @example
 * ```typescript
 * const env = loadAgentEnv({
 *   ANTHROPIC_API_KEY: 'required',
 *   CLAUDE_MODEL: 'optional',
 * });
 *
 * // env.ANTHROPIC_API_KEY is guaranteed to exist
 * // env.CLAUDE_MODEL might be undefined
 * ```
 */
export function loadAgentEnv(
  config: EnvConfig
): Record<string, string | undefined> {
  const env: Record<string, string | undefined> = {};
  const missing: string[] = [];

  // Check each configured variable
  for (const [key, requirement] of Object.entries(config)) {
    const value = process.env[key];

    if (!value && requirement === 'required') {
      missing.push(key);
    } else {
      env[key] = value;
    }
  }

  // Throw helpful error if required vars are missing
  if (missing.length > 0) {
    const errorMessage =
      `Missing required environment variables:\n\n` +
      missing.map(key => `  ❌ ${key}`).join('\n') +
      `\n\nAdd these to your .env file or deployment environment.\n`;

    throw new Error(errorMessage);
  }

  return env;
}

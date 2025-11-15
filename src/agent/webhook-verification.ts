import crypto from 'crypto';

/**
 * Webhook signature verification for Tetto agent endpoints
 *
 * Verifies HMAC-SHA256 signatures on incoming requests to prevent
 * unauthorized direct calls to agent endpoints.
 *
 * @example
 * ```typescript
 * const verifier = new WebhookVerifier(process.env.TETTO_ENDPOINT_SECRET!);
 *
 * // In your agent handler
 * const signature = request.headers.get('x-tetto-signature');
 * const body = await request.text();
 *
 * const result = verifier.verify(signature, body);
 * if (!result.valid) {
 *   return Response.json({ error: result.error }, { status: 401 });
 * }
 *
 * // Continue processing...
 * ```
 */
export class WebhookVerifier {
  private secret: string;
  private maxTimestampAge: number;

  /**
   * Create a new webhook verifier
   *
   * @param secret - HMAC secret (from TETTO_ENDPOINT_SECRET env var)
   * @param maxTimestampAge - Maximum age of timestamp in seconds (default: 300 = 5 minutes)
   */
  constructor(secret: string, maxTimestampAge: number = 300) {
    if (!secret || secret.trim() === '') {
      throw new Error(
        'TETTO_ENDPOINT_SECRET is required for webhook verification. ' +
        'Get your secret from agent registration response and add to environment variables.'
      );
    }

    this.secret = secret;
    this.maxTimestampAge = maxTimestampAge;
  }

  /**
   * Verify webhook signature
   *
   * @param signatureHeader - Value of X-Tetto-Signature header (format: "t=timestamp,v1=signature")
   * @param requestBody - Raw request body as string
   * @returns Verification result with valid flag and optional error message
   */
  verify(
    signatureHeader: string | null,
    requestBody: string
  ): { valid: boolean; error?: string; timestamp?: number } {
    // Step 1: Validate signature header is present
    if (!signatureHeader) {
      return {
        valid: false,
        error: 'Missing X-Tetto-Signature header. Requests must be signed by Tetto platform.',
      };
    }

    // Step 2: Parse signature header (format: "t=timestamp,v1=signature")
    const parts = signatureHeader.split(',');
    let timestamp: number | null = null;
    let providedSignature: string | null = null;

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') {
        timestamp = parseInt(value, 10);
      } else if (key === 'v1') {
        providedSignature = value;
      }
    }

    if (!timestamp || !providedSignature) {
      return {
        valid: false,
        error: 'Invalid X-Tetto-Signature header format. Expected: t=timestamp,v1=signature',
      };
    }

    // Step 3: Check timestamp age (prevent replay attacks)
    const currentTime = Math.floor(Date.now() / 1000);
    const age = currentTime - timestamp;

    if (age > this.maxTimestampAge) {
      return {
        valid: false,
        error: `Request timestamp too old (${age}s > ${this.maxTimestampAge}s limit). Possible replay attack.`,
        timestamp,
      };
    }

    if (age < -60) {
      // Allow 60s clock skew tolerance
      return {
        valid: false,
        error: `Request timestamp is in the future (${Math.abs(age)}s ahead). Check server clock.`,
        timestamp,
      };
    }

    // Step 4: Compute expected signature
    const signaturePayload = `${timestamp}.${requestBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(signaturePayload)
      .digest('hex');

    // Step 5: Compare signatures (timing-safe comparison)
    const providedBuffer = Buffer.from(providedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (providedBuffer.length !== expectedBuffer.length) {
      return {
        valid: false,
        error: 'Invalid signature. Request not from Tetto platform.',
        timestamp,
      };
    }

    const signaturesMatch = crypto.timingSafeEqual(providedBuffer, expectedBuffer);

    if (!signaturesMatch) {
      return {
        valid: false,
        error: 'Invalid signature. Request not from Tetto platform.',
        timestamp,
      };
    }

    // Step 6: Success!
    return {
      valid: true,
      timestamp,
    };
  }
}

/**
 * Convenience function to verify webhook signature
 *
 * @param secret - HMAC secret (from TETTO_ENDPOINT_SECRET env var)
 * @param signatureHeader - Value of X-Tetto-Signature header
 * @param requestBody - Raw request body as string
 * @returns Verification result
 *
 * @example
 * ```typescript
 * const result = verifyWebhookSignature(
 *   process.env.TETTO_ENDPOINT_SECRET!,
 *   request.headers.get('x-tetto-signature'),
 *   await request.text()
 * );
 *
 * if (!result.valid) {
 *   return Response.json({ error: result.error }, { status: 401 });
 * }
 * ```
 */
export function verifyWebhookSignature(
  secret: string,
  signatureHeader: string | null,
  requestBody: string
): { valid: boolean; error?: string; timestamp?: number } {
  const verifier = new WebhookVerifier(secret);
  return verifier.verify(signatureHeader, requestBody);
}

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
export declare class WebhookVerifier {
    private secret;
    private maxTimestampAge;
    /**
     * Create a new webhook verifier
     *
     * @param secret - HMAC secret (from TETTO_ENDPOINT_SECRET env var)
     * @param maxTimestampAge - Maximum age of timestamp in seconds (default: 300 = 5 minutes)
     */
    constructor(secret: string, maxTimestampAge?: number);
    /**
     * Verify webhook signature
     *
     * @param signatureHeader - Value of X-Tetto-Signature header (format: "t=timestamp,v1=signature")
     * @param requestBody - Raw request body as string
     * @returns Verification result with valid flag and optional error message
     */
    verify(signatureHeader: string | null, requestBody: string): {
        valid: boolean;
        error?: string;
        timestamp?: number;
    };
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
export declare function verifyWebhookSignature(secret: string, signatureHeader: string | null, requestBody: string): {
    valid: boolean;
    error?: string;
    timestamp?: number;
};

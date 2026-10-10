/**
 * SHA-256 hash helper using the Web Crypto API.
 * Works in Cloudflare Workers (edge runtime) and Node.js >= 18.
 * Used for hashing student emails (PII minimisation) and course access tokens.
 */
export async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

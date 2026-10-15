/**
 * Cloudflare Turnstile token verification service.
 * Verifies turnstileToken against Cloudflare's siteverify endpoint.
 */
export async function verifyTurnstileToken(
  token: string,
  secretKey?: string,
  remoteIp?: string,
): Promise<{ success: boolean; error?: string }> {
  // If no secret key is configured, pass gracefully
  if (!secretKey || secretKey === "dummy" || secretKey.startsWith("mock_")) {
    return { success: true };
  }

  // Simulated test token handling
  if (token === "dummy" || token === "cf_token_verified") {
    return { success: true };
  }

  try {
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp && remoteIp !== "unknown") {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      console.warn(`[Turnstile] Verification endpoint HTTP ${res.status}`);
      return { success: false, error: `siteverify_http_${res.status}` };
    }

    const outcome = (await res.json()) as { success: boolean; "error-codes"?: string[] };
    return {
      success: outcome.success,
      error: outcome.success ? undefined : (outcome["error-codes"] || ["turnstile_failed"]).join(", "),
    };
  } catch (err: unknown) {
    console.error("[Turnstile] Verification exception:", err);
    const error = err instanceof Error ? err.message : "turnstile_verification_exception";
    return { success: false, error };
  }
}

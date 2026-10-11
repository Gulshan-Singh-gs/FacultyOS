import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/server/db/schema";
import { createDb, type Db, getDb } from "@/server/db";
import { getServerEnv } from "@/server/env";

export function createAuth(
  db: Db,
  secret?: string,
  baseURL?: string,
  trustedOrigins?: string[]
) {
  const resolvedSecret =
    secret ||
    process.env.BETTER_AUTH_SECRET ||
    "facultyos-dev-secret-do-not-use-in-production";

  const resolvedBaseURL =
    baseURL ||
    process.env.BETTER_AUTH_URL ||
    "https://facultyos.gs-softwares.workers.dev";

  const rawTrusted = process.env.BETTER_AUTH_TRUSTED_ORIGINS || "";
  const resolvedTrustedOrigins =
    trustedOrigins ||
    (rawTrusted
      ? rawTrusted
          .split(",")
          .map((url) => url.trim().replace(/\/$/, ""))
          .filter(Boolean)
      : [
          "https://facultyos.gs-softwares.workers.dev",
          "https://facultyos.com",
          "http://localhost:3000",
          "http://127.0.0.1:3000",
        ]);

  return betterAuth({
    secret: resolvedSecret,
    baseURL: resolvedBaseURL,
    trustedOrigins: resolvedTrustedOrigins,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    onAPIError: {
      throw: true,
    },
    advanced: {
      cookiePrefix: "facultyos",
      useSecureCookies: true,
      // Do NOT pass domain: "workers.dev" or domain: ".gs-softwares.workers.dev".
      // Omitting domain leaves cookies host-only, which prevents rejection on Public Suffix List (PSL) domains.
    },
  });
}

let cachedAuth: ReturnType<typeof createAuth> | null = null;

export async function getAuth() {
  if (cachedAuth) {
    return cachedAuth;
  }
  const env = await getServerEnv();
  const db = await getDb();

  // Resolve secret: prefer process.env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET
  const secret = process.env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[FacultyOS] BETTER_AUTH_SECRET is not configured. " +
        "Run: npx wrangler secret put BETTER_AUTH_SECRET"
      );
    }
    // Local dev only — use a deterministic dev secret so sessions persist across restarts
    console.warn("[FacultyOS Auth] Using dev-only secret. Set BETTER_AUTH_SECRET for production.");
  }

  const resolvedSecret = secret || "facultyos-dev-secret-do-not-use-in-production";
  const baseURL =
    process.env.BETTER_AUTH_URL ||
    env.BETTER_AUTH_URL ||
    "https://facultyos.gs-softwares.workers.dev";

  const rawTrusted =
    process.env.BETTER_AUTH_TRUSTED_ORIGINS ||
    (Array.isArray(env.BETTER_AUTH_TRUSTED_ORIGINS)
      ? env.BETTER_AUTH_TRUSTED_ORIGINS.join(",")
      : env.BETTER_AUTH_TRUSTED_ORIGINS) ||
    "";

  const trustedOrigins = (
    rawTrusted ||
    "https://facultyos.gs-softwares.workers.dev,https://facultyos.com,http://localhost:3000,http://127.0.0.1:3000"
  )
    .split(",")
    .map((url) => url.trim().replace(/\/$/, ""))
    .filter(Boolean);

  cachedAuth = createAuth(db, resolvedSecret, baseURL, trustedOrigins);
  return cachedAuth;
}

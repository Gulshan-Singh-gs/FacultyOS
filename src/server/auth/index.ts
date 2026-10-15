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
    (globalThis as any).__CF_ENV__?.BETTER_AUTH_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    "facultyos-dev-secret-do-not-use-in-production";

  const resolvedBaseURL =
    baseURL ||
    (globalThis as any).__CF_ENV__?.BETTER_AUTH_URL ||
    process.env.BETTER_AUTH_URL ||
    "https://facultyos.gs-softwares.workers.dev";

  const rawTrusted =
    (Array.isArray((globalThis as any).__CF_ENV__?.BETTER_AUTH_TRUSTED_ORIGINS)
      ? (globalThis as any).__CF_ENV__.BETTER_AUTH_TRUSTED_ORIGINS.join(",")
      : (globalThis as any).__CF_ENV__?.BETTER_AUTH_TRUSTED_ORIGINS) ||
    process.env.BETTER_AUTH_TRUSTED_ORIGINS ||
    "";
  const resolvedTrustedOrigins =
    trustedOrigins ||
    (rawTrusted
      ? rawTrusted
          .split(",")
          .map((url: string) => url.trim().replace(/\/$/, ""))
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

export async function getAuth() {
  const env = await getServerEnv();
  const db = await getDb();

  const secret =
    env.BETTER_AUTH_SECRET ||
    (globalThis as any).__CF_ENV__?.BETTER_AUTH_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    "facultyos-dev-secret-do-not-use-in-production";

  const baseURL =
    env.BETTER_AUTH_URL ||
    (globalThis as any).__CF_ENV__?.BETTER_AUTH_URL ||
    process.env.BETTER_AUTH_URL ||
    "https://facultyos.gs-softwares.workers.dev";

  const rawTrusted =
    (Array.isArray(env.BETTER_AUTH_TRUSTED_ORIGINS)
      ? env.BETTER_AUTH_TRUSTED_ORIGINS.join(",")
      : env.BETTER_AUTH_TRUSTED_ORIGINS) ||
    (Array.isArray((globalThis as any).__CF_ENV__?.BETTER_AUTH_TRUSTED_ORIGINS)
      ? (globalThis as any).__CF_ENV__.BETTER_AUTH_TRUSTED_ORIGINS.join(",")
      : (globalThis as any).__CF_ENV__?.BETTER_AUTH_TRUSTED_ORIGINS) ||
    process.env.BETTER_AUTH_TRUSTED_ORIGINS ||
    "";

  const trustedOrigins = (
    String(
      rawTrusted ||
        "https://facultyos.gs-softwares.workers.dev,https://facultyos.com,http://localhost:3000,http://127.0.0.1:3000"
    )
  )
    .split(",")
    .map((url: string) => url.trim().replace(/\/$/, ""))
    .filter(Boolean);

  return createAuth(db, secret, baseURL, trustedOrigins);
}

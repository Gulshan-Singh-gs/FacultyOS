import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/server/db/schema";
import { createDb, type Db } from "@/server/db";
import { getServerEnv } from "@/server/env";

export function createAuth(db: Db, secret: string, baseURL?: string) {
  return betterAuth({
    secret,
    baseURL:
      baseURL ||
      (process.env.NODE_ENV === "production"
        ? "https://facultyos.gs-softwares.workers.dev"
        : "http://localhost:3000"),
    trustedOrigins: (request?: Request) => {
      const allowed = [
        "https://facultyos.gs-softwares.workers.dev",
        "https://*.workers.dev",
        "https://facultyos.com",
        "https://*.facultyos.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ];
      if (process.env.BETTER_AUTH_TRUSTED_ORIGINS) {
        allowed.push(...process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map((s) => s.trim()));
      }
      if (request) {
        const origin = request.headers.get("origin");
        if (origin) allowed.push(origin);
        const host = request.headers.get("host");
        if (host) {
          allowed.push(`https://${host}`);
          allowed.push(`http://${host}`);
        }
      }
      return allowed;
    },
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
  const d1 =
    env.DB ||
    (env as any).facultyos ||
    (globalThis as any).__CF_ENV__?.DB ||
    (globalThis as any).DB;
  if (!d1) {
    throw new Error(
      "Missing D1 Database binding 'DB'. In Cloudflare Dashboard, go to Workers & Pages -> facultyos -> Settings -> Variables and Bindings -> Add D1 Database binding with Variable name 'DB'."
    );
  }
  const db = createDb(d1);

  // Resolve secret: prefer the Cloudflare Workers secret binding, then process.env (local dev only)
  const secret =
    env.BETTER_AUTH_SECRET ||
    (process.env as any).BETTER_AUTH_SECRET;

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
  const baseURL = (env as any).BETTER_AUTH_URL || undefined;
  cachedAuth = createAuth(db, resolvedSecret, baseURL);
  return cachedAuth;
}

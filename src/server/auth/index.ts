import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/server/db/schema";
import { createDb, type Db } from "@/server/db";
import { getServerEnv } from "@/server/env";

export function createAuth(db: Db, secret?: string, baseURL?: string) {
  return betterAuth({
    secret: secret || process.env.BETTER_AUTH_SECRET || "facultyos-default-secret-at-least-32-chars",
    baseURL:
      baseURL ||
      process.env.BETTER_AUTH_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://facultyos.gs-softwares.workers.dev"
        : "http://localhost:3000"),
    trustedOrigins: async (request?: Request) => {
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
    advanced: {
      cookiePrefix: "facultyos",
    },
  });
}

export async function getAuth() {
  const env = await getServerEnv();
  const db = createDb(env.DB);
  return createAuth(db, env.BETTER_AUTH_SECRET, (env as any).BETTER_AUTH_URL);
}

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/server/db/schema";
import { createDb, type Db } from "@/server/db";
import { getServerEnv } from "@/server/env";

export function createAuth(db: Db, secret?: string) {
  return betterAuth({
    secret: secret || process.env.BETTER_AUTH_SECRET || "facultyos-default-secret-at-least-32-chars",
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
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
  return createAuth(db, env.BETTER_AUTH_SECRET);
}

import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";
import { getServerEnv } from "@/server/env";

export function createDb(d1?: D1Database): DrizzleD1Database<typeof schema> {
  const resolvedD1 =
    d1 ||
    (globalThis as any).__CF_ENV__?.DB ||
    (globalThis as any).__CF_ENV__?.facultyos ||
    (globalThis as any).DB ||
    (globalThis as any).facultyos;

  if (!resolvedD1) {
    throw new Error(
      "Missing D1 Database binding 'DB'. In Cloudflare Dashboard, go to Workers & Pages -> facultyos -> Settings -> Variables and Bindings -> Add D1 Database binding with Variable name 'DB'."
    );
  }
  return drizzle(resolvedD1, { schema });
}

export async function getDb(): Promise<DrizzleD1Database<typeof schema>> {
  const env = await getServerEnv();
  const d1 =
    env.DB ||
    (env as any).facultyos ||
    (globalThis as any).__CF_ENV__?.DB ||
    (globalThis as any).__CF_ENV__?.facultyos ||
    (globalThis as any).DB;

  if (!d1) {
    throw new Error(
      "Missing D1 Database binding 'DB'. In Cloudflare Dashboard, go to Workers & Pages -> facultyos -> Settings -> Variables and Bindings -> Add D1 Database binding with Variable name 'DB'."
    );
  }
  return createDb(d1);
}

export type Db = ReturnType<typeof createDb>;


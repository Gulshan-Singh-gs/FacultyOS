import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";
import { getServerEnv } from "@/server/env";

export function createDb(d1: D1Database): DrizzleD1Database<typeof schema> {
  return drizzle(d1, { schema });
}

export async function getDb(): Promise<DrizzleD1Database<typeof schema>> {
  const env = await getServerEnv();
  if (!env.DB) {
    throw new Error(
      "Missing D1 Database binding 'DB'. In Cloudflare Dashboard, go to Workers & Pages -> facultyos -> Settings -> Variables and Bindings -> Add D1 Database binding with Variable name 'DB'."
    );
  }
  return createDb(env.DB);
}

export type Db = ReturnType<typeof createDb>;


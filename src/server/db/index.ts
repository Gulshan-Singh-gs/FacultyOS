import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";
import { getServerEnv } from "@/server/env";

/**
 * Creates a mock/fallback D1 database proxy.
 * Prevents module top-level crashes (`Cannot read properties of undefined (reading 'prepare')`)
 * during build time, Next.js static page generation, or cold starts when DB binding is absent.
 */
function createFallbackD1(): D1Database {
  const dummyStatement = {
    bind: () => dummyStatement,
    first: async () => null,
    all: async () => ({ results: [], success: true, meta: {} as unknown as D1Response["meta"] }),
    raw: async () => [],
    run: async () => ({ success: true, meta: {} as unknown as D1Response["meta"] }),
  } as unknown as D1PreparedStatement;

  return {
    prepare: () => dummyStatement,
    dump: async () => new ArrayBuffer(0),
    batch: async () => [],
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as D1Database;
}

type BindingStore = {
  DB?: D1Database;
  facultyos?: D1Database;
  __CF_ENV__?: { DB?: D1Database; facultyos?: D1Database };
};

/**
 * Dynamically resolves the Cloudflare D1 database binding `DB`.
 * Resolves across:
 * 1. Explicit parameter `d1`
 * 2. globalThis.__CF_ENV__ (attached by worker entrypoint)
 * 3. getCloudflareContext() from @opennextjs/cloudflare (within request context)
 * 4. globalThis.DB / globalThis.facultyos
 * 5. process.env.DB / process.env.facultyos (for local dev, tests, or migration scripts)
 */
export function getD1Binding(d1?: D1Database): D1Database | undefined {
  if (d1 && typeof d1.prepare === "function") {
    return d1;
  }

  const g = globalThis as unknown as BindingStore;
  const p = process.env as unknown as BindingStore;

  // 1. Check globalThis.__CF_ENV__ (populated on Cloudflare request)
  if (g.__CF_ENV__?.DB && typeof g.__CF_ENV__.DB.prepare === "function") {
    return g.__CF_ENV__.DB;
  }
  if (g.__CF_ENV__?.facultyos && typeof g.__CF_ENV__.facultyos.prepare === "function") {
    return g.__CF_ENV__.facultyos;
  }

  // 2. Dynamic check via @opennextjs/cloudflare getCloudflareContext()
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    if (ctx?.env?.DB && typeof ctx.env.DB.prepare === "function") {
      return ctx.env.DB;
    }
    if (ctx?.env?.facultyos && typeof ctx.env.facultyos.prepare === "function") {
      return ctx.env.facultyos;
    }
  } catch {
    // Outside active Cloudflare request context
  }

  // 3. Check globalThis bindings directly
  if (g.DB && typeof g.DB.prepare === "function") {
    return g.DB;
  }
  if (g.facultyos && typeof g.facultyos.prepare === "function") {
    return g.facultyos;
  }

  // 4. Check process.env (e.g. Miniflare / local tests / migration scripts)
  if (p.DB && typeof p.DB.prepare === "function") {
    return p.DB;
  }
  if (p.facultyos && typeof p.facultyos.prepare === "function") {
    return p.facultyos;
  }

  return undefined;
}

/**
 * Creates a Drizzle D1 database instance.
 * Dynamically retrieves D1 binding if omitted, and provides a safe fallback
 * proxy during build time or cold starts to prevent crashes.
 */
export function createDb(d1?: D1Database): DrizzleD1Database<typeof schema> {
  const resolvedD1 = getD1Binding(d1);

  if (!resolvedD1) {
    // Return safe fallback D1 database to prevent "Cannot read properties of undefined (reading 'prepare')"
    return drizzle(createFallbackD1(), { schema });
  }

  return drizzle(resolvedD1, { schema });
}

/**
 * Asynchronously retrieves the D1 database instance, ensuring environment is loaded.
 */
export async function getDb(): Promise<DrizzleD1Database<typeof schema>> {
  const env = await getServerEnv();
  const d1 =
    env.DB ||
    (env as unknown as { facultyos?: D1Database }).facultyos ||
    getD1Binding();

  if (!d1 || typeof d1.prepare !== "function") {
    // During Next.js build / prerender, return safe fallback
    if (
      process.env.OPEN_NEXT_BUILDING_NEXT === "1" ||
      process.env.NEXT_PHASE === "phase-production-build"
    ) {
      return createDb();
    }
    throw new Error(
      "Missing D1 Database binding 'DB'. In Cloudflare Dashboard, go to Workers & Pages -> facultyos -> Settings -> Variables and Bindings -> Add D1 Database binding with Variable name 'DB'."
    );
  }

  return createDb(d1);
}

export type Db = ReturnType<typeof createDb>;

/**
 * Executes a callback within a transaction where supported.
 * Cloudflare D1 does not support interactive SQL `BEGIN`/`COMMIT` transactions over the wire
 * (throwing: "To execute a transaction, please use the state.storage.transaction() ... instead of the SQL BEGIN TRANSACTION").
 * When running against Cloudflare D1, queries execute directly on the D1 client connection.
 * When running against relational mock drivers or test runners that support interactive transactions,
 * `db.transaction()` is used.
 */
export async function withTransaction<T>(
  db: Db,
  fn: (tx: Db) => Promise<T>,
): Promise<T> {
  const rawDb = db as unknown as {
    session?: { client?: { prepare?: unknown } };
    transaction?: (fn: (tx: Db) => Promise<T>) => Promise<T>;
  };
  const isD1 =
    rawDb.session?.client &&
    typeof rawDb.session.client.prepare === "function";

  if (!isD1 && typeof rawDb.transaction === "function") {
    try {
      return await rawDb.transaction(fn);
    } catch {
      return await fn(db);
    }
  }

  return await fn(db);
}

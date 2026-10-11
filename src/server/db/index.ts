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
    all: async () => ({ results: [], success: true, meta: {} as any }),
    raw: async () => [],
    run: async () => ({ success: true, meta: {} as any }),
  } as unknown as D1PreparedStatement;

  return {
    prepare: () => dummyStatement,
    dump: async () => new ArrayBuffer(0),
    batch: async () => [],
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as D1Database;
}

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

  // 1. Check globalThis.__CF_ENV__ (populated on Cloudflare request)
  if (
    (globalThis as any).__CF_ENV__?.DB &&
    typeof (globalThis as any).__CF_ENV__.DB.prepare === "function"
  ) {
    return (globalThis as any).__CF_ENV__.DB;
  }
  if (
    (globalThis as any).__CF_ENV__?.facultyos &&
    typeof (globalThis as any).__CF_ENV__.facultyos.prepare === "function"
  ) {
    return (globalThis as any).__CF_ENV__.facultyos;
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
  if (
    (globalThis as any).DB &&
    typeof (globalThis as any).DB.prepare === "function"
  ) {
    return (globalThis as any).DB;
  }
  if (
    (globalThis as any).facultyos &&
    typeof (globalThis as any).facultyos.prepare === "function"
  ) {
    return (globalThis as any).facultyos;
  }

  // 4. Check process.env (e.g. Miniflare / local tests / migration scripts)
  if (
    (process.env as any).DB &&
    typeof (process.env as any).DB.prepare === "function"
  ) {
    return (process.env as any).DB;
  }
  if (
    (process.env as any).facultyos &&
    typeof (process.env as any).facultyos.prepare === "function"
  ) {
    return (process.env as any).facultyos;
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
    (env as any).facultyos ||
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

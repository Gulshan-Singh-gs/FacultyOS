import { describe, it, expect } from "vitest";
import { createAuth } from "@/server/auth";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/server/db/schema";

describe("Better Auth Server Configuration", () => {
  it("initializes Better Auth with drizzle sqlite adapter and facultyos cookie prefix", () => {
    const fakeD1 = {
      prepare: () => ({
        bind: () => ({
          all: async () => ({ results: [] }),
        }),
      }),
    } as any;

    const db = drizzle(fakeD1, { schema });
    const auth = createAuth(db, "test-auth-secret-key-that-is-at-least-32-chars");

    expect(auth).toBeDefined();
    expect(auth.handler).toBeTypeOf("function");
    expect(auth.api).toBeDefined();
    expect(auth.options.advanced?.cookiePrefix).toBe("facultyos");
    expect(auth.options.emailAndPassword?.enabled).toBe(true);
  });
});

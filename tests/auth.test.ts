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

  it("configures trustedOrigins with deployment origins and dynamic request origin", async () => {
    const fakeD1 = {
      prepare: () => ({
        bind: () => ({
          all: async () => ({ results: [] }),
        }),
      }),
    } as any;

    const db = drizzle(fakeD1, { schema });
    const auth = createAuth(db, "test-auth-secret-key-that-is-at-least-32-chars");

    expect(auth.options.trustedOrigins).toBeDefined();
    if (typeof auth.options.trustedOrigins === "function") {
      const mockRequest = new Request("https://facultyos.gs-softwares.workers.dev/api/auth/sign-up/email", {
        headers: {
          origin: "https://facultyos.gs-softwares.workers.dev",
          host: "facultyos.gs-softwares.workers.dev",
        },
      });
      const origins = await (auth.options.trustedOrigins as any)(mockRequest);
      expect(origins).toContain("https://facultyos.gs-softwares.workers.dev");
      expect(origins).toContain("http://localhost:3000");
    }
  });

  it("returns null session gracefully when no cookie header is present", async () => {
    const fakeD1 = {
      prepare: () => ({
        bind: () => ({
          all: async () => ({ results: [] }),
        }),
      }),
    } as any;

    const db = drizzle(fakeD1, { schema });
    const auth = createAuth(db, "test-auth-secret-key-that-is-at-least-32-chars");

    const session = await auth.api.getSession({ headers: new Headers() });
    expect(session).toBeNull();
  });
});

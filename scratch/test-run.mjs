async function test() {
  const { handler } = await import("../.open-next/server-functions/default/handler.mjs");
  const req = new Request("http://localhost:3000/dashboard", {
    headers: {
      cookie: "facultyos.session_token=test_token_123",
      accept: "text/html"
    }
  });

  const mockD1 = {
    prepare: (query) => ({
      bind: (...args) => ({
        first: async () => {
          if (query.toLowerCase().includes("session")) {
            return {
              id: "sess_1",
              userId: "user_1",
              token: "test_token_123",
              expiresAt: new Date(Date.now() + 86400000),
              expires_at: Date.now() + 86400000,
            };
          }
          if (query.toLowerCase().includes("user")) {
            return {
              id: "user_1",
              email: "prof@example.com",
              name: "Professor Test",
            };
          }
          if (query.toLowerCase().includes("professor_profile")) {
            return {
              id: "prof_1",
              userId: "user_1",
              displayName: "Professor Test",
              plan: "free",
              timezone: "Asia/Kolkata",
              aiEnabled: false,
            };
          }
          return null;
        },
        all: async () => ({ results: [], success: true, meta: {} }),
        raw: async () => [],
        run: async () => ({ success: true, meta: {} })
      })
    })
  };

  const env = {
    DB: mockD1,
    BETTER_AUTH_SECRET: "testsecret123456789012345678901234",
    BETTER_AUTH_URL: "http://localhost:3000",
    RESEND_API_KEY: "test_key"
  };

  globalThis.__CF_ENV__ = env;
  globalThis.DB = mockD1;

  const ctx = {
    waitUntil: (p) => { Promise.resolve(p).catch(console.error); }
  };

  console.log("Starting test request...");
  try {
    const res = await handler(req, env, ctx);
    console.log("Res status:", res.status);
    console.log("Res body:", await res.text());
  } catch (e) {
    console.error("Handler error:", e);
  }
}

test();

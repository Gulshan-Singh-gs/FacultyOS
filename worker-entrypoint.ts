// @ts-ignore
import handler from "./.open-next/worker.js";
import { handleQueue, type QueueMessageBody, type QueueConsumerEnv } from "./src/workers/queue-consumer";
import { handleCron } from "./src/workers/cron";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/inbox",
  "/courses",
  "/boundaries",
  "/ledger",
  "/requests",
  "/settings",
];

function extractSessionToken(cookieHeader: string): string | null {
  if (!cookieHeader) return null;
  const match =
    cookieHeader.match(/(?:facultyos|better-auth)\.session_token=([^;]+)/i) ||
    cookieHeader.match(/session_token=([^;]+)/i);
  if (!match || !match[1]) return null;
  let raw = decodeURIComponent(match[1].trim());
  if (raw.includes(".")) {
    raw = raw.split(".")[0];
  }
  return raw;
}

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const cookie = request.headers.get("cookie") || "";
    (globalThis as any).__CF_ENV__ = env;
    (globalThis as any).__CF_CTX__ = ctx;
    if (env) {
      (globalThis as any).DB = env.DB || env.facultyos;
      (globalThis as any).NOTIFICATIONS = env.NOTIFICATIONS || env.notifications;
      (globalThis as any).RATE_LIMIT = env.RATE_LIMIT || env.rate_limit;
    }

    // Fast-path: protect dashboard routes.
    // If no session exists or session token is invalid/expired in D1, redirect to /login immediately.
    // This responds in <20ms at the edge without invoking the Next.js RSC pipeline.
    const isProtected = PROTECTED_PREFIXES.some(
      (prefix) => url.pathname === prefix || url.pathname.startsWith(prefix + "/")
    );

    if (isProtected) {
      const token = extractSessionToken(cookie);
      if (!token) {
        console.log("[FACULTYOS_ENTRY] fast redirect unauthenticated (no token) to /login for:", url.pathname);
        return Response.redirect(new URL("/login", request.url).href, 307);
      }

      const d1 = env?.DB || env?.facultyos;
      if (d1 && typeof d1.prepare === "function") {
        try {
          const now = Date.now();
          const sessionRow = await d1
            .prepare("SELECT user_id FROM session WHERE token = ? AND expires_at > ? LIMIT 1")
            .bind(token, now)
            .first();

          if (!sessionRow) {
            console.log("[FACULTYOS_ENTRY] fast redirect unauthenticated (invalid/expired session in D1) to /login for:", url.pathname);
            return Response.redirect(new URL("/login", request.url).href, 307);
          }
        } catch (dbErr) {
          console.warn("[FACULTYOS_ENTRY] edge session check error, proceeding to app:", dbErr);
        }
      }
    }

    try {
      if (handler && typeof (handler as any).fetch === "function") {
        const res = await (handler as any).fetch(request, env, ctx);
        console.log("[FACULTYOS_ENTRY] response:", res?.status, url.pathname);
        return res;
      }
      return new Response("FacultyOS Worker Initializing", { status: 503 });
    } catch (err: any) {
      console.error("[FacultyOS Worker Entrypoint Exception]", err);
      return new Response(
        `FacultyOS Server Error:\n${err?.stack || err?.message || String(err)}\n\nURL: ${request.url}`,
        {
          status: 500,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        },
      );
    }
  },

  async queue(
    batch: MessageBatch<QueueMessageBody>,
    env: QueueConsumerEnv,
    _ctx: ExecutionContext,
  ): Promise<void> {
    (globalThis as any).__CF_ENV__ = env;
    return handleQueue(batch, env);
  },

  async scheduled(
    event: ScheduledEvent,
    env: any,
    ctx: ExecutionContext,
  ): Promise<void> {
    (globalThis as any).__CF_ENV__ = env;
    (globalThis as any).__CF_CTX__ = ctx;
    return handleCron(event, env, ctx);
  },
};

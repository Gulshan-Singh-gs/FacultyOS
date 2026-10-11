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

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    console.log("[FACULTYOS_ENTRY] fetch:", request.method, url.pathname);
    (globalThis as any).__CF_ENV__ = env;
    (globalThis as any).__CF_CTX__ = ctx;
    if (env) {
      (globalThis as any).DB = env.DB || env.facultyos;
      (globalThis as any).NOTIFICATIONS = env.NOTIFICATIONS || env.notifications;
    }

    // Fast-path: protect dashboard routes when no session cookie exists.
    // This responds in <15ms at the edge without invoking the Next.js RSC pipeline,
    // avoiding unnecessary SSR overhead and eliminating Worker hang conditions.
    const isProtected = PROTECTED_PREFIXES.some(
      (prefix) => url.pathname === prefix || url.pathname.startsWith(prefix + "/")
    );
    const cookie = request.headers.get("cookie") || "";
    const hasSessionCookie = cookie.includes("session_token");

    if (isProtected && !hasSessionCookie) {
      console.log("[FACULTYOS_ENTRY] fast redirect unauthenticated to /login for:", url.pathname);
      return Response.redirect(new URL("/login", request.url).href, 307);
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

// @ts-ignore
import handler from "./.open-next/worker.js";
import { handleQueue, type QueueMessageBody, type QueueConsumerEnv } from "./src/workers/queue-consumer";
import { handleCron } from "./src/workers/cron";

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    (globalThis as any).__CF_ENV__ = env;
    (globalThis as any).__CF_CTX__ = ctx;
    try {
      if (handler && typeof (handler as any).fetch === "function") {
        return await (handler as any).fetch(request, env, ctx);
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

// @ts-ignore
import handler from "./.open-next/worker.js";
import { handleQueue, type QueueMessageBody, type QueueConsumerEnv } from "./src/workers/queue-consumer";
import { handleCron } from "./src/workers/cron";

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    if (handler && typeof (handler as any).fetch === "function") {
      return (handler as any).fetch(request, env, ctx);
    }
    return new Response("FacultyOS Worker Initializing", { status: 503 });
  },

  async queue(
    batch: MessageBatch<QueueMessageBody>,
    env: QueueConsumerEnv,
    _ctx: ExecutionContext,
  ): Promise<void> {
    return handleQueue(batch, env);
  },

  async scheduled(
    event: ScheduledEvent,
    env: any,
    ctx: ExecutionContext,
  ): Promise<void> {
    return handleCron(event, env, ctx);
  },
};

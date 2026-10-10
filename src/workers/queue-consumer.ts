/**
 * Cloudflare Queue Consumer — processes notification and AI job queues.
 * Runs as a queue consumer bound to `notifications` and `ai-jobs` queues
 * (defined in wrangler.toml).
 */
export default {
  async queue(
    batch: MessageBatch<{ type: string; requestId?: string; courseId?: string }>,
    env: {
      DB: D1Database;
      NOTIFICATIONS: Queue;
      AI_JOBS: Queue;
    },
  ): Promise<void> {
    for (const msg of batch.messages) {
      const { type, requestId } = msg.body;

      switch (type) {
        case "request_created":
          // TODO Phase 3: check professor boundaries before sending notification
          console.log(`[queue] request_created: ${requestId}`);
          msg.ack();
          break;

        case "ai_job":
          // TODO Phase 3: call Workers AI, write to ai_jobs table
          console.log(`[queue] ai_job: ${requestId}`);
          msg.ack();
          break;

        default:
          console.warn(`[queue] unknown message type: ${type}`);
          msg.ack();
      }
    }
  },
};

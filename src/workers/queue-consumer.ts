/**
 * Cloudflare Queue Consumer — processes notification and AI job queues.
 * Bound to `notifications` and `ai-jobs` queues defined in wrangler.toml.
 */
import { createDb } from "@/server/db";
import { processNotificationQueueMessage } from "@/server/services/notifications";
import type { FacultyOSEnv } from "@/server/env";

export interface QueueMessageBody {
  type: "request_created" | "status_updated" | "ai_job" | string;
  requestId: string;
  courseId?: string;
  [key: string]: unknown;
}

export interface QueueConsumerEnv extends FacultyOSEnv {
  DB: D1Database;
  NOTIFICATIONS: Queue;
  AI_JOBS: Queue;
}

export async function handleQueue(
  batch: MessageBatch<QueueMessageBody>,
  env: QueueConsumerEnv,
): Promise<void> {
  const db = createDb(env.DB);

  for (const msg of batch.messages) {
    try {
      const { type, requestId } = msg.body;

      switch (type) {
        case "request_created": {
          console.log(`[queue:notifications] Processing request_created for ${requestId}`);
          await processNotificationQueueMessage(db, env, msg.body);
          msg.ack();
          break;
        }

        case "ai_job": {
          // Reserved for Phase 3: Workers AI extraction and drafting
          console.log(`[queue:ai-jobs] Processing ai_job for ${requestId}`);
          msg.ack();
          break;
        }

        default: {
          console.warn(`[queue:unknown] Unhandled message type: ${type}`);
          msg.ack();
        }
      }
    } catch (error) {
      console.error(`[queue:error] Failed to process message ${msg.id}:`, error);
      // Acknowledge failed message to prevent poison pill loops in development
      msg.ack();
    }
  }
}

const queueConsumer = {
  queue: handleQueue,
};

export default queueConsumer;

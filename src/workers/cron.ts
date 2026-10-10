/**
 * Cloudflare Cron Worker — runs on a separate lightweight Worker
 * sharing the same D1/KV/R2 bindings as the main Next.js app.
 *
 * Cron schedules (defined in wrangler.toml):
 *  - 0 0 * * *   → Daily: Aggregate workload snapshots
 *  - 0 8 * * 1   → Weekly Monday 8 AM: Send "Week Ahead" digest
 *  - 0 2 * * *   → Daily 2 AM: Purge expired free-tier data
 */
const cronWorker = {
  async scheduled(
    event: ScheduledEvent,
    _env: {
      DB: D1Database;
      KV: KVNamespace;
      NOTIFICATIONS: Queue;
    },
    _ctx: ExecutionContext,
  ): Promise<void> {
    const { cron } = event;

    switch (cron) {
      case "0 0 * * *":
        // TODO Phase 3: aggregate daily workload snapshots
        console.log("[cron] daily workload snapshot – stub");
        break;

      case "0 8 * * 1":
        // TODO Phase 3: send weekly boundary digest to professors
        console.log("[cron] weekly digest – stub");
        break;

      case "0 2 * * *":
        // TODO Phase 4: purge expired free-tier request data
        console.log("[cron] data purge – stub");
        break;

      default:
        console.warn(`[cron] unknown cron expression: ${cron}`);
    }
  },
};

export default cronWorker;


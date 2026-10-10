import React from "react";
import { eq } from "drizzle-orm";
import { requireProfile } from "@/server/auth/session";
import { createDb } from "@/server/db";
import { getServerEnv } from "@/server/env";
import { boundaries } from "@/server/db/schema";

export const dynamic = "force-dynamic";

export default async function BoundariesPage() {
  const { profile } = await requireProfile();
  const env = await getServerEnv();
  const db = createDb(env.DB);

  const [bnd] = await db
    .select()
    .from(boundaries)
    .where(eq(boundaries.profileId, profile.id))
    .limit(1);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Work-Life Boundaries
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Configure working hours, response SLAs, and after-hours notification deferral.
          </p>
        </div>
      </div>

      <div className="card-neu p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">
              Working Hours
            </label>
            <div className="p-3 input-neu text-sm font-medium">
              {bnd?.workStart || "09:00"} - {bnd?.workEnd || "18:00"} ({profile.timezone})
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--text-secondary)]">
              Response SLA
            </label>
            <div className="p-3 input-neu text-sm font-medium">
              Within {bnd?.responseSlaHours || 48} Hours (Working Days Only)
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                Weekend Notification Deferral
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                Requests submitted on Saturday or Sunday do not trigger notifications until Monday 9:00 AM.
              </div>
            </div>
            <span className="glass-badge">Active</span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                Auto-Acknowledgment Message
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                Sent to students when submitting after-hours.
              </div>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[var(--bg-input)] text-xs text-[var(--text-primary)] font-sans">
            {bnd?.autoReplyTemplate ||
              "Thank you for your submission. Requests received outside standard office hours are queued and reviewed during business hours."}
          </div>
        </div>
      </div>
    </div>
  );
}

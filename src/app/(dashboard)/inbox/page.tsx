import React from "react";
import Link from "next/link";
import { requireProfile } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  await requireProfile();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Triage Inbox
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Review student requests requiring professor intervention.
          </p>
        </div>
      </div>

      <div className="card-neu p-10 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-xl bg-[var(--bg-input)] flex items-center justify-center text-[var(--accent-primary)] shadow-[var(--shadow-neu-inset)]">
          ✓
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Inbox Zero
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            All current student requests have been evaluated by your deterministic policies. No pending decisions.
          </p>
        </div>
        <Link href="/courses" className="btn-secondary px-4 py-2 text-xs font-semibold inline-block">
          View Courses →
        </Link>
      </div>
    </div>
  );
}

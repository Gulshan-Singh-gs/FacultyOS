import React from "react";
import { eq } from "drizzle-orm";
import { requireProfile } from "@/server/auth/session";
import { createDb } from "@/server/db";
import { getServerEnv } from "@/server/env";
import { ledgerEntries } from "@/server/db/schema";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const { profile } = await requireProfile();
  const env = await getServerEnv();
  const db = createDb(env.DB);

  const entries = await db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.profileId, profile.id))
    .orderBy(ledgerEntries.createdAt);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Career & Service Ledger
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Log hidden institutional service, committees, publications, and grant milestones.
          </p>
        </div>
      </div>

      <div className="card-neu p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {entries.length === 0
            ? "No career ledger entries logged yet."
            : `${entries.length} entry/entries logged.`}
        </p>
        <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
          In Phase 4, you can upload evidence directly to R2 and generate one-click annual review dossiers.
        </p>
      </div>
    </div>
  );
}

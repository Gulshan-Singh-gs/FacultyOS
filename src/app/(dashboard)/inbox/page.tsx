import React from "react";
import type { Metadata } from "next";
import { requireProfile } from "@/server/auth/session";
import { createDb } from "@/server/db";
import { getServerEnv } from "@/server/env";
import {
  getInboxRequestsForProfile,
  type InboxQueueKey,
} from "@/server/services/requests";
import { InboxView } from "@/components/inbox/inbox-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Triage Inbox • FacultyOS",
  description: "Professor inbox and deterministic policy triage",
};

interface InboxPageProps {
  searchParams: Promise<{ queue?: string }>;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const { profile } = await requireProfile();
  const { queue } = await searchParams;
  const env = await getServerEnv();
  const db = createDb(env.DB);

  const validQueues: InboxQueueKey[] = [
    "needs_decision",
    "needs_student_info",
    "urgent",
    "auto_resolved",
    "ta_review",
    "closed",
    "all",
  ];

  const selectedQueue: InboxQueueKey = validQueues.includes(
    queue as InboxQueueKey,
  )
    ? (queue as InboxQueueKey)
    : "needs_decision";

  const { items, counts } = await getInboxRequestsForProfile(
    db,
    profile.id,
    selectedQueue,
  );

  return (
    <InboxView
      initialQueue={selectedQueue}
      items={items}
      counts={counts}
    />
  );
}

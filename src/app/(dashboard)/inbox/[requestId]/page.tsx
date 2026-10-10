import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireProfile } from "@/server/auth/session";
import { createDb } from "@/server/db";
import { getServerEnv } from "@/server/env";
import {
  getRequestDetailWithOwnership,
  RequestAccessError,
} from "@/server/services/requests";
import { RequestDetailView } from "@/components/inbox/request-detail-view";

export const dynamic = "force-dynamic";

interface RequestDetailPageProps {
  params: Promise<{ requestId: string }>;
}

export const metadata: Metadata = {
  title: "Request Detail • FacultyOS",
  description: "Request detail, policy explainability snapshot, and decision triage",
};

export default async function RequestDetailPage({
  params,
}: RequestDetailPageProps) {
  const { requestId } = await params;
  const { profile } = await requireProfile();
  const env = await getServerEnv();
  const db = createDb(env.DB);

  let data;
  try {
    data = await getRequestDetailWithOwnership(db, profile.id, requestId);
  } catch (err) {
    if (err instanceof RequestAccessError) {
      notFound();
    }
    notFound();
  }

  return <RequestDetailView data={data} />;
}

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createDb } from "@/server/db";
import { getServerEnv } from "@/server/env";
import { requests, courses } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { CheckCircle2, Clock, AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react";
import { MedicalBoundaryBanner } from "@/components/portal/medical-boundary-banner";

export const dynamic = "force-dynamic";

interface RequestStatusPageProps {
  params: Promise<{ requestToken: string }>;
}

export const metadata: Metadata = {
  title: "Request Status • FacultyOS",
  robots: { index: false, follow: false },
};

export default async function RequestStatusPage({
  params,
}: RequestStatusPageProps) {
  const { requestToken } = await params;
  const env = await getServerEnv();
  const db = createDb(env.DB);

  const [req] = await db
    .select({
      id: requests.id,
      publicToken: requests.publicToken,
      requestType: requests.requestType,
      status: requests.status,
      decisionReasonJson: requests.decisionReasonJson,
      penaltyPercent: requests.penaltyPercent,
      createdAt: requests.createdAt,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
    })
    .from(requests)
    .leftJoin(courses, eq(requests.courseId, courses.id))
    .where(eq(requests.publicToken, requestToken))
    .limit(1);

  if (!req) {
    notFound();
  }

  let reasons: string[] = [];
  try {
    if (req.decisionReasonJson) {
      reasons = JSON.parse(req.decisionReasonJson) as string[];
    }
  } catch {
    reasons = [];
  }

  const isApproved = req.status === "auto_approved";
  const isDenied = req.status === "auto_denied";

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] px-4 py-8 sm:py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <MedicalBoundaryBanner compact />

        <div className="card-neu p-6 sm:p-10 space-y-6 border border-[var(--border-neu-card)]">
          <div className="flex items-center justify-between border-b border-[var(--border-neu-card)]/60 pb-4">
            <div>
              <span className="glass-badge text-[11px] font-bold">
                {req.courseCode || "Course Request"}
              </span>
              <h1 className="text-xl font-bold text-[var(--text-primary)] mt-1 capitalize">
                {req.requestType.replace("_", " ")} Request
              </h1>
            </div>
            <div className="text-right text-xs text-[var(--text-muted)]">
              <div>Ref: #{req.publicToken.slice(0, 8)}</div>
              <div>{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : ""}</div>
            </div>
          </div>

          {/* Status Display Card */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-neu-card)] space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-2xl ${
                  isApproved
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : isDenied
                      ? "bg-rose-500/10 text-rose-500"
                      : "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                }`}
              >
                {isApproved ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : isDenied ? (
                  <AlertCircle className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6" />
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                  Current Status
                </span>
                <div className="text-base font-bold text-[var(--text-primary)] capitalize">
                  {req.status.replace("_", " ")}
                </div>
              </div>
            </div>

            {req.penaltyPercent !== null && req.penaltyPercent !== undefined && req.penaltyPercent > 0 && (
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Applied policy penalty: -{req.penaltyPercent}% per syllabus deduction guidelines.
              </div>
            )}
          </div>

          {/* Policy Citation / Reasons (Hard Rule 8 Explainability) */}
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Policy Evaluation Notes (Hard Rule 8)</span>
            </div>
            {reasons.length > 0 ? (
              <ul className="space-y-1.5 list-disc pl-5 text-[var(--text-secondary)]">
                {reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[var(--text-secondary)]">
                Request evaluated deterministically under active course syllabus policies.
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-[var(--border-neu-card)]/60 flex justify-between items-center text-xs">
            <Link
              href="/"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>FacultyOS Home</span>
            </Link>
            <span className="text-[var(--text-muted)] text-[11px]">
              End-to-end audit logged
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

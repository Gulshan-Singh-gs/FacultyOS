import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createDb } from "@/server/db";
import { getServerEnv } from "@/server/env";
import { requests, courses, professorProfiles } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { MedicalBoundaryBanner } from "@/components/portal/medical-boundary-banner";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const dynamic = "force-dynamic";

interface RequestStatusPageProps {
  params: Promise<{ requestToken: string }>;
}

export const metadata: Metadata = {
  title: "Request Status • FacultyOS",
  robots: { index: false, follow: false },
};

function formatStatus(status: string) {
  switch (status) {
    case "auto_approved":
      return {
        label: "Approved per Course Policy",
        desc: "Your request meets the criteria defined in the course syllabus and has been approved automatically.",
        icon: CheckCircle2,
        colorClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      };
    case "auto_denied":
      return {
        label: "Not Eligible per Policy",
        desc: "Your request does not satisfy the necessary syllabus conditions for this request type.",
        icon: AlertCircle,
        colorClass: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30",
      };
    case "needs_student_info":
      return {
        label: "Additional Information Needed",
        desc: "Your instructor or teaching assistant needs further clarification before making a decision.",
        icon: Clock,
        colorClass: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
      };
    case "manual_review":
    case "submitted":
    default:
      return {
        label: "Under Review by Instructor",
        desc: "Your request has been routed to your instructor's queue for human academic review.",
        icon: Clock,
        colorClass: "text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30",
      };
  }
}

function formatReasons(reasons: string[], status: string): string[] {
  if (reasons && reasons.length > 0) {
    return reasons.map((r) => {
      if (r.includes("daysBeforeDeadline >=")) {
        const val = r.match(/\d+/)?.[0] ?? "2";
        return `Submitted at least ${val} days before the deadline, meeting the syllabus advance notice requirement.`;
      }
      if (r.includes("daysBeforeDeadline <")) {
        return `Submitted after the advance notice window, requiring instructor discretion.`;
      }
      if (r.includes("reasonCategory in")) {
        return `Classified under an approved official academic or university conflict category.`;
      }
      if (r.includes("hasDocumentation == true")) {
        return `Non-medical supporting documentation was confirmed.`;
      }
      return r;
    });
  }

  if (status === "auto_approved") {
    return ["Your request matched all syllabus criteria for automated approval."];
  }
  if (status === "auto_denied") {
    return ["Your request does not satisfy the criteria required by course policy."];
  }
  return ["This request requires instructor review. Expected response within 48 hours."];
}

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
      term: courses.term,
      professorName: professorProfiles.displayName,
      facultyTitle: professorProfiles.facultyTitle,
    })
    .from(requests)
    .leftJoin(courses, eq(requests.courseId, courses.id))
    .leftJoin(professorProfiles, eq(courses.profileId, professorProfiles.id))
    .where(eq(requests.publicToken, requestToken))
    .limit(1);

  if (!req) {
    notFound();
  }

  let rawReasons: string[] = [];
  try {
    if (req.decisionReasonJson) {
      rawReasons = JSON.parse(req.decisionReasonJson) as string[];
    }
  } catch {
    rawReasons = [];
  }

  const statusInfo = formatStatus(req.status);
  const StatusIcon = statusInfo.icon;
  const formattedReasons = formatReasons(rawReasons, req.status);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] px-4 py-8 sm:py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Status Page Top Bar with Theme Toggle */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
            <span className="font-bold text-[var(--text-primary)] tracking-tight">FacultyOS</span>
            <span>•</span>
            <span>Official Status Page</span>
          </div>
          <ThemeToggle size="sm" showLabel />
        </div>

        {/* Medical Boundary Protection Banner (Hard Rule 1) */}
        <MedicalBoundaryBanner compact />

        <div className="card-neu p-6 sm:p-10 space-y-6 border border-[var(--border-neu-card)]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-neu-card)]/60 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="glass-badge text-[11px] font-bold">
                  {req.courseCode || "Course Request"}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  {req.term}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-1.5 capitalize">
                {req.requestType.replace("_", " ")} Request
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>
                  {req.facultyTitle || "Instructor"}:{" "}
                  <strong>{req.professorName || "Course Faculty"}</strong>
                </span>
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-[var(--text-muted)] space-y-0.5">
              <div className="font-mono text-[11px]">
                ID: #{req.publicToken.slice(0, 10)}
              </div>
              <div className="flex items-center sm:justify-end gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {req.createdAt ? new Date(req.createdAt).toLocaleString() : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Current Status Banner */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-neu-card)] space-y-3">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`p-2.5 rounded-2xl shrink-0 ${statusInfo.colorClass}`}>
                <StatusIcon className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                  Status
                </span>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  {statusInfo.label}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {statusInfo.desc}
                </p>
              </div>
            </div>

            {req.penaltyPercent !== null && req.penaltyPercent !== undefined && req.penaltyPercent > 0 && (
              <div className="mt-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4 shrink-0 text-amber-500" />
                <span>
                  Syllabus Policy Penalty: -{req.penaltyPercent}% applied per late-submission policy.
                </span>
              </div>
            )}
          </div>

          {/* Explainability Panel (Hard Rule 8: Transparent, Policy-Cited, No AI Mention) */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>Policy Evaluation Details (Hard Rule 8)</span>
              </div>
              <span className="glass-badge text-[10px] font-semibold">
                Explainable Triage
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-neu-card)] space-y-2">
              <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Syllabus Policy Citation
              </div>
              <ul className="space-y-1.5 list-disc pl-5 text-[var(--text-secondary)]">
                {formattedReasons.map((r, i) => (
                  <li key={i} className="leading-relaxed">
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Strict AI Boundary Transparency Notice */}
            <div className="p-3 rounded-xl border border-[var(--border-neu-card)] text-[11px] text-[var(--text-muted)] leading-relaxed">
              <strong className="text-[var(--text-primary)]">Course Policy Transparency:</strong>{" "}
              This status was evaluated deterministically according to published syllabus rules configured by the instructor. Automated decisions never involve artificial intelligence.
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="pt-3 border-t border-[var(--border-neu-card)]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <Link
              href="/"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to FacultyOS</span>
            </Link>
            <span className="text-[var(--text-muted)] text-[11px]">
              Read-only • Cryptographically verified link
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

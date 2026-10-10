"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Sparkles,
  Sliders,
  Check,
  AlertCircle,
  Edit2,
  ShieldCheck,
} from "lucide-react";
import type { policies } from "@/server/db/schema";
import { seedCoursePoliciesAction } from "@/server/actions/policies";
import { SEED_POLICY_TEMPLATES } from "@/server/services/policy-templates";

interface CoursePoliciesManagerProps {
  courseId: string;
  courseCode: string;
  coursePolicies: Array<typeof policies.$inferSelect>;
}

export function CoursePoliciesManager({
  courseId,
  courseCode,
  coursePolicies,
}: CoursePoliciesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  async function handleSeedTemplates() {
    setFeedback(null);
    startTransition(async () => {
      try {
        const allTemplateIds = Object.keys(SEED_POLICY_TEMPLATES);
        const res = await seedCoursePoliciesAction({
          courseId,
          templateIds: allTemplateIds,
        });

        if (!res.success) {
          setFeedback({ type: "error", message: res.error });
          return;
        }

        setFeedback({
          type: "success",
          message: `Successfully seeded ${res.data.length} policy templates for ${courseCode}.`,
        });
        router.refresh();
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to seed policy templates",
        });
      }
    });
  }

  return (
    <div className="card-neu p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-neu-card)]">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Course Policy Engine
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Transparent, deterministic rules that evaluate incoming student requests.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSeedTemplates}
            disabled={isPending}
            className="btn-secondary px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
            title="Seed standard templates (48h extension, late penalty, regrade rubric, absence, meeting, missing grade)"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>{isPending ? "Seeding..." : "Seed Templates"}</span>
          </button>

          <Link
            href={`/courses/${courseId}/policies/new`}
            className="btn-primary px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Policy</span>
          </Link>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
          }`}
        >
          {feedback.type === "success" ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Empty State */}
      {coursePolicies.length === 0 ? (
        <div className="text-center py-10 space-y-4 rounded-2xl bg-[var(--bg-input)] p-8 border border-[var(--border-neu-card)]">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface)] mx-auto flex items-center justify-center text-[var(--accent-primary)] shadow-sm">
            <Sliders className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              No deterministic rules configured yet
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Without active policies, all requests route to manual review. You can seed standard syllabus templates or build custom rules visually.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSeedTemplates}
              disabled={isPending}
              className="btn-primary px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Seed Standard Templates</span>
            </button>
            <Link
              href={`/courses/${courseId}/policies/new`}
              className="btn-secondary px-4 py-2 text-xs font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Build Custom Rule</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Policies List */
        <div className="space-y-3">
          {coursePolicies.map((p) => {
            let conditions: Array<{ field: string; operator: string; value?: unknown }> = [];
            let actions: Array<{ type: string; penaltyPercent?: number; note?: string }> = [];
            try {
              conditions = JSON.parse(p.conditionsJson);
              actions = JSON.parse(p.actionsJson);
            } catch {
              // fallback
            }

            return (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-neu-card)] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-[var(--accent-primary)]/30"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="glass-badge font-mono text-[10px] font-bold">
                      #{p.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-neu-card)]">
                      {p.policyType.replace("_", " ").toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      v{p.version}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                        p.isActive
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-gray-500/15 text-gray-500"
                      }`}
                    >
                      {p.isActive ? "ACTIVE" : "PAUSED"}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {p.name}
                  </h3>

                  {/* Plain Language Summary */}
                  <div className="text-xs text-[var(--text-secondary)] flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>When:</span>
                    {conditions.map((c, i) => (
                      <span key={i} className="font-mono text-[11px] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded text-[var(--text-primary)]">
                        {c.field} {c.operator} {String(c.value ?? "")}
                      </span>
                    ))}
                    <span>→</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {actions.map((a) => a.type.replace("_", " ")).join(", ")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/courses/${courseId}/policies/${p.id}/edit`}
                    className="btn-secondary px-3 py-1.5 text-xs font-medium inline-flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hard Rule 8 Audit Footer */}
      <div className="pt-2 flex items-center justify-between text-[11px] text-[var(--text-muted)] border-t border-[var(--border-neu-card)]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Deterministic execution: decisions capture immutable policy snapshot and rationale.</span>
        </div>
        <span>Total Rules: {coursePolicies.length}</span>
      </div>
    </div>
  );
}

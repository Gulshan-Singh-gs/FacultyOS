import React from "react";
import Link from "next/link";
import { requireProfile } from "@/server/auth/session";
import { createDb } from "@/server/db";
import { getServerEnv } from "@/server/env";
import { listCoursesForProfile } from "@/server/services/courses";
import { PLAN_LIMITS, type PlanType } from "@/server/services/plan-limits";
import { CreateCourseDialog } from "@/components/courses/create-course-dialog";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const { profile } = await requireProfile();
  const env = await getServerEnv();
  const db = createDb(env.DB);

  const allCourses = await listCoursesForProfile(db, profile.id);
  const activeCourses = allCourses.filter((c) => c.status === "active");
  const archivedCourses = allCourses.filter((c) => c.status === "archived");

  const planKey = (profile.plan as PlanType) in PLAN_LIMITS ? (profile.plan as PlanType) : "free";
  const planLimits = PLAN_LIMITS[planKey];
  const canCreate = activeCourses.length < planLimits.maxActiveCourses;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Course Management
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {profile.plan === "free"
              ? `Free tier: ${activeCourses.length} of ${planLimits.maxActiveCourses} active course used.`
              : `${activeCourses.length} active course(s) under ${profile.plan.toUpperCase()} plan.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CreateCourseDialog canCreate={canCreate} planName={profile.plan} />
        </div>
      </div>

      {!canCreate && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
          <div>
            You have reached the 1-course limit on the Free tier. Archive an existing course or upgrade to Pro to create unlimited courses.
          </div>
        </div>
      )}

      {/* Active Courses */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[var(--text-primary)]">
          Active Courses ({activeCourses.length})
        </h2>

        {activeCourses.length === 0 ? (
          <div className="card-neu p-8 text-center text-sm text-[var(--text-secondary)] space-y-3">
            <p>No active courses yet.</p>
            <p className="text-xs">
              Click &quot;+ Create Course&quot; above to set up your first course and student portal link.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeCourses.map((c) => (
              <div key={c.id} className="card-neu p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="glass-badge text-xs font-semibold">
                      {c.courseCode}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {c.term}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {c.courseName}
                  </h3>
                  {c.syllabusText && (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                      {c.syllabusText}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs">
                  <Link
                    href={`/courses/${c.id}`}
                    className="btn-primary px-3.5 py-1.5 text-xs"
                  >
                    Manage Portal & Rules →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archived Courses */}
      {archivedCourses.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)]">
          <h2 className="text-base font-bold text-[var(--text-secondary)]">
            Archived Courses ({archivedCourses.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
            {archivedCourses.map((c) => (
              <div key={c.id} className="card-neu p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--text-secondary)]">{c.courseCode}</span>
                  <span className="text-[var(--text-muted)]">{c.term}</span>
                </div>
                <div className="text-sm font-semibold text-[var(--text-secondary)]">{c.courseName}</div>
                <div className="text-[11px] text-[var(--text-muted)]">Archived</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

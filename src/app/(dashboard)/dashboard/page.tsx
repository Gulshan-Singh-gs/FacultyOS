import React from "react";
import Link from "next/link";
import { and, count, eq, inArray } from "drizzle-orm";
import { requireProfile } from "@/server/auth/session";
import { createDb } from "@/server/db";
import { getServerEnv } from "@/server/env";
import { courses, requests } from "@/server/db/schema";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  console.log("[FACULTYOS_TRACE] DashboardPage: start");
  const { profile } = await requireProfile();
  console.log("[FACULTYOS_TRACE] DashboardPage: requireProfile done, getting env");
  const env = await getServerEnv();
  console.log("[FACULTYOS_TRACE] DashboardPage: got env, creating db");
  const db = createDb(env.DB);

  // 1. Fetch active courses for current professor (Pruned projection to optimize memory space complexity)
  console.log("[FACULTYOS_TRACE] DashboardPage: querying courses...");
  const profileCourses = await db
    .select({
      id: courses.id,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
      term: courses.term,
      createdAt: courses.createdAt,
    })
    .from(courses)
    .where(and(eq(courses.profileId, profile.id), eq(courses.status, "active")))
    .orderBy(courses.createdAt);
  console.log("[FACULTYOS_TRACE] DashboardPage: courses queried, count:", profileCourses.length);

  const courseIds = profileCourses.map((c) => c.id);

  // 2. Fetch KPI counts concurrently in parallel to optimize time complexity
  let needsDecisionCount = 0;
  let autoResolvedCount = 0;

  if (courseIds.length > 0) {
    const [[needsDecision], [autoResolved]] = await Promise.all([
      db
        .select({ total: count() })
        .from(requests)
        .where(
          and(
            inArray(requests.courseId, courseIds),
            eq(requests.status, "pending_review"),
          ),
        ),
      db
        .select({ total: count() })
        .from(requests)
        .where(
          and(
            inArray(requests.courseId, courseIds),
            inArray(requests.status, ["auto_approved", "auto_denied"]),
          ),
        ),
    ]);
    needsDecisionCount = needsDecision?.total ?? 0;
    autoResolvedCount = autoResolved?.total ?? 0;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome banner */}
      <div className="card-neu p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Welcome back, {profile.displayName}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {profileCourses.length === 0
              ? "Get started by setting up your first course and syllabus policy rules."
              : `You have ${needsDecisionCount} request(s) awaiting your review.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/courses"
            className="btn-primary px-4 py-2.5 text-sm font-medium"
          >
            + Create Course
          </Link>
        </div>
      </div>

      {/* KPI Cards (UI.md §Screen 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Needs Decision */}
        <div className="card-neu p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Needs Decision
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-primary)]">
            {needsDecisionCount}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            Pending professor action
          </div>
        </div>

        {/* KPI 2: Auto-Resolved */}
        <div className="card-neu p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Auto-Resolved
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-primary)]">
            {autoResolvedCount}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            Decided by syllabus policy
          </div>
        </div>

        {/* KPI 3: Active Courses */}
        <div className="card-neu p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Active Courses
            </span>
            <span className="glass-badge text-[10px]">
              {profile.plan === "free" ? "1 Max (Free)" : "Pro"}
            </span>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-primary)]">
            {profileCourses.length}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            Managed in portal
          </div>
        </div>

        {/* KPI 4: Boundary Protection */}
        <div className="card-neu p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Boundary Shield
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-primary)]">
            Protected
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            Weekend deferral enabled
          </div>
        </div>
      </div>

      {/* Main Section: Courses or Empty State */}
      {profileCourses.length === 0 ? (
        /* Empty State (UI.md §Screen 3 & §21) */
        <div className="card-neu p-10 md:p-14 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--bg-input)] flex items-center justify-center text-[var(--accent-primary)] shadow-[var(--shadow-neu-inset)]">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              No active courses yet
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Create your first course to configure syllabus rules (like 48-hour extension notice) and generate a secure intake portal link for your students.
            </p>
          </div>
          <Link
            href="/courses"
            className="btn-primary px-6 py-3 text-sm font-semibold inline-block"
          >
            Create Your First Course
          </Link>
        </div>
      ) : (
        /* Active Courses Grid */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Your Courses
            </h2>
            <Link
              href="/courses"
              className="text-xs text-[var(--accent-primary)] font-semibold hover:underline"
            >
              Manage all courses →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {profileCourses.map((c) => (
              <div
                key={c.id}
                className="card-neu p-5 flex flex-col justify-between space-y-4 transition-transform hover:-translate-y-0.5"
              >
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
                </div>

                <div className="pt-3 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs">
                  <Link
                    href={`/courses/${c.id}`}
                    className="btn-secondary px-3 py-1.5 font-medium text-xs"
                  >
                    View Course
                  </Link>
                  <Link
                    href="/inbox"
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Triage Inbox →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

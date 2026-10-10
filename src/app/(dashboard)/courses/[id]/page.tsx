import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/server/auth/session";
import { createDb } from "@/server/db";
import { getServerEnv } from "@/server/env";
import { getCourseWithOwnership, CourseAccessError } from "@/server/services/courses";
import { CoursePortalCard } from "@/components/courses/course-portal-card";

export const dynamic = "force-dynamic";

interface CourseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { id } = await params;
  const { profile } = await requireProfile();
  const env = await getServerEnv();
  const db = createDb(env.DB);

  let course;
  try {
    course = await getCourseWithOwnership(db, profile.id, id);
  } catch (err) {
    if (err instanceof CourseAccessError) {
      notFound();
    }
    notFound();
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <Link href="/courses" className="hover:text-[var(--text-primary)]">
          ← Back to Courses
        </Link>
        <span>/</span>
        <span className="font-semibold text-[var(--text-primary)]">
          {course.courseCode}
        </span>
      </div>

      {/* Course Header Banner */}
      <div className="card-neu p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="glass-badge font-bold text-xs">
              {course.courseCode}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {course.term}
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                course.status === "active"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-gray-500/10 text-gray-600 dark:text-gray-400"
              }`}
            >
              {course.status.toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {course.courseName}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/inbox"
            className="btn-secondary px-3.5 py-2 text-xs font-medium"
          >
            Open Inbox
          </Link>
        </div>
      </div>

      {/* Portal Access Link & Rotation Card */}
      <CoursePortalCard
        courseId={course.id}
        courseCode={course.courseCode}
        courseStatus={course.status}
      />

      {/* Syllabus & Policy Overview */}
      <div className="card-neu p-6 space-y-4">
        <h3 className="text-base font-bold text-[var(--text-primary)]">
          Course Syllabus & Rules
        </h3>
        {course.syllabusText ? (
          <div className="p-4 rounded-xl bg-[var(--bg-input)] text-xs text-[var(--text-primary)] whitespace-pre-wrap font-sans">
            {course.syllabusText}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-secondary)]">
            No raw syllabus text provided for this course. You can configure deterministic policies directly in the policy builder.
          </p>
        )}
      </div>
    </div>
  );
}

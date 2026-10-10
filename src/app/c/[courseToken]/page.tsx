import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sha256 } from "@/lib/utils";
import { createDb } from "@/server/db";
import { getServerEnv } from "@/server/env";
import { courses, professorProfiles, policies } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { StudentPortalClient } from "@/components/portal/student-portal-client";

export const dynamic = "force-dynamic";

interface StudentPortalPageProps {
  params: Promise<{ courseToken: string }>;
}

export async function generateMetadata({
  params,
}: StudentPortalPageProps): Promise<Metadata> {
  const { courseToken } = await params;
  const env = await getServerEnv();
  const db = createDb(env.DB);
  const tokenHash = await sha256(courseToken);

  const [course] = await db
    .select({
      courseCode: courses.courseCode,
      courseName: courses.courseName,
      status: courses.status,
    })
    .from(courses)
    .where(eq(courses.accessTokenHash, tokenHash))
    .limit(1);

  if (!course || course.status !== "active") {
    return {
      title: "Course Not Found • FacultyOS",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${course.courseCode} - ${course.courseName} | Student Portal • FacultyOS`,
    description: `Official student request intake portal for ${course.courseCode}`,
    robots: { index: false, follow: false },
  };
}

export default async function StudentPortalPage({
  params,
}: StudentPortalPageProps) {
  const { courseToken } = await params;
  const env = await getServerEnv();
  const db = createDb(env.DB);
  const tokenHash = await sha256(courseToken);

  const [course] = await db
    .select({
      id: courses.id,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
      term: courses.term,
      syllabusText: courses.syllabusText,
      status: courses.status,
      professorName: professorProfiles.displayName,
      institution: professorProfiles.institution,
      facultyTitle: professorProfiles.facultyTitle,
    })
    .from(courses)
    .leftJoin(professorProfiles, eq(courses.profileId, professorProfiles.id))
    .where(eq(courses.accessTokenHash, tokenHash))
    .limit(1);

  if (!course || course.status !== "active") {
    notFound();
  }

  const activePolicies = await db
    .select({
      policyType: policies.policyType,
    })
    .from(policies)
    .where(and(eq(policies.courseId, course.id), eq(policies.isActive, true)));

  const activePolicyTypes = Array.from(new Set(activePolicies.map((p) => p.policyType)));

  return (
    <StudentPortalClient
      courseToken={courseToken}
      course={{
        courseCode: course.courseCode,
        courseName: course.courseName,
        term: course.term,
        syllabusText: course.syllabusText,
        professorName: course.professorName,
        institution: course.institution,
        facultyTitle: course.facultyTitle,
        activePolicyTypes,
      }}
    />
  );
}

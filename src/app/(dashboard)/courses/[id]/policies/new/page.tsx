import React from "react";
import { notFound } from "next/navigation";
import { requireProfile } from "@/server/auth/session";
import { createDb } from "@/server/db";
import { getServerEnv } from "@/server/env";
import { getCourseWithOwnership } from "@/server/services/courses";
import { PolicyBuilderForm } from "@/components/policies/policy-builder-form";

export const dynamic = "force-dynamic";

interface NewPolicyPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewPolicyPage({ params }: NewPolicyPageProps) {
  const { id } = await params;
  const { profile } = await requireProfile();
  const env = await getServerEnv();
  const db = createDb(env.DB);

  let course;
  try {
    course = await getCourseWithOwnership(db, profile.id, id);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto py-2">
      <PolicyBuilderForm courseId={course.id} courseCode={course.courseCode} />
    </div>
  );
}

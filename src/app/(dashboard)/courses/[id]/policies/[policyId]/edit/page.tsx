import React from "react";
import { notFound } from "next/navigation";
import { requireProfile } from "@/server/auth/session";
import { createDb } from "@/server/db";
import { getServerEnv } from "@/server/env";
import { getCourseWithOwnership } from "@/server/services/courses";
import { getPolicyById } from "@/server/services/policies";
import { PolicyBuilderForm } from "@/components/policies/policy-builder-form";

export const dynamic = "force-dynamic";

interface EditPolicyPageProps {
  params: Promise<{ id: string; policyId: string }>;
}

export default async function EditPolicyPage({ params }: EditPolicyPageProps) {
  const { id, policyId } = await params;
  const { profile } = await requireProfile();
  const env = await getServerEnv();
  const db = createDb(env.DB);

  let course;
  let policy;

  try {
    course = await getCourseWithOwnership(db, profile.id, id);
    policy = await getPolicyById(db, profile.id, policyId);

    if (policy.courseId !== course.id) {
      notFound();
    }
  } catch {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto py-2">
      <PolicyBuilderForm
        courseId={course.id}
        courseCode={course.courseCode}
        policy={policy}
      />
    </div>
  );
}

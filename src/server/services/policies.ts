import { count, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { type Db, withTransaction } from "@/server/db";
import { courses, policies, professorProfiles } from "@/server/db/schema";
import {
  PolicySchema,
  PolicyConditionSchema,
  PolicyActionSchema,
  type PolicyType,
  type PolicyInput,
  type UpdatePolicyInput,
  type PolicySnapshot,
} from "@/lib/validations/policy";
import { PLAN_LIMITS, type PlanType } from "@/server/services/plan-limits";
import { getPolicyTemplateById } from "@/server/services/policy-templates";

export class PolicyAccessError extends Error {
  readonly code = "FORBIDDEN_POLICY_ACCESS" as const;
  constructor(message = "Unauthorized access to course policy") {
    super(message);
    this.name = "PolicyAccessError";
  }
}

export class PolicyLimitError extends Error {
  readonly code = "POLICY_LIMIT_EXCEEDED" as const;
  constructor(message: string) {
    super(message);
    this.name = "PolicyLimitError";
  }
}

/**
 * Creates a policy for a course with strict tenant verification and plan limits.
 */
export async function createPolicyInternal(
  db: Db,
  profileId: string,
  courseId: string,
  input: PolicyInput,
): Promise<typeof policies.$inferSelect> {
  // 1. Verify course ownership (Hard Rule 5 Tenant Isolation)
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) {
    throw new Error("Course not found");
  }

  if (course.profileId !== profileId) {
    throw new PolicyAccessError("You do not own this course");
  }

  // 2. Validate policy structure via Zod
  const validated = PolicySchema.parse(input);

  // 3. Verify policy limit under current plan
  const [profile] = await db
    .select({ plan: professorProfiles.plan })
    .from(professorProfiles)
    .where(eq(professorProfiles.id, profileId))
    .limit(1);

  const planKey = (profile?.plan as PlanType) in PLAN_LIMITS ? (profile?.plan as PlanType) : "free";
  const limit = PLAN_LIMITS[planKey].maxPoliciesPerCourse;

  const [existingCount] = await db
    .select({ total: count() })
    .from(policies)
    .where(eq(policies.courseId, courseId));

  const currentCount = existingCount?.total ?? 0;
  if (currentCount >= limit) {
    throw new PolicyLimitError(
      `Your ${planKey} plan allows up to ${limit} policies per course. You have ${currentCount}.`,
    );
  }

  // 4. Insert policy
  const policyId = `pol_${nanoid(12)}`;
  const [newPolicy] = await db
    .insert(policies)
    .values({
      id: policyId,
      courseId,
      policyType: validated.policyType,
      name: validated.name,
      priority: validated.priority,
      conditionsJson: JSON.stringify(validated.conditions),
      actionsJson: JSON.stringify(validated.actions),
      version: 1,
      isActive: validated.isActive,
    })
    .returning();

  return newPolicy;
}

/**
 * Updates an existing policy, bumping its version by 1 and validating ownership.
 */
export async function updatePolicyInternal(
  db: Db,
  profileId: string,
  input: UpdatePolicyInput,
): Promise<typeof policies.$inferSelect> {
  // 1. Fetch policy and verify ownership via course
  const [existing] = await db
    .select({
      policy: policies,
      courseProfileId: courses.profileId,
    })
    .from(policies)
    .innerJoin(courses, eq(policies.courseId, courses.id))
    .where(eq(policies.id, input.policyId))
    .limit(1);

  if (!existing) {
    throw new Error("Policy not found");
  }

  if (existing.courseProfileId !== profileId) {
    throw new PolicyAccessError("You do not own the course this policy belongs to");
  }

  // 2. Validate conditions & actions if provided
  if (input.conditions) {
    for (const cond of input.conditions) {
      PolicyConditionSchema.parse(cond);
    }
  }
  if (input.actions) {
    for (const act of input.actions) {
      PolicyActionSchema.parse(act);
    }
  }

  // 3. Increment version on edit
  const nextVersion = existing.policy.version + 1;

  const updateValues: Partial<typeof policies.$inferInsert> = {
    version: nextVersion,
    updatedAt: new Date(),
  };

  if (input.policyType !== undefined) updateValues.policyType = input.policyType;
  if (input.name !== undefined) updateValues.name = input.name;
  if (input.priority !== undefined) updateValues.priority = input.priority;
  if (input.conditions !== undefined) updateValues.conditionsJson = JSON.stringify(input.conditions);
  if (input.actions !== undefined) updateValues.actionsJson = JSON.stringify(input.actions);
  if (input.isActive !== undefined) updateValues.isActive = input.isActive;

  const [updated] = await db
    .update(policies)
    .set(updateValues)
    .where(eq(policies.id, input.policyId))
    .returning();

  return updated;
}

/**
 * Deletes a policy with owner verification.
 */
export async function deletePolicyInternal(
  db: Db,
  profileId: string,
  policyId: string,
): Promise<void> {
  const [existing] = await db
    .select({
      policy: policies,
      courseProfileId: courses.profileId,
    })
    .from(policies)
    .innerJoin(courses, eq(policies.courseId, courses.id))
    .where(eq(policies.id, policyId))
    .limit(1);

  if (!existing) {
    throw new Error("Policy not found");
  }

  if (existing.courseProfileId !== profileId) {
    throw new PolicyAccessError("You do not own the course this policy belongs to");
  }

  await db.delete(policies).where(eq(policies.id, policyId));
}

/**
 * Lists all policies for a course, verified by ownership.
 */
export async function listPoliciesForCourse(
  db: Db,
  profileId: string,
  courseId: string,
): Promise<Array<typeof policies.$inferSelect>> {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) {
    throw new Error("Course not found");
  }

  if (course.profileId !== profileId) {
    throw new PolicyAccessError("You do not own this course");
  }

  return db
    .select()
    .from(policies)
    .where(eq(policies.courseId, courseId))
    .orderBy(policies.priority, policies.createdAt);
}

/**
 * Seeds a course with selected policy templates.
 */
export async function seedCoursePoliciesInternal(
  db: Db,
  profileId: string,
  courseId: string,
  templateIds: string[],
): Promise<Array<typeof policies.$inferSelect>> {
  return await withTransaction(db, async (tx) => {
    const results: Array<typeof policies.$inferSelect> = [];

    for (const templateId of templateIds) {
      const template = getPolicyTemplateById(templateId);
      if (!template) continue;

      const created = await createPolicyInternal(
        tx,
        profileId,
        courseId,
        template.policy,
      );
      results.push(created);
    }

    return results;
  });
}

/**
 * Generates an immutable, explainable policy snapshot for decision recording (Hard Rule 8).
 */
export function createPolicySnapshot(
  policy: typeof policies.$inferSelect,
): PolicySnapshot {
  return {
    policyId: policy.id,
    policyType: policy.policyType as PolicyType,
    name: policy.name,
    priority: policy.priority,
    version: policy.version,
    conditions: JSON.parse(policy.conditionsJson),
    actions: JSON.parse(policy.actionsJson),
    capturedAt: Date.now(),
  };
}

/**
 * Retrieves a single policy by ID and verifies owner tenancy.
 */
export async function getPolicyById(
  db: Db,
  profileId: string,
  policyId: string,
): Promise<typeof policies.$inferSelect> {
  const [existing] = await db
    .select({
      policy: policies,
      courseProfileId: courses.profileId,
    })
    .from(policies)
    .innerJoin(courses, eq(policies.courseId, courses.id))
    .where(eq(policies.id, policyId))
    .limit(1);

  if (!existing) {
    throw new Error("Policy not found");
  }

  if (existing.courseProfileId !== profileId) {
    throw new PolicyAccessError("You do not own the course this policy belongs to");
  }

  return existing.policy;
}

export type PlanType = "free" | "pro" | "department";

export class PlanLimitError extends Error {
  readonly code = "PLAN_LIMIT_EXCEEDED" as const;
  readonly current: number;
  readonly limit: number;

  constructor(message: string, current: number, limit: number) {
    super(message);
    this.name = "PlanLimitError";
    this.current = current;
    this.limit = limit;
  }
}

export interface PlanLimits {
  readonly maxActiveCourses: number;
  readonly maxRequestsPerMonth: number;
  readonly maxPoliciesPerCourse: number;
  readonly aiEnabled: boolean;
  readonly retentionDays: number;
  readonly maxAttachmentSizeBytes: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxActiveCourses: 1,
    maxRequestsPerMonth: 50,
    maxPoliciesPerCourse: 5,
    aiEnabled: false,
    retentionDays: 7,
    maxAttachmentSizeBytes: 5 * 1024 * 1024, // 5MB
  },
  pro: {
    maxActiveCourses: 20,
    maxRequestsPerMonth: Infinity,
    maxPoliciesPerCourse: 50,
    aiEnabled: true,
    retentionDays: 365,
    maxAttachmentSizeBytes: 25 * 1024 * 1024, // 25MB
  },
  department: {
    maxActiveCourses: 200,
    maxRequestsPerMonth: Infinity,
    maxPoliciesPerCourse: 100,
    aiEnabled: true,
    retentionDays: 730,
    maxAttachmentSizeBytes: 50 * 1024 * 1024, // 50MB
  },
};

/**
 * Returns the maximum attachment size allowed for a professor's plan.
 */
export function getPlanMaxAttachmentSize(plan: string): number {
  const planKey = (plan as PlanType) in PLAN_LIMITS ? (plan as PlanType) : "free";
  return PLAN_LIMITS[planKey].maxAttachmentSizeBytes;
}

/**
 * Asserts whether an attachment file size is within the allowed limit for a professor's plan.
 */
export function assertAttachmentSizeWithinPlan(plan: string, sizeBytes: number): void {
  const maxAllowed = getPlanMaxAttachmentSize(plan);
  if (sizeBytes > maxAllowed) {
    const maxMb = Math.round(maxAllowed / (1024 * 1024));
    const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
    throw new PlanLimitError(
      `File size (${sizeMb} MB) exceeds your ${plan} plan limit of ${maxMb} MB. Please upgrade for larger attachments.`,
      sizeBytes,
      maxAllowed,
    );
  }
}

/**
 * Asserts whether a professor on the given plan can create another active course.
 * Throws PlanLimitError if current active course count reaches or exceeds limit.
 */
export function assertCanCreateCourse(
  plan: string,
  currentActiveCoursesCount: number,
): void {
  const planKey = (plan as PlanType) in PLAN_LIMITS ? (plan as PlanType) : "free";
  const limits = PLAN_LIMITS[planKey];

  if (currentActiveCoursesCount >= limits.maxActiveCourses) {
    throw new PlanLimitError(
      `Your ${planKey} plan limit allows up to ${limits.maxActiveCourses} active course(s). You currently have ${currentActiveCoursesCount}. Please upgrade to Pro for additional courses.`,
      currentActiveCoursesCount,
      limits.maxActiveCourses,
    );
  }
}


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
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxActiveCourses: 1,
    maxRequestsPerMonth: 50,
    maxPoliciesPerCourse: 5,
    aiEnabled: false,
    retentionDays: 7,
  },
  pro: {
    maxActiveCourses: 20,
    maxRequestsPerMonth: Infinity,
    maxPoliciesPerCourse: 50,
    aiEnabled: true,
    retentionDays: 365,
  },
  department: {
    maxActiveCourses: 100,
    maxRequestsPerMonth: Infinity,
    maxPoliciesPerCourse: 100,
    aiEnabled: true,
    retentionDays: 730,
  },
};

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

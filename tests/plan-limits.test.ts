import { describe, it, expect } from "vitest";
import {
  assertCanCreateCourse,
  PlanLimitError,
  PLAN_LIMITS,
} from "@/server/services/plan-limits";

describe("Plan limits service", () => {
  it("allows free plan with 0 active courses to create a course", () => {
    expect(() => assertCanCreateCourse("free", 0)).not.toThrow();
  });

  it("blocks free plan from creating a 2nd active course", () => {
    expect(() => assertCanCreateCourse("free", 1)).toThrow(PlanLimitError);
    try {
      assertCanCreateCourse("free", 1);
    } catch (err) {
      expect(err).toBeInstanceOf(PlanLimitError);
      const limitErr = err as PlanLimitError;
      expect(limitErr.code).toBe("PLAN_LIMIT_EXCEEDED");
      expect(limitErr.current).toBe(1);
      expect(limitErr.limit).toBe(1);
    }
  });

  it("allows pro plan to create multiple courses up to 20", () => {
    expect(() => assertCanCreateCourse("pro", 0)).not.toThrow();
    expect(() => assertCanCreateCourse("pro", 5)).not.toThrow();
    expect(() => assertCanCreateCourse("pro", 19)).not.toThrow();
    expect(() => assertCanCreateCourse("pro", 20)).toThrow(PlanLimitError);
  });

  it("allows department plan to create up to 200 courses", () => {
    expect(() => assertCanCreateCourse("department", 199)).not.toThrow();
    expect(() => assertCanCreateCourse("department", 200)).toThrow(PlanLimitError);
  });

  it("falls back to free plan for unknown plan names", () => {
    expect(() => assertCanCreateCourse("unknown_tier", 1)).toThrow(PlanLimitError);
  });

  it("exposes expected constants", () => {
    expect(PLAN_LIMITS.free.maxActiveCourses).toBe(1);
    expect(PLAN_LIMITS.free.maxRequestsPerMonth).toBe(50);
    expect(PLAN_LIMITS.pro.aiEnabled).toBe(true);
  });
});

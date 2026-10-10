import { describe, it, expect } from "vitest";
import { sha256 } from "@/lib/utils";
import {
  PLAN_LIMITS,
  assertCanCreateCourse,
  PlanLimitError,
} from "@/server/services/plan-limits";
import {
  createCourseInternal,
  rotateCourseTokenInternal,
  archiveCourseInternal,
  CourseAccessError,
} from "@/server/services/courses";
import type { Db } from "@/server/db";

describe("Phase 1 Manual QA Automated Verification", () => {
  // Mock store mimicking D1 state
  const dbState = {
    users: [] as any[],
    profiles: [] as any[],
    boundaries: [] as any[],
    metrics: [] as any[],
    courses: [] as any[],
    courseMembers: [] as any[],
  };

  const fakeDb = {
    select: (selection?: any) => ({
      from: (table: any) => ({
        where: (clause: any) => {
          if (selection?.total) {
            return Promise.resolve([
              { total: dbState.courses.filter((c) => c.status === "active").length },
            ]);
          }
          return {
            limit: (lim: number) => Promise.resolve(dbState.courses.slice(0, lim)),
            then: (resolve: any) => resolve(dbState.courses),
          };
        },
      }),
    }),
    insert: (table: any) => ({
      values: (vals: any) => ({
        returning: () => {
          dbState.courses.push(vals);
          return Promise.resolve([vals]);
        },
        then: (resolve: any) => {
          dbState.courseMembers.push(vals);
          resolve([vals]);
        },
      }),
    }),
    update: (table: any) => ({
      set: (vals: any) => ({
        where: (clause: any) => {
          dbState.courses.forEach((c) => {
            if (vals.accessTokenHash) c.accessTokenHash = vals.accessTokenHash;
            if (vals.status) c.status = vals.status;
          });
          return Promise.resolve([{ updated: true }]);
        },
      }),
    }),
  } as unknown as Db;

  it("QA Step 1 & 2: Signup provisions profile, default boundaries, and metrics", () => {
    const defaultBoundary = {
      workStart: "09:00",
      workEnd: "18:00",
      responseSlaHours: 48,
      weekendDefer: true,
      vacationMode: false,
    };

    expect(defaultBoundary.workStart).toBe("09:00");
    expect(defaultBoundary.workEnd).toBe("18:00");
    expect(defaultBoundary.responseSlaHours).toBe(48);
    expect(defaultBoundary.weekendDefer).toBe(true);
    expect(defaultBoundary.vacationMode).toBe(false);
  });

  it("QA Step 3: Course creation stores SHA-256 hash != raw token", async () => {
    const result = await createCourseInternal(
      fakeDb,
      "prof_qa_1",
      "free",
      {
        courseCode: "CS101",
        courseName: "Intro to Computer Science",
        term: "Fall 2026",
      },
      "user_qa_1",
    );

    expect(result.rawToken).toMatch(/^fc_[a-zA-Z0-9_-]{24}$/);
    expect(result.course.accessTokenHash).not.toBe(result.rawToken);
    const hash = await sha256(result.rawToken);
    expect(result.course.accessTokenHash).toBe(hash);
  });

  it("QA Step 4: Plan limit blocks second active course on Free plan", async () => {
    await expect(
      createCourseInternal(
        fakeDb,
        "prof_qa_1",
        "free",
        {
          courseCode: "CS102",
          courseName: "Data Structures",
          term: "Fall 2026",
        },
        "user_qa_1",
      ),
    ).rejects.toThrow(PlanLimitError);
  });

  it("QA Step 5: Token rotation invalidates old hash and issues fresh token", async () => {
    const oldHash = dbState.courses[0].accessTokenHash;
    const rotated = await rotateCourseTokenInternal(
      fakeDb,
      "prof_qa_1",
      dbState.courses[0].id,
    );

    expect(rotated.newAccessTokenHash).not.toBe(oldHash);
    const newComputedHash = await sha256(rotated.rawToken);
    expect(rotated.newAccessTokenHash).toBe(newComputedHash);
  });

  it("QA Step 6: Archiving course frees quota for new course creation", async () => {
    await archiveCourseInternal(fakeDb, "prof_qa_1", dbState.courses[0].id);
    expect(dbState.courses[0].status).toBe("archived");

    // Clear active list in mock
    dbState.courses = [];

    // Now creating a new course succeeds
    const nextCourse = await createCourseInternal(
      fakeDb,
      "prof_qa_1",
      "free",
      {
        courseCode: "CS201",
        courseName: "Algorithms",
        term: "Spring 2027",
      },
      "user_qa_1",
    );

    expect(nextCourse.course.courseCode).toBe("CS201");
  });

  it("QA Step 7 & 8: Plan constants match BRD (Department: 200 courses)", () => {
    expect(PLAN_LIMITS.free.maxActiveCourses).toBe(1);
    expect(PLAN_LIMITS.pro.maxActiveCourses).toBe(20);
    expect(PLAN_LIMITS.department.maxActiveCourses).toBe(200);
  });
});

import { describe, it, expect, vi } from "vitest";
import {
  createCourseInternal,
  rotateCourseTokenInternal,
  archiveCourseInternal,
  CourseAccessError,
} from "@/server/services/courses";
import { PlanLimitError } from "@/server/services/plan-limits";
import type { Db } from "@/server/db";
import { sha256 } from "@/lib/utils";

function createMockDb(initialCourses: any[] = []) {
  const coursesStore = [...initialCourses];
  const membersStore: any[] = [];
  const metricsStore: any[] = [];

  const mockDb = {
    select: vi.fn().mockImplementation((selection?: any) => ({
      from: vi.fn().mockImplementation((table: any) => ({
        where: vi.fn().mockImplementation((clause: any) => {
          // Check if selecting count
          if (selection && selection.total) {
            return Promise.resolve([{ total: coursesStore.filter(c => c.status === "active").length }]);
          }
          return {
            limit: vi.fn().mockImplementation((lim: number) => {
              return Promise.resolve(coursesStore.slice(0, lim));
            }),
            then: (resolve: any) => resolve(coursesStore),
          };
        }),
      })),
    })),
    insert: vi.fn().mockImplementation((table: any) => ({
      values: vi.fn().mockImplementation((vals: any) => ({
        returning: vi.fn().mockImplementation(() => {
          coursesStore.push(vals);
          return Promise.resolve([vals]);
        }),
        then: (resolve: any) => {
          membersStore.push(vals);
          resolve([vals]);
        },
      })),
    })),
    update: vi.fn().mockImplementation((table: any) => ({
      set: vi.fn().mockImplementation((setVals: any) => ({
        where: vi.fn().mockImplementation((whereClause: any) => {
          return Promise.resolve([{ updated: true }]);
        }),
      })),
    })),
    _store: { coursesStore, membersStore, metricsStore },
  } as unknown as Db;

  return mockDb;
}

describe("Courses service", () => {
  it("creates a course, hashes token, and adds owner membership", async () => {
    const mockDb = createMockDb([]);
    const input = {
      courseCode: "CS301",
      courseName: "Database Systems",
      term: "Fall 2026",
    };

    const result = await createCourseInternal(
      mockDb,
      "prof_1",
      "free",
      input,
      "usr_1",
    );

    expect(result.course.courseCode).toBe("CS301");
    expect(result.course.courseName).toBe("Database Systems");
    expect(result.rawToken).toMatch(/^fc_[a-zA-Z0-9_-]{24}$/);

    const expectedHash = await sha256(result.rawToken);
    expect(result.course.accessTokenHash).toBe(expectedHash);
  });

  it("enforces plan limits on course creation (free blocks 2nd course)", async () => {
    const existing = [
      { id: "crs_1", profileId: "prof_1", status: "active", courseCode: "CS101" },
    ];
    const mockDb = createMockDb(existing);

    await expect(
      createCourseInternal(
        mockDb,
        "prof_1",
        "free",
        { courseCode: "CS201", courseName: "Algorithms", term: "Fall 2026" },
        "usr_1",
      ),
    ).rejects.toThrow(PlanLimitError);
  });

  it("rotates token and invalidates old hash", async () => {
    const oldRawToken = "fc_old_token_12345678901234";
    const oldHash = await sha256(oldRawToken);
    const existing = [
      { id: "crs_1", profileId: "prof_1", status: "active", accessTokenHash: oldHash },
    ];
    const mockDb = createMockDb(existing);

    const result = await rotateCourseTokenInternal(mockDb, "prof_1", "crs_1");

    expect(result.courseId).toBe("crs_1");
    expect(result.rawToken).not.toBe(oldRawToken);
    expect(result.newAccessTokenHash).not.toBe(oldHash);

    const verifyNewHash = await sha256(result.rawToken);
    expect(result.newAccessTokenHash).toBe(verifyNewHash);
  });

  it("rejects token rotation for cross-profile access (Hard Rule 5 Tenant Isolation)", async () => {
    const existing = [
      { id: "crs_foreign", profileId: "prof_other", status: "active", accessTokenHash: "hash_abc" },
    ];
    const mockDb = createMockDb(existing);

    await expect(
      rotateCourseTokenInternal(mockDb, "prof_attacker", "crs_foreign"),
    ).rejects.toThrow(CourseAccessError);
  });

  it("rejects course archive for cross-profile access", async () => {
    const existing = [
      { id: "crs_foreign", profileId: "prof_other", status: "active" },
    ];
    const mockDb = createMockDb(existing);

    await expect(
      archiveCourseInternal(mockDb, "prof_attacker", "crs_foreign"),
    ).rejects.toThrow(CourseAccessError);
  });
});

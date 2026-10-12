import { describe, it, expect } from "vitest";
import { courses, requests } from "@/server/db/schema";

/**
 * Regression test for the gateway timeout root cause:
 * The dashboard page used `courses.facultyProfileId` which does not exist on the schema.
 * The correct field is `courses.profileId`.
 *
 * If this test fails, it means the courses schema no longer has a `profileId` column,
 * which would break the dashboard page query and cause a 504 gateway timeout.
 */
describe("Dashboard schema regression", () => {
  it("courses table has profileId column (not facultyProfileId)", () => {
    // Verify the profileId column exists on the courses schema
    expect(courses.profileId).toBeDefined();
    expect(courses.profileId.name).toBe("profile_id");

    // Verify facultyProfileId does NOT exist — this was the root cause of the 504 timeout
    expect((courses as any).facultyProfileId).toBeUndefined();
  });

  it("requests table has courseId column with proper index support", () => {
    // The dashboard queries requests by courseId + status — verify these columns exist
    expect(requests.courseId).toBeDefined();
    expect(requests.courseId.name).toBe("course_id");
    expect(requests.status).toBeDefined();
    expect(requests.status.name).toBe("status");
  });
});

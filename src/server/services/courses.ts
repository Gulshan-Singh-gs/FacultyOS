import { and, count, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sha256 } from "@/lib/utils";
import { type Db, withTransaction } from "@/server/db";
import {
  courses,
  courseMembers,
  usageMetrics,
} from "@/server/db/schema";
import { assertCanCreateCourse } from "@/server/services/plan-limits";
import type { CreateCourseInput } from "@/lib/validations/course";

export class CourseAccessError extends Error {
  readonly code = "FORBIDDEN_COURSE_ACCESS" as const;
  constructor(message = "Unauthorized access to course") {
    super(message);
    this.name = "CourseAccessError";
  }
}

export interface CreatedCourseResult {
  course: typeof courses.$inferSelect;
  rawToken: string;
}

export interface RotatedTokenResult {
  courseId: string;
  rawToken: string;
  newAccessTokenHash: string;
}

/**
 * Creates a new course under the specified professor profile with plan limits enforced.
 * Generates an access token and stores its SHA-256 hash.
 */
export async function createCourseInternal(
  db: Db,
  profileId: string,
  plan: string,
  input: CreateCourseInput,
  userId: string,
): Promise<CreatedCourseResult> {
  // 1. Verify active course count against plan limit (Hard Rule 5 + BRD §4)
  const [activeCountRow] = await db
    .select({ total: count() })
    .from(courses)
    .where(and(eq(courses.profileId, profileId), eq(courses.status, "active")));

  const currentCount = activeCountRow?.total ?? 0;
  assertCanCreateCourse(plan, currentCount);

  // 2. Generate raw token and hash
  const rawToken = `fc_${nanoid(24)}`;
  const tokenHash = await sha256(rawToken);

  const courseId = `crs_${nanoid(12)}`;

  return await withTransaction(db, async (tx) => {
    // 3. Insert course
    const [newCourse] = await tx
      .insert(courses)
      .values({
        id: courseId,
        profileId,
        courseCode: input.courseCode,
        courseName: input.courseName,
        term: input.term,
        syllabusText: input.syllabusText || null,
        accessTokenHash: tokenHash,
        status: "active",
      })
      .returning();

    // 4. Insert creator as owner in course_members
    await tx.insert(courseMembers).values({
      id: `cm_${nanoid(12)}`,
      courseId,
      userId,
      role: "owner",
      status: "active",
    });

    // 5. Update usage metrics
    await tx
      .update(usageMetrics)
      .set({
        coursesActive: sql`${usageMetrics.coursesActive} + 1`,
      })
      .where(eq(usageMetrics.profileId, profileId));

    return {
      course: newCourse,
      rawToken,
    };
  });
}

/**
 * Rotates a course's access token.
 * Strictly verifies that the calling profileId owns the course.
 */
export async function rotateCourseTokenInternal(
  db: Db,
  profileId: string,
  courseId: string,
): Promise<RotatedTokenResult> {
  // 1. Check ownership
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) {
    throw new Error("Course not found");
  }

  if (course.profileId !== profileId) {
    throw new CourseAccessError("You do not have permission to modify this course");
  }

  // 2. Generate new raw token and hash
  const newRawToken = `fc_${nanoid(24)}`;
  const newHash = await sha256(newRawToken);

  // 3. Update hash in database
  await db
    .update(courses)
    .set({
      accessTokenHash: newHash,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, courseId));

  return {
    courseId,
    rawToken: newRawToken,
    newAccessTokenHash: newHash,
  };
}

/**
 * Archives a course and decrements active count in metrics.
 */
export async function archiveCourseInternal(
  db: Db,
  profileId: string,
  courseId: string,
): Promise<void> {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) {
    throw new Error("Course not found");
  }

  if (course.profileId !== profileId) {
    throw new CourseAccessError("You do not have permission to modify this course");
  }

  await withTransaction(db, async (tx) => {
    await tx
      .update(courses)
      .set({
        status: "archived",
        updatedAt: new Date(),
      })
      .where(eq(courses.id, courseId));

    await tx
      .update(usageMetrics)
      .set({
        coursesActive: sql`MAX(0, ${usageMetrics.coursesActive} - 1)`,
      })
      .where(eq(usageMetrics.profileId, profileId));
  });
}

/**
 * Returns a course for a profile, throwing if ownership check fails.
 */
export async function getCourseWithOwnership(
  db: Db,
  profileId: string,
  courseId: string,
): Promise<typeof courses.$inferSelect> {
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) {
    throw new Error("Course not found");
  }

  if (course.profileId !== profileId) {
    throw new CourseAccessError("You do not have permission to access this course");
  }

  return course;
}

/**
 * Lists all courses owned by the profile.
 */
export async function listCoursesForProfile(
  db: Db,
  profileId: string,
): Promise<Array<typeof courses.$inferSelect>> {
  return db
    .select()
    .from(courses)
    .where(eq(courses.profileId, profileId))
    .orderBy(courses.createdAt);
}

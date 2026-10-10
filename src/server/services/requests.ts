import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Db } from "@/server/db";
import {
  requests,
  courses,
  studentIdentities,
  policies,
  requestEvents,
  attachments,
} from "@/server/db/schema";

export class RequestAccessError extends Error {
  readonly code = "FORBIDDEN_REQUEST_ACCESS" as const;
  constructor(message = "Unauthorized access to request: course is owned by another profile") {
    super(message);
    this.name = "RequestAccessError";
  }
}

export type InboxQueueKey =
  | "needs_decision"
  | "needs_student_info"
  | "urgent"
  | "auto_resolved"
  | "ta_review"
  | "closed"
  | "all";

export interface InboxRequestItem {
  id: string;
  publicToken: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  requestType: string;
  status: string;
  priority: string;
  studentDisplayLabel: string;
  matchedPolicyName: string | null;
  matchedPolicyVersion: number | null;
  createdAt: Date | null;
  penaltyPercent: number | null;
}

export interface InboxQueueCounts {
  needs_decision: number;
  needs_student_info: number;
  urgent: number;
  auto_resolved: number;
  ta_review: number;
  closed: number;
  all: number;
}

export interface DetailedRequestResult {
  request: typeof requests.$inferSelect;
  course: typeof courses.$inferSelect;
  studentIdentity: typeof studentIdentities.$inferSelect | null;
  matchedPolicy: typeof policies.$inferSelect | null;
  events: Array<typeof requestEvents.$inferSelect>;
  attachments: Array<typeof attachments.$inferSelect>;
}

/**
 * Returns inbox requests strictly scoped to the professor's profile_id (Hard Rule 5).
 * Supports queue filtering and computes counts across all 6 queues.
 */
export async function getInboxRequestsForProfile(
  db: Db,
  profileId: string,
  queue: InboxQueueKey = "needs_decision",
): Promise<{
  items: InboxRequestItem[];
  counts: InboxQueueCounts;
}> {
  // Query all requests for courses owned by this professor
  const rows = await db
    .select({
      id: requests.id,
      publicToken: requests.publicToken,
      courseId: requests.courseId,
      courseCode: courses.courseCode,
      courseName: courses.courseName,
      requestType: requests.requestType,
      status: requests.status,
      priority: requests.priority,
      studentDisplayLabel: studentIdentities.displayLabel,
      matchedPolicyName: policies.name,
      matchedPolicyVersion: requests.matchedPolicyVersion,
      createdAt: requests.createdAt,
      penaltyPercent: requests.penaltyPercent,
      assignedToUserId: requests.assignedToUserId,
    })
    .from(requests)
    .innerJoin(courses, eq(requests.courseId, courses.id))
    .leftJoin(studentIdentities, eq(requests.studentIdentityId, studentIdentities.id))
    .leftJoin(policies, eq(requests.matchedPolicyId, policies.id))
    .where(eq(courses.profileId, profileId))
    .orderBy(desc(requests.createdAt));

  // Compute counts for all 6 queues
  const counts: InboxQueueCounts = {
    needs_decision: 0,
    needs_student_info: 0,
    urgent: 0,
    auto_resolved: 0,
    ta_review: 0,
    closed: 0,
    all: rows.length,
  };

  for (const r of rows) {
    if (r.priority === "urgent") {
      counts.urgent++;
    } else if (r.status === "needs_student_info") {
      counts.needs_student_info++;
    } else if (r.status === "auto_approved" || r.status === "auto_denied") {
      counts.auto_resolved++;
    } else if (
      r.status === "ta_review" ||
      r.status === "assigned_to_ta" ||
      Boolean(r.assignedToUserId)
    ) {
      counts.ta_review++;
    } else if (
      r.status === "closed" ||
      r.status === "approved" ||
      r.status === "denied"
    ) {
      counts.closed++;
    } else {
      // 'submitted' or 'manual_review'
      counts.needs_decision++;
    }
  }

  // Filter items matching the selected queue
  const items: InboxRequestItem[] = rows
    .filter((r) => {
      if (queue === "all") return true;
      if (queue === "urgent") return r.priority === "urgent";
      if (queue === "needs_student_info") return r.status === "needs_student_info";
      if (queue === "auto_resolved")
        return r.status === "auto_approved" || r.status === "auto_denied";
      if (queue === "ta_review")
        return (
          r.status === "ta_review" ||
          r.status === "assigned_to_ta" ||
          Boolean(r.assignedToUserId)
        );
      if (queue === "closed")
        return (
          r.status === "closed" ||
          r.status === "approved" ||
          r.status === "denied"
        );
      if (queue === "needs_decision") {
        return (
          r.priority !== "urgent" &&
          (r.status === "submitted" || r.status === "manual_review")
        );
      }
      return true;
    })
    .map((r) => ({
      id: r.id,
      publicToken: r.publicToken,
      courseId: r.courseId,
      courseCode: r.courseCode,
      courseName: r.courseName,
      requestType: r.requestType,
      status: r.status,
      priority: r.priority,
      studentDisplayLabel: r.studentDisplayLabel || "Student",
      matchedPolicyName: r.matchedPolicyName ?? null,
      matchedPolicyVersion: r.matchedPolicyVersion ?? null,
      createdAt: r.createdAt,
      penaltyPercent: r.penaltyPercent,
    }));

  return { items, counts };
}

/**
 * Returns full request detail with strict IDOR verification against course.profileId (Hard Rule 5).
 * Throws RequestAccessError if the request belongs to another professor's course.
 */
export async function getRequestDetailWithOwnership(
  db: Db,
  profileId: string,
  requestId: string,
): Promise<DetailedRequestResult> {
  const [requestRow] = await db
    .select()
    .from(requests)
    .where(eq(requests.id, requestId))
    .limit(1);

  if (!requestRow) {
    throw new Error("Request not found");
  }

  const [courseRow] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, requestRow.courseId))
    .limit(1);

  if (!courseRow) {
    throw new Error("Course not found");
  }

  // IDOR Protection: Verify course ownership
  if (courseRow.profileId !== profileId) {
    throw new RequestAccessError(
      "Unauthorized access to request: course is owned by another profile",
    );
  }

  let studentIdentityRow: typeof studentIdentities.$inferSelect | null = null;
  if (requestRow.studentIdentityId) {
    const [ident] = await db
      .select()
      .from(studentIdentities)
      .where(eq(studentIdentities.id, requestRow.studentIdentityId))
      .limit(1);
    studentIdentityRow = ident ?? null;
  }

  let matchedPolicyRow: typeof policies.$inferSelect | null = null;
  if (requestRow.matchedPolicyId) {
    const [pol] = await db
      .select()
      .from(policies)
      .where(eq(policies.id, requestRow.matchedPolicyId))
      .limit(1);
    matchedPolicyRow = pol ?? null;
  }

  const events = await db
    .select()
    .from(requestEvents)
    .where(eq(requestEvents.requestId, requestId))
    .orderBy(requestEvents.createdAt);

  const requestAttachments = await db
    .select()
    .from(attachments)
    .where(eq(attachments.requestId, requestId));

  return {
    request: requestRow,
    course: courseRow,
    studentIdentity: studentIdentityRow,
    matchedPolicy: matchedPolicyRow,
    events,
    attachments: requestAttachments,
  };
}

/**
 * Updates professor private notes with ownership verification.
 */
export async function updateProfessorNotesInternal(
  db: Db,
  profileId: string,
  requestId: string,
  notes: string,
): Promise<void> {
  // Enforce ownership
  await getRequestDetailWithOwnership(db, profileId, requestId);

  await db
    .update(requests)
    .set({
      professorNotes: notes,
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));
}

/**
 * Updates request status / action bar state with ownership verification and audit event.
 */
export async function updateRequestStatusActionInternal(
  db: Db,
  profileId: string,
  requestId: string,
  newStatus: string,
  actionNotes?: string,
): Promise<void> {
  const detail = await getRequestDetailWithOwnership(db, profileId, requestId);

  await db
    .update(requests)
    .set({
      status: newStatus,
      updatedAt: new Date(),
      ...(newStatus === "approved" || newStatus === "denied" || newStatus === "closed"
        ? { resolvedAt: new Date() }
        : {}),
    })
    .where(eq(requests.id, requestId));

  await db.insert(requestEvents).values({
    id: nanoid(),
    requestId,
    eventType: `status_changed_to_${newStatus}`,
    actorType: "professor",
    payloadJson: JSON.stringify({
      previousStatus: detail.request.status,
      newStatus,
      notes: actionNotes ?? null,
    }),
  });
}

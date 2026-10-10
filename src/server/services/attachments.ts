import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Db } from "@/server/db";
import {
  attachments,
  requests,
  courses,
  professorProfiles,
  requestEvents,
} from "@/server/db/schema";
import {
  ALLOWED_ATTACHMENT_CATEGORIES,
  ALLOWED_ATTACHMENT_MIME_TYPES,
  isMedicalCategory,
} from "@/lib/validations/request";
import { assertAttachmentSizeWithinPlan } from "@/server/services/plan-limits";
import { RequestAccessError } from "@/server/services/requests";

export interface CreateAttachmentOptions {
  requestId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  category: string;
  fileBuffer?: ArrayBuffer | Uint8Array;
  r2Bucket?: R2Bucket;
  actorType?: "professor" | "student";
  callerProfileId?: string; // If provided, ensures the caller owns the request course
}

/**
 * Creates an attachment record with strict validation:
 * 1. Hard Rule 1: Rejects medical categories and unapproved categories.
 * 2. Strict MIME Allowlist: application/pdf, image/png, image/jpeg ONLY.
 * 3. Plan limits: Enforces max attachment size based on professor's plan.
 * 4. Stores object in Cloudflare R2 bucket (if provided).
 * 5. Inserts metadata row in attachments table.
 * 6. Inserts audit event in request_events.
 */
export async function createAttachmentRecord(
  db: Db,
  options: CreateAttachmentOptions,
) {
  const {
    requestId,
    fileName,
    mimeType,
    fileSize,
    category,
    fileBuffer,
    r2Bucket,
    actorType = "professor",
    callerProfileId,
  } = options;

  // 1. HARD RULE 1: Medical documentation prohibition
  if (isMedicalCategory(category)) {
    throw new Error(
      "Medical documentation is prohibited under student privacy policy (Hard Rule 1). Please contact University Student Health Services directly.",
    );
  }

  // Verify category is strictly in the allowlist
  if (
    !ALLOWED_ATTACHMENT_CATEGORIES.includes(
      category as (typeof ALLOWED_ATTACHMENT_CATEGORIES)[number],
    )
  ) {
    throw new Error(
      `Invalid attachment category: "${category}". Only university documents, athletic schedules, technical issues, or administrative records are permitted.`,
    );
  }

  // 2. Strict MIME Type Allowlist
  if (
    !ALLOWED_ATTACHMENT_MIME_TYPES.includes(
      mimeType as (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number],
    )
  ) {
    throw new Error(
      `Unsupported file type: "${mimeType}". Only PDF, PNG, and JPEG files are permitted.`,
    );
  }

  // 3. Resolve Request, Course, and Professor Plan
  const [requestRow] = await db
    .select({
      requestId: requests.id,
      courseId: requests.courseId,
      profileId: courses.profileId,
      plan: professorProfiles.plan,
    })
    .from(requests)
    .innerJoin(courses, eq(requests.courseId, courses.id))
    .innerJoin(professorProfiles, eq(courses.profileId, professorProfiles.id))
    .where(eq(requests.id, requestId))
    .limit(1);

  if (!requestRow) {
    throw new Error(`Request with ID "${requestId}" not found.`);
  }

  // Hard Rule 5: If caller is a professor, enforce strict profile ownership
  if (callerProfileId && requestRow.profileId !== callerProfileId) {
    throw new RequestAccessError("Unauthorized attachment creation");
  }

  // Enforce plan-based attachment size caps (5MB Free, 25MB Pro)
  assertAttachmentSizeWithinPlan(requestRow.plan || "free", fileSize);

  // 4. Generate R2 key and upload if R2 bucket is bound
  const attachmentId = nanoid();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const r2Key = `attachments/${requestId}/${attachmentId}-${sanitizedFileName}`;

  if (r2Bucket && typeof r2Bucket.put === "function" && fileBuffer) {
    await r2Bucket.put(r2Key, fileBuffer, {
      httpMetadata: { contentType: mimeType },
      customMetadata: {
        requestId,
        category,
        fileName,
      },
    });
  }

  // 5. Store metadata in attachments table
  await db.insert(attachments).values({
    id: attachmentId,
    requestId,
    r2Key,
    fileName,
    mimeType,
    fileSize,
    category,
    createdAt: new Date(),
  });

  // 6. Audit Trail (Hard Rule 8): Insert request_events row
  await db.insert(requestEvents).values({
    id: nanoid(),
    requestId,
    eventType: "attachment_uploaded",
    actorType,
    payloadJson: JSON.stringify({
      attachmentId,
      fileName,
      mimeType,
      fileSize,
      category,
    }),
  });

  return {
    id: attachmentId,
    requestId,
    r2Key,
    fileName,
    mimeType,
    fileSize,
    category,
  };
}

/**
 * Retrieves an attachment and enforces that the requesting professor owns the associated course (Hard Rule 5).
 */
export async function getAttachmentWithOwnership(
  db: Db,
  profileId: string,
  attachmentId: string,
) {
  const [row] = await db
    .select({
      attachment: attachments,
      request: requests,
      course: courses,
    })
    .from(attachments)
    .innerJoin(requests, eq(attachments.requestId, requests.id))
    .innerJoin(courses, eq(requests.courseId, courses.id))
    .where(eq(attachments.id, attachmentId))
    .limit(1);

  if (!row) {
    return null;
  }

  if (row.course.profileId !== profileId) {
    throw new RequestAccessError("Unauthorized access to attachment");
  }

  return row;
}

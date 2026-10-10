"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/server/auth/session";
import { createDb } from "@/server/db";
import { getServerEnv } from "@/server/env";
import {
  updateProfessorNotesInternal,
  updateRequestStatusActionInternal,
  bulkCloseAutoResolvedInternal,
  type DecisionActionType,
} from "@/server/services/requests";
import { createAttachmentRecord } from "@/server/services/attachments";

/**
 * Saves confidential professor-only notes.
 * Strictly internal; never exposed to student views.
 */
export async function saveProfessorNotesAction(requestId: string, notes: string) {
  const { profile } = await requireProfile();
  const env = await getServerEnv();
  const db = createDb(env.DB);

  await updateProfessorNotesInternal(db, profile.id, requestId, notes);
  revalidatePath(`/inbox/${requestId}`);
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/inbox");

  return { success: true };
}

/**
 * Executes a decision action on a request with IDOR protection and audit logging.
 */
export async function executeRequestAction(
  requestId: string,
  action: DecisionActionType,
  notes?: string,
  assignedToUserId?: string,
) {
  const { profile } = await requireProfile();
  const env = await getServerEnv();
  const db = createDb(env.DB);

  const result = await updateRequestStatusActionInternal(
    db,
    profile.id,
    requestId,
    action,
    notes,
    assignedToUserId,
  );

  revalidatePath(`/inbox/${requestId}`);
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/inbox");

  return { success: true, newStatus: result.newStatus, eventType: result.eventType };
}

export async function approveRequestAction(requestId: string, notes?: string) {
  return executeRequestAction(requestId, "approve", notes);
}

export async function denyRequestAction(requestId: string, notes?: string) {
  return executeRequestAction(requestId, "deny", notes);
}

export async function requireInfoRequestAction(requestId: string, notes?: string) {
  return executeRequestAction(requestId, "require_info", notes);
}

export async function assignToTaRequestAction(
  requestId: string,
  notes?: string,
  assignedToUserId?: string,
) {
  return executeRequestAction(requestId, "assign_to_ta", notes, assignedToUserId);
}

export async function closeRequestAction(requestId: string, notes?: string) {
  return executeRequestAction(requestId, "close", notes);
}

/**
 * Bulk action: Marks all specified Auto-Resolved requests as Closed.
 * Strictly limited to the Auto-Resolved queue and checked for ownership.
 */
export async function bulkCloseAutoResolvedAction(requestIds: string[]) {
  const { profile } = await requireProfile();
  const env = await getServerEnv();
  const db = createDb(env.DB);

  const result = await bulkCloseAutoResolvedInternal(db, profile.id, requestIds);

  revalidatePath("/inbox");

  return { success: true, closedCount: result.closedCount };
}

/**
 * Server action to upload a non-medical attachment to Cloudflare R2.
 * Validates plan limits, MIME allowlist, and medical prohibition.
 */
export async function uploadAttachmentAction(formData: FormData) {
  const { profile } = await requireProfile();
  const env = await getServerEnv();
  const db = createDb(env.DB);

  const file = formData.get("file") as File | null;
  const requestId = formData.get("requestId") as string | null;
  const category = (formData.get("category") as string | null) || "university_document";

  if (!file) {
    throw new Error("No file uploaded.");
  }
  if (!requestId) {
    throw new Error("Missing request ID.");
  }

  const arrayBuffer = await file.arrayBuffer();

  const attachment = await createAttachmentRecord(db, {
    requestId,
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
    category,
    fileBuffer: arrayBuffer,
    r2Bucket: env.ASSETS,
    actorType: "professor",
    callerProfileId: profile.id,
  });

  revalidatePath(`/inbox/${requestId}`);
  revalidatePath(`/requests/${requestId}`);

  return { success: true, attachment };
}

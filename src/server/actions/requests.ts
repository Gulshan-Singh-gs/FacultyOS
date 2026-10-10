"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/server/auth/session";
import { createDb } from "@/server/db";
import { getServerEnv } from "@/server/env";
import {
  updateProfessorNotesInternal,
  updateRequestStatusActionInternal,
} from "@/server/services/requests";

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

export async function executeRequestAction(
  requestId: string,
  action: "approve" | "deny" | "require_info" | "assign_to_ta",
  notes?: string,
) {
  const { profile } = await requireProfile();
  const env = await getServerEnv();
  const db = createDb(env.DB);

  let newStatus = "manual_review";
  if (action === "approve") newStatus = "approved";
  else if (action === "deny") newStatus = "denied";
  else if (action === "require_info") newStatus = "needs_student_info";
  else if (action === "assign_to_ta") newStatus = "ta_review";

  await updateRequestStatusActionInternal(db, profile.id, requestId, newStatus, notes);
  revalidatePath(`/inbox/${requestId}`);
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/inbox");

  return { success: true, newStatus };
}

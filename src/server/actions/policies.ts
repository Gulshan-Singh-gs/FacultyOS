"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/server/auth/session";
import { createDb } from "@/server/db";
import { getServerEnv } from "@/server/env";
import {
  CreatePolicyInputSchema,
  UpdatePolicyInputSchema,
  SeedPoliciesInputSchema,
  type CreatePolicyInput,
  type UpdatePolicyInput,
  type SeedPoliciesInput,
} from "@/lib/validations/policy";
import {
  createPolicyInternal,
  updatePolicyInternal,
  deletePolicyInternal,
  seedCoursePoliciesInternal,
} from "@/server/services/policies";
import type { policies } from "@/server/db/schema";

export async function createPolicyAction(
  rawInput: CreatePolicyInput,
): Promise<{ success: true; data: typeof policies.$inferSelect } | { success: false; error: string }> {
  try {
    const { profile } = await requireProfile();
    const validated = CreatePolicyInputSchema.parse(rawInput);

    const env = await getServerEnv();
    const db = createDb(env.DB);

    const result = await createPolicyInternal(
      db,
      profile.id,
      validated.courseId,
      validated,
    );

    revalidatePath(`/courses/${validated.courseId}`);
    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create policy";
    return { success: false, error: message };
  }
}

export async function updatePolicyAction(
  rawInput: UpdatePolicyInput,
): Promise<{ success: true; data: typeof policies.$inferSelect } | { success: false; error: string }> {
  try {
    const { profile } = await requireProfile();
    const validated = UpdatePolicyInputSchema.parse(rawInput);

    const env = await getServerEnv();
    const db = createDb(env.DB);

    const result = await updatePolicyInternal(db, profile.id, validated);

    revalidatePath(`/courses/${result.courseId}`);
    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update policy";
    return { success: false, error: message };
  }
}

export async function deletePolicyAction(
  rawInput: { policyId: string; courseId: string },
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { profile } = await requireProfile();

    const env = await getServerEnv();
    const db = createDb(env.DB);

    await deletePolicyInternal(db, profile.id, rawInput.policyId);

    revalidatePath(`/courses/${rawInput.courseId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete policy";
    return { success: false, error: message };
  }
}

export async function seedCoursePoliciesAction(
  rawInput: SeedPoliciesInput,
): Promise<{ success: true; data: Array<typeof policies.$inferSelect> } | { success: false; error: string }> {
  try {
    const { profile } = await requireProfile();
    const validated = SeedPoliciesInputSchema.parse(rawInput);

    const env = await getServerEnv();
    const db = createDb(env.DB);

    const results = await seedCoursePoliciesInternal(
      db,
      profile.id,
      validated.courseId,
      validated.templateIds,
    );

    revalidatePath(`/courses/${validated.courseId}`);
    return { success: true, data: results };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to seed policy templates";
    return { success: false, error: message };
  }
}

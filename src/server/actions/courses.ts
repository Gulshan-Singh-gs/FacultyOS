"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/server/auth/session";
import { createDb } from "@/server/db";
import { getServerEnv } from "@/server/env";
import {
  CreateCourseSchema,
  RotateTokenSchema,
  type CreateCourseInput,
} from "@/lib/validations/course";
import {
  createCourseInternal,
  rotateCourseTokenInternal,
  archiveCourseInternal,
  type CreatedCourseResult,
  type RotatedTokenResult,
} from "@/server/services/courses";

export async function createCourseAction(
  rawInput: CreateCourseInput,
): Promise<{ success: true; data: CreatedCourseResult } | { success: false; error: string }> {
  try {
    const { profile, user } = await requireProfile();
    const validated = CreateCourseSchema.parse(rawInput);

    const env = await getServerEnv();
    const db = createDb(env.DB);

    const result = await createCourseInternal(
      db,
      profile.id,
      profile.plan,
      validated,
      user.id,
    );

    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create course";
    return { success: false, error: message };
  }
}

export async function rotateCourseTokenAction(
  rawInput: { courseId: string },
): Promise<{ success: true; data: RotatedTokenResult } | { success: false; error: string }> {
  try {
    const { profile } = await requireProfile();
    const validated = RotateTokenSchema.parse(rawInput);

    const env = await getServerEnv();
    const db = createDb(env.DB);

    const result = await rotateCourseTokenInternal(
      db,
      profile.id,
      validated.courseId,
    );

    revalidatePath(`/courses/${validated.courseId}`);
    revalidatePath("/courses");

    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to rotate access token";
    return { success: false, error: message };
  }
}

export async function archiveCourseAction(
  rawInput: { courseId: string },
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { profile } = await requireProfile();
    const validated = RotateTokenSchema.parse(rawInput);

    const env = await getServerEnv();
    const db = createDb(env.DB);

    await archiveCourseInternal(db, profile.id, validated.courseId);

    revalidatePath(`/courses/${validated.courseId}`);
    revalidatePath("/courses");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to archive course";
    return { success: false, error: message };
  }
}

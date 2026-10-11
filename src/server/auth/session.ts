import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getAuth } from "@/server/auth";
import { getDb } from "@/server/db";
import {
  professorProfiles,
  boundaries,
  usageMetrics,
} from "@/server/db/schema";

export interface AuthenticatedContext {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
  };
  session: {
    id: string;
    token: string;
    expiresAt: Date;
  };
  profile: typeof professorProfiles.$inferSelect;
}

/**
 * Bootstrap a professor profile + default boundaries + usage metrics for a user
 * if they do not exist yet.
 */
export async function getOrCreateProfile(
  userId: string,
  userEmail: string,
  userName?: string | null,
): Promise<typeof professorProfiles.$inferSelect> {
  const db = await getDb();

  const [existing] = await db
    .select()
    .from(professorProfiles)
    .where(eq(professorProfiles.userId, userId))
    .limit(1);

  if (existing) {
    return existing;
  }

  const profileId = `prof_${nanoid(12)}`;
  const displayName = userName || userEmail.split("@")[0] || "Professor";

  const [newProfile] = await db
    .insert(professorProfiles)
    .values({
      id: profileId,
      userId,
      displayName,
      plan: "free",
      timezone: "Asia/Kolkata",
      aiEnabled: false,
    })
    .returning();

  // Create default boundaries per PRD FR4
  await db.insert(boundaries).values({
    id: `bnd_${nanoid(12)}`,
    profileId,
    workDaysJson: JSON.stringify([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ]),
    workStart: "09:00",
    workEnd: "18:00",
    responseSlaHours: 48,
    weekendDefer: true,
    vacationMode: false,
    autoReplyTemplate:
      "Thank you for reaching out. Please note requests received outside normal working hours are queued and reviewed during standard office hours.",
  });

  // Create initial usage metrics row for free tier tracking
  const periodStart = new Date().toISOString().slice(0, 7);
  await db.insert(usageMetrics).values({
    id: `use_${nanoid(12)}`,
    profileId,
    periodStart,
    requestsThisPeriod: 0,
    coursesActive: 0,
  });

  return newProfile;
}

/**
 * Server-side helper that requires an active session and provisioned profile.
 * Redirects to /login if unauthenticated.
 */
export const requireProfile = cache(async (): Promise<AuthenticatedContext> => {
  console.log("[FACULTYOS_TRACE] requireProfile: start");
  const reqHeaders = await headers();
  const cookieHeader = reqHeaders.get("cookie") || "";
  console.log("[FACULTYOS_TRACE] requireProfile: cookieHeader present?", Boolean(cookieHeader));

  if (!cookieHeader.includes("session_token")) {
    console.log("[FACULTYOS_TRACE] requireProfile: no session_token, redirecting to /login");
    redirect("/login");
  }

  let session = null;
  try {
    console.log("[FACULTYOS_TRACE] requireProfile: getting auth instance...");
    const auth = await getAuth();
    console.log("[FACULTYOS_TRACE] requireProfile: got auth, querying getSession...");
    session = await Promise.race([
      auth.api.getSession({ headers: reqHeaders }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    console.log("[FACULTYOS_TRACE] requireProfile: getSession resolved, user:", session?.user?.email || null);
  } catch (err: unknown) {
    console.log("[FACULTYOS_TRACE] requireProfile: getSession exception:", err);
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest: unknown }).digest === "string" &&
      (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    console.warn("[FacultyOS requireProfile] getSession error, redirecting to login:", err);
    redirect("/login");
  }

  if (!session?.user) {
    console.log("[FACULTYOS_TRACE] requireProfile: no session.user, redirecting to /login");
    redirect("/login");
  }

  console.log("[FACULTYOS_TRACE] requireProfile: loading profile for user", session.user.id);
  const profile = await getOrCreateProfile(
    session.user.id,
    session.user.email,
    session.user.name,
  );
  console.log("[FACULTYOS_TRACE] requireProfile: profile ready", profile.id);

  return {
    user: session.user,
    session: session.session,
    profile,
  };
});

/**
 * Returns the authenticated profile and user, or null if not logged in.
 */
export const getCurrentProfile = cache(async (): Promise<AuthenticatedContext | null> => {
  try {
    const reqHeaders = await headers();
    const cookieHeader = reqHeaders.get("cookie") || "";
    if (!cookieHeader.includes("session_token")) {
      return null;
    }

    const auth = await getAuth();
    const session = await Promise.race([
      auth.api.getSession({ headers: reqHeaders }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);

    if (!session?.user) {
      return null;
    }

    const profile = await getOrCreateProfile(
      session.user.id,
      session.user.email,
      session.user.name,
    );

    return {
      user: session.user,
      session: session.session,
      profile,
    };
  } catch {
    return null;
  }
});

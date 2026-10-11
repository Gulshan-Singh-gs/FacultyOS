import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getAuth } from "@/server/auth";
import { createDb } from "@/server/db";
import { getServerEnv } from "@/server/env";
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
  const env = await getServerEnv();
  const db = createDb(env.DB);

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
export async function requireProfile(): Promise<AuthenticatedContext> {
  const reqHeaders = await headers();
  let session = null;
  try {
    const auth = await getAuth();
    session = await auth.api.getSession({ headers: reqHeaders });
  } catch (err) {
    console.warn("[FacultyOS requireProfile] getSession threw error, redirecting to login:", err);
    redirect("/login");
  }

  if (!session?.user) {
    redirect("/login");
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
}

/**
 * Returns the authenticated profile and user, or null if not logged in.
 */
export async function getCurrentProfile(): Promise<AuthenticatedContext | null> {
  try {
    const reqHeaders = await headers();
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: reqHeaders });

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
}

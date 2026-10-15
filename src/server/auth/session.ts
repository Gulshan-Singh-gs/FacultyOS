import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { and, eq, or, gt, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/server/db";
import {
  professorProfiles,
  boundaries,
  usageMetrics,
  user as userTable,
  session as sessionTable,
} from "@/server/db/schema";

export interface SessionData {
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
}

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
 * if they do not exist yet. Uses D1-safe idempotent inserts instead of SQL transactions.
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

  await db
    .insert(professorProfiles)
    .values({
      id: profileId,
      userId,
      displayName,
      plan: "free",
      timezone: "Asia/Kolkata",
      aiEnabled: false,
    })
    .onConflictDoNothing();

  const [profile] = await db
    .select()
    .from(professorProfiles)
    .where(eq(professorProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    throw new Error("Failed to provision professor profile in D1");
  }

  // Only seed boundaries and usageMetrics if we just created this profileId
  if (profile.id === profileId) {
    const periodStart = new Date().toISOString().slice(0, 7);
    await Promise.allSettled([
      db.insert(boundaries).values({
        id: `bnd_${nanoid(12)}`,
        profileId: profile.id,
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
      }),
      db.insert(usageMetrics).values({
        id: `use_${nanoid(12)}`,
        profileId: profile.id,
        periodStart,
        requestsThisPeriod: 0,
        coursesActive: 0,
      }),
    ]);
  }

  return profile;
}

/**
 * Resolves current session directly from D1 by checking session cookies.
 * Bypasses BetterAuth's internal router to avoid promise stalls / context loss in RSCs.
 */
export const getSession = cache(async (): Promise<SessionData | null> => {
  const cookieNames = [
    "__Secure-facultyos.session_token",
    "facultyos.session_token",
    "__Secure-better-auth.session_token",
    "better-auth.session_token",
    "auth_session",
  ];

  let rawCookieValue: string | undefined;

  try {
    const cookieStore = await cookies();
    for (const name of cookieNames) {
      const val = cookieStore.get(name)?.value;
      if (val) {
        rawCookieValue = val;
        break;
      }
    }
  } catch {
    // Outside request context or fallback
  }

  if (!rawCookieValue) {
    try {
      const reqHeaders = await headers();
      const cookieHeader = reqHeaders.get("cookie") || "";
      for (const name of cookieNames) {
        const match = cookieHeader.match(
          new RegExp(`(?:^|;\\s*)${name.replace(".", "\\.")}=([^;]+)`)
        );
        if (match?.[1]) {
          rawCookieValue = match[1];
          break;
        }
      }
    } catch {}
  }

  if (!rawCookieValue) {
    return null;
  }

  let sessionToken = decodeURIComponent(rawCookieValue.trim());
  if (sessionToken.includes(".")) {
    sessionToken = sessionToken.split(".")[0];
  }

  try {
    const db = await getDb();
    const nowMs = Date.now();
    const nowSec = Math.floor(nowMs / 1000);

    const [sessionRow] = await db
      .select()
      .from(sessionTable)
      .where(
        and(
          eq(sessionTable.token, sessionToken),
          or(
            gt(sessionTable.expiresAt, new Date(nowMs)),
            sql`${sessionTable.expiresAt} < 10000000000 AND ${sessionTable.expiresAt} > ${nowSec}`
          )
        )
      )
      .limit(1);

    if (!sessionRow) {
      return null;
    }

    const [userRow] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, sessionRow.userId))
      .limit(1);

    if (!userRow) {
      return null;
    }

    let expiresAt = sessionRow.expiresAt;
    if (expiresAt instanceof Date && expiresAt.getTime() < 1000000000000) {
      expiresAt = new Date(expiresAt.getTime() * 1000);
    }

    return {
      user: {
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        image: userRow.image ?? null,
      },
      session: {
        id: sessionRow.id,
        token: sessionRow.token,
        expiresAt,
      },
    };
  } catch (err) {
    console.warn("[FACULTYOS_TRACE] getSession D1 query error:", err);
    return null;
  }
});

/**
 * Server-side helper that requires an active session.
 * Redirects to /login if unauthenticated.
 */
export const requireAuth = cache(async (): Promise<SessionData> => {
  const sessionData = await getSession();
  if (!sessionData?.user) {
    redirect("/login");
  }
  return sessionData;
});

/**
 * Server-side helper that requires an active session and provisioned profile.
 * Redirects to /login if unauthenticated or /onboarding if profile is missing.
 */
export const requireProfile = cache(async (): Promise<AuthenticatedContext> => {
  const sessionData = await requireAuth();

  const profile = await getOrCreateProfile(
    sessionData.user.id,
    sessionData.user.email,
    sessionData.user.name,
  );

  if (!profile) {
    redirect("/onboarding");
  }

  return {
    user: sessionData.user,
    session: sessionData.session,
    profile,
  };
});

/**
 * Helper to get current profile without throwing redirects if unauthenticated.
 */
export const getCurrentProfile = cache(async (): Promise<AuthenticatedContext | null> => {
  try {
    const sessionData = await getSession();
    if (!sessionData?.user) {
      return null;
    }

    const profile = await getOrCreateProfile(
      sessionData.user.id,
      sessionData.user.email,
      sessionData.user.name,
    );

    if (!profile) {
      return null;
    }

    return {
      user: sessionData.user,
      session: sessionData.session,
      profile,
    };
  } catch {
    return null;
  }
});
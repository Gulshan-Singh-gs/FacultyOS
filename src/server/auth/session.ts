import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getAuth } from "@/server/auth";
import { getDb } from "@/server/db";
import {
  professorProfiles,
  boundaries,
  usageMetrics,
  user as userTable,
  session as sessionTable,
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

interface ResolvedSessionData {
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

async function resolveDirectSessionFromD1(
  cookieHeader: string,
): Promise<ResolvedSessionData | null> {
  try {
    const match =
      cookieHeader.match(/(?:__Secure-)?(?:facultyos|better-auth)\.session_token=([^;]+)/i) ||
      cookieHeader.match(/session_token=([^;]+)/i);
    if (!match?.[1]) return null;

    let rawToken = decodeURIComponent(match[1].trim());
    if (rawToken.includes(".")) rawToken = rawToken.split(".")[0];

    const db = await getDb();
    const now = new Date();
    const [activeSession] = await db
      .select()
      .from(sessionTable)
      .where(
        and(
          eq(sessionTable.token, rawToken),
          gt(sessionTable.expiresAt, now),
        ),
      )
      .limit(1);

    if (!activeSession) return null;

    const [dbUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, activeSession.userId))
      .limit(1);

    if (!dbUser) return null;

    console.log("[FACULTYOS_TRACE] direct D1 session verification success for:", dbUser.email);
    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        image: dbUser.image ?? null,
      },
      session: {
        id: activeSession.id,
        token: activeSession.token,
        expiresAt: activeSession.expiresAt,
      },
    };
  } catch (err) {
    console.warn("[FACULTYOS_TRACE] resolveDirectSessionFromD1 error:", err);
    return null;
  }
}

/**
 * Server-side helper that requires an active session and provisioned profile.
 * Redirects to /login if unauthenticated.
 */
export const requireProfile = cache(async (): Promise<AuthenticatedContext> => {
  const reqHeaders = await headers();
  const cookieHeader = reqHeaders.get("cookie") || "";

  if (!cookieHeader.includes("session_token")) {
    redirect("/login");
  }

  // 1. Fast-path: Verify directly against D1 (<5ms, zero cross-request context issues)
  let session = await resolveDirectSessionFromD1(cookieHeader);

  // 2. Fallback to BetterAuth getSession only if direct check didn't match
  if (!session?.user) {
    try {
      const auth = await getAuth();
      session = await Promise.race([
        auth.api.getSession({ headers: reqHeaders }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
      ]);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        typeof (err as { digest: unknown }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        throw err;
      }
      console.warn("[FacultyOS requireProfile] getSession error:", err);
    }
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
});

export const getCurrentProfile = cache(async (): Promise<AuthenticatedContext | null> => {
  try {
    const reqHeaders = await headers();
    const cookieHeader = reqHeaders.get("cookie") || "";
    if (!cookieHeader.includes("session_token")) {
      return null;
    }

    let session = await resolveDirectSessionFromD1(cookieHeader);

    if (!session?.user) {
      const auth = await getAuth();
      session = await Promise.race([
        auth.api.getSession({ headers: reqHeaders }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
      ]);
    }

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
import { NextResponse } from "next/server";
import { sha256 } from "@/lib/utils";
import {
  ExtensionRequestSchema,
  AnyIntakeRequestSchema,
  type AnyIntakeRequestInput,
} from "@/lib/validations/request";
import { PolicySchema } from "@/lib/validations/policy";
import { createDb } from "@/server/db";
import {
  courses,
  policies,
  requests,
  requestEvents,
  studentIdentities,
} from "@/server/db/schema";
import { evaluatePolicies } from "@/server/services/policy-engine/engine";
import type { Policy, RequestPayload } from "@/server/services/policy-engine/types";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { getServerEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ courseToken: string }> },
) {
  const env = await getServerEnv();
  const { courseToken } = await ctx.params;
  const db = createDb(env.DB);

  /* 1. Rate limiting via Cloudflare KV (Sliding Window — max 10/IP/10m, max 30/course/1h) */
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const ipKey = `rl:intake:ip:${ip}`;
  const courseKey = `rl:intake:course:${courseToken}`;

  if (env.RATE_LIMIT) {
    const ipCount = Number((await env.RATE_LIMIT.get(ipKey)) ?? 0);
    if (ipCount >= 10) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait before submitting again." },
        { status: 429 },
      );
    }

    const courseCount = Number((await env.RATE_LIMIT.get(courseKey)) ?? 0);
    if (courseCount >= 30) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait before submitting again." },
        { status: 429 },
      );
    }

    await Promise.all([
      env.RATE_LIMIT.put(ipKey, String(ipCount + 1), { expirationTtl: 600 }),
      env.RATE_LIMIT.put(courseKey, String(courseCount + 1), { expirationTtl: 3600 }),
    ]);
  }

  /* 2. Validate input (Zod blocks medical categories by design — Hard Rule 1) */
  let rawBody: Record<string, unknown>;
  try {
    rawBody = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  let input: AnyIntakeRequestInput;
  if (!rawBody.requestType || rawBody.requestType === "extension") {
    const extParsed = ExtensionRequestSchema.safeParse(rawBody);
    if (!extParsed.success) {
      return NextResponse.json({ error: extParsed.error.flatten() }, { status: 400 });
    }
    input = { ...extParsed.data, requestType: "extension" };
  } else {
    const parsed = AnyIntakeRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    input = parsed.data;
  }

  /* 3. Resolve course by hashed token (tenant isolation — Hard Rule 5) */
  const tokenHash = await sha256(courseToken);
  const course = await db.query.courses.findFirst({
    where: eq(courses.accessTokenHash, tokenHash),
  });
  if (!course || course.status !== "active") {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  /* 4. Load active policies and re-validate stored JSON before trusting it */
  const rows = await db.query.policies.findMany({
    where: and(eq(policies.courseId, course.id), eq(policies.isActive, true)),
  });
  const safePolicies: Policy[] = rows
    .map((r) => {
      try {
        return {
          id: r.id,
          policyType: r.policyType as Policy["policyType"],
          priority: r.priority,
          conditions: JSON.parse(r.conditionsJson),
          actions: JSON.parse(r.actionsJson),
          version: r.version,
          isActive: r.isActive,
        };
      } catch {
        return null;
      }
    })
    .filter((p): p is Policy => p !== null && PolicySchema.omit({ name: true }).safeParse(p).success);

  /* 5. Build enriched payload and evaluate deterministically */
  let daysBeforeDeadline = 0;
  if (input.requestType === "extension" && "currentDeadline" in input) {
    daysBeforeDeadline =
      (new Date(input.currentDeadline).getTime() - Date.now()) / 86_400_000;
  }

  const payload: RequestPayload = {
    ...input,
    requestType: input.requestType as Policy["policyType"],
    ...(input.requestType === "extension" && "currentDeadline" in input
      ? {
          currentDeadline: new Date(input.currentDeadline).toISOString(),
          requestedNewDeadline: new Date(input.requestedNewDeadline).toISOString(),
          daysBeforeDeadline: Math.round(daysBeforeDeadline * 10) / 10,
        }
      : {}),
  };

  const decision = evaluatePolicies(safePolicies, payload);

  /* 6. Persist identity + request + audit event */
  const emailHash = await sha256(input.studentEmail.toLowerCase().trim());
  let identity = await db.query.studentIdentities.findFirst({
    where: and(
      eq(studentIdentities.emailHash, emailHash),
      eq(studentIdentities.courseId, course.id),
    ),
  });

  if (!identity) {
    const id = nanoid();
    await db.insert(studentIdentities).values({
      id,
      courseId: course.id,
      displayLabel: input.studentName,
      emailHash,
    });
    identity = {
      id,
      courseId: course.id,
      displayLabel: input.studentName,
      emailHash,
      emailEncrypted: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const requestId = nanoid();
  const publicToken = nanoid(24);

  await db.insert(requests).values({
    id: requestId,
    publicToken,
    courseId: course.id,
    studentIdentityId: identity.id,
    requestType: input.requestType,
    status: decision.status,
    intakePayloadJson: JSON.stringify(payload),
    matchedPolicyId: decision.matchedPolicyId,
    matchedPolicyVersion: decision.matchedPolicyVersion,
    policySnapshotJson: JSON.stringify(decision.actions),
    decisionReasonJson: JSON.stringify(decision.reasons),
    penaltyPercent:
      decision.actions.find((a) => a.type === "apply_penalty")
        ?.penaltyPercent ?? null,
  });

  await db.insert(requestEvents).values({
    id: nanoid(),
    requestId,
    eventType: "request_created",
    actorType: "student",
    payloadJson: JSON.stringify({
      status: decision.status,
      matchedPolicyId: decision.matchedPolicyId,
    }),
  });

  /* 7. Push notification to queue without blocking HTTP response */
  try {
    if (env.NOTIFICATIONS?.send) {
      await env.NOTIFICATIONS.send({
        type: "request_created",
        requestId,
        courseId: course.id,
      });
    }
  } catch (err) {
    // Graceful queue deferral
    console.warn("Queue push notification deferred:", err);
  }

  return NextResponse.json(
    {
      requestToken: publicToken,
      status: decision.status,
      message:
        decision.status === "auto_approved"
          ? "Your request was approved per course policy."
          : decision.status === "auto_denied"
            ? "Your request was denied per course policy."
            : "Your request was submitted for review.",
    },
    { status: 201 },
  );
}

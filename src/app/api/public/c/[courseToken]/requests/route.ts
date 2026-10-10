import { NextResponse } from "next/server";
import { sha256 } from "@/lib/utils";
import { ExtensionRequestSchema } from "@/lib/validations/request";
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
import { eq } from "drizzle-orm";
import type { FacultyOSEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ courseToken: string }> },
) {
  const env = process.env as unknown as FacultyOSEnv;
  const { courseToken } = await ctx.params;
  const db = createDb(env.DB);

  /* 1. Rate limit (KV sliding window — 10 submissions per IP per 10 min) */
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  const key = `rl:intake:${ip}`;
  const count = Number((await env.RATE_LIMIT.get(key)) ?? 0);
  if (count >= 10) {
    return NextResponse.json(
      { error: "Too many submissions. Try again later." },
      { status: 429 },
    );
  }
  await env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: 600 });

  /* 2. Validate input (Zod blocks medical categories by design — Hard Rule 1) */
  const parsed = ExtensionRequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

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
    where: eq(policies.courseId, course.id),
  });
  const safePolicies: Policy[] = rows
    .map((r) => ({
      id: r.id,
      policyType: r.policyType as Policy["policyType"],
      priority: r.priority,
      conditions: JSON.parse(r.conditionsJson),
      actions: JSON.parse(r.actionsJson),
      version: r.version,
      isActive: r.isActive,
    }))
    .filter((p) => PolicySchema.omit({ name: true }).safeParse(p).success);

  /* 5. Build enriched payload and evaluate deterministically */
  const daysBeforeDeadline =
    (new Date(input.currentDeadline).getTime() - Date.now()) / 86_400_000;

  const payload: RequestPayload = {
    requestType: "extension",
    ...input,
    currentDeadline: input.currentDeadline.toISOString(),
    requestedNewDeadline: input.requestedNewDeadline.toISOString(),
    daysBeforeDeadline: Math.round(daysBeforeDeadline * 10) / 10,
  };

  const decision = evaluatePolicies(safePolicies, payload);

  /* 6. Persist identity + request + audit event */
  const emailHash = await sha256(input.studentEmail.toLowerCase());
  let identity = await db.query.studentIdentities.findFirst({
    where: (t) => eq(t.emailHash, emailHash),
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
    requestType: "extension",
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

  /* 7. Notify professor queue (boundaries respected in Phase 3) */
  await env.NOTIFICATIONS.send({
    type: "request_created",
    requestId,
    courseId: course.id,
  });

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

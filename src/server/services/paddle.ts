import type { Db } from "@/server/db";
import { professorProfiles, subscriptions } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * Validates Paddle webhook signature (HMAC-SHA256)
 * Format of header Paddle-Signature: ts=123456789;h=abcdef...
 */
export async function verifyPaddleWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secretKey: string,
): Promise<boolean> {
  if (!signatureHeader || !secretKey) return false;

  const parts = signatureHeader.split(";").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=");
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});

  const ts = parts["ts"];
  const h = parts["h"];

  if (!ts || !h) return false;

  // Prevent replay attacks (allow up to 5 minutes difference)
  const timestamp = parseInt(ts, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return false;
  }

  const signedPayload = `${ts}:${rawBody}`;
  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(secretKey);
  const dataBuffer = encoder.encode(signedPayload);

  try {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBuffer);
    const hashArray = Array.from(new Uint8Array(signature));
    const computedHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    return computedHex === h;
  } catch {
    return false;
  }
}

export interface PaddleWebhookEvent {
  event_id: string;
  event_type: string;
  occurred_at: string;
  data: any;
}

/**
 * Maps Paddle Price ID to application plan tier
 */
export function mapPriceToPlan(priceId?: string, env?: any): "free" | "pro" | "department" {
  const proMonthly =
    env?.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY ||
    process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY ||
    "pri_01m4mwgb41h1bqc8p81cg0ee4g";
  const proSemester =
    env?.NEXT_PUBLIC_PADDLE_PRICE_PRO_SEMESTER ||
    process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_SEMESTER ||
    "pri_01m4mwpvt6wevqx3dty501tdcx";
  const deptYearly =
    env?.NEXT_PUBLIC_PADDLE_PRICE_DEPT_YEARLY ||
    process.env.NEXT_PUBLIC_PADDLE_PRICE_DEPT_YEARLY ||
    "pri_01m4mwvdhcv3hyrymyxazr1rwt";

  if (priceId === proMonthly || priceId === proSemester) {
    return "pro";
  }
  if (priceId === deptYearly) {
    return "department";
  }
  return "pro";
}

/**
 * Processes incoming verified Paddle subscription events
 */
export async function handlePaddleSubscriptionEvent(
  db: Db,
  event: PaddleWebhookEvent,
  env?: any,
): Promise<{ handled: boolean; error?: string }> {
  const { event_type, data } = event;

  if (
    event_type.startsWith("subscription.") ||
    event_type === "transaction.completed"
  ) {
    const subscriptionId = data.id || data.subscription_id;
    const customerId = data.customer_id;
    const status = data.status || "active"; // active, past_due, canceled, paused
    const items = data.items || [];
    const priceId = items[0]?.price?.id || data.details?.line_items?.[0]?.price_id;
    const customData = data.custom_data || {};
    const profileId = customData.profileId;

    if (!profileId && !subscriptionId) {
      return { handled: false, error: "Missing profileId and subscriptionId" };
    }

    const plan = mapPriceToPlan(priceId, env);
    const isPlanActive = status === "active" || status === "trialing";

    // 1. Locate professor profile
    let targetProfileId = profileId;
    if (!targetProfileId && subscriptionId) {
      const [existingSub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.providerSubscriptionId, subscriptionId))
        .limit(1);
      if (existingSub) {
        targetProfileId = existingSub.profileId;
      }
    }

    if (!targetProfileId) {
      return { handled: false, error: `Could not identify professor profile for sub ${subscriptionId}` };
    }

    // 2. Parse current period end
    let currentPeriodEnd: Date | null = null;
    if (data.current_billing_period?.ends_at) {
      currentPeriodEnd = new Date(data.current_billing_period.ends_at);
    }

    // 3. Upsert subscription record
    const [existingSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.providerSubscriptionId, subscriptionId))
      .limit(1);

    if (existingSub) {
      await db
        .update(subscriptions)
        .set({
          status,
          plan,
          priceId: priceId || existingSub.priceId,
          customerId: customerId || existingSub.customerId,
          currentPeriodEnd: currentPeriodEnd || existingSub.currentPeriodEnd,
          cancelAtPeriodEnd: data.scheduled_change?.action === "cancel",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existingSub.id));
    } else {
      await db.insert(subscriptions).values({
        id: `sub_${nanoid(16)}`,
        profileId: targetProfileId,
        provider: "paddle",
        customerId,
        providerSubscriptionId: subscriptionId,
        priceId,
        plan,
        status,
        currentPeriodEnd,
        cancelAtPeriodEnd: data.scheduled_change?.action === "cancel",
      });
    }

    // 4. Update professor profile tier
    await db
      .update(professorProfiles)
      .set({
        plan: isPlanActive ? plan : "free",
        updatedAt: new Date(),
      })
      .where(eq(professorProfiles.id, targetProfileId));

    return { handled: true };
  }

  return { handled: true };
}

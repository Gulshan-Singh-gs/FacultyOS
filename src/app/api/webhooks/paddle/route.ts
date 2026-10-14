import { NextResponse } from "next/server";
import { getServerEnv } from "@/server/env";
import { getDb } from "@/server/db";
import {
  verifyPaddleWebhookSignature,
  handlePaddleSubscriptionEvent,
  type PaddleWebhookEvent,
} from "@/server/services/paddle";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const env = await getServerEnv();
    const signatureHeader = request.headers.get("Paddle-Signature");

    if (!env.PADDLE_WEBHOOK_SECRET_KEY) {
      console.error("[Paddle Webhook] PADDLE_WEBHOOK_SECRET_KEY not configured");
      return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
    }

    const rawBody = await request.text();

    const isValid = await verifyPaddleWebhookSignature(
      rawBody,
      signatureHeader,
      env.PADDLE_WEBHOOK_SECRET_KEY,
    );

    if (!isValid) {
      console.warn("[Paddle Webhook] Invalid signature rejected");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event: PaddleWebhookEvent = JSON.parse(rawBody);
    const db = await getDb();

    const result = await handlePaddleSubscriptionEvent(db, event, env);

    if (!result.handled && result.error) {
      console.warn("[Paddle Webhook] Event not handled:", result.error);
    }

    return NextResponse.json({ success: true, event_id: event.event_id });
  } catch (error) {
    console.error("[Paddle Webhook] Handler error:", error);
    return NextResponse.json(
      { error: "Internal webhook processing error" },
      { status: 500 },
    );
  }
}

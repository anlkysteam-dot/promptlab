import { EventName } from "@paddle/paddle-node-sdk";
import { NextResponse } from "next/server";
import {
  clearPremiumForPaddleSubscription,
  syncUserPremiumFromPaddleSubscription,
  type PaddleSubscriptionLike,
} from "@/lib/paddle-subscription-sync";
import { grantPurchasedCreditsIdempotent } from "@/lib/credits-grant";
import { getPaddle } from "@/lib/paddle";

export const runtime = "nodejs";

function asSubscriptionPayload(raw: unknown): PaddleSubscriptionLike | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = o.id;
  const status = o.status;
  const customerId = (o.customerId ?? o.customer_id) as unknown;
  if (typeof id !== "string" || typeof status !== "string" || typeof customerId !== "string") {
    return null;
  }
  let customData: Record<string, unknown> | null = null;
  const cd = o.customData ?? o.custom_data;
  if (cd && typeof cd === "object" && !Array.isArray(cd)) {
    customData = cd as Record<string, unknown>;
  }
  let currentBillingPeriod: { endsAt: string } | null = null;
  const cbp = o.currentBillingPeriod ?? o.current_billing_period;
  if (cbp && typeof cbp === "object") {
    const p = cbp as Record<string, unknown>;
    const ends = (p.endsAt ?? p.ends_at) as unknown;
    if (typeof ends === "string") currentBillingPeriod = { endsAt: ends };
  }
  const nextRaw = (o.nextBilledAt ?? o.next_billed_at) as unknown;
  const nextBilledAt = typeof nextRaw === "string" ? nextRaw : null;
  return {
    id,
    status,
    customerId,
    customData,
    currentBillingPeriod,
    nextBilledAt,
  };
}

const SYNC_TYPES = new Set<string>([
  EventName.SubscriptionActivated,
  EventName.SubscriptionCreated,
  EventName.SubscriptionUpdated,
  EventName.SubscriptionTrialing,
  EventName.SubscriptionPastDue,
  EventName.SubscriptionResumed,
]);

export async function POST(req: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Webhook yapılandırılmamış." }, { status: 503 });
  }

  const signature = req.headers.get("paddle-signature") ?? "";
  const rawBody = await req.text();

  if (!signature || !rawBody) {
    return NextResponse.json({ error: "Eksik imza veya gövde." }, { status: 400 });
  }

  const paddle = getPaddle();
  let event;
  try {
    event = await paddle.webhooks.unmarshal(rawBody, secret, signature);
  } catch (e) {
    console.error("Paddle webhook imza:", e);
    return NextResponse.json({ error: "Geçersiz imza." }, { status: 400 });
  }

  try {
    if (event.eventType === EventName.TransactionPaid) {
      const raw = event.data as unknown;
      if (raw && typeof raw === "object") {
        const d = raw as Record<string, unknown>;
        const txnId = typeof d.id === "string" ? d.id : null;
        const cd = d.customData as Record<string, unknown> | null | undefined;
        if (txnId && cd && cd.kind === "credit_pack" && typeof cd.promptlabUserId === "string") {
          const creditsRaw = cd.credits;
          const credits =
            typeof creditsRaw === "number"
              ? creditsRaw
              : typeof creditsRaw === "string"
                ? parseInt(creditsRaw, 10)
                : NaN;
          if (Number.isFinite(credits) && credits > 0) {
            await grantPurchasedCreditsIdempotent(
              cd.promptlabUserId,
              credits,
              "paddle",
              txnId,
              `+${credits} kredi`,
            );
          }
        }
      }
      return NextResponse.json({ received: true });
    }

    if (event.eventType === EventName.SubscriptionCanceled) {
      const sub = asSubscriptionPayload(event.data);
      if (sub) await clearPremiumForPaddleSubscription(sub.id);
      return NextResponse.json({ received: true });
    }

    if (SYNC_TYPES.has(event.eventType)) {
      const sub = asSubscriptionPayload(event.data);
      if (sub) await syncUserPremiumFromPaddleSubscription(sub);
      return NextResponse.json({ received: true });
    }

    if (event.eventType === EventName.SubscriptionPaused) {
      const sub = asSubscriptionPayload(event.data);
      if (sub) await syncUserPremiumFromPaddleSubscription(sub);
      return NextResponse.json({ received: true });
    }
  } catch (e) {
    console.error("Paddle webhook işleyici:", e);
    return NextResponse.json({ error: "İşlenemedi." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

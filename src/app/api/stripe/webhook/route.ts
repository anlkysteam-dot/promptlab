import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { grantPurchasedCreditsIdempotent } from "@/lib/credits-grant";
import { clearPremiumForSubscription, syncUserPremiumFromSubscription } from "@/lib/subscription-sync";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return NextResponse.json({ error: "Stripe kapalı." }, { status: 503 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Webhook yapılandırılmamış." }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "İmza yok." }, { status: 400 });
  }

  const buf = Buffer.from(await req.arrayBuffer());
  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(buf, sig, secret);
  } catch (e) {
    console.error("Stripe webhook imza hatası:", e);
    return NextResponse.json({ error: "Geçersiz imza." }, { status: 400 });
  }

  const stripe = getStripe();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const sess = event.data.object as Stripe.Checkout.Session;
        if (sess.mode === "payment") {
          const meta = sess.metadata ?? {};
          if (meta.kind === "credit_pack" && meta.userId && meta.credits && sess.id) {
            const credits = parseInt(meta.credits, 10);
            if (Number.isFinite(credits) && credits > 0) {
              await grantPurchasedCreditsIdempotent(meta.userId, credits, "stripe", sess.id, `+${credits} kredi`);
            }
          }
          break;
        }
        if (sess.mode !== "subscription") break;
        const subRef = sess.subscription;
        if (!subRef) break;
        const subId = typeof subRef === "string" ? subRef : subRef.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        await syncUserPremiumFromSubscription(sub, sess.client_reference_id);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await syncUserPremiumFromSubscription(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await clearPremiumForSubscription(sub.id);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("Webhook işleyici hatası:", e);
    return NextResponse.json({ error: "İşlenemedi." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

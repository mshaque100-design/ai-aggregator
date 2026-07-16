import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const prisma = await db();

  const existing = prisma
    ? await prisma.stripeEvent.findUnique({ where: { stripeId: event.id } })
    : null;
  if (existing?.processed) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const priceId = session.metadata?.priceId;

        if (userId && prisma) {
          const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
          const premiumPriceId = process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID;

          const newPlan = priceId === premiumPriceId ? "PREMIUM" : "PRO";

          await prisma.user.upsert({
            where: { id: userId },
            create: {
              id: userId,
              email: "",
              plan: newPlan,
              stripeId: session.customer as string,
            },
            update: {
              plan: newPlan,
              stripeId: session.customer as string,
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        if (prisma) {
          const user = await prisma.user.findFirst({
            where: { stripeId: sub.customer as string },
          });
          if (user) {
            // Downgrade to PRO (not free — they keep free models access)
            await prisma.user.update({
              where: { id: user.id },
              data: { plan: "PRO" },
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (prisma) {
          const user = await prisma.user.findFirst({
            where: { stripeId: invoice.customer as string },
          });
          if (user && user.plan === "PREMIUM") {
            await prisma.user.update({
              where: { id: user.id },
              data: { plan: "PRO" },
            });
          }
        }
        break;
      }
    }

    if (prisma) {
      await prisma.stripeEvent.upsert({
        where: { stripeId: event.id },
        create: { stripeId: event.id, type: event.type, processed: true, data: event.data as object },
        update: { processed: true },
      });
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
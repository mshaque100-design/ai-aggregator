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
  if (!prisma) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  const existing = await prisma.stripeEvent.findUnique({ where: { stripeId: event.id } });
  if (existing?.processed) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const priceId = session.metadata?.priceId;

        if (userId) {
          const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID;
          const credits100Id = process.env.NEXT_PUBLIC_STRIPE_CREDITS_100_PRICE_ID;
          const credits500Id = process.env.NEXT_PUBLIC_STRIPE_CREDITS_500_PRICE_ID;

          if (priceId === proPriceId) {
            await prisma.user.upsert({
              where: { id: userId },
              create: { id: userId, email: "", credits: 500, plan: "PRO", stripeId: session.customer as string },
              update: { credits: { increment: 500 }, plan: "PRO", stripeId: session.customer as string },
            });
          } else if (priceId === credits100Id) {
            await prisma.user.upsert({
              where: { id: userId },
              create: { id: userId, email: "", credits: 100 },
              update: { credits: { increment: 100 } },
            });
          } else if (priceId === credits500Id) {
            await prisma.user.upsert({
              where: { id: userId },
              create: { id: userId, email: "", credits: 500 },
              update: { credits: { increment: 500 } },
            });
          }
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const user = await prisma.user.findFirst({ where: { stripeId: sub.customer as string } });
        if (user) {
          await prisma.user.update({ where: { id: user.id }, data: { plan: "FREE" } });
        }
        break;
      }
    }

    await prisma.stripeEvent.upsert({
      where: { stripeId: event.id },
      create: { stripeId: event.id, type: event.type, processed: true, data: event.data as object },
      update: { processed: true },
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
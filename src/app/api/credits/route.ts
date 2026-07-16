import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ plan: "GUEST", trialEndsAt: null, isSignedIn: false });
    }

    const prisma = await db();
    if (!prisma) {
      return NextResponse.json({ plan: "TRIAL", trialEndsAt: new Date(Date.now() + 7 * 86400000).toISOString(), isSignedIn: true });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, trialEndsAt: true },
    });

    // Auto-expire trial if past end date
    let plan = user?.plan ?? "TRIAL";
    let trialEndsAt = user?.trialEndsAt ?? new Date(Date.now() + 7 * 86400000);

    if (plan === "TRIAL" && trialEndsAt && new Date() > trialEndsAt) {
      // Don't auto-downgrade in the GET — let the chat route enforce it
      // Just report the expired state
    }

    return NextResponse.json({
      plan,
      trialEndsAt: trialEndsAt?.toISOString() ?? null,
      trialDaysLeft: trialEndsAt
        ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null,
      isSignedIn: true,
    });
  } catch {
    return NextResponse.json({ plan: "GUEST", trialEndsAt: null, isSignedIn: false });
  }
}

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = await db();
    if (!prisma) {
      return NextResponse.json({ plan: "TRIAL", trialEndsAt: new Date(Date.now() + 7 * 86400000).toISOString() });
    }

    const user = await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: "",
        plan: "TRIAL",
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      update: {},
    });

    return NextResponse.json({
      plan: user.plan,
      trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ credits: 10, plan: "FREE", isSignedIn: false });
    }

    const prisma = await db();
    if (!prisma) {
      return NextResponse.json({ credits: 10, plan: "FREE", isSignedIn: true });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, plan: true },
    });

    return NextResponse.json({
      credits: user?.credits ?? 10,
      plan: user?.plan ?? "FREE",
      isSignedIn: true,
    });
  } catch {
    return NextResponse.json({ credits: 10, plan: "FREE", isSignedIn: false });
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
      return NextResponse.json({ credits: 10, plan: "FREE" });
    }

    const user = await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, email: "", credits: 10, plan: "FREE" },
      update: {},
    });

    return NextResponse.json({ credits: user.credits, plan: user.plan });
  } catch {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
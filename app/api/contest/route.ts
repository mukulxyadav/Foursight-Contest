import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

// GET /api/contest — list all active/public contests
export async function GET() {
  try {
    const contests = await prisma.contest.findMany({
      where: {
        status: {
          notIn: ["CANCELLED"],
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        status: true,
        registrationStart: true,
        registrationEnd: true,
        contestStart: true,
        contestEnd: true,
        startingCapital: true,
        leaderboardVisible: true,
        _count: { select: { participants: true } },
      },
      orderBy: { contestStart: "desc" },
    });
    return NextResponse.json({ contests });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch contests" }, { status: 500 });
  }
}

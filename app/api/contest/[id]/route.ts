import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getAuthUser } from "@/app/api/_lib/auth";

// GET /api/contest/[id] — contest detail + current user's participant status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const contest = await prisma.contest.findUnique({
      where: { id },
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
        transactionFee: true,
        maxOrderQty: true,
        maxTrades: true,
        allowShortSelling: true,
        allowMarketOrders: true,
        enforceMarketHours: true,
        leaderboardVisible: true,
        leaderboardFrozen: true,
        _count: { select: { participants: true } },
        announcements: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, title: true, message: true, priority: true, createdAt: true },
        },
      },
    });

    if (!contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    // Check if current user is a participant
    let myParticipant = null;
    const user = await getAuthUser(req);
    if (user) {
      myParticipant = await prisma.contestParticipant.findUnique({
        where: {
          contestId_foursightUsername: {
            contestId: id,
            foursightUsername: user.username,
          },
        },
        select: {
          participantId: true,
          status: true,
          capitalAllocated: true,
          cashBalance: true,
          startingCapital: true,
        },
      });
    }

    return NextResponse.json({ contest, myParticipant });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch contest" }, { status: 500 });
  }
}

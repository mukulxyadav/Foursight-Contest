import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getAuthUser } from "@/app/api/_lib/auth";
import { getLivePrices } from "@/app/api/_lib/price";
import { calculatePortfolioValue } from "@/app/api/_lib/contest";

// GET /api/contest/[id]/portfolio
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const participant = await prisma.contestParticipant.findUnique({
      where: {
        contestId_foursightUsername: {
          contestId: id,
          foursightUsername: user.username,
        },
      },
      include: {
        positions: {
          where: { quantity: { gt: 0 } },
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "You are not registered for this contest" },
        { status: 404 }
      );
    }

    const contest = await prisma.contest.findUnique({ where: { id } });
    if (!contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    // Fetch live prices for all positions
    const symbols = participant.positions.map((p) => p.symbol);
    const livePrices = symbols.length > 0 ? await getLivePrices(symbols) : {};

    const { cashBalance, holdingsValue, portfolioValue } =
      calculatePortfolioValue(
        participant.cashBalance,
        participant.positions,
        livePrices
      );

    const pnl = portfolioValue - participant.startingCapital;
    const roi = ((pnl / participant.startingCapital) * 100);

    // Count total trades
    const tradeCount = await prisma.contestOrder.count({
      where: {
        participantId: participant.id,
        status: "EXECUTED",
      },
    });

    // Get rank
    const allParticipants = await prisma.contestParticipant.findMany({
      where: {
        contestId: id,
        status: "APPROVED",
        capitalAllocated: true,
      },
      include: {
        positions: { where: { quantity: { gt: 0 } } },
      },
    });

    const allSymbols = [
      ...new Set(
        allParticipants.flatMap((p) => p.positions.map((pos) => pos.symbol))
      ),
    ];
    const allPrices =
      allSymbols.length > 0 ? await getLivePrices(allSymbols) : {};

    const ranked = allParticipants
      .map((p) => {
        const { portfolioValue: pv } = calculatePortfolioValue(
          p.cashBalance,
          p.positions,
          allPrices
        );
        return { id: p.id, portfolioValue: pv };
      })
      .sort((a, b) => b.portfolioValue - a.portfolioValue);

    const rank = ranked.findIndex((r) => r.id === participant.id) + 1;

    return NextResponse.json({
      participantId: participant.participantId,
      fullName: participant.fullName,
      teamName: participant.teamName,
      status: participant.status,
      capitalAllocated: participant.capitalAllocated,
      startingCapital: participant.startingCapital,
      cashBalance,
      holdingsValue,
      portfolioValue,
      pnl,
      roi,
      tradeCount,
      rank,
      totalParticipants: ranked.length,
      contestStatus: contest.status,
      contestName: contest.name,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch portfolio" },
      { status: 500 }
    );
  }
}

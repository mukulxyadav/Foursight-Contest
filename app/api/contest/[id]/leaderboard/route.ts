import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getLivePrices } from "@/app/api/_lib/price";
import { calculatePortfolioValue, sanitizeForLeaderboard } from "@/app/api/_lib/contest";

// GET /api/contest/[id]/leaderboard
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const contest = await prisma.contest.findUnique({ where: { id } });
    if (!contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    if (!contest.leaderboardVisible) {
      return NextResponse.json(
        { error: "Leaderboard is not visible for this contest" },
        { status: 403 }
      );
    }

    // Get all approved participants with their positions
    const participants = await prisma.contestParticipant.findMany({
      where: {
        contestId: id,
        status: "APPROVED",
        capitalAllocated: true,
      },
      include: {
        positions: { where: { quantity: { gt: 0 } } },
      },
    });

    if (participants.length === 0) {
      return NextResponse.json({
        leaderboard: [],
        frozen: contest.leaderboardFrozen,
        contestStatus: contest.status,
      });
    }

    // Fetch live prices for all symbols across all participants
    const allSymbols = [
      ...new Set(
        participants.flatMap((p) => p.positions.map((pos) => pos.symbol))
      ),
    ];

    // If leaderboard is frozen, use avgBuyPrice as proxy (no live prices needed)
    const livePrices = contest.leaderboardFrozen
      ? {}
      : allSymbols.length > 0
      ? await getLivePrices(allSymbols)
      : {};

    // Calculate portfolio values
    const withValues = participants.map((p) => {
      const { portfolioValue } = calculatePortfolioValue(
        p.cashBalance,
        p.positions,
        livePrices
      );
      const pnl = portfolioValue - p.startingCapital;
      const roi = (pnl / p.startingCapital) * 100;

      return {
        ...sanitizeForLeaderboard(p),
        portfolioValue,
        pnl,
        roi,
      };
    });

    // Sort by portfolio value descending
    withValues.sort((a, b) => b.portfolioValue - a.portfolioValue);

    const leaderboard = withValues.map((entry, idx) => ({
      rank: idx + 1,
      ...entry,
    }));

    return NextResponse.json({
      leaderboard,
      frozen: contest.leaderboardFrozen,
      contestStatus: contest.status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

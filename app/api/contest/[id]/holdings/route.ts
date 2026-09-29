import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getAuthUser } from "@/app/api/_lib/auth";
import { getLivePrices } from "@/app/api/_lib/price";

// GET /api/contest/[id]/holdings
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

    const symbols = participant.positions.map((p) => p.symbol);
    const livePrices = symbols.length > 0 ? await getLivePrices(symbols) : {};

    const holdings = participant.positions.map((pos) => {
      const ltp = livePrices[pos.symbol] ?? pos.avgBuyPrice;
      const currentValue = pos.quantity * ltp;
      const investedValue = pos.quantity * pos.avgBuyPrice;
      const pnl = currentValue - investedValue;
      const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

      return {
        symbol: pos.symbol,
        quantity: pos.quantity,
        avgBuyPrice: pos.avgBuyPrice,
        ltp,
        investedValue,
        currentValue,
        pnl,
        pnlPercent,
      };
    });

    return NextResponse.json({ holdings });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch holdings" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getLivePrices } from "@/app/api/_lib/price";
import { calculatePortfolioValue } from "@/app/api/_lib/contest";

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const adminToken = req.cookies.get("adminToken")?.value;
  if (!adminToken) return false;
  const session = await prisma.adminSession.findUnique({ where: { token: adminToken } });
  if (!session || session.expiresAt < new Date()) return false;
  return true;
}

// GET /api/admin/contest/[id]/export?type=participants|results
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "participants";

  try {
    const contest = await prisma.contest.findUnique({ where: { id } });
    if (!contest) return NextResponse.json({ error: "Contest not found" }, { status: 404 });

    if (type === "participants") {
      const participants = await prisma.contestParticipant.findMany({
        where: { contestId: id },
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { orders: true } } },
      });

      const rows = [
        [
          "Participant ID", "Full Name", "Reg Number", "University Email",
          "Personal Email", "Phone", "College", "Department",
          "Year", "Section", "Team", "Status", "Registered At",
        ].join(","),
        ...participants.map((p) =>
          [
            p.participantId, csvEscape(p.fullName), csvEscape(p.regNumber),
            csvEscape(p.uniEmail), csvEscape(p.personalEmail), csvEscape(p.phone),
            csvEscape(p.college), csvEscape(p.department), csvEscape(p.yearOfStudy),
            csvEscape(p.section), csvEscape(p.teamName), p.status,
            p.createdAt.toISOString(),
          ].join(",")
        ),
      ].join("\n");

      return new NextResponse(rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="participants-${id}.csv"`,
        },
      });
    }

    if (type === "results") {
      const participants = await prisma.contestParticipant.findMany({
        where: { contestId: id, status: "APPROVED", capitalAllocated: true },
        include: {
          positions: { where: { quantity: { gt: 0 } } },
          _count: { select: { orders: { where: { status: "EXECUTED" } } } },
        },
        orderBy: { createdAt: "asc" },
      });

      const allSymbols = [...new Set(participants.flatMap((p) => p.positions.map((pos) => pos.symbol)))];
      const livePrices = allSymbols.length > 0 ? await getLivePrices(allSymbols) : {};

      const withValues = participants.map((p) => {
        const { portfolioValue } = calculatePortfolioValue(p.cashBalance, p.positions, livePrices);
        const pnl = portfolioValue - p.startingCapital;
        const roi = (pnl / p.startingCapital) * 100;
        return { ...p, portfolioValue, pnl, roi };
      }).sort((a, b) => b.portfolioValue - a.portfolioValue);

      const rows = [
        ["Rank", "Participant ID", "Full Name", "Team", "Starting Capital", "Final Value", "P&L", "ROI %", "Trades"].join(","),
        ...withValues.map((p, idx) =>
          [
            idx + 1, p.participantId, csvEscape(p.fullName), csvEscape(p.teamName),
            p.startingCapital.toFixed(2), p.portfolioValue.toFixed(2),
            p.pnl.toFixed(2), p.roi.toFixed(2), p._count.orders,
          ].join(",")
        ),
      ].join("\n");

      return new NextResponse(rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="results-${id}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

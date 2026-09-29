import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const adminToken = req.cookies.get("adminToken")?.value;
  if (!adminToken) return false;
  const session = await prisma.adminSession.findUnique({
    where: { token: adminToken },
  });
  if (!session) return false;
  if (session.expiresAt < new Date()) {
    await prisma.adminSession.delete({ where: { token: adminToken } }).catch(() => {});
    return false;
  }
  return true;
}

// GET /api/admin/contest — list all contests
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contests = await prisma.contest.findMany({
      include: {
        _count: { select: { participants: true, announcements: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ contests });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch contests" }, { status: 500 });
  }
}

// POST /api/admin/contest — create a new contest
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      description,
      slug,
      registrationStart,
      registrationEnd,
      contestStart,
      contestEnd,
      startingCapital,
      transactionFee,
      maxOrderQty,
      maxPositionValue,
      maxTrades,
      allowShortSelling,
      allowMarketOrders,
      enforceMarketHours,
      leaderboardVisible,
    } = body;

    if (!name || !slug || !registrationStart || !registrationEnd || !contestStart || !contestEnd) {
      return NextResponse.json(
        { error: "Required fields: name, slug, registration dates, contest dates" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await prisma.contest.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A contest with this slug already exists" },
        { status: 409 }
      );
    }

    const contest = await prisma.contest.create({
      data: {
        name,
        description: description ?? "",
        slug,
        status: "REGISTRATION_OPEN",
        registrationStart: new Date(registrationStart),
        registrationEnd: new Date(registrationEnd),
        contestStart: new Date(contestStart),
        contestEnd: new Date(contestEnd),
        startingCapital: startingCapital ?? 1000000,
        transactionFee: transactionFee ?? 0.0005,
        maxOrderQty: maxOrderQty ?? 10000,
        maxPositionValue: maxPositionValue ?? 500000,
        maxTrades: maxTrades ?? 1000,
        allowShortSelling: allowShortSelling ?? false,
        allowMarketOrders: allowMarketOrders ?? true,
        enforceMarketHours: enforceMarketHours ?? true,
        leaderboardVisible: leaderboardVisible ?? true,
      },
    });

    return NextResponse.json({ contest }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create contest" },
      { status: 500 }
    );
  }
}

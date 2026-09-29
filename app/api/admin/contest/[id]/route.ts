import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const adminToken = req.cookies.get("adminToken")?.value;
  if (!adminToken) return false;
  const session = await prisma.adminSession.findUnique({ where: { token: adminToken } });
  if (!session || session.expiresAt < new Date()) return false;
  return true;
}

const VALID_STATUSES = [
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "UPCOMING",
  "LIVE",
  "PAUSED",
  "ENDED",
  "CANCELLED",
];

// GET /api/admin/contest/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const contest = await prisma.contest.findUnique({
      where: { id },
      include: {
        _count: { select: { participants: true, announcements: true } },
      },
    });
    if (!contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }
    return NextResponse.json({ contest });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch contest" }, { status: 500 });
  }
}

// PUT /api/admin/contest/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await req.json();

    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateData: any = {};
    const allowedFields = [
      "name", "description", "status", "registrationStart", "registrationEnd",
      "contestStart", "contestEnd", "startingCapital", "transactionFee",
      "maxOrderQty", "maxPositionValue", "maxTrades", "allowShortSelling",
      "allowMarketOrders", "enforceMarketHours", "leaderboardVisible", "leaderboardFrozen",
    ];
    for (const field of allowedFields) {
      if (field in body) {
        if (["registrationStart", "registrationEnd", "contestStart", "contestEnd"].includes(field)) {
          updateData[field] = new Date(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const contest = await prisma.contest.update({ where: { id }, data: updateData });
    return NextResponse.json({ contest });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update contest" }, { status: 500 });
  }
}

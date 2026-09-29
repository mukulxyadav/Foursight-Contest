import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const adminToken = req.cookies.get("adminToken")?.value;
  if (!adminToken) return false;
  const session = await prisma.adminSession.findUnique({ where: { token: adminToken } });
  if (!session || session.expiresAt < new Date()) return false;
  return true;
}

// GET /api/admin/contest/[id]/orders
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const url = new URL(req.url);
  const symbol = url.searchParams.get("symbol") ?? "";
  const participantId = url.searchParams.get("participantId") ?? "";
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);
  const skip = (page - 1) * limit;

  try {
    const where: any = { contestId: id };
    if (symbol) where.symbol = { contains: symbol };
    if (participantId) {
      // Find by participantId field
      const participant = await prisma.contestParticipant.findFirst({
        where: { contestId: id, participantId },
      });
      if (participant) where.participantId = participant.id;
    }

    const [orders, total] = await Promise.all([
      prisma.contestOrder.findMany({
        where,
        orderBy: { executedAt: "desc" },
        take: limit,
        skip,
        include: {
          participant: {
            select: { participantId: true, fullName: true },
          },
        },
      }),
      prisma.contestOrder.count({ where }),
    ]);

    return NextResponse.json({ orders, total, page, limit });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

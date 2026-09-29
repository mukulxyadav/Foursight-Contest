import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const adminToken = req.cookies.get("adminToken")?.value;
  if (!adminToken) return false;
  const session = await prisma.adminSession.findUnique({ where: { token: adminToken } });
  if (!session || session.expiresAt < new Date()) return false;
  return true;
}

// GET /api/admin/contest/[id]/participants
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");
  const search = url.searchParams.get("search") ?? "";

  try {
    const where: any = { contestId: id };
    if (statusFilter) where.status = statusFilter;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { participantId: { contains: search } },
        { regNumber: { contains: search } },
        { uniEmail: { contains: search } },
        { college: { contains: search } },
      ];
    }

    const participants = await prisma.contestParticipant.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { orders: true } },
      },
    });

    return NextResponse.json({ participants });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
  }
}

// POST /api/admin/contest/[id]/participants — approve/reject/suspend
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const body = await req.json();
    const { participantDbId, action } = body;

    if (!participantDbId || !action) {
      return NextResponse.json(
        { error: "participantDbId and action are required" },
        { status: 400 }
      );
    }

    const validActions = ["APPROVE", "REJECT", "SUSPEND", "RESET"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const participant = await prisma.contestParticipant.findFirst({
      where: { id: participantDbId, contestId: id },
    });
    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    if (action === "APPROVE") {
      await prisma.contestParticipant.update({
        where: { id: participantDbId },
        data: { status: "APPROVED", capitalAllocated: true, cashBalance: participant.startingCapital },
      });
    } else if (action === "REJECT") {
      await prisma.contestParticipant.update({
        where: { id: participantDbId },
        data: { status: "REJECTED" },
      });
    } else if (action === "SUSPEND") {
      await prisma.contestParticipant.update({
        where: { id: participantDbId },
        data: { status: "SUSPENDED" },
      });
    } else if (action === "RESET") {
      // Reset contest account — delete positions and orders, restore capital
      await prisma.$transaction([
        prisma.contestPosition.deleteMany({
          where: { contestId: id, participantId: participantDbId },
        }),
        prisma.contestOrder.deleteMany({
          where: { contestId: id, participantId: participantDbId },
        }),
        prisma.contestParticipant.update({
          where: { id: participantDbId },
          data: { cashBalance: participant.startingCapital },
        }),
      ]);
    }

    // Audit log
    await prisma.contestAuditLog.create({
      data: {
        contestId: id,
        foursightUsername: "ADMIN",
        participantId: participantDbId,
        action: `ADMIN_${action}`,
        status: "SUCCESS",
        detail: `Admin action: ${action} on ${participant.participantId}`,
      },
    });

    return NextResponse.json({ message: `${action} successful` });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}

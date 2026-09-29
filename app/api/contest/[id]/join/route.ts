import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getAuthUser } from "@/app/api/_lib/auth";

// POST /api/contest/[id]/join — activate capital for approved participant
export async function POST(
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
    });

    if (!participant) {
      return NextResponse.json(
        { error: "You are not registered for this contest" },
        { status: 404 }
      );
    }

    if (participant.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Your registration is not yet approved" },
        { status: 403 }
      );
    }

    if (participant.capitalAllocated) {
      return NextResponse.json({ message: "Capital already allocated" });
    }

    // Allocate virtual capital
    await prisma.contestParticipant.update({
      where: { id: participant.id },
      data: {
        capitalAllocated: true,
        cashBalance: participant.startingCapital,
      },
    });

    await prisma.contestAuditLog.create({
      data: {
        contestId: id,
        foursightUsername: user.username,
        participantId: participant.id,
        action: "JOIN",
        status: "SUCCESS",
        detail: `Capital ₹${participant.startingCapital} allocated`,
      },
    });

    return NextResponse.json({
      message: "You have joined the contest! Happy trading.",
      cashBalance: participant.startingCapital,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to join contest" }, { status: 500 });
  }
}

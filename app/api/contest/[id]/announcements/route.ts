import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

// GET /api/contest/[id]/announcements
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const announcements = await prisma.contestAnnouncement.findMany({
      where: { contestId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        message: true,
        priority: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ announcements });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

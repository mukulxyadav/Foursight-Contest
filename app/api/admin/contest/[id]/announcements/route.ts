import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const adminToken = req.cookies.get("adminToken")?.value;
  if (!adminToken) return false;
  const session = await prisma.adminSession.findUnique({ where: { token: adminToken } });
  if (!session || session.expiresAt < new Date()) return false;
  return true;
}

// GET /api/admin/contest/[id]/announcements
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const announcements = await prisma.contestAnnouncement.findMany({
      where: { contestId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ announcements });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

// POST /api/admin/contest/[id]/announcements
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
    const { title, message, priority } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "title and message are required" }, { status: 400 });
    }

    const validPriorities = ["INFO", "WARNING", "IMPORTANT"];
    const prio = validPriorities.includes(priority) ? priority : "INFO";

    const announcement = await prisma.contestAnnouncement.create({
      data: { contestId: id, title, message, priority: prio },
    });
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}

// DELETE /api/admin/contest/[id]/announcements?announcementId=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const announcementId = url.searchParams.get("announcementId");
  if (!announcementId) {
    return NextResponse.json({ error: "announcementId required" }, { status: 400 });
  }
  try {
    await prisma.contestAnnouncement.delete({ where: { id: announcementId } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}

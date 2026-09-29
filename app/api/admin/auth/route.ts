import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import crypto from "crypto";

// POST /api/admin/auth — admin login
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret } = body;

    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret || secret !== adminSecret) {
      await new Promise((r) => setTimeout(r, 500)); // slow brute force
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate session token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.adminSession.create({
      data: { token, expiresAt },
    });

    // Clean up old sessions
    await prisma.adminSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    const response = NextResponse.json({ message: "Authenticated" });
    response.cookies.set("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/auth — logout
export async function DELETE(req: NextRequest) {
  const adminToken = req.cookies.get("adminToken")?.value;
  if (adminToken) {
    await prisma.adminSession.deleteMany({ where: { token: adminToken } }).catch(() => {});
  }
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.delete("adminToken");
  return response;
}

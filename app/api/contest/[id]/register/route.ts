import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getAuthUser } from "@/app/api/_lib/auth";
import { generateParticipantId } from "@/app/api/_lib/contest";

// POST /api/contest/[id]/register
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth check
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const contest = await prisma.contest.findUnique({ where: { id } });
    if (!contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    if (
      contest.status !== "REGISTRATION_OPEN" &&
      contest.status !== "UPCOMING"
    ) {
      return NextResponse.json(
        { error: "Registration is not open for this contest" },
        { status: 400 }
      );
    }

    const now = new Date();
    if (now < contest.registrationStart || now > contest.registrationEnd) {
      return NextResponse.json(
        { error: "Registration window is closed" },
        { status: 400 }
      );
    }

    // Check if already registered
    const existing = await prisma.contestParticipant.findUnique({
      where: {
        contestId_foursightUsername: {
          contestId: id,
          foursightUsername: user.username,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You are already registered for this contest" },
        { status: 409 }
      );
    }

    // Parse body
    const body = await req.json();
    const {
      fullName,
      regNumber,
      uniEmail,
      personalEmail,
      phone,
      college,
      department,
      yearOfStudy,
      section,
      teamName,
      experience,
      agreed,
    } = body;

    // Validate required fields
    const required = { fullName, regNumber, uniEmail, personalEmail, phone, college, department, yearOfStudy };
    for (const [key, value] of Object.entries(required)) {
      if (!value || String(value).trim() === "") {
        return NextResponse.json(
          { error: `Field "${key}" is required` },
          { status: 400 }
        );
      }
    }

    if (!agreed) {
      return NextResponse.json(
        { error: "You must accept the contest terms" },
        { status: 400 }
      );
    }

    // Generate participant ID
    const participantCount = await prisma.contestParticipant.count({
      where: { contestId: id },
    });
    const participantId = generateParticipantId(participantCount + 1);

    // Create participant (pending approval)
    const participant = await prisma.contestParticipant.create({
      data: {
        contestId: id,
        foursightUsername: user.username,
        participantId,
        fullName: fullName.trim(),
        regNumber: regNumber.trim(),
        uniEmail: uniEmail.trim().toLowerCase(),
        personalEmail: personalEmail.trim().toLowerCase(),
        phone: phone.trim(),
        college: college.trim(),
        department: department.trim(),
        yearOfStudy: yearOfStudy.trim(),
        section: section?.trim() ?? "",
        teamName: teamName?.trim() ?? "",
        experience: experience?.trim() ?? "",
        status: "PENDING",
        startingCapital: contest.startingCapital,
        cashBalance: contest.startingCapital, // will be 0 until approved
        capitalAllocated: false,
      },
    });

    // Audit log
    await prisma.contestAuditLog.create({
      data: {
        contestId: id,
        foursightUsername: user.username,
        participantId: participant.id,
        action: "REGISTER",
        status: "SUCCESS",
        detail: `Registered as ${participantId}`,
        ipAddress: req.headers.get("x-forwarded-for") ?? "",
      },
    });

    return NextResponse.json({
      message: "Registration successful! Your application is pending approval.",
      participantId,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}

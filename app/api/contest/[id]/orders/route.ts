import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/_lib/db";
import { getAuthUser } from "@/app/api/_lib/auth";
import { getLivePrice } from "@/app/api/_lib/price";
import { canTrade, generateOrderId } from "@/app/api/_lib/contest";

// GET /api/contest/[id]/orders — order history
export async function GET(
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

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.contestOrder.findMany({
        where: { participantId: participant.id },
        orderBy: { executedAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.contestOrder.count({ where: { participantId: participant.id } }),
    ]);

    return NextResponse.json({ orders, total, page, limit });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/contest/[id]/orders — place a new order
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let auditStatus = "FAILED";
  let auditDetail = "";
  let participantDbId = "";

  try {
    const body = await req.json();
    const { symbol, quantity, orderType } = body;

    // Basic validation
    if (!symbol || !quantity || !orderType) {
      return NextResponse.json(
        { error: "symbol, quantity, and orderType are required" },
        { status: 400 }
      );
    }

    if (!["BUY", "SELL"].includes(orderType)) {
      return NextResponse.json(
        { error: "orderType must be BUY or SELL" },
        { status: 400 }
      );
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: "Quantity must be a positive integer" },
        { status: 400 }
      );
    }

    // Load contest + participant
    const [contest, participant] = await Promise.all([
      prisma.contest.findUnique({ where: { id } }),
      prisma.contestParticipant.findUnique({
        where: {
          contestId_foursightUsername: {
            contestId: id,
            foursightUsername: user.username,
          },
        },
        include: {
          positions: { where: { symbol } },
        },
      }),
    ]);

    if (!contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }
    if (!participant) {
      return NextResponse.json(
        { error: "You are not registered for this contest" },
        { status: 404 }
      );
    }
    if (!participant.capitalAllocated) {
      return NextResponse.json(
        { error: "You haven't joined the contest yet. Please join first." },
        { status: 403 }
      );
    }

    participantDbId = participant.id;

    // Contest state check (server-enforced)
    const tradeCheck = canTrade(contest, participant.status);
    if (!tradeCheck.allowed) {
      auditDetail = tradeCheck.reason ?? "Trading not allowed";
      return NextResponse.json({ error: tradeCheck.reason }, { status: 403 });
    }

    // Max order quantity check
    if (qty > contest.maxOrderQty) {
      auditDetail = `Exceeds max order quantity (${contest.maxOrderQty})`;
      return NextResponse.json(
        { error: `Order quantity exceeds maximum allowed (${contest.maxOrderQty})` },
        { status: 400 }
      );
    }

    // Max trades check
    const tradeCount = await prisma.contestOrder.count({
      where: { participantId: participant.id, status: "EXECUTED" },
    });
    if (tradeCount >= contest.maxTrades) {
      auditDetail = "Max trade limit reached";
      return NextResponse.json(
        { error: "You have reached the maximum number of trades for this contest" },
        { status: 400 }
      );
    }

    // ── PRICE FETCH (server-side, never trust client) ────────────────────────
    const livePrice = await getLivePrice(symbol);
    if (!livePrice || livePrice <= 0) {
      auditDetail = "Failed to fetch live price";
      return NextResponse.json(
        { error: "Unable to fetch live price. Please try again." },
        { status: 503 }
      );
    }

    const totalValue = qty * livePrice;
    const fee = totalValue * contest.transactionFee;

    // ── BUY LOGIC ────────────────────────────────────────────────────────────
    if (orderType === "BUY") {
      const totalCost = totalValue + fee;
      if (participant.cashBalance < totalCost) {
        auditDetail = "Insufficient cash";
        return NextResponse.json(
          {
            error: `Insufficient cash. Required: ₹${totalCost.toFixed(2)}, Available: ₹${participant.cashBalance.toFixed(2)}`,
          },
          { status: 400 }
        );
      }

      // Max position value check
      const existingPosition = participant.positions[0];
      const existingValue = existingPosition
        ? existingPosition.quantity * livePrice
        : 0;
      if (existingValue + totalValue > contest.maxPositionValue) {
        auditDetail = "Exceeds max position value";
        return NextResponse.json(
          {
            error: `This trade would exceed the maximum position size of ₹${contest.maxPositionValue.toLocaleString("en-IN")}`,
          },
          { status: 400 }
        );
      }

      // Execute buy — atomic transaction
      const orderId = generateOrderId();
      await prisma.$transaction([
        // Deduct cash
        prisma.contestParticipant.update({
          where: { id: participant.id },
          data: { cashBalance: { decrement: totalCost } },
        }),
        // Update or create position
        prisma.contestPosition.upsert({
          where: {
            contestId_participantId_symbol: {
              contestId: id,
              participantId: participant.id,
              symbol,
            },
          },
          update: {
            quantity: { increment: qty },
            avgBuyPrice: existingPosition
              ? (existingPosition.avgBuyPrice * existingPosition.quantity +
                  livePrice * qty) /
                (existingPosition.quantity + qty)
              : livePrice,
            totalInvested: { increment: totalValue },
          },
          create: {
            contestId: id,
            participantId: participant.id,
            symbol,
            quantity: qty,
            avgBuyPrice: livePrice,
            totalInvested: totalValue,
          },
        }),
        // Record order (immutable)
        prisma.contestOrder.create({
          data: {
            orderId,
            contestId: id,
            participantId: participant.id,
            symbol,
            orderType: "BUY",
            quantity: qty,
            price: livePrice,
            totalValue,
            fee,
            netAmount: totalCost,
            status: "EXECUTED",
          },
        }),
      ]);

      auditStatus = "SUCCESS";
      auditDetail = `BUY ${qty} ${symbol} @ ₹${livePrice}`;

      return NextResponse.json({
        message: `Successfully bought ${qty} shares of ${symbol} at ₹${livePrice.toFixed(2)}`,
        orderId,
        price: livePrice,
        quantity: qty,
        totalValue,
        fee,
      });
    }

    // ── SELL LOGIC ───────────────────────────────────────────────────────────
    if (orderType === "SELL") {
      const existingPosition = participant.positions[0];
      if (!existingPosition || existingPosition.quantity < qty) {
        auditDetail = "Insufficient position";
        return NextResponse.json(
          {
            error: `Insufficient shares. You hold ${existingPosition?.quantity ?? 0} shares of ${symbol}`,
          },
          { status: 400 }
        );
      }

      const proceeds = totalValue - fee;
      const orderId = generateOrderId();

      await prisma.$transaction([
        // Add proceeds to cash
        prisma.contestParticipant.update({
          where: { id: participant.id },
          data: { cashBalance: { increment: proceeds } },
        }),
        // Update position
        prisma.contestPosition.update({
          where: {
            contestId_participantId_symbol: {
              contestId: id,
              participantId: participant.id,
              symbol,
            },
          },
          data: {
            quantity: { decrement: qty },
            totalInvested: {
              decrement: qty * existingPosition.avgBuyPrice,
            },
          },
        }),
        // Record order (immutable)
        prisma.contestOrder.create({
          data: {
            orderId,
            contestId: id,
            participantId: participant.id,
            symbol,
            orderType: "SELL",
            quantity: qty,
            price: livePrice,
            totalValue,
            fee,
            netAmount: proceeds,
            status: "EXECUTED",
          },
        }),
      ]);

      auditStatus = "SUCCESS";
      auditDetail = `SELL ${qty} ${symbol} @ ₹${livePrice}`;

      return NextResponse.json({
        message: `Successfully sold ${qty} shares of ${symbol} at ₹${livePrice.toFixed(2)}`,
        orderId,
        price: livePrice,
        quantity: qty,
        totalValue,
        fee,
        proceeds,
      });
    }

    return NextResponse.json({ error: "Invalid order type" }, { status: 400 });
  } catch (err) {
    console.error(err);
    auditDetail = String(err);
    return NextResponse.json(
      { error: "Order failed. Please try again." },
      { status: 500 }
    );
  } finally {
    // Always write audit log
    if (participantDbId) {
      try {
        await prisma.contestAuditLog.create({
          data: {
            contestId: id,
            foursightUsername: user.username,
            participantId: participantDbId,
            action: `ORDER_${(await req.json().catch(() => ({})) as any)?.orderType ?? "UNKNOWN"}`,
            status: auditStatus,
            detail: auditDetail,
            ipAddress: req.headers.get("x-forwarded-for") ?? "",
          },
        });
      } catch { /* audit log write failure should not affect the response */ }
    }
  }
}

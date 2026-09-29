import { Contest } from "@prisma/client";

export type ContestStatus =
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "UPCOMING"
  | "LIVE"
  | "PAUSED"
  | "ENDED"
  | "CANCELLED";

/**
 * Generates a sequential participant ID like TRD0001, TRD0042, etc.
 */
export function generateParticipantId(count: number): string {
  return `TRD${String(count).padStart(4, "0")}`;
}

/**
 * Generates a unique order ID.
 */
export function generateOrderId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `ORD-${date}-${rand}`;
}

/**
 * Checks if current time is within NSE market hours (IST 09:15–15:30, Mon–Fri).
 */
export function isMarketOpen(): boolean {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);

  const day = ist.getUTCDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;

  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const marketOpen = 9 * 60 + 15; // 09:15
  const marketClose = 15 * 60 + 30; // 15:30

  return timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
}

/**
 * Returns true if the contest is currently tradeable.
 */
export function canTrade(
  contest: Contest,
  participantStatus: string
): { allowed: boolean; reason?: string } {
  if (participantStatus !== "APPROVED") {
    return { allowed: false, reason: "Your registration is not yet approved." };
  }
  if (contest.status !== "LIVE") {
    const messages: Record<string, string> = {
      REGISTRATION_OPEN: "Contest has not started yet. Registration is open.",
      REGISTRATION_CLOSED: "Contest has not started yet.",
      UPCOMING: "Contest is upcoming. Trading starts soon.",
      PAUSED: "Contest is currently paused. Trading is suspended.",
      ENDED: "Contest has ended. Trading is closed.",
      CANCELLED: "Contest has been cancelled.",
    };
    return {
      allowed: false,
      reason: messages[contest.status] ?? "Trading is not available.",
    };
  }
  if (contest.enforceMarketHours && !isMarketOpen()) {
    return {
      allowed: false,
      reason: "Market is closed. Trading hours: Mon–Fri, 09:15–15:30 IST.",
    };
  }
  return { allowed: true };
}

/**
 * Calculates portfolio value for a participant.
 * positions: array of { symbol, quantity, avgBuyPrice }
 * livePrices: map of symbol → ltp
 */
export function calculatePortfolioValue(
  cashBalance: number,
  positions: Array<{ symbol: string; quantity: number; avgBuyPrice: number }>,
  livePrices: Record<string, number>
): {
  cashBalance: number;
  holdingsValue: number;
  portfolioValue: number;
} {
  const holdingsValue = positions.reduce((sum, pos) => {
    const ltp = livePrices[pos.symbol] ?? pos.avgBuyPrice;
    return sum + pos.quantity * ltp;
  }, 0);

  return {
    cashBalance,
    holdingsValue,
    portfolioValue: cashBalance + holdingsValue,
  };
}

/**
 * Strips PII from a participant for public leaderboard display.
 */
export function sanitizeForLeaderboard(participant: {
  participantId: string;
  fullName: string;
  teamName: string;
}) {
  const nameParts = participant.fullName.trim().split(" ");
  const displayName =
    nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
      : nameParts[0];

  return {
    participantId: participant.participantId,
    displayName,
    teamName: participant.teamName || "",
  };
}

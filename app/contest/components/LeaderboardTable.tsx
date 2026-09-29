"use client";

interface LeaderboardEntry {
  rank: number;
  participantId: string;
  displayName: string;
  teamName: string;
  portfolioValue: number;
  pnl: number;
  roi: number;
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  highlightId?: string;
}

export default function LeaderboardTable({
  data,
  highlightId,
}: LeaderboardTableProps) {
  if (data.length === 0) {
    return (
      <div className="border border-border bg-card py-12 text-center">
        <p className="text-sm font-mono text-foreground/60">
          No participants yet
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="border border-border bg-card min-w-[640px]">
        <div className="border-b border-border px-4 py-3 bg-muted">
          <div className="grid grid-cols-6 gap-4 text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider">
            <div className="text-center">Rank</div>
            <div className="text-left col-span-2">Participant</div>
            <div className="text-right">Portfolio Value</div>
            <div className="text-right">P&L</div>
            <div className="text-right">ROI</div>
          </div>
        </div>
        <div className="divide-y divide-border">
          {data.map((entry) => {
            const isHighlighted = entry.participantId === highlightId;
            const isPositive = entry.pnl >= 0;
            const medal =
              entry.rank === 1
                ? "🥇"
                : entry.rank === 2
                ? "🥈"
                : entry.rank === 3
                ? "🥉"
                : null;

            return (
              <div
                key={entry.participantId}
                className={`px-4 py-3 transition-colors ${
                  isHighlighted
                    ? "bg-brand/5 border-l-2 border-l-brand"
                    : "hover:bg-muted"
                }`}
              >
                <div className="grid grid-cols-6 gap-4 text-sm font-mono items-center">
                  <div className="text-center font-semibold text-foreground/60">
                    {medal ? (
                      <span className="text-base">{medal}</span>
                    ) : (
                      `#${entry.rank}`
                    )}
                  </div>
                  <div className="col-span-2">
                    <div className="font-semibold text-foreground">
                      {entry.participantId}
                      {isHighlighted && (
                        <span className="ml-1.5 text-xs text-brand font-normal">
                          (you)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-foreground/50 mt-0.5">
                      {entry.displayName}
                      {entry.teamName ? ` · ${entry.teamName}` : ""}
                    </div>
                  </div>
                  <div className="text-right font-semibold text-foreground">
                    ₹{entry.portfolioValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </div>
                  <div
                    className={`text-right font-semibold ${
                      isPositive ? "text-positive" : "text-negative"
                    }`}
                  >
                    {isPositive ? "+" : ""}₹
                    {Math.abs(entry.pnl).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </div>
                  <div
                    className={`text-right font-semibold ${
                      isPositive ? "text-positive" : "text-negative"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {entry.roi.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

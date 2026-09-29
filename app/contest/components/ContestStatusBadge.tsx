"use client";

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  REGISTRATION_OPEN: {
    label: "REGISTRATION OPEN",
    className: "text-positive border-positive/30 bg-positive/5",
    dot: "bg-positive",
  },
  REGISTRATION_CLOSED: {
    label: "REGISTRATION CLOSED",
    className: "text-foreground/60 border-border bg-muted",
    dot: "bg-foreground/40",
  },
  UPCOMING: {
    label: "UPCOMING",
    className: "text-brand border-brand/30 bg-brand/5",
    dot: "bg-brand",
  },
  LIVE: {
    label: "🟢 LIVE",
    className: "text-positive border-positive/40 bg-positive/10",
    dot: "bg-positive animate-pulse",
  },
  PAUSED: {
    label: "⏸ PAUSED",
    className: "text-yellow-500 border-yellow-500/30 bg-yellow-500/5",
    dot: "bg-yellow-500",
  },
  ENDED: {
    label: "ENDED",
    className: "text-foreground/50 border-border bg-muted",
    dot: "bg-foreground/40",
  },
  CANCELLED: {
    label: "CANCELLED",
    className: "text-negative border-negative/30 bg-negative/5",
    dot: "bg-negative",
  },
};

export default function ContestStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG["ENDED"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold border tracking-wider ${config.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

"use client";
import { useEffect, useState } from "react";

interface ContestCountdownProps {
  targetDate: string | Date;
  label?: string;
}

export default function ContestCountdown({
  targetDate,
  label = "Starts in",
}: ContestCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function update() {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setExpired(true);
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ d, h, m, s });
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (expired) return null;

  return (
    <div className="flex items-center gap-3 font-mono">
      <span className="text-xs text-foreground/60 tracking-wider">{label}</span>
      <div className="flex items-center gap-1.5 text-sm font-semibold">
        {timeLeft.d > 0 && (
          <>
            <Segment value={timeLeft.d} unit="d" />
            <Colon />
          </>
        )}
        <Segment value={timeLeft.h} unit="h" />
        <Colon />
        <Segment value={timeLeft.m} unit="m" />
        <Colon />
        <Segment value={timeLeft.s} unit="s" />
      </div>
    </div>
  );
}

function Segment({ value, unit }: { value: number; unit: string }) {
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span className="text-foreground tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-xs text-foreground/40">{unit}</span>
    </span>
  );
}

function Colon() {
  return <span className="text-foreground/30">:</span>;
}

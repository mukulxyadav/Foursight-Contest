"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { NavTransition } from "@/app/components/navbar/NavTransition";
import Loading from "@/app/components/Loading";
import ContestStatusBadge from "./components/ContestStatusBadge";

export default function ContestListPage() {
  const [contests, setContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get("/api/contest");
        setContests(res.data.contests ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
      <div className="max-w-7xl mx-auto">
        <div className="mt-8 mb-8">
          <span className="text-xs font-mono text-muted-foreground tracking-wider">
            CONTESTS
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-2 font-mono">
            Paper Trading Contests
          </h1>
          <p className="text-sm text-foreground/60 mt-2">
            University-level paper trading competitions with live NSE data.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-border bg-card p-6">
                <div className="h-3 w-24 bg-foreground/10 mb-3" />
                <div className="h-5 w-48 bg-foreground/10 mb-4" />
                <div className="h-3 w-32 bg-foreground/10 mb-2" />
                <div className="h-3 w-28 bg-foreground/10 mb-6" />
                <div className="h-9 w-full bg-foreground/10" />
              </div>
            ))}
          </div>
        ) : contests.length === 0 ? (
          <div className="border border-border bg-card py-20 text-center">
            <p className="text-sm font-mono text-foreground/60">
              No contests available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {contests.map((c) => (
              <div key={c.id} className="border border-border bg-card p-6 hover:bg-muted transition-colors">
                <div className="mb-3">
                  <ContestStatusBadge status={c.status} />
                </div>
                <h2 className="text-lg font-bold font-mono text-foreground mb-2 leading-tight">
                  {c.name}
                </h2>
                <div className="space-y-1 mb-4">
                  <p className="text-xs font-mono text-foreground/60">
                    <span className="text-foreground/40">CAPITAL</span>{" "}
                    ₹{(c.startingCapital).toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs font-mono text-foreground/60">
                    <span className="text-foreground/40">START</span>{" "}
                    {new Date(c.contestStart).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                  <p className="text-xs font-mono text-foreground/60">
                    <span className="text-foreground/40">PARTICIPANTS</span>{" "}
                    {c._count?.participants ?? 0}
                  </p>
                </div>
                <NavTransition
                  href={`/contest/${c.id}`}
                  className="block w-full text-center px-4 py-2.5 bg-foreground text-background text-xs font-mono font-semibold hover:bg-foreground/90 transition-colors border border-foreground"
                >
                  VIEW CONTEST →
                </NavTransition>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

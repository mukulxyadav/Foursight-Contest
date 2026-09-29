"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "cookies-next";
import { sileo } from "sileo";
import { useRouter } from "next/navigation";
import { NavTransition } from "@/app/components/navbar/NavTransition";
import Loading from "@/app/components/Loading";
import LeaderboardTable from "../../../../contest/components/LeaderboardTable";

export default function ResultsAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [contest, setContest] = useState<any>(null);
  const [frozen, setFrozen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminToken = getCookie("adminToken");
    if (!adminToken) { router.push("/admin"); return; }
    params.then((p) => setId(p.id));
  }, [router, params]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      axios.get(`/api/contest/${id}/leaderboard`),
      axios.get(`/api/admin/contest/${id}`, { withCredentials: true }),
    ]).then(([lbRes, contestRes]) => {
      setLeaderboard(lbRes.data.leaderboard ?? []);
      setFrozen(lbRes.data.frozen ?? false);
      setContest(contestRes.data.contest);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  async function toggleFreeze() {
    try {
      const newFrozen = !frozen;
      await axios.put(`/api/admin/contest/${id}`, { leaderboardFrozen: newFrozen }, { withCredentials: true });
      setFrozen(newFrozen);
      sileo.success({ title: newFrozen ? "Leaderboard frozen" : "Leaderboard unfrozen" });
    } catch {
      sileo.error({ title: "Failed to update" });
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
      <div className="max-w-7xl mx-auto">
        <div className="mt-6 mb-6">
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
            <NavTransition href={`/admin/contest/${id}`} className="hover:text-foreground">ADMIN / CONTEST</NavTransition>
            {" / RESULTS"}
          </span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold font-mono tracking-tight">RESULTS & RANKINGS</h1>
          <div className="flex gap-2">
            <button onClick={toggleFreeze} className={`px-4 py-2 border text-xs font-mono transition-colors ${
              frozen ? "border-foreground text-foreground bg-foreground/5 hover:bg-muted" : "border-border hover:bg-muted"
            }`}>
              {frozen ? "🔒 UNFREEZE LEADERBOARD" : "FREEZE LEADERBOARD"}
            </button>
            <a href={`/api/admin/contest/${id}/export?type=results`} className="px-4 py-2 border border-positive text-positive text-xs font-mono hover:bg-positive hover:text-white transition-colors">
              EXPORT RESULTS CSV
            </a>
          </div>
        </div>

        {frozen && (
          <div className="mb-4 border border-foreground/20 bg-foreground/5 px-4 py-2 text-xs font-mono text-foreground/60">
            🔒 Leaderboard is frozen — participants see the frozen state. Live prices are not reflected.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loading /></div>
        ) : (
          <LeaderboardTable data={leaderboard} />
        )}
      </div>
    </div>
  );
}

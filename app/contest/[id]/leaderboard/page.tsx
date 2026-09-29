"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { NavTransition } from "@/app/components/navbar/NavTransition";
import Loading from "@/app/components/Loading";
import LeaderboardTable from "../../components/LeaderboardTable";
import ContestStatusBadge from "../../components/ContestStatusBadge";
import { getCookie } from "cookies-next";

export default function LeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [data, setData] = useState<any>(null);
  const [contestName, setContestName] = useState("");
  const [contestStatus, setContestStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const token = getCookie("token");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  // Get participant's own ID for highlighting
  const [myParticipantId, setMyParticipantId] = useState("");
  useEffect(() => {
    if (!id || !token) return;
    axios.get(`/api/contest/${id}/portfolio`, { withCredentials: true })
      .then((res) => setMyParticipantId(res.data.participantId ?? ""))
      .catch(() => {});
  }, [id, token]);

  const fetchLeaderboard = useCallback(async () => {
    if (!id) return;
    try {
      const res = await axios.get(`/api/contest/${id}/leaderboard`);
      setData(res.data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/contest/${id}`)
      .then((res) => {
        setContestName(res.data.contest?.name ?? "");
        setContestStatus(res.data.contest?.status ?? "");
      })
      .catch(() => {});
  }, [id]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
      <div className="max-w-7xl mx-auto">
        <div className="mt-6 mb-6">
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
            <NavTransition href="/contest" className="hover:text-foreground">CONTESTS</NavTransition>
            {" / "}
            <NavTransition href={`/contest/${id}`} className="hover:text-foreground">{contestName || id}</NavTransition>
            {" / LEADERBOARD"}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-mono tracking-tight">LEADERBOARD</h1>
            <p className="text-sm text-foreground/60 mt-1">{contestName}</p>
          </div>
          <div className="flex items-center gap-3">
            {contestStatus && <ContestStatusBadge status={contestStatus} />}
            {data?.frozen && (
              <span className="text-xs font-mono font-semibold text-foreground/60 border border-border px-2 py-1">
                🔒 FROZEN
              </span>
            )}
            {lastUpdated && (
              <span className="text-xs font-mono text-foreground/40">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loading />
          </div>
        ) : (
          <LeaderboardTable
            data={data?.leaderboard ?? []}
            highlightId={myParticipantId}
          />
        )}

        <p className="text-xs font-mono text-foreground/40 mt-4 text-center">
          Leaderboard refreshes every 30 seconds. Only participant IDs are shown — no personal information.
        </p>
      </div>
    </div>
  );
}

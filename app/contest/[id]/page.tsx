"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "cookies-next";
import { NavTransition } from "@/app/components/navbar/NavTransition";
import Loading from "@/app/components/Loading";
import ContestStatusBadge from "../components/ContestStatusBadge";
import ContestCountdown from "../components/ContestCountdown";

export default function ContestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [contest, setContest] = useState<any>(null);
  const [myParticipant, setMyParticipant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = getCookie("token");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res = await axios.get(`/api/contest/${id}`);
        setContest(res.data.contest);
        setMyParticipant(res.data.myParticipant);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
        <div className="max-w-7xl mx-auto mt-8">
          <div className="h-4 w-32 bg-foreground/10 mb-4" />
          <div className="h-8 w-64 bg-foreground/10 mb-6" />
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-border bg-card p-6 h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
        <div className="max-w-7xl mx-auto mt-8 text-center">
          <p className="text-foreground/60 font-mono">Contest not found.</p>
        </div>
      </div>
    );
  }

  const isLive = contest.status === "LIVE";
  const isRegistrationOpen = contest.status === "REGISTRATION_OPEN";
  const canRegister = isRegistrationOpen && token && !myParticipant;
  const isDashboardReady = myParticipant?.status === "APPROVED" && myParticipant?.capitalAllocated;

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mt-6 mb-6">
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
            <NavTransition href="/contest" className="hover:text-foreground transition-colors">
              CONTESTS
            </NavTransition>
            {" / "}{contest.name}
          </span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <div className="mb-2">
              <ContestStatusBadge status={contest.status} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-mono text-foreground">
              {contest.name}
            </h1>
            {contest.description && (
              <p className="text-foreground/60 mt-2 max-w-2xl">{contest.description}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            {isDashboardReady && (
              <NavTransition
                href={`/contest/${id}/dashboard`}
                className="px-6 py-3 bg-positive text-white text-sm font-mono font-semibold border border-positive hover:bg-positive/90 transition-colors text-center"
              >
                GO TO DASHBOARD →
              </NavTransition>
            )}
            {canRegister && (
              <NavTransition
                href={`/contest/${id}/register`}
                className="px-6 py-3 bg-foreground text-background text-sm font-mono font-semibold border border-foreground hover:bg-foreground/90 transition-colors text-center"
              >
                REGISTER NOW →
              </NavTransition>
            )}
            {!token && isRegistrationOpen && (
              <NavTransition
                href="/login"
                className="px-6 py-3 bg-foreground text-background text-sm font-mono font-semibold border border-foreground hover:bg-foreground/90 transition-colors text-center"
              >
                LOGIN TO REGISTER →
              </NavTransition>
            )}
            {myParticipant && myParticipant.status === "PENDING" && (
              <div className="px-4 py-2 border border-border bg-muted text-xs font-mono text-foreground/60 text-center">
                ⏳ Registration pending approval · {myParticipant.participantId}
              </div>
            )}
          </div>
        </div>

        {/* Countdown */}
        {isLive && (
          <div className="mb-6 border border-positive/30 bg-positive/5 px-4 py-3 flex items-center gap-3">
            <span className="text-xs font-mono text-positive font-semibold tracking-wider">🟢 TRADING LIVE</span>
            <ContestCountdown targetDate={contest.contestEnd} label="Ends in" />
          </div>
        )}
        {contest.status === "UPCOMING" && (
          <div className="mb-6 border border-border bg-muted px-4 py-3">
            <ContestCountdown targetDate={contest.contestStart} label="Starts in" />
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <InfoCard label="STARTING CAPITAL" value={`₹${(contest.startingCapital).toLocaleString("en-IN")}`} />
          <InfoCard label="TRANSACTION FEE" value={`${(contest.transactionFee * 100).toFixed(2)}%`} />
          <InfoCard label="PARTICIPANTS" value={String(contest._count?.participants ?? 0)} />
          <InfoCard label="MAX TRADES" value={String(contest.maxTrades)} />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="border border-border bg-card p-5">
            <p className="text-xs font-mono text-muted-foreground tracking-wider mb-3">REGISTRATION</p>
            <p className="text-sm font-mono text-foreground">
              {new Date(contest.registrationStart).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              {" → "}
              {new Date(contest.registrationEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="border border-border bg-card p-5">
            <p className="text-xs font-mono text-muted-foreground tracking-wider mb-3">CONTEST PERIOD</p>
            <p className="text-sm font-mono text-foreground">
              {new Date(contest.contestStart).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              {" → "}
              {new Date(contest.contestEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Announcements */}
        {contest.announcements?.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-mono text-muted-foreground tracking-wider mb-3">ANNOUNCEMENTS</p>
            <div className="space-y-2">
              {contest.announcements.map((a: any) => (
                <div
                  key={a.id}
                  className={`border px-4 py-3 ${
                    a.priority === "IMPORTANT"
                      ? "border-negative/30 bg-negative/5"
                      : a.priority === "WARNING"
                      ? "border-yellow-500/30 bg-yellow-500/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-mono font-semibold tracking-wider ${
                      a.priority === "IMPORTANT" ? "text-negative" : a.priority === "WARNING" ? "text-yellow-500" : "text-foreground/60"
                    }`}>
                      {a.priority}
                    </span>
                    <span className="text-xs text-foreground/40 font-mono">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-semibold text-foreground text-sm">{a.title}</p>
                  <p className="text-foreground/70 text-sm mt-0.5">{a.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="flex gap-3 flex-wrap">
          <NavTransition href={`/contest/${id}/rules`} className="px-4 py-2 border border-border bg-card text-xs font-mono hover:bg-muted transition-colors">
            RULES & GUIDELINES
          </NavTransition>
          <NavTransition href={`/contest/${id}/leaderboard`} className="px-4 py-2 border border-border bg-card text-xs font-mono hover:bg-muted transition-colors">
            LEADERBOARD
          </NavTransition>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card px-4 py-4">
      <p className="text-xs font-mono text-muted-foreground tracking-wider mb-2">{label}</p>
      <p className="text-xl font-bold font-mono text-foreground">{value}</p>
    </div>
  );
}

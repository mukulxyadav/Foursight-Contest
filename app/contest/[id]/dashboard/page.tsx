"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "cookies-next";
import { sileo } from "sileo";
import { NavTransition } from "@/app/components/navbar/NavTransition";
import Loading from "@/app/components/Loading";
import ContestStatusBadge from "../../components/ContestStatusBadge";
import ContestCountdown from "../../components/ContestCountdown";

export default function ContestDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [portfolio, setPortfolio] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = getCookie("token");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const [portfolioRes, announcementsRes] = await Promise.all([
          axios.get(`/api/contest/${id}/portfolio`, { withCredentials: true }),
          axios.get(`/api/contest/${id}/announcements`),
        ]);
        setPortfolio(portfolioRes.data);
        setAnnouncements(announcementsRes.data.announcements ?? []);
      } catch (e: any) {
        if (e?.response?.status === 401) {
          sileo.error({ title: "Please log in to access the dashboard" });
        } else if (e?.response?.status === 404) {
          sileo.error({ title: "You are not registered for this contest" });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [id]);

  const joinContest = async () => {
    try {
      await axios.post(`/api/contest/${id}/join`, {}, { withCredentials: true });
      sileo.success({ title: "Joined! Your virtual capital has been allocated." });
      window.location.reload();
    } catch (err: any) {
      sileo.error({ title: err?.response?.data?.error ?? "Failed to join" });
    }
  };

  if (!token) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16 flex items-center justify-center">
        <div className="max-w-md text-center border border-border bg-card p-8 mt-12">
          <h2 className="text-xl font-bold font-mono mb-3">Login Required</h2>
          <p className="text-foreground/60 mb-6 text-sm">Please sign in to access the contest dashboard.</p>
          <NavTransition href="/login" className="block px-6 py-3 bg-foreground text-background text-sm font-mono border border-foreground hover:bg-foreground/90 transition-colors">
            LOGIN →
          </NavTransition>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
        <div className="max-w-7xl mx-auto mt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => <div key={i} className="border border-border bg-card p-6 h-24" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
        <div className="max-w-7xl mx-auto mt-8 border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-bold font-mono mb-3">Not Registered</h2>
          <p className="text-foreground/60 mb-6">You are not registered for this contest.</p>
          <NavTransition href={`/contest/${id}/register`} className="inline-block px-6 py-3 bg-foreground text-background text-sm font-mono border border-foreground hover:bg-foreground/90 transition-colors">
            REGISTER →
          </NavTransition>
        </div>
      </div>
    );
  }

  if (portfolio.status !== "APPROVED") {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
        <div className="max-w-7xl mx-auto mt-8 border border-border bg-card p-8 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-xl font-bold font-mono mb-2">Awaiting Approval</h2>
          <p className="text-foreground/60 mb-2">Your registration ({portfolio.participantId}) is pending admin approval.</p>
          <p className="text-sm text-foreground/40 font-mono">You will be notified once approved.</p>
        </div>
      </div>
    );
  }

  if (!portfolio.capitalAllocated) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
        <div className="max-w-7xl mx-auto mt-8 border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-bold font-mono mb-3">Ready to Join!</h2>
          <p className="text-foreground/60 mb-6">Your registration is approved. Click below to receive your virtual capital and start trading.</p>
          <button
            onClick={joinContest}
            className="px-8 py-4 bg-positive text-white text-sm font-mono font-semibold border border-positive hover:bg-positive/90 transition-colors"
          >
            JOIN CONTEST & START TRADING →
          </button>
        </div>
      </div>
    );
  }

  const isProfitPositive = portfolio.pnl >= 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mt-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase block mb-1">
              <NavTransition href={`/contest/${id}`} className="hover:text-foreground">{portfolio.contestName}</NavTransition>
              {" / DASHBOARD"}
            </span>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">{portfolio.participantId}</h1>
              <ContestStatusBadge status={portfolio.contestStatus} />
            </div>
            <p className="text-sm text-foreground/60 mt-0.5">{portfolio.fullName} · {portfolio.teamName}</p>
          </div>
          {portfolio.contestStatus === "LIVE" && (
            <div className="flex items-center gap-2 text-xs font-mono text-positive">
              <span className="w-2 h-2 bg-positive rounded-full animate-pulse" />
              TRADING LIVE
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="PORTFOLIO VALUE" value={`₹${portfolio.portfolioValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} />
          <StatCard label="AVAILABLE CASH" value={`₹${portfolio.cashBalance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} />
          <StatCard
            label="P&L"
            value={`${isProfitPositive ? "+" : ""}₹${Math.abs(portfolio.pnl).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            positive={isProfitPositive}
          />
          <StatCard
            label="ROI"
            value={`${isProfitPositive ? "+" : ""}${portfolio.roi.toFixed(2)}%`}
            positive={isProfitPositive}
          />
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="RANK" value={`#${portfolio.rank} / ${portfolio.totalParticipants}`} />
          <StatCard label="TRADES" value={String(portfolio.tradeCount)} />
          <StatCard label="HOLDINGS" value={`₹${portfolio.holdingsValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} />
          <StatCard label="STARTING CAPITAL" value={`₹${portfolio.startingCapital.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} />
        </div>

        {/* Quick Nav */}
        <div className="flex gap-2 flex-wrap mb-8">
          <NavTransition href={`/contest/${id}/dashboard/trade`} className="px-4 py-2 bg-foreground text-background text-xs font-mono font-semibold border border-foreground hover:bg-foreground/90 transition-colors">
            TRADE
          </NavTransition>
          <NavTransition href={`/contest/${id}/dashboard/holdings`} className="px-4 py-2 border border-border bg-card text-xs font-mono hover:bg-muted transition-colors">
            HOLDINGS
          </NavTransition>
          <NavTransition href={`/contest/${id}/dashboard/orders`} className="px-4 py-2 border border-border bg-card text-xs font-mono hover:bg-muted transition-colors">
            ORDERS
          </NavTransition>
          <NavTransition href={`/contest/${id}/leaderboard`} className="px-4 py-2 border border-border bg-card text-xs font-mono hover:bg-muted transition-colors">
            LEADERBOARD
          </NavTransition>
          <NavTransition href={`/contest/${id}/rules`} className="px-4 py-2 border border-border bg-card text-xs font-mono hover:bg-muted transition-colors">
            RULES
          </NavTransition>
        </div>

        {/* Announcements */}
        {announcements.length > 0 && (
          <div>
            <p className="text-xs font-mono text-muted-foreground tracking-wider mb-3">ANNOUNCEMENTS</p>
            <div className="space-y-2">
              {announcements.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className={`border px-4 py-3 ${
                    a.priority === "IMPORTANT" ? "border-negative/30 bg-negative/5"
                      : a.priority === "WARNING" ? "border-yellow-500/30 bg-yellow-500/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-mono font-semibold tracking-wider ${
                      a.priority === "IMPORTANT" ? "text-negative"
                      : a.priority === "WARNING" ? "text-yellow-500"
                      : "text-foreground/60"
                    }`}>{a.priority}</span>
                    <span className="text-xs text-foreground/40 font-mono">{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="font-semibold text-foreground text-sm">{a.title}</p>
                  <p className="text-foreground/70 text-sm mt-0.5">{a.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="border border-border bg-card px-4 py-4">
      <p className="text-xs font-mono text-muted-foreground tracking-wider mb-2">{label}</p>
      <p className={`text-xl font-bold font-mono ${
        positive === undefined ? "text-foreground"
          : positive ? "text-positive"
          : "text-negative"
      }`}>
        {value}
      </p>
    </div>
  );
}

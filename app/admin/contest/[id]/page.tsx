"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "cookies-next";
import { sileo } from "sileo";
import { useRouter } from "next/navigation";
import { NavTransition } from "@/app/components/navbar/NavTransition";
import Loading from "@/app/components/Loading";

const STATUS_OPTIONS = [
  "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "UPCOMING", "LIVE", "PAUSED", "ENDED", "CANCELLED",
];

const STATUS_BUTTONS = [
  { label: "SET LIVE", status: "LIVE", className: "border-positive text-positive hover:bg-positive hover:text-white" },
  { label: "PAUSE", status: "PAUSED", className: "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white" },
  { label: "RESUME", status: "LIVE", className: "border-positive text-positive hover:bg-positive hover:text-white" },
  { label: "END", status: "ENDED", className: "border-foreground/40 text-foreground/60 hover:bg-muted" },
  { label: "CANCEL", status: "CANCELLED", className: "border-negative text-negative hover:bg-negative hover:text-white" },
  { label: "OPEN REG.", status: "REGISTRATION_OPEN", className: "border-brand text-brand hover:bg-brand hover:text-white" },
  { label: "CLOSE REG.", status: "REGISTRATION_CLOSED", className: "border-foreground/40 text-foreground/60 hover:bg-muted" },
];

export default function AdminContestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [contest, setContest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminToken = getCookie("adminToken");
    if (!adminToken) { router.push("/admin"); return; }
    params.then((p) => setId(p.id));
  }, [router, params]);

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/admin/contest/${id}`, { withCredentials: true })
      .then((res) => setContest(res.data.contest))
      .catch(() => router.push("/admin/dashboard"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function setStatus(status: string) {
    try {
      const res = await axios.put(`/api/admin/contest/${id}`, { status }, { withCredentials: true });
      setContest(res.data.contest);
      sileo.success({ title: `Contest status set to ${status}` });
    } catch (err: any) {
      sileo.error({ title: err?.response?.data?.error ?? "Failed to update status" });
    }
  }

  if (loading) {
    return <div className="flex justify-center py-24"><Loading /></div>;
  }

  if (!contest) return null;

  const fmtDate = (d: string) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
      <div className="max-w-7xl mx-auto">
        <div className="mt-6 mb-6">
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
            <NavTransition href="/admin/dashboard" className="hover:text-foreground">ADMIN</NavTransition>
            {" / "}{contest.name}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold font-mono tracking-tight">{contest.name}</h1>
            <p className="text-xs font-mono text-foreground/50 mt-1">{contest.slug}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-3 py-1.5 border border-border bg-muted text-foreground">
              STATUS: {contest.status}
            </span>
          </div>
        </div>

        {/* Status Controls */}
        <div className="border border-border bg-card p-5 mb-6">
          <p className="text-xs font-mono text-muted-foreground tracking-wider mb-3">CHANGE STATUS</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_BUTTONS.map((btn) => (
              <button
                key={btn.label}
                onClick={() => setStatus(btn.status)}
                disabled={contest.status === btn.status}
                className={`px-4 py-2 text-xs font-mono font-semibold border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${btn.className}`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <AdminNavCard href={`/admin/contest/${id}/participants`} label="PARTICIPANTS" count={contest._count?.participants} />
          <AdminNavCard href={`/admin/contest/${id}/orders`} label="ORDERS" />
          <AdminNavCard href={`/admin/contest/${id}/announcements`} label="ANNOUNCEMENTS" count={contest._count?.announcements} />
          <AdminNavCard href={`/admin/contest/${id}/results`} label="RESULTS" />
        </div>

        {/* Contest Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-border bg-card">
            <div className="border-b border-border px-5 py-3 bg-muted">
              <p className="text-xs font-mono font-semibold text-foreground/60 tracking-wider">DATES</p>
            </div>
            <div className="divide-y divide-border">
              <InfoRow label="Registration Opens" value={fmtDate(contest.registrationStart)} />
              <InfoRow label="Registration Closes" value={fmtDate(contest.registrationEnd)} />
              <InfoRow label="Contest Starts" value={fmtDate(contest.contestStart)} />
              <InfoRow label="Contest Ends" value={fmtDate(contest.contestEnd)} />
            </div>
          </div>
          <div className="border border-border bg-card">
            <div className="border-b border-border px-5 py-3 bg-muted">
              <p className="text-xs font-mono font-semibold text-foreground/60 tracking-wider">CONFIGURATION</p>
            </div>
            <div className="divide-y divide-border">
              <InfoRow label="Starting Capital" value={`₹${contest.startingCapital.toLocaleString("en-IN")}`} />
              <InfoRow label="Transaction Fee" value={`${(contest.transactionFee * 100).toFixed(3)}%`} />
              <InfoRow label="Max Order Qty" value={String(contest.maxOrderQty)} />
              <InfoRow label="Max Trades" value={String(contest.maxTrades)} />
              <InfoRow label="Short Selling" value={contest.allowShortSelling ? "Allowed" : "Not Allowed"} />
              <InfoRow label="Market Hours" value={contest.enforceMarketHours ? "Enforced" : "Not Enforced"} />
              <InfoRow label="Leaderboard" value={contest.leaderboardVisible ? (contest.leaderboardFrozen ? "Visible (Frozen)" : "Visible") : "Hidden"} />
            </div>
          </div>
        </div>

        {/* Export */}
        <div className="mt-6 flex gap-2">
          <a
            href={`/api/admin/contest/${id}/export?type=participants`}
            className="px-4 py-2 border border-border text-xs font-mono hover:bg-muted transition-colors"
          >
            EXPORT PARTICIPANTS CSV
          </a>
          <a
            href={`/api/admin/contest/${id}/export?type=results`}
            className="px-4 py-2 border border-border text-xs font-mono hover:bg-muted transition-colors"
          >
            EXPORT RESULTS CSV
          </a>
        </div>
      </div>
    </div>
  );
}

function AdminNavCard({ href, label, count }: { href: string; label: string; count?: number }) {
  return (
    <NavTransition href={href} className="border border-border bg-card p-5 hover:bg-muted transition-colors block">
      <p className="text-xs font-mono text-muted-foreground tracking-wider mb-2">{label}</p>
      {count !== undefined && <p className="text-2xl font-bold font-mono text-foreground">{count}</p>}
      <p className="text-xs font-mono text-foreground/50 mt-1">→ MANAGE</p>
    </NavTransition>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-5 py-2.5">
      <span className="text-xs font-mono text-foreground/60">{label}</span>
      <span className="text-xs font-mono text-foreground font-semibold">{value}</span>
    </div>
  );
}

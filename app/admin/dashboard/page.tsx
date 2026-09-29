"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { NavTransition } from "@/app/components/navbar/NavTransition";
import Loading from "@/app/components/Loading";

const STATUS_COLORS: Record<string, string> = {
  REGISTRATION_OPEN: "text-positive",
  LIVE: "text-positive",
  UPCOMING: "text-brand",
  PAUSED: "text-yellow-500",
  ENDED: "text-foreground/50",
  REGISTRATION_CLOSED: "text-foreground/60",
  CANCELLED: "text-negative",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [contests, setContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminToken = getCookie("adminToken");
    if (!adminToken) { router.push("/admin"); return; }
    axios.get("/api/admin/contest", { withCredentials: true })
      .then((res) => setContests(res.data.contests ?? []))
      .catch(() => router.push("/admin"))
      .finally(() => setLoading(false));
  }, [router]);

  const totalParticipants = contests.reduce((sum, c) => sum + (c._count?.participants ?? 0), 0);

  async function handleLogout() {
    await axios.delete("/api/admin/auth", { withCredentials: true });
    router.push("/admin");
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
      <div className="max-w-7xl mx-auto">
        <div className="mt-6 mb-8 flex items-start justify-between">
          <div>
            <span className="text-xs font-mono text-muted-foreground tracking-wider">ADMIN PANEL</span>
            <h1 className="text-3xl font-bold font-mono tracking-tight mt-1">DASHBOARD</h1>
          </div>
          <div className="flex gap-2">
            <NavTransition href="/admin/contest/new" className="px-4 py-2.5 bg-foreground text-background text-xs font-mono font-semibold border border-foreground hover:bg-foreground/90 transition-colors">
              + NEW CONTEST
            </NavTransition>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 border border-border text-xs font-mono text-negative hover:bg-muted transition-colors"
            >
              LOGOUT
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard label="TOTAL CONTESTS" value={String(contests.length)} />
          <SummaryCard label="TOTAL PARTICIPANTS" value={String(totalParticipants)} />
          <SummaryCard label="LIVE CONTESTS" value={String(contests.filter((c) => c.status === "LIVE").length)} />
          <SummaryCard label="OPEN REGISTRATIONS" value={String(contests.filter((c) => c.status === "REGISTRATION_OPEN").length)} />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loading /></div>
        ) : contests.length === 0 ? (
          <div className="border border-border bg-card py-12 text-center">
            <p className="text-sm font-mono text-foreground/60">No contests yet.</p>
            <NavTransition href="/admin/contest/new" className="inline-block mt-4 px-6 py-2.5 bg-foreground text-background text-xs font-mono border border-foreground hover:bg-foreground/90 transition-colors">
              CREATE FIRST CONTEST →
            </NavTransition>
          </div>
        ) : (
          <div>
            <p className="text-xs font-mono text-muted-foreground tracking-wider mb-3">ALL CONTESTS</p>
            <div className="border border-border bg-card">
              <div className="border-b border-border px-4 py-3 bg-muted">
                <div className="grid grid-cols-5 gap-4 text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider">
                  <div className="col-span-2">Contest</div>
                  <div className="text-center">Status</div>
                  <div className="text-right">Participants</div>
                  <div className="text-right">Actions</div>
                </div>
              </div>
              <div className="divide-y divide-border">
                {contests.map((c) => (
                  <div key={c.id} className="px-4 py-3 hover:bg-muted transition-colors">
                    <div className="grid grid-cols-5 gap-4 items-center">
                      <div className="col-span-2">
                        <p className="font-semibold text-sm font-mono text-foreground">{c.name}</p>
                        <p className="text-xs text-foreground/50 font-mono">
                          {new Date(c.contestStart).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {" → "}
                          {new Date(c.contestEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="text-center">
                        <span className={`text-xs font-mono font-semibold ${STATUS_COLORS[c.status] ?? "text-foreground/60"}`}>
                          {c.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-right text-sm font-mono text-foreground">
                        {c._count?.participants ?? 0}
                      </div>
                      <div className="text-right flex gap-2 justify-end">
                        <NavTransition href={`/admin/contest/${c.id}`} className="px-3 py-1.5 border border-border text-xs font-mono hover:bg-muted transition-colors">
                          MANAGE
                        </NavTransition>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card px-4 py-4">
      <p className="text-xs font-mono text-muted-foreground tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
    </div>
  );
}

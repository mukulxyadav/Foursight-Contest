"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "cookies-next";
import { sileo } from "sileo";
import { useRouter } from "next/navigation";
import { NavTransition } from "@/app/components/navbar/NavTransition";
import Loading from "@/app/components/Loading";

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

export default function ParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const adminToken = getCookie("adminToken");
    if (!adminToken) { router.push("/admin"); return; }
    params.then((p) => setId(p.id));
  }, [router, params]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (search) params.set("search", search);
    axios.get(`/api/admin/contest/${id}/participants?${params}`, { withCredentials: true })
      .then((res) => setParticipants(res.data.participants ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, statusFilter, search]);

  async function doAction(participantDbId: string, action: string) {
    setActionLoading(participantDbId + action);
    try {
      await axios.post(`/api/admin/contest/${id}/participants`, { participantDbId, action }, { withCredentials: true });
      sileo.success({ title: `${action} successful` });
      // Refresh
      const res = await axios.get(`/api/admin/contest/${id}/participants`, { withCredentials: true });
      setParticipants(res.data.participants ?? []);
    } catch (err: any) {
      sileo.error({ title: err?.response?.data?.error ?? `${action} failed` });
    } finally {
      setActionLoading(null);
    }
  }

  const statusColor: Record<string, string> = {
    PENDING: "text-yellow-500",
    APPROVED: "text-positive",
    REJECTED: "text-negative",
    SUSPENDED: "text-foreground/50",
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 mb-16">
      <div className="max-w-7xl mx-auto">
        <div className="mt-6 mb-6">
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
            <NavTransition href={`/admin/contest/${id}`} className="hover:text-foreground">ADMIN / CONTEST</NavTransition>
            {" / PARTICIPANTS"}
          </span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold font-mono tracking-tight">PARTICIPANTS</h1>
          <div className="flex gap-2">
            <a href={`/api/admin/contest/${id}/export?type=participants`} className="px-4 py-2 border border-border text-xs font-mono hover:bg-muted transition-colors">
              EXPORT CSV
            </a>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, email, college..."
            className="flex-1 px-4 py-2.5 border border-border bg-card text-sm font-mono text-foreground focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground"
          />
          <div className="flex gap-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-2 text-xs font-mono border transition-colors ${
                  statusFilter === f ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loading /></div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="border border-border bg-card min-w-[1100px]">
              <div className="border-b border-border px-4 py-3 bg-muted">
                <div className="grid grid-cols-9 gap-2 text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider">
                  <div>ID</div>
                  <div className="col-span-2">Name / Email</div>
                  <div>Reg No.</div>
                  <div>College</div>
                  <div>Dept / Year</div>
                  <div className="text-center">Trades</div>
                  <div className="text-center">Status</div>
                  <div className="text-right">Actions</div>
                </div>
              </div>
              <div className="divide-y divide-border">
                {participants.length === 0 ? (
                  <div className="text-center py-8 text-sm font-mono text-foreground/60">No participants found</div>
                ) : participants.map((p) => (
                  <div key={p.id} className="px-4 py-3 hover:bg-muted transition-colors">
                    <div className="grid grid-cols-9 gap-2 items-center text-xs font-mono">
                      <div className="font-semibold text-foreground">{p.participantId}</div>
                      <div className="col-span-2">
                        <div className="font-semibold text-foreground">{p.fullName}</div>
                        <div className="text-foreground/50">{p.uniEmail}</div>
                      </div>
                      <div className="text-foreground/70">{p.regNumber}</div>
                      <div className="text-foreground/70 truncate">{p.college}</div>
                      <div className="text-foreground/70">{p.department}<br />{p.yearOfStudy}</div>
                      <div className="text-center text-foreground">{p._count?.orders ?? 0}</div>
                      <div className={`text-center font-semibold ${statusColor[p.status] ?? "text-foreground/60"}`}>
                        {p.status}
                      </div>
                      <div className="text-right flex gap-1 justify-end flex-wrap">
                        {p.status === "PENDING" && (
                          <>
                            <ActionBtn label="APPROVE" onClick={() => doAction(p.id, "APPROVE")} positive loading={actionLoading === p.id + "APPROVE"} />
                            <ActionBtn label="REJECT" onClick={() => doAction(p.id, "REJECT")} negative loading={actionLoading === p.id + "REJECT"} />
                          </>
                        )}
                        {p.status === "APPROVED" && (
                          <ActionBtn label="SUSPEND" onClick={() => doAction(p.id, "SUSPEND")} loading={actionLoading === p.id + "SUSPEND"} />
                        )}
                        {p.status === "SUSPENDED" && (
                          <ActionBtn label="APPROVE" onClick={() => doAction(p.id, "APPROVE")} positive loading={actionLoading === p.id + "APPROVE"} />
                        )}
                        <ActionBtn label="RESET" onClick={() => doAction(p.id, "RESET")} loading={actionLoading === p.id + "RESET"} />
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

function ActionBtn({ label, onClick, positive, negative, loading: l }: { label: string; onClick: () => void; positive?: boolean; negative?: boolean; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={l}
      className={`px-2 py-1 text-xs font-mono border transition-colors disabled:opacity-40 ${
        positive ? "border-positive text-positive hover:bg-positive hover:text-white"
          : negative ? "border-negative text-negative hover:bg-negative hover:text-white"
          : "border-border hover:bg-muted"
      }`}
    >
      {l ? "..." : label}
    </button>
  );
}
